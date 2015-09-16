/* global log */

@import "config.js";

var ContentSpec = ( function( _ContentSpec ) {
    "use strict";

    var resetTextCss = "reset3.11.css",
        schema = "http://www.scrollmotion.com/contentspec/schema/3.11/",
        defaultPageSetId = "pageSet1";

    function extend( parent , child ) {
        var origProto = child.prototype,
            key;
        child.prototype = Object.create( parent.prototype );

        for( key in origProto ) {
            child.prototype[ key ] = origProto[ key ];
        }
        child.prototype.constructor = child;
        Object.defineProperty( child.prototype , "constructor" , { 
            enumerable: false, 
            value: child 
        } );
    }
    function mixin( target , source , props ) {
        if( !props ) {
            return;
        }

        var i = 0,
            len = props.length,
            prop;

        for( i ; i < len ; i++ ) {
            prop = props[ i ];
            
            if( source.hasOwnProperty( prop ) ) {
                target[ prop ] = source[ prop ];
            }
        }
    }
    function makeRegexWithCapture( attribute ) {
        return new RegExp( attribute + ":\\s*([^;]*);" , "gi" );
    }
    function getRegexCapture( string , regex ) {
        var capture;
        string.replace( regex , function() {
            capture = arguments;
        } );
        return capture;
    }

    function appendOverlay( overlay ) {
        var obj = this;

        if( overlay !== undefined ) {
            if( obj.overlays instanceof Array ) {
                obj.overlays.push( overlay );
            } else if( typeof obj.overlays === "object" && overlay.overlayId ) {
                obj.overlays[ overlay.overlayId ] = overlay;
            } else {
                Util.debug.error( "Cannot append \"" + overlay.overlayId  + "\" to <" + this.constructor + "> types" );
            }
        }
        return obj;
    }

    function CSExtensions() {
        this.setKeyValue = function( key , value ) {
            if( typeof key !== "string" && value === undefined ) {
                return;
            }
            this[ key ] = value;
            return this;
        };
        this.getKeyValue = function() {
            var args = Array.prototype.slice.call( arguments );
            return Overlay.prototype.getKeyValue.apply( this , args );
        };
        this.addOverlayByReference = function( overlayId ) {
            if( overlayId !== undefined ) {
                if( this.overlays instanceof Array ) {
                    this.overlays.push( { "overlayId": overlayId } );   
                } else {
                    Util.debug.error( "Cannot append \"" + overlayId  + "\" to <" + this.constructor + "> types" );
                }
            }
            return this;
        };
        this.appendOverlay = appendOverlay;

        return this;
    }

    var textAlignRegex = makeRegexWithCapture( "text-align" ),
        lineHeightRegex = makeRegexWithCapture( "line-height" ),
        letterSpacingRegex = makeRegexWithCapture( "letter-spacing" ),
        textColorRegex = makeRegexWithCapture( "color" ),
        fontSizeRegex = makeRegexWithCapture( "font-size" ),
        customFontRegex = makeRegexWithCapture( "font-family" );

    function HTMLText() {
        this.setCommonText = function( text ) {
            return "<div style=\"text-align: left; line-height: 28px;\"><span style=\"letter-spacing: 0px;\"><span style=\"color:#000000;\"><span style=\"font-size: 24px; font-family: ArialMT, Arial;\">" + text + "</span></span></span></div>";
        };
        this.setCustomText = function( text ) {
            return "<div style=\"text-align: left; line-height: 28px;\"><span style=\"letter-spacing: 0px;\"><span style=\"color:#000000;\"><span class=\"sm-font-family\" style=\"font-family:HelveticaNeue-Regular,'Helvetica Neue';font-style:normal;font-weight:normal;\"><span class=\"sm-font-style\"><span style=\"font-size:24px;\">" + text + "</span></span></span></span></span></div>";
        };
        this.getTextAlign = function() {
            return getRegexCapture( this.text , textAlignRegex )[ 1 ];
        };
        this.getLineHeight = function() {
            return getRegexCapture( this.text , lineHeightRegex )[ 1 ];
        };
        this.getLetterSpacing = function() {
            return getRegexCapture( this.text , letterSpacingRegex )[ 1 ];
        };
        this.getColor = function() {
            return getRegexCapture( this.text , textColorRegex )[ 1 ];
        };
        this.getFontSize = function() {
            return getRegexCapture( this.text , fontSizeRegex )[ 1 ];
        };
        this.setText = function( text ) {
            var textOverlay = this;
            
            // Html text is really difficult with the DOM
            if( text ) {
                this._text = text;
                this.text = this.setCommonText( text );
            }
            

            function setTextAlign( textAlign ) {
                textOverlay.text = textOverlay.text.replace( textAlignRegex , function( match ) {
                    match = match.replace( new RegExp( "left|center|right|justify" , "gi" ) , textAlign );
                    // log( "Setting text alignment to: " + options[ key ] );
                    return match;
                } );

                return textOverlay;
            }
            function setLineHeight( lineHeight ) {
                textOverlay.text = textOverlay.text.replace( lineHeightRegex , function( match ) {
                    match = match.replace( new RegExp( "\\d*px" , "gi" ) , lineHeight );
                    // log( "Setting text line height to: " + options[ key ] );
                    return match;
                } );

                return textOverlay;
            }
            function setLetterSpacing( letterSpacing ) {
                textOverlay.text = textOverlay.text.replace( letterSpacingRegex , function( match ) {
                    match = match.replace( new RegExp( "\\d*px" , "gi" ) , letterSpacing );
                    // log( "Setting text letter spacing to: " + options[ key ] );
                    return match;
                } );

                return textOverlay;
            }
            function setColor( hexColor ) {
                textOverlay.text = textOverlay.text.replace( textColorRegex , function( match ) {
                    match = match.replace( new RegExp( "#\\d*" , "gi" ) , hexColor );
                    // log( "Setting text color to: " + options[ key ] );
                    return match;
                } );

                return textOverlay;
            }
            function setFontSize( fontSize ) {
                textOverlay.text = textOverlay.text.replace( fontSizeRegex , function( match ) {
                    match = match.replace( new RegExp( "\\d*px" , "gi" ) , fontSize );
                    // log( "Setting text font size to: " + options[ key ] );
                    return match;
                } );

                return textOverlay;
            }
            function setCustomFont( customFont , customFontFamily ) {
                var customText = textOverlay.setCustomText( text ),
                    textAlign = textOverlay.getTextAlign(),
                    lineHeight = textOverlay.getLineHeight(),
                    letterSpacing = textOverlay.getLetterSpacing(),
                    color = textOverlay.getColor(),
                    fontSize = textOverlay.getFontSize();
                
                customText = customText.replace( customFontRegex , function( match ) {
                    match = "font-family:" + customFont + ",'" + customFontFamily + "'";
                    // log( "Setting text font to: " + customFont + " with family: " + customFontFamily );
                    return match;
                } );

                textOverlay.text = customText;

                // Reapply styles
                if( textAlign ) {
                    setTextAlign.call( textOverlay , textAlign );
                }
                if( lineHeight ) {
                    setLineHeight.call( textOverlay , lineHeight );
                }
                if( letterSpacing ) {
                    setLetterSpacing.call( textOverlay , letterSpacing );
                }
                if( color ) {
                    setColor.call( textOverlay , color );
                }
                if( fontSize ) {
                    setFontSize.call( textOverlay , fontSize );
                }

                return textOverlay;
            }
            function setCommonText() {
                var commonText = textOverlay.setCommonText( textOverlay._text || "" ),
                    textAlign = textOverlay.getTextAlign(),
                    lineHeight = textOverlay.getLineHeight(),
                    letterSpacing = textOverlay.getLetterSpacing(),
                    color = textOverlay.getColor(),
                    fontSize = textOverlay.getFontSize();

                textOverlay.text = commonText;

                // Reapply styles
                if( textAlign ) {
                    setTextAlign.call( textOverlay , textAlign );
                }
                if( lineHeight ) {
                    setLineHeight.call( textOverlay , lineHeight );
                }
                if( letterSpacing ) {
                    setLetterSpacing.call( textOverlay , letterSpacing );
                }
                if( color ) {
                    setColor.call( textOverlay , color );
                }
                if( fontSize ) {
                    setFontSize.call( textOverlay , fontSize );
                }

                return textOverlay;
            }
            function removeTempValues() {
                delete textOverlay._text;
            }

            return {
                setTextAlign: setTextAlign.bind( textOverlay ),
                setLineHeight: setLineHeight.bind( textOverlay ),
                setLetterSpacing: setLetterSpacing.bind( textOverlay ),
                setColor: setColor.bind( textOverlay ),
                setFontSize: setFontSize.bind( textOverlay ),
                setCustomFont: setCustomFont.bind( textOverlay ),
                setCommonText: setCommonText.bind( textOverlay ),
                removeTempValues: removeTempValues.bind( textOverlay )
            };
        };
        
        return this;
    }

    function Json() {
        return {
           "metaData": {
                "applicationStartPage": "pageSet1",
                // "shortTitle": "sketch_plugin",
                "startPage": "pageSet1",
                // "title": "sketch_plugin",
                "_version": "",
                "_checkLogin": 1,
                "_applicationLoginPage": "",
                "resetTextCss": resetTextCss
            },
            "pageSets": {
                "pageSet1": {
                    "pages": [],
                    "transitionDuration": 0.4,
                    "transitionTypeNext": "slide",
                    "transitionTypePrevious": "slideBack",
                    "pageSetId": "pageSet1",
                    "displayName": "Page Set 1"
                }
            },
            "pages": {
                "page1": {
                    "backgroundColor": "#FFFFFF",
                    "overlays": [],
                    "pageId": "page1",
                    "title": "",
                    "backgroundImageScaleMode": "center",
                    "displayName": "Page 1"
                }
            },
            "overlays": {},
            "actions": {},
            "animations": {
                "fadeIn": {
                    "displayName": "Fade In",
                    "type": "Animation",
                    "properties": [
                        {
                            "animationFunction": "EaseInOut",
                            "autoreverses": false,
                            "duration": 0.5,
                            "property": "alpha",
                            "repeatCount": 0,
                            "toValue": 1
                        }
                    ]
                },
                "fadeOut": {
                    "displayName": "Fade Out",
                    "type": "Animation",
                    "properties": [
                        {
                            "animationFunction": "EaseInOut",
                            "duration": 0.5,
                            "property": "alpha",
                            "toValue": 0
                        }
                    ]
                }
            },
            "screenSupport": {
                "screens": [
                    {
                        "fonts": [
                            {
                                "fontName": "arial",
                                "fontSize": 14,
                                "name": "Normal"
                            }
                        ],
                        "height": 768,
                        "orientation": "landscape",
                        "suffix": "",
                        "width": 1024
                    }
                ],
                "useScreenRatio": true
            },
            "schema": schema
        };
    }
    
    function embedContentSpecReference( target , contentSpec ) {
        if( !target.contentSpec ) {
            target.contentSpec = contentSpec;
        }
    }

    function ContentSpec() {
        var schema = schema;
        this.objectId = 1;
        this.pageId = 1;
        this.resetTextCss = resetTextCss;
        this.json = new Json();

        return this;
    }
    // mixin( ContentSpec.prototype , new CSExtensions() , [ "appendOverlay"] );
    ContentSpec.prototype.appendOverlay = function( overlay ) {
        appendOverlay.call( this.json , overlay );
    };
    ContentSpec.prototype.generateId = function( type ) {
        if( type === "overlay" ) {
            return "object" + this.objectId++;
        } else if( type === "page" ) {
            return "page" + this.pageId++;
        }
    };
    ContentSpec.prototype.getJson = function() {
        return this.json;
    };
    ContentSpec.prototype.getResetCss = function() {
        return this.resetTextCss;
    };
    ContentSpec.prototype.appendPage = function( page ) {
        var pageId,
            json = this.json;
        if( page instanceof Page ) {
            pageId = page.getPageId();
            if( json.pages[ pageId ] ) {
                log( "Overwriting page <" + pageId + ">" );
            }
            json.pages[ pageId ] = page;
        }
    };
    ContentSpec.prototype.create = function( type ) {
        if( type === "page" ) {
            embedContentSpecReference( Page.prototype , this );
            return new Page();
        } else if( type === "image" ) {
            embedContentSpecReference( SMImage.prototype , this );
            return new SMImage();
        } else if( type === "cgbutton" ) {
            embedContentSpecReference( SMCGButton.prototype , this );
            return new SMCGButton();
        } else if( type === "button" ) {
            embedContentSpecReference( SMButton.prototype , this );
            return new SMButton();
        } else if( type === "container" ) {
            embedContentSpecReference( SMContainer.prototype , this );
            return new SMContainer();
        } else if( type === "text" ) {
            embedContentSpecReference( SMText.prototype , this );
            return new SMText();
        } else {
            embedContentSpecReference( Overlay.prototype , this );
            return new Overlay();
        }
    };
    ContentSpec.prototype.addFontMetaData = function( font ) {
        var fileName = font.fileName,
            postScriptName = font.postScriptName,
            fullName = font.fullName,
            familyName = font.familyName,
            style = font.style;

        if( !fileName || !postScriptName || !fullName || !familyName || !style ) {
            return;
        }

        if( !this.json.metaData.customFonts ) {
            this.json.metaData.customFonts = [];
        }
        if( !this.json.metaData.fonts ) {
            this.json.metaData.fonts = [];
        }

        if( this.json.metaData.customFonts.indexOf( fileName ) > -1 ) {
            return;
        }

        this.json.metaData.customFonts.push( fileName );
        this.json.metaData.fonts.push( {
            familyName: familyName,
            file: {},
            fileName: fileName,
            fullName: fullName,
            postScriptName: postScriptName,
            style: style
        } );
    };

    function Page() {
        this.backgroundColor = "#FFFFFF";
        this.overlays = [];
        this.pageId = null;
        this.title = "";
        this.backgroundImageScaleMode = "center";
        this.displayName = "";

        return this;
    }
    mixin( Page.prototype , new CSExtensions() , [ "setKeyValue" , "getKeyValue" , "addOverlayByReference" ] );
    Page.prototype.setPageId = function( pageId ) {
        if( !this.pageId && pageId === undefined ) {
            pageId = this.contentSpec.generateId( "page" );
        }

        this.pageId = pageId;
    };
    Page.prototype.getPageId = function() {
        return this.pageId;
    };
    Page.prototype.addToPageSet = function( pageSetId ) {
        var json = this.contentSpec.json;
        if( json.pageSets[ pageSetId ] ) {
            json.pageSets[ pageSetId ].pages.push( this.getPageId() );
        } else if( json.pageSets[ defaultPageSetId ] ) {
            json.pageSets[ defaultPageSetId ].pages.push( this.getPageId() );
        }
    };

    function Overlay( type ) {
        this.overlayId = null;
        this.displayName = "";
        this.type = type || "";
        this.widget = type || "";
        this.relative = "parent";
        this.borderAlpha = 1;
        this.hidden = false;
        this.scale = 1;
        this.alpha = 1;
        this.layouts = {
            landscape: {
                width: "50px",
                height: "50px",
                x: "512px",
                y: "384px",
                horizontalAlign: "left",
                verticalAlign: "top"
            }
        };

        return this;
    }
    mixin( Overlay.prototype , new CSExtensions() , [ "setKeyValue" , "getKeyValue" , "appendOverlay" , "addOverlayByReference" ] );

    Overlay.prototype.setOverlayId = function( overlayId ) {
        if( this.overlayId && overlayId === undefined ) {
            overlayId = this.overlayId;
        } else if( !this.overlayId && overlayId === undefined ) {
            overlayId = this.contentSpec.generateId( "overlay" );
        }
        this.overlayId = overlayId;
    };
    Overlay.prototype.getOverlayId = function() {
        return this.overlayId;
    };
    Overlay.prototype.setLayouts = function( orientation , data ) {
        var key;
        orientation = ( orientation === "landscape" || orientation === "portrait" ) ? orientation : "landscape";

        if( typeof data === "object" ) {
            for( key in data ) {
                this.layouts[ orientation ][ key ] = data[ key ];
            }   
        }
    };
    // @desc convert overlay to an alternative overlay type
    // @param {string} newOverlay - type of alternative overlay
    // @param {...string} exemption - overlay properties that will not be
    Overlay.prototype.convertToOverlay = function( newOverlay , exemption ) {
        var key,
            exemptions = Array.prototype.slice.call( arguments ),
            oldOverlayType = this.type,
            newOverlayType = newOverlay,
            messages = [];
        newOverlay = this.contentSpec.create( newOverlay );
        exemptions.shift();

        if( this.constructor !== newOverlay.constructor ) {
            for( key in this ) {

                // Overlay property does not exist in alternative overlay type
                if( this.hasOwnProperty( key ) && !newOverlay.hasOwnProperty( key ) ) {
                    if( exemptions.indexOf( key ) < 0 ) {
                        messages.push( "Converting overlay to " + newOverlayType + ", deleting \"" + key + "\" from " + oldOverlayType );
                        delete this[ key ]; 
                    }
                }
            }
            for( key in newOverlay ) {
                if( newOverlay.hasOwnProperty( key ) && 
                    newOverlay[ key ] !== undefined && newOverlay[ key ] !== null ) {
                    if( exemptions.indexOf( key ) < 0 || this[ key ] === undefined || this[ key ] === null ) {
                        this[ key ] = newOverlay[ key ];
                    }   
                }
            }
            this.constructor = newOverlay.constructor;
        }
        log( messages.join( "\n" ) );
    };

    function SMImage( overlayId , displayName ) {
        Overlay.call( this , "image" );

        if( overlayId ) { this.overlayId = overlayId; }
        if( displayName ) { this.displayName = displayName; }

        return this;
    }
    extend( Overlay , SMImage );
    function SMButton( overlayId , displayName ) {
        Overlay.call( this , "button" );

        this.widget = "image_button";
        this.scaleMode = "fill";
        this.cornerRadius = "0px";
        this.borderWidth = "0px";
        this.borderColor = "#999999";
        this.toggle = false;
        this.images = [ "" ];
        this.imagesDown = [ "" ];
        this.actions = [];

        if( overlayId ) { this.overlayId = overlayId; }
        if( displayName ) { this.displayName = displayName; }

        return this;
    }
    extend( Overlay , SMButton );
    function SMCGButton( overlayId , displayName ) {
        Overlay.call( this , "button" );

        this.borderAlpha = 1;
        this.cgBorderColor = "#0099BB";
        // this.cgBorderAlpha = 1; // Not supported in Studio
        this.cgBorderWidth = "2px";
        this.cgButtonColor = "#FFFFFF";
        // this.cgButtonAlpha = 1; // Not supported in Studio
        this.cgButtonPressedAlpha = 1;
        this.cgButtonPressedColor = "#0099BB";
        this.cgButtonShineEffect = false;
        this.cgCornerRadius = "10px";
        this.cgUseInteriorBorder = false;
        this.fixedSize = true;
        this.font = "Arial-BoldMT";
        this.fontColor = "#0099BB";
        this.fontPressedColor = "#FFFFFF";
        this.fontSize = "1.1em";
        this.multiline = true;
        this.textAlign = "center";
        this.textPadding = "10px";
        this.toggle = false;
        this.clipToBounds = true;
        this.actions = [];

        if( overlayId ) { this.overlayId = overlayId; }
        if( displayName ) { this.displayName = displayName; }

        return this;
    }
    extend( Overlay , SMCGButton );
    function SMContainer( overlayId , displayName ) {
        Overlay.call( this , "container" );
        this.overlays = [];

        this.backgroundAlpha = 0.1;
        this.backgroundColor = "#FFFFFF";
        this.backgroundPosition = "center-center";
        this.backgroundRepeat = "repeat-none";
        this.borderColor = "#999999";
        this.borderWidth = "0px";
        this.clipToBounds = true;
        this.contentHeight = "0px";
        this.contentOffsetX = "0px";
        this.contentOffsetY = "0px";
        this.contentWidth = "0px";
        this.cornerRadius = "0px";
        this.paging = false;
        this.scrollerStyle = "black";
        this.userScrolling = "none";
        this.userScrollingBounces = true;
        this.clickThrough = false;
        this.draggable = false;

        if( overlayId ) { this.overlayId = overlayId; }
        if( displayName ) { this.displayName = displayName; }

        return this;
    }
    extend( Overlay , SMContainer );
    function SMText( overlayId , displayName ) {
        Overlay.call( this , "text" );

        this.widget = "text_complex";
        this.plugin = "text_complex.smp";
        this.text = "";
        this.html = true;
        this.bounces = false;
        this.size = "0em";
        this.userScrolling = "none";

        if( overlayId ) { this.overlayId = overlayId; }
        if( displayName ) { this.displayName = displayName; }

        return this;
    }
    extend( Overlay , SMText );
    SMText.prototype.setText = function( text ) {
        this.text = text;
    };
    HTMLText.call( SMText.prototype );

    return ContentSpec;
} ( ContentSpec ) );