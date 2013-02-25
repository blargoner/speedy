/**
 * Speedy logger
 *
 * @author John Peloquin
 * @copyright Copyright (c) 2013 John Peloquin. All rights reserved.
 */

/**
 * Constants
 */
var ERROR_FILE = 'file';

/**
 * Modules
 */
var Filesystem = require('fs'),
    SpeedyLooper = require('./speedy-looper.js');

/**
 * Returns the composite of two unary functions.
 *
 * @param {Function} f outer function
 * @param {Function} g inner function
 * @return {Function} the composite f of g
 */
var _composite = function(f, g) {
    return function(x) {
        return f(g(x));
    };
};

/**
 * Returns a logger function.
 *
 * The returned logger function logs speed test results data to the passed stream.
 *
 * @param {Object} stream log file stream
 * @return {Function} logger function
 */
var _logger = function(stream) {
    return function(data) {
        var download = data.download;
        stream.writeLine([download.time.toString(), download.speed.toFixed(2)].join(','));
        stream.flush();
        return data;
    };
};

exports.create = function() {
    var looper = SpeedyLooper.create(),
        logger = Object.create(looper),
        stream = null;

    logger.ERROR_FILE = ERROR_FILE;

    /**
     * Starts running a sequence of speed tests at regular intervals and logging
     * results to a file. See the start() method in the speedy-looper module for
     * details on the testing.
     *
     * Each test result is logged as a line of text in the following form:
     *
     * t_i,d_i
     *
     * where t_i is a timestamp (integer number of milliseconds since the epoch)
     * and d_i is the measured download speed at t_i in Mbps.
     *
     * @param {String} file log file path
     * @param {Number} delay delay between tests (milliseconds)
     * @param {Function} start start callback (optional)
     * @param {Function} success success callback (optional)
     * @param {Function} error error callback (optional)
     * @param {Number} timeout (milliseconds, default 60 seconds)
     */
    logger.start = function(file, delay, start, success, error, timeout) {
        if(this.started()) {
            error(this.ERROR_REENTRY);
            return;
        }

        stream = Filesystem.open(file, 'a');

        if(!stream) {
            error(this.ERROR_FILE);
            return;
        }

        start = start || (function() {});
        success = success || (function() {});
        error = error || (function() {});

        looper.start(delay, start, _composite(success, _logger(stream)), error, timeout);
    };

    /**
     * Stops running a sequence of speed tests.
     */
    logger.stop = function() {
        if(!this.started()) {
            return;
        }

        looper.stop();

        stream.close();
        stream = null;
    };

    return logger;
};
