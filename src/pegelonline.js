'use strict';

const request = require('request-promise-native');

const BASE_URL = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/';

const wsvRequest = request.defaults({
    baseUrl: BASE_URL,
    gzip: true,
    json: true,
});

var exports = module.exports = {};

exports.getStations = async water => {
    var qs = {
        prettyprint: false,
    };
    if (water) {
        qs.waters = water;
    }
    const options = {
        uri: 'stations.json',
        qs: qs,
    };
    return wsvRequest(options);
};

exports.getWaters = async => {
    const options = {
        uri: 'waters.json',
        qs: {
            prettyprint: false,
        },
    };
    return wsvRequest(options);
};

exports.getUuidsForWater = async water => {
    const options = {
        uri: 'stations.json',
        qs: {
            waters: encodeURI(water),
            prettyprint: false,
        },
    };
    return (await wsvRequest(options)).map(station => { return station.uuid; });
};

exports.getCurrentMeasurement = async station => {
    const options = {
        uri: 'stations/' + encodeURI(station) + '/W.json',
        qs: {
            includeCurrentMeasurement: true,
            prettyprint: false,
        },
    };
    return wsvRequest(options);
};

exports.getImage = station => {
    const common = BASE_URL + 'stations/' + station + '/W/measurements.png?start=P7D';
    return {
        xsmall: {
            url: common + '&width=480&height=320',
            width: 480,
            height: 320,
        },
        small: {
            url: common + '&width=720&height=480',
            width: 720,
            height: 480,
        },
        medium: {
            url: common + '&width=960&height=640',
            width: 960,
            height: 640,
        },
        large: {
            url: common + '&width=1200&height=800',
            width: 1200,
            height: 800,
        },
        xlarge: {
            url: common + '&width=1920&height=1280',
            width: 1920,
            height: 1280,
        },
    };
};
