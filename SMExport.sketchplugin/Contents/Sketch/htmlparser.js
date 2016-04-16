// "use strict";

/*
 * HTML Parser By John Resig (ejohn.org) -- http://ejohn.org/blog/pure-javascript-html-parser/
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * // Use like so:
 * HTMLParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * // or to get an XML string:
 * HTMLtoXML(htmlString);
 *
 * // or to get an XML DOM Document
 * HTMLtoDOM(htmlString);
 *
 * // or to inject into an existing document/DOM node
 * HTMLtoDOM(htmlString, document);
 * HTMLtoDOM(htmlString, document.body);
 *
 */
var HTMLParser = ( function() {
	function makeMap(str){
		var obj = {}, items = str.split(",");
		for ( var i = 0; i < items.length; i++ )
			obj[ items[ i ] ] = true;
		return obj;
	}

	// Regular Expressions for parsing tags and attributes
	// \u0022 - "
	// \u0027 - '
	var startTag = /^<([-A-Za-z0-9_]+)((?:\s+\w+(?:\s*=\s*(?:(?:\u0022[^\u0022]*\u0022)|(?:\u0027[^\u0027]*\u0027)|[^>\s]+))?)*)\s*(\/?)>/,
		endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
		attr = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:\u0022((?:\\.|[^\u0022])*)\u0022)|(?:\u0027((?:\\.|[^\u0027])*)\u0027)|([^>\s]+)))?/g;
		
	// Empty Elements - HTML 4.01
	var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

	// Block Elements - HTML 4.01
	var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

	// Inline Elements - HTML 4.01
	var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

	// Elements that you can, intentionally, leave open
	// (and which close themselves)
	var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

	// Attributes that have their values filled in disabled="disabled"
	var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

	// Special Elements (can contain anything)
	var special = makeMap("script,style");


	var HTMLParser = function( html, handler ) {
		var index, chars, match, stack = [], last = html;
		stack.last = function(){
			return this[ this.length - 1 ];
		};

		while ( html ) {
			chars = true;

			// Make sure we're not in a script or style element
			if ( !stack.last() || !special[ stack.last() ] ) {

				// Comment
				if ( html.indexOf("<!--") == 0 ) {
					index = html.indexOf("-->");
	
					if ( index >= 0 ) {
						if ( handler.comment )
							handler.comment( html.substring( 4, index ) );
						html = html.substring( index + 3 );
						chars = false;
					}
	
				// end tag
				} else if ( html.indexOf("</") == 0 ) {
					match = html.match( endTag );
	
					if ( match ) {
						html = html.substring( match[0].length );
						match[0].replace( endTag, parseEndTag );
						chars = false;
					}
	
				// start tag
				} else if ( html.indexOf("<") == 0 ) {
					match = html.match( startTag );
	
					if ( match ) {
						html = html.substring( match[0].length );
						match[0].replace( startTag, parseStartTag );
						chars = false;
					}
				}

				if ( chars ) {
					index = html.indexOf("<");
					
					var text = index < 0 ? html : html.substring( 0, index );
					html = index < 0 ? "" : html.substring( index );
					
					if ( handler.chars )
						handler.chars( text );
				}

			} else {
				html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function(all, text){
					text = text.replace(/<!--(.*?)-->/g, "$1")
						.replace(/<!\[CDATA\[(.*?)]]>/g, "$1");

					if ( handler.chars )
						handler.chars( text );

					return "";
				});

				parseEndTag( "", stack.last() );
			}

			if ( html == last )
				throw "Parse Error: " + html;
			last = html;
		}
		
		// Clean up any remaining tags
		parseEndTag();

		function parseStartTag( tag, tagName, rest, unary ) {
			tagName = tagName.toLowerCase();

			if ( block[ tagName ] ) {
				while ( stack.last() && inline[ stack.last() ] ) {
					parseEndTag( "", stack.last() );
				}
			}

			if ( closeSelf[ tagName ] && stack.last() == tagName ) {
				parseEndTag( "", tagName );
			}

			unary = empty[ tagName ] || !!unary;

			if ( !unary )
				stack.push( tagName );
			
			if ( handler.start ) {
				var attrs = [];
	
				rest.replace( attr, function( match, name ) {
					var value = arguments[2] ? arguments[2] :
						arguments[3] ? arguments[3] :
						arguments[4] ? arguments[4] :
						fillAttrs[name] ? name : "";
					
					attrs.push({
						name: name,
						value: value,
						// \u0022 - "
						escaped: value.replace(/(^|[^\\])\u0022/g, '$1\\\\u0022') //"
					});
				});
	
				if ( handler.start )
					handler.start( tagName, attrs, unary );
			}
		}

		function parseEndTag( tag, tagName ) {
			var pos;
			// If no tag name is provided, clean shop
			if ( !tagName ) {
				pos = 0;
			}
				
			// Find the closest opened tag of the same type
			else
				for ( pos = stack.length - 1; pos >= 0; pos-- )
					if ( stack[ pos ] == tagName )
						break;
			
			if ( pos >= 0 ) {
				// Close all the open elements, up the stack
				for ( var i = stack.length - 1; i >= pos; i-- )
					if ( handler.end )
						handler.end( stack[ i ] );
				
				// Remove the open elements from the stack
				stack.length = pos;
			}
		}
	};
	
	var HTMLtoXML = function( html ) {
		var results = "";
		
		HTMLParser(html, {
			start: function( tag, attrs, unary ) {
				results += "<" + tag;
		
				for ( var i = 0; i < attrs.length; i++ )
					results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
		
				results += (unary ? "/" : "") + ">";
			},
			end: function( tag ) {
				results += "</" + tag + ">";
			},
			chars: function( text ) {
				results += text;
			},
			comment: function( text ) {
				results += "<!--" + text + "-->";
			}
		});
		
		return results;
	};
	
	var HTMLtoDOM = function( html, doc ) {
		// There can be only one of these elements
		var one = makeMap("html,head,body,title");
		
		// Enforce a structure for the document
		var structure = {
			link: "head",
			base: "head"
		};
	
		if ( !doc ) {
			if ( typeof DOMDocument != "undefined" )
				doc = new DOMDocument();
			else if ( typeof document != "undefined" && document.implementation && document.implementation.createDocument )
				doc = document.implementation.createDocument("", "", null);
			else if ( typeof ActiveX != "undefined" )
				doc = new ActiveXObject("Msxml.DOMDocument");
			
		} else
			doc = doc.ownerDocument ||
				doc.getOwnerDocument && doc.getOwnerDocument() ||
				doc;
		
		var elems = [],
			documentElement = doc.documentElement ||
				doc.getDocumentElement && doc.getDocumentElement();
				
		// If we're dealing with an empty document then we
		// need to pre-populate it with the HTML document structure
		if ( !documentElement && doc.createElement ) (function(){
			var html = doc.createElement("html");
			var head = doc.createElement("head");
			head.appendChild( doc.createElement("title") );
			html.appendChild( head );
			html.appendChild( doc.createElement("body") );
			doc.appendChild( html );
		})();
		
		// Find all the unique elements
		if ( doc.getElementsByTagName )
			for ( var i in one )
				one[ i ] = doc.getElementsByTagName( i )[0];
		
		// If we're working with a document, inject contents into
		// the body element
		var curParentNode = one.body;
		
		HTMLParser( html, {
			start: function( tagName, attrs, unary ) {
				// If it's a pre-built element, then we can ignore
				// its construction
				if ( one[ tagName ] ) {
					curParentNode = one[ tagName ];
					if ( !unary ) {
						elems.push( curParentNode );
					}
					return;
				}
			
				var elem = doc.createElement( tagName );
				
				for ( var attr in attrs )
					elem.setAttribute( attrs[ attr ].name, attrs[ attr ].value );
				
				if ( structure[ tagName ] && typeof one[ structure[ tagName ] ] != "boolean" )
					one[ structure[ tagName ] ].appendChild( elem );
				
				else if ( curParentNode && curParentNode.appendChild )
					curParentNode.appendChild( elem );
					
				if ( !unary ) {
					elems.push( elem );
					curParentNode = elem;
				}
			},
			end: function( tag ) {
				elems.length -= 1;
				
				// Init the new parentNode
				curParentNode = elems[ elems.length - 1 ];
			},
			chars: function( text ) {
				curParentNode.appendChild( doc.createTextNode( text ) );
			},
			comment: function( text ) {
				// create comment node
			}
		});
		
		return doc;
	};

	return HTMLParser;
} () );

// var htmlToNodes = ( function( $ ) {
//     function normalizeHTMLEntities( str ) {
//         var entities = {
//             "&gt;": ">",
//             "&lt;": "<",
//             "&amp;": "&",
//             "&nbsp;": " "
//         };
        
//         return str.replace( new RegExp( "(\\&[^;]*;?)", "g" ), function( match ) {
//             if( entities[ match ] ) {
//                 return entities[ match ];
//             }
//         } );
//     }
//     function generateUniqueId() {
//         function s4() {
//             return Math.floor( ( 1 + Math.random() ) * 0x10000 )
//             .toString( 16 )
//             .substring( 1 );
//         }
//         return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
//     }
//     /**
//         * @desc clone an object
//         * @param {object} obj -
//         * @returns {object|null} Copy of object parameter; else null
//     */
//     function naiveClone( obj ) {
//         if( typeof( obj ) === "object" ) {
//             return JSON.parse( JSON.stringify( obj ) ); 
//         }
//         return null;
//     }
    
//     function Html() {
//         var nodeValues = [],
//             stringValue = "",
//             tmpNode = {};

//         function nodeHelper( node, attributes ) {
//             Object.defineProperties( node, {
//                 "_isClosed": {
//                     enumerable: false,
//                     configurable: true,
//                     writable: true,
//                     value: false
//                 },
//                 "_parentNode": {
//                     enumerable: false,
//                     configurable: true,
//                     writable: true,
//                     value: null
//                 },
//                 "_childrenNodes": {
//                     enumerable: false,
//                     configurable: true,
//                     writable: true,
//                     value: []
//                 },
//                 "_inheritedAttributes": {
//                     enumerable: true,
//                     configurable: true,
//                     writable: true,
//                     value: attributes
//                 }
//             } );
//         }
//         function Node( tag, attributes ) {
//             this.id = generateUniqueId();
            
//             this.tag = tag;
//             this.attributes = attributes;
//             this.index = null;
//             this.length = null;
//             this.stringValue = "";

//             // Clone is required to avoid modifying attributes object
//             nodeHelper( this, naiveClone( attributes ) );
//         }

//         Node.prototype.getParentNode = function() {
//             if( !this._parentNode ) { return null; }
            
//             var i = 0, 
//             	len = nodeValues.length;
            
//             for( i ; i < len; i++ ) {
//                 if( nodeValues[ i ].id === this._parentNode ) {
//                     return nodeValues[ i ];
//                 }
//             }
//         };
//         Node.prototype.getChildrenNodes = function() {
//             var arr = [], 
//             	len = nodeValues.length;
            
//             this._childrenNodes.forEach( function( nodeId ) {
//                 for( var i = 0; i < len; i++ ) {
//                     if( nodeValues[ i ].id === nodeId ) {
//                         arr.push( nodeValues[ i ] );
//                         return;
//                     }
//                 }
//             } );
//             return arr;
//         };
//         Node.prototype.resolveInheritedAttributes = function() {
//         	// Explicitly define inheritedAttributes on child nodes
//         	function resolveChildren( node, nodes ) {
//         		nodes = nodes || [];

//         		var children = node.getChildrenNodes(),
//         			attrs = node._inheritedAttributes,
//         			embeddedNodeIds = [];

// 	        	if( children.length > 0 ) {
// 	        		children.forEach( function( child ) {
// 	        			Object.keys( attrs ).forEach( function( attrKey ) {
// 	        				var attr = attrs[ attrKey ],
// 	        					key;

// 	        				if( !child._inheritedAttributes[ attrKey ] ) {
//         						child._inheritedAttributes[ attrKey ] = {};
//         					}

// 	        				for( key in attr ) {
// 	        					child._inheritedAttributes[ attrKey ][ key ] = attr[ key ];
// 	        				}
// 	        			} );

// 	        			resolveChildren( child, nodes );
// 	        		} );
// 	        	}

// 	        	if( children.length === 0 || node.stringValue.length > 0 ) {
// 	        		nodes.push( node );
// 	        	}
	        	
// 	        	nodes.forEach( function( node ) {
// 	        		if( ( /{{\w{32}}}/ ).test( node.stringValue ) ) {
// 	        			embeddedNodeIds = embeddedNodeIds.concat( node._childrenNodes );
// 	        		}
// 	        	} );

// 	        	// Sort by index
// 	        	return nodes.sort( function( a, b ) { return a.index - b.index; } )
// 		        	// Remove embedded nodes
// 		        	.filter( function( node ) {
// 		        		return embeddedNodeIds.indexOf( node.id ) < 0;
// 		        	} );
// 	        }

// 	        return resolveChildren( this, [] );
//         };

//         this.process = function( type, value, forceClose ) {
//             var HtmlType = {
//             	end: function() {
// 	            	var i;

// 	            	// Close node and reset tmpNode
// 	                if( tmpNode.id && tmpNode.tag === value.tag ) {
// 	                    tmpNode._isClosed = true;
// 	                    tmpNode.length = stringValue.length - tmpNode.index;
	                    
// 	                    nodeValues.push( tmpNode );
// 	                    tmpNode = {};
// 	                } 

// 	                // Traverse stored nodes for open node
// 	                else {
// 	                    for( i = nodeValues.length - 1; i >= 0; i-- ) {
// 	                        if( !nodeValues[ i ]._isClosed ) {
// 	                            nodeValues[ i ]._isClosed = true;
// 	                            nodeValues[ i ].length = stringValue.length - nodeValues[ i ].index;
// 	                            break;
// 	                        }
// 	                    }
// 	                }
// 	            },
// 	            start: function() {
// 	            	var i;

// 	            	// If starting new tag while tag is open, store node and reset tmpNode
// 	                if( tmpNode.id ) {
// 	                    nodeValues.push( tmpNode );
// 	                    tmpNode = {};
// 	                }

// 	                tmpNode = new Node( value.tag, value.attrs );
// 	                tmpNode.index = stringValue.length;

// 	                // Identify parent and children nodes
// 	                for( i = nodeValues.length - 1; i >= 0; i-- ) {
// 	                    if( !nodeValues[ i ]._isClosed ) {
// 	                        if( !tmpNode._parentNode ) {
// 	                            tmpNode._parentNode = nodeValues[ i ].id;
// 	                            nodeValues[ i ]._childrenNodes.push( tmpNode.id );
// 	                        }
// 	                    }
// 	                }

// 	                // Force close unary tag
// 	                if( forceClose ) {
// 	                    tmpNode._isClosed = true;
// 	                    tmpNode.length = stringValue.length - tmpNode.index;
	                    
// 	                    nodeValues.push( tmpNode );
// 	                    tmpNode = {};
// 	                }
// 	            },
// 	            chars: function() {
// 	            	var i, j;

// 	            	// Normalize encoded entities
// 	                value = normalizeHTMLEntities( value );

// 	                // Temp node hasn't been initiated
// 	                if( !tmpNode.id ) {

// 	                	// Traverse nodes for last open node
// 	                    for( i = nodeValues.length - 1; i >= 0; i-- ) {
// 	                        if( !nodeValues[ i ]._isClosed ) {
// 	                        	var openNode = nodeValues[ i ];

// 	                            // Identifier for embedded node; can have siblings
// 	                            for( j = i; j < nodeValues.length; j++ ) {
	                                
// 	                            	// Embed node id in string for reference
// 	                                if( nodeValues[ j ]._isClosed && nodeValues[ j ]._parentNode === openNode.id &&
// 	                                	// Id is not already embedded
// 	                                	openNode.stringValue.indexOf( nodeValues[ j ].id ) < 0 ) {                                    
// 	                                    	openNode.stringValue += ( "{{" + nodeValues[ j ].id + "}}" );
// 	                                }
// 	                            }
// 	                            nodeValues[ i ].stringValue += value;
// 	                            break;
// 	                        }
// 	                    }
// 	                } else {
// 	                	// Remove zero width space
// 	                    tmpNode.stringValue += value.replace( /\u200B/g, "" );
// 	                }
	                
// 	                // Remove zero width space
// 	                stringValue += value.replace( /\u200B/g, "" );
// 	            },
// 	            comment: function() {}
//             };

//             HtmlType[ type ]();
//         };
//         this.results = function() {
//             return nodeValues;    
//         };
//         this.stringValue = function() {
//             return stringValue;
//         };
//         this.getStringStyles = function() {
//         	var nodes = [],
//         		lineBreaks = this.getLineBreaks(),

//         		node,
//         		slices,
//         		style;

//         	// Capture parent level nodes only
//         	nodeValues.filter( function( node ) {
//         		return !!!node.getParentNode();
//         	} ).forEach( function( node ) {
//         		nodes = nodes.concat( node.resolveInheritedAttributes() );
//         	} );

//         	// Loop through nodes; split nodes with embedded styles; return reduced node data
//         	for( var i = 0; i < nodes.length; i++ ) {
//         		node = nodes[ i ];

//         		// Node with embedded nodes
// 	        	if( ( /{{\w{32}}}/ ).test( node.stringValue ) ) {
//         			// Split string by string value and node references
//         			slices = node.stringValue.split( /({{\w{32}}})/ )

//         				// Remove empty string values
//         				.filter( Boolean )

//         				// Replace references with node
// 	        			.map( function( slice ) {
// 	        				var tmpNode = {},
// 								id = slice.match( /{{(\w{32})}}/ );
							
// 							if( id ) {
// 								id = id[ 1 ];

// 								nodeValues.some( function( embeddedNode ) {
// 		        					if( embeddedNode.id === id ) {
// 		        						tmpNode = embeddedNode;
// 		        						return true;
// 		        					}
// 		        				} );
// 							} else {
// 								tmpNode = slice;
// 							}

// 		        			return tmpNode;
// 	        			} )

// 	        			// Reduce nodes to necessary information
// 						.map( function( slice, sliceIndex, sliceArr ) {
// 							var tmpNode = {},
// 								style = node._inheritedAttributes.style ?
// 											node._inheritedAttributes.style : {},
								
// 								// For recalculating stringValue index
// 								index = 0,
// 								indexValue = 0;
							
// 							// Slice from original node
// 							if( typeof slice === "string" ) {
// 								// Get slice index
// 								while( index < sliceIndex  ) {
// 									indexValue += typeof sliceArr[ index ] === "object" ? sliceArr[ index ].stringValue.length : sliceArr[ index ].length ;
// 									index++;
// 								}

// 								tmpNode = {
// 	    							index: indexValue,
// 	    							length: slice.length,
// 	    							style: style,
// 	    							stringValue: slice
// 	    						};
// 							}

// 							// Slice is an embedded node
// 							else {
// 								style = slice._inheritedAttributes.style ?
// 										slice._inheritedAttributes.style : {};

// 								tmpNode = {
// 	    							index: slice.index,
// 	    							length: slice.length,
// 	    							style: style,
// 	    							stringValue: slice.stringValue
// 	    						};
// 							}

// 							// Process line breaks
// 							if( lineBreaks.indexOf( tmpNode.index ) >= 0 ) {
// 								tmpNode.leadingLineBreak = true;

// 								// Remove line break
// 								lineBreaks.splice( tmpNode.index, 1 );
// 							}

// 		        			return tmpNode;
// 						} );

// 					// Inject embedded slices
// 					Array.prototype.splice.apply( nodes, [ i, 1 ].concat( slices ) );
// 					// Update index
// 					i = slices.length - 1;
//         		}

//         		// Node without embedded nodes
//         		else {
//         			// node.style exists if a node was sliced
//         			style = node.style ? node.style :
//         						node._inheritedAttributes.style ?
//         						node._inheritedAttributes.style : {};

// 					// Reduce nodes to necessary information
//         			nodes[ i ] = {
//         				index: node.index,
// 						length: node.length,
// 						style: style,
// 						stringValue: node.stringValue
//         			};

//         			// Process line breaks; never apply to first node
// 					if( lineBreaks.indexOf( node.index ) >= 0 && i !== 0 ) {
// 						nodes[ i ].leadingLineBreak = true;

// 						// Remove line break
// 						lineBreaks.splice( tmpNode.index, 1 );
// 					}
//         		}
// 	        }

//         	return nodes;
//         };

//         // Leading line breaks
//         this.getLineBreaks = function() {
//         	var breaks = [];

//         	nodeValues.forEach( function( node ) {
//         		if( node.tag === "div" ) {
//         			breaks.push( node.index );
//         		}
//         	} );

//         	// Remove first instance if 0
//         	if( breaks[ 0 ] === 0 ) { breaks.shift(); }

//         	return breaks;
//         };
//     }

//     return {
//         run: function( str ) {
//             var nodes = new Html();

//             $( str, {
//                 start: function( tag, attrs, unary ) {
//                     var attributes = {};
//                     attrs.forEach( function( attr ) {
//                         attr.value.replace( new RegExp( "([-A-Za-z0-9_]+):\\s*([^;]*);" , "gi" ) , function() {
//                             if( !attributes[ attr.name ] ) { attributes[ attr.name ] = {}; }
//                             attributes[ attr.name ][ arguments[ 1 ] ] = arguments[ 2 ];
//                         } );
//                     } );

//                     nodes.process( "start", {
//                         tag: tag,
//                         attrs: attributes
//                     }, unary );
//                 },
//                 end: function( tag ) {
//                     nodes.process( "end", { tag: tag } );
//                 },
//                 chars: function( text ) {
//                     nodes.process( "chars", text );
//                 },
//                 comment: function( text ) {}
//             } );

//             return nodes;
//         }
//     };
// } )( HTMLParser );


// var html = "<div style=\"text-align:left;\"></div><div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><bold>Jacquie</bold> accessorized with <i>a</i> fancy bag, </span></span></div><div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">but her smock looked inexpensive.</span></div>",
// 	html2 = "<div style=\"text-align:left;\"><span style=\"color:#FF0000;\"><span class=\"sm-font-family\" style=\"font-family:Merriweather-Light,'Merriweather';font-style:normal;font-weight:normal;\"><span style=\"font-size: 24px;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></span></div>",
// 	a = htmlToNodes.run( html ),
// 	b = htmlToNodes.run( html2 );

// // b.results().forEach( function( node ) {
// // 	console.log( node );
// // } );

// console.log( a.getLineBreaks() );
// a.getStringStyles().forEach( function( node ) {
// 	console.log( node );
// } );

// var c = [
//     {
//         "index": 0,
//         "length": 7,
//         "style": {
//             "font-size": "24px",
//             "font-family": "ArialMT,'Arial'",
//             "color": "#000000",
//             "text-align": "left"
//         },
//         "stringValue": "Jacquie"
//     },
//     {
//         "index": 7,
//         "length": 19,
//         "style": {
//             "font-size": "24px",
//             "font-family": "ArialMT,'Arial'",
//             "color": "#000000",
//             "text-align": "left"
//         },
//         "stringValue": " accessorized with "
//     },
//     {
//         "index": 26,
//         "length": 1,
//         "style": {
//             "font-size": "24px",
//             "font-family": "ArialMT,'Arial'",
//             "color": "#000000",
//             "text-align": "left"
//         },
//         "stringValue": "a"
//     },
//     {
//         "index": 27,
//         "length": 12,
//         "style": {
//             "font-size": "24px",
//             "font-family": "ArialMT,'Arial'",
//             "color": "#000000",
//             "text-align": "left"
//         },
//         "stringValue": " fancy bag, "
//     },
//     {
//         "index": 39,
//         "length": 33,
//         "style": {
//             "font-size": "24px",
//             "font-family": "ArialMT,'Arial'",
//             "color": "#000000",
//             "text-align": "left"
//         },
//         "stringValue": "but her smock looked inexpensive."
//     }
// ];

// // Html-based text helpers
// function encodeSpecialCharacters( str ) {
//     var chars = {
//         ">": "&gt;",
//         "<": "&lt;",
//         "&": "&amp;",
        
//         // Sequential spaces, '  '
//         "  ": " &nbsp;"
//     };

//     return str.replace( new RegExp( "(\\&[^;]*;?)", "g" ), function( match ) {
//         if( chars[ match ] ) {
//             return chars[ match ];
//         }
//     } );
// }

// var startTag = /^<([-A-Za-z0-9_]+)((?:\s+\w+(?:\s*=\s*(?:(?:\u0022[^\u0022]*\u0022)|(?:\u0027[^\u0027]*\u0027)|[^>\s]+))?)*)\s*(\/?)>/,
// 	endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
// 	attr = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:\u0022((?:\\.|[^\u0022])*)\u0022)|(?:\u0027((?:\\.|[^\u0027])*)\u0027)|([^>\s]+)))?/g;

// function isHtml( str ) {
// 	var startTag = /^<([-A-Za-z0-9_]+)((?:\s+\w+(?:\s*=\s*(?:(?:\u0022[^\u0022]*\u0022)|(?:\u0027[^\u0027]*\u0027)|[^>\s]+))?)*)\s*(\/?)>/;

// 	return ( typeof str === "string" ) ? startTag.test( str ) : false;
// }



// function setTextAlign( textAlign, html ) {
// 	if( !isHtml( html ) ) { return; }

// 	textAlign = [ "left", "center", "right", "justify" ].indexOf( textAlign ) ? textAlign : "left";

// 	return "<div style=\"text-align:" + textAlign + ";\">" + html + "</div>";
// }

// function setCustomFont( fontFamily, html ) {
// 	if( !isHtml( html ) ) { return; }
	
// 	fontFamily = ( typeof fontFamily === "string" ) ? fontFamily : "ArialMT,'Arial'";

// 	return "<span class=\"sm-font-family\" style=\"font-family:" + fontFamily + ";font-style:normal;font-weight:normal;\">" + html + "</span>";
// }
// function setTextStyles( styles, html ) {
// 	if( !isHtml( html ) || Object.prototype.toString.call( styles ) !== "[object Object]" ) { return; }

// 	var stylesStr = Object.keys( styles ).map( function( key ) {
// 		return key + ":" + styles[ key ] + ";";
// 	} ).join( "" );

// 	return "<span style=\"" + stylesStr + "\">" + html + "</span>";
// }

// console.log( setTextStyles( {
// 	"font-size": "24px",
// 	"font-family": "ArialMT,'Arial'",
// 	"color": "#000000"
// }, "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><bold>Jacquie</bold> accessorized with <i>a</i> fancy bag, </span></span></div><div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">but her smock looked inexpensive.</span></div>" ) );
// console.log( setCustomFont( "Merriweather-Light,'Merriweather'", "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><bold>Jacquie</bold> accessorized with <i>a</i> fancy bag, </span></span></div><div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">but her smock looked inexpensive.</span></div>" ) );
// console.log( setTextAlign( "center", "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><bold>Jacquie</bold> accessorized with <i>a</i> fancy bag, </span></span></div><div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">but her smock looked inexpensive.</span></div>" ) );

// c.forEach( function( node ) {
// 	console.log( setTextAlign( "center", node.stringValue ) );
// } );

