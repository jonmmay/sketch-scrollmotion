@import "util.js";

function runTests( context ) {
	var startDate = new Date(),
		endDate;
	log( "##### Started | " + startDate.toLocaleTimeString() + " #####" );

	/**
		* @desc util testing
	*/
	( function( assert ) {
		assert( typeof util === "object", "'util' helper object exists" );
		
		// CocoaScript data type testing
		( function () {
			// Truthy values
			assert( true, "True is truthy" );
			assert( [[MOUndefined alloc] init], "MOUndefined is truthy" );

			assert( 1, "Number is truthy" );
			assert( [NSNumber numberWithInt:1], "NSNumber is truthy" );

			assert( "string", "String is truthy" );
			assert( [NSString string], "Empty NSString is truthy" );
			assert( [NSString stringWithString:""], "Empty NSString is truthy" );
			assert( [NSString stringWithString:"string"], "NSString is truthy" );

			assert( {}, "object is truthy" );
			assert( { foo: "bar" }, "object is truthy" );
			assert( [NSDictionary dictionary], "Empty NSDictionary is truthy" );
			assert( [NSDictionary dictionaryWithObject:"bar" forKey:"foo"], "NSDictionary is truthy" );

			assert( [ "foo" ], "array is truthy" );
			assert( [NSArray array], "Empty NSArray is truthy" );
			assert( [NSArray arrayWithObject:"foo"], "NSArray is truthy" );

			// Falsy values
			assert( !false, "False is falsy" );

			assert( !0, "0 number is falsy" );
			assert( [NSNumber numberWithInt:0], "0 NSNumber is falsy" );

			assert( !"", "Empty string is falsy" );

			assert( !undefined, "Undefined is falsy" );
			assert( !null, "Null is falsy" );
			assert( !nil, "Nil is falsy" );

			// Strict evaluation
			assert( 1 !== [NSNumber numberWithInt:1], "JS number and NSNumber fail strict evaluation" );
			assert( "string" !== [NSString stringWithString:"string"], "JS string and NSString fail strict evaluation" );
			assert( { foo: "bar" } !== [NSDictionary dictionaryWithObject:"bar" forKey:"foo"], "JS object and NSObject fail strict evaluation" );
			assert( [ "foo" ] !== [NSArray arrayWithObject:"foo"], "JS array and NSArray fail strict evaluation" );

			assert( typeof NSNumber === "object" &&
					typeof NSString === "object" &&
					typeof NSDictionary === "object" &&
					typeof NSArray === "object"
				, "NSNumber, NSString, NSDictionary, NSArray evaluate to JS object" );
		} )();

	} )( util.assert );

	/**
		* @desc View testing
	*/
	// ( function( assert ) {
	// 	assert( typeof View === "", "'View' exists" );
	// } )( util.assert );

	/**
		* @desc Config testing
	*/
	// ( function( assert ) {
	// 	assert( typeof Config === "", "'Config' exists" );
	// } )( util.assert );
	

	/**
		* @desc Content Spec testing
	*/
	// ( function( assert ) {
	// 	assert( typeof CS === "", "'CS' exists" );
	// } )( util.assert );
	

	endDate = new Date();
	log( "##### Ended | " + endDate.toLocaleTimeString() + " | " + ( endDate.getTime() - startDate.getTime() ) + " ms #####" );
	context.document.showMessage( "Ended" );
}

