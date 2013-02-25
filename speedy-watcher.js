/**
 * Speedy
 *
 * This script measures the speed of an internet connection at regular intervals
 * and logs the measurements to Amazon CloudWatch.
 *
 * Usage: phantomjs speedy-watcher.js [interval (minutes)] [access key] [secret key] [namespace] [id]
 *
 * @author John Peloquin
 * @copyright Copyright (c) 2013 John Peloquin. All rights reserved.
 */

/**
 * Constants
 */
var DOWNLOAD_METRIC_NAME = 'Download',
    DOWNLOAD_METRIC_UNIT = 'Megabits/Second';

/**
 * Modules
 */
var System = require('system'),
    Cloudwatch = require('./modules/aws/cloudwatch.js'),
    Speedy = require('./modules/speedy-looper.js');

/**
 * Variables
 */
var args = System.args,
    delay,
    access,
    secret,
    namespace,
    id,
    cloudwatch,
    speedy;

/**
 * Functions
 */
var _onPutMetricData = function(status, content) {
    if(status === 'success') {
        console.log('Sent test results to CloudWatch. Received the following response:');
        console.log(content);
    }
    else {
        console.error('Error sending data to CloudWatch.');
    }

    console.log('Continuing testing...');
};

var _put = function(data) {
    cloudwatch.putMetricData({
        Namespace: namespace,
        MetricData: [
            {
                MetricName: DOWNLOAD_METRIC_NAME,
                Unit: DOWNLOAD_METRIC_UNIT,
                Value: data.download.speed,
                Timestamp: (new Date(data.download.time)).toISOString(),
                Dimensions: [
                    {
                        Name: 'Id',
                        Value: id
                    }
                ]
            }
        ]
    }, _onPutMetricData);
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
    speedy = null;
    cloudwatch.destroy();
    cloudwatch = null;
    phantom.exit();
};

var _onTestStart = function() {
    console.log('Starting test...');
};

var _onTestSuccess = function(data) {
    console.log('Successfully tested.');
    console.log('Sending test results to CloudWatch: ' + data.download.speed.toFixed(2) + 'Mbps download...');
    _put(data);
};

var _onTestError = function(code) {
    console.error('Error testing.');
    console.log('Continuing testing...');
};

/**
 * Main
 */
if(args.length !== 6) {
    console.log('Usage: phantomjs speedy-cloudwatch.js [interval (minutes)] [access key] [secret key] [namespace] [id]');
    phantom.exit();
}

console.log('Initializing...');

delay = parseInt(args[1], 10) * 60 * 1000;
access = args[2];
secret = args[3];
namespace = args[4];
id = args[5];

cloudwatch = Cloudwatch.create(access, secret);

speedy = Speedy.create();
speedy.initialize(_onInitSuccess, _onInitError);
