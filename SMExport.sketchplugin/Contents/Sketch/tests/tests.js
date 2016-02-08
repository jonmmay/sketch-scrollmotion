@import "../util.js";
@import "assert.js";

function runTests( context ) {
	var startDate = new Date(),
		endDate,
		suite = {};
	log( "##### Started | " + startDate.toLocaleTimeString() + " #####" );

	
	/**
		* @desc CocoaScript data type testing	
	*/
	suite[ "test truthy" ] = function() {
		assert.ok( true, "True should be truthy" );
		assert.ok( [[MOUndefined alloc] init], "MOUndefined should be truthy" );
		
		assert.ok( 1, "1 should be truthy" );
		assert.ok( [NSNumber numberWithInt:1], "NSNumber, 1, should be truthy" );

		assert.ok( "string", "'string' should be truthy" );
		assert.ok( [NSString string], "An empty NSString should be truthy" );
		assert.ok( [NSString stringWithString:""], "An empty NSString should be truthy" );
		assert.ok( [NSString stringWithString:"string"], "A NSString should be truthy" );

		assert.ok( {}, "Any empty object should be truthy" );
		assert.ok( { foo: "bar" }, "An object should be truthy" );
		assert.ok( [NSDictionary dictionary], "An empty NSDictionary should be truthy" );
		assert.ok( [NSDictionary dictionaryWithObject:"bar" forKey:"foo"], "A NSDictionary should be truthy" );

		assert.ok( [ "foo" ], "An array should be truthy" );
		assert.ok( [NSArray array], "An empty NSArray should be truthy" );
		assert.ok( [NSArray arrayWithObject:"foo"], "A NSArray is truthy" );
	};

	suite[ "test falsy" ] = function() {
		assert.ok( !false, "False should be falsy" );

		assert.ok( !0, "0 should be falsy" );
		assert.ok( [NSNumber numberWithInt:0], "NSNumber, 0, should be falsy" );

		assert.ok( !"", "An empty string should be falsy" );

		assert.ok( !undefined, "Undefined should be falsy" );
		assert.ok( !null, "Null should be falsy" );
		assert.ok( !nil, "Nil should be falsy" );
	};

	suite[ "test strict evaluation" ] = function() {
		assert.notStrictEqual( 1, [NSNumber numberWithInt:1], "JS number and NSNumber should fail strict evaluation" );
		assert.notStrictEqual( "string", [NSString stringWithString:"string"], "JS string and NSString should fail strict evaluation" );
		assert.notStrictEqual( { foo: "bar" }, [NSDictionary dictionaryWithObject:"bar" forKey:"foo"], "JS object and NSObject should fail strict evaluation" );
		assert.notStrictEqual( [ "foo" ], [NSArray arrayWithObject:"foo"], "JS array and NSArray should fail strict evaluation" );

		assert.ok( typeof NSNumber === "object" &&
				typeof NSString === "object" &&
				typeof NSDictionary === "object" &&
				typeof NSArray === "object",
			"NSNumber, NSString, NSDictionary, NSArray should evaluate to JS type 'object'" );
	};

	suite[ "test type coercion evaluation" ] = function() {
		assert.equal( 1, [NSNumber numberWithInt:1], "JS number and NSNumber should be equal" );
		assert.equal( "string", [NSString stringWithString:"string"], "JS string and NSString should be equal" );

		assert.deepEqual( { foo: "bar" }, { foo: "bar" }, "JS object and JS object should be equal" );
		assert.deepEqual( [NSDictionary dictionaryWithObject:"bar" forKey:"foo"], [NSDictionary dictionaryWithObject:"bar" forKey:"foo"], "NSObject and NSObject should be equal" );
		assert.notDeepEqual( { foo: "bar" }, [NSDictionary dictionaryWithObject:"bar" forKey:"foo"], "JS object and NSObject should not be equal" );
		
		assert.deepEqual( [ "foo" ], [ "foo" ], "JS array and JS array should be equal" );
		assert.deepEqual( [NSArray arrayWithObject:"foo"], [NSArray arrayWithObject:"foo"], "NSArray and NSArray should be equal" );
		assert.notDeepEqual( [ "foo" ], [NSArray arrayWithObject:"foo"], "JS array and NSArray should not be equal" );
	};

	/**
		* @desc util testing
	*/
	suite[ "test util script" ] = {
		"test util": function() {
			assert.ok( typeof util === "object", "'util' exists" );
		},
		"test util.debug": {
			"test for existence": function() {
				assert.ok( typeof util.debug === "object", "'util.debug' exists" );
			}
		},
		"test util.log": {
			"test for existence": function() {
				assert.ok( typeof util.log === "function", "'util.log' exists" );
			}
		},
		"test util.Object": {
			"test for existence": function() {
				assert.ok( typeof util.Object === "object", "'util.Object' exists" );
			}
		},
		"test util.Command": {
			"test for existence": function() {
				assert.ok( typeof util.Command === "object", "'util.Command' exists" );
			}
		},
		"test util.forEach": {
			"test for existence": function() {
				assert.ok( typeof util.forEach === "function", "'util.forEach' exists" );
			}
		},
		"test util.values": {
			"test for existence": function() {
				assert.ok( typeof util.values === "function", "'util.values' exists" );
			}
		},
		"test util.stringifyJSON": {
			"test for existence": function() {
				assert.ok( typeof util.stringifyJSON === "function", "'util.stringifyJSON' exists" );
			}
		},
		"test util.merge": {
			"test for existence": function() {
				assert.ok( typeof util.merge === "function", "'util.merge' exists" );
			}
		},
		"test util.commonProperties": {
			"test for existence": function() {
				assert.ok( typeof util.commonProperties === "function", "'util.commonProperties' exists" );
			}
		},
		"test util.naiveClone": {
			"test for existence": function() {
				assert.ok( typeof util.naiveClone === "function", "'util.naiveClone' exists" );
			}
		},
		"test util.getLastPathComponent": {
			"test for existence": function() {
				assert.ok( typeof util.getLastPathComponent === "function", "'util.getLastPathComponent' exists" );
			}
		},
		"test util.getPathByDeletingLastPathComponent": {
			"test for existence": function() {
				assert.ok( typeof util.getPathByDeletingLastPathComponent === "function", "'util.getPathByDeletingLastPathComponent' exists" );
			}
		},
		"test util.getPathExtension": {
			"test for existence": function() {
				assert.ok( typeof util.getPathExtension === "function", "'util.getPathExtension' exists" );
			}
		},
		"test util.getPathByDeletingPathExtension": {
			"test for existence": function() {
				assert.ok( typeof util.getPathByDeletingPathExtension === "function", "'util.getPathByDeletingPathExtension' exists" );
			}
		},
		"test util.unique": {
			"test for existence": function() {
				assert.ok( typeof util.unique === "function", "'util.unique' exists" );
			}
		},
		"test util.slugify": {
			"test for existence": function() {
				assert.ok( typeof util.slugify === "function", "'util.slugify' exists" );
			}
		},
		"test util.toPx": {
			"test for existence": function() {
				assert.ok( typeof util.toPx === "function", "'util.toPx' exists" );
			}
		},
		"test util.rgbToHex": {
			"test for existence": function() {
				assert.ok( typeof util.rgbToHex === "function", "'util.rgbToHex' exists" );
			}
		},
		"test util.hexToRgb": {
			"test for existence": function() {
				assert.ok( typeof util.hexToRgb === "function", "'util.hexToRgb' exists" );
			}
		},
		"test util.num": {
			"test for existence": function() {
				assert.ok( typeof util.num === "function", "'util.num' exists" );
			}
		},
		"test util.roundHalfUp": {
			"test for existence": function() {
				assert.ok( typeof util.roundHalfUp === "function", "'util.roundHalfUp' exists" );
			}
		},
		"test util.isArray": {
			"test for existence": function() {
				assert.ok( typeof util.isArray === "function", "'util.isArray' exists" );
			}
		},
		"test util.isObject": {
			"test for existence": function() {
				assert.ok( typeof util.isObject === "function", "'util.isObject' exists" );
			}
		},
		"test util.noop": {
			"test for existence": function() {
				assert.ok( typeof util.noop === "function", "'util.noop' exists" );
			}
		}
	};
	
	test.runAll( suite );

	endDate = new Date();
	log( "##### Ended | " + endDate.toLocaleTimeString() + " | " + ( endDate.getTime() - startDate.getTime() ) + " ms #####" );
	context.document.showMessage( "Ended" );
}

