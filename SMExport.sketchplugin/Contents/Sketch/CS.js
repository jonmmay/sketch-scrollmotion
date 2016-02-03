@import "util.js";
@import "htmlparser.js";

// TO DO: Are content spec helpers required to be non-enumerable?

var ContentSpec = ( function( options ) {
	var resetTextCss = ( options && options.resetCSS ) ? options.resetCSS : "reset3.11.css",
		schema = "http://www.scrollmotion.com/contentspec/schema/" + 
                    ( ( options && options.schemaVersion ) ? options.schemaVersion : "3.11" ) +
                    "/";

	function getFileData( url ) {
        if( url && [url isKindOfClass:[NSURL class]] ) {
            var fileManager = [NSFileManager defaultManager];

            return ( [fileManager fileExistsAtPath:[url fileSystemRepresentation]] ) ?
                [NSData dataWithContentsOfURL:url] : null;  
        }
        return null;
    }
    function getJSONObjectWithData( data, mutable ) {
        var err = [[MOPointer alloc] init],
            json;
        mutable = mutable ? NSJSONReadingMutableContainers : 0;
        
        if( data && [data isKindOfClass:[NSData class]] ) {
            json = [NSJSONSerialization JSONObjectWithData:data options:mutable error:err];

            if( err.value() ) {
                util.debug.warn( "json error: can't load json" );
                util.debug.warn( err.value() );
                return null;
            }
            return json;
        }
        return null;
    }

    /*
        function mixin( target, source, keys ) {
            keys = keys || Object.getOwnPropertyNames( source );

            keys.forEach( function( key ) {
                if( source.hasOwnProperty( key ) && typeof target[ key ] === "undefined" ) {
                    Object.defineProperty( target, key, Object.getOwnPropertyDescriptor( source, key ) );
                }
            } );

            return target;
        }
    */

    function extend( prototype ) {
        var object = Object.create( prototype ),
            len = arguments.length,
            index = len - 1,
            extension,
            props;

        while( index ) {
            extension = arguments[ len - ( index-- ) ];
            props = Object.getOwnPropertyNames( extension );

            props.forEach( function( prop ) {
                if( typeof object[ prop ] === "undefined" ) {
                    Object.defineProperty( object, prop, Object.getOwnPropertyDescriptor( extension, prop ) );
                }
            } );
        }

        return object;
    }
    
    function defineNonEnumerableProperties( obj, props ) {
        for( var key in props ) {
            defineNonEnumerableProperty( obj, key, props[ key ] );
        }
        return obj;
    }
    function defineNonEnumerableProperty( obj, name, value ){
        var config = {
            value: value,
            writable: true,
            enumerable: false,
            configurable: true
        };
        
        Object.defineProperty( obj, name, config );
        return obj;
    }

    function traverseNodes( node , i ) {
        if( node === undefined ) { return null; }

        var parentNode = node.getParentNode(),
            childrenNodes = node.getChildrenNodes(),
            siblingsNum = ( parentNode ) ? parentNode.getChildrenNodes().length : 0;
        i = i || 0;

        // Traverse siblings
        while( node.stringValue.length === 0 && ( i < siblingsNum - 1 || childrenNodes.length > 0 ) ) {
            // Traverse children
            while( node.stringValue.length === 0 && childrenNodes.length > 0 ) {
                return traverseNodes( childrenNodes[ 0 ] , 0 );
            }

            i++;
            return traverseNodes( parentNode.getChildrenNodes()[ i ], i );
        }

        return ( node.stringValue.length > 0 ) ? node : null;
    }
    function firstInstanceofStyleInNodes( styleName , nodes ) {
        if( nodes.length === 0 ) { return null; } // Provide more informative warning
        var node = traverseNodes( nodes[ 0 ] );

        while( node !== null ) {
            if( !node.attrs || !node.attrs.style ) {
                node = node.getParentNode();
            }
            if( node.attrs.style[ styleName ] ) {
                return node.attrs.style[ styleName ];
            }
            node = node.getParentNode();
        }
        return null;
    }
    function setBasicText( text ) {
        this.spec.text = "<div style=\"text-align: left; line-height: 28px;\"><span style=\"letter-spacing: 0px;\"><span style=\"color:#000000;\"><span style=\"font-size: 24px; font-family: ArialMT, Arial;\">" + text + "</span></span></span></div>";
    }
    function setCustomText( text ) {
        this.spec.text = "<div style=\"text-align: left; line-height: 28px;\"><span style=\"letter-spacing: 0px;\"><span style=\"color:#000000;\"><span class=\"sm-font-family\" style=\"font-family:HelveticaNeue-Regular,'Helvetica Neue';font-style:normal;font-weight:normal;\"><span class=\"sm-font-style\"><span style=\"font-size:24px;\">" + text + "</span></span></span></span></span></div>";
    }
    function replaceTextAlign( textAlign ) {
        this.spec.text = this.spec.text.replace( /text-align:\s*([^;]*);/gi, function( m ) {
            return m.replace( /left|center|right|justify/gi, textAlign );
        } );
    }
    function replaceLineHeight( lineHeight ) {
        this.spec.text = this.spec.text.replace( /line-height:\s*([^;]*);/gi, function( m ) {
            return m.replace( /\d*px/gi, lineHeight );
        } );
    }
    function replaceLetterSpacing( letterSpacing ) {
        this.spec.text = this.spec.text.replace( /letter-spacing:\s*([^;]*);/gi, function( m ) {
            return m.replace( /\d*px/gi, letterSpacing );
        } );   
    }
    function replaceColor( hex ) {
        this.spec.text = this.spec.text.replace( /color:\s*([^;]*);/gi, function( m ) {
            return m.replace( /#\d*/gi, hex );
        } );   
    }
    function replaceFontSize( fontSize ) {
        this.spec.text = this.spec.text.replace( /font-size:\s*([^;]*);/gi, function( m ) {
            return m.replace( /\d*px/gi, fontSize );
        } );   
    }
    function replaceFontFamily( font, fontFamily ) {
        this.spec.text = this.spec.text.replace( /font-family:\s*([^;]*);/gi, function( m ) {
            return "font-family:" + font + ",'" + fontFamily + "';";
        } );
    }

    var csHelpers = defineNonEnumerableProperties( {}, {
            setKeyValue: function( key, value ) {
                if( typeof key !== "string" && typeof value === "undefined" ) {
                    return;
                }
                this.spec[ key ] = value;
                return this;
            },
            getKeyValue: function( key ) {
                return this.spec[ key ];
            },
            value: function() {
                return this.spec;
            },
            setValue: function( json ) {
                this.spec = json;

                return this;
            }
        } ),
        overlayHelpers = extend( {}, csHelpers, defineNonEnumerableProperties( {}, {
            setLayouts: function( orientation, data ) {
                var key;

                if( !this.spec.layouts[ orientation ] ) {
                    this.spec.layouts[ orientation ] = {};
                }

                for( key in data ) {
                    this.spec.layouts[ orientation ][ key ] = data[ key ];
                }
                return this;
            },
            getOverlayId: function() {
                return this.spec.overlayId;
            },
            setOverlayId: function( id ) {
                this.spec.overlayId = id;
            }
        } ) ),
        pageHelpers = extend( {}, csHelpers, defineNonEnumerableProperties( {}, {
            getPageId: function() {
                return this.spec.pageId;
            },
            setPageId: function( id ) {
                this.spec.pageId = id;
            }
        } ) ),
        containerHelpers = defineNonEnumerableProperties( {}, {
            addReferenceByOverlayId: function( id ) {
                if( typeof id !== "undefined" ) {
                    if( this.spec.overlays instanceof Array ) {
                        this.spec.overlays.push( { "overlayId": id } );
                    }
                }
                return this;
            },
            appendOverlay: function( overlay ) {
                if( typeof overlay !== "undefined" ) {
                    if( this.spec.overlays instanceof Array ) {
                        this.spec.overlays.push( overlay );
                    } else if( typeof this.spec.overlays === "object" && overlay.overlayId ) {
                        this.spec.overlays[ overlay.overlayId ] = overlay;
                    } else {
                        util.debug.debug( "Cannot append \"" + overlay.overlayId + "\"" );
                    }
                }

                return this;
            }
        } ),
        htmlTextHelpers = defineNonEnumerableProperties( {}, {
            _parsedText: {},
            _textNodes: [],
            _textStringValue: "",
            _resetParsedText: function() { 
                this._parsedText = {};
                this._textNodes = [];
            },
            _cacheParsedText: function( text ) {
                this._resetParsedText();
                this._parsedText = htmlToNodes.run( text );
                this._textNodes = this._parsedText.results();
                this._textStringValue = this._parsedText.stringValue();
            },
            setText: function( text ) {
                setBasicText.call( this, text );
                this._cacheParsedText( text );

                return this;
            },
            
            getTextAlign: function() {
                return ( this._textNodes.length > 0 ) ?
                    firstInstanceofStyleInNodes( "text-align", this._textNodes ) :
                    null;
            },
            getLineHeight: function() {
                return ( this._textNodes.length > 0 ) ?
                    firstInstanceofStyleInNodes( "line-height", this._textNodes ) :
                    null;
            },
            getLetterSpacing: function() {
                return ( this._textNodes.length > 0 ) ?
                    firstInstanceofStyleInNodes( "letter-spacing", this._textNodes ) :
                    null;
            },
            getColor: function() {
                return ( this._textNodes.length > 0 ) ?
                    firstInstanceofStyleInNodes( "color", this._textNodes ) :
                    null;
            },
            getFontSize: function() {
                return ( this._textNodes.length > 0 ) ?
                    firstInstanceofStyleInNodes( "font-size", this._textNodes ) :
                    null;
            },

            setTextAlign: function( textAlign ) {
                replaceTextAlign.call( this, textAlign );
                this._cacheParsedText( this.text );
                
                return this;
            },
            setLineHeight: function( lineHeight ) {
                replaceLineHeight.call( this, lineHeight );
                this._cacheParsedText( this.text );

                return this;
            },
            setLetterSpacing: function( letterSpacing ) {
                replaceLetterSpacing.call( this, letterSpacing );
                this._cacheParsedText( this.text );

                return this;
            },
            setColor: function( hex ) {
                replaceColor.call( this, hex );
                this._cacheParsedText( this.text );

                return this;
            },
            setFontSize: function( fontSize ) {
                replaceFontSize.call( this, fontSize );
                this._cacheParsedText( this.text );

                return this;
            },
            setCustomFont: function( font, fontFamily ) {
                var textAlign = this.getTextAlign(),
                    lineHeight = this.getLineHeight(),
                    letterSpacing = this.getLetterSpacing(),
                    color = this.getColor(),
                    fontSize = this.getFontSize();

                setCustomText.call( this, this._textStringValue );
                replaceFontFamily.call( this, font, fontFamily );

                // Reapply styles
                if( textAlign ) { replaceTextAlign.call( this, textAlign ); }
                if( lineHeight ) { replaceLineHeight.call( this, lineHeight ); }
                if( letterSpacing ) { replaceLetterSpacing.call( this, letterSpacing ); }
                if( color ) { replaceColor.call( this, color ); }
                if( fontSize ) { replaceFontSize.call( this, fontSize ); }

                this._cacheParsedText( this.text );

                return this;
            },

            resetToDefaultFont: function() {
                var textAlign = this.getTextAlign(),
                    lineHeight = this.getLineHeight(),
                    letterSpacing = this.getLetterSpacing(),
                    color = this.getColor(),
                    fontSize = this.getFontSize();

                setBasicText.call( this, this._textStringValue );

                // Reapply styles
                if( textAlign ) { replaceTextAlign.call( this, textAlign ); }
                if( lineHeight ) { replaceLineHeight.call( this, lineHeight ); }
                if( letterSpacing ) { replaceLetterSpacing.call( this, letterSpacing ); }
                if( color ) { replaceColor.call( this, color ); }
                if( fontSize ) { replaceFontSize.call( this, fontSize ); }

                this._cacheParsedText( this.text );

                return this;
            }
        } ),
        csStubs = {
            image_button: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/image_button.v3.json" )
                }, overlayHelpers );
            },
            button: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/button.v3.json" )
                }, overlayHelpers );
            },
            hotspot: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/hotspot.v3.json" )
                }, overlayHelpers );
            },
            container: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/container.v3.json" )
                }, overlayHelpers, containerHelpers );
            },
            text_complex: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/text_complex.v3.json" )
                }, overlayHelpers, htmlTextHelpers );
            },
            image: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/image.v3.json" )
                }, overlayHelpers );
            },
            overlay: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/overlay.v3.json" )
                }, overlayHelpers );
            },
            page: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/page.v3.json" )
                }, pageHelpers, containerHelpers );
            },
            pageset: function( stubHandler ) {
                return extend( {
                    spec: stubHandler( "csStubs/pageSet.v3.json" )
                }, csHelpers );
            }
        };

    var cs = util.Object.extend( {
        init: function( ctx ) {
            this._super( ctx );
            
            var contentSpec = this.getCSStubByResourcePath( "csStubs/contentSpec.v3.json" );

            contentSpec.schema = schema;
            if( contentSpec.metaData ) {
                contentSpec.metaData.resetTextCss = resetTextCss;
            }

            this.spec = Object.create( contentSpec );
            this.overlayId = 0; // Overlay id generator counter
            this.pageId = 0; // Page id generator counter
        },
        initWithJSON: function( json ) {
            if( json && json.className && [json isKindOfClass:[NSDictionary class]] ) {
                // Convert JSON for use with JavaScript
                this.spec = JSON.parse( util.stringifyJSON( json ) );
            } else if( json && json instanceof Object ) {
                this.spec = json;
            } else {
                throw "Can't initialize ContentSpec with " + 
                      ( json.className ? json.className : typeof json ) + " parameter.";
            }
        },
        getCSStubByResourcePath: function( path ) {
            var plugin = this.plugin,
                url = [plugin urlForResourceNamed:path],
                json = getJSONObjectWithData( getFileData( url ), true );

            // Convert JSON for use with JavaScript
            if( json ) {
                json = JSON.parse( String( util.stringifyJSON( json ) ) );
            }
            return json;
        },
        value: function() {
            return this.spec;
        },
        getSchema: function() {
            return this.spec.schema ? this.spec.schema : null;
        },
        getResetCss: function() {
            var metaData = this.spec.metaData;
            return ( metaData && metaData.resetTextCss ) ? metaData.resetTextCss : null;
        },
        getStartPage: function() {
            return this.spec.metaData.startPage;
        },
        setStartPage: function( id ) {
            var pageIds = this.getPagesIds(),
                pageSetIds = this.getPageSetsIds();

            if( pageIds.indexOf( id ) > 0 || pageSetIds.indexOf( id ) ) {
                this.spec.metaData.startPage = id;
            } else {
                debug.warn( "Page or Pageset id <" + id + "> must exist in the Content Spec" );
            }

            return this;
        },
        getContentSpecKeysByKey: function( key ) {
            var arr = [],
                obj = this.spec[ key ],
                name;
            
            if( obj && typeof( obj ) === "object" ) {
                util.forEach( obj, function( val, name ) {
                    arr.push( name );
                } );
            }
            
            return arr;
        },
        getPageSetsIds: function() {
            return this.getContentSpecKeysByKey( "pageSets" );
        },
        getPagesIds: function() {
            return this.getContentSpecKeysByKey( "pages" );
        },
        getOverlaysIds: function() {
            return this.getContentSpecKeysByKey( "overlays" );
        },
        getScreenSupportScreens: function() {
            var screenSupport = this.spec.screenSupport,
                screens = screenSupport && screenSupport.screens ? screenSupport.screens : null;

            return screens;
        },
        addScreenSupportScreen: function( orientation, width, height ) {
            var screenData;

            width = ( typeof width === "number" ) ? width : 1024;
            height = ( typeof height === "number" ) ? height : 768;

            screenData = {
                "fonts": [
                    {
                        "fontName": "arial",
                        "fontSize": 14,
                        "name": "Normal"
                    }
                ],
                "height": height,
                "orientation": orientation || "landscape",
                "suffix": "",
                "width": width
            };

            if( this.spec.screenSupport && this.spec.screenSupport.screens ) {
                if( this.spec.screenSupport.screens.indexOf( screenData ) < 0 ) {
                    this.spec.screenSupport.screens.push( screenData );
                }
            }
            return this;
        },
        addFontMetaData: function( font ) {
            var fileName = font.fileName,
                postScriptName = font.postScriptName,
                fullName = font.fullName,
                familyName = font.familyName,
                style = font.style;

            if( !fileName || !postScriptName || !fullName || !familyName || !style ) {
                return;
            }

            if( !this.spec.metaData.customFonts ) {
                this.spec.metaData.customFonts = [];
            } else {
                if( this.spec.metaData.customFonts.indexOf( fileName ) > -1 ) {
                    return;
                }
            }

            if( !this.spec.metaData.fonts ) { this.spec.metaData.fonts = []; }

            this.spec.metaData.customFonts.push( fileName );
            this.spec.metaData.fonts.push( {
                familyName: familyName,
                file: {},
                fileName: fileName,
                fullName: fullName,
                postScriptName: postScriptName,
                style: style
            } );

            return this;
        },

        generateOverlayId: function() {
            var id = "overlay",
                overlayIds = this.getOverlaysIds();

            while( overlayIds.indexOf( id + ++this.overlayId ) !== -1 ) {}
            id += this.overlayId;
            
            return id;
        },
        generatePageId: function() {
            var id = "page",
                pageIds = this.getPagesIds();

            while( pageIds.indexOf( id + ++this.pageId ) !== -1 ) {}
            id += this.pageId;

            return id;
        },
        make: function( type ) {
            var plugin = this.plugin,
                stubHandler = this.getCSStubByResourcePath.bind( this );

            type = type.toLowerCase();

            // This may be a bad assumption
            if( !csStubs[ type ] ) { type = "overlay"; }
            
            return csStubs[ type ]( stubHandler );
        },
        appendOverlay: function( overlay ) {
            containerHelpers.appendOverlay.call( this, overlay );
            return this;
        },
        appendPage: function( page ) {
            if( typeof page !== "undefined" ) {
                this.spec.pages[ page.pageId ] = page;
            }
            return this;
        },
        getOverlay: function( overlayId, isResolvingReferences ) {
            var cs = this;
            
            if( this.getOverlaysIds().indexOf( overlayId ) > -1 ) {
                var overlay = this.spec.overlays[ overlayId ];

                if( overlay.overlays && overlay.overlays instanceof Array && isResolvingReferences ) {
                    overlay.overlays = overlay.overlays.map( function( obj ) {
                        var subOverlay = cs.getOverlay( obj.overlayId, true );
                        
                        if( subOverlay ) {
                            return util.merge( util.naiveClone( subOverlay ), util.naiveClone( obj ) );
                        }
                    } );
                }
                // if( overlay.overlays && [( overlay.overlays ) isKindOfClass:[NSMutableArray class]] ) {
                //     var i = 0,
                //         len = [( overlay.overlays ) count],
                //         subOverlay;
                    
                //     for( i; i < len; i++ ) {
                //         subOverlay = this.getOverlay( String( overlay.overlays[ i ].overlayId ) );
                //         if( subOverlay ) {
                //             overlay.overlays[ i ] = util.merge( util.naiveClone( subOverlay ) , util.naiveClone( overlay.overlays[ i ] ) );
                //         }
                //     }
                // }
                
                return overlay;
            }
            return null;
        },
        getPage: function( pageId, isResolvingReferences ) {
            var cs = this;
            
            if( this.getPagesIds().indexOf( pageId ) > -1 ) {
                var page = this.spec.pages[ pageId ];

                if( page.overlays && page.overlays instanceof Array && isResolvingReferences ) {
                    page.overlays = page.overlays.map( function( obj ) {
                        var overlay = cs.getOverlay( obj.overlayId, true );
                        
                        if( overlay ) {
                            return util.merge( util.naiveClone( overlay ), util.naiveClone( obj ) );
                        }
                    } );
                }
                // if( page.overlays && [( page.overlays ) isKindOfClass:[NSMutableArray class]] ) {
                //     var i = 0,
                //         len = [( page.overlays ) count],
                //         overlay;
                    
                //     for( i; i < len; i++ ) {
                //         overlay = this.getOverlay( String( page.overlays[ i ].overlayId ) );
                //         if( overlay ) {
                //             page.overlays[ i ] = util.merge( util.naiveClone( overlay ), util.naiveClone( page.overlays[ i ] ) );
                //         }
                //     }
                // } 
                
                return page;
            }
            return null;
        },
        getPageSet: function( pageSetId, isResolvingReferences ) {
            var cs = this;
            
            if( this.getPageSetsIds().indexOf( pageSetId ) > -1 ) {
                var pageSet = this.spec.pageSets[ pageSetId ];

                if( pageSet.pages && pageSet.pages instanceof Array && isResolvingReferences ) {
                    pageSet.pages = pageSet.pages.map( function( val ) {
                        var page = cs.getPage( val, true );
                        
                        if( page ) {
                            return page;
                        }
                    } );
                }
                // if( pageSet.pages && [( pageSet.pages ) isKindOfClass:[NSMutableArray class]] ) {
                //     var i = 0,
                //         len = [( pageSet.pages ) count],
                //         page;
                    
                //     for( i; i < len; i++ ) {
                //         page = this.getPage( String( pageSet.pages[ i ] ) );
                //         if( page ) {
                //             pageSet.pages[ i ] = page;
                //         }
                //     }
                // }
                return pageSet;
            }
            return null;
        }
    } );

    return cs;
} )( {
    schemaVersion: "3.19",
    resetCSS: "reset3.14.1.css"
} );