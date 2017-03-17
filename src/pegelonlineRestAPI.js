'use strict';

// TODO fix Accept-Encoding: gzip, check http://stackoverflow.com/questions/19438884/incorrect-header-check-when-using-zlib-in-node-js
// TODO introduce constants for strings

const http = require('http');
const zlib = require('zlib');

var exports = module.exports = {};

exports.getStations = function(callback) {
    const request = http.get({ host: 'www.pegelonline.wsv.de',
                               port: 80,
                               path: '/webservices/rest-api/v2/stations.json?prettyprint=false',
                               headers: { 'Accept': 'application/json',
                                          'xxxAccept-Encoding': 'gzip' },
                             });

    request.on('response', (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
            callback(new Error(response.statusMessage));
        }
        response.on('error', err => {
            console.error('error in response for stations.json', err);
            callback(err);
        });
        // explicitly treat incoming data as utf8
        response.setEncoding('utf8');

        var output;
        console.log('encoding', response.headers['content-encoding']);
        if (response.headers['content-encoding'] == 'gzip') {
            var gzip = zlib.createGunzip();
            response.pipe(gzip);
            output = gzip;
            console.log('using gunzip');
        } else {
            output = response;
        }
        
        // incrementally capture the incoming response body        
        var body = '';
        output.on('data', chunk => {
            body += chunk;
        });
            
        output.on('end', () => {
            // we have now received the raw return data in the returnData variable.
            // We can see it in the log output via:
            //console.log(JSON.stringify(body));
            // we may need to parse through it to extract the needed data
    
            // TODO error handling for returnData
            // {"status":404,"message":"Station id 'XYZ' does not exist."}
            try {
                //console.log('body', body);
                return callback(null, JSON.parse(body));
            } catch (err) {
                console.error('error parsing stations.json', err);
                callback(err);
            }
        });
    
    });

    request.on('error', err => {
        console.error('error requesting stations.json', err.message);
        callback(err);
    });
    
    request.end();
};

exports.getCurrentMeasurement = function(station, callback) {
    const request = http.get({ host: 'www.pegelonline.wsv.de',
                               port: 80,
                               path: '/webservices/rest-api/v2/stations/' + encodeURI(station) + '/W.json?includeCurrentMeasurement=true&prettyprint=false',
                               headers: { 'Accept': 'application/json',
                                          'xxxAccept-Encoding': 'gzip' },
                             });

    request.on('response', (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
            callback(new Error(response.statusMessage));
        }
        response.on('error', err => {
            console.error('error in response for currentmeasurement.json', err);
            callback(err);
        });
        // explicitly treat incoming data as utf8
        response.setEncoding('utf8');

        var output;
        console.log('encoding', response.headers['content-encoding']);
        if (response.headers['content-encoding'] == 'gzip') {
            var gzip = zlib.createGunzip();
            response.pipe(gzip);
            output = gzip;
            console.log('using gunzip');
        } else {
            output = response;
        }

        // incrementally capture the incoming response body        
        var body = '';
        output.on('data', chunk => {
            body += chunk;
        });
            
        output.on('end', () => {
            // we have now received the raw return data in the returnData variable.
            // We can see it in the log output via:
            //console.log(JSON.stringify(body))
            // we may need to parse through it to extract the needed data

            // TODO error handling for returnData
            // {"status":404,"message":"Station id 'XYZ' does not exist."}
            try {
                return callback(null, JSON.parse(body));
            } catch (err) {
                console.error('error parsing currentmeasurement.json', err);
                callback(err);
            }
        });

    });

    request.on('error', err => {
        console.error('error requesting currentmeasurement.json', err.message);
        callback(err);
    });
    
    request.end();
};
