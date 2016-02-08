// Adapted from https://github.com/alexyoung/turing-test.js

var console = typeof log != "undefined" ? {
        log: log
    } : console;

var assert = ( function() {
    var assert = {
        fail: fail,

        ok: function( value, message ) {
            if ( !!!value ) {
                fail( value, true, message, "==", this.ok );
            }
        },

        equal: function( actual, expected, message ) {
            if ( actual != expected ) {
                fail( actual, expected, message, "==", this.equal );
            }
        },

        notEqual: function( actual, expected, message ) {
            if ( actual == expected ) {
                fail( actual, expected, message, "!=", this.equal );
            }
        },

        strictEqual: function( actual, expected, message ) {
            if ( actual !== expected ) {
                fail( actual, expected, message, "===", this.equal );
            }
        },

        notStrictEqual: function( actual, expected, message ) {
            if ( actual === expected ) {
                fail( actual, expected, message, "!==", this.equal );
            }
        },

        deepEqual: function( actual, expected, message ) {
            if ( !deepEqual( actual, expected ) ) {
                fail( actual, expected, message, "deepEqual", this.equal );
            }
        },

        notDeepEqual: function( actual, expected, message ) {
            if ( deepEqual( actual, expected ) ) {
                fail( actual, expected, message, "notDeepEqual", this.equal );
            }
        },

        throws: function( block, error, message ) {
            throws.apply( this, [ true ].concat( Array.prototype.slice.call( arguments ) ) );
        },

        doesNotThrow: function( block, error, message ) {
            throws.apply( this, [ false ].concat( Array.prototype.slice.call( arguments ) ) );
        },

        AssertionError: AssertionError
    };

    function AssertionError(  options  ) {
        var stackStartFunction = options.stackStartFunction || fail;

        this.name = "AssertionError";
        this.message = options.message;
        this.actual = options.actual;
        this.expected = options.expected;
        this.operator = options.operator;
    }

    AssertionError.prototype.summary = function() {
        return this.name + ( this.message ? ": " + this.message : "" );
    };

    AssertionError.prototype.details = function() {
        return "In '" + this.operator + "':\n\tExpected: " + this.expected + "\n\tFound: " + this.actual;
    };

    AssertionError.prototype.toString = function() {
        return this.summary() + "\n" + this.details();
    };

    function fail( actual, expected, message, operator, stackStartFunction ) {
        throw new AssertionError( {
            message: message,
            actual: actual,
            expected: expected,
            operator: operator,
            stackStartFunction: stackStartFunction
        } );
    }

    function deepEqual( actual, expected ) {
        if ( actual === expected ) {
            return true;
        } else if ( actual instanceof Date && expected instanceof Date ) {
            return actual.getTime() === expected.getTime();
        } else if ( typeof actual != "object" && typeof expected != "object" ) {
            return actual == expected;
        } else {
            return objEquiv( actual, expected );
        }
    }

    function isUndefinedOrNull( value ) {
        return value === null || value === undefined;
    }

    function isArguments( object ) {
        return Object.prototype.toString.call( object ) == "[object Arguments]";
    }

    function objKeys( o ) {
        var result = []
            isCocoa = ( o.hasOwnProperty && o.class ) ? false : true;

        for ( var name in o ) {
            if( isCocoa ) {
                result.push( name );
            } else if ( o.hasOwnProperty( name ) ) {
                result.push( name );
            }
        }
        return result;
    }

    function objEquiv( a, b ) {
        if ( isUndefinedOrNull( a ) || isUndefinedOrNull( b ) )
            return false;

        if ( a.prototype !== b.prototype ) { return false; }
        if ( isArguments( a ) ) {
            if ( !isArguments( b ) ) {
                return false;
            }
            a = Array.prototype.slice.call( a );
            b = Array.prototype.slice.call( b );
            return deepEqual( a, b );
        }

        try {
            var ka = objKeys( a ),
                kb = objKeys( b ),
                key, i;
        } catch ( e ) {
            console.log( [ a, b ].map( function( i ) { return i.toString() } ).join( "\n" ) );
            console.log( e );
            
            return false;
        }

        if ( ka.length !== kb.length ) {
            return false;
        }

        ka.sort();
        kb.sort();

        for ( i = ka.length - 1; i >= 0; i-- ) {
            if ( ka[ i ] != kb[ i ] ) {
                return false;
            }
        }

        for ( i = ka.length - 1; i >= 0; i-- ) {
            key = ka[ i ];
            if ( !deepEqual( a[ key ], b[ key ]  ) ) {
                return false;
            }
        }

        return true;
    }

    function throws( expected, block, error, message ) {
        var exception,
            actual = false,
            operator = expected ? "throws" : "doesNotThrow";
            callee = expected ? this.throws : this.doesNotThrow;

        if ( typeof error === "string" && !message ) {
            message = error;
            error = null;
        }

        message = message || "";

        try {
            block();
        } catch ( e ) {
            actual = true;
            exception = e;
        }

        if ( expected && !actual ) {
            fail( ( exception || Error ), ( error || Error ), "Exception was not thrown\n" + message, operator, callee ); 
        } else if ( !expected && actual ) {
            fail( ( exception || Error ), null, "Unexpected exception was thrown\n" + message, operator, callee ); 
        } else if ( expected && actual && error && exception.constructor != error ) {
            fail( ( exception || Error ), null, "Unexpected exception was thrown\n" + message, operator, callee ); 
        }
    };

    return assert;
} )();

var test = ( function() {
    var colorize = false,
        printMessage = ( function() {
            function htmlEntityToUTF( text ) {
                switch ( text ) {
                    case "&#10005;":
                        return "\u2715";
                    break;

                    case "&#10003;":
                        return "\u2713";
                    break;

                    case "&#9760;":
                        return "\u2620";
                    break;
                }
                return text;
            }

            function messageTypeToColor( messageType ) {
                switch ( messageType ) {
                    case "pass":
                        return "32";
                    break;

                    case "fail":
                        return "31";
                    break;
                }

                return "";
            }

            if ( typeof console !== "undefined" ) {
                return function( message, messageType, prefix ) {
                    var col = colorize ? messageTypeToColor( messageType ) : false;
                              startCol = col ? "\033[" + col + "m" : "",
                              endCol   = col ? "\033[0m" : "",
                    console.log( startCol + ( prefix ? htmlEntityToUTF( prefix ) + " " : "" ) + message + endCol );
                };
            } else {
                return function() {};
            }
        } )(),

        logger = {
            display: function( message, className, prefix ) {
                printMessage( message, className || "trace", prefix || "" );
            },

            error: function( message ) {
                this.display( message, "error", "&#9760;" );
            },

            pass: function( message ) {
                this.display( message, "pass", "&#10003;" );
            },

            fail: function( message ) {
                this.display( message, "fail", "&#10005;" );
            }
        },

        Tests = {
            results: [],
            passed: 0,
            failed: 0,
            errors: 0,

            Result: function( testName ) {
                return { name: testName, message: null };
            },

            run: function( testName, obj ) {
                var result = new Tests.Result( testName );

                function showException( e ) {
                    if ( !!e.stack ) {
                        logger.display( e.stack );
                    } else {
                        logger.display( e );
                    }
                }

                if ( typeof obj[ testName ] === "object" ) {
                    logger.display( "Running: " + testName );
                    return run( obj[ testName ] );
                }

                try {
                    // TODO: Setup
                    obj[ testName ]();
                    this.passed += 1;
                    logger.pass( testName );
                } catch ( e ) {
                    if ( e.name === "AssertionError" ) {
                        result.message = e.toString();
                        logger.fail( "Assertion failed in: " + testName );
                        showException( e );
                        this.failed += 1;
                    } else {
                        logger.error( "Error in: " + testName );
                        showException( e );
                        this.errors += 1;
                    }
                } finally {
                    // TODO: Teardown
                }

                this.results.push( result );
            },

            report: function() {
                logger.display( " " );
                logger.display( "Report:", "header" );
                logger.pass( "Passed: " + this.passed );
                logger.fail( "Failed: " + this.failed );
                logger.error( "Errors: " + this.errors );
            },

            runAll: function( tests ) {
                    run( tests );
                    Tests.report();
            }
        };

    function run( obj ) {
        for ( var testName in obj ) {
            if (testName.match(/^test/i)) {
                Tests.run( testName, obj );
            }
        }
    }

    return {
        run: run,
        runAll: Tests.runAll
    };
} )();

// Example
// test.run( {
//     testEqual: function() {
//         assert.equal( true, true, "True should be true" );
//     },

//     testAGroupOfThings: {
//         testOK: function() {
//             assert.ok( "I'm OK!", "If you're OK you're OK, OK?" );
//         }
//     }
// } );

// assert tests
test.run( {
    "test equal": function() {
        assert.equal( true, true, "True should be true" );
    },

    "test ok": function() {
        assert.ok( true, "True should be OK" );
    },

    "test strictEqual": function() {
        assert.strictEqual( "1", "1", "'1' should be equal to '1'" );
        assert.strictEqual( 1, 1, "1 should be equal to 1" );
    },

    "test notStrictEqual": function() {
        assert.notStrictEqual( 1, "1" );
        assert.notStrictEqual( "1", 1 );
    },

    "test deepEqual": function() {
        assert.deepEqual( 1, 1 );
        assert.deepEqual( "1", "1" );
        assert.deepEqual( new Date( 1 ), new Date( 1 ) );
        assert.deepEqual( [ 1, 2, 3 ], [ 1, 2, 3 ] );
        assert.deepEqual(
            [ [ 3, 2, 1 ], 2, [ 1, 2, 3 ] ],
            [ [ 3, 2, 1 ], 2, [ 1, 2, 3 ] ]
         );
        assert.deepEqual(
            { name: "Alex", position: "Expert Button Pusher" },
            { name: "Alex", position: "Expert Button Pusher" }
         );
    },

    "test notDeepEqual": function() {
        assert.notDeepEqual( 1, 2 );
        assert.notDeepEqual( "1", "2" );
        assert.notDeepEqual( new Date( 1 ), new Date( 2 ) );
        assert.notDeepEqual( [ 1, 2, 3 ], [ 3, 2, 1 ] );
        assert.notDeepEqual(
            [ [ 3, 2, 1 ], 2, [ 1, 2, 3 ] ],
            [ [ 3, 2, 1 ], 2, [ 1, 2, 1 ] ]
         );
        assert.notDeepEqual(
            { name: "Alex", position: "Expert Button Pusher" },
            { name: "Mike", position: "Expert Button Pusher" }
         );
    },

    "test throws": function() {
        assert.throws( function() {
            throw "This is an exception";
        } );

        function CustomException() {
            this.message = "Custom excpetion";
            this.name = "CustomException";
        }

        assert.throws( function() {
            throw new CustomException();
        }, CustomException );

        assert.throws( function() {
            throw new CustomException();
        }, CustomException, "This is an error" );
    },

    "test doesNotThrow": function() {
        assert.doesNotThrow( function() {
            return true;
        }, "this is a message" );

        assert.throws( function() {
            throw "This is an exception";
        }, "this is a message" );
    }
} );