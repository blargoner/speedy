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

var TEST_INTERVAL_MIN = 1 * 60 * 1000;

var POLLING_INTERVAL = 1 * 1000,
    POLLING_LIMIT = 60;

var STATUS_ACCESSING            = 'Accessing speed test service...',
    STATUS_STARTING_TESTS       = 'Starting tests (will run until interrupted)...',
    STATUS_STARTING_TEST        = 'Starting test...',
    STATUS_POLLING              = 'Waiting for test results...',
    STATUS_LOGGED               = 'Logged test results.';

var ERROR                       = 'Error: ',
    ERROR_TEST_INTERVAL_MIN     = 'Test interval too small.',
    ERROR_TEST_SERVICE_FAIL     = 'Unable to access speed test service.',
    ERROR_DOWNLOAD_FILE_FAIL    = 'Unable to access download log file.',
    ERROR_DOWNLOAD_HISTORY      = 'Invalid download test results.',
    ERROR_POLLING_LIMIT         = 'Timed out waiting for test results.';

/**
 * Modules
 */
var fs = require('fs'),
    webpage = require('webpage');

/**
 * Prints a message to the console.
 *
 * @param {String} message message
 */
var _print = function(message) {
    console.log(message);
};

/**
 * Prints an errror message to the console.
 *
 * @param {String} message error message
 */
var _error = function(message) {
    console.error(ERROR + message);
};

/**
 * Prints an error message to the console and exits.
 *
 * @param {String} message error message
 */
var _die = function(message) {
    _error(message);
    phantom.exit();
};

/**
 * Determines whether data point history changed.
 *
 * @param {Object} old old history
 * @param {Object} now current history
 * @return {Boolean} true if changed, false otherwise
 */
var _changed = function(old, now) {
    return (old.length === 1 && now.length === 1 && old[0][1] === 0 && now[0][1] !== 0) || old.length !== now.length;
};

/**
 * Logs a data point to a file stream.
 *
 * Each data point is logged as a line of text in the following form:
 *
 * t_i,s_i
 *
 * where t_i is a timestamp (as an integer number of milliseconds since the epoch)
 * and s_i is the measured speed at t_i in Mbps.
 *
 * @param {Object} stream steam
 * @param {Array} point data point
 */
var _log = function(stream, point) {
    var timestamp = point[0].toString(),
        speed = point[1].toFixed(2);

    stream.writeLine([timestamp, speed].join(','));
    stream.flush();
};

/**
 * Gets download speed test history on page.
 *
 * The returned array has structure [..., [t_i, s_i], ...], where for each i,
 * t_i is a timestamp (as an integer number of milliseconds since the epoch) and
 * s_i is the measured downstream speed at t_i in Mbps (as a float).
 *
 * @param {Object} page page object
 * @return {Array} downstream speed test history
 */
var _getPageDownloadHistory = function(page) {
    return page.evaluate(function() {
        return downloadHistory;
    });
};

/**
 * Starts speed test on page.
 *
 * @param {Object} page page object
 */
var _startPageTest = function(page) {
    _print(STATUS_STARTING_TEST);

    page.evaluate(function() {
        startTest();
    });
};

/**
 * Starts speed tests on a page.
 *
 * @param {Object} page page object
 * @param {Integer} interval interval (ms)
 * @param {Object} downStream download log file stream
 */
var _startPageTests = function(page, interval, downStream) {
    _print(STATUS_STARTING_TESTS);

    var downloadHistory = _getPageDownloadHistory(page);

    if(!downloadHistory) {
        _die(ERROR_DOWNLOAD_HISTORY);
    }

    (function test() {
        var pollCount = 0;

        _startPageTest(page);

        _print(STATUS_POLLING);

        (function poll() {
            var downloadHistoryNow = _getPageDownloadHistory(page);

            if(!downloadHistoryNow || downloadHistoryNow.length < downloadHistory.length) {
                _die(ERROR_DOWNLOAD_HISTORY);
            }

            if(_changed(downloadHistory, downloadHistoryNow)) {
                downloadHistory = downloadHistoryNow;

                _log(downStream, downloadHistory[downloadHistory.length - 1]);
                _print(STATUS_LOGGED);

                return;
            }

            pollCount++;
            if(pollCount >= POLLING_LIMIT) {
                _error(ERROR_POLLING_LIMIT);
                return;
            }

            setTimeout(poll, POLLING_INTERVAL);

        }());

        setTimeout(test, interval);

    }());
};

/**
 * Starts speed tests.
 *
 * @param {Integer} interval interval (ms)
 * @param {String} downFile download log file
 */
var _start = function(interval, downFile) {
    var page, downStream;

    if(interval < TEST_INTERVAL_MIN) {
        _die(ERROR_TEST_INTERVAL_MIN);
    }

    downStream = fs.open(downFile, 'a');
    if(!downStream) {
        _die(ERROR_DOWNLOAD_FILE_FAIL);
    }

    _print(STATUS_ACCESSING);

    page = webpage.create();

    page.onError = function() {};

    page.open(SPEED_OF_ME, function(status) {
        if(status !== 'success') {
            _die(ERROR_TEST_SERVICE_FAIL);
        }

        _startPageTests(page, interval, downStream);
    });
};

/**
 * Starts speed tests.
 *
 * @param {Integer} interval interval (minutes)
 * @param {String} downFile download log file
 */
exports.start = function(interval, downFile) {
    _start(60 * 1000 * interval, downFile);
};
