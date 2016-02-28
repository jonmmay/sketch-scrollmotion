@import "util.js";

// TO DO: Handle error in which document is not saved

var Config = ( function() {
    var context,
        doc,
        plugin,

        fileManager = [NSFileManager defaultManager],

        PLUGIN_PATH,
        RESOURCES_PATH,
        DOCUMENT_PATH,
        CACHES_PATH,
        EXPORT_FOLDER_PATH,

        DOCUMENT_NAME,
        SETTINGS_FILENAME,
        IMAGE_EXT = ".png",
        EXPORT_SCALE_FACTORS = [ 1.0, 2.0 ];

    /*
        * @desc
        * @param
        * @returns
        * @private
    */
    function getJSONObjectWithData( data, mutable ) {
        var err = [[MOPointer alloc] init],
            json;
        mutable = mutable ? NSJSONReadingMutableContainers : 0;
        
        if( data && [data isKindOfClass:[NSData class]] ) {
            json = [NSJSONSerialization JSONObjectWithData:data options:mutable error:err];

            if( err.value() ) {
                util.debug.warn( "JSON Error: can't load json for Config" );
                util.debug.warn( err.value() );
                return null;
            }
            return json;
        }
        return null;
    }

    /*
        * @desc
        * @param
        * @returns {String} directory path to Caches folder
        * @private
    */
    function createCachesFolder() {
        var pluginId = [plugin identifier],
            cachesURL = [[fileManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask] firstObject],
            cachesDirURL = [cachesURL URLByAppendingPathComponent:pluginId isDirectory:true],
            cachesDirPath = [cachesDirURL fileSystemRepresentation];

        if( !( [fileManager fileExistsAtPath:cachesDirPath] ) ) {
            // [fileManager removeItemAtPath:cachesDirPath error:nil];
            [fileManager createDirectoryAtPath:cachesDirPath withIntermediateDirectories:true attributes:nil error:nil];
        }

        return cachesDirPath;
    }

    /*
        * @desc
        * @param
        * @returns {NSURL} url of stub settings file in plugin resource folder
        * @private
    */
    function getResourcesSettingsURL() {
        return [plugin urlForResourceNamed:SETTINGS_FILENAME];
    }

    /*
        * @desc
        * @param
        * @returns {NSURL} url of Caches folder settings file
        * @private
    */
    function getCachesSettingsURL() {
        var cachesFolderURL = [NSURL fileURLWithPath:CACHES_PATH isDirectory:true],
            pluginId = [plugin identifier],
            cachesSettingsURL;

        cachesSettingsURL = [cachesFolderURL URLByAppendingPathComponent:pluginId isDirectory:true];
        cachesSettingsURL = [cachesSettingsURL URLByAppendingPathComponent:SETTINGS_FILENAME];
        return cachesSettingsURL;
    }

    /*
        * @desc
        * @param
        * @return {NSURL} url of user's Documents folder settings file
        * @private
    */
    function getUserSettingsURL() {
        var documentsURL = [[fileManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] firstObject],
            pluginId = [plugin identifier],
            userSettingsURL;

        userSettingsURL = [documentsURL URLByAppendingPathComponent:pluginId isDirectory:true];
        userSettingsURL = [userSettingsURL URLByAppendingPathComponent:SETTINGS_FILENAME];
        return userSettingsURL;
    }

    /*
        * @desc
        * @param
        * @returns {object} containing stub settings information
        * @private
    */
    function getResourcesSettingsManifest() {
        var settingsURL = getResourcesSettingsURL(),
            manifestPath = settingsURL ? [settingsURL fileSystemRepresentation] : null,
            data,
            json;
        
        if( manifestPath ) {
            data = [NSData dataWithContentsOfFile:manifestPath];
            json = getJSONObjectWithData( data, true );
            // return [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil];

            // Convert JSON for use with JavaScript
            return JSON.parse( String( util.stringifyJSON( json ) ) );
        }
        return {};
    }

    /*
        * @desc
        * @param
        * @returns {boolean} identifying if user settings folder exists
        * @private
    */
    function useUserSettings() {
        var userSettingsURL = getUserSettingsURL();

        return [fileManager fileExistsAtPath:[userSettingsURL fileSystemRepresentation]];
    }

    /*
        * @desc
        * @param
        * @returns {object} containing user settings information. Returns null if settings can't be found.
        * @private
    */
    function getSettingsManifest() {
        var url = useUserSettings() ? getUserSettingsURL() : getCachesSettingsURL(),
            path = [url fileSystemRepresentation],
            data,
            json;

        if( [fileManager fileExistsAtPath:path] ) {
            data = [NSData dataWithContentsOfFile:path];
            json = getJSONObjectWithData( data, true );
            // return [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil];

            // Convert JSON for use with JavaScript
            return JSON.parse( String( util.stringifyJSON( json ) ) );
        } else {
            json = getResourcesSettingsManifest();

            // Save settings to disk
            saveSettingsToURL( json, url );

            return json;
        }
    }

    /*
        * @desc
        * @param
        * @returns void
        * @private
    */
    function setSettingsManifest( json ) {
        var url = useUserSettings() ? getUserSettingsURL() : getCachesSettingsURL();

        saveSettingsToURL( json, url );
    }

    /*
        * @desc
        * @param
        * @returns void
        * @private
    */
    function saveSettingsToURL( json, url ) {
        var settingsPath = [[url URLByDeletingLastPathComponent] fileSystemRepresentation],
            data;

        // Create destination folder if it doesn't exist
        if( ![fileManager fileExistsAtPath:settingsPath] ) {
            [fileManager createDirectoryAtPath:settingsPath withIntermediateDirectories:true attributes:nil error:nil];
        }

        data = util.stringifyJSON( json, true );
        [data writeToFile:[url fileSystemRepresentation] atomically:true encoding:NSUTF8StringEncoding error:null];
    }

    /*
        * @desc
        * @param
        * @returns void
        * @private
    */
    function syncSettingsWithDefault( json ) {
        var manifest = getResourcesSettingsManifest();

        util.forEach( json, function( value, key ) {
            if( manifest[ key ] ) {
                manifest[ key ] = value;
            }
        } );
        
        return manifest;
    }

    /*
        * @desc Get Sketch app Bundle short version
        * @returns {string} version number as string
        * @private
    */
    function getSketchVersion() {
        return String( [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"] );
    }

    /*
        * @desc Get Sketch app version by type
        * @param {string} [type=major] - major, minor, or patch version
        * @returns {number} version number
        * @private
    */
    function getSemanticVersion( type ) {
        type = type ? type.toLowerCase() : "major";

        var sem = [ "major", "minor", "patch" ],
            i = sem.indexOf( type ),
            versionArr = SKETCH_VERSION.split( "." );

        return ( i > -1 && versionArr.length > i ) ? parseInt( versionArr[ i ] ) : 0;
    }

    /*
        * @desc Get Sketch app concatenated version
        * @returns {number} version number
        * @private
    */
    function getSketchVersionNumber() {
        var versionArr = SKETCH_VERSION.split( "." );

        while( versionArr.length < 3 ) {
            versionArr.push( "0" );
        }
        
        return parseInt( versionArr.join( "" ) );
    }

    /*
        * @desc 
        * @param {object} ctx - Sketch plugin context
    */
    return util.Object.extend( {
        init: function( ctx ) {
            this._super( ctx );
            context = this.context;
            doc = this.doc;
            plugin = this.plugin;

            PLUGIN_PATH = PLUGIN_PATH || [[plugin url] fileSystemRepresentation];
            RESOURCES_PATH = RESOURCES_PATH || [[plugin urlForResourceNamed:@""] fileSystemRepresentation];
            SETTINGS_FILENAME = SETTINGS_FILENAME || [plugin identifier] + "-settings";
            CACHES_PATH = CACHES_PATH || createCachesFolder();
            SKETCH_VERSION = getSketchVersion() || "0.0.0";

            DOCUMENT_PATH = ( typeof DOCUMENT_PATH !== "undefined" ) ? DOCUMENT_PATH : 
                            !![doc fileURL] ? util.getPathByDeletingLastPathComponent( [[doc fileURL] path] ) : null;
            DOCUMENT_NAME = DOCUMENT_NAME || [doc displayName] + ".scrollmotion";
            EXPORT_FOLDER_PATH = ( typeof EXPORT_FOLDER_PATH !== "undefined" ) ? EXPORT_FOLDER_PATH :
                                 ( DOCUMENT_PATH && DOCUMENT_NAME ) ? DOCUMENT_PATH + "/" + DOCUMENT_NAME : null;
        },
        getSketchVersion: function() {
            return SKETCH_VERSION;
        },
        getSketchVersionNumber: function() {
            return getSketchVersionNumber();
        },
        getSketchMajorVersion: function() {
            return getSemanticVersion( "major" );
        },
        getSketchMinorVersion: function() {
            return getSemanticVersion( "minor" );
        },
        getSketchPatchVersion: function() {
            return getSemanticVersion( "patch" );
        },
        getDocumentName: function() {
            return DOCUMENT_NAME;
        },
        getImageExtension: function() {
            return IMAGE_EXT;
        },
        getExportFolderPath: function() {
            return EXPORT_FOLDER_PATH;
        },
        getDocumentPath: function() {
            return DOCUMENT_PATH;
        },
        getPluginPath: function() {
            return PLUGIN_PATH;
        },
        getResourcesPath: function() {
            return RESOURCES_PATH;
        },
        getSettingsPath: function() {
            var url = useUserSettings() ? getUserSettingsURL() : getCachesSettingsURL();

            return [url fileSystemRepresentation];
        },
        getDocumentsSettingsPath: function() {
            var url = getUserSettingsURL();
            
            return [url fileSystemRepresentation];
        },
        getSettingsManifest: function() {
            return getSettingsManifest();
        },
        setSettingsManifest: function( manifest ) {
            setSettingsManifest( manifest );

            return this;
        },
        getSettingsKeyValue: function( key ) {
            this.getSettingsKeyValue.manifest = this.getSettingsKeyValue.manifest || this.getSettingsManifest();

            var manifest = this.getSettingsKeyValue.manifest;

            return manifest[ key ];
        },
        syncSettingsWithDefault: function( json ) {
            return syncSettingsWithDefault( json );
        },
        getExportScaleFactors: function() {
            return EXPORT_SCALE_FACTORS;
        }
    } );
} )();