import * as pegelonline from './pegelonline.js';

/**
 * @typedef {Object} CurrentMeasurement
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
 * @property {pegelonline.Image} image - img
 */

/**
 * Get all stations available, or all stations for a water if specified.
 * @param {string=} water If specified, only return stations for this water.
 * @returns a promise that resolves to an array of stations
 */
export async function getStations(water) {
    return pegelonline.getStations(water);
}

/**
 * Get current measurement data for a station.
 * @param {string} uuid UUID of station
 * @returns a promise that resolves to the current measurement data
 */
export async function getCurrentMeasurement(uuid) {
    /** @type {CurrentMeasurement} */
    const result = { ...(await pegelonline.getCurrentMeasurement(uuid)), image: pegelonline.getImage(uuid) };
    if (result.unit.endsWith('+NN')) {
        // Bad Essen liefert "m+NN"
        result.unit = result.unit.slice(0, result.unit.length - 3);
    } else if (result.unit.endsWith('+PNP')) {
        // Talsperren liefern "m+PNP"
        result.unit = result.unit.slice(0, result.unit.length - 4);
    }

    if (result.currentMeasurement.timestamp) {
        // Zeitzonen-Offset entfernen, damit ein daraus erzeugtes Date-Objekt als Lokalzeit behandelt wird
        result.currentMeasurement.timestamp = result.currentMeasurement.timestamp.replace(
            /[-+][0-9][0-9]:[0-9][0-9]/,
            '',
        );
    }

    return result;
}
