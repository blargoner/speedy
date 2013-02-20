/**
 * Speedy
 *
 * Speedy measures the speed of an internet connection at regular intervals and
 * logs the measurements to a file. It is useful for keeping internet service
 * providers honest.
 *
 * Requirements: phantomjs
 *
 * Usage: phantomjs speedy.js [interval (minutes)] [download test log file]
 *
 * Speedy uses the SpeedOf.Me service for speed testing.
 *
 * WARNING: USE OF SPEEDY MAY OR MAY NOT CONSTITUTE A VIOLATION OF THE TERMS OF
 *          THE SPEEDOF.ME SERVICE. PLEASE CONSULT THE TERMS OF SERVICE WITH
 *          QUALIFIED LEGAL COUNSEL PRIOR TO USE. THE AUTHORS OF SPEEDY ASSUME
 *          NO LIABILITY FOR ITS USE.
 *
 * @author John Peloquin
 * @copyright Copyright (c) 2013 John Peloquin. All rights reserved.
 */

var system = require('system'),
    speedy = require('./modules/speedy.js');

var args = system.args;

if(args.length !== 3) {
    console.log('Usage: phantomjs speedy.js [interval (minutes)] [download test log file]');
    phantom.exit();
}

speedy.start(parseInt(args[1], 10), args[2]);
