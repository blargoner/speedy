/**
 * AWS parametrizer
 *
 * @author John Peloquin
 * @copyright Copyright (c) 2013 John Peloquin. All rights reserved.
 */

/**
 * Recursively parametrizes an object.
 *
 * @param {Object} input input object
 * @param {Object} output output object
 * @param {String} prefix current prefix
 */
var _parametrize = function(input, output, prefix) {
    var k, p, v;
    for(k in input) {
        if(input.hasOwnProperty(k)) {
            p = prefix + k;
            v = input[k];

            if(v === undefined || v === null) {
                continue;
            }
            else if(typeof v === "boolean" || typeof v === "number" || typeof v === "string") {
                output[p] = v.toString();
            }
            else if(v instanceof Array) {
                v.forEach(function(e, i) {
                    _parametrize(e, output, p + '.member.' + (i+1) + '.');
                });
            }
            else {
                _parametrize(v, output, p + '.');
            }
        }
    }
};

/**
 * Returns a parametrization of a simple object, suitable for serialization into
 * parameters for an AWS API request.
 *
 * The input object must be "simple" in that it consists of key/value pairs each
 * of whose values is either a primitive (undefined, null, boolean, number, or
 * string), a simple object, or an array of simple objects; and it contains no
 * circular references. Undefined and null values are ignored.
 *
 * Example:
 *
 * Input:
 * {
 *     "boolean": true, 
 *     "object": {
 *         "integer": 1,
 *         "string": "foo"
 *     },
 *     "array": [
 *         { "float": 123.45 },
 *         { "boolean": false }
 *     ],
 *     "null": null
 * }
 *
 * Output:
 * {
 *     "boolean": "true",
 *     "object.integer": "1",
 *     "object.string": "foo",
 *     "array.member.1.float": "123.45",
 *     "array.member.2.boolean": "false"
 * } 
 *
 * @param {Object} input input object
 * @return {Object} output object
 */
exports.parametrize = function(input) {
    var output = {};
    _parametrize(input, output, '');
    return output;
};
