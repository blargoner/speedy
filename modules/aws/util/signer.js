/**
 * AWS signer
 *
 * Copyright 2007 Amazon Elena@AWS
 * http://aws.amazon.com/code/developertools/1137
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Massaged for use with PhantomJS by John Peloquin.
 */
var Sha1 = require('./sha1.js');

function AWSSigner(accessKeyId, secretKey) {
    this.accessKeyId = accessKeyId;
    this.secretKey = secretKey;
}

AWSSigner.prototype.sign = function (params, time, requestInfo) {
    var timeUtc = time.toISOString();
    params = this.addFields(params, timeUtc);
    params.Signature = this.generateSignature(this.canonicalize(params, requestInfo));
    return params;
}

AWSSigner.prototype.addFields = function (params, time) {
    params.AWSAccessKeyId = this.accessKeyId;
    params.SignatureVersion = this.version;
    params.SignatureMethod = "HmacSHA1";
    params.Timestamp = time;
    return params;
}

AWSSigner.prototype.generateSignature = function (str) {
    return Sha1.b64_hmac_sha1(this.secretKey, str);
}

AWSV2Signer.prototype = new AWSSigner();

function AWSV2Signer(accessKeyId, secretKey) {
    AWSSigner.call(this, accessKeyId, secretKey);
    this.version = 2;
}

AWSV2Signer.prototype.canonicalize = function (params, requestInfo) {
    var verb = requestInfo.verb;
    var host = requestInfo.host.toLowerCase();
    var uriPath = requestInfo.uriPath;
    var canonical = verb + "\n" + host + "\n" + uriPath + "\n";
    var sortedKeys = filterAndSortKeys(params, signatureFilter, caseSensitiveComparator);
    var first = true;
    for (var i = 0; i < sortedKeys.length; i++) {
        if (first) {
            first = false;
        } else {
            canonical += "&";
        }
        var key = sortedKeys[i];
        canonical += urlEncode(key);
        if (params[key] !== null) {
            canonical += "=" + urlEncode(params[key]);
        }
    }
    return canonical;
}

function urlEncode(url) {
    return encodeURIComponent(url)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

function filterAndSortKeys(obj, filter, comparator) {
    var keys = new Array();
    for (var key in obj) {
        if (!filter(key, obj[key])) {
            keys.push(key);
        }
    }
    return keys.sort(comparator);
}

function signatureFilter(key, value) {
    return key === "Signature" || value === null;
}

function caseInsensitiveComparator(a, b) {
    return simpleComparator(a.toLowerCase(), b.toLowerCase());
}

function caseSensitiveComparator(a, b) {
    var length = a.length;
    if (b.length < length) {
        length = b.length;
    }

    for (var i = 0; i < length; i++) {
        var comparison = simpleComparator(a.charCodeAt(i), b.charCodeAt(i));
        if (comparison !== 0) {
            return comparison;
        }
    }

    if (a.length == b.length) {
        return 0;
    }
    if (b.length > a.length) {
        return 1;
    }
    return -1;
}

function simpleComparator(a, b) {
    if (a < b) {
        return -1;
    } else if (a > b) {
        return 1;
    }
    return 0;
}

exports.AWSV2Signer = AWSV2Signer;
