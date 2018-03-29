'use strict';

const request = require('request-promise-native');

const BASE_URL = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/';

const baseRequest = request.defaults({
    baseUrl: BASE_URL,
    gzip: true,
    json: true,
});

var exports = module.exports = {};

exports.getStations = function(callback) {
    const options = {
        uri: 'stations.json',
        qs: {
            prettyprint: false,
        },
    };
    baseRequest(options)
        .then(result => {
            return callback(null, result);
        })
        .catch(err => {
            console.error('error requesting stations.json:', err);
            return callback(err);
        });
};

exports.getUuidsFuzzy = function(station, callback) {
    const options = {
        uri: 'stations.json',
        qs: {
            fuzzyId: encodeURI(station),
            prettyprint: false,
        },
    };
    baseRequest(options)
        .then(result => {
            return callback(null, result.map(station => {
                return station.uuid;
            }));
        })
        .catch(err => {
            console.error('error requesting stations.json for fuzzyId:', err);
            return callback(err);
        });
};

exports.getUuidsForWater = function(water, callback) {
    const options = {
        uri: 'stations.json',
        qs: {
            waters: encodeURI(water),
            prettyprint: false,
        },
    };
    baseRequest(options)
        .then(result => {
            return callback(null, result.map(station => {
                return station.uuid;
            }));
        })
        .catch(err => {
            console.error('error requesting stations.json for waters:', err);
            return callback(err);
        });
};

exports.getCurrentMeasurement = function(station, callback) {
    const options = {
        uri: 'stations/' + encodeURI(station) + '/W.json',
        qs: {
            includeCurrentMeasurement: true,
            prettyprint: false,
        },
    };
    baseRequest(options)
        .then(result => {
            return callback(null, result);
        })
        .catch(err => {
            const e = err.error || err;
            console.error('error getting current measurement:', e);
            return callback(err);
        });
};

exports.getSmallImageUrl = function(station) {
    return BASE_URL + 'stations/' + station + '/W/measurements.png?start=P7D&width=720&height=480';
};

exports.getLargeImageUrl = function(station) {
    return BASE_URL + 'stations/' + station + '/W/measurements.png?start=P7D&width=1200&height=800';
};
