/**
 * Speedy
 *
 * This script measures the speed of an internet connection at regular intervals
 * and logs the measurements to a file.
 *
 * Usage: phantomjs speedy-logger.js [interval in minutes] [log file path]
 *
 * @author John Peloquin
 * @copyright Copyright (c) 2013 John Peloquin. All rights reserved.
 */

var system = require('system'),
    logger = require('./modules/speedy-logger.js').create();

var args = system.args;

if(args.length !== 3) {
    console.log('Usage: phantomjs speedy-logger.js [interval (minutes)] [log file]');
    phantom.exit();
}

var _onInitSuccess = function() {
    var file = args[2],
        delay = parseInt(args[1], 10) * 60 * 1000;

    console.log('Successfully initialized.');
    console.log('Starting testing...');
    logger.start(file, delay, _onTestStart, _onTestSuccess, _onTestError);
};

var _onInitError = function(code) {
    console.error('Error initializing.');
    console.log('Exiting...');
    logger.destroy();
    phantom.exit();
};

var _onTestStart = function() {
    console.log('Starting test...');
};

var _onTestSuccess = function(data) {
    console.log('Successfully tested.');
    console.log('Logged download speed to file: ' + data.download.speed.toFixed(2) + 'Mbps');
    console.log('Continuing testing...');
};

var _onTestError = function(code) {
    console.error('Error testing.');
    console.log('Continuing testing...');
};

console.log('Initializing...');
logger.initialize(_onInitSuccess, _onInitError);
