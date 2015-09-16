/* global log , CocoaBridge , AppSandbox , NSMutableDictionary */

@import "cocoaBridge.js";
@import "sandbox.js";

// TO DO: Alert helper
// TO DO: Error messaging for:
    // Document isn't saved
    // Document doesn't have artboards
// TO DO: Identify Sketch versions
// TO DO: Combo box for user prompts


var Util = ( function( Util , CB ) {
    "use strict";

    var u = {},
        logLevel = 5,
        logMethods = [ "error", "warn", "info", "debug", "log" ],
        idx = logMethods.length,
        debug = {};

    // http://benalman.com/projects/javascript-debug-console-log/
    // log (1) < debug (2) < info (3) < warn (4) < error (5)
    function is_level( level ) {
        return ( logLevel > 0 ) ? logLevel > level : logMethods.length + logLevel <= level;
    }
    debug.setLevel = function( level ) {
        if( typeof level === "number" ) {
            logLevel = level;
        }
    };

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
                    u.log.apply( null , args );
                }
            };
        } ( idx , logMethods[ idx ] ) );
    }

    u.debug = debug;

    u.log = function() {
        log( Array.prototype.slice.call( arguments ).join( "\n" ) );        
    };
    u.filter = function( obj , predicate , context ) {
        var results = [];

        u.forEach( obj , function( val , i , list ) {
            if( predicate.call( context , val , i , list ) ) {
                results.push( val );
            }
        } );
        return results;
    };
    u.forEach = function( obj , iterator ) {
        var i,
            len;

        if( obj.count && obj.className ) {
            // Cocoa array
            i = 0;
            len = CB.Array.count( obj );

            for( i ; i < len ; i++ ) {
                iterator( CB.Array.objectAtIndex( obj , i ) , i );
            }

        } else if( Object.prototype.toString.call( obj ) === "[object Array]" ) {
            obj.forEach( iterator );
        } else if( typeof obj === "object" ) {
            for( i in obj ) {
                iterator( obj[ i ] , i );
            }
        } else {
            u.log( "cannot iterator this obj of " + ( obj.className ? obj.className() : ( typeof obj ) ) );
        }
    };
    u.values = function( obj ) {
        var valArr = [];
        u.forEach( obj , function( val , key ) {
            if( obj.hasOwnProperty( key ) && typeof val !== "function" ) {
                valArr.push( val );
            }
        } );
        return valArr;
    };

    u.duplicateLayer = function( layer ) {
        var layerCopy = layer.duplicate();
        layerCopy.removeFromParent();

        return layerCopy;
    };
    u.folderExists = function( path ) {
        return CB.fileExistsAtPath( path );
    };
    u.removeFolder = function( path ) {
        u.log("Removing file at: " + path );
        CB.removeItemAtPath( path );
    };
    u.createFolders = function( path , folders ) {
        new AppSandbox().authorize( path , function() {
            var i = CB.Array.count( folders ) - 1;

            for( i ; i > -1 ; i-- ) {
                CB.createDirectoryAtPath( CB.Array.objectAtIndex( folders , i ) );
            }
        } );
    };
    u.saveFileFromString = function( path , filename , filestring ) {
        new AppSandbox().authorize( path , function() {
            var localPath = CB.stringByAppendingString( filename ),
                str = CB.stringByAppendingString( filestring );

            CB.writeToFile( str , localPath , "UTF8" );
        } );
    };
    u.unique = function( str ) {
        u.unique.cache = u.unique.cache || {};
        var lowerCaseStr;

        str = str ? str.replace( /\-/g , "_" ) : "untitled";
        lowerCaseStr = str.toLowerCase();

        if( !u.unique.cache[ lowerCaseStr ] ) {
            u.unique.cache[ lowerCaseStr ] = 1;
            return str;
        } else {
            u.unique.cache[ lowerCaseStr ] += 1;
            return str + "-" + u.unique.cache[ lowerCaseStr ];
        }
    };
    u.slugify = function( str ) {
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
        return str.replace( new RegExp( invalidVals.join( "|" ) , "g" ) , replaceVal )
                  
                // Remove adjacent duplicate replacement values
                  .replace( new RegExp( replaceVal + "+" , "g" ) , replaceVal )

                // Remove replacement values at start and end of string
                  .replace( new RegExp( "^" + replaceVal + "|" + replaceVal + "$" ) , "" );
    };
        
    u.compToHex = function( c ) {
        var hex = c.toString( 16 );
        return hex.length === 1 ? "0" + hex : hex;
    };
    u.toRgba = function( color ) {
        return String( color ).replace( /[\(\)]/g , "" ).split( " " ).map( function( val ) {
            var types = val.split( ":" ),
                type = types[ 0 ],
                value = types[ 1 ];

            if( type !== "a" ) {
                return Math.round( Number( value ) * 255 );
            }
            return Number( value );
        } ).join( "," );
    };
    u.toHex = function( color ) {
        color = u.toRgba( color ).split( "," );
        if( color.length === 4 ) { color.pop(); }

        return "#" + color.map( function( val ) {
            return u.compToHex( Number( val ) );
        } ).join( "" );
    };

    u.toPx = function( val ) { return val + "px"; };

    u.noop = function() {};

    // Merge u into Util
    u.forEach( u , function( _util , i ) {
        if( !Util.hasOwnProperty( i ) ) {
            Util[ i ] = _util;
        }
    } );

    return Util;
} ( Util || {} , CocoaBridge ) );

var Config = ( function( Config , CB ) {
    "use strict";

    var context,
        pluginPath,
        pluginExt = ".sketchplugin",
        resourcesPath,
        userFolder,
        documentPath,
        documentName,
        targetFolder,
        
        settings = NSMutableDictionary.alloc().init(),
        settingsFilePath,
    	settingsExist,
        
        exportImgExt = ".png",
        exportFactors = [ 0.5 , 1.0 , 1.5 , 2.0 , 3.0 ],
        exportScaleFactor = 1;

    function init( _context ) {
        init.inited = init.inited || false;
        var doc = _context.document;

        context = _context;
        
        if( !init.inited ) {
            init.inited = true;

            documentPath = doc.fileURL().path().replace( /\/[^\/]+\.sketch$/ , "\/" );
            documentName = doc.displayName().replace( ".sketch" , "" );
            targetFolder = documentPath + documentName + ".scrollmotion";
            pluginPath = String( context.scriptPath );

            pluginPath = pluginPath.substring( 0 , pluginPath.indexOf( pluginExt ) + pluginExt.length );
            resourcesPath = pluginPath + "/Contents/Resources";
            userFolder = pluginPath + "/Contents/User";

            // Not yet implemented
            settingsFilePath = targetFolder + "/smsketch.json";
            settingsExist = CB.fileExistsAtPath( settingsFilePath );

            Util.log( "Config inited" );
        }
    }


    Config.init = init;
    Config.exportImgExt = exportImgExt;
    Config.exportScaleFactor = exportScaleFactor;

    Object.defineProperties( Config , {
    	"documentPath": {
	    	get: function() { return documentPath; }
	    },
	    "documentName": {
	    	get: function() { return documentName; }
	    },
	    "targetFolder": {
	    	get: function() { return targetFolder; }
	    },
        "pluginPath": {
            get: function() { return pluginPath; }
        },
        "resourcesPath": {
            get: function() { return resourcesPath; }
        },
        "userFolder": {
            get: function() { return userFolder; }
        }
    } );

    return Config;
} ( Config || {} , CocoaBridge ) );