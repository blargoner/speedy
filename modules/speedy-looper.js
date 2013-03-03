/**
 * Speedy looper
 *
 * @author John Peloquin
 * @copyright Copyright (c) 2013 John Peloquin. All rights reserved.
 */

/**
 * Modules
 */
var Speedy = require('./speedy.js');

exports.create = function() {
    /**
     * Variables
     */
    var speedy = Speedy.create(),
        looper = Object.create(speedy),
        looping = false,
        id = null;

    /**
     * Starts running a sequence of speed tests at regular intervals.
     *
     * Tests are run asynchronously. Before each test is started, the start
     * callback is called. After each successful test, the success callback is
     * called with the test results for that test. After each error, the error
     * callback is called with an error code. See the test() method in the
     * speedy module for details on the success and error callback data.
     *
     * Tests are run indefinitely until stopped with stop(). Testing does not
     * stop when an error occurs for a test.
     *
     * At most one sequence of tests can be run at a time.
     *
     * @param {Number} delay delay between tests (milliseconds)
     * @param {Function} start start callback
     * @param {Function} success success callback
     * @param {Function} error error callback
     * @param {Number} timeout (milliseconds, default 60 seconds)
     */
    looper.start = function(delay, start, success, error, timeout) {
        var that = this;

        if(looping) {
            error(this.ERROR_REENTRY);
        }

        looping = true;

        (function test() {
            start();
            that.test(success, error, timeout);
            id = setTimeout(test, delay);
        }());
    };

    /**
     * Gets looping state.
     *
     * @return {Boolean} whether looping
     */
    looper.looping = function() {
        return looping;
    };

    /**
     * Gets started state.
     *
     * @return {Boolean} whether started
     */
    looper.started = looper.looping;

    /**
     * Stops a sequence of speed tests.
     */
    looper.stop = function() {
        if(!looping) {
            return;
        }

        clearTimeout(id);
        id = null;
        looping = false;
    };

    /**
     * Destroys.
     */
    looper.destroy = function() {
        this.stop();
        speedy.destroy();
    };

    return looper;
};
