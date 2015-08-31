/* global log */

var ContentSpec = ContentSpec || ( function() {
	"use strict";

	var resetTextCss = "reset3.11.css",
		schema = "http://www.scrollmotion.com/contentspec/schema/3.12/",
		JSON = {},
		ObjectId = 1,
		PageId = 1;

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

	function generateId( type ) {
		if( type === "overlay" ) {
			return "object" + ObjectId++;
		} else if( type === "page" ) {
			return "page" + PageId++;
		}
    }

	function newJSON() {
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

	function Page() {
        this.backgroundColor = "#FFFFFF";
        this.overlays = [];
        this.pageId = null;
        this.title = "";
        this.backgroundImageScaleMode = "center";
        this.displayName = "";
	}

	Page.prototype.setPageId = function( pageId ) {
		if( !this.pageId && pageId === undefined ) {
			pageId = generateId( "page" );
		}

		this.pageId = pageId;
	};
	Page.prototype.getPageId = function() {
		return this.pageId;
	};
	Page.prototype.addOverlayByReference = function() {
		var args = Array.prototype.slice.call( arguments );
		return Overlay.prototype.addOverlayByReference.apply( this , args );
	};
	Page.prototype.setKeyValue = function() {
		var args = Array.prototype.slice.call( arguments );
		return Overlay.prototype.setKeyValue.apply( this , args );
	};
	Page.prototype.getKeyValue = function() {
		var args = Array.prototype.slice.call( arguments );
		return Overlay.prototype.getKeyValue.apply( this , args );
	};
	Page.prototype.addToPageSet = function( pageSetId ) {
		if( JSON.pageSets[ pageSetId ] ) {
			JSON.pageSets[ pageSetId ].pages.push( this.getPageId() );
		} else if( JSON.pageSets.pageSet1 ) {
			JSON.pageSets.pageSet1.pages.push( this.getPageId() );
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
		this.clickThrough = false;
		this.draggable = false;
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
		this.actions = [];
	}

	Overlay.prototype.setOverlayId = function( overlayId ) {
		if( !this.overlayId && overlayId === undefined ) {
			overlayId = generateId( "overlay" );
		}

		this.overlayId = overlayId;
	};
	Overlay.prototype.getOverlayId = function() {
		return this.overlayId;
	};
	Overlay.prototype.setKeyValue = function( key , value ) {
		if( typeof key !== "string" && value === undefined ) {
			return;
		}
		this[ key ] = value;
	};
	Overlay.prototype.getKeyValue = function( key ) {
		if( this[ key ] !== undefined ) {
			return this[ key ];
		}
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

	Overlay.prototype.appendOverlay = function( overlay ) {
		if( overlay !== undefined ) {
			if( this.overlays instanceof Array ) {
				this.overlays.push( overlay );
			} else if( typeof this.overlays === "object" && overlay.overlayId ) {
				this.overlays[ overlay.overlayId ] = overlay;
			} else {
				log( "Cannot append to non-" + this.constructor + " types" );
			}
		}
		return this;
	};
	Overlay.prototype.addOverlayByReference = function( overlayId ) {
		if( overlayId !== undefined ) {
			if( this.overlays instanceof Array ) {
				this.overlays.push( { "overlayId": overlayId } );	
			} else {
				log( "Cannot append to non-Container overlay types" );
			}
		}
		return this;
	};

	// @desc convert overlay to an alternative overlay type
    // @param {string} newOverlay - type of alternative overlay
    // @param {...string} exemption - overlay properties that will not be
	Overlay.prototype.convertToOverlay = function( newOverlay , exemption ) {
		var key,
			args = Array.prototype.slice.call( arguments ),
			oldOverlayType = this.type,
			newOverlayType = newOverlay,
			messages = [];
		newOverlay = create( newOverlay );
		args.shift();

		if( this.constructor !== newOverlay.constructor ) {
			for( key in this ) {

				// Overlay property does not exist in alternative overlay type
				if( this.hasOwnProperty( key ) && !newOverlay.hasOwnProperty( key ) ) {
					if( args.indexOf( key ) < 0 ) {
						messages.push( "Converting overlay to " + newOverlayType + ", deleting \"" + key + "\" from " + oldOverlayType );
						delete this[ key ];	
					}
				}
			}
			for( key in newOverlay ) {
				if( newOverlay.hasOwnProperty( key ) && 
					newOverlay[ key ] !== undefined && newOverlay[ key ] !== null ) {
					if( args.indexOf( key ) < 0 || this[ key ] === undefined || this[ key ] === null ) {
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
	}
	extend( Overlay , SMImage );
	function SMButton( overlayId , displayName ) {
		Overlay.call( this , "button" );

		this.images = [ "" ];
		this.imagesDown = [ "" ];

		if( overlayId ) { this.overlayId = overlayId; }
		if( displayName ) { this.displayName = displayName; }
	}
	extend( Overlay , SMButton );
	function SMCGButton( overlayId , displayName ) {
		Overlay.call( this , "button" );

		this.cgBorderColor = "#0099BB";
		this.cgBorderAlpha = 1;
        this.cgBorderWidth = "2px";
        this.cgButtonColor = "#FFFFFF";
        this.cgButtonAlpha = 1;
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

		if( overlayId ) { this.overlayId = overlayId; }
		if( displayName ) { this.displayName = displayName; }
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

		if( overlayId ) { this.overlayId = overlayId; }
		if( displayName ) { this.displayName = displayName; }
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
	}
	extend( Overlay , SMText );

	SMText.prototype.setBasicText = function( text ) {
		// this.text = "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">" + text + "</span></div>";
		this.text = "<div style=\"text-align:left;\"><span style=\"font-size:16px;font-family:ArialMT,'Arial';color:#000000;\">" + text + "</span></div>";
	};
	
	function init() {
		JSON = newJSON();
	}

	function create( type ) {
		if( type === "page" ) {
			return new Page();
		} else if( type === "image" ) {
			return new SMImage();
		} else if( type === "cgbutton" ) {
			return new SMCGButton();
		} else if( type === "button" ) {
			return new SMButton();
		} else if( type === "container" ) {
			return new SMContainer();
		} else if( type === "text" ) {
			return new SMText();
		} else {
			return new Overlay();
		}
	}

	init();
	return {
		json: function() {
			return JSON;
		},
		appendOverlay: function() {
			var args = Array.prototype.slice.call( arguments );
			return Overlay.prototype.appendOverlay.apply( JSON , args );
		},
		appendPage: function( page ) {
			if( page !== undefined ) {
				if( page.pageId ) {
					JSON.pages[ page.pageId ] = page;
				}
			}
		},
		getResetCSS: function() {
			return resetTextCss;
		},
		create: create,
		addPage: function( page ) {
			var pageId;
			if( page instanceof Page ) {
				pageId = page.getPageId();
				if( JSON.pages[ pageId ] ) {
					log( "Overwriting page: <" + pageId + ">" );
				}
				JSON.pages[ pageId ] = page;
			}
		}

	};
} () );