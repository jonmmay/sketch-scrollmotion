@import "../util.js";
// @import "sketchLayerUtil.js";
@import "../Config.js";
@import "../View.js";
@import "../CS.js";


var TextSwap = ( function() {

	function rectForOverlay( view, parentView ) {
        var pos = parentView ? view.getLayoutRelativeTo( parentView ) : view.getAbsoluteLayout();

        return {
            width: util.toPx( pos.width ),
            height: util.toPx( pos.height ),
            x: util.toPx( pos.x ),
            y: util.toPx( pos.y )
        };
    }
    function getRgba( color ) {
        var rgba,
            retRgba = { r:0.0, g:0.0, b:0.0, a: 1.0 };

        if( color.className && String( [color className] ) === "MSColor" ) {
            // (r:0.816204 g:0.007513 b:0.106696 a:1.000000)
            rgba = [color RGBADictionary];

            util.forEach( rgba, function( val, key ) {
                retRgba[ key ] = key !== "a" ? Math.round( Number( val ) * 255 ) : Number( val );
            } );
        } else if( ( /^rgba?\((?:\d\.\d*,?){3,4}\)$/ ).test( String( color ) ) ) {
            // rgba(0.290196,0.290196,0.290196,1.000000)
            rgba = String( color ).match( new RegExp( "\\(([^\\)]*)\\)" ) )[ 1 ].split( "," );

            Object.keys( retRgba ).forEach( function( key, i ) {
                if( rgba[ i ] ) {
                    retRgba[ key ] = key !== "a" ? Math.round( Number( rgba[ i ] ) * 255 ) : Number( rgba[ i ] );
                }
            } );
        }

        return retRgba;
    }
    function getCSFontNames( fontFamily ) {
    	var nameMatches    = fontFamily.match( new RegExp( "^([^,]*)(?:,\\s?'([^']*)')?$" ) ),
            postScriptName = nameMatches[ 1 ],
            familyName     = nameMatches[ 2 ]; // Won't exist post SEP 3.20

        return {
            postScriptName : postScriptName,
            familyName     : familyName || null
        };
    }

	/**
        * @desc Get text attributes from text layer
        * @param {MSTextLayer} textLayer -
        * @returns {object[]} - array of nodes compatible with cs getTextNodeStyles helper
    */
    function getTextAttributedNodes( textLayer ) {
        var attrString 	= [textLayer attributedString],
            // Get text attributes as array separated by styling
            attrsArr 	= [attrString treeAsDictionary].value.attributes,
            alignValues = [ "left", "right", "center", "justify", "natural" ],
            nodes 		= [];

        util.forEach( attrsArr, function( attrs ) {
            var tempNodes 	= [],
                node 		= {
	                index: 			Number( attrs.location ),
	                stringValue: 	String( attrs.text ),
	                length: 		Number( attrs.length ),
	                style: 			{}
            	},
            	style = node.style;

            // NSColor
            style.color = util.rgbToHex.apply( null, util.values( getRgba( attrs.NSColor.color ) ) );

            // NSFont
            style[ "font-size" ] = util.toPx( attrs.NSFont.attributes.NSFontSizeAttribute );
            style[ "font-family" ] = String( attrs.NSFont.attributes.NSFontNameAttribute );

            // Font family format prior to SEP 3.20
            style[ "font-family" ] += ", '" + attrs.NSFont.family  + "'";

            // NSParagraphStyle
            if( attrs.NSParagraphStyle ) {
                style[ "text-align" ] = Number( attrs.NSParagraphStyle.style.alignment );
                // Return "natural" alignment as left
                style[ "text-align" ] = ( style[ "text-align" ] == alignValues.indexOf( "natural" ) ) ? alignValues[ 0 ] : alignValues[ style[ "text-align" ] ];

                if( attrs.NSParagraphStyle.style.maximumLineHeight > 0 ) {
                    // maximumLineHeight and minimumLineHeight should be the same value
                    style[ "line-height" ] = util.toPx( attrs.NSParagraphStyle.style.maximumLineHeight );
                }
            } else {
                style[ "text-align" ] = "left";
            }

            // Optional NSKern
            if( attrs.NSKern ) {
                style[ "letter-spacing" ] = util.toPx( attrs.NSKern );
            }

            // Line breaks
            tempNodes = node.stringValue.split( "\n" ).map( function( subnodeStr, i, arr ) {
                var subnode 	= util.naiveClone( node ),
                    indexCount 	= 0;

                subnode.stringValue = subnodeStr;
                subnode.length = subnodeStr.length;

                if( i > 0 ) {
                    subnode.leadingLineBreak = true;
                }

                while( indexCount < i ) {
                    subnode.index += arr[ indexCount ].length;
                    indexCount += 1;
                }

                return subnode;
            } );

            // Remove nodes without text and line breaks
            tempNodes = tempNodes.reduce( function( prev, curr ) {
                if( curr.length === 0 && !curr.leadingLineBreak ) {
                    // Exclude current value and return array
                    return prev;
                } else {
                    // Add current value to array
                    return prev.concat( curr );
                }
            }, [] );

            nodes = nodes.concat( tempNodes );
        } );

        return nodes;
   }

	return util.Object.extend( {
		init: function( ctx ) {
			this._super( ctx );

			this.config  = Config.create( ctx );
            this.view    = View.create( ctx );
            this.cs      = ContentSpec.create( ctx );

            this.orientation        = "landscape";
            this.shouldMergeLayerCS = !this.config.getSettingsKeyValue( "cleanExport" );
		},
		makeSketchLayer: function( overlay ) {},
        setSMOrientationForCS: function( orientation ) {
            orientation = [ "landscape", "portrait" ].indexOf( orientation ) > -1 ? orientation : "landscape";

            this.orientation = orientation;
        },
		makeSMOverlay: function( layerView, parentView ) {
			var cs                 = this.cs,
                view               = this.view,
                orientation        = this.orientation,
                shouldMergeLayerCS = this.shouldMergeLayerCS,

                id = String( [( layerView.layer ) objectID] ),
                rect,

                overlay         = cs.make( "text_complex" ),
                layerCS         = layerView.getLayerCS(),
                overlayExports  = [];

            parentView = parentView || layerView.parentGroup;

            // Get text nodes and node styles
            overlay.setTextNodes( getTextAttributedNodes( layerView.layer ) );
            // Transform nodes into html
            overlay.setTextHtml( overlay.getHtmlFromNodeStyles() );

            // Prepare text layer fonts for export
            overlay.getFontFamilies().forEach( function( name ) {
                var nameMatches     = getCSFontNames( name ),
                    postScriptName  = nameMatches.postScriptName,
                    familyName      = nameMatches.familyName, // Won't exist post SEP 3.20
                    font;

                // Create font
                if( postScriptName ) {
                    font = [NSFont fontWithName:postScriptName size:0.0];
                }

                // Add font object to overlay exports
                if( font ) {
                    overlayExports.push( util.Command.create(
                        // Execute
                        function( fontFound ) {
                            if( !fontFound ) {
                                // Revert custom font overlays to default font/text
                                overlay.setTextNodes( overlay.getTextNodeStyles().map( function( node ) {
                                    var foundPostScriptName;

                                    if( node.style[ "font-family" ] ) {
                                        // foundPostScriptName = node.style[ "font-family" ].replace( /^([^,]*).*/, "$1" );
                                        foundPostScriptName = getCSFontNames( node.style[ "font-family" ] ).postScriptName;

                                        if( foundPostScriptName === postScriptName ) {
                                            node.style[ "font-family" ] = overlay.getTextDefaultStyleFor( "font-family" );
                                            // Clean up associated tags
                                            if( node.style[ "font-style" ] ) {
                                                delete node.style[ "font-style" ];
                                            }
                                            if( node.style[ "font-weight" ] ) {
                                                delete node.style[ "font-weight" ];
                                            }
                                        }
                                    }

                                    return node;
                                } ) );

                                overlay.setTextHtml( overlay.getHtmlFromNodeStyles() );
                            }
                        },

                        // Undo
                        function() {},

                        // Value
                        {
                            getView: function() { return layerView },
                            fontName: postScriptName,
                            font: font
                    } ) );
                } else {
                    // TO DO: what to do if font isn't found?
                }
            } );

            rect = rectForOverlay( layerView, parentView );
            overlay.setLayouts( orientation, util.merge( rect, {
                "horizontalAlign": "left",
                "verticalAlign": "top"
            } ) );
            overlay.setKeyValue( "displayName", layerView.getSanitizedName() );

            overlay.setKeyValue( "hidden", layerView.isHidden() );
            overlay.setKeyValue( "alpha", Number( [[[( layerView.layer ) style] contextSettings] opacity] ) );

            // Merge preexisting content spec properties
            if( layerCS && shouldMergeLayerCS ) {
                // Clear layer content spec if overlay is a different type
                if( cs.typeofOverlay( layerCS ) !== cs.typeofOverlay( overlay.value() ) ) {
                    layerCS = layerView.clearLayerCS().getLayerCS();
                } else {
                    // Set preexisting overlay id
                    id = layerCS.overlayId ? layerCS.overlayId : id;
                }

                overlay.setValue( util.merge( layerCS, overlay.value() ) );
            }

            overlay.setOverlayId( id );

            return {
            	overlay: overlay,
            	exports: overlayExports
            };
		}
	} );
} )();