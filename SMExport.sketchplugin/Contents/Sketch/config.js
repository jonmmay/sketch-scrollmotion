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
        resourcesPath,
        documentPath,
        documentName,
        targetFolder,
        tempFolder,
        inited = false,

        exportImgExt = ".png",
        exportFactors = [ 0.5 , 1.0 , 1.5 , 2.0 , 3.0 ],
        exportScaleFactor = 1;


    ////////////////////////////////////////////////////
    // Helper functions for dealing with path strings //
    ////////////////////////////////////////////////////
    
    function getSubstringAfterLastIndexOf( strI , str ) {
        return str.substring( str.lastIndexOf( strI ) + 1 );
    }
    function getSubstringBeforeLastIndexOf( strI , str ) {
        return str.substring( 0 , str.lastIndexOf( strI ) );
    }
    function getLastPathComponent( pathStr ) {
        return  getSubstringAfterLastIndexOf( "/" , pathStr );
    }
    function getPathByDeletingLastPathComponent( pathStr ) {
        return getSubstringBeforeLastIndexOf( "/" , pathStr );
    }
    function getPathExtension( pathStr ) {
        return getSubstringAfterLastIndexOf( "." , pathStr );
    }
    function getPathByDeletingPathExtension( pathStr ) {
        return getSubstringBeforeLastIndexOf( "." , pathStr );
    }

    
    ////////////////////////////////////////////////////
    ///////////// Plugin Accessor functions ////////////
    ////////////////////////////////////////////////////

    function getPluginPathRoot() {
        var pluginExt = ".sketchplugin",
            pluginPath = String( context.scriptPath );

        return pluginPath.substring( 0 , pluginPath.indexOf( pluginExt ) + pluginExt.length );
    }
    function getResourcesSettingsURL() {
        var pluginPath = getPluginPathRoot(),
            pluginName = getLastPathComponent( pluginPath ),
            pluginSettings = pluginName + "-settings";

            // Should get resources folder from config
            return NSURL.fileURLWithPath( pluginPath + "/Contents/Resources/" + pluginSettings );
    }
    function getResourcesSettingsManifest() {
        var manifestPath = getResourcesSettingsURL().fileSystemRepresentation();
        if( CB.fileExistsAtPath( manifestPath ) ) {
            return CB.jsonWithContentsOfFile( manifestPath );
        }
        return {};
    }
    function getPluginManifest() {
        var pluginPath = getPluginPathRoot(),
            sketchFolder = pluginPath + "/Contents/Sketch",
            manifestPath = sketchFolder + "/manifest.json";

        if( CB.fileExistsAtPath( manifestPath ) ) {
            return CB.jsonWithContentsOfFile( manifestPath );
        }
        return {};
    }
    function getPluginIdentifier() {
        var identifier = getPluginManifest().identifier;
        return String( identifier );
    }


    ////////////////////////////////////////////////////
    ///////// User Settings Accessor functions /////////
    ////////////////////////////////////////////////////

    function useUserSettings() {
        return CB.fileExistsAtPath( getUserSettingsURL().fileSystemRepresentation() );
    }
    function getUserSettingsURL() {
        var fileManager = NSFileManager.defaultManager(),
            documentsURL = fileManager.URLsForDirectory_inDomains( NSDocumentDirectory , NSUserDomainMask )[ 0 ],
            pluginName = getLastPathComponent( getPluginPathRoot() ),
            pluginSettings = pluginName + "-settings",
            // manifest identifier, com.company.sketch.export-awesomeness
            pluginIdentifier = getPluginIdentifier(),
            userSettingsURL;

        userSettingsURL = documentsURL.URLByAppendingPathComponent_isDirectory( pluginIdentifier , true );
        userSettingsURL = userSettingsURL.URLByAppendingPathComponent( getPathByDeletingPathExtension( pluginSettings ) );
        userSettingsURL = userSettingsURL.URLByAppendingPathExtension( getPathExtension( pluginSettings ) );

        return userSettingsURL;
    }
    function getTempSettingsURL() {
        var tempPathURL = NSURL.fileURLWithPath_isDirectory( getPathByDeletingLastPathComponent( tempFolder ) , true ),
            pluginName = getLastPathComponent( getPluginPathRoot() ),
            pluginSettings = pluginName + "-settings",
            tempSettingsURL;

        tempSettingsURL = tempPathURL.URLByAppendingPathComponent( getPathByDeletingPathExtension( pluginSettings ) );
        tempSettingsURL = tempSettingsURL.URLByAppendingPathExtension( getPathExtension( pluginSettings ) );

        return tempSettingsURL;
    }
    function getSettingsManifest() {
        var url;
        if( useUserSettings() ) {
            url = getUserSettingsURL();
        } else {
            if( !CB.fileExistsAtPath( getTempSettingsURL().fileSystemRepresentation() ) ) {
                saveTempSettings( getResourcesSettingsManifest() );
            }
            url = getTempSettingsURL();
        }

        return CB.jsonWithContentsOfFile( url.fileSystemRepresentation() );
    }


    ////////////////////////////////////////////////////
    /////////// User Settings Save functions ///////////
    ////////////////////////////////////////////////////

    function saveUserSettings( json ) {
        var fullPathStr = getUserSettingsURL().fileSystemRepresentation(),
            settingsPath = getPathByDeletingLastPathComponent( fullPathStr );

        // var revealInFinder = function( path ) {
        //     // Open folder in Finder
        //     var workspace = NSWorkspace.alloc().init();
        //     [workspace selectFile:path inFileViewerRootedAtPath:@""];
        // }
        
        // Reveal folder in finder
        // var userSettingURL = [NSURL fileURLWithPath:settingsPath isDirectory:true];
        // revealInFinder( userSettingURL.fileSystemRepresentation() );

        if( !Util.folderExists( settingsPath ) ) {
            Util.createFolders( getPathByDeletingLastPathComponent( settingsPath ) , CocoaBridge.Array.arrayWithObjects( settingsPath ) );
        }
        
        // Save 
        Util.saveFileFromString( settingsPath , fullPathStr , CocoaBridge.stringify( json , true ) );
    }
    function saveTempSettings( json ) {
        var tempPathStr = getTempSettingsURL().fileSystemRepresentation();
        
        // Reveal folder in finder  
        // var settingsPath = getPathByDeletingLastPathComponent( tempPathStr ),
        //  tempSettingURL = [NSURL fileURLWithPath:settingsPath isDirectory:true];
        // revealInFinder( tempSettingURL.fileSystemRepresentation() );

        // Save
        // Temp folder does not require sandbox authorization
        CocoaBridge.writeToFile( CocoaBridge.stringify( json , true ) , CocoaBridge.stringByAppendingString( tempPathStr ) , "UTF8" );
    }
    function saveSettingsManifest( json ) {
        var fn = useUserSettings() ? saveUserSettings : saveTempSettings;
        fn( json );
    }

    function documentIsSaved() {
        // Should coerse comparison between OSX and JS
        return context.document.fileURL() != null; // jshint ignore:line
    }
    function getTargetFolderPath() {
        return useUserSettings() ? documentPath + "/" + documentName : tempFolder;
    }
    function createTempFolder() {
        var fileManager = NSFileManager.defaultManager(),
            // Name of project file, demo.sketch
            displayName = context.document.displayName(),
            // manifest identifier, com.company.sketch.export-awesomeness
            pluginIdentifier = getPluginIdentifier(),
            tempDirPath = NSTemporaryDirectory(),
            tempDirURL;

        tempDirPath = tempDirPath.stringByAppendingPathComponent( pluginIdentifier );
        tempDirPath = tempDirPath.stringByAppendingPathComponent( displayName.replace( ".sketch" , ".scrollmotion" ) );

        if( CB.fileExistsAtPath( tempDirPath ) ) {
            CB.removeItemAtPath( tempDirPath );
        }

        tempDirURL = NSURL.fileURLWithPath_isDirectory( tempDirPath , true );
        fileManager.createDirectoryAtURL_withIntermediateDirectories_attributes_error( tempDirURL , true , nil , nil );

        return tempDirPath;
    }

    function init( _context ) {
        var doc = _context.document,
            messages = [
                {
                    title: "Hey Now",
                    body: "Save your Sketch project and try again!"
                },
                {
                    title: "Wait",
                    body: "Where's your file? Please save and try again."
                },
                {
                    title: "Come on " + String( NSFullUserName() ),
                    body: "You should know you need to save to export."
                }
            ],
            index = Math.floor( Math.random() * messages.length ) ;

        context = _context;
        
        if( !documentIsSaved() ) {
            CB.showDialog( messages[ index ].title , messages[ index ].body );
            return;
        }

        if( !inited ) {
            inited = true;

            pluginPath = getPluginPathRoot();
            resourcesPath = pluginPath + "/Contents/Resources";
            documentPath = getPathByDeletingLastPathComponent( doc.fileURL().path() );
            documentName = doc.displayName().replace( ".sketch" , ".scrollmotion" );
            targetFolder = getTargetFolderPath();
            tempFolder = createTempFolder();
        }
    }

    Config.init = init;
    Config.exportImgExt = exportImgExt;
    Config.exportScaleFactor = exportScaleFactor;

    Config.settingsManifest = {
        getManifest: getSettingsManifest,
        saveManifest: saveSettingsManifest
    };
    Config.pluginManifest = getPluginManifest;

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
        "tempFolder": {
            get: function() { return tempFolder; }
        }
    } );

    return Config;
} ( Config || {} , CocoaBridge ) );