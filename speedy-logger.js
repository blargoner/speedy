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

/**
 * Modules
 */
var System = require('system'),
    Filesystem = require('fs'),
    Speedy = require('./modules/speedy-looper.js');

/**
 * Variables
 */
var args = System.args,
    delay,
    file,
    stream,
    speedy;

/**
 * Functions
 */
var _log = function(data) {
    var download = data.download;
    stream.writeLine([download.time.toString(), download.speed.toFixed(2)].join(','));
    stream.flush();
};

var _onInitSuccess = function() {
    console.log('Successfully initialized.');
    console.log('Starting testing...');
    speedy.start(delay, _onTestStart, _onTestSuccess, _onTestError);
};

var _onInitError = function(code) {
    console.error('Error initializing.');
    console.log('Exiting...');
    speedy.destroy();
    phantom.exit();
};

var _onTestStart = function() {
    console.log('Starting test...');
};

var _onTestSuccess = function(data) {
    _log(data);
    console.log('Successfully tested.');
    console.log('Logged download speed to file: ' + data.download.speed.toFixed(2) + 'Mbps');
    console.log('Continuing testing...');
};

var _onTestError = function(code) {
    console.error('Error testing.');
    console.log('Continuing testing...');
};

/**
 * Main
 */
if(args.length !== 3) {
    console.log('Usage: phantomjs speedy-logger.js [interval (minutes)] [log file]');
    phantom.exit();
}

console.log('Initializing...');

delay = parseInt(args[1], 10) * 60 * 1000;
file = args[2];
stream = Filesystem.open(file, 'a');

if(!stream) {
    console.error('Error opening log file.');
    phantom.exit();
}

speedy = Speedy.create();
speedy.initialize(_onInitSuccess, _onInitError);
