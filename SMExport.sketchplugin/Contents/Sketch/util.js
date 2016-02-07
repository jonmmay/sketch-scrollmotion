// Documentation for readability; not tested to produce a valid output

var util = ( function() {
    var util = {},
        logLevel = 5,
        logMethods = "error,warn,info,debug,log".split( "," )
        debug = {};

    util.debug = debug;
    
    /**
        * @desc Set the level of debugging
        * @param {number} level - level of debug logging
        * @returns void
    */
    debug.setLevel = function( level ) {
        if( typeof level === "number" ) {
            logLevel = level;
        }
    };

    /**
        * @desc Get log level of debugging
        * @returns {number} level of debug logging
    */
    debug.getLevel = function() {
        return logLevel;
    };

    /**
        * @see {@link http://benalman.com/projects/javascript-debug-console-log/} for information
        * log (5) > debug (4) > info (3) > warn (2) > error (1)
        * @private
        * @returns void
    */
    function initDebug() {
        var idx = logMethods.length;

        function is_level( level ) {
            return ( logLevel > 0 ) ? logLevel > level : logMethods.length + logLevel <= level;
        }

        while( --idx >= 0 ) {
            ( function( idx , level ) {
                    
                debug[ level ] = function() {
                    var args = Array.prototype.slice.call( arguments ),
                        window = window || {};

                    if( !is_level( idx ) ) { return; }
                    if( window.console ) {
                        if( window.console[ level ] ) {
                            window.console[ level ]( args );
                        } else if( window.console.log ) {
                            window.console.log( args );
                        }    
                    } else {
                        util.log.apply( null , args );
                    }
                };
            } ( idx , logMethods[ idx ] ) );
        }
    }
    initDebug();

    /**
        * @desc Logging function to write to developer console
        * @param {...*} msg - messages to be logged
        * @returns void
    */
    util.log = function( msg ) {
        if( arguments.length > 1 ) {
            log( Array.prototype.slice.call( arguments ).join( "\n" ) );
        } else {
            log( msg );
        }
    };

    /**
        * @desc Assertion function for testing
        * @param {boolean} outcome - Assertion results
        * @param {string} description - Assertion description to be logged
    */
    util.assert = function( outcome, description ) {
        debug.log( ( outcome ? "Pass" : " * Fail" ) + ": " + description );            
    };

    /**
        * @desc Constructor for extending and creating class constructors
        * Primary value is passing plugin context to Objects outside of plugin script handler
        * @namespace util
        * @example
        * // returns {object} subclass of util.Object
        * var sub = util.Object.extend( { init: function( ctx ) { this._super( ctx ); } } );
        * @example
        * // returns {object} new instance of subclass with plugin context
        * sub.create( pluginContext );
    */    
    util.Object = ( function() {
        var superPattern = /xyz/.test( function() { xyz; } ) ? /\b_super\b/ : /.*/,
            object;

        function newtype( prototype ) {
            var instance = prototype.instance = function () {};
            
            instance.prototype = prototype;
            return prototype;
        }

        object = newtype( {
            /**
                * @memberof util.Object
                * @method create 
                * @returns {object}
            */
            create: function() {
                var instance;

                instance = new this.instance();            

                if( this.init ) {
                    this.init.apply( instance, arguments );    
                }
                return instance;
            },
            /**
                * @memberof util.Object
                * @method extend
                * @param {object} properties -
                * @returns {object}
            */
            extend: function( properties ) {
                var _super = this,
                    prototype;

                prototype = new _super.instance();

                Object.defineProperty( properties, "_super", { value: this,
                                                               writable: true,
                                                               enumerable: false,
                                                               configurable: true } );

                Object.getOwnPropertyNames( properties ).forEach( function( name ) {

                    Object.defineProperty( prototype, name, typeof properties[ name ] == "function" &&
                                                            typeof _super[ name ] == "function" && 
                                                            superPattern.test( properties[ name ] ) ?
                        ( function( name, fn ) {
                            var descriptor = Object.getOwnPropertyDescriptor( properties, name );
                            
                            descriptor.value = function() {
                                var tmp = Object.getOwnPropertyDescriptor( this, "_super" ),
                                    ret;

                                this._super = _super[ name ];
                                ret = fn.apply( this, arguments );

                                if( tmp ) {
                                   Object.defineProperty( this, "_super", tmp ); 
                                } else {
                                    delete this._super;
                                }
                                
                                return ret;
                            };
                            return descriptor;
                        } )( name, properties[ name ] ) :
                        Object.getOwnPropertyDescriptor( properties, name ) );
                } );

                return newtype( prototype );
            },
            /**
                * @memberof util.Object
                * @method instanceOf
                * @param {object} prototype -
                * @returns {boolean} -
            */
            instanceOf: function( prototype ) {
                return this instanceof ( prototype.instance ? prototype.instance : prototype );
            },
            /**
                * @memberof util.Object
                * @method init
                * @param {object} [ctx] - Sketch Plugin context
            */
            init: function( ctx ) {
                if( ctx ) {
                    this.context = ctx;
                    this.doc = ctx.document;
                    this.plugin = ctx.plugin;
                    this.selection = ctx.selection;
                    this.command = ctx.command;
                }
            }
        } );

        return object;
    } )();

    /**
        * @desc
        * @param {function} execute -
        * @param {funcion} undo -
        * @param {*} value -
        * returns {object}
    */
    util.Command = util.Object.extend( {
        init: function( execute, undo, value ) {
            this.execute = execute;
            this.undo = undo;
            this.value = value;
        }
    } );

    /**
        * @desc Iterate over a Cocoa Array or Object of JS Array or Object
        * @param {object|array} obj - 
        * @param {util~requestCallback} iterator - The callback executed on sub item
        * @returns void
    */
    util.forEach = function( obj, iterator ) {
        /**            
            * @callback util~requestCallback
            * @param {*} item - 
            * @param {number} index -
        */
        var i,
            len;

        // Cocoa
        if( obj.count && obj.class ) {
            // Cocoa array
            if( [obj isKindOfClass:[NSArray class]] || [obj className] == "MSArray" ) {
                i = 0;
                len = [obj count];

                for( i ; i < len ; i++ ) {
                    iterator( [obj objectAtIndex:i], i );
                }
            } 
            // Cocoa object
            else {
                for( i in obj ) {
                    iterator( [obj objectForKey:i] , i );
                }
            }  
        }
        // JavaScript Array
        else if( obj instanceof Array ) {
            obj.forEach( iterator );
        } 
        // JavaScript Object
        else if( typeof obj === "object" ) {
            for( i in obj ) {
                iterator( obj[ i ] , i );
            }
        } else {
            debug.log( "cannot iterator this obj of " + ( obj.className ? [obj className] : ( typeof obj ) ) );
        }
    };

    /**
        * @desc List of an objects properties' values
        * @param {object|array} obj -
        * @returns {array} List of an object's values
    */
    util.values = function( obj ) {
        var valArr = [];
        util.forEach( obj, function( val, key ) {
            // Cocoa
            if( val.className ) {
                valArr.push( val );
            }
            // JavaScript
            else if( obj.hasOwnProperty( key ) && typeof val !== "function" ) {
                valArr.push( val );
            }
        } );
        return valArr;
    };

    /**
        * @desc Stringify a Cocoa JSON object
        * @param {object} obj -
        * @param {boolean} prettyPrinted - Whether string includes line breaks and indentations
        * @return {NSString|null} Stringified object; else null
    */
    util.stringifyJSON = function( obj, prettyPrinted ) {
        var err = [[MOPointer alloc] init],
            prettySetting = prettyPrinted ? NSJSONWritingPrettyPrinted : 0,
            jsonData = [NSJSONSerialization dataWithJSONObject:obj options:prettySetting error:err],
            string;

        if( [err value] ) {
            throw "Stringify JSON error, " + [err value];
        } else {
             string = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
             // Removes escape forward slashes
            return [string stringByReplacingOccurrencesOfString:@"\\/" withString:@"/"];
        }

        return null
    };

    /**
        * @desc Merge multiple objects into a single object
        * @param {...object} root -
        * @returns {object} Single object
    */
    util.merge = function( root ) {
        var args = Array.prototype.slice.call( arguments, 1, arguments.length ),
            rootIsObject = util.isObject( root ),
            rootIsMutable = root.class ? [root isKindOfClass:[NSMutableDictionary class]]: true;
        
        if( !rootIsObject ) { return root; }
        if( !rootIsMutable ) { root = [[NSMutableDictionary alloc] initWithDictionary:root]; }
  
        args.forEach( function( obj ) {
            for( var key in obj ) {
                root[ key ] = obj[ key ];
            }
        } );    
        
        return root;
    };

    /**
        * @desc Identify common and different properties for a series of objects
        * @param {...object} objects -
        * @returns {object} results
        * @returns {object} results.common - Common properties with values of last parameter
        * @returns {array} results.different - Property key names not shared with all parameters
    */
    util.commonProperties = function( objects ) {
        var objects = util.isArray( objects ) ? objects : Array.prototype.slice.call( arguments ),
            common = objects.reduce( function( acc, obj ) {
                for( var p in obj ) {
                    acc[ p ] = obj[ p ];
                }
                
                return acc;
            }, {} ),
            different = objects.reduce( function( acc, obj ) {
                for( var p in common ) {
                    if( typeof obj[ p ] === "undefined" ) {
                        delete common[ p ];
                        acc.push( p );
                    }
                }

                return acc;
            }, [] );
        return {
            common: common,
            different: different
        };
    };

    /**
        * @desc clone an object
        * @param {object|NSMutableDictionary} obj -
        * @returns {object|null} Copy of object parameter; else null
    */
    util.naiveClone = function( obj ) {
        if( obj.class && [obj isKindOfClass:[NSMutableDictionary class]] ) {
            return [obj mutableCopy];
        } else if( typeof( obj ) === "object" ) {
            return JSON.parse( JSON.stringify( obj ) ); 
        }
        return null;
    };

    /**
        * @desc
        * @param
        * @return
        * @private
    */
    function getSubstringAfterLastIndexOf( strI, str ) {
        return str.substring( str.lastIndexOf( strI ) + 1 );
    }

    /**
        * @desc
        * @param
        * @return
        * @private
    */
    function getSubstringBeforeLastIndexOf( strI, str ) {
        return str.substring( 0, str.lastIndexOf( strI ) );
    }

    /**
        * @desc
        * @param
        * @return
    */
    util.getLastPathComponent = function( pathStr ) {
        return  getSubstringAfterLastIndexOf( "/", pathStr );
    };

    /**
        * @desc
        * @param
        * @return
    */
    util.getPathByDeletingLastPathComponent = function( pathStr ) {
        return getSubstringBeforeLastIndexOf( "/", pathStr );
    };

    /**
        * @desc
        * @param
        * @return
    */
    util.getPathExtension = function( pathStr ) {
        return getSubstringAfterLastIndexOf( ".", pathStr );
    };

    /**
        * @desc
        * @param
        * @return
    */
    util.getPathByDeletingPathExtension = function( pathStr ) {
        return getSubstringBeforeLastIndexOf( ".", pathStr );
    };

    /**
        * @desc Ensure string passed through function is unique
        * @param {string} str -
        * @returns {string} String value
    */
    util.unique = function( str ) {
        util.unique.cache = util.unique.cache || {};
        var lowerCaseStr;

        str = str || "untitled";
        lowerCaseStr = str.toLowerCase();

        if( !util.unique.cache[ lowerCaseStr ] ) {
            util.unique.cache[ lowerCaseStr ] = 1;
            return str;
        } else {
            util.unique.cache[ lowerCaseStr ] += 1;
            return str + "-" + util.unique.cache[ lowerCaseStr ];
        }
    };

    /**
        * @desc Slugify string by replacing special characters with underscore (_)
        * @param {string} str -
        * @returns {string} Slugified string
    */
    util.slugify = function( str ) {
        var replaceVal = "_",
            
            // \u0022 = Double quotation mark
            // \u005C = Backslash
            invalidVals = [
                "!" , "+" , "#" , "$" , "%" ,
                "&" , "%" , "'" , "(" , ")" ,
                "*" , "-" , "/" , "<" , "=" ,
                ">" , "?" , "@" , "[" , "]" ,
                "^" , "_" , "`" , "{" , "|" ,
                "}" , "," , "." , ":" ,
                "\s" , "\u0022" , "\u005C"
            ].map( function( val ) {
                // Prepend all special characters with "\" for RegExp
                return "\\" + val;
            } );

        // Replace invalid values with replacement value
        return str.replace( new RegExp( invalidVals.join( "|" ), "g" ), replaceVal )
                  
                // Remove adjacent duplicate replacement values
                  .replace( new RegExp( replaceVal + "+", "g" ), replaceVal )

                // Remove replacement values at start and end of string
                  .replace( new RegExp( "^" + replaceVal + "|" + replaceVal + "$" ), "" );
    };

    /**
        * @desc Append pixel to value
        * @param {string|number} val -
        * @returns {string} Value as pixel value
    */
    util.toPx = function( val ) { return val + "px"; };

    /**
        * @desc Used to convert RGB color to Hex color
        * @param {number} c -
        * @returns {string} Hex value of number
        * @private
    */
    function compToHex( c ) {
        var hex = c.toString( 16 );
        
        return hex.length === 1 ? "0" + hex : hex;
    }

    /**
        * @desc Convert RGB color to Hex color
        * @param {number} - Red
        * @param {number} - Green
        * @param {number} - Blue
        * @return {string} Hex color
    */
    util.rgbToHex = function( r, g, b ) {
        var color = Array.prototype.slice.call( arguments );

        if( color.length === 4 ) { color.pop(); }

        return "#" + color.map( function( val ) {
            return compToHex( Number( val ) );
        } ).join( "" );
    };

    /**
        * @desc Convert Hex color to RGB color
        * @param {string} hex - Hex color
        * @returns {object|null} Object with red, green, and blue values; else null if invalid
    */
    util.hexToRgb = function( hex ) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec( hex );
        return result ? {
            r: parseInt( result[ 1 ], 16 ),
            g: parseInt( result[ 2 ], 16 ),
            b: parseInt( result[ 3 ], 16 )
        } : null;
    };

    /**
        * @desc Capture number from string
        * @param {string} string -
        * @returns {number|null} Number; else null if invalid
    */
    util.num = function( string ) {
        var str = string.match( /^\-?(?:(\d+\.\d+)|(\d+))/gi );
        
        return ( str !== null ) ? Number( str ) : null;
    };
    
    /**
        * @desc Round number half up
        * @param {number} num -
        * @returns Integer
    */
    util.roundHalfUp = function( num ) {
        return Math.floor( num + 0.5 );
    };

    /**
        * @desc Whether value is a Cocoa or JS array
        * @param {*} obj -
        * @returns {boolean}
    */
    util.isArray = function( obj ) {
        return ( obj && ( ( obj.class && [obj isKindOfClass:[NSArray class]] ) ||
            obj instanceof Array ) ) ? true : false;
    };

    /**
        * @desc Whether value is a Cocoa or JS object
        * @param {*} obj -
        * @returns {boolean}
    */
    util.isObject = function( obj ) {
        return ( obj && ( ( obj.class && [obj isKindOfClass:[NSDictionary class]] ) ||
            obj instanceof Object ) ) ? true : false;
    }

    /**
        * @desc empty function helper
    */
    util.noop = function() {};

    return util;
} )();