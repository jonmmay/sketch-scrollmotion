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
	
				rest.replace(attr, function(match, name) {
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

var htmlToNodes = ( function( $ ) {
	var nodes;
	
	function Html() {
		var id = 0,
			vals = [],
			stringValue = "",
			cache = {};

		function generateUniqueId() {
            function s4() {
                return Math.floor( ( 1 + Math.random() ) * 0x10000 )
                .toString( 16 )
                .substring( 1 );
            }
            return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
        }
        function normalizeHTMLEntities( str ) {
        	var entities = {
        		"&gt;": ">",
        		"&lt;": "<",
        		"&nbsp;": " ",
        		"&amp;": "&"
        	};
        	
        	return str.replace( new RegExp( "(\\&[^;]*;?)", "g" ), function( match ) {
        		if( entities[ match ] ) {
        			return entities[ match ];
        		}
        	} );
        }

		function nodeHelper( node ) {
			Object.defineProperties( node, {
				"_isClosed": {
					enumerable: false,
				  	configurable: true,
				  	writable: true,
				  	value: false
				},
				"_parentNode": {
					enumerable: false,
				  	configurable: true,
				  	writable: true,
				  	value: null
				},
				"_childrenNodes": {
					enumerable: false,
				  	configurable: true,
				  	writable: true,
				  	value: []
				}
			} );
		}
		
		function Node( tag, attrs ) {
			this.id = generateUniqueId();
			this.tag = tag;
			this.attrs = attrs;
			this.location = null;
			this.length = null;
			this.stringValue = "";

			nodeHelper( this );
		}

		Node.prototype.getParentNode = function() {
			if( !this._parentNode ) { return null; }
			var i = 0, len = vals.length;
			for( i ; i < len; i++ ) {
				if( vals[ i ].id === this._parentNode ) {
					return vals[ i ];
				}
			}
		};
		Node.prototype.getChildrenNodes = function() {
			var arr = [], len = vals.length;
			
			this._childrenNodes.forEach( function( nodeId ) {
				for( var i = 0; i < len; i++ ) {
					if( vals[ i ].id === nodeId ) {
						arr.push( vals[ i ] );
						return;
					}
				}
			} );
			return arr;
		};
		
		this.process = function( type, val, forceClose ) {
			var i, j;
			if( type === "end" ) {
				// Close node and reset cache
				if( cache.id && cache.tag === val.tag ) {
					cache._isClosed = true;
					cache.length = stringValue.length - cache.location;
					vals.push( cache );
					cache = {};
				} else {
					for( i = vals.length - 1; i >= 0; i-- ) {
						if( !vals[ i ]._isClosed ) {
							vals[ i ]._isClosed = true;
							vals[ i ].length = stringValue.length - vals[ i ].location;
							break;
						}
					}
				}
			} else if( type === "start" ) {
				if( cache.id ) {
					vals.push( cache );
					cache = {};
				}
				cache = new Node( val.tag, val.attrs );
				cache.location = stringValue.length;

				// Identify parent nodes
				for( i = vals.length - 1; i >= 0; i-- ) {
					if( !vals[ i ]._isClosed ) {
						if( !cache._parentNode ) {
							cache._parentNode = vals[ i ].id;
							vals[ i ]._childrenNodes.push( cache.id );
						}
					}
				}

				if( forceClose ) {
					cache._isClosed = true;
					cache.length = stringValue.length - cache.location;
					vals.push( cache );
					cache = {};
				}
			} else if( type === "chars" ) {
				val = normalizeHTMLEntities( val );

				if( !cache.id ) {
					for( i = vals.length - 1; i >= 0; i-- ) {
						if( !vals[ i ]._isClosed ) {

							// Identifier for embedded node; can have siblings
							if( vals[ i ].stringValue.length > 0 ) {
								for( j = i; j < vals.length; j++ ) {
									if( vals[ j ]._isClosed && vals[ j ]._parentNode === vals[ i ].id ) {
										vals[ i ].stringValue += ( "{{" + vals[ j ].id + "}}" );
									}
								}
							}
							vals[ i ].stringValue += val;
							break;
						}
					}
				} else {
					cache.stringValue += val;
				}
				
				stringValue += val;
			}
		};
		this.results = function() {
			return vals;	
		};
		this.stringValue = function() {
			return stringValue;
		};
	}

	return {
		run: function( str ) {
			nodes = new Html();

			$( str, {
				start: function( tag, attrs, unary ) {
					var attributes = {};
					attrs.forEach( function( attr ) {
						attr.value.replace( new RegExp( "([-A-Za-z0-9_]+):\\s*([^;]*);" , "gi" ) , function() {
							if( !attributes[ attr.name ] ) { attributes[ attr.name ] = {}; }
							attributes[ attr.name ][ arguments[ 1 ] ] = arguments[ 2 ];
						} );
					} );

					nodes.process( "start", {
						tag: tag,
						attrs: attributes
					}, unary );
				},
				end: function( tag ) {
					nodes.process( "end", { tag:tag } );
				},
				chars: function( text ) {
					nodes.process( "chars", text );
				},
				comment: function( text ) {}
			} );

			return this;
		},
		results: function() {
			return nodes.results();
		},
		stringValue: function() {
			return nodes.stringValue();
		}
	};
} ( HTMLParser ) );

// var html = "<div style=\"text-align: left; line-height: 16px;\"><span style=\"font-family: ArialMT, Arial; color: rgb(0, 0, 0);font-size:14px;\"><span style=\"font-size:14px;\"><span style=\"font-family: ArialMT, Arial; color: rgb(0, 0, 0);\">Jacquie &amp;&lt;&gt; &nbsp; &nbsp;</span><span style=\"color:#FF0000;\"><span style=\"font-family: ArialMT, Arial;\">accessorized</span></span><span style=\"font-family: ArialMT, Arial; color: rgb(0, 0, 0);\"> with a fancy bag, but her <span style=\"letter-spacing:-1px;\">smock</span> looked</span></span></span></div><div style=\"text-align: left; line-height: 16px;\"><span style=\"font-size:14px;\"><span style=\"font-family: ArialMT, Arial; color: rgb(0, 0, 0);\"> inexpensive. I’ve begun to realize why Jacques makes experts fed up. I had to look up “Hova.” Wow! Expect a bump in frequency of Jay-Z pangrams! Having a few saxophone players is required to make a jazz combo. Jim fantasized about having sex with a large quantity of pancakes.</span></span></div>";
// var aa = htmlToNodes.run( html ).stringValue(); 
// var a = htmlToNodes.run( html ).results();

// a.forEach( function( val ) {
// 	console.log( val );
// } );


// function spliceSlice( str, index, count, add ) {
//   return str.slice( 0, index ) + ( add || "" ) + str.slice( index + count );
// }
// function stringWithBreaks( str, nodes ) {
// 	if( typeof str !== "string" ) { throw new Error( "No string" ); }
// 	var breaks = [], i;
// 	nodes.forEach( function( node ) {
// 		var i = ( node.tag === "div" ) ? node.location : -1;
// 		if( i >= 0 ) { breaks.push( i ); }
// 	} );

// 	// Remove first div instance
// 	breaks = breaks.splice( 1, breaks.length );

// 	// Insert breaks from end of string
// 	for( i = breaks.length - 1; i >= 0; i-- ) {
// 		str = spliceSlice( str, breaks[ i ], 0, "\n" );
// 	}
// 	return str;
// }
// console.log( stringWithBreaks( aa , a ));

// function traverseNodes( node , i ) {
// 	if( node === undefined ) { return null; }

// 	var parentNode = node.getParentNode(),
// 		childrenNodes = node.getChildrenNodes(),
// 		siblingsNum = ( parentNode ) ? parentNode.getChildrenNodes().length : 0;
// 	i = i || 0;

// 	// Traverse siblings
// 	while( node.stringValue.length === 0 && ( i < siblingsNum - 1 || childrenNodes.length > 0 ) ) {
// 		// Traverse children
// 		while( node.stringValue.length === 0 && childrenNodes.length > 0 ) {
// 			return traverseNodes( childrenNodes[ 0 ] , 0 );
// 		}

// 		i++;
// 		return traverseNodes( parentNode.getChildrenNodes()[ i ], i );
// 	}

// 	return ( node.stringValue.length > 0 ) ? node : null;
// }
// console.log( traverseNodes( a[ 0 ] ) );
