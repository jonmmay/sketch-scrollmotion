/* global log , CocoaBridge , AppSandbox , NSMutableDictionary */

@import "cocoaBridge.js";
@import "sandbox.js";

// TO DO: Alert helper
// TO DO: Error messaging for:
    // Document isn't saved
    // Document doesn't have artboards
// TO DO: Identify Sketch versions
// TO DO: Combo box for user prompts


var Util = ( function( Util , _cb ) {
    "use strict";

    var u = {};

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
            len = _cb.count( obj );

            for( i ; i < len ; i++ ) {
                iterator( _cb.objectAtIndex( obj , i ) , i );
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
        return _cb.fileExistsAtPath( path );
    };
    u.removeFolder = function( path ) {
        u.log("Removing file at: " + path );
        _cb.removeItemAtPath( path );
    };
    u.createFolders = function( path , folders ) {
        new AppSandbox().authorize( path , function() {
            var i = _cb.count( folders ) - 1;

            for( i ; i > -1 ; i-- ) {
                _cb.createDirectoryAtPath( _cb.objectAtIndex( folders , i ) );
            }
        } );
    };
    u.saveFileFromString = function( path , filename , filestring ) {
        new AppSandbox().authorize( path , function() {
            var localPath = _cb.stringByAppendingString( filename ),
                str = _cb.stringByAppendingString( filestring );

            _cb.writeToFile( str , localPath , "UTF8" );
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

var Config = ( function( Config , _cb ) {
    "use strict";

    var context,
        pluginPath,
        pluginExt = ".sketchplugin",
        resourcesPath,
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

            // Not yet implemented
            settingsFilePath = targetFolder + "/smsketch.json";
            settingsExist = _cb.fileExistsAtPath( settingsFilePath );

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
        }
    } );

    return Config;
} ( Config || {} , CocoaBridge ) );