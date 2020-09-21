'use strict';

const fetch = require('node-fetch');

const BASE_URL = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/';

var exports = module.exports = {};

exports.getStations = async water => {
    let qs = 'prettyprint=false';
    if (water) {
        qs += '&waters=' + encodeURI(water);
    }
    const response = await fetch(BASE_URL + 'stations.json?' + qs);
    return response.json();
};

exports.getWaters = async() => {
    const qs = 'prettyprint=false';
    const response = await fetch(BASE_URL + 'waters.json?' + qs);
    return response.json();
};

exports.getCurrentMeasurement = async station => {
    const qs = 'prettyprint=false&includeCurrentMeasurement=true';
    const response = await fetch(BASE_URL + 'stations/' + encodeURI(station) + '/W.json?' + qs);
    return response.json();
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
