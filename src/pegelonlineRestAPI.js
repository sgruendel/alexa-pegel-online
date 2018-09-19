'use strict';

const request = require('request-promise-native');

const BASE_URL = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/';

const wsvRequest = request.defaults({
    baseUrl: BASE_URL,
    gzip: true,
    json: true,
});

var exports = module.exports = {};

exports.getStations = async function() {
    const options = {
        uri: 'stations.json',
        qs: {
            prettyprint: false,
        },
    };
    return wsvRequest(options);
};

exports.getUuidsFuzzy = async function(station) {
    const options = {
        uri: 'stations.json',
        qs: {
            fuzzyId: encodeURI(station),
            prettyprint: false,
        },
    };
    return (await wsvRequest(options)).map(station => { return station.uuid; });
};

exports.getUuidsForWater = async function(water) {
    const options = {
        uri: 'stations.json',
        qs: {
            waters: encodeURI(water),
            prettyprint: false,
        },
    };
    return (await wsvRequest(options)).map(station => { return station.uuid; });
};

exports.getCurrentMeasurement = async function(station) {
    const options = {
        uri: 'stations/' + encodeURI(station) + '/W.json',
        qs: {
            includeCurrentMeasurement: true,
            prettyprint: false,
        },
    };
    return wsvRequest(options);
};

exports.getSmallImageUrl = (station) => {
    return BASE_URL + 'stations/' + station + '/W/measurements.png?start=P7D&width=720&height=480';
};

exports.getLargeImageUrl = (station) => {
    return BASE_URL + 'stations/' + station + '/W/measurements.png?start=P7D&width=1200&height=800';
};
