'use strict';

const fs = require('fs');
const pegelonline = require('./pegelonlineRestAPI');

const MODEL_FILE = 'models/de-DE.json';
const UTF8 = 'utf8';

function normalizeStation(station) {
    // AwK => '' (remove leading Achterwehrer Schifffahrtskanal)
    // Bhv => Bremerhaven
    // Eisenhuettenstadt Schl. => Schleuse
    // Frankfurt1 (oder) => Frankfurt (Oder)
    // Giessen => Gießen
    // Hann. Münden => Hannoversch Münden
    // Hann. => Hannover
    // Lt => Leuchtturm
    // Nok => '' (removing leading Nord-Ostsee-Kanal)
    // St. => Sankt
    // Shw => Schiffshebewerk
    // strohplao => Strohauser Plate Ost
    // Whv => Wilhelmshaven
    station = station.toLowerCase()
        .replace('awk ', '')
        .replace('bhv ', 'bremerhaven ')
        .replace('schl.', 'schleuse')
        .replace('frankfurt1', 'frankfurt')
        .replace('giessen', 'gießen')
        .replace('hann.muenden', 'hannoversch münden')
        .replace('hann.', 'hannover ')
        .replace('lt ', 'leuchtturm ')
        .replace('nok ', '')
        .replace('st.', 'sankt ')
        .replace('shw ', 'schiffshebewerk ')
        .replace('strohplao', 'strohauser plate ost')
        .replace('whv ', 'wilhelmshaven ');

    // replace hyphens, underscores and slashes by spaces as Alexa won't add them to slot values
    // replace multiple spaces by one and remove trailing space
    station = station.replace('-', ' ').replace('_', ' ').replace('/', ' ').replace(/ +/g, ' ').trim();

    // OW/UW/OP/UP ...
    if (station.endsWith(' ow')) {
        station = station.replace(' ow', ' oberwasser');
    } else if (station.endsWith(' uw')) {
        station = station.replace(' uw', ' unterwasser');
    } else if (station.endsWith(' op')) {
        station = station.replace(' op', ' oberpegel');
    } else if (station.endsWith(' up')) {
        station = station.replace(' up', ' unterpegel');
    } else if (station.endsWith(' ap')) {
        station = station.replace(' ap', ' außenpegel');
    } else if (station.endsWith(' bp')) {
        station = station.replace(' bp', ' binnenpegel');
    } else if (station.endsWith(' ep')) {
        station = station.replace(' ep', ' elbpegel');
    } else if (station.endsWith(' uf')) {
        station = station.replace(' uf', ' unterfeuer');
    } else if (station.endsWith(' of')) {
        station = station.replace(' of', ' oberfeuer');
    } else if (station.endsWith(' abz')) {
        station = station.replace(' abz', ' außenbezirk');
    } else if (station.endsWith(' dfh')) {
        station = station.replace(' dfh', ' durchfahrtshöhe');
    } else if (station.endsWith(' elk')) {
        station = station.replace(' elk', ' elbe-Lübeck-Kanal');
    } else if (station.endsWith(' mpm')) {
        station = station.replace(' mpm', ''); // TODO: Mpm???
    } else if (station.endsWith(' nok')) {
        station = station.replace(' nok', ' nord-Ostsee-Kanal');
    } else if (station.endsWith(' nh')) {
        station = station.replace(' nh', ' neuer hafen');
    } else if (station.endsWith(' ro nws')) {
        station = station.replace(' ro nws', ' rothensee niedrigwasserschleuse');
    } else if (station.endsWith(' ska')) {
        station = station.replace(' ska', ' seilkrananlage');
    } else if (station.endsWith(' sp')) {
        station = station.replace(' sp', ' seepegel');
    } else if (station.endsWith(' wd')) {
        station = station.replace(' wd', ''); // TODO: Wd???
    } else if (station.endsWith(' ams')) {
        station = station.replace(' ams', ''); // TODO: Ams???
    }

    // capitalize letters after spaces (checking for non letter chars after space, e.g. in "Frankfurt (Oder)")
    station = station.split(' ').map(str => {
        var i = 0;
        while (i < str.length && (str.charAt(i) < 'a' || str.charAt(i) > 'z')) i++;
        return str.slice(0, i) + str.charAt(i).toUpperCase() + str.slice(i + 1);
    }).join(' ');

    return station;
}

function normalizeWater(water) {
    water = water.toLowerCase()
        // capitalize letters after hyphens
        .split('-').map(str => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }).join('-')
        // capitalize letters after spaces
        .split(' ').map(str => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }).join(' ');
    return water;
}

async function createModel() {
    const getStations = pegelonline.getStations();
    const getWaters = pegelonline.getWaters();

    var listOfStations = [];
    getStations
        .then((stations) => {
            stations.forEach(station => {
                const longname = normalizeStation(station.longname);
                const shortname = normalizeStation(station.shortname);
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
                const name = (water.shortname.length > water.longname.length) ? water.shortname : water.longname;
                const waterValue = {
                    name: { value: normalizeWater(name) },
                };
                listOfWaters.push(waterValue);
            });
        });

    // read existing interaction model
    var model = JSON.parse(fs.readFileSync(MODEL_FILE, UTF8));

    await getStations;
    // sort stations by name, waters are already sorted
    listOfStations.sort((a, b) => a.name.value > b.name.value ? 1 : ((b.name.value > a.name.value) ? -1 : 0));

    await getWaters;
    model.interactionModel.languageModel.types = [
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
    fs.writeFileSync(MODEL_FILE, JSON.stringify(model, null, 2), UTF8);
}

createModel();
