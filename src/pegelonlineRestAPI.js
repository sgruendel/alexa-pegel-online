'use strict';

// TODO fix Accept-Encoding: gzip, check http://stackoverflow.com/questions/19438884/incorrect-header-check-when-using-zlib-in-node-js
// TODO introduce constants for strings

const http = require('http');
const zlib = require('zlib');

var exports = module.exports = {};

exports.getStations = function(callback) {
    const request = http.get({
        host: 'www.pegelonline.wsv.de',
        port: 80,
        path: '/webservices/rest-api/v2/stations.json?prettyprint=false',
        headers: {
            Accept: 'application/json',
            'xxxAccept-Encoding': 'gzip',
        },
    });

    request.on('response', (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
            console.error('error in response for stations.json',
                response.statusCode + ' ' + response.statusMessage);
            return callback(new Error(response.statusMessage));
        }
        response.on('error', err => {
            console.error('error in response for stations.json', err);
            return callback(err);
        });
        // explicitly treat incoming data as utf8
        response.setEncoding('utf8');

        var output;
        if (response.headers['content-encoding'] === 'gzip') {
            var gzip = zlib.createGunzip();
            response.pipe(gzip);
            output = gzip;
        } else {
            output = response;
        }

        // incrementally capture the incoming response body
        var body = '';
        output.on('data', chunk => {
            body += chunk;
        });

        output.on('end', () => {
            // TODO error handling for returnData
            // {"status":404,"message":"Station id 'XYZ' does not exist."}
            try {
                // console.log('body', body);
                return callback(null, JSON.parse(body));
            } catch (err) {
                console.error('error parsing stations.json', err);
                return callback(err);
            }
        });

    });

    request.on('error', err => {
        console.error('error requesting stations.json', err.message);
        return callback(err);
    });

    request.end();
};

exports.getUuidsFuzzy = function(station, callback) {
    const request = http.get({
        host: 'www.pegelonline.wsv.de',
        port: 80,
        path: '/webservices/rest-api/v2/stations.json?fuzzyId=' + encodeURI(station) + '&prettyprint=false',
        headers: {
            Accept: 'application/json',
            'xxxAccept-Encoding': 'gzip',
        },
    });

    request.on('response', (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
            console.error('error in response for stations.json',
                response.statusCode + ' ' + response.statusMessage);
            return callback(new Error(response.statusMessage));
        }
        response.on('error', err => {
            console.error('error in response for stations.json', err);
            return callback(err);
        });
        // explicitly treat incoming data as utf8
        response.setEncoding('utf8');

        var output;
        if (response.headers['content-encoding'] === 'gzip') {
            var gzip = zlib.createGunzip();
            response.pipe(gzip);
            output = gzip;
        } else {
            output = response;
        }

        // incrementally capture the incoming response body
        var body = '';
        output.on('data', chunk => {
            body += chunk;
        });

        output.on('end', () => {
            try {
                const result = JSON.parse(body);
                return callback(null, result.map(station => {
                    return station.uuid;
                }));
            } catch (err) {
                console.error('error parsing stations.json', err);
                return callback(err);
            }
        });
    });

    request.on('error', err => {
        console.error('error requesting stations.json', err.message);
        return callback(err);
    });

    request.end();
};

exports.getUuidsForWater = function(water, callback) {
    const request = http.get({
        host: 'www.pegelonline.wsv.de',
        port: 80,
        path: '/webservices/rest-api/v2/stations.json?waters=' + encodeURI(water) + '&prettyprint=false',
        headers: {
            Accept: 'application/json',
            'xxxAccept-Encoding': 'gzip',
        },
    });

    request.on('response', (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
            console.error('error in response for stations.json',
                response.statusCode + ' ' + response.statusMessage);
            return callback(new Error(response.statusMessage));
        }
        response.on('error', err => {
            console.error('error in response for stations.json', err);
            return callback(err);
        });
        // explicitly treat incoming data as utf8
        response.setEncoding('utf8');

        var output;
        if (response.headers['content-encoding'] === 'gzip') {
            var gzip = zlib.createGunzip();
            response.pipe(gzip);
            output = gzip;
        } else {
            output = response;
        }

        // incrementally capture the incoming response body
        var body = '';
        output.on('data', chunk => {
            body += chunk;
        });

        output.on('end', () => {
            try {
                const result = JSON.parse(body);
                return callback(null, result.map(station => {
                    return station.uuid;
                }));
            } catch (err) {
                console.error('error parsing stations.json', err);
                return callback(err);
            }
        });
    });

    request.on('error', err => {
        console.error('error requesting stations.json', err.message);
        return callback(err);
    });

    request.end();
};

exports.getCurrentMeasurement = function(station, callback) {
    const request = http.get({
        host: 'www.pegelonline.wsv.de',
        port: 80,
        path: '/webservices/rest-api/v2/stations/' + encodeURI(station) + '/W.json?includeCurrentMeasurement=true&prettyprint=false',
        headers: {
            Accept: 'application/json',
            'xxxAccept-Encoding': 'gzip',
        },
    });

    request.on('response', (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
            console.error('error in response for currentmeasurement.json',
                response.statusCode + ' ' + response.statusMessage);
            return callback(new Error(response.statusMessage));
        }
        response.on('error', err => {
            console.error('error in response for currentmeasurement.json', err);
            return callback(err);
        });
        // explicitly treat incoming data as utf8
        response.setEncoding('utf8');

        var output;
        if (response.headers['content-encoding'] === 'gzip') {
            var gzip = zlib.createGunzip();
            response.pipe(gzip);
            output = gzip;
        } else {
            output = response;
        }

        // incrementally capture the incoming response body
        var body = '';
        output.on('data', chunk => {
            body += chunk;
        });

        output.on('end', () => {
            try {
                const result = JSON.parse(body);
                if (result.currentMeasurement) {
                    return callback(null, result);
                }
                if (result.status && result.message) {
                    // error handling for response like
                    // {"status":404,"message":"Station id 'XYZ' does not exist."}
                    console.error('error in response for currentmeasurement.json', result.status, result.message);
                    // No need to callback here, this has already been done when checking response.statusCode above
                }
            } catch (err) {
                console.error('error parsing currentmeasurement.json', err);
                return callback(err);
            }
        });
    });

    request.on('error', err => {
        console.error('error requesting currentmeasurement.json', err.message);
        return callback(err);
    });

    request.end();
};

exports.getSmallImageUrl = function(station) {
    return 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/' + station + '/W/measurements.png?start=P7D&width=720&height=480';
};

exports.getLargeImageUrl = function(station) {
    return 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/' + station + '/W/measurements.png?start=P7D&width=1200&height=800';
};
