@import "../util.js";
@import "../Config.js";
@import "../CS.js";
@import "../View.js";
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
			},
			"test noop does nothing": function() {
				var noopVal = util.noop(),
					isTypeUndefined = typeof noopVal === "undefined" || noopVal === [[MOUndefined alloc] init];

				assert.ok( isTypeUndefined, "noop does nothing!" );
			}
		}
	};

	/**
		* @desc Config testing
	*/
	suite[ "test Config script" ] = ( function( config ) {
		return {
			"test Config": function() {
				assert.ok( typeof Config === "object", "Config is an object" );
				assert.ok( Config.instanceOf( util.Object ), "Config is extended from util.object" );
			},
			"test instance of Config": function() {
				assert.ok( !!config.context, "instance can access plugin context object" );
				assert.ok( !!config.doc, "instance can access plugin document" );
				assert.ok( !!config.plugin, "instance can access plugin plugin" );
				assert.ok( !!config.selection, "instance can access plugin selection" );
				assert.ok( !!config.command, "instance can access plugin command" );
			},
			"test access to sketch version": function() {},
			"test access to document name": function() {},
			"test image extension": function() {},
			"test export folder path": function() {},
			"test document path": function() {},
			"test plugin path": function() {},
			"test resources path": function() {},
			"test settings path": function() {},
			"test accessing settings data": {
				"test getting settings object": function() {},
				"test getting settings key value": function() {},
				"test setting settings": function() {},
				"test syncing with default settings": function() {}
			},
			"test export scale factors": function() {}
		};
	} )( Config.create( context ) );

	/**
		* @desc CS testing
	*/
	suite[ "test CS script" ] = ( function( cs ) {
		return {
			"test Content Spec": function() {
				assert.ok( typeof ContentSpec === "object", "ContentSpec is an object" );
				assert.ok( ContentSpec.instanceOf( util.Object ), "ContentSpec is extended from util.object" );
			},
			"test instance of Content Spec": function() {
				assert.ok( !!cs.context, "instance can access plugin context object" );
				assert.ok( !!cs.doc, "instance can access plugin document" );
				assert.ok( !!cs.plugin, "instance can access plugin plugin" );
				assert.ok( !!cs.selection, "instance can access plugin selection" );
				assert.ok( !!cs.command, "instance can access plugin command" );
			},
			"test initializing": {

			},
			"test initializing with JSON": ( function( altCS ) {
				return {
					// altCS.initWithJSON	
				};
			} )( ContentSpec.create( context ) ),
			"test getting CS Stubs": {
				// getCSStubByResourcePath
			},
			"test CS metadata": {
				"test schema": function() {},
				"test reset css": function() {},
				"test start page": function() {

				},
				"test add font metadata": function() {}
			},
			"test getting CS keys by key name": function() {},
			"test getting pageset ids": function() {},
			"test getting pages ids": function() {},
			"test getting overlays ids": function() {},
			"test CS screensupport": function() {

			},
			"test generating unique overlayId": function() {},
			"test generating unique pageId": function() {},
			"test making new overlay": {},
			"test making new page": {},
			"test adding overlay to CS": function() {},
			"test adding page to CS": function() {},
			"test getting pageset by id": function() {},
			"test getting page by id": function() {},
			"test getting overlay by id": function() {},
			"test getting type of overlay": function() {}

		};
	} )( ContentSpec.create( context ) );

	/**
		* @desc View testing
	*/
	suite[ "test View script" ] = ( function( view ) {
		// Make layers;

		return {
			"test View": function() {
				assert.ok( typeof View === "object", "View is an object" );
				assert.ok( View.instanceOf( util.Object ), "View is extended from util.object" );
			},
			"test instance of View": function() {
				assert.ok( !!view.context, "instance can access plugin context object" );
				assert.ok( !!view.doc, "instance can access plugin document" );
				assert.ok( !!view.plugin, "instance can access plugin plugin" );
				assert.ok( !!view.selection, "instance can access plugin selection" );
				assert.ok( !!view.command, "instance can access plugin command" );
			},
			"test wrapping layers": ( function() {
				// Make views

				return {
					"test access to layer": function() {},
					"test access to layer id": function() {},
					"test access to layer name": function() {},
					"test access to layer class name": function() {},
					"test if layer has children": function() {},
					"test if layer has a clipping mask": function() {},
					"test access to view parent": function() {},

					"test access to layer parent": function() {},
					"test get layer kind": function() {},
					"test check if artboard": function() {},
					"test check if layer": function() {},
					"test check if layer group or artboard": function() {},
					"test check if view should be ignored": function() {},
					"test check if view should be flattened": function() {},
					"test check if view should be extracted": function() {},
					"test check if view should not be traversed": function() {},
					"test check if layer name begins with...": function() {},
					"test check if layer name ends with...": function() {},
					
					"test get sanitized layer name": function() {},
					"test get layer name attributes": function() {},
					"test add layer name attribute": function() {},
					"test clear layer name attributes": function() {},
					
					"test get data attached to layer": function() {},
					"test set data attached to layer": function() {},
					"test clear data attached to layer": function() {},
					"test get Content Spec attached to layer": function() {},
					"test set Content Spec attached to layer": function() {},
					"test clear Content Spec attached to layer": function() {},

					"test get layer artboard": function() {},
					"test get layer artboard size": function() {},
					"test check if layer has children": function() {},
					"test get layer children": function() {},
					
					"test disable layer hidden attribute": function() {},
					"test enable layer hidden attribute": function() {},
					"test check if layer is hidden": function() {},
					"test check if layer has hidden children": function() {},
					
					"test disable layer mask attribute": function() {},
					"test enable layer mask attribute": function() {},
					"test check if layer is a clipping mask": function() {},
					"test check if clipping mask view should be extracted": function() {},
					"test check if layer has a clipping mask": function() {},
					"test get layer clipping mask": function() {},
					
					"test get layer layout relative to another layer": function() {},
					"test get layer layout including styles": function() {},
					"test get layer layout without styles": function() {},
					"test get layer absolute layout": function() {},

					"test get border styles": function() {},
					"test get shadow styles": function() {},
					"test duplicate layer": function() {},
					"test remove layer from parent": function() {}
				};
			} )()
		};
	} )( View.create( context ) );

	/**
		* @desc ViewBindingController testing
	*/
	suite[ "test ViewBindingController script" ] = ( function( viewBindingControl ) {
		return {
			"test layer binding registry": function() {
				// viewBindingControl.layerKindRegistry

				// accessing registered bindings
			},
			"test layer name binding registry": function() {
				// viewBindingControl.bindingRegistry

				// access registered bindings
			},
			"test apply bindings to layers": function() {
				// viewBindingControl.applyBindings
			}
		};
	} )( new ViewBindingController() );

	/**
		* @desc html parser testing
	*/
	suite[ "test html parser script" ] = {};
	
	test.runAll( suite );

	endDate = new Date();
	log( "##### Ended | " + endDate.toLocaleTimeString() + " | " + ( endDate.getTime() - startDate.getTime() ) + " ms #####" );
	context.document.showMessage( "Ended" );
}

