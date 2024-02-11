import fetch from 'node-fetch';
import https from 'https';

const BASE_URL = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/';

const httpsAgent = new https.Agent({
    keepAlive: true,
});
const options = {
    agent: (_parsedURL) => {
        return httpsAgent;
    },
};

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
 * @typedef {Object} Image
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
 * @returns a promise that resolves to an array of stations
 */
export async function getStations(water) {
    let qs = 'prettyprint=false';
    if (water) {
        qs += '&waters=' + encodeURI(water);
    }
    const response = await fetch(BASE_URL + 'stations.json?' + qs, options);

    /** @type {Promise<StationJson[]>} */
    // @ts-ignore
    const stations = response.json();
    return stations;
}

/**
 * Get all waters available.
 * @returns a promise that resolves to an array of waters
 */
export async function getWaters() {
    const qs = 'prettyprint=false';
    const response = await fetch(BASE_URL + 'waters.json?' + qs, options);

    /** @type {Promise<WaterJson[]>} */
    // @ts-ignore
    const waters = response.json();
    return waters;
}

/**
 * Get current measurement data for a station.
 * @param {string} uuid UUID of station
 * @returns a promise that resolves to the current measurement data
 */
export async function getCurrentMeasurement(uuid) {
    const qs = 'prettyprint=false&includeCurrentMeasurement=true';
    const response = await fetch(BASE_URL + 'stations/' + encodeURI(uuid) + '/W.json?' + qs, options);

    /** @type {Promise<CurrentMeasurementJson>} */
    // @ts-ignore
    const currentMeasurement = response.json();
    return currentMeasurement;
}

/**
 * Get image info for a station.
 * @param {string} uuid UUID of station
 * @returns an object with different sizes of image URLs and their corresponding width and height
 * values.
 */
export function getImage(uuid) {
    const common = BASE_URL + 'stations/' + uuid + '/W/measurements.png?start=P7D';

    /** @type {Image} */
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
