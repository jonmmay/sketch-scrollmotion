
;( function( global ) {
	var util = global.util || {};

	var fileManager = [NSFileManager defaultManager];

	/**
		* @desc
		* @returns {NSRect}
	*/
	function defFrame() {
		return NSMakeRect( 0, 0, 1, 1 );
	}
	/**
		* @desc
		* @returns {NSPoint}
	*/
	function defPoint() {
		return NSMakePoint( 0, 0 );
	}
	/**
		* @desc
		* @returns {NSSize}
	*/
	function defPoint() {
		return NSMakeSize( 1, 1 );
	}

	function getFileData( url ) {
        if( url && [url isKindOfClass:[NSURL class]] ) {

            return ( [fileManager fileExistsAtPath:[url fileSystemRepresentation]] ) ?
                [NSData dataWithContentsOfURL:url] : null;  
        }
        return null;
    }

	util.sketchLayers = {
		artboard: function( layers, frame ) {
			var artboard 	= [MSArtboardGroup new],
				rect 		= [artboard frame];

			if( Array.isArray( layers ) ) {
				[layerGroup addLayers:layers];
			}

			if( frame ) {
				[rect setWidth:frame.size.width];
				[rect setHeight:frame.size.height];
				[rect setX:frame.origin.x];
				[rect setY:frame.origin.y];
			} else {
				[artboard resizeToFitChildrenWithOption:true];
			}
			
			artboard.name = "Artboard";

			return artboard;
		},
		rectangleShape: function( frame ) {
			var rect 		= frame || defFrame(),
				rectShape 	= [[MSRectangleShape alloc] initWithFrame:rect],
				shapeGroup  = [MSShapeGroup shapeWithPath:rectShape];

			shapeGroup.name = "Rectangle";

			return shapeGroup;
		},
		text: function( text, fontName, fontSize ) {
			var rect 		= defFrame(),
				textLayer	= [[MSTextLayer alloc] initWithFrame:rect];

			text = typeof text === "string" ? text : "";
			fontSize = typeof fontSize === "number" ? fontSize : 0.0;

			textLayer.stringValue = text;
			if( fontName ) {
				[textLayer setFont:fontName size:fontSize];
			}

			[textLayer adjustFrameToFit];
			textLayer.name = text.substring( 0, text.length < 16 ? text.length : 16 ).trim();

			return textLayer;
		},
		layerGroup: function( layers ) {
			var layerGroup = [[MSLayerGroup alloc] init];

			if( Array.isArray( layers ) ) {
				[layerGroup addLayers:layers];
			}

	        [layerGroup resizeToFitChildrenWithOption:true];
	        layerGroup.name = "Group";

	        return layerGroup;
		},
		bitmap: function( url, scaleFactor ) {
			var data,
				nsImage,
				imageLayer;

			scaleFactor = typeof scaleFactor === "number" ? Math.floor( scaleFactor ) : 1;

			if( url ) {
				data = getFileData( url );
			}
			if( data ) {
				nsImage 		= [[NSImage alloc] initWithData:data];
				imageLayer  	= [MSBitmapLayer bitmapLayerFromImage:nsImage withSizeScaledDownByFactor:scaleFactor];
				imageLayer.name = [url lastPathComponent];
			}

			return imageLayer;
		}
	};

	global.util = util;
} )( this );