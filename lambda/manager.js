import * as pegelonline from './pegelonline.js';

export async function getStations(water) {
    return pegelonline.getStations(water);
};

export async function getCurrentMeasurement(uuid) {
    const result = await pegelonline.getCurrentMeasurement(uuid);
    if (result.unit.endsWith('+NN')) {
        // Bad Essen liefert "m+NN"
        result.unit = result.unit.slice(0, result.unit.length - 3);
    } else if (result.unit.endsWith('+PNP')) {
        // Talsperren liefern "m+PNP"
        result.unit = result.unit.slice(0, result.unit.length - 4);
    }

    if (result.currentMeasurement.timestamp) {
        // Zeitzonen-Offset entfernen, damit ein daraus erzeugtes Date-Objekt als Lokalzeit behandelt wird
        result.currentMeasurement.timestamp = result.currentMeasurement.timestamp.replace(/[-+][0-9][0-9]:[0-9][0-9]/, '');
    }

    result.image = pegelonline.getImage(uuid);

    return result;
};
