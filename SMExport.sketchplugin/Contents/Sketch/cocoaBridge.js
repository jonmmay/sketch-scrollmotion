/* export CocoaBridge */

var CocoaBridge = ( function( _CocoaBridge ) {
	var fileManager = NSFileManager.defaultManager(); // [NSFileManager defaultManager]

	// Get JS files from Github
  // var task = [[NSTask alloc] init],
  //     argsArray = [NSArray arrayWithObjects:"-O", framerjs_url, nil];
  // [task setCurrentDirectoryPath:framer_folder];
  // [task setLaunchPath:"/usr/bin/curl"];
  // [task setArguments:argsArray];
  // [task launch];

  	var CB = {};

  	/* ---------------------------------------- */
	/*  User interaction						*/
	/* ---------------------------------------- */

  	CB.showDialog = function( title , message , OKHandler ) {
  		var alert = [COSAlertWindow new],
  			responseCode;
		[alert setMessageText: title];
		[alert setInformativeText: message];

		responseCode = [alert runModal];	
		if( OKHandler != nil && responseCode == 0 ) {
			OKHandler();
		}
  	};

  	CB.showDialogWithOptions = function( title , message ) {
  		var alert = [COSAlertWindow new],
  			responseCode;
  		[alert setMessageText: title];
		[alert setInformativeText: message];

  		return {
  			addButtonWithTitle: function( title ) {
  				[alert addButtonWithTitle: title];
  				return this;
  			},
  			run: function( actionHandler ) {
  				responseCode = [alert runModal];
  				if( actionHandler ) {
  					// 1000 = rightmost button
  					// 1001 = second button from right
  					// 1002 = third button from right
  					// 100 + n
  					actionHandler( responseCode );
  				}
  			}
  		};
  	};

  	/* ---------------------------------------- */
	/*  Remembering settings and values 		*/
	/* ---------------------------------------- */

	/*
		CB.initDefaults = function( initialValues ) {
			var defVal,
				key;
			for ( key in initialValues ) {
				defVal = CB.getDefault( key );
				if ( defVal == nil ) {
					setDefault( key , initialValues[ key ] );
				}
			}
		};

		CB.getDefault = function( key ) {
			var defaults = [NSUserDefaults standardUserDefaults],
				defaultValue = [defaults objectForKey: '-' + kPluginDomain + '-' + key];
			
			if ( defaultValue != nil && defaultValue.class() === NSDictionary ) ) {
				return [NSMutableDictionary dictionaryWithDictionary:defaultValue];
			}
			return defaultValue;
		};

		CB.setDefault = function( key , value ) {
			var defaults = [NSUserDefaults standardUserDefaults], 
				configs  = [NSMutableDictionary dictionary];

			[configs setObject:value forKey: '-' + kPluginDomain + '-' + key];
			return [defaults registerDefaults:configs];
		};

		CB.syncDefaults = function() {
			var defaults = [NSUserDefaults standardUserDefaults];
			[defaults synchronize];
		};
	*/

  	/* ---------------------------------------- */
	/*  Working with files and directories		*/
	/* ---------------------------------------- */

  	CB.browseForDirectory = function( title ) {
		var openDialog = [NSOpenPanel openPanel];
		[openDialog setCanChooseFiles:false];
		[openDialog setCanChooseDirectories:true];
		[openDialog setAllowsMultipleSelection:false];
		[openDialog setCanCreateDirectories:true];
		[openDialog setTitle:title];
		if( [openDialog runModal] == NSOKButton ) {
			return [[openDialog URLs] firstObject];
		}
		return ""
	};
	CB.browseForFile = function( title , filetype ) {
		var openDialog = [NSOpenPanel openPanel];
		[openDialog setCanChooseFiles:true];
		[openDialog setCanChooseDirectories:false];
		[openDialog setAllowsMultipleSelection:false];
		[openDialog setCanCreateDirectories:false];
		[openDialog setTitle:title];

		if( filetype ) {
			if( filetype instanceof Array ) {
				filetype = filetype.map( function( type ) {
					return CB.stringByAppendingString( type );
				} );
				[openDialog setAllowedFileTypes: filetype];
			} else {
				[openDialog setAllowedFileTypes: CB.Array.arrayWithObjects( CB.stringByAppendingString( filetype ) )];
			}
		}

		if( [openDialog runModal] == NSOKButton ) {
			return [[openDialog URLs] firstObject];
		}
		return ""
	};
	CB.fileExistsAtPath = function( path ) {
		return [fileManager fileExistsAtPath:path];
	};
	CB.removeItemAtPath = function( path ) {
		[fileManager removeItemAtPath:path error:nil];
	};
	CB.createDirectoryAtPath = function( path ) {
		[fileManager createDirectoryAtPath:path withIntermediateDirectories:true attributes:nil error:nil];
	};
	CB.copyItemAtPath = function( srcPath , dstPath ) {
		[fileManager copyItemAtPath:srcPath toPath:dstPath error:nil];
	};
	CB.writeToFile = function( data , path , encoding ) {
		if( encoding && encoding === "UTF8" ) {
			[data writeToFile:path atomically:true encoding:NSUTF8StringEncoding error:null];
		} else {
			[data writeToFile:path atomically:true]
		}	
	};
	CB.stringWithContentsOfFile = function( path ) {
		return [[NSString stringWithContentsOfFile:path] dataUsingEncoding:NSUTF8StringEncoding];
	};
	CB.dataWithContentsOfFile = function( path ) {
		return [NSData dataWithContentsOfFile:path];
	};
	CB.jsonWithContentsOfFile = function( path ) {
		var data = CB.dataWithContentsOfFile( path );
		return CB.JSON.JSONObjectWithData( data , true );
	};

	/* ---------------------------------------- */
	/*  Working with json 				        */
	/* ---------------------------------------- */

	CB.JSON = {};
	// Serialize mutable dictionary
	CB.JSON.dataWithJSONObject = function( mutableDictionary ) {
		return [NSJSONSerialization dataWithJSONObject:mutableDictionary options:NSJSONWritingPrettyPrinted error:nil];
	};
	// Serialize JSON from string
	CB.JSON.JSONObjectWithData = function( data , mutable ) {
		mutable = mutable ? NSJSONReadingMutableContainers : 0;
		return [NSJSONSerialization JSONObjectWithData:data options:mutable error:nil];
	};

    /* ---------------------------------------- */
	/*  Helpers									*/
	/* ---------------------------------------- */

	// Stringifying data
	CB.initWithData = function( data ) {
		return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];	
	};
	CB.stringify = function( obj , prettyPrinted ) {
		var prettySetting = prettyPrinted ? NSJSONWritingPrettyPrinted : 0,
			jsonData = [NSJSONSerialization dataWithJSONObject:obj options:prettySetting error:nil],
			data = CB.initWithData( jsonData );

		// Removes escape forward slashes
		return [data stringByReplacingOccurrencesOfString:@"\\/" withString:@"/"];
	};
	CB.objectTreeAsJSON = function( obj , prettyPrinted ) {
        var tree = obj.treeAsDictionary();
        return CB.stringify( tree , prettyPrinted );
    };
	// Can be used to type cast a JS string
	CB.stringByAppendingString = function( string ) {
		return [@"" stringByAppendingString:string];
	};

	/* ---------------------------------------- */
	/*  Array helpers							*/
	/* ---------------------------------------- */

	CB.Array = {};
	CB.Array.count = function( obj ) {
		return [obj count];
	};
	CB.Array.arrayWithObjects = function( objs ) {
		return [NSArray arrayWithObjects:objs , nil];
	};
	CB.Array.objectAtIndex = function( obj , i ) {
		return [obj objectAtIndex:i];
	};

	/* ---------------------------------------- */
	/*  Dictionary helpers						*/
	/* ---------------------------------------- */

	CB.Dict = {};
	CB.Dict.valueForKeyPath = function( obj , key ) {
		key = CB.stringByAppendingString( key );
		return [obj valueForKeyPath:key];
	};
	CB.Dict.setValue = function( mutableDictionary , key , value ) {
		value = CB.stringByAppendingString( value );
		[mutableDictionary setValue:value forKey:key];
	};
	
	
	/* ---------------------------------------- */
	/*  Sketch helpers 							*/
	/* ---------------------------------------- */

	CB.MSRect = {};
	CB.MSRect.setX = function( rect , x ) {
		[rect setX:x];
	};
  	CB.MSRect.setY = function( rect , y ) {
		[rect setY:y];
	};

  	CB.GKRect = {};
  	CB.GKRect.rectWithRect = function( layer ) {
		return [GKRect rectWithRect:[layer absoluteInfluenceRect]];
  	};
	
	CB.MSSliceMaker = {};
	CB.MSSliceMaker.slicesFromExportableLayer = function( layer , rect ) {
		return [MSSliceMaker slicesFromExportableLayer:layer inRect:rect];
	};

	CB.MSSliceExporter = {};
	CB.MSSliceExporter.dataForRequest = function( slice ) {
		return [MSSliceExporter dataForRequest:slice];	
	};

	return CB;
} ( CocoaBridge || {} ) );