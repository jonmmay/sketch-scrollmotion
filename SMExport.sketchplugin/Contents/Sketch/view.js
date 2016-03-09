@import "util.js";

// Documentation for readability; not tested to produce a valid output

// TODO: Merge ViewBindingController into View to reduce namespace pollution
// Note, rotation will have an effect on Absolute Rect values

var ViewBindingController = ( function( options ) {
    // reduceIntermediateLayers will remove all intermediate LayerGroups without modifiers
    options = (typeof options !== "undefined" ) ? options : {
        reduceIntermediateLayers: true
    };

    /*
        * @desc 
        * @param {Array} views - 
        * @returns array
    */
    function getEligibleSubviews( views ) {
        if( !options.reduceIntermediateLayers ) {
            return views;
        }
        var eligibleViews = [];

        util.forEach( views , function( subview ) {
            var bindings,
                subsubviews,
                isEligible = true;

            if( subview.shouldBeIgnored() ) {
                // Do not add if subview should be ignored
                return;
            } else if( subview.isArtboard() ) {
                // Always add artboards; Do nothing
            } else if( subview.isFolder() && subview.hasSubviews ) {
                bindings = subview.getNameAttributes();

                // Eligible if bindings exist or layer should be flattened
                isEligible = ( util.values( bindings ).length ) ? true : 
                             ( subview.shouldBeFlattened() ) ? true : subview.hasClippingMask;
                
                if( !isEligible ) {
                    // Look for next eligible subviews
                    isEligible = false;
                    util.debug.debug( "<" + subview.name + "> isn't an eligible layer" );
                    subsubviews = getEligibleSubviews( subview.subviews() );

                    eligibleViews = eligibleViews.concat( subsubviews );
                }
            }

            if( isEligible ) {
                eligibleViews.push( subview );
            }
        } );
        return eligibleViews;
    }

    /*
        * Class
        * @constructor
    */
    function Registry() {
        this.bindingGenerators = {};
        this.layerKindGenerators = {};
    }

    /*
        * @desc
        * @param {Object} obj - Binding object
        * @returns
    */
    Registry.prototype.generateObjectByLayerKind = function( obj ) {
        if( obj instanceof Binding && obj.getView().getLayerKind ) {
            var kind = obj.getView().getLayerKind(),
                generatorKind = this.layerKindGenerators[ kind ] ? kind : "default",
                generator = this.layerKindGenerators[ generatorKind ];

            if( typeof generator === "undefined" ) {
                util.debug.debug( "Registry generateObjectByLayerKind missing registration" )
            }
            generator.object( obj );
            
            return generator;
        } else {
            throw "Registry generateObjectByLayerKind parameter isn't a Binding object"; 
        }
    };

    /*
        * @desc
        * @param {String} name -
        * @param {function(obj: Object): void} handler -
        * @returns void
    */
    Registry.prototype.layerKindRegistry = function( name, handler ) {
        if( typeof name === "string" ) {
            this.layerKindGenerators[ name ] = ( typeof handler === "object" ) ? handler : { object: handler };    
        } else {
            throw "Registry layerKindRegistry name parameter isn't a string";
        }       
    };

    /*
        * @desc
        * @param {String} name -
        * @param {(Object|function(obj: Object): void)=} handler -
        * @param {function(obj: Object): void=} handler.compose -
        * @returns void
    */
    Registry.prototype.bindingRegistry = function( name, handler ) {
        if( typeof name === "string" ) {
            if( this.bindingGenerators[ name ] ) {
                util.debug.warn( "Overwriting binding: " + name );
            }

            if( typeof handler === "function" ) {
                handler = { compose: handler };
            } else if( typeof handler === "object" ) {
                if( !handler.compose ) { handler.compose = util.noop; }
            } else {
                util.debug.warn( "Unacceptable handler: " + name );
                handler = { compose: util.noop };
                return;
            }

            this.bindingGenerators[ name ] = handler;
        } else {
            throw "Registry bindingRegistry name parameter isn't a string";
        }
    };

    /*
        * @desc
        * @param {Object} view -
        * @param {Object} parentObj -
        * @returns
    */
    Registry.prototype.applyBindings = function( view, parentBindingObj ) {
        var boundObjects = [],
            childrenBoundObjects,
            bindingObj = new Binding( view, parentBindingObj ),
            bindings = view.getNameAttributes(),
            registryContext = this,
            stopAutoApplyBindingForChildren = false,
            generator,
            views;

        if( !view.isLayer() ) {
            util.debug.error( "First argument must be a valid layer" );
            return;
        }
        if( view.shouldBeIgnored() ) {
            util.debug.debug( "Layer should be ignored, <" + view.name + ">" );
            return;
        }

        // Initialize object by Sketch layer type
        generator = this.generateObjectByLayerKind( bindingObj );

        if( generator.stopAutoApplyBindingForChildren ) {
            util.debug.debug( view.name + " has stopAutoApplyBindingForChildren" );
            stopAutoApplyBindingForChildren = true;
        }

        // Initialize object bindings
        // Compose object with binding arguments
        util.forEach( bindings, function( bindingArgs, bindingName ) {
            var binding = registryContext.bindingGenerators[ bindingName ];

            if( !binding ) {
                if( bindingName ) { util.debug.debug( "Unknown binding: " + bindingName ); }
                return;
            }

            if( binding.stopAutoApplyBindingForChildren ) {
                util.debug.debug( bindingName + " has stopAutoApplyBindingForChildren" );
                stopAutoApplyBindingForChildren = true;
            }

            // Compose object based on named attributes
            binding.compose( bindingObj, bindingArgs );
        } );

        // Apply bindings to child views
        if( view.isFolder() && view.hasSubviews && !stopAutoApplyBindingForChildren ) {
            views = getEligibleSubviews( view.subviews() );

            util.forEach( views, function( subview ) {
                childrenBoundObjects = registryContext.applyBindings( subview, bindingObj );
                
                // Reduce nested arrays
                util.forEach( childrenBoundObjects, function( boundItem ) {
                    boundObjects.push( boundItem );    
                } );
            } );
        }

        boundObjects.push( bindingObj );
        return boundObjects;
    };

    /*
        Class
        * @constructor
        * @param {Object} view -
        * @param {Object} parentBindingObj -
    */
    function Binding( view, parentBindingObj ) {
        var viewParent = view.parentGroup;

        this.getView = function() {
            return view;
        };
        this.getParent = function() {
            return ( parentBindingObj instanceof this.constructor ) ? parentBindingObj :
                   ( viewParent ) ? new Binding( viewParent ) : null;
        };
        this.overlay = null;
        this.page = null;
        this.exportFonts = [];
        this.exportFiles = [];
    }

    return Registry;
} )( {
    reduceIntermediateLayers: true
} );

var View = ( function() {
    var context,
        plugin,
        selection,
        command,

        viewCache = {
            views: [],
            get: function( id ) {
                var view = this.views[ id ];
                if( view ) {
                    return view;
                }
            },
            add: function( view ) {
                var id = String( view.layer.objectID() );
                this.views[ id ] = view;
            },
            remove: function( id ) {
                if( this.views[ id ] ) {
                    delete this.views[ id ];
                }
            }
        },
        defaultName = "untitled",
        ATTRIBUTES_KEY = "layerAttributes",
        CONTENTSPEC_KEY = "contentSpec";

    /**
        * @desc Constructor for wrapping Sketch layers
        * @namespace View
        * @param {MSLayer} layer -
        * @param {object} parentGroup - View instance
        * @returns {object} view - View instance
        * @returns {MSLayer} view.layer - Sketch layer
        * @returns {NSString} view.id -
        * @returns {string} view.name -
        * @returns {string} view.className -
        * @returns {boolean} view.hasSubviews -
        * @returns {boolean} view.hasClippingMask -
        * @returns {object|null} view.parentGroup - View instance
        
    */
    function View( layer, parentGroup ) {
        var id = String( layer.objectID() ),
            _cacheView = viewCache.get( id );

        if( _cacheView ) {
            return _cacheView;
        }
        if( !layer || !layer.className ) {
            return undefined;
        }

        this.layer = layer;
        this.id = id;
        this.name = String( layer.name() );
        this.className = String( layer.className() );
        this.hasSubviews = this.hasSubviews();
        this.hasClippingMask = this.hasClippingMask();
        this.parentGroup = ( parentGroup instanceof this.constructor ) ? parentGroup : this.getLayerParent();

        viewCache.add( this );
    }

    /**
        * @desc Get the layer parent
        * @returns {object|null} View instance of layer else null if parent is page
    */
    View.prototype.getLayerParent = function() {
        var layerParent = [( this.layer ) parentGroup],
            parentView;

        if( layerParent && [layerParent className] != "MSPage" ) {
            parentView = new View( layerParent );
            
            if( parentView.isFolder() ) {
                return parentView;
            }
        }

        return null;
    };

    /**
        * @desc get layer kind
        * @returns {string} kind - Text, Artboard, Slice, Bitmap, LayerGroup, ShapeGroup, Line, Vector ...
    */
    View.prototype.getLayerKind = function() {
        var kind = "Other",
            className = this.className,
            path;

            if( className === "MSTextLayer" ) {
                kind = "Text";
            } else if( className === "MSArtboardGroup" ) {
                kind = "Artboard";
            } else if( className === "MSSliceLayer" ) {
                kind = "Slice";
            } else if( className === "MSBitmapLayer" ) {
                kind = "Bitmap";
            } else if( className === "MSLayerGroup" ) {
                kind = "LayerGroup";
            } else if( className == "MSShapeGroup" ) {
                if( this.layer.children().count() == 2 ) {
                    var lay = this.layer.children()[ 0 ],
                        // Must be JS String value for equality
                        classString = String( lay.className() ),
                        isSpecificShape = /^MS\w*Shape$/.test( classString );

                    // Shape path
                    if( classString === "MSShapePathLayer" ) { 
                        
                        // get the path on the layer
                        path = lay.path();
                        
                        // check with the path method
                        if( path.isLine() ) { 
                            kind = "Line";
                        }else {
                            kind = "Vector";
                        }
                    } else if( isSpecificShape ) {
                        kind = classString.replace("MS", "").replace("Shape", "");
                    }
                } else {
                    kind = "ShapeGroup";
                }
            } 

        return kind;
    };

    /**
        * @desc Check if layer is an Artboard
        * @returns {boolean}
    */
    View.prototype.isArtboard = function() {
        return this.getLayerKind() === "Artboard";
    };

    /**
        * @desc Check if layer is a layer
        * @returns {boolean}
    */
    View.prototype.isLayer = function() {
        if( !this.layer.className ) { return false; }

        var classes = [
            "MSLayerGroup",
            "MSShapeGroup",
            "MSArtboardGroup",
            "MSTextLayer",
            "MSBitmapLayer",
            "MSShapePathLayer",
            "MSShapePath"
        ];

        return classes.indexOf( this.className ) > -1 ? true : false;
    };

    /**
        * @desc Check if layer is a group layer: layer group or artboard
        * @returns {boolean}
    */
    View.prototype.isFolder = function() {
        var layerClass = this.className;
        return layerClass === "MSLayerGroup" || layerClass === "MSArtboardGroup";
    };

    /**
        * @desc Check if layer is tagged to be ignored; layer name is prepended with "-"
        * @returns {boolean}
    */
    View.prototype.shouldBeIgnored = function() {
        return this.getNameAttributes().ignore ? true :
               this.nameBeginsWith( "-" ) ? true : false;
    };

    /**
        * @desc Check if layer is tagged to be flattened; layer name is prepended with "*"
        * @returns {boolean}
    */
    View.prototype.shouldBeFlattened = function() {
        return this.getNameAttributes().flat ? true :
               this.nameBeginsWith( "*" ) ? true : false;
    };

    /**
        * @desc Check if layer is should be extracted
        * @returns {boolean}
    */
    View.prototype.shouldBeExtracted = function() {
        if( this.shouldBeIgnored() ) {
            return false;
        }
        return this.isLayer();
    };

    /**
        * @desc Check if should not traversed sublayers
        * @returns {boolean}
    */
    View.prototype.doNotTraverse = function() {
        if( !this.shouldBeExtracted() ) {
            return true;
        }
        var layerKind = this.getLayerKind(),
            className = this.className;

        if( className === "MSShapeGroup" || layerKind === "Text" || layerKind === "Bitmap" ) {
            return true;
        }

        // Is this valid??
        // Do not traverse Symbols
        // if( this.layer.sharedObjectID() != null ) {
        //     return true;
        // }

        return false;
    };
    
    /**
        * @desc Check if layer name begins with specific string value
        * @param {string} str - 
        * @returns {boolean}
    */
    View.prototype.nameBeginsWith = function( str ) {
        return String( this.name ).trim().slice( 0, str.length ) === str;
    };

    /**
        * @desc Check if layer name ends with specific string value
        * @param {string} str - 
        * @returns {boolean}
    */
    View.prototype.nameEndsWith = function( str ) {
        return String( this.name ).trim().slice( str.length * -1 ) === str;
    };
    
    /**
        * @desc Get layer name without tags, eg, "[B] Group" will become "Group"
        * @returns {string} layer name without tags or default name if layer name doesn't exist
    */
    View.prototype.getSanitizedName = function() {
        var name = this.name.replace( /(:|\/)/g , "_" )
                            .replace( /__/g , "_" )
                            .replace( /\[.*?\]/g , "" )
                            .replace( /^(\*|\-|\+)|(\*|\-\+)$/g , "" )
                            .replace( new RegExp( "@@mask" , "g" ) , "" )
                            .replace( new RegExp( "@@hidden" , "g" ) , "" )
                            .trim();
        if( name.length === 0 ) {
            name = defaultName;
        }
        return name;
    };

    /**
        * @desc Get layer name tag attributes, eg, "[B=toggle]"
        * @returns {object} attributes -
    */
    View.prototype.getNameAttributes = function() {
        // matches will consist of *(flatten) or -(ignore) or named attributes
        var matches = this.name.match( /^(\*|-)|(\*|-)$/g ) || this.name.match( /\[([\w\d%_,-:=]*)\]/g ),
            attrs = {};

        if( matches ) {
            util.forEach( matches , function( val ) {
                // split binding into substrings by "=" to identify binding name and arguments
                var tmp = val.substring( 1 , val.length - 1 ).split( "=" ),
                    attrName = tmp[ 0 ];

                // capture arguments; guaranteed array value
                var attrArgs = tmp[ 1 ] ? tmp[ 1 ].split( "," ) : [ true ];

                attrs[ attrName ] = attrArgs;
            } );
        }

        return attrs;
    };

    /**
        * @desc Rename layer with tag attributes, eg, "[B=toggle,hidden]"
        * @param {string} attrName - name of attribute tag, eg, "B"
        * @param {string|string[]} attrArgs - attribute tag arguments, eg, [ "toggle", "hidden" ]
        * @returns {object} View instance
    */
    View.prototype.addNameAttributes = function( attrName, attrArgs ) {
        if( typeof attrName !== "string" || attrName.length === 0 ) { return this; }

        // specialAttrRegex will consist of *(flatten) or -(ignore) named attributes
        var specialAttrRegex = /^(\*|-)$/g,
            argsStr = ( Array.isArray( attrArgs ) ) ? attrArgs.join( "," ) :
                      ( typeof attrArgs === "string" ) ? attrArgs : null,
        name = specialAttrRegex.test( attrName ) ? attrName :
               "[" + attrName + ( argsStr ? "=" + argsStr : "" ) + "]";

        name += ( this.name.length > 0 ? " " : "" ) + this.name;

        [( this.layer ) setName:name];

        return this;
    };

    /**
        * @desc Rename layer without name attributes, eg, "[B] Group" will become "Group"
        * @returns {object} View instance
    */
    View.prototype.clearNameAttributes = function() {
        var name = this.getSanitizedName();
        
        [( this.layer ) setName:name];

        return this;
    };

    /**
        * @desc Get key value on layer
        * @param {string} [key] - 
        * @returns {object|number|string|array|boolean} key value if key param supplied else all layer key value pairs
    */
    View.prototype.getLayerValueForKey = function( key ) {
        if( !command ) {
            util.debug.warn( "Access to context is required for MSPluginCommand api" );
            return null;
        }
        var attrs = [command valueForKey:ATTRIBUTES_KEY onLayer:( this.layer )] || "{}";

        if( typeof attrs === "string" || [attrs isKindOfClass:[NSString class]] ) {
            try {
                attrs = JSON.parse( String( attrs ) );
            } catch( e ) {
                util.debug.error( "Data on layer is not valid JSON: " + e );

                attrs = {};
            }
        }
        
        return key ? attrs[ key ] : attrs;
    };

    /**
        * @desc Set key value on layer
        * @param {object|number|string|array|boolean} value - value associated with key
        * @param {string} key - key associated with value
        * @returns {object} View instance
    */
    View.prototype.setLayerValueForKey = function( value, key ) {
        if( !command ) {
            util.debug.warn( "Access to context is required for MSPluginCommand api" );
            return this;
        }
        if( typeof value === "null" || typeof value === "undefined" || typeof key === "undefined" ) {
            return this;
        }

        var attrs = [command valueForKey:ATTRIBUTES_KEY onLayer:( this.layer )] || "{}";

        if( typeof attrs === "string" || [attrs isKindOfClass:[NSString class]] ) {
            attrs = JSON.parse( String( attrs ) );
        }

        attrs[ key ] = value;
        attrs = util.stringifyJSON( attrs );

        [command setValue:attrs forKey:ATTRIBUTES_KEY onLayer:( this.layer )];

        return this;
    };

    /**
        * @desc Clear key value pairs on layer
        * @returns {object} View instance
    */
    View.prototype.clearLayerValues = function() {
        if( !command ) {
            util.debug.warn( "Access to context is required for MSPluginCommand api" );
            return this;
        }

        [command setValue:"{}" forKey:ATTRIBUTES_KEY onLayer:( this.layer )];
      
        return this;
    };

    /**
        * @desc Clear key on layer
        * @returns {object} View instance
    */
    View.prototype.clearLayerKey = function( key ) {
        if( !command ) {
            util.debug.warn( "Access to context is required for MSPluginCommand api" );
            return this;
        }

        if( typeof key === "undefined" ) {
            return this;
        }

        var attrs = [command valueForKey:ATTRIBUTES_KEY onLayer:( this.layer )] || "{}";

        if( typeof attrs === "string" || [attrs isKindOfClass:[NSString class]] ) {
            attrs = JSON.parse( String( attrs ) );
        }

        if( attrs[ key ] ) {
            // Effectively deletes key when stringified
            attrs[ key ] = undefined;
            attrs = util.stringifyJSON( attrs );

            [command setValue:attrs forKey:ATTRIBUTES_KEY onLayer:( this.layer )];
        }

        return this;
    };

    /**
        * @desc Get content spec on layer
        * @returns {object} content spec
    */
    View.prototype.getLayerCS = function() {
        if( !command ) {
            util.debug.warn( "Access to context is required for MSPluginCommand api" );
            return null;
        }
        
        var value = [command valueForKey:CONTENTSPEC_KEY onLayer:( this.layer )] || "{}";

        if( value && ( typeof value === "string" || [value isKindOfClass:[NSString class]] ) ) {
            try {
                value = JSON.parse( String( value ) );
            } catch( e ) {
                util.debug.error( "Content Spec data on layer is not valid JSON: " + e );

                value = {};
            }
        }
        
        return value;
    };

    /**
        * @desc Set content spec on layer
        * @param {object} json - content spec
        * @returns {object} View instance
    */
    View.prototype.setLayerCS = function( json ) {
        if( !command ) {
            util.debug.warn( "Access to context is required for MSPluginCommand api" );
            return this;
        }
        
        var value = util.stringifyJSON( json );

        [command setValue:value forKey:CONTENTSPEC_KEY onLayer:( this.layer )];

        return this;
    };

    /**
        * @desc Clear content spec on layer
        * @returns {object} View instance
    */
    View.prototype.clearLayerCS = function() {
        if( !command ) {
            util.debug.warn( "Access to context is required for MSPluginCommand api" );
            return this;
        }

        [command setValue:"{}" forKey:CONTENTSPEC_KEY onLayer:( this.layer )];

        return this;
    };

    /**
        * @desc Get the layer's arboard
        * @returns {object|null} View instance of artboard layer else null if layer isn't on an artboard
    */
    View.prototype.getParentArtboard = function() {
        var artboard = [( this.layer ) parentArtboard],
            view = artboard ? new View( artboard ) : null;
        
        return view;
    };

    /**
        * @desc Get layer's artboard size
        * @returns {object|null} size - size
        * @returns {number} size.width -
        * @returns {number} size.height -
    */
    View.prototype.getArboardSize = function() {
        var view = this.isArtboard() ? this : this.getParentArtboard(),
            size =  view ? view.getAbsoluteLayout() : null;

        return size ? {
            width: size.width,
            height: size.height
        } : null;
    };

    /**
        * @desc Check if layer has subviews that should be extracted 
        * @returns {boolean}
    */
    View.prototype.hasSubviews = function() {
        if( this.shouldBeIgnored() ) {
            return false;
        }

        var sublayers,
            subview,
            len,
            i = 0;

        if( this.isFolder() ) {
            sublayers = this.layer.layers();
            len = sublayers.count();

            for( i ; i < len ; i++ ) {
                subview = new View( [sublayers objectAtIndex:i], this );
                if( subview.shouldBeExtracted() ) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
        * @desc Get layer's sub layers
        * @returns {object[]} Array of sub layers' View instances
    */
    View.prototype.subviews = function() {
        var subviews = [],
            viewContext = this;

        util.forEach( this.layer.layers() , function( subview ) {
            var view = new View( subview , viewContext );
            if( view.shouldBeExtracted() ) {
                subviews.push( view );
            }
        } );

        return subviews;
    };

    // Applies to subviews
    /**
        * @desc
        * @returns
    */
    View.prototype.disableHidden = function() {
        if( this.doNotTraverse() ) {
            return;
        }

        // This should apply to all sublayers, not just those defined for export
        var sublayers = this.layer.layers();

        util.forEach( sublayers , function( sublayer ) {
            var name = sublayer.name() + "@@hidden";

            if( !sublayer.isVisible() ) {
                // If native hidden is found, disable hidden for export 
                // And tag the layer for later re-enabling
                util.debug.debug( "Disabling hidden for layer <" + sublayer.name() + ">" );
                sublayer.setName( name );
                sublayer.setIsVisible( true );

            }
        } );
    };

    // Applies to subviews
    /**
        * @desc
        * @returns
    */
    View.prototype.enableHidden = function() {
        if( this.doNotTraverse() ) {
            return;
        }

        // This should apply to all sublayers, not just those defined for export
        var sublayers = this.layer.layers();

        util.forEach( sublayers , function( sublayer ) {
            var name = String( sublayer.name() );
            if( name.indexOf( "@@hidden" ) !== -1 ) {
                name = name.replace( new RegExp( "@@hidden" , "g" ) , "" );
                sublayer.setName( name );
                sublayer.setIsVisible( false );
            }
        } );
    };

    /**
        * @desc Check if layer is hidden or tagged as hidden
        * @returns {boolean}
    */
    View.prototype.isHidden = function() {
        return !this.layer.isVisible() || this.nameEndsWith( "@@hidden" );
    };

    /**
        * @desc Check if layer has hidden subviews
        * @returns {boolean}
    */
    View.prototype.hasHiddenSubviews = function() {
        if( this.shouldBeIgnored() ) {
            return false;
        }

        var sublayers,
            subview,
            len,
            i = 0;

        if( this.isFolder() ) {
            sublayers = this.layer.layers();
            len = sublayers.count();

            for( i ; i < len ; i++ ) {
                subview = new View( [sublayers objectAtIndex:i] , this );
                if( !subview.shouldBeIgnored() && subview.isHidden() ) {
                        return true;
                }
            }
        }
        return false;
    };

    // Applies to subviews
    /**
        * @desc
        * @returns
    */
    View.prototype.disableMask = function() {
        if( this.doNotTraverse() ) {
            return;
        }

        // This should apply to all sublayers, not just those defined for export
        var sublayers = this.layer.layers();

        util.forEach( sublayers , function( sublayer ) {
            var name = sublayer.name() + "@@mask";

            if( sublayer.hasClippingMask() ) {
                // If native mask is found, disable mask for export 
                // And tag the layer for later re-enabling
                util.debug.debug( "Disabling mask for layer <" + sublayer.name() + ">" );
                sublayer.setName( name );
                sublayer.setHasClippingMask( false );
            }
        } );

        // Force redraw
        this.layer.resizeToFitChildrenWithOption( true );
    };

    // Applies to subviews
    /**
        * @desc
        * @returns
    */
    View.prototype.enableMask = function() {
        if( this.doNotTraverse() ) {
            return;
        }

        // This should apply to all sublayers, not just those defined for export
        var sublayers = this.layer.layers();

        util.forEach( sublayers , function( sublayer ) {
            var name = String( sublayer.name() );
            if( name.indexOf( "@@mask" ) !== -1 ) {
                name = name.replace( new RegExp( "@@mask" , "g" ) , "" );
                sublayer.setName( name );
                sublayer.setHasClippingMask( true );
            }
        } );

        // Force redraw
        this.layer.resizeToFitChildrenWithOption( true );
    };

    /**
        * @desc Check if layer has a clipping mask applied
        * @returns {boolean}
    */
    View.prototype.isClippingMask = function() {
        return this.layer.hasClippingMask();
    };

    /**
        * @desc Check if layer has a clipping mask applied and should be extracted
        * @returns {boolean}
    */
    View.prototype.shouldExtractClippingMask = function() {
        return ( !this.isFolder() && this.isClippingMask() ) ? this.nameBeginsWith( "+" ) : true;
    };

    /**
        * @desc
        * @returns
    */
    View.prototype.hasClippingMask = function() {
        if( this.shouldBeIgnored() ) {
            return false;
        }

        var sublayers,
            subview,
            len,
            i = 0;

        if( this.isFolder() ) {
            sublayers = this.layer.layers();
            len = sublayers.count();

            for( i ; i < len ; i++ ) {
                subview = new View( [sublayers objectAtIndex:i] , this );
                if( !subview.shouldBeIgnored() && 
                    ( subview.isClippingMask() || subview.nameEndsWith( "@@mask" ) ) ) {
                        return true;
                }
            }
        }
        return false;
    };

    /**
        * @desc
        * @returns
    */
    View.prototype.getClippingMask = function() {
        if( !this.hasClippingMask ) {
            return this.getAbsoluteLayout();
        }
        var clippingMask;

        util.forEach( this.subviews() , function( subview ) {
            if( subview.isClippingMask() || subview.nameEndsWith( "@@mask" ) ) {
                clippingMask = subview;
            }
        } );

        return clippingMask ? clippingMask.getAbsoluteLayout() : null;
    };
    
    /**
        * @desc
        * @returns
    */
    View.prototype.getLayoutRelativeTo = function( view ) {
        var layout = this.getAbsoluteLayout(),
            relLayout,
            x = layout.x,
            y = layout.y;

        if( view instanceof this.constructor ) {
            relLayout = view.getInfluenceLayout();

            x -= relLayout.x;
            y -= relLayout.y;
        }

        return {
            x: x,
            y: y,
            width: layout.width,
            height: layout.height
        };
    };

    /**
        * @desc Gets the view;s frame including borders and shadows
        * @returns {object} frame
        * @returns {number} frame.x - Absolute frame x position
        * @returns {number} frame.y - Absolute frame y position
        * @returns {number} frame.width - Frame width
        * @returns {number} frame.height - Frame height
    */
    // TODO: Account for layer rotation
    View.prototype.getInfluenceLayout = function() {
        var isArtboard = this.isArtboard(),
            x,  y,  width,  height,
            frame,
            absRect = [( this.layer ) absoluteRect],

            // Get active borders: center or outside
            borders = !isArtboard ? this.getBorders() : [],
            activeInfluenceBorders = borders.filter( function( border ) {
                // Center (0), Inside (1) or Outside (2)
                var position = [border position];

                if( [border isEnabled] ) {
                    if( position != 1 ) {
                        return true
                    }
                }

                return false;
            } ),
            
            // Get active shadows
            shadows = !isArtboard ? this.getShadows() : [],
            activeInfluenceShadows = shadows.filter( function( shadow ) {
                return [shadow isEnabled];
            } );

        // Use influenceRectForFrame if active center or outside borders styles or active shadow styles
        if( activeInfluenceBorders.length > 0 || activeInfluenceShadows.length > 0 ) {
            frame = [( this.layer ) influenceRectForBounds];
            x = [absRect rulerX] + frame.origin.x;
            y = [absRect rulerY] + frame.origin.y;
            width = frame.size.width;
            height = frame.size.height;
        }

        // Use frame
        else {
            frame = [( this.layer ) frame];
            width = [frame width];
            height = [frame height];

            if( isArtboard ) {
                // Alternative option: influenceRectForBounds
                util.debug.info( "Zeroing Artboard x and y for <" + this.name + ">" );
                x = 0;
                y = 0;
            } else {
                x = [absRect rulerX];
                y = [absRect rulerY];
            }
        }

        return {
            x: x,
            y: y,
            width: width,
            height: height
        };        
    };

    /**
        * @desc
        * @returns
    */
    View.prototype.getInfluenceLayoutSansStyles = function() {
        if( !this.hasClippingMask ) {
            return this.getAbsoluteLayout();
        }

        var frame = this.getClippingMask(),
            thisView = this,
            maxWidth = frame.width,
            maxHeight = frame.height;

        if( this.hasSubviews ) {
            util.forEach( this.subviews() , function( subview ) {
                var subviewFrame = subview.getLayoutRelativeTo( thisView );

                maxWidth = Math.max( maxWidth , subviewFrame.width + subviewFrame.x );
                maxHeight = Math.max( maxHeight , subviewFrame.height + subviewFrame.y );
            } );
        }

        frame.width = maxWidth;
        frame.height = maxHeight;
        return frame;
    };

    /**
        * @desc
        * @returns
    */
    View.prototype.getAbsoluteLayout = function() {
        var frame = this.layer.frame(),
            x = this.layer.absoluteRect().rulerX(),
            y = this.layer.absoluteRect().rulerY();

        if( this.isArtboard() ) {
            util.debug.info( "Zeroing Artboard x and y for <" + this.name + ">" );
            x = 0;
            y = 0;
        }

        return {
            x: x,
            y: y,
            width: frame.width(),
            height: frame.height()
        };

        // var frame = this.layer.frame(),
        //     gkrect = [GKRect rectWithRect:[( this.layer ) absoluteInfluenceRect]],
        //     absrect = this.layer.absoluteRect(),
        //     rulerDeltaX,
        //     rulerDeltaY,
        //     x,
        //     y;

        // rulerDeltaX = absrect.rulerX() - absrect.x();
        // rulerDeltaY = absrect.rulerY() - absrect.y();
        // x = Math.round( gkrect.x() + rulerDeltaX );
        // y = Math.round( gkrect.y() + rulerDeltaY );

        // return {
        //     x: x,
        //     y: y,
        //     width: frame.width(),
        //     height: frame.height()
        // };
    };

    /**
        * @desc
        * @returns
    */
    View.prototype.getBorders = function() {
        var borders = [];

        util.forEach( [[[( this.layer ) style] borders] array], function( border ) {
            borders.push( border );
        } );

        return borders;
    };

    /**
        * @desc
        * @returns
    */
    View.prototype.getShadows = function() {
        var shadows = [];

        util.forEach( [[[( this.layer ) style] shadows] array], function( shadow ) {
            shadows.push( shadow );
        } );

        return shadows;
    };

    /**
        * @desc
        * @returns
    */
    View.prototype.duplicate = function() {
        var viewCopy = new View( this.layer.duplicate() , this.parentGroup );
        viewCopy.isDuplicate = true;

        return viewCopy;
    };

    /**
        * @desc
        * @returns
    */
    View.prototype.removeFromParent = function() {
        util.debug.debug( "Removing view: " + this.name );
        viewCache.remove( this.id );
        this.layer.removeFromParent();
    };

    /**
        * @desc Constructor for wrapping Sketch layers for accessing layer information
        * @namespace View
        * @example
        * // returns {object} subclass of util.Object
        * var view = View.create( pluginContext );
        * @example
        * // returns {object} new instance of View layer wrapper
        * view.make( sketchLayer );
    */
    return util.Object.extend( {
        /**
            * @desc
            * @returns
        */
        init: function( ctx ) {
            this._super( ctx );
            
            context = this.context;
            doc = this.context.document;
            plugin = this.context.plugin;
            selection = this.context.selection;
            command = this.context.command;
        },

        /**
            * @desc
            * @returns
        */
        make: function( layer, parent ) {
            return new View( layer, parent );
        }
    } );
} )();