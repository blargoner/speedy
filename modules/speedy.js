/**
 * Speedy
 *
 * @author John Peloquin
 * @copyright Copyright (c) 2013 John Peloquin. All rights reserved.
 */

/**
 * Constants
 */
var SPEED_OF_ME = 'http://speedof.me';

var TIMEOUT_DEFAULT = 60 * 1000;

var POLL_DELAY = 1000;

var ERROR_REENTRY       = 'reentry',
    ERROR_SERVICE       = 'service',
    ERROR_DATA          = 'data',
    ERROR_TIMEOUT       = 'timeout';

/**
 * Modules
 */
var Webpage = require('webpage');

/**
 * Starts speed test on page.
 *
 * @param {Object} page page object
 */
var _startPageTest = function(page) {
    page.evaluate(function() {
        startTest();
    });
};

/**
 * Gets download speed test history from page.
 *
 * The returned array has structure [..., [t_i, s_i], ...], where for each i,
 * t_i is a timestamp (as an integer number of milliseconds since the epoch) and
 * s_i is the measured downstream speed at t_i in Mbps (as a float).
 *
 * @param {Object} page page object
 * @return {Array} downstream speed test history
 */
var _getPageDownloadHistory = function(page) {
    return page.evaluate(function () {
        return downloadHistory;
    });
};

/**
 * Determines whether there is new test history data.
 *
 * @param {Object} oldHistory old history
 * @param {Object} newHistory current history
 * @return {Boolean} true if there is new history, false otherwise
 */
var _isNewHistory = function(oldHistory, newHistory) {
    return (oldHistory.length === 1 && newHistory.length === 1
            && oldHistory[0][1] === 0 && newHistory[0][1] !== 0)
            || oldHistory.length < newHistory.length;
};

exports.create = function() {
    /**
     * Variables
     */
    var initializing = false,
        initialized = false,
        testing = false,
        page = null;

    return {
        /**
         * Method reentry.
         */
        ERROR_REENTRY:      ERROR_REENTRY,

        /**
         * Unable to connect to test service.
         */
        ERROR_SERVICE:      ERROR_SERVICE,

        /**
         * Unable to obtain test results data.
         */
        ERROR_DATA:         ERROR_DATA,

        /**
         * Unable to obtain test results data in time.
         */
        ERROR_TIMEOUT:      ERROR_TIMEOUT,

        /**
         * Initializes.
         *
         * Initialization is asynchronous. On success, the success callback will
         * be called. On error, the error callback will be called with an error
         * code.
         *
         * @param {Function} success success callback
         * @param {Function} error error callback
         */
        initialize: function(success, error) {
            var that = this;

            if(initializing || initialized) {
                error(this.ERROR_REENTRY);
                return;
            }

            initializing = true;
            page = Webpage.create();
            page.onError = function() {};

            page.open(SPEED_OF_ME, function(status) {
                if(status === 'success') {
                    initialized = true;
                    initializing = false;
                    success();
                }
                else {
                    initializing = false;
                    error(that.ERROR_SERVICE);
                }
           });
        },

        /**
         * Gets initializing state.
         *
         * @return {Boolean} whether initializing
         */
        initializing: function() {
            return initializing;
        },

        /**
         * Gets initialized state.
         *
         * @return {Boolean} whether initialized
         */
        initialized: function() {
            return initialized;
        },

        /**
         * Runs a speed test.
         *
         * Testing is asynchronous. On success, the success callback will be called
         * with the test results. On error, the error callback will be called with
         * an error code.
         *
         * Test results are provided in an object of the following form:
         *
         * {
         *     download: {              // download test results
         *         time: t_i            // time (integer milliseconds since epoch)
         *         speed: s_i           // speed (float Mbps)
         *     }
         * }
         *
         * At most one test can be run at a time.
         *
         * @param {Function} success success callback
         * @param {Function} error error callback
         * @param {Number} timeout timeout (milliseconds, default 60 seconds)
         */
        test: function(success, error, timeout) {
            var that = this,
                start,
                downloadHistory;

            if(!initialized || testing) {
                error(this.ERROR_REENTRY);
                return;
            }

            if(timeout === undefined) {
                timeout = TIMEOUT_DEFAULT;
            }

            testing = true;
            start = Date.now();
            downloadHistory = _getPageDownloadHistory(page);

            if(!downloadHistory) {
                testing = false;
                error(this.ERROR_DATA);
                return;
            }

            _startPageTest(page);

            setTimeout(function poll() {
                var now = Date.now(),
                    downloadHistoryNow = _getPageDownloadHistory(page),
                    data;

                if(!downloadHistoryNow) {
                    testing = false;
                    error(that.ERROR_DATA);
                    return;
                }

                if(_isNewHistory(downloadHistory, downloadHistoryNow)) {
                    data = downloadHistoryNow[downloadHistoryNow.length - 1];
                    testing = false;

                    success({
                        download: {
                            time: data[0],
                            speed: data[1]
                        }
                    });

                    return;
                }

                if(now - start >= timeout) {
                    testing = false;
                    error(that.ERROR_TIMEOUT);
                    return;
                }

                setTimeout(poll, POLL_DELAY);

            }, POLL_DELAY);
        },

        /**
         * Gets testing state.
         *
         * @return {Boolean} whether testing
         */
        testing: function() {
            return testing;
        },

        /**
         * Destroys.
         */
        destroy: function() {
            if(!initialized) {
                return;
            }

            initialized = false;
            page.close();
            page = null;
        }
    };
};
