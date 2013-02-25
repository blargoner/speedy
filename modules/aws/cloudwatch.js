/**
 * AWS CloudWatch API client
 *
 * @author John Peloquin
 * @copyright (c) 2013 John Peloquin. All rights reserved.
 */

/**
 * Constants
 */
var METHOD = 'GET',
    PROTOCOL = 'https',
    HOST = 'monitoring.amazonaws.com',
    PATH = '/',
    VERSION = '2010-08-01';

/**
 * Modules
 */
var Parametrizer = require('./util/parametrizer.js'),
    Signer = require('./util/signer.js'),
    Webpage = require('webpage');

/**
 * Parametrizes request data.
 *
 * @param {String} action action name
 * @param {Object} data data
 * @return {Object} parametrized data
 */
var _parametrize = function(action, data) {
    data.Action = action;
    data.Version = VERSION;
    return Parametrizer.parametrize(data);
};

/**
 * Signs parametrized request data.
 *
 * @param {Object} data parametrized data
 * @param {Object} signer signer instance
 * @return {Object} signed data
 */
var _sign = function(data, signer) {
    return signer.sign(data, (new Date()), {
        'verb': METHOD,
        'host': HOST,
        'uriPath': PATH
    });
};

/**
 * Serializes parameters.
 *
 * @param {Object} params parameters
 * @return {String} parameter string
 */
var _serialize = function(params) {
    var parts = [],
        k, v;

    for(k in params) {
        if(params.hasOwnProperty(k)) {
            v = params[k];
            parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }
    }

    return parts.join('&');
};

/**
 * Gets API URL.
 *
 * @param {Object} params parameters
 * @return {String} URL
 */
var _url = function(params) {
    return PROTOCOL + '://' + HOST + PATH + '?' + _serialize(params);
};

/**
 * Requests API URL.
 *
 * The callback function will be called with the returned HTTP status and content.
 *
 * @param {String} url URL
 * @param {Function} callback callback function
 */
var _request = function(url, callback) {
    var page = Webpage.create();
    page.open(url, function(status) {
        var content = page.content;
        page.close();
        page = null;
        callback(status, content);
    });
};

/**
 * Requests API action.
 *
 * @param {String} action action name
 * @param {Object} data data
 * @param {Object} signer signer instance
 * @param {Function} callback callback function
 */
var _do = function(action, data, signer, callback) {
    _request(_url(_sign(_parametrize(action, data), signer)), callback);
};

/**
 * Creates an instance of the CloudWatch API client.
 *
 * @param {String} accessKey AWS access key
 * @param {String} secretKey AWS secret key
 * @return {Object} client instance
 */
exports.create = function(accessKey, secretKey) {
    var signer = new Signer.AWSV2Signer(accessKey, secretKey);

    return {
        /**
         * Puts metric data.
         *
         * The data must be structured appropriately for the PutMetricData API
         * call. The callback function will be called with the returned HTTP
         * status and content.
         *
         * Example data:
         *
         * {
         *     Namespace: "Speed"
         *     MetricData: [
         *         {
         *             MetricName: "Download",
         *             Value: 50.0,
         *             Unit: "Megabits/Second",
         *             Dimensions: [
         *                 {
         *                     Name: "Id",
         *                     Value: "Home"
         *                 }
         *             ]
         *         }
         *     ]
         * }
         *
         * @param {Object} data data
         * @param {Function} callback callback function
         */
        putMetricData: function(data, callback) {
            _do('PutMetricData', data, signer, callback);
        },

        /**
         * Destroys.
         */
        destroy: function() {
            signer = null;
        }
    };
};
