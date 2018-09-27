'use strict';

const fs = require('fs');
const pegelonline = require('./pegelonlineRestAPI');

const MODEL_FILE = 'models/de-DE.json';
const UTF8 = 'utf8';

function normalizeName(name) {
    name = name.toLowerCase();
    var pos;

    // Eisenhuettenstadt Schl. => Schleuse
    pos = name.indexOf('schl.');
    if (pos >= 0) {
        name = name.replace('schl.', 'schleuse');
    }

    // Hann. Münden => Hannoversch Münden
    name = name.replace('hann.muenden', 'hannoversch münden');
    // Hann. => Hannover
    pos = name.indexOf('hann.');
    if (pos >= 0) {
        name = name.replace('hann.', 'hannover ');
    }

    // St. => Sankt
    pos = name.indexOf('st.');
    if (pos >= 0) {
        name = name.replace('st.', 'sankt ');
    }

    // Whv => Wilhelmshaven
    pos = name.indexOf('whv ');
    if (pos >= 0) {
        name = name.replace('whv ', 'wilhelmshaven ');
    }

    // OW/UW/OP/UP
    if (name.endsWith(' ow')) {
        name = name.replace(' ow', ' oberwasser');
    } else if (name.endsWith(' uw')) {
        name = name.replace(' uw', ' unterwasser');
    } else if (name.endsWith(' op')) {
        name = name.replace(' op', ' oberpegel');
    } else if (name.endsWith(' up')) {
        name = name.replace(' up', ' unterpegel');
    } else if (name.endsWith(' ap')) {
        name = name.replace(' ap', ' außenpegel');
    } else if (name.endsWith(' bp')) {
        name = name.replace(' bp', ' binnenpegel');
    }

    // TODO AP/BP/EP ???

    // replace hyphens and underscores by spaces as Alexa won't add them to slot values
    // replace multiple spaces by one and remove trailing space
    name = name.replace('-', ' ').replace('_', ' ').replace(/ +/g, ' ').trim();

    // capitalize letters after spaces
    name = name.split(' ').map(str => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }).join(' ');

    return name;
}

async function createModel() {
    const getStations = pegelonline.getStations();
    const getWaters = pegelonline.getWaters();

    var listOfStations = [];
    getStations
        .then((stations) => {
            stations.forEach(station => {
                const longname = normalizeName(station.longname);
                const shortname = normalizeName(station.shortname);
                var stationValue = {
                    id: station.uuid,
                    name: { value: longname },
                };
                if (shortname !== longname) {
                    stationValue.name.synonyms = [ shortname ];
                }
                listOfStations.push(stationValue);
            });
        });

    var listOfWaters = [];
    getWaters
        .then((waters) => {
            waters.forEach(water => {
                const waterValue = {
                    name: { value: water.longname.toLowerCase() },
                };
                listOfWaters.push(waterValue);
            });
        });

    // read existing interaction model
    var model = JSON.parse(fs.readFileSync(MODEL_FILE, UTF8));
    await getStations;
    await getWaters;
    model.interactionModel.languageModel.intents.types = [
        {
            name: 'LIST_OF_STATIONS',
            values: listOfStations,
        },
        {
            name: 'LIST_OF_WATERS',
            values: listOfWaters,
        },
    ];
    // serialize new interaction model
    fs.writeFileSync(MODEL_FILE, JSON.stringify(model, null, 2), 'utf8');
}

createModel();
