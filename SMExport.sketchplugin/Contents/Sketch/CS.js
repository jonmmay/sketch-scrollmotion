@import "util.js";
// @import "htmlparser.js";

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

    var defaultFontsRegexs = [
        // "ArialMT,'Arial'"
        // "Arial-ItalicMT,'Arial'"
        // "Arial-BoldMT,'Arial'"
        // "Arial-BoldItalicMT,'Arial'"
        // "ArialMT, Arial"
        // "ArialMT"
        /^Arial(?:-(?:Italic|Bold|BoldItalic))?MT,\s?(?:Arial|'Arial')?$/,
        
        // "CourierNewPSMT,'Courier New'"
        // "CourierNewPS-ItalicMT,'Courier New'"
        // "CourierNewPS-BoldMT,'Courier New'"
        // "CourierNewPS-BoldItalicMT,'Courier New'"
        /^CourierNewPS(?:-(?:Italic|Bold|BoldItalic))?MT,\s?(?:Courier New|'Courier New')$/,
        
        // "Georgia,'Georgia'"
        // "Georgia-Italic,'Georgia'"
        // "Georgia-Bold,'Georgia'"
        // "Georgia-BoldItalic,'Georgia'"
        /^Georgia(?:-(?:Italic|Bold|BoldItalic))?,\s?(?:Georgia|'Georgia')$/,


        // "TimesNewRomanPSMT,'Times New Roman'"
        // "TimesNewRomanPS-ItalicMT,'Times New Roman'"
        // "TimesNewRomanPS-BoldMT,'Times New Roman'"
        // "TimesNewRomanPS-BoldItalicMT,'Times New Roman'"
        /^TimesNewRomanPS(?:-(?:Italic|Bold|BoldItalic))?MT,\s?(?:Times New Roman|'Times New Roman')$/,

        // "TrebuchetMS,'Trebuchet MS'"
        // "TrebuchetMS-Italic,'Trebuchet MS'"
        // "TrebuchetMS-Bold,'Trebuchet MS'"
        // "TrebuchetMS-BoldItalic,'Trebuchet MS'"
        /^TrebuchetMS(?:-(?:Italic|Bold|BoldItalic))?,\s?(?:Trebuchet MS|'Trebuchet MS')$/,

        // "Verdana,'Verdana'"
        // "Verdana-Italic,'Verdana'"
        // "Verdana-Bold,'Verdana'"
        // "Verdana-BoldItalic,'Verdana'"
        /^Verdana(?:-(?:Italic|Bold|BoldItalic))?,\s?(?:Verdana|'Verdana')$/
    ];

    function testIsDefaultFont( fontName ) {
        return defaultFontsRegexs.some( function( regex ) {
            return regex.test( fontName );
        } );
    }

    /**
        * @desc Returns HTML wrapped with div and text alignment styling; use for text align and new line
        * @param {string} textAlign
        * @param {string} html
        * @returns {string} 
    */
    function setTextAlign( textAlign, html ) {
        textAlign = [ "left", "center", "right", "justify" ].indexOf( textAlign ) ? textAlign : "left";
        html = html || "";

        html = html.replace( /text-align:\s*([^;]*);/gi, "" );

        return "<div style=\"text-align:" + textAlign + ";\">" + html + "</div>";
    }

    /**
        * @desc Returns HTML wrapped with span and styling
        * @param {object} styles
        * @param {string} html
        * @returns {string} 
    */
    function setTextStyles( styles, html ) {
        styles = Object.prototype.toString.call( styles ) === "[object Object]" ? styles : {};
        html = html || "";

        var stylesStr = Object.keys( styles ).map( function( key ) {
            return key + ":" + styles[ key ] + ";";
        } ).join( "" );

        return "<span style=\"" + stylesStr + "\">" + html + "</span>";
    }

    /**
        * @desc Returns HTML wrapped with span and font family styling; removes embedded font family styling
        * @param {string} fontFamily
        * @param {string} html
        * @returns {string} 
    */
    function setCustomFont( fontFamily, html ) {
        fontFamily = ( typeof fontFamily === "string" ) ? fontFamily : "ArialMT,'Arial'";
        html = html || "";
        
        html = html.replace( /(font-family|font-style|font-weight):\s*([^;]*);/gi, "" );

        return "<span class=\"sm-font-family\" style=\"font-family:" + fontFamily + ";font-style:normal;font-weight:normal;\">" + html + "</span>";
    }

    /**
        * @desc Returns HTML wrapped with span and text color styling; removes embedded text color styling
        * @param {string} color
        * @param {string} html
        * @returns {string} 
    */
    function setColorStyle( color, html ) {
        html = html || "";
        color = { color: color || "#000000" };

        html = html.replace( /color:\s*([^;]*);/gi, "" );
        
        return setTextStyles( color, html );
    }

    function encodeSpecialCharacters( str ) {
        var chars = {
                ">": "&gt;",
                "<": "&lt;",
                "&": "&amp;",
                
                // Sequential spaces, '  '
                "  ": " &nbsp;"
            },
            regex = new RegExp( "(" + Object.keys( chars )
                .map( function( val ) { return "\\" + val; } )
                .join( "|" ) + ")", "g" );

        return str.replace( regex, function( match ) {
            if( chars[ match ] ) {
                return chars[ match ];
            }
        } );
    }

    var htmlToNodes = ( function( $ ) {
            function normalizeHTMLEntities( str ) {
                var entities = {
                    "&gt;": ">",
                    "&lt;": "<",
                    "&amp;": "&",
                    "&nbsp;": " "
                };
                
                return str.replace( new RegExp( "(\\&[^;]*;?)", "g" ), function( match ) {
                    if( entities[ match ] ) {
                        return entities[ match ];
                    }
                } );
            }
            function generateUniqueId() {
                function s4() {
                    return Math.floor( ( 1 + Math.random() ) * 0x10000 )
                    .toString( 16 )
                    .substring( 1 );
                }
                return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
            }
            
            function Html() {
                var nodeValues = [],
                    stringValue = "",
                    tmpNode = {};

                function nodeHelper( node, attributes ) {
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
                        },
                        "_inheritedAttributes": {
                            enumerable: false,
                            configurable: true,
                            writable: true,
                            value: attributes
                        }
                    } );
                }
                function Node( tag, attributes ) {
                    this.id = generateUniqueId();
                    
                    this.tag = tag;
                    this.attributes = attributes;
                    this.index = null;
                    this.length = null;
                    this.stringValue = "";

                    // Clone is required to avoid modifying attributes object
                    nodeHelper( this, util.naiveClone( attributes ) );
                }

                Node.prototype.getParentNode = function() {
                    if( !this._parentNode ) { return null; }
                    
                    var i = 0, 
                        len = nodeValues.length;
                    
                    for( i ; i < len; i++ ) {
                        if( nodeValues[ i ].id === this._parentNode ) {
                            return nodeValues[ i ];
                        }
                    }
                };
                Node.prototype.getChildrenNodes = function() {
                    var arr = [], 
                        len = nodeValues.length;
                    
                    this._childrenNodes.forEach( function( nodeId ) {
                        for( var i = 0; i < len; i++ ) {
                            if( nodeValues[ i ].id === nodeId ) {
                                arr.push( nodeValues[ i ] );
                                return;
                            }
                        }
                    } );
                    return arr;
                };
                Node.prototype.resolveInheritedAttributes = function() {
                    // Explicitly define inheritedAttributes on child nodes
                    function resolveChildren( node, nodes ) {
                        nodes = nodes || [];

                        var children = node.getChildrenNodes(),
                            attrs = node._inheritedAttributes,
                            embeddedNodeIds = [];

                        if( children.length > 0 ) {
                            children.forEach( function( child ) {
                                Object.keys( attrs ).forEach( function( attrKey ) {
                                    var attr = attrs[ attrKey ],
                                        key;

                                    if( !child._inheritedAttributes[ attrKey ] ) {
                                        child._inheritedAttributes[ attrKey ] = {};
                                    }

                                    for( key in attr ) {
                                        child._inheritedAttributes[ attrKey ][ key ] = attr[ key ];
                                    }
                                } );

                                resolveChildren( child, nodes );
                            } );
                        }

                        if( children.length === 0 || node.stringValue.length > 0 ) {
                            nodes.push( node );
                        }
                        
                        nodes.forEach( function( node ) {
                            if( ( /{{\w{32}}}/ ).test( node.stringValue ) ) {
                                embeddedNodeIds = embeddedNodeIds.concat( node._childrenNodes );
                            }
                        } );

                        // Sort by index
                        return nodes.sort( function( a, b ) { return a.index - b.index; } )
                            // Remove embedded nodes
                            .filter( function( node ) {
                                return embeddedNodeIds.indexOf( node.id ) < 0;
                            } );
                    }

                    return resolveChildren( this, [] );
                };

                this.process = function( type, value, forceClose ) {
                    var HtmlType = {
                        end: function() {
                            var i;

                            // Close node and reset tmpNode
                            if( tmpNode.id && tmpNode.tag === value.tag ) {
                                tmpNode._isClosed = true;
                                tmpNode.length = stringValue.length - tmpNode.index;
                                
                                nodeValues.push( tmpNode );
                                tmpNode = {};
                            } 

                            // Traverse stored nodes for open node
                            else {
                                for( i = nodeValues.length - 1; i >= 0; i-- ) {
                                    if( !nodeValues[ i ]._isClosed ) {
                                        nodeValues[ i ]._isClosed = true;
                                        nodeValues[ i ].length = stringValue.length - nodeValues[ i ].index;
                                        break;
                                    }
                                }
                            }
                        },
                        start: function() {
                            var i;

                            // If starting new tag while tag is open, store node and reset tmpNode
                            if( tmpNode.id ) {
                                nodeValues.push( tmpNode );
                                tmpNode = {};
                            }

                            tmpNode = new Node( value.tag, value.attrs );
                            tmpNode.index = stringValue.length;

                            // Identify parent and children nodes
                            for( i = nodeValues.length - 1; i >= 0; i-- ) {
                                if( !nodeValues[ i ]._isClosed ) {
                                    if( !tmpNode._parentNode ) {
                                        tmpNode._parentNode = nodeValues[ i ].id;
                                        nodeValues[ i ]._childrenNodes.push( tmpNode.id );
                                    }
                                }
                            }

                            // Force close unary tag
                            if( forceClose ) {
                                tmpNode._isClosed = true;
                                tmpNode.length = stringValue.length - tmpNode.index;
                                
                                nodeValues.push( tmpNode );
                                tmpNode = {};
                            }
                        },
                        chars: function() {
                            var i, j;

                            // Normalize encoded entities
                            value = normalizeHTMLEntities( value );

                            // Temp node hasn't been initiated
                            if( !tmpNode.id ) {

                                // Traverse nodes for last open node
                                for( i = nodeValues.length - 1; i >= 0; i-- ) {
                                    if( !nodeValues[ i ]._isClosed ) {
                                        var openNode = nodeValues[ i ];

                                        // Identifier for embedded node; can have siblings
                                        for( j = i; j < nodeValues.length; j++ ) {
                                            
                                            // Embed node id in string for reference
                                            if( nodeValues[ j ]._isClosed && nodeValues[ j ]._parentNode === openNode.id &&
                                                // Id is not already embedded
                                                openNode.stringValue.indexOf( nodeValues[ j ].id ) < 0 ) {                                    
                                                    openNode.stringValue += ( "{{" + nodeValues[ j ].id + "}}" );
                                            }
                                        }
                                        nodeValues[ i ].stringValue += value;
                                        break;
                                    }
                                }
                            } else {
                                // Remove zero width space
                                tmpNode.stringValue += value.replace( /\u200B/g, "" );
                            }
                            
                            // Remove zero width space
                            stringValue += value.replace( /\u200B/g, "" );
                        },
                        comment: function() {}
                    };

                    HtmlType[ type ]();
                };
                this.results = function() {
                    return nodeValues;    
                };
                this.stringValue = function() {
                    return stringValue;
                };
                this.getStringStyles = function() {
                    var nodes = [],
                        lineBreaks = this.getLineBreaks(),

                        node,
                        slices,
                        style;

                    // Capture parent level nodes only
                    nodeValues.filter( function( node ) {
                        return !!!node.getParentNode();
                    } ).forEach( function( node ) {
                        nodes = nodes.concat( node.resolveInheritedAttributes() );
                    } );

                    // Loop through nodes; split nodes with embedded styles; return reduced node data
                    for( var i = 0; i < nodes.length; i++ ) {
                        node = nodes[ i ];

                        // Node with embedded nodes
                        if( ( /{{\w{32}}}/ ).test( node.stringValue ) ) {
                            // Split string by string value and node references
                            slices = node.stringValue.split( /({{\w{32}}})/ )

                                // Remove empty string values
                                .filter( Boolean )

                                // Replace references with node
                                .map( function( slice ) {
                                    var tmpNode = {},
                                        id = slice.match( /{{(\w{32})}}/ );
                                    
                                    if( id ) {
                                        id = id[ 1 ];

                                        nodeValues.some( function( embeddedNode ) {
                                            if( embeddedNode.id === id ) {
                                                tmpNode = embeddedNode;
                                                return true;
                                            }
                                        } );
                                    } else {
                                        tmpNode = slice;
                                    }

                                    return tmpNode;
                                } )

                                // Reduce nodes to necessary information
                                .map( function( slice, sliceIndex, sliceArr ) {
                                    var tmpNode = {},
                                        style = node._inheritedAttributes.style ?
                                                    node._inheritedAttributes.style : {},
                                        
                                        // For recalculating stringValue index
                                        index = 0,
                                        indexValue = 0;
                                    
                                    // Slice from original node
                                    if( typeof slice === "string" ) {
                                        // Get slice index
                                        while( index < sliceIndex  ) {
                                            indexValue += typeof sliceArr[ index ] === "object" ? sliceArr[ index ].stringValue.length : sliceArr[ index ].length ;
                                            index++;
                                        }

                                        tmpNode = {
                                            index: indexValue,
                                            length: slice.length,
                                            style: style,
                                            stringValue: slice
                                        };
                                    }

                                    // Slice is an embedded node
                                    else {
                                        style = slice._inheritedAttributes.style ?
                                                slice._inheritedAttributes.style : {};

                                        tmpNode = {
                                            index: slice.index,
                                            length: slice.length,
                                            style: style,
                                            stringValue: slice.stringValue
                                        };
                                    }

                                    // Process line breaks
                                    if( lineBreaks.indexOf( tmpNode.index ) >= 0 ) {
                                        tmpNode.leadingLineBreak = true;

                                        // Remove line break
                                        lineBreaks.splice( lineBreaks.indexOf( tmpNode.index ) );
                                    }

                                    return tmpNode;
                                } );

                            // Inject embedded slices
                            Array.prototype.splice.apply( nodes, [ i, 1 ].concat( slices ) );
                            // Update index
                            i = slices.length - 1;
                        }

                        // Node without embedded nodes
                        else {
                            style = node._inheritedAttributes.style ?
                                    node._inheritedAttributes.style : {};

                            // Reduce nodes to necessary information
                            nodes[ i ] = {
                                index: node.index,
                                length: node.length,
                                style: style,
                                stringValue: node.stringValue
                            };

                            // Process line breaks
                            if( lineBreaks.indexOf( nodes[ i ].index ) >= 0 ) {
                                nodes[ i ].leadingLineBreak = true;

                                // Remove line break
                                lineBreaks.splice( lineBreaks.indexOf( nodes[ i ].index ) );
                            }
                        }
                    }

                    return nodes;
                };

                // Leading line breaks
                this.getLineBreaks = function() {
                    var breaks = [];

                    nodeValues.forEach( function( node ) {
                        if( node.tag === "div" ) {
                            breaks.push( node.index );
                        }
                    } );

                    // Remove first instance if 0
                    if( breaks[ 0 ] === 0 ) { breaks.shift(); }

                    return breaks;
                };
            }

            return {
                run: function( str ) {
                    var nodes = new Html();

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
                            nodes.process( "end", { tag: tag } );
                        },
                        chars: function( text ) {
                            nodes.process( "chars", text );
                        },
                        comment: function( text ) {}
                    } );

                    return nodes;
                }
            };
        } )( HTMLParser ),
        htmlTextHelpers = {
            _nodes: [],
            _nodeStyles: [],
            _stringValue: "",
            
            setText: function( text ) {
                this._stringValue = text;
                
                // Reset normalized node objects
                this._nodeStyles = [ {
                    index: 0,
                    length: text.length,
                    style: {},
                    stringValue: text
                } ];

                return this;
            },
            setTextHtml: function( html ) {
                if( typeof html !== "string" ) {
                    util.debug.warn( "Invalid text html type, " + typeof html );
                    return this;
                }

                // Set text value
                this.spec.text = html;
                // Node accessors
                this._nodes = htmlToNodes.run( html );
                // Set string value
                this._stringValue = this._nodes.stringValue();
                // Normalize node objects
                this._nodeStyles = this._nodes.getStringStyles();

                return this;
            },
            setTextNodes: function( nodes ) {
                if( !Array.isArray( nodes ) ) { 
                    util.debug.warn( "Invalid text nodes type, " + typeof nodes );
                    return this;
                }
                // Node accessors won't exist
                this._nodes = [];
                this._nodeStyles = nodes;

                nodes.forEach( function( node ) {
                    this._stringValue += node.stringValue;
                } );

                return this;
            },
            
            getTextNodes: function() {
                return this._nodes;
            },
            getTextNodeStyles: function() {
                return this._nodeStyles;
            },
            getHtmlFromNodeStyles: function() {
                // Process styles and font family
                var html = [ "" ],
                    lineIndex = 0,
                    textAlign = "left";

                this._nodeStyles.forEach( function( node, i, arr ) {
                    var str = "",
                        style = node.style || {},
                        lineBreak = node.leadingLineBreak;

                    str = setTextStyles( style, encodeSpecialCharacters( node.stringValue ) );

                    // Font family exists and is not a default font
                    if( style[ "font-family" ] && !testIsDefaultFont( style[ "font-family" ] ) ) {
                        str = setCustomFont( style[ "font-family" ], str );
                    }

                    if( style.color && !( style.color === "#000000" || style.color === "rgb(0, 0, 0)" ) ) {
                        str = setColorStyle( style.color, str );    
                    }

                    // Process line breaks
                    if( lineBreak ) {
                        html[ lineIndex ] = setTextAlign( textAlign, html[ lineIndex ] );

                        // Update line index
                        lineIndex += 1;
                        // Update html
                        html[ lineIndex ] = "";
                        // Update text align
                        textAlign = style[ "text-align" ] || "left";
                    }

                    // Prepend html to local string
                    str = html[ lineIndex ] + str;

                    // Set html
                    html[ lineIndex ] = ( i + 1 === arr.length ) ? setTextAlign( textAlign, str ) : str;
                } );

                return html.join( "" );
            },
            getStringValue: function() {
                return this._stringValue;
            },

            getTextStyleAtIndex: function( styleName, index ) {
                if( typeof styleName !== "string" ) { return this; }
                index = typeof index === "number" ? number : 0;

                var nodes = this._nodeStyles,
                    nodeIndex = -1,
                    value;

                nodes.some( function( node, i ) {
                    if( node.index <= index && index < node.index + node.length ) {
                        nodeIndex = i;
                        return true;
                    }
                } );

                if( nodeIndex >= 0 ) {
                    value = nodes[ nodeIndex ].style[ styleName ];
                }

                return typeof value !== "undefined" ? value : null;
            },
            firstInstanceofTextStyle: function( styleName ) {
                var nodes = this._nodeStyles,
                    value = null;

                nodes.some( function( node ) {
                    if( node.style && node.style[ styleName ] ) {
                        value = node.style[ styleName ];
                        return true;
                    }
                } );
                
                return value;
            },
            
            // First Instance of style
            getTextAlign: function() {
                return this.firstInstanceofTextStyle( "text-align" );
            },
            getLineHeight: function() {
                return this.firstInstanceofTextStyle( "line-height" );
            },
            getLetterSpacing: function() {
                return this.firstInstanceofTextStyle( "letter-spacing" );
            },
            getColor: function() {
                return this.firstInstanceofTextStyle( "color" );
            },
            getFontSize: function() {
                return this.firstInstanceofTextStyle( "font-size" );
            },
            getFontFamily: function() {
                return this.firstInstanceofTextStyle( "font-family" );
            },

            setTextStyleValueForNameAtIndex: function( value, styleName, index ) {
                if( typeof styleName !== "string" ) { log( "ret" ); return this; }
                index = typeof index === "number" ? index : 0;

                var nodes = this._nodeStyles,
                    nodeIndex = -1,
                    node;

                // Get index of node
                if( nodes.length > 0 ) {
                    nodes.some( function( node, i ) {
                        if( node.index <= index && index < node.index + node.length ) {
                            nodeIndex = i;
                            return true;
                        }
                    } );
                }

                if( nodeIndex >= 0 ) {
                    node = nodes[ nodeIndex ];
                    node.style = node.style || {};

                    node.style[ styleName ] = value;
                } else {
                    util.debug.warn( "Text index out of bounds" );
                }

                return this;
            },
            
            // Set zero index style value
            setTextAlign: function( value ) {
                this.setTextStyleValueForNameAtIndex( value, "text-align", 0 );

                return this;
            },
            setLineHeight: function( value ) {
                this.setTextStyleValueForNameAtIndex( value, "line-height", 0 );

                return this;
            },
            setLetterSpacing: function( value ) {
                this.setTextStyleValueForNameAtIndex( value, "letter-spacing", 0 );

                return this;
            },
            setColor: function( value ) {
                this.setTextStyleValueForNameAtIndex( value, "color", 0 );

                return this;
            },
            setFontSize: function( value ) {
                this.setTextStyleValueForNameAtIndex( value, "font-size", 0 );

                return this;
            },
            setFontFamily: function( value ) {
                this.setTextStyleValueForNameAtIndex( value, "font-family", 0 );

                return this;
            }
        };

    var csHelpers = {
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
        },
        overlayHelpers = extend( {}, csHelpers, {
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
        } ),
        pageHelpers = extend( {}, csHelpers, {
            getPageId: function() {
                return this.spec.pageId;
            },
            setPageId: function( id ) {
                this.spec.pageId = id;
            }
        } ),
        containerHelpers = {
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
        },
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

    return util.Object.extend( {
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
                json = getJSONObjectWithData( getFileData( url ) );

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

            if( pageIds.indexOf( id ) > 0 || pageSetIds.indexOf( id ) > 0 ) {
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
                screens = screenSupport && screenSupport.screens ? screenSupport.screens : [];

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

        generateOverlayId: function( testId ) {
            var id = "overlay",
                overlayIds = this.getOverlaysIds();

            if( typeof testId === "string" && overlayIds.indexOf( testId ) === -1 ) {
                return testId;
            }

            while( overlayIds.indexOf( id + ++this.overlayId ) !== -1 ) {}
            id += this.overlayId;
            
            return id;
        },
        generatePageId: function( testId ) {
            var id = "page",
                pageIds = this.getPagesIds();

            if( typeof testId === "string" && pageIds.indexOf( testId ) === -1 ) {
                return testId;
            }

            while( pageIds.indexOf( id + ++this.pageId ) !== -1 ) {}
            id += this.pageId;

            return id;
        },
        replaceIdWithId: function( obj, currentId, newId ) {
            if( arguments.length === 2 ) {
                newId = currentId;
                currentId = obj.overlayId || obj.pageId || undefined;
            }
            if( typeof obj !== "object" || typeof currentId !== "string" || typeof newId !== "string" ) {
                return;
            }

            for( var key in obj ) {
                if( typeof obj[ key ] === "object" ) {
                    this.replaceIdWithId( obj[ key ], currentId, newId );
                } else if( obj[ key ] === currentId ) {
                    obj[ key ] = newId;
                }
            }

            return obj;
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

                return pageSet;
            }
            return null;
        },
        typeofOverlay: function( overlay ) {
            var type,
                basicButtonProps = [
                    "cgButtonColor",
                    "cgButtonAlpha",
                    "cgButtonPressedColor",
                    "cgButtonPressedAlpha",
                    "cgCornerRadius",
                    "cgBorderColor",
                    "cgBorderWidth",
                    "cgBorderAlpha"
                ];

            if( overlay.type === "button" ) {
                if( overlay.images || overlay.imagesDown || overlay.imagesOn || overlay.imagesDownOn ) {
                    type = "image " + type;
                } else if( basicButtonProps.filter( function( prop ) {
                        return overlay[ prop ] ? true : false;
                    } ).length > 0 ) {
                    type = "basic " + type;
                } else {
                    type = "hotspot " + type;
                }
            } else {
                type = overlay.type || null;
            }

            return type;
        }
    } );
} )( {
    schemaVersion: "3.18",
    resetCSS: "reset3.14.1.css"
} );