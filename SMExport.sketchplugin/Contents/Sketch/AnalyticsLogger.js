/* global util, Config, NSTask, NSArray */

@import "util.js";
@import "Config.js";

var AnalyticsLogger = ( function() {
	var context,
        doc,
        plugin;

    var keenProjectId       = "571bca3ebcb79c5d9e07594c",
        keenWriteKey        = "d684e9466cb827a9857fe24173d4cf8443885cc1f8b090bbcd1361587cbfdb8b1e761b9c6841767b5e625631efb4a41c5890255b2efb7a6448266dfe7b2b5d808dc73ec540071d66c4f6e1c2fa5162e5941699c5fb9bdb47aad125b43199b3e0",
        keenEventCollection = "tests";

    
    return util.Object.extend( {
        init: function( ctx ) {
            this._super( ctx );
            this.pluginCommand  = ctx.command;
            this.config         = Config.create( ctx );

            context = this.context;
            doc     = this.doc;
            plugin  = this.plugin;
            

        },
        log: function( collection, eventData ) {
            var projectId       = keenProjectId,
                writeKey        = keenWriteKey,
                eventCollection = collection || keenEventCollection,
                url             = `https:\/\/api.keen.io/3.0/projects/${projectId}/events/${eventCollection}?api_key=${writeKey}`,
                eventJSON,
                task,
                taskArgsArray;

            eventData = eventData || {};
            eventJSON = {
                commandName:    String( this.pluginCommand.name() ),
                documentName:   String( this.context.document.displayName() ),
                sketchVersion:  this.config.getSketchVersion(),
                pluginVersion:  this.config.getPluginVersion(),
                userId:         this.config.getUserUUID()
            };

            eventJSON = util.merge( {}, eventData, eventJSON );

            util.debug.debug( JSON.stringify( eventJSON ) );
            // Ensure object has been initiated
            if( typeof context !== "undefined" ) {
                task = NSTask.alloc().init();
                taskArgsArray = NSArray.arrayWithObjects(
                    "-X", "POST",
                    "-H", "Content-Type: application/json",
                    "-d", JSON.stringify( eventJSON ),
                    url,
                    null
                );
                task.setLaunchPath( "/usr/bin/curl" );
                task.setArguments( taskArgsArray );
                task.launch();
            }
        }
    } );
} )();