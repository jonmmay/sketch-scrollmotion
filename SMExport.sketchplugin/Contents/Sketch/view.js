/* global Util , CocoaBridge */

@import "cocoaBridge.js";
@import "config.js";

// TO DO: Change "Artboard" to "masterGroup" to align with "parentGroup"
// TO DO: Identify hidden layers

var View = ( function( _View , CB ) {
	"use strict";
	if( _View ) { Util.log( "Sorry! We're overwriting View: " + _View ); }
	
	var ViewCache = {
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
			}
		},
		defaultName = "untitled";

	function View( layer , parentGroup ) {
		var id = String( layer.objectID() ),
			_cacheView = ViewCache.get( id );

		if( _cacheView ) {
			return _cacheView;
		}
		if( !layer || !layer.className ) {
			return undefined;
		}

		this.layer = layer;
		this.parentGroup = ( parentGroup instanceof this.constructor ) ? parentGroup : null;
		this.id = id;
		this.name = String( layer.name() );
		this.className = String( layer.className() );
		this.hasSubviews = this.hasSubviews();
		// this.exportFiles = [];

		ViewCache.add( this );
	}

	View.prototype.disableMask = function() {
		if( this.doNotTraverse() ) {
			return;
		}

		// This should apply to all sublayers, not just those defined for export
		var sublayers = this.layer.layers();

		Util.forEach( sublayers , function( sublayer ) {
			var name = sublayer.name() + "@@mask";

			if( sublayer.hasClippingMask() ) {
				// If native mask is found, disable mask for export 
				// And tag the layer for later re-enabling
				Util.log( "Disabling mask for layer <" + sublayer.name + ">" );
				sublayer.setName( name );
				sublayer.setHasClippingMask( false );
			}
		} );

		// Force redraw
		this.layer.resizeRoot( true );
	};
	View.prototype.enableMask = function() {
		if( this.doNotTraverse() ) {
			return;
		}

		// This should apply to all sublayers, not just those defined for export
		var sublayers = this.layer.layers();

		Util.forEach( sublayers , function( sublayer ) {
			var name = String( sublayer.name() );
			if( name.indexOf( "@@mask" ) !== -1 ) {
				Util.log( name );
				name = name.replace( new RegExp( "@@mask" , "g" ) , "" );
				sublayer.setName( name );
				sublayer.setHasClippingMask( true );
			}
		} );
	};
	View.prototype.disableHidden = function() {
		if( this.doNotTraverse() ) {
			return;
		}

		// This should apply to all sublayers, not just those defined for export
		var sublayers = this.layer.layers();

		Util.forEach( sublayers , function( sublayer ) {
			var name = sublayer.name() + "@@hidden";

			if( !sublayer.isVisible() ) {
				// If native hidden is found, disable hidden for export 
				// And tag the layer for later re-enabling
				Util.log( "Disabling hidden for layer <" + sublayer.name + ">" );
				sublayer.setName( name );
				sublayer.setIsVisible( true );
			}
		} );
	};
	View.prototype.enableHidden = function() {
		if( this.doNotTraverse() ) {
			return;
		}

		// This should apply to all sublayers, not just those defined for export
		var sublayers = this.layer.layers();

		Util.forEach( sublayers , function( sublayer ) {
			var name = String( sublayer.name() );
			if( name.indexOf( "@@hidden" ) !== -1 ) {
				Util.log( name );
				name = name.replace( new RegExp( "@@hidden" , "g" ) , "" );
				sublayer.setName( name );
				sublayer.setIsVisible( false );
			}
		} );
	};
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
	View.prototype.isArtboard = function() {
		return this.getLayerKind() === "Artboard";
	};
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
	View.prototype.isFolder = function() {
		var layerClass = this.className;
	    return layerClass === "MSLayerGroup" || layerClass === "MSArtboardGroup";
	};
	View.prototype.shouldBeIgnored = function() {
		return this.getNameAttributes().ignore ? true : false;
	};
	View.prototype.shouldBeFlattened = function() {};
	View.prototype.shouldBeExtracted = function() {
		if( this.shouldBeIgnored() ) {
			return false;
		}
		return this.isLayer();
	};
	View.prototype.doNotTraverse = function() {
		if( !this.shouldBeExtracted() ) {
			return true;
		}
		var layerKind = this.getLayerKind(),
			className = this.className;

		if( className === "MSShapeGroup" || layerKind === "Text" || layerKind === "Bitmap" ) {
			return true;
		}

		// Do not traverse Symbols
		if( this.layer.sharedObjectID() != null ){
		    return true;
		}

		return false;
	};
	View.prototype.nameEndsWith = function( str ) {
		return String( this.name ).trim().slice( str.length ) === str;
	};
	View.prototype.hasSubviews = function() {
		if( this.shouldBeIgnored() ) {
			return false;
		}

		var subviews,
			subview,
			len,
			i = 0;

		if( this.isFolder() ) {
			subviews = this.layer.layers();
			len = subviews.count();

			for( i ; i < len ; i++ ) {
				subview = new View( CB.Array.objectAtIndex( subviews , i ) , this );
				if( subview.shouldBeExtracted() ) {
					return true;
				}
			}
		}
		return false;
	};
	View.prototype.subviews = function() {
		var subviews = [],
			that = this;

		Util.forEach( this.layer.layers() , function( subview ) {
			var view = new View( subview , that );
			if( view.shouldBeExtracted() ) {
				subviews.push( view );
			}
		} );

		return subviews;
	};
	View.prototype.parentArtboard = function() {
		var view = this.parentGroup;

		if( view === null ) {
			return false;
		}

		while( view.parentGroup !== undefined ) {
			view = view.parentGroup;
			if( view === null ) {
				return false;
			} else if( view.isArtboard() ) {
				return view;
			}
		}
	};
	
	View.prototype.getArboardDimensions = function() {
		var dim,
			view = this.parentArtboard();
		if( this.isArtboard() || !view ) {
			dim = this.getAbsoluteLayout();
		} else {
			dim = view.getAbsoluteLayout();
		}

		return {
			width: dim.width,
			height: dim.height
		};
	};
	View.prototype.getSanitizedName = function() {
		var name = this.name.replace( /(:|\/)/g , "_" )
							.replace( /__/g , "_" )
							.replace( /\[.*?\]/g , "" )
							.replace( new RegExp( "@@mask" , "g" ) , "" )
							.replace( new RegExp( "@@hidden" , "g" ) , "" );
		if( name.length === 0 ) {
			name = defaultName;
		}
		return name;
	};
	View.prototype.getNameAttributes = function() {
		var matches = this.name.match(/\[([\w\d%_,-:=]*)\]/g),
	        attrs = {},
	        tmp,
	        attrName,
	        attrArgs;

	    if( matches ) {
	        Util.forEach( matches , function( val ) {
	            // split binding into substrings by "=" to identify binding name and arguments
	            tmp = val.substring( 1 , val.length - 1 ).split( "=" );
	            attrName = tmp[ 0 ];

	            // capture arguments; guaranteed array value
	            attrArgs = tmp[ 1 ] ? tmp[ 1 ].split( "," ) : [ true ];

	            attrs[ attrName ] = attrArgs;
	        } );
	    }

	    return attrs;
	};
	View.prototype.getLayoutRelativeTo = function( view ) {
		var layout = this.getAbsoluteLayout(),
			relLayout,
			x = layout.x,
			y = layout.y;

		if( view instanceof this.constructor ) {
			relLayout = view.getAbsoluteLayout();

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
	View.prototype.getAbsoluteLayout = function() {
		var frame = this.layer.frame(),
			x = this.layer.absoluteRect().rulerX(),
			y = this.layer.absoluteRect().rulerY();

		if( this.isArtboard() ) {
			Util.log( "Zeroing Artboard x and y for <" + this.name + ">" );
			x = 0;
			y = 0;
		}

		return {
			x: x,
			y: y,
			width: frame.width(),
			height: frame.height()
		};
	};
	View.prototype.getInfluenceLayoutSansStyles = function() {
		var frame = this.getAbsoluteLayout(),
			thisView = this,
			maxWidth = frame.width,
			maxHeight = frame.height;

		if( this.hasSubviews ) {
			Util.forEach( this.subviews() , function( subview ) {
				var subviewFrame = subview.getLayoutRelativeTo( thisView );

				maxWidth = Math.max( maxWidth , subviewFrame.width + subviewFrame.x );
				maxHeight = Math.max( maxHeight , subviewFrame.height + subviewFrame.y );
			} );
		}

		frame.width = maxWidth;
		frame.height = maxHeight;
		return frame;
	};
	View.prototype.getInfluenceLayout = function() {
		var frame = this.layer.frame(),
			gkrect = CB.GKRect.rectWithRect( this.layer ),
	        absrect = this.layer.absoluteRect(),
	        rulerDeltaX,
			rulerDeltaY,
			x,
			y;

		rulerDeltaX = absrect.rulerX() - absrect.x();
	    rulerDeltaY = absrect.rulerY() - absrect.y();
	    x = Math.round( gkrect.x() + rulerDeltaX );
	    y = Math.round( gkrect.y() + rulerDeltaY );

	    return {
			x: x,
			y: y,
			width: frame.width(),
			height: frame.height()
		};
	};

	var ret = {
		create: function( layer , parent ) {
			return new View( layer , parent );
		}
	};
	ret.prototype = View.prototype;

	return ret;
} ( View , CocoaBridge ) );