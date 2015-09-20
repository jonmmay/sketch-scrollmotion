/* global Util */
"use strict";

@import "config.js";

var ViewBinding = ( function( _ViewBinding , options ) {
    function getEligibleSubviews( views ) {
        if( !options.reduceIntermediateLayers ) {
            return views;
        }
        var eligibleViews = [];

        Util.forEach( views , function( subview ) {
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
                isEligible = ( Util.values( bindings ).length ) ? true : 
                             ( subview.shouldBeFlattened() ) ? true : subview.hasClippingMask;
                
                if( !isEligible ) {
                    // Look for next eligible subviews
                    isEligible = false;
                    Util.debug.debug( "<" + subview.name + "> isn't an eligible layer" );
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

	function Registry() {
		this.mappedOutput = [];
        this.boundObjects = [];
		this.bindingObjects = {};
		this.objectGenerators = {};
	}

	Registry.prototype.generateObjectByKind = function( bindingObj ) {
        var kind = bindingObj.view.getLayerKind(),
            generatorKind = this.objectGenerators[ kind ] ? kind : "default";

        this.objectGenerators[ generatorKind ].object( bindingObj );
    };
	Registry.prototype.registerObjectGenerator = function( name , handler ) {
		this.objectGenerators[ name ] = ( typeof handler === "object" ) ? handler : { object: handler };
	};
	Registry.prototype.registry = function( name , handler ) {
		if( this.bindingObjects[ name ] ) {
            Util.debug.warn( "Overwriting binding: " + name );
        }

        // Object *can* support additional initialization properties
        if( typeof handler === "function" ) {
            handler = { compose: Util.noop };
        } else if( typeof handler === "object" ) {
            if( !handler.compose ) { handler.compose = Util.noop; }
        } else {
            Util.debug.warn( "Unacceptable handler: " + name );
            return;
        }

        handler.inited = false;
        this.bindingObjects[ name ] = handler;
	};
	Registry.prototype.applyBindings = function( view , parentBindingObj , bindings ) {
		var bindingObj = new Binding( view , parentBindingObj ),
			registryContext = this,
            stopAutoApplyBindingForChildren = false,
            views;

        bindings = bindings || view.getNameAttributes();

        if( !view.isLayer() ) {
            Util.debug.error( "First argument must be a valid layer" );
            return;
        }
        if( view.shouldBeIgnored() ) {
            Util.debug.debug( "Layer should be ignored, <" + view.name + ">" );
            return;
        }

        // Initialize object by Sketch layer type
        this.generateObjectByKind( bindingObj );

        // Initialize object bindings
        // Compose object with binding arguments
        Util.forEach( bindings , function( bindingArgs , bindingName ) {
            var binding = registryContext.bindingObjects[ bindingName ];

            if( !binding ) {
                Util.debug.debug( "Unknown binding: " + bindingName );
                return;
            }

            if( !binding.inited ) {
                if( binding.init ) {
                    binding.init();
                }
                binding.inited = true;
            }

            if( binding.stopAutoApplyBindingForChildren ) {
                Util.debug.debug( bindingName + " has stopAutoApplyBindingForChildren" );
                stopAutoApplyBindingForChildren = true;
            }

            // Compose object based on named attributes
            binding.compose( bindingObj , bindingArgs );
        } );

        // Apply bindings to child views
        if( view.isFolder() && view.hasSubviews && !stopAutoApplyBindingForChildren ) {
            views = getEligibleSubviews( view.subviews() );

            Util.forEach( views , function( subview ) {
                registryContext.applyBindings( subview , bindingObj );
            } );
        }

        this.boundObjects.push( bindingObj );
	};
    Registry.prototype.mapOutput = function() {
        // Once mapped the data has been permanently altered;
        // Will require a reset if data change is required
        if( this.mappedOutput.length === 0 ) {
            this.mappedOutput = this.boundObjects.map( function( bindingObj ) {
                var output = bindingObj.output(),
                    overlay = bindingObj.overlay,
                    parentObject = ( bindingObj.parent ) ?
                        ( bindingObj.parent.overlay ) ?
                            bindingObj.parent.overlay :
                            bindingObj.parent.page :
                        null;

                if( parentObject === null ) {
                    Util.debug.debug( "Unable to map <" + bindingObj.view.name + "> to overlays" );
                }
                
                if( output.type !== null ) {
                    if( output.type === "overlay" ) {
                        parentObject.addOverlayByReference( overlay.getOverlayId() );   
                    }
                    return output;
                } else {
                    Util.debug.warn( "Missing overlay and page for layer: <" + bindingObj.view.name + ">" );
                }
            } );
        }

        return this.mappedOutput;
    };

	function Binding( view , parentView ) {
        this.view = view;
        this.parent = ( parentView instanceof this.constructor ) ? parentView : null;
        this.overlay = null;
        this.page = null;
        this.exportFonts = [];
        this.exportFiles = [];
    }

    Binding.prototype.setupRectforOverlay = function( overlay , view , parentView ) {
        var pos;
        pos = view.getLayoutRelativeTo( parentView );

        overlay.layouts.landscape.width = Util.toPx( pos.width );
        overlay.layouts.landscape.height = Util.toPx( pos.height );
        overlay.layouts.landscape.x = Util.toPx( pos.x );
        overlay.layouts.landscape.y = Util.toPx( pos.y );

        overlay.hidden = !view.layer.isVisible();
    };
    Binding.prototype.requiresExport = function( view ) {
        var needExport = false,
            borders = view.layer.style().borders().array(),
            bordersLen = borders.count(),
            fills = view.layer.style().fills().array();

            needExport = bordersLen > 1;

        if( !needExport ) {

            // A color fill (0), gradient (1) or pattern (4); only color fill supported
            Util.forEach( fills , function( fill ) {
                if( fill.fillType() > 0 ) {
                    needExport = true;
                }
            } );
        }

        return needExport;
    };
    Binding.prototype.output = function() {
        var output = {
            type: ( this.overlay !== null ) ? "overlay" : ( this.page !== null ) ? "page" : null,
            view: this.view,
            exportFiles: this.exportFiles,
            exportFonts: this.exportFonts
        };

        if( output.type !== null ) {
            output[ output.type ] = this[ output.type ];
        }

        return output;
    };

	return Registry;

} ( ViewBinding , {
	reduceIntermediateLayers: true
} ) );