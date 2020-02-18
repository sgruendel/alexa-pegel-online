'use strict';

const fs = require('fs');
const pegelonline = require('./pegelonline');
const utils = require('./utils');

const MODEL_FILE = 'models/de-DE.json';
const UTF8 = 'utf8';
const COUNTER_NOUNS = [ 'Messstelle', 'Messwert', 'Pegel', 'Pegelstand', 'Wasserstand', 'Wert' ];

function getId(variant, uuid) {
    return (variant || '') + ':' + uuid;
}

function value(v) {
    return { name: { value: v } };
}

function compareValues(v1, v2) {
    return v1.name.value > v2.name.value ? 1 : ((v2.name.value > v1.name.value) ? -1 : 0);
}

// check if measurement is available for a station
function hasMeasurement(station) {
    return pegelonline.getCurrentMeasurement(station.uuid)
        .then(() => {
            return true;
        })
        .catch(err => {
            if (err.message.indexOf('connect ETIMEDOUT') > 0) {
                console.log('Retrying', station.longname);
                return hasMeasurement(station);
            }
            console.log('Skipping', station.longname, err.message);
            return false;
        });
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
        if (short.name === 'Maxau') {
            stationValue.name.synonyms = [ 'Karlsruhe' ];
        } else if (short.name === 'Karlshafen') {
            stationValue.name.synonyms = [ 'Bad Karlshafen' ];
        } else if (short.name === 'Rothenburg (Saale)') {
            // Need to add synonym with wrong spelling, as this is what Alexa understands ...
            stationValue.name.synonyms = [ 'Rotenburg (Saale)' ];
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

async function createModel() {
    const getStations = pegelonline.getStations();
    const getWaters = pegelonline.getWaters();

    let listOfStations = [];
    let listOfVariants = [];
    let measurementChecks = [];
    getStations
        .then(stations => {
            stations.forEach(station => {
                const measurementCheck = hasMeasurement(station);
                measurementChecks.push(measurementCheck);
                measurementCheck.then(result => {
                    if (result) {
                        addStation(station, listOfStations, listOfVariants);
                    }
                });
            });
        });

    let listOfWaters = [];
    getWaters
        .then((waters) => {
            waters.forEach(water => {
                const name = (water.shortname.length > water.longname.length) ? water.shortname : water.longname;
                listOfWaters.push(value(utils.normalizeWater(name)));
            });
        });

    // read existing interaction model
    let model = JSON.parse(fs.readFileSync(MODEL_FILE, UTF8));

    await getStations;
    await Promise.all(measurementChecks);

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
    const stream = fs.createWriteStream('src/stationVariants.json');
    stream.write(JSON.stringify(stationVariants, null, 2));
    stream.end();

    await getWaters;
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

createModel();
