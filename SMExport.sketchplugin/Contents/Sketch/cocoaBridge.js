
// TO DO: Change CocoaBridge to SketchBridge

var CocoaBridge = ( function( CocoaBridge ) {
	var fileManager = NSFileManager.defaultManager(); // [NSFileManager defaultManager]

	// Get JS files from Github
  // var task = [[NSTask alloc] init],
  //     argsArray = [NSArray arrayWithObjects:"-O", framerjs_url, nil];
  // [task setCurrentDirectoryPath:framer_folder];
  // [task setLaunchPath:"/usr/bin/curl"];
  // [task setArguments:argsArray];
  // [task launch];

  // TO DO: clean up this mess!

  	CocoaBridge.MSRect = {
  		setX: function( rect , x ) {
  			[rect setX:x];
  		},
  		setY: function( rect , y ) {
  			[rect setY:y];
  		}
  	};

	function count( obj ) {
		return [obj count];
	}
	function arrayWithObjects( objs ) {
		return [NSArray arrayWithObjects:objs , nil];
	}
	function objectAtIndex( obj , i ) {
		return [obj objectAtIndex:i];
	}
	function fileExistsAtPath( path ) {
		return [fileManager fileExistsAtPath:path];
	}
	function removeItemAtPath( path ) {
		[fileManager removeItemAtPath:path error:nil];
	}
	function createDirectoryAtPath( path ) {
		[fileManager createDirectoryAtPath:path withIntermediateDirectories:true attributes:nil error:nil];
	}

	function copyItemAtPath( srcPath , dstPath ) {
		[fileManager copyItemAtPath:srcPath toPath:dstPath error:nil];
	}
	function writeToFile( data , path , encoding ) {
		if( encoding && encoding === "UTF8" ) {
			[data writeToFile:path atomically:true encoding:NSUTF8StringEncoding error:null];
		} else {
			[data writeToFile:path atomically:true]
		}
		
	}
	function stringWithContentsOfFile( path ) {
		return [[NSString stringWithContentsOfFile:path] dataUsingEncoding:NSUTF8StringEncoding];
	}

	// Can be used to type cast a JS string
	function stringByAppendingString( string ) {
		return [@"" stringByAppendingString:string];
	}
	function valueForKeyPath( obj , key ) {
		key = stringByAppendingString( key );
		return [settings_old valueForKeyPath:key];
	}
	function setValue( mutableDictionary , key , value ) {
		value = stringByAppendingString( value );
		[mutableDictionary setValue:value forKey:value];
	}

	// Serialize mutable dictionary
	function dataWithJSONObject( mutableDictionary ) {
		return [NSJSONSerialization dataWithJSONObject:mutableDictionary options:NSJSONWritingPrettyPrinted error:nil];
	}
	// Serialize JSON from string
	function JSONObjectWithData( data ) {
		return [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
	}

	// Stringifying JSON
	function initWithData( json ) {
		return [[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding];	
	}
	
	CocoaBridge.count = count;
	CocoaBridge.arrayWithObjects = arrayWithObjects;
	CocoaBridge.objectAtIndex = objectAtIndex;
	CocoaBridge.fileExistsAtPath = fileExistsAtPath;
	CocoaBridge.removeItemAtPath = removeItemAtPath;
	CocoaBridge.createDirectoryAtPath = createDirectoryAtPath;
	CocoaBridge.copyItemAtPath = copyItemAtPath;
	CocoaBridge.writeToFile = writeToFile;
	CocoaBridge.stringWithContentsOfFile = stringWithContentsOfFile;
	CocoaBridge.stringByAppendingString = stringByAppendingString;
	CocoaBridge.valueForKeyPath = valueForKeyPath;
	CocoaBridge.setValue = setValue;
	CocoaBridge.dataWithJSONObject = dataWithJSONObject;
	CocoaBridge.JSONObjectWithData = JSONObjectWithData;
	CocoaBridge.initWithData = initWithData;
	
	function rectWithRect( layer ) {
		return [GKRect rectWithRect:[layer absoluteInfluenceRect]];
	}
	CocoaBridge.GKRect = {};
	CocoaBridge.GKRect.rectWithRect = rectWithRect;

	function slicesFromExportableLayer( layer , rect ) {
		return [MSSliceMaker slicesFromExportableLayer:layer inRect:rect];
	}
	
	CocoaBridge.MSSliceMaker = {};
	CocoaBridge.MSSliceMaker.slicesFromExportableLayer = slicesFromExportableLayer;

	function dataForRequest( slice ) {
		return [MSSliceExporter dataForRequest:slice];	
	}

	CocoaBridge.MSSliceExporter = {};
	CocoaBridge.MSSliceExporter.dataForRequest = dataForRequest;	

	return CocoaBridge;
} ( CocoaBridge || {} ) );