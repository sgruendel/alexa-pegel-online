import fs from 'fs';
import pMap from 'p-map';
import { pathToFileURL } from 'url';
import * as pegelonline from '../pegelonline.js';
import * as utils from '../utils.js';

const MODEL_FILE = new URL('../../skill-package/interactionModels/custom/de-DE.json', import.meta.url);
const STATION_VARIANTS_FILE = new URL('../stationVariants.json', import.meta.url);
const UTF8 = 'utf8';
const COUNTER_NOUNS = [ 'Messstelle', 'Messwert', 'Pegel', 'Pegelstand', 'Wasserstand', 'Wert' ];
const MEASUREMENT_CONCURRENCY = positiveInteger(process.env.MODEL_REQUEST_CONCURRENCY, 5);
const REQUEST_MAX_ATTEMPTS = positiveInteger(process.env.MODEL_REQUEST_MAX_ATTEMPTS, 5);
const RETRY_BASE_DELAY_MS = positiveInteger(process.env.MODEL_RETRY_BASE_DELAY_MS, 500);
const RETRY_MAX_DELAY_MS = 10000;
const RETRYABLE_ERROR_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EPIPE',
    'EAI_AGAIN',
    'ENOTFOUND',
]);

function positiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function isRetryableError(error) {
    if (!error) return false;
    if (RETRYABLE_ERROR_CODES.has(error.code)) return true;
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
    if (error.statusCode === 408 || error.statusCode === 429 || error.statusCode >= 500) return true;
    return isRetryableError(error.cause);
}

export async function requestWithRetry(description, request, options = {}) {
    const sleep = options.sleep || delay;
    const random = options.random || Math.random;
    const logger = options.logger || console;
    const maxAttempts = options.maxAttempts || REQUEST_MAX_ATTEMPTS;
    const baseDelayMs = options.baseDelayMs || RETRY_BASE_DELAY_MS;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await request();
        } catch (error) {
            if (attempt === maxAttempts || !isRetryableError(error)) throw error;

            const exponentialDelay = baseDelayMs * (2 ** (attempt - 1));
            const jitteredDelay = Math.round(exponentialDelay * (0.75 + random() * 0.5));
            const retryDelay = Math.min(jitteredDelay, RETRY_MAX_DELAY_MS);
            logger.log(
                `Retrying ${description} in ${retryDelay}ms ` +
                `(attempt ${attempt + 1}/${maxAttempts}): ${error.message}`,
            );
            await sleep(retryDelay);
        }
    }
}

function getId(variant, uuid) {
    return (variant || '') + ':' + uuid;
}

function value(v) {
    return { name: { value: v } };
}

function compareValues(v1, v2) {
    return v1.name.value > v2.name.value ? 1 : ((v2.name.value > v1.name.value) ? -1 : 0);
}

// Check if measurement is available for a station. Transient failures are retried with
// exponential backoff, while p-map concurrency in createModel limits overall API load.
export async function hasMeasurement(station, options = {}) {
    const getCurrentMeasurement = options.getCurrentMeasurement || pegelonline.getCurrentMeasurement;
    const logger = options.logger || console;

    try {
        const result = await requestWithRetry(
            station.longname,
            () => getCurrentMeasurement(station.uuid),
            options,
        );
        if (result.status) {
            logger.log(station.longname, result.status, result.message);
            return false;
        }
        return true;
    } catch (error) {
        logger.log('Skipping', station.longname, error.message);
        return false;
    }
}

function addStation(station, listOfStations, listOfVariants) {
    const long = utils.normalizeStation(station.longname, station.water.longname);
    const short = utils.normalizeStation(station.shortname, station.water.longname);
    const variant = long.variant || short.variant;

    const index = listOfStations.findIndex(s => {
        return s.name.value === long.name;
    });
    if (index < 0) {
        let stationValue = {
            id: getId(variant, station.uuid),
            name: { value: long.name },
        };
        if (short.name !== long.name) {
            stationValue.name.synonyms = [ short.name ];
        }
        if (short.name === 'Althagen') {
            stationValue.name.synonyms = [ 'Ahrenshoop' ];
        } else if (short.name === 'Große Weserbrücke') {
            stationValue.name.synonyms = [ 'Bremen' ];
        } else if (short.name === 'Cranz') {
            // Need to add synonym with wrong spelling, as this is what Alexa understands ...
            stationValue.name.synonyms = [ 'Kranz' ];
        } else if (short.name === 'Hooksielplate') {
            stationValue.name.synonyms = [ 'Hooksiel' ];
        } else if (short.name === 'Karlshafen') {
            stationValue.name.synonyms = [ 'Bad Karlshafen' ];
        } else if (short.name === 'Kelheimwinzer') {
            stationValue.name.synonyms = [ 'Kelheim' ];
        } else if (short.name === 'Mannheim (Rhein)') {
            stationValue.name.synonyms = [ 'Ludwigshafen' ];
        } else if (short.name === 'Maxau') {
            stationValue.name.synonyms = [ 'Karlsruhe' ];
        } else if (short.name === 'Pogum') {
            stationValue.name.synonyms = [ 'Ditzum' ];
        } else if (short.name === 'Sankt Arnual') {
            stationValue.name.synonyms = [ 'Saarbrücken' ];
        } else if (short.name === 'Sankt Goar') {
            stationValue.name.synonyms = [ 'Loreley' ];
        } else if (short.name === 'Schillig') {
            stationValue.name.synonyms = [ 'Horumersiel', 'Wangersiel' ];
        } else if (short.name === 'Trotha') {
            stationValue.name.synonyms = [ 'Halle' ];
        } else if (short.name.endsWith(' MPM')) {
            stationValue.name.synonyms = [ short.name.replace(' MPM', ' Multiparameterstation') ];
        }
        listOfStations.push(stationValue);
    } else {
        let stationValue = listOfStations[index];
        stationValue.id += ',' + getId(variant, station.uuid);
        if (short.name !== long.name) {
            if (!stationValue.name.synonyms.includes(short.name)) {
                stationValue.name.synonyms.push(short.name);
            }
        }
        listOfStations[index] = stationValue;
    }

    if (variant) {
        if (!listOfVariants.find(v => { return v.name.value === variant; })) {
            listOfVariants.push(value(variant));
        }
    }
}

export async function createModel() {
    const [ stations, waters ] = await Promise.all([
        requestWithRetry('station catalog', () => pegelonline.getStations()),
        requestWithRetry('water catalog', () => pegelonline.getWaters()),
    ]);
    let listOfStations = [];
    let listOfVariants = [];
    console.log(`Checking ${stations.length} stations with up to ${MEASUREMENT_CONCURRENCY} concurrent requests`);
    const measurementChecks = await pMap(
        stations,
        station => hasMeasurement(station),
        { concurrency: MEASUREMENT_CONCURRENCY },
    );
    stations.forEach((station, index) => {
        if (measurementChecks[index]) addStation(station, listOfStations, listOfVariants);
    });

    const listOfWaters = waters.map(water => {
        const name = (water.shortname.length > water.longname.length) ? water.shortname : water.longname;
        return value(utils.normalizeWater(name));
    });

    // read existing interaction model
    let model = JSON.parse(fs.readFileSync(MODEL_FILE, UTF8));

    // sort stations by name
    listOfStations.sort(compareValues);

    let stationVariants = {};
    listOfStations = listOfStations.map(station => {
        const ids = station.id.split(',');
        if (ids.length === 1) {
            // only one variant, simply use the id after the ':
            station.id = station.id.split(':')[1];
        } else {
            ids.sort();
            stationVariants[station.name.value] = ids;
            // mark id as non-unique so IntentHandler can start slot elicitation using variants
            // need to keep a unique part in the id, so we don't get duplicate values
            station.id = '*' + ids[0].split(':')[1];
        }
        return station;
    });

    // sort variants by name
    listOfVariants.sort(compareValues);

    // sort waters by name
    listOfWaters.sort(compareValues);

    // store station variants to resolve slots with ids starting with '*'
    const stream = fs.createWriteStream(STATION_VARIANTS_FILE);
    stream.write(JSON.stringify(stationVariants, null, 2));
    stream.end();

    model.interactionModel.languageModel.types = [
        {
            name: 'LIST_OF_STATIONS',
            values: listOfStations,
        },
        {
            name: 'LIST_OF_VARIANTS',
            values: listOfVariants,
        },
        {
            name: 'LIST_OF_WATERS',
            values: listOfWaters,
        },
        {
            name: 'LIST_OF_COUNTER_NOUNS',
            values: COUNTER_NOUNS.map(cn => value(cn)),
        },
    ];
    // serialize new interaction model
    fs.writeFileSync(MODEL_FILE, JSON.stringify(model, null, 2), UTF8);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    createModel().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
