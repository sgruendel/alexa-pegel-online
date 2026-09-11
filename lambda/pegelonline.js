import fetch from 'node-fetch';
import https from 'https';
import { createRequestSignal } from './request-budget.js';

const BASE_URL = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/';

const httpsAgent = new https.Agent({
    keepAlive: true,
});
const options = {
    agent: () => {
        return httpsAgent;
    },
};

export class HttpError extends Error {
    /**
     * @param {number} statusCode HTTP response status.
     */
    constructor(statusCode) {
        super(`PegelOnline request failed with status ${statusCode}`);
        this.name = 'HttpError';
        this.statusCode = statusCode;
    }
}

/**
 * @template T
 * @param {string} url URL to request.
 * @returns {Promise<T>} Parsed JSON response.
 */
async function getJson(url, { signal = createRequestSignal() } = {}) {
    signal.throwIfAborted();
    const response = await fetch(url, { ...options, signal });
    if (!response.ok) {
        throw new HttpError(response.status);
    }
    return /** @type {Promise<T>} */ (response.json());
}

/**
 * see https://www.pegelonline.wsv.de/webservice/dokuRestapi#ressourcenWater
 * @typedef {Object} WaterJson
 * @property {string} shortname - The short name of the water body.
 * @property {string} longname - The long name of the water body.
 */

/**
 * see https://www.pegelonline.wsv.de/webservice/dokuRestapi#ressourcenStation
 * @typedef {Object} StationJson
 * @property {string} uuid - The UUID of the river station.
 * @property {string} number - The number of the river station.
 * @property {string} shortname - The short name of the river station.
 * @property {string} longname - The long name of the river station.
 * @property {number} km - The distance of the river station in kilometers.
 * @property {string} agency - The agency responsible for the river station.
 * @property {number} longitude - The longitude of the river station.
 * @property {number} latitude - The latitude of the river station.
 * @property {WaterJson} water - Information about the water body.
 */

/**
 * see https://www.pegelonline.wsv.de/webservice/dokuRestapi#ressourcenTimeseries
 * @typedef {Object} CurrentMeasurementJson
 * @property {string} shortname - The short name of the water gauge data.
 * @property {string} longname - The long name of the water gauge data.
 * @property {string} unit - The unit of measurement for the water gauge data.
 * @property {number} equidistance - The equidistance of measurements.
 * @property {Object} currentMeasurement - Information about the current measurement.
 * @property {string} currentMeasurement.timestamp - The timestamp of the current measurement.
 * @property {number} currentMeasurement.value - The value of the current measurement.
 * @property {string} currentMeasurement.stateMnwMhw - The state of the measurement related to Mnw/Mhw.
 * @property {string} currentMeasurement.stateNswHsw - The state of the measurement related to Nsw/Hsw.
 * @property {number?} currentMeasurement.trend - trend
 * @property {Object} gaugeZero - Information about the gauge zero.
 * @property {string} gaugeZero.unit - The unit of measurement for the gauge zero.
 * @property {number} gaugeZero.value - The value of the gauge zero.
 * @property {string} gaugeZero.validFrom - The date from which the gauge zero value is valid.
 */

/**
 * @typedef {Object} ImageUrls
 * @property {Object} xsmall - Information about the xsmall image size.
 * @property {string} xsmall.url - The URL for the xsmall image.
 * @property {number} xsmall.width - The width of the xsmall image.
 * @property {number} xsmall.height - The height of the xsmall image.
 * @property {Object} small - Information about the small image size.
 * @property {string} small.url - The URL for the small image.
 * @property {number} small.width - The width of the small image.
 * @property {number} small.height - The height of the small image.
 * @property {Object} medium - Information about the medium image size.
 * @property {string} medium.url - The URL for the medium image.
 * @property {number} medium.width - The width of the medium image.
 * @property {number} medium.height - The height of the medium image.
 * @property {Object} large - Information about the large image size.
 * @property {string} large.url - The URL for the large image.
 * @property {number} large.width - The width of the large image.
 * @property {number} large.height - The height of the large image.
 * @property {Object} xlarge - Information about the xlarge image size.
 * @property {string} xlarge.url - The URL for the xlarge image.
 * @property {number} xlarge.width - The width of the xlarge image.
 * @property {number} xlarge.height - The height of the xlarge image.
 */

/**
 * Get all stations available, or all stations for a water if specified.
 * @param {string=} water If specified, only return stations for this water.
 * @returns {Promise<StationJson[]>} A promise that resolves to an array of stations.
 */
export function getStations(water, options) {
    let qs = 'prettyprint=false';
    if (water) {
        qs += '&waters=' + encodeURIComponent(water);
    }
    return getJson(BASE_URL + 'stations.json?' + qs, options);
}

/**
 * Get all waters available.
 * @returns {Promise<WaterJson[]>} A promise that resolves to an array of waters.
 */
export function getWaters(options) {
    const qs = 'prettyprint=false';
    return getJson(BASE_URL + 'waters.json?' + qs, options);
}

/**
 * Get current measurement data for a station.
 * @param {string} uuid UUID of station
 * @returns {Promise<CurrentMeasurementJson>} A promise that resolves to the current measurement data.
 */
export function getCurrentMeasurement(uuid, options) {
    const qs = 'prettyprint=false&includeCurrentMeasurement=true';
    return getJson(BASE_URL + 'stations/' + encodeURIComponent(uuid) + '/W.json?' + qs, options);
}

/**
 * Get image URLs for a station.
 * @param {string} uuid UUID of station
 * @returns an object with different sizes of image URLs and their corresponding width and height
 * values.
 */
export function getImageUrls(uuid) {
    const common = BASE_URL + 'stations/' + uuid + '/W/measurements.png?start=P7D';

    /** @type {ImageUrls} */
    const image = {
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
    return image;
}
