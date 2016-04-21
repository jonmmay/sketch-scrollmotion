@import "../util.js";
@import "../Config.js";
@import "../CS.js";
@import "../View.js";
@import "assert.js";

function runTests( context ) {
	var startDate = new Date(),
		endDate,
		suite = {},

		csSchemaVer = "http://www.scrollmotion.com/contentspec/schema/3.18/",
		csResetCSS = "reset3.14.1.css";
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

				assert.ok( typeof util.Object.create === "function", "'util.Object' create method exists" );
				assert.ok( typeof util.Object.extend === "function", "'util.Object' extend method exists" );
				assert.ok( typeof util.Object.instanceOf === "function", "'util.Object' instanceOf method exists" );
				assert.ok( typeof util.Object.init === "function", "'util.Object' init method exists" );
			},
			"test extending from object": function() {
				var object = Object.create()
					ExtendedObject = util.Object.extend( {} ),
					foo = Object.create( { bar: "baz" } );

				assert.ok( ExtendedObject.instanceOf( object ), "object is extended from Object" );
				assert.ok( ExtendedObject.instanceOf( util.Object ), "object is extended from util.Object" );
				assert.ok( !ExtendedObject.instanceOf( foo ), "object is not extended from an Object instance" );
			},
			"test graceful handling of invalid parameters": function() {
				var ExtendEmpty = util.Object.extend();

				assert.ok( ExtendEmpty.instanceOf( util.Object ), "object is extended from util.Object" );
			},
			"test extending from object": function() {
				var inited = false,
					ExtendedObject = util.Object.extend( {
						"init": function( ctx ) {
							this._super( ctx );
							inited = true;
						}
					} ),
					extendedObject = ExtendedObject.create( context );

				assert.ok( inited, "extended object can initiate code" );
				assert.ok( !!extendedObject.context, "instance can access plugin context object" );
				assert.ok( !!extendedObject.doc, "instance can access plugin document" );
				assert.ok( !!extendedObject.plugin, "instance can access plugin plugin" );
				assert.ok( !!extendedObject.selection, "instance can access plugin selection" );
				assert.ok( !!extendedObject.command, "instance can access plugin command" );
			},
			"test graceful extending from object without calling super init": function() {
				var inited = false,
					ExtendedObject = util.Object.extend( {
						"init": function() {
							inited = true;
						}
					} ),
					extendedObject = ExtendedObject.create( context );

				assert.ok( inited, "extended object can initiate code" );
				assert.ok( !!!extendedObject.context, "instance cannot access plugin context object" );
				assert.ok( !!!extendedObject.doc, "instance cannot access plugin document" );
				assert.ok( !!!extendedObject.plugin, "instance cannot access plugin plugin" );
				assert.ok( !!!extendedObject.selection, "instance cannot access plugin selection" );
				assert.ok( !!!extendedObject.command, "instance cannot access plugin command" );
			},
			"test calling super": function() {
				var superMessage,
					messageForSuper = "foo bar",
					ExtendedParent = util.Object.extend( {
						"init": function() {
						},
						"doSomething": function( message ) {
							superMessage = message;
						}
					} ),
					ExtendedChild = ExtendedParent.extend( {
						"init": function() {
						},
						"doSomething": function( message ) {
							this._super( message );
						}
					} ),
					child = ExtendedChild.create();

				child.doSomething( messageForSuper );

				assert.strictEqual( messageForSuper, superMessage, "object extension can call super methods" );
			}
		},
		"test util.Command": {
			"test for existence": function() {
				assert.ok( typeof util.Command === "object", "'util.Command' exists" );
				assert.ok( util.Command.instanceOf( util.Object ), "util.Command is extended from util.Object" );

				var value = 1,
					command = util.Command.create( function( val ) {
						this.value += val;
					}, function( val ) {
						this.value -= val;
					}, value );

				assert.strictEqual( command.value, value, "Value is unchanged" );

				command.execute( 2 );
				assert.strictEqual( command.value, 3, "Value is changed" );

				command.undo( 2 );
				assert.strictEqual( command.value, value, "Value is unchanged" );
			}
		},
		"test util.forEach": {
			"test for existence": function() {
				assert.ok( typeof util.forEach === "function", "'util.forEach' exists" );
			},
			"test forEach cocoa object" : function() {
				var object = [NSDictionary dictionaryWithObjectsAndKeys:"foo","bar","baz","qux",nil],
					keys = [ "foo", "baz" ],
					vals = [ "bar", "qux" ];

				util.forEach( object, function( val, key ) {
					// Remove val
					vals.splice( vals.indexOf( val ), 1 );

					// Remove key
					keys.splice( vals.indexOf( key ), 1 );
				} );

				assert.strictEqual( vals.length, 0, "All values accounted for in loop" );
				assert.strictEqual( keys.length, 0, "All keys accounted for in loop" );
			},
			"test forEach cocoa array" : function() {
				var array = [NSArray arrayWithObjects:"foo","bar","baz","qux"];

				util.forEach( array, function( val, index ) {
					assert.strictEqual( val, [array objectAtIndex:index], "Value accounted for in loop" );
				} );
			},
			"test forEach js object" : function() {
				var object = {
						foo: "bar",
						baz: "qux"
					},
					keys = [ "foo", "baz" ],
					vals = [ "bar", "qux" ];

				util.forEach( object, function( val, key ) {
					// Remove val
					vals.splice( vals.indexOf( val ), 1 );

					// Remove key
					keys.splice( vals.indexOf( key ), 1 );
				} );

				assert.strictEqual( vals.length, 0, "All values accounted for in loop" );
				assert.strictEqual( keys.length, 0, "All keys accounted for in loop" );
			},
			"test forEach js array" : function() {
				var array = [ "foo", "bar", "baz", "qux" ];

				util.forEach( array, function( val, index ) {
					assert.strictEqual( val, array[ index ], "Value accounted for in loop" );
				} );
			}
		},
		"test util.values": {
			"test for existence": function() {
				assert.ok( typeof util.values === "function", "'util.values' exists" );
			},
			"test values cocoa object" : function() {
				// Value, key ...
				var object = [NSDictionary dictionaryWithObjectsAndKeys:"foo","bar","baz","qux",nil],
					values;

				values = util.values( object );

				assert.ok( Array.isArray( values ), "values is an array" );
				assert.strictEqual( values.length, 2, "values consists of objects values" );
				assert.equal( values[ 0 ], "foo", "values value" );
				assert.equal( values[ 1 ], "baz", "values value" );
			},
			"test values cocoa array" : function() {
				var array = [NSArray arrayWithObjects:"foo","bar","baz","qux"],
					values = util.values( array );

				assert.ok( Array.isArray( values ), "values is an array" );
				assert.strictEqual( values.length, 4, "values consists of objects values" );
				assert.equal( values[ 0 ], "foo", "values value" );
				assert.equal( values[ 1 ], "bar", "values value" );
				assert.equal( values[ 2 ], "baz", "values value" );
				assert.equal( values[ 3 ], "qux", "values value" );
			},
			"test values js object" : function() {
				var object = {
						foo: "fooVal",
						bar: 0
					},
					object2 = Object.create( object ),
					values;

				object2.baz = function() {};
				object2.qux = "quxVal";

				values = util.values( object2 );

				assert.ok( Array.isArray( values ), "values is an array" );
				assert.strictEqual( values.length, 1, "values consists of objects own properties' values, minus functions" );
				assert.strictEqual( values[ 0 ], "quxVal", "values value" );
			},
			"test values js array" : function() {
				var array = [ "foo", "bar", "baz", "qux" ],
					values = util.values( array );

				assert.ok( Array.isArray( values ), "values is an array" );
				assert.strictEqual( values.length, 4, "values consists of objects values" );
				assert.strictEqual( values[ 0 ], "foo", "values value" );
				assert.strictEqual( values[ 1 ], "bar", "values value" );
				assert.strictEqual( values[ 2 ], "baz", "values value" );
				assert.strictEqual( values[ 3 ], "qux", "values value" );
			}
		},
		"test util.stringifyJSON": {
			"test for existence": function() {
				assert.ok( typeof util.stringifyJSON === "function", "'util.stringifyJSON' exists" );
			},
			"test stringifying cocoa JSON": function() {
				function deserializeString( nsstring ) {
					var data = [nsstring dataUsingEncoding:NSUTF8StringEncoding],
						obj = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil];

					return obj;
				}

				var array = [NSArray arrayWithObjects:"baz","qux"],
					number = [NSNumber numberWithInt:2],
					dict2 = [NSDictionary dictionaryWithObject:number forKey:"baz"],
					dictionary = [NSDictionary dictionaryWithObjectsAndKeys:"bar","foo",dict2,"baz",array,"qux",nil],
					
					stringifiedNSDict = util.stringifyJSON( dictionary ),
					actualNSDict = deserializeString( stringifiedNSDict ),
					expectedNSDict = dictionary,

					stringifiedNSArr = util.stringifyJSON( array ),
					actualNSArr = deserializeString( stringifiedNSArr ),
					expectedNSArr = array;

					assert.ok( [actualNSDict isEqual:expectedNSDict], "stringifies NSDictionary JSON" );
					assert.ok( [actualNSArr isEqual:expectedNSArr], "stringifies NSArray JSON" );

			},
			// Not intended for parsing JS JSON; use JSON.parse
			"test stringifying js JSON": function() {
				var stringifiedObj = util.stringifyJSON( {"foo":"bar","baz":{"baz":2},"qux":["baz","qux"]} ),
					stringifiedArr = util.stringifyJSON( ["baz","qux"] );

					assert.ok( [stringifiedObj isKindOfClass:[NSString class]], "stringifies object JSON" );
					assert.ok( [stringifiedArr isKindOfClass:[NSString class]], "stringifies array JSON" );

			},
			"test stringifying JSON with invalid parameters": function() {
				var paramEmpty = "",
					
					actual = util.stringifyJSON( paramEmpty ),
					expected = null;

					assert.ok( actual == expected, "returns null when passed invalid parameter" );
			}
		},
		"test util.merge": {
			"test for existence": function() {
				assert.ok( typeof util.merge === "function", "'util.merge' exists" );
			},
			"test merging cocoa object": function() {
				var array1 = [NSArray arrayWithObjects:"baz","qux"],
					number1a = [NSNumber numberWithInt:0],
					number1b = [NSNumber numberWithInt:1],
					dict1 = [NSDictionary dictionaryWithObjectsAndKeys:number1a,"baz",number1b,"qux",nil],
					dictionary1 = [NSDictionary dictionaryWithObjectsAndKeys:"old","obj1","bar","foo",dict1,"baz",array1,"qux",nil],

					array2 = [NSArray arrayWithObjects:"new","qux"],
					number2 = [NSNumber numberWithInt:2],
					dict2 = [NSDictionary dictionaryWithObject:number2 forKey:"baz"],
					dictionary2 = [NSDictionary dictionaryWithObjectsAndKeys:"new","obj2","foo","foo",dict2,"baz",array2,"qux",nil],
					actual = util.merge( dictionary1, dictionary2 );

					assert.ok( [( actual.obj1 ) isEqual:"old"], "Root values are preserves if unique" );
					assert.ok( [( actual.obj2 ) isEqual:"new"], "New unique values are merged" );
					assert.ok( [( actual.foo ) isEqual:"foo"], "Common key string value is merged" );
					assert.ok( [( actual.baz.baz ) isEqual:2], "Common key object value is merged" );
					assert.equal( actual.baz.qux, undefined, "Merge is superficial" );
					assert.ok( [( actual.qux[ 0 ] ) isEqual:"new"], "Common key array value is merged" );
			},
			"test merging js object": function() {
				var obj1 = {
						"foo": "bar",
						"baz": {
							"baz": 0,
							"qux": 1
						},
						"qux": [
							"baz",
							"qux"
						],
						"obj1": "old"
					},
					obj2 = {
						"foo": "foo",
						"baz": {
							"baz": 2
						},
						"qux": [
							"new",
							"qux"
						],
						"obj2": "new"
					},
					actual = util.merge( obj1, obj2 );

					assert.strictEqual( actual.obj1, "old", "Root values are preserves if unique" );
					assert.strictEqual( actual.obj2, "new", "New unique values are merged" );
					assert.strictEqual( actual.foo, "foo", "Common key string value is merged" );
					assert.strictEqual( actual.baz.baz, 2, "Common key object value is merged" );
					assert.strictEqual( actual.baz.qux, undefined, "Merge is superficial" );
					assert.strictEqual( actual.qux[ 0 ], "new", "Common key array value is merged" );
			},
			"test merging multiple js objects": function() {
				var obj1 = {
						foo: "obj1",
						bar: 0,
						boolean: false
					},
					obj2 = {
						foo: "obj2",
						baz: 1,
						boolean: true
					},
					obj3 = {
						foo: "obj3",
						qux: 2
					},
					obj4 = {
						foo: "obj4",
						hoge: 3
					},
					actual = util.merge( obj1, obj2, obj3, obj4 );

				log( actual );

				assert.strictEqual( actual.foo, "obj4", "Common key value are overwritten" );
				assert.strictEqual( actual.boolean, true, "Common key value are overwritten" );
				assert.strictEqual( actual.bar, 0, "Unique values are preserved" );
				assert.strictEqual( actual.baz, 1, "Unique values are preserved" );
				assert.strictEqual( actual.qux, 2, "Unique values are preserved" );
				assert.strictEqual( actual.hoge, 3, "Unique values are preserved" );
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
				assert.ok( Config.instanceOf( util.Object ), "Config is extended from util.Object" );
			},
			"test instance of Config": function() {
				assert.ok( !!config.context, "instance can access plugin context object" );
				assert.ok( !!config.doc, "instance can access plugin document" );
				assert.ok( !!config.plugin, "instance can access plugin plugin" );
				assert.ok( !!config.selection, "instance can access plugin selection" );
				assert.ok( !!config.command, "instance can access plugin command" );
			},
			"test access to sketch version": {
				"test for existence": function() {
					assert.ok( typeof config.getSketchVersion === "function", "'config.getSketchVersion' exists" );
				}
			},
			"test access to document name": {
				"test for existence": function() {
					assert.ok( typeof config.getDocumentName  === "function", "'config.getDocumentName' exists" );
				}
			},
			"test image extension": {
				"test for existence": function() {
					assert.ok( typeof config.getImageExtension  === "function", "'config.getImageExtension' exists" );
				}
			},
			"test export folder path": {
				"test for existence": function() {
					assert.ok( typeof config.getExportFolderPath  === "function", "'config.getExportFolderPath' exists" );
				}
			},
			"test document path": {
				"test for existence": function() {
					assert.ok( typeof config.getDocumentPath  === "function", "'config.getDocumentPath' exists" );
				}
			},
			"test plugin path": {
				"test for existence": function() {
					assert.ok( typeof config.getPluginPath  === "function", "'config.getPluginPath' exists" );
				}
			},
			"test resources path": {
				"test for existence": function() {
					assert.ok( typeof config.getResourcesPath  === "function", "'config.getResourcesPath' exists" );
				}
			},
			"test settings path": {
				"test for existence": function() {
					assert.ok( typeof config.getSettingsPath  === "function", "'config.getSettingsPath' exists" );
				}
			},
			"test Documents settings path": {
				"test for existence": function() {
					assert.ok( typeof config.getDocumentsSettingsPath  === "function", "'config.getDocumentsSettingsPath' exists" );
				}
			},
			"test accessing settings data": {
				"test getting settings object": {
					"test for existence": function() {
						assert.ok( typeof config.getSettingsManifest  === "function", "'config.getSettingsManifest' exists" );
					}
				},
				"test getting settings key value": {
					"test for existence": function() {
						assert.ok( typeof config.getSettingsKeyValue  === "function", "'config.getSettingsKeyValue' exists" );
					}
				},
				"test setting settings": {
					"test for existence": function() {
						assert.ok( typeof config.setSettingsManifest  === "function", "'config.setSettingsManifest' exists" );
					}
				},
				"test syncing with default settings": {
					"test for existence": function() {
						assert.ok( typeof config.syncSettingsWithDefault  === "function", "'config.syncSettingsWithDefault' exists" );
					}
				}
			},
			"test export scale factors": {
				"test for existence": function() {
					assert.ok( typeof config.getExportScaleFactors  === "function", "'config.getExportScaleFactors' exists" );
				}
			}
		};
	} )( Config.create( context ) );

	/**
		* @desc CS testing
	*/
	suite[ "test CS script" ] = ( function( cs ) {
		return {
			"test Content Spec": function() {
				assert.ok( typeof ContentSpec === "object", "ContentSpec is an object" );
				assert.ok( ContentSpec.instanceOf( util.Object ), "ContentSpec is extended from util.Object" );
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
				"test schema": function() {
					assert.ok( typeof cs.getSchema === "function", "'cs.getSchema' exists" );

					assert.strictEqual( cs.getSchema(), csSchemaVer, "Schema version found" );
				},
				"test reset css": function() {
					assert.ok( typeof cs.getResetCss === "function", "'cs.getResetCss' exists" );
					
					assert.strictEqual( cs.getResetCss(), csResetCSS, "Reset css version found" );

					// Set reset css and retrieve reset css
				},
				"test start page": function() {
					assert.ok( typeof cs.getStartPage === "function", "'cs.getStartPage' exists" );
					assert.ok( typeof cs.setStartPage === "function", "'cs.setStartPage' exists" );

					// Set start page and retrieve start page
				},
				"test add font metadata": function() {
					assert.ok( typeof cs.addFontMetaData === "function", "'cs.addFontMetaData' exists" );
				}
			},
			"test getting CS keys by key name": function() {
				assert.ok( typeof cs.getContentSpecKeysByKey === "function", "'cs.getContentSpecKeysByKey' exists" );
			},
			"test getting pageset ids": function() {
				assert.ok( typeof cs.getPageSetsIds === "function", "'cs.getPageSetsIds' exists" );
			},
			"test getting pages ids": function() {
				assert.ok( typeof cs.getPagesIds === "function", "'cs.getPagesIds' exists" );
			},
			"test getting overlays ids": function() {
				assert.ok( typeof cs.getOverlaysIds === "function", "'cs.getOverlaysIds' exists" );
			},
			"test CS screensupport": function() {
				assert.ok( typeof cs.getScreenSupportScreens === "function", "'cs.getScreenSupportScreens' exists" );
				assert.ok( typeof cs.addScreenSupportScreen === "function", "'cs.addScreenSupportScreen' exists" );

				// Set screen support screen and retrieve screen support screen
			},
			"test generating unique overlayId": function() {
				assert.ok( typeof cs.generateOverlayId === "function", "'cs.generateOverlayId' exists" );
			},
			"test generating unique pageId": function() {
				assert.ok( typeof cs.generatePageId === "function", "'cs.generatePageId' exists" );
			},
			"test making new overlay": {
				"test text overlay": ( function() {
				    /**
				        * @desc Convert string containing RGB color data to hex
				        * @param {string}
				        * @returns {string} hex color
				    */
				    function hexColorFromString( str ) {
				        // Return str if already hex color
				        if( ( /^#[0-9a-fA-F]{6}$/i ).test( str ) ) {
				            return str;
				        }

				        // Sketch doesn't like Regex
				        var res = new RegExp( "\\(([^\\)]*)\\)" ).exec( str ),
				            rgb = ( res && res[ 1 ] ) ? res [ 1 ].split( "," ) : null,
				            hex = rgb && rgb.length === 3 ? 
				                    util.rgbToHex( parseInt( rgb[ 0 ] ), parseInt( rgb[ 1 ] ), parseInt( rgb[ 2 ] ) ) :
				                    "#000000";
				        
				        return hex;
				    }

				    // TODO: underline, strikethrough, super and subscript support

				    // 3.18 text formatting
					var ver_3180 = {
							value: "Jacquie accessorized with a fancy bag, but her smock looked inexpensive.",
							default: "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></div>",
							carriageReturn: "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">Jacquie accessorized with a fancy bag, </span></div><div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">but her smock looked inexpensive.</span></div>",
							color: "<div style=\"text-align:left;\"><span style=\"color:#FF0000;\"><span style=\"font-size: 24px; font-family: ArialMT, Arial;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></div>",
							customFont_color: "<div style=\"text-align:left;\"><span style=\"color:#FF0000;\"><span class=\"sm-font-family\" style=\"font-family:Merriweather-Light,'Merriweather';font-style:normal;font-weight:normal;\"><span style=\"font-size: 24px;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></span></div>",
							variableSpacing_leftAligned: "<div style=\"text-align: left; line-height: 21px;\"><span style=\"letter-spacing:1px;\"><span style=\"font-size:18px;\"><span style=\"font-family: ArialMT, Arial; color: rgb(0, 0, 0);\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></span></div>",
							variableSpacing_centerAligned: "<div style=\"line-height: 21px; text-align: center;\"><span style=\"letter-spacing:1px;\"><span style=\"font-size:18px;\"><span style=\"font-family: ArialMT, Arial; color: rgb(0, 0, 0);\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></span></div>",
							variableSpacing_rightAligned: "<div style=\"line-height: 21px; text-align: right;\"><span style=\"letter-spacing:-1px;\"><span style=\"font-size:18px;\"><span style=\"font-family: ArialMT, Arial; color: rgb(0, 0, 0);\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></span></div>",
							variableSpacing_justifyAligned: "<div style=\"line-height: 21px; text-align: justify;\"><span style=\"letter-spacing:-1px;\"><span style=\"font-size:18px;\"><span style=\"font-family: ArialMT, Arial; color: rgb(0, 0, 0);\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></span></div>",
							underline: "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><u><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></u></span></div>",
							strikethrough: "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><strike><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></strike></span></div>",
							superscript: "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><sup><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></sup></span></div>",
							subscript: "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\"><sub><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></sub></span></div>"
						},
						ver_3180_specialChar = {
							value: "Greater than: >; Less than: <; Ampersand: &; Sequential spaces:   .",
							default: "<div style=\"text-align:left;\"><span style=\"font-size:24px;font-family:ArialMT,'Arial';color:#000000;\">Greater than: &gt;; Less than: &lt;; Ampersand: &amp;; Sequential spaces: &nbsp; .</span></div>"
						},

						// 3.20 text formatting
						ver_3200 = {
							value: "Jacquie accessorized with a fancy bag, but her smock looked inexpensive.",
							default: "<p>Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</p>",
							carriageReturn: "<p>Jacquie accessorized with a fancy bag, <br></p><p>but her smock looked inexpensive.</p>",
							color: "<p style=\"color: rgb(255, 0, 0);\"><span style=\"color:#FF0000;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></p>",
							customFont_color: "<p style=\"color: rgb(255, 0, 0); font-family: Merriweather-Light;\"><span style=\"font-family:merriweather-light;\"><span style=\"color:#FF0000;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></p>",
							variableSpacing_leftAligned: "<p style=\"line-height: 21px; font-size: 18px;\"><span style=\"letter-spacing:1px;\"><span style=\"font-size:18px;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></p>",
							variableSpacing_centerAligned: "<p style=\"line-height: 21px; font-size: 18px; text-align: center;\"><span style=\"letter-spacing:1px;\"><span style=\"font-size:18px;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></p>",
							variableSpacing_rightAligned: "<p style=\"line-height: 21px; font-size: 18px; text-align: right;\"><span style=\"letter-spacing:-1px;\"><span style=\"font-size:18px;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></p>",
							variableSpacing_justifyAligned: "<p style=\"line-height: 21px; font-size: 18px; text-align: justify;\"><span style=\"letter-spacing:-1px;\"><span style=\"font-size:18px;\">Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</span></span></p>",
							underline: "<p><u>Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</u></p>",
							strikethrough: "<p><s>Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</s></p>",
							superscript: "<p><sup>Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</sup></p>",
							subscript: "<p><sub>Jacquie accessorized with a fancy bag, but her smock looked inexpensive.</sub></p>"
						},
						ver_3200_specialChar = {
							value: "Greater than: >; Less than: <; Ampersand: &; Sequential spaces:   .",
							default: "<p>Greater than: &gt;; Less than: &lt;; Ampersand: &amp;; Sequential spaces: &nbsp; .<br></p>"
						};

					return {
						// 3.18
						"test 3.18 text": {
							"test getting text string value": function() {
								var htmlString;

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										htmlString = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] ).getStringValue();
																	
										assert.strictEqual( htmlString, ver_3180.value, "Version 3.18 " + key + " string value can be parsed" );
									}
								}
							},
							"test getting first instance of text font family": function() {
								var textOverlay,
									fontFamily;

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );
										fontFamily = textOverlay.firstInstanceofTextStyle( "font-family" );

										if( key === "customFont_color" ) {
											assert.strictEqual( fontFamily, "Merriweather-Light,'Merriweather'", "Version 3.18 " + key + " font-family value found" );
											assert.strictEqual( textOverlay.getFontFamily(), "Merriweather-Light,'Merriweather'", "Version 3.18 " + key + " font-family value found" );
										} else if( key === "color" ||
												   key === "variableSpacing_leftAligned" ||
												   key === "variableSpacing_centerAligned" ||
												   key === "variableSpacing_rightAligned" ||
												   key === "variableSpacing_justifyAligned" ) {
											
											// For some reason font-family is formatted differently
											assert.strictEqual( fontFamily, "ArialMT, Arial", "Version 3.18 " + key + " font-family value found" );
											assert.strictEqual( textOverlay.getFontFamily(), "ArialMT, Arial", "Version 3.18 " + key + " font-family value found" );
										} else {
											assert.strictEqual( fontFamily, "ArialMT,'Arial'", "Version 3.18 " + key + " font-family value found" );
											assert.strictEqual( textOverlay.getFontFamily(), "ArialMT,'Arial'", "Version 3.18 " + key + " font-family value found" );
										}
									}
								}
							},
							"test getting first instance of text font size": function() {
								var textOverlay,
									fontSize;

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );
										fontSize = textOverlay.firstInstanceofTextStyle( "font-size" );

										if( key === "variableSpacing_leftAligned" ||
											key === "variableSpacing_centerAligned" ||
											key === "variableSpacing_rightAligned" ||
											key === "variableSpacing_justifyAligned" ) {

											assert.strictEqual( fontSize, "18px", "Version 3.18 " + key + " font-size value found" );
										assert.strictEqual( textOverlay.getFontSize(), "18px", "Version 3.18 " + key + " font-size value found" );
										} else {
											assert.strictEqual( fontSize, "24px", "Version 3.18 " + key + " font-size value found" );
											assert.strictEqual( textOverlay.getFontSize(), "24px", "Version 3.18 " + key + " font-size value found" );
										}
									}
								}
							},
							"test getting first instance of text line height": function() {
								var textOverlay,
									lineHeight;

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );
										lineHeight = textOverlay.firstInstanceofTextStyle( "line-height" );

										if( key === "variableSpacing_leftAligned" ||
											key === "variableSpacing_centerAligned" ||
											key === "variableSpacing_rightAligned" ||
											key === "variableSpacing_justifyAligned" ) {

											assert.strictEqual( lineHeight, "21px", "Version 3.18 " + key + " line-height value found" );
											assert.strictEqual( textOverlay.getLineHeight(), "21px", "Version 3.18 " + key + " line-height value found" );
										} else {
											assert.strictEqual( lineHeight, null, "Version 3.18 " + key + " uses auto line-height" );
											assert.strictEqual( textOverlay.getLineHeight(), null, "Version 3.18 " + key + " uses auto line-height" );
										}
									}
								}
							},
							"test getting first instance of text letter spacing": function() {
								var textOverlay,
									letterSpacing;

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );
										letterSpacing = textOverlay.firstInstanceofTextStyle( "letter-spacing" );

										if( key === "variableSpacing_leftAligned" ||
											key === "variableSpacing_centerAligned" ) {

											assert.strictEqual( letterSpacing, "1px", "Version 3.18 " + key + " letter-spacing value found" );
											assert.strictEqual( textOverlay.getLetterSpacing(), "1px", "Version 3.18 " + key + " letter-spacing value found" );
										} else if( key === "variableSpacing_rightAligned" ||
												   key === "variableSpacing_justifyAligned" ) {

											assert.strictEqual( letterSpacing, "-1px", "Version 3.18 " + key + " letter-spacing value found" );
											assert.strictEqual( textOverlay.getLetterSpacing(), "-1px", "Version 3.18 " + key + " letter-spacing value found" );
										} else {
											assert.strictEqual( letterSpacing, null, "Version 3.18 " + key + " uses auto letter-spacing" );
											assert.strictEqual( textOverlay.getLetterSpacing(), null, "Version 3.18 " + key + " uses auto letter-spacing" );
										}
									}
								}
							},
							"test getting first instance of text alignment": function() {
								var textOverlay,
									align;

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );
										align = textOverlay.firstInstanceofTextStyle( "text-align" );

										if( key === "variableSpacing_centerAligned" ) {
											assert.strictEqual( align, "center", "Version 3.18 " + key + " text-align value found" );
											assert.strictEqual( textOverlay.getTextAlign(), "center", "Version 3.18 " + key + " text-align value found" );
										} else if( key === "variableSpacing_rightAligned" ) {
											assert.strictEqual( align, "right", "Version 3.18 " + key + " text-align value found" );
											assert.strictEqual( textOverlay.getTextAlign(), "right", "Version 3.18 " + key + " text-align value found" );
										} else if( key === "variableSpacing_justifyAligned" ) {
											assert.strictEqual( align, "justify", "Version 3.18 " + key + " text-align value found" );
											assert.strictEqual( textOverlay.getTextAlign(), "justify", "Version 3.18 " + key + " text-align value found" );
										} else {
											assert.strictEqual( align, "left", "Version 3.18 " + key + " uses default left text-align" );
											assert.strictEqual( textOverlay.getTextAlign(), "left", "Version 3.18 " + key + " uses default left text-align" );
										}
									}
								}
							},
							"test getting first instance text color": function() {
								var textOverlay,
									color;

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );
										color = textOverlay.firstInstanceofTextStyle( "color" );

										if( key === "color" ||
											key === "customFont_color" ) {
											
											assert.strictEqual( color, "#FF0000", "Version 3.18 " + key + " color value found" );
											assert.strictEqual( textOverlay.getColor(), "#FF0000", "Version 3.18 " + key + " color value found" );
										} else if( key === "variableSpacing_leftAligned" ||
												   key === "variableSpacing_centerAligned" ||
												   key === "variableSpacing_rightAligned" ||
												   key === "variableSpacing_justifyAligned" ) {

											// "rgb(0, 0, 0)"
											assert.strictEqual( hexColorFromString( color ), "#000000", "Version 3.18 " + key + " color value found" );
											assert.strictEqual( hexColorFromString( textOverlay.getColor() ), "#000000", "Version 3.18 " + key + " color value found" );
										} else {
											assert.strictEqual( hexColorFromString( color ), "#000000", "Version 3.18 " + key + " uses default black color" );
											assert.strictEqual( hexColorFromString( textOverlay.getColor() ), "#000000", "Version 3.18 " + key + " uses default black color" );
										}
									}
								}
							},
							"test special characters": function() {
								// &, sequential spaces, <, >
								var htmlString;

								for( var key in ver_3180_specialChar ) {
									if( key !== "value" ) {
										htmlString = cs.make( "text_complex" ).setTextHtml( ver_3180_specialChar[ key ] ).getStringValue();

										assert.strictEqual( htmlString, ver_3180_specialChar.value, "Version 3.18 " + key + " string value can be parsed" );
									}
								}
							},
							"test line breaks": function() {
								var textOverlay,
									nodeStyles,
									lineBreakIndexes = [];

								for( var key in ver_3180 ) {
									lineBreakIndexes = [];

									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );
										nodeStyles = textOverlay.getTextNodeStyles();

										lineBreakIndexes = nodeStyles.filter( function( node ) {
											return node.leadingLineBreak;
										} ).map( function( node ) {
											return node.index;
										} );

										assert.strictEqual( lineBreakIndexes.length, 
															textOverlay.getTextNodes().getLineBreaks().length,
															"Version 3.18 " + key + " string has " + lineBreakIndexes.length + " line breaks" );

										if( key === "carriageReturn" ) {
											assert.ok( lineBreakIndexes, "Version 3.18 " + key + " line break exists" );
											assert.strictEqual( lineBreakIndexes.length, 1, "Version 3.18 " + key + " has 1 line break" );
										} else {
											assert.ok( lineBreakIndexes, "Version 3.18 " + key + " line break doesn't exist" );
										}
									}
								}
							},
							"test parsing html to nodes": function() {
								var textOverlay,
									textStyledNodes,
									textHtml,

									altOverlayOriginal,
									altOverlayParsed;

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										// Pass html string to overlay
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );
										// Capture styled nodes from overlay
										textStyledNodes = textOverlay.getTextNodeStyles();
										// Pass styled nodes back to overlay
										textOverlay.setTextNodes( textStyledNodes );

										textHtml = textOverlay.getHtmlFromNodeStyles();

										// Test if parsed html is the same as the original html
										if( textHtml === ver_3180[ key ] ) {
											assert.strictEqual( textHtml, ver_3180[ key ], "Version 3.18 " + key + " html can be parsed into nodes and back to html" );	
										}
										
										// Parse parsed html back into styled nodes for comparison
										// This should account for html formatting which may be equal despite string differences
										else {
											log( "String values not equal:\nExpected: " + ver_3180[ key ] + "\nFound: " + textHtml );

											altOverlayOriginal = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] ).getTextNodeStyles();
											altOverlayParsed = cs.make( "text_complex" ).setTextHtml( textHtml ).getTextNodeStyles();

											assert.strictEqual( altOverlayParsed.stringValue, altOverlayOriginal.stringValue, "Version 3.18 " + key + " html can be parsed into nodes, back to html, and back to nodes - stringValue" );	
											assert.strictEqual( altOverlayParsed.style, altOverlayOriginal.style, "Version 3.18 " + key + " html can be parsed into nodes, back to html, and back to nodes - style" );	
										}
									}
								}
							},

							"test setting text font family": function() {
								var textOverlay,
									testFontFamily = "FooFont-Regular,'FooFont'";

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );

										textOverlay.setFontFamily( testFontFamily );

										assert.strictEqual( textOverlay.getFontFamily(), testFontFamily, "Version 3.18 " + key + " font-family can be set" );
									}
								}
							},
							"test setting text font size": function() {
								var textOverlay,
									testFontSize = "48px";

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );

										textOverlay.setFontSize( testFontSize );

										assert.strictEqual( textOverlay.getFontSize(), testFontSize, "Version 3.18 " + key + " font-size can be set" );
									}
								}
							},
							"test setting text line height": function() {
								var textOverlay,
									testLineHeight = "57px";

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );

										textOverlay.setLineHeight( testLineHeight );

										assert.strictEqual( textOverlay.getLineHeight(), testLineHeight, "Version 3.18 " + key + " line-height can be set" );
									}
								}
							},
							"test setting text letter spacing": function() {
								var textOverlay,
									testLetterSpacing = "5px";

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );

										textOverlay.setLetterSpacing( testLetterSpacing );

										assert.strictEqual( textOverlay.getLetterSpacing(), testLetterSpacing, "Version 3.18 " + key + " letter-spacing can be set" );
									}
								}
							},
							"test setting text alignment": function() {
								var textOverlay,
									testTextAlign = "FooFont-Regular,'FooFont'";

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );

										textOverlay.setTextAlign( testTextAlign );

										assert.strictEqual( textOverlay.getTextAlign(), testTextAlign, "Version 3.18 " + key + " text-align can be set" );
									}
								}
							},
							"test setting text color": function() {
								var textOverlay,
									testColor = "#FF00FF";

								for( var key in ver_3180 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3180[ key ] );

										textOverlay.setColor( testColor );

										assert.strictEqual( textOverlay.getColor(), testColor, "Version 3.18 " + key + " color can be set" );
									}
								}
							}
						},
						"test 3.20 text": {
							"test getting text string value": function() {
								var htmlString;

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										htmlString = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] ).getStringValue();
																	
										assert.strictEqual( htmlString, ver_3200.value, "Version 3.20 " + key + " string value can be parsed" );
									}
								}
							},
							"test getting first instance of text font family": function() {
								var textOverlay,
									fontFamily;

								// Sett Reset CSS value
								cs.setResetCss( "reset3.20.css" );

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );
										fontFamily = textOverlay.firstInstanceofTextStyle( "font-family" );

										if( key === "customFont_color" ) {
											assert.strictEqual( fontFamily, "Merriweather-Light", "Version 3.20 " + key + " font-family value found" );
											assert.strictEqual( textOverlay.getFontFamily(), "Merriweather-Light", "Version 3.20 " + key + " font-family value found" );
										} else {
											assert.strictEqual( fontFamily, "ArialMT", "Version 3.20 " + key + " font-family value found" );
											assert.strictEqual( textOverlay.getFontFamily(), "ArialMT", "Version 3.20 " + key + " font-family value found" );
										}
									}
								}
							},
							"test getting first instance of text font size": function() {
								var textOverlay,
									fontSize;

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );
										fontSize = textOverlay.firstInstanceofTextStyle( "font-size" );

										if( key === "variableSpacing_leftAligned" ||
											key === "variableSpacing_centerAligned" ||
											key === "variableSpacing_rightAligned" ||
											key === "variableSpacing_justifyAligned" ) {

											assert.strictEqual( fontSize, "18px", "Version 3.20 " + key + " font-size value found" );
										assert.strictEqual( textOverlay.getFontSize(), "18px", "Version 3.20 " + key + " font-size value found" );
										} else {
											assert.strictEqual( fontSize, "24px", "Version 3.20 " + key + " font-size value found" );
											assert.strictEqual( textOverlay.getFontSize(), "24px", "Version 3.20 " + key + " font-size value found" );
										}
									}
								}
							},
							"test getting first instance of text line height": function() {
								var textOverlay,
									lineHeight;

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );
										lineHeight = textOverlay.firstInstanceofTextStyle( "line-height" );

										if( key === "variableSpacing_leftAligned" ||
											key === "variableSpacing_centerAligned" ||
											key === "variableSpacing_rightAligned" ||
											key === "variableSpacing_justifyAligned" ) {

											assert.strictEqual( lineHeight, "21px", "Version 3.20 " + key + " line-height value found" );
											assert.strictEqual( textOverlay.getLineHeight(), "21px", "Version 3.20 " + key + " line-height value found" );
										} else {
											assert.strictEqual( lineHeight, null, "Version 3.20 " + key + " uses auto line-height" );
											assert.strictEqual( textOverlay.getLineHeight(), null, "Version 3.20 " + key + " uses auto line-height" );
										}
									}
								}
							},
							"test getting first instance of text letter spacing": function() {
								var textOverlay,
									letterSpacing;

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );
										letterSpacing = textOverlay.firstInstanceofTextStyle( "letter-spacing" );

										if( key === "variableSpacing_leftAligned" ||
											key === "variableSpacing_centerAligned" ) {

											assert.strictEqual( letterSpacing, "1px", "Version 3.20 " + key + " letter-spacing value found" );
											assert.strictEqual( textOverlay.getLetterSpacing(), "1px", "Version 3.20 " + key + " letter-spacing value found" );
										} else if( key === "variableSpacing_rightAligned" ||
												   key === "variableSpacing_justifyAligned" ) {

											assert.strictEqual( letterSpacing, "-1px", "Version 3.20 " + key + " letter-spacing value found" );
											assert.strictEqual( textOverlay.getLetterSpacing(), "-1px", "Version 3.20 " + key + " letter-spacing value found" );
										} else {
											assert.strictEqual( letterSpacing, null, "Version 3.20 " + key + " uses auto letter-spacing" );
											assert.strictEqual( textOverlay.getLetterSpacing(), null, "Version 3.20 " + key + " uses auto letter-spacing" );
										}
									}
								}
							},
							"test getting first instance of text alignment": function() {
								var textOverlay,
									align;

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );
										align = textOverlay.firstInstanceofTextStyle( "text-align" );

										if( key === "variableSpacing_centerAligned" ) {
											assert.strictEqual( align, "center", "Version 3.20 " + key + " text-align value found" );
											assert.strictEqual( textOverlay.getTextAlign(), "center", "Version 3.20 " + key + " text-align value found" );
										} else if( key === "variableSpacing_rightAligned" ) {
											assert.strictEqual( align, "right", "Version 3.20 " + key + " text-align value found" );
											assert.strictEqual( textOverlay.getTextAlign(), "right", "Version 3.20 " + key + " text-align value found" );
										} else if( key === "variableSpacing_justifyAligned" ) {
											assert.strictEqual( align, "justify", "Version 3.20 " + key + " text-align value found" );
											assert.strictEqual( textOverlay.getTextAlign(), "justify", "Version 3.20 " + key + " text-align value found" );
										} else {
											assert.strictEqual( align, "left", "Version 3.20 " + key + " uses default left text-align" );
											assert.strictEqual( textOverlay.getTextAlign(), "left", "Version 3.20 " + key + " uses default left text-align" );
										}
									}
								}
							},
							"test getting first instance text color": function() {
								var textOverlay,
									color;

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );
										color = textOverlay.firstInstanceofTextStyle( "color" );

										if( key === "color" ||
											key === "customFont_color" ) {
											
											assert.strictEqual( color, "rgb(255, 0, 0)", "Version 3.20 " + key + " color value found" );
											assert.strictEqual( textOverlay.getColor(), "rgb(255, 0, 0)", "Version 3.20 " + key + " color value found" );
										} else {
											assert.strictEqual( color, "rgb(0, 0, 0)", "Version 3.20 " + key + " uses default black color" );
											assert.strictEqual( textOverlay.getColor(), "rgb(0, 0, 0)", "Version 3.20 " + key + " uses default black color" );
										}
									}
								}
							},
							"test special characters": function() {
								// &, sequential spaces, <, >
								var htmlString;

								for( var key in ver_3200_specialChar ) {
									if( key !== "value" ) {
										htmlString = cs.make( "text_complex" ).setTextHtml( ver_3200_specialChar[ key ] ).getStringValue();

										assert.strictEqual( htmlString, ver_3200_specialChar.value, "Version 3.20 " + key + " string value can be parsed" );
									}
								}
							},
							"test line breaks": function() {
								var textOverlay,
									nodeStyles,
									lineBreakIndexes = [];

								for( var key in ver_3200 ) {
									lineBreakIndexes = [];

									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );
										nodeStyles = textOverlay.getTextNodeStyles();

										lineBreakIndexes = nodeStyles.filter( function( node ) {
											return node.leadingLineBreak;
										} ).map( function( node ) {
											return node.index;
										} );

										assert.strictEqual( lineBreakIndexes.length, 
															textOverlay.getTextNodes().getLineBreaks().length,
															"Version 3.20 " + key + " string has " + lineBreakIndexes.length + " line breaks" );

										if( key === "carriageReturn" ) {
											assert.ok( lineBreakIndexes, "Version 3.20 " + key + " line break exists" );
											assert.strictEqual( lineBreakIndexes.length, 1, "Version 3.20 " + key + " has 1 line break" );
										} else {
											assert.ok( lineBreakIndexes, "Version 3.20 " + key + " line break doesn't exist" );
										}
									}
								}
							},
							"test parsing html to nodes": function() {
								var textOverlay,
									textStyledNodes,
									textHtml,

									altOverlayOriginal,
									altOverlayParsed;

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										// Pass html string to overlay
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );
										// Capture styled nodes from overlay
										textStyledNodes = textOverlay.getTextNodeStyles();
										// Pass styled nodes back to overlay
										textOverlay.setTextNodes( textStyledNodes );

										textHtml = textOverlay.getHtmlFromNodeStyles();

										// Test if parsed html is the same as the original html
										if( textHtml === ver_3200[ key ] ) {
											assert.strictEqual( textHtml, ver_3200[ key ], "Version 3.20 " + key + " html can be parsed into nodes and back to html" );	
										}
										
										// Parse parsed html back into styled nodes for comparison
										// This should account for html formatting which may be equal despite string differences
										else {
											log( "String values not equal:\nExpected: " + ver_3200[ key ] + "\nFound: " + textHtml );

											altOverlayOriginal = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] ).getTextNodeStyles();
											altOverlayParsed = cs.make( "text_complex" ).setTextHtml( textHtml ).getTextNodeStyles();

											assert.strictEqual( altOverlayParsed.stringValue, altOverlayOriginal.stringValue, "Version 3.20 " + key + " html can be parsed into nodes, back to html, and back to nodes - stringValue" );	
											assert.strictEqual( altOverlayParsed.style, altOverlayOriginal.style, "Version 3.20 " + key + " html can be parsed into nodes, back to html, and back to nodes - style" );	
										}
									}
								}
							},

							"test setting text font family": function() {
								var textOverlay,
									testFontFamily = "FooFont-Regular,'FooFont'";

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );

										textOverlay.setFontFamily( testFontFamily );

										assert.strictEqual( textOverlay.getFontFamily(), testFontFamily, "Version 3.20 " + key + " font-family can be set" );
									}
								}
							},
							"test setting text font size": function() {
								var textOverlay,
									testFontSize = "48px";

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );

										textOverlay.setFontSize( testFontSize );

										assert.strictEqual( textOverlay.getFontSize(), testFontSize, "Version 3.20 " + key + " font-size can be set" );
									}
								}
							},
							"test setting text line height": function() {
								var textOverlay,
									testLineHeight = "57px";

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );

										textOverlay.setLineHeight( testLineHeight );

										assert.strictEqual( textOverlay.getLineHeight(), testLineHeight, "Version 3.20 " + key + " line-height can be set" );
									}
								}
							},
							"test setting text letter spacing": function() {
								var textOverlay,
									testLetterSpacing = "5px";

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );

										textOverlay.setLetterSpacing( testLetterSpacing );

										assert.strictEqual( textOverlay.getLetterSpacing(), testLetterSpacing, "Version 3.20 " + key + " letter-spacing can be set" );
									}
								}
							},
							"test setting text alignment": function() {
								var textOverlay,
									testTextAlign = "FooFont-Regular,'FooFont'";

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );

										textOverlay.setTextAlign( testTextAlign );

										assert.strictEqual( textOverlay.getTextAlign(), testTextAlign, "Version 3.20 " + key + " text-align can be set" );
									}
								}
							},
							"test setting text color": function() {
								var textOverlay,
									testColor = "#FF00FF";

								for( var key in ver_3200 ) {
									if( key !== "value" ) {
										textOverlay = cs.make( "text_complex" ).setTextHtml( ver_3200[ key ] );

										textOverlay.setColor( testColor );

										assert.strictEqual( textOverlay.getColor(), testColor, "Version 3.20 " + key + " color can be set" );
									}
								}
							}
						}
					};
				} )()
			},
			// "test making new page": {},
			"test adding overlay to CS": function() {
				assert.ok( typeof cs.appendOverlay === "function", "'cs.appendOverlay' exists" );
			},
			"test adding page to CS": function() {
				assert.ok( typeof cs.appendPage === "function", "'cs.appendPage' exists" );
			},
			"test getting pageset by id": function() {
				assert.ok( typeof cs.getPageSet === "function", "'cs.getPageSet' exists" );
			},
			"test getting page by id": function() {
				assert.ok( typeof cs.getPage === "function", "'cs.getPage' exists" );
			},
			"test getting overlay by id": function() {
				assert.ok( typeof cs.getOverlay === "function", "'cs.getOverlay' exists" );
			},
			"test getting type of overlay": function() {
				assert.ok( typeof cs.typeofOverlay === "function", "'cs.typeofOverlay' exists" );
			}
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
				assert.ok( View.instanceOf( util.Object ), "View is extended from util.Object" );
			},
			"test instance of View": function() {
				assert.ok( !!view.context, "instance can access plugin context object" );
				assert.ok( !!view.doc, "instance can access plugin document" );
				assert.ok( !!view.plugin, "instance can access plugin plugin" );
				assert.ok( !!view.selection, "instance can access plugin selection" );
				assert.ok( !!view.command, "instance can access plugin command" );
			},
			// "test wrapping layers": ( function() {
			// 	// Make views

			// 	return {
			// 		"test access to layer": function() {},
			// 		"test access to layer id": function() {},
			// 		"test access to layer name": function() {},
			// 		"test access to layer class name": function() {},
			// 		"test if layer has children": function() {},
			// 		"test if layer has a clipping mask": function() {},
			// 		"test access to view parent": function() {},

			// 		"test access to layer parent": function() {},
			// 		"test get layer kind": function() {},
			// 		"test check if artboard": function() {},
			// 		"test check if layer": function() {},
			// 		"test check if layer group or artboard": function() {},
			// 		"test check if view should be ignored": function() {},
			// 		"test check if view should be flattened": function() {},
			// 		"test check if view should be extracted": function() {},
			// 		"test check if view should not be traversed": function() {},
			// 		"test check if layer name begins with...": function() {},
			// 		"test check if layer name ends with...": function() {},
					
			// 		"test get sanitized layer name": function() {},
			// 		"test get layer name attributes": function() {},
			// 		"test add layer name attribute": function() {},
			// 		"test clear layer name attributes": function() {},
					
			// 		"test get data attached to layer": function() {},
			// 		"test set data attached to layer": function() {},
			// 		"test clear data attached to layer": function() {},
			// 		"test get Content Spec attached to layer": function() {},
			// 		"test set Content Spec attached to layer": function() {},
			// 		"test clear Content Spec attached to layer": function() {},

			// 		"test get layer artboard": function() {},
			// 		"test get layer artboard size": function() {},
			// 		"test check if layer has children": function() {},
			// 		"test get layer children": function() {},
					
			// 		"test disable layer hidden attribute": function() {},
			// 		"test enable layer hidden attribute": function() {},
			// 		"test check if layer is hidden": function() {},
			// 		"test check if layer has hidden children": function() {},
					
			// 		"test disable layer mask attribute": function() {},
			// 		"test enable layer mask attribute": function() {},
			// 		"test check if layer is a clipping mask": function() {},
			// 		"test check if clipping mask view should be extracted": function() {},
			// 		"test check if layer has a clipping mask": function() {},
			// 		"test get layer clipping mask": function() {},
					
			// 		"test get layer layout relative to another layer": function() {},
			// 		"test get layer layout including styles": function() {},
			// 		"test get layer layout without styles": function() {},
			// 		"test get layer absolute layout": function() {},

			// 		"test get border styles": function() {},
			// 		"test get shadow styles": function() {},
			// 		"test duplicate layer": function() {},
			// 		"test remove layer from parent": function() {}
			// 	};
			// } )()
		};
	} )( View.create( context ) );

	/**
		* @desc ViewBindingController testing
	*/
	suite[ "test ViewBindingController script" ] = ( function( viewBindingControl ) {
		return {
			"test layer binding registry": function() {
				assert.ok( typeof viewBindingControl.layerKindRegistry === "function", "'viewBindingControl.layerKindRegistry' exists" );

				// accessing registered bindings
			},
			"test layer name binding registry": function() {
				assert.ok( typeof viewBindingControl.bindingRegistry === "function", "'viewBindingControl.bindingRegistry' exists" );

				// access registered bindings
			},
			"test apply bindings to layers": function() {
				assert.ok( typeof viewBindingControl.applyBindings === "function", "'viewBindingControl.applyBindings' exists" );
			}
		};
	} )( new ViewBindingController() );
	
	test.runAll( suite );

	endDate = new Date();
	log( "##### Ended | " + endDate.toLocaleTimeString() + " | " + ( endDate.getTime() - startDate.getTime() ) + " ms #####" );
	context.document.showMessage( "Ended" );
}

