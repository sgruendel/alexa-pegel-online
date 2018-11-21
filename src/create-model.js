'use strict';

const fs = require('fs');
const pegelonline = require('./pegelonlineRestAPI');

const MODEL_FILE = 'models/de-DE.json';
const UTF8 = 'utf8';

function normalizeStation(name) {
    // AwK => '' (remove leading Achterwehrer Schifffahrtskanal)
    // Bhv => Bremerhaven
    // Eisenhuettenstadt Schl. => Schleuse
    // Frankfurt1 (oder) => Frankfurt (Oder)
    // Giessen => Gießen
    // Hann. Münden => Hannoversch Münden
    // Hann. => Hannover
    // Lt => Leuchtturm
    // Luenburg => Lüneburg
    // Nok => '' (removing leading Nord-Ostsee-Kanal)
    // St. => Sankt
    // Shw => Schiffshebewerk
    // strohplao => Strohauser Plate Ost
    // Suelfeld => Sülfeld
    // Whv => Wilhelmshaven
    name = name.toLowerCase()
        .replace('awk ', '')
        .replace('bhv ', 'bremerhaven ')
        .replace('schl.', 'schleuse')
        .replace('frankfurt1', 'frankfurt')
        .replace('giessen', 'gießen')
        .replace('hann.muenden', 'hannoversch münden')
        .replace('hann.', 'hannover ')
        .replace('lt ', 'leuchtturm ')
        .replace('lueneburg', 'lüneburg')
        .replace('nok ', '')
        .replace('st.', 'sankt ')
        .replace('shw ', 'schiffshebewerk ')
        .replace('strohplao', 'strohauser plate ost')
        .replace('suelfeld', 'sülfeld')
        .replace('whv ', 'wilhelmshaven ');

    // replace hyphens, underscores and slashes by spaces as Alexa won't add them to slot values
    // replace multiple spaces by one and remove trailing space
    name = name.replace('-', ' ').replace('_', ' ').replace('/', ' ').replace(/ +/g, ' ').trim();

    var variant;
    // OW/UW/OP/UP ...
    if (name.endsWith(' ow')) {
        name = name.replace(' ow', '');
        variant = 'Oberwasser';
    } else if (name.endsWith(' oberwasser')) {
        name = name.replace(' oberwasser', '');
        variant = 'Oberwasser';
    } else if (name.endsWith(' uw')) {
        name = name.replace(' uw', '');
        variant = 'Unterwasser';
    } else if (name.endsWith(' unterwasser')) {
        name = name.replace(' unterwasser', '');
        variant = 'Unterwasser';
    } else if (name.endsWith(' op')) {
        name = name.replace(' op', '');
        variant = 'Oberpegel';
    } else if (name.endsWith(' up')) {
        name = name.replace(' up', '');
        variant = 'Unterpegel';
    } else if (name.endsWith(' ap')) {
        name = name.replace(' ap', '');
        variant = 'Außenpegel';
    } else if (name.endsWith(' bp')) {
        name = name.replace(' bp', '');
        variant = 'Binnenpegel';
    } else if (name.endsWith(' ep')) {
        name = name.replace(' ep', '');
        variant = 'Elbpegel';
    } else if (name.endsWith(' uf')) {
        name = name.replace(' uf', '');
        variant = 'Unterfeuer';
    } else if (name.endsWith(' of')) {
        name = name.replace(' of', '');
        variant = 'Oberfeuer';
    } else if (name.endsWith(' abz')) {
        name = name.replace(' abz', '');
        variant = 'Außenbezirk';
    } else if (name.endsWith(' elk')) {
        name = name.replace(' elk', '');
        variant = 'Elbe-Lübeck-Kanal';
    // TODO Nord/Ost/West ...
    } else if (name.endsWith(' mpm')) {
        name = name.replace(' mpm', ''); // TODO: Mpm???
    } else if (name.endsWith(' wd')) {
        name = name.replace(' wd', ''); // TODO: Wd???
    } else if (name.endsWith(' ams')) {
        name = name.replace(' ams', ''); // TODO: Ams???

    // The following cases are no variants, just specifiers
    } else if (name.endsWith(' dfh')) {
        name = name.replace(' dfh', ' durchfahrtshöhe');
    } else if (name.endsWith(' nh')) {
        name = name.replace(' nh', ' neuer hafen');
    } else if (name.endsWith(' nok')) {
        name = name.replace(' nok', ' nord-Ostsee-Kanal');
    } else if (name.endsWith(' ro nws')) {
        name = name.replace(' ro nws', ' rothensee niedrigwasserschleuse');
    } else if (name.endsWith(' ska')) {
        name = name.replace(' ska', ' seilkrananlage');
    } else if (name.endsWith(' sp')) {
        name = name.replace(' sp', ' seepegel');
    }

    // capitalize letters after spaces (checking for non letter chars after space, e.g. in "Frankfurt (Oder)")
    name = name.split(' ').map(str => {
        var i = 0;
        while (i < str.length && (str.charAt(i) < 'a' || str.charAt(i) > 'z')) i++;
        return str.slice(0, i) + str.charAt(i).toUpperCase() + str.slice(i + 1);
    }).join(' ');

    return { name: name, variant: variant };
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

function getId(variant, uuid) {
    return (variant || '') + ':' + uuid;
}

async function createModel() {
    const getStations = pegelonline.getStations();
    const getWaters = pegelonline.getWaters();

    var listOfStations = [];
    var listOfVariants = [];
    var stationVariants = {};
    getStations
        .then((stations) => {
            stations.forEach(station => {
                const long = normalizeStation(station.longname);
                const short = normalizeStation(station.shortname);
                const variant = long.variant || short.variant;

                var index = listOfStations.findIndex(s => {
                    return s.name.value === long.name;
                });
                if (index < 0) {
                    var stationValue = {
                        id: getId(variant, station.uuid),
                        name: { value: long.name },
                    };
                    if (short.name !== long.name) {
                        stationValue.name.synonyms = [ short.name ];
                    }
                    listOfStations.push(stationValue);
                } else {
                    stationValue = listOfStations[index];
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
                        listOfVariants.push({
                            name: { value: variant },
                        });
                    }
                }
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
    listOfStations = listOfStations.map(station => {
        const ids = station.id.split(',');
        if (ids.length === 1) {
            // only one variant, simply use the id after the ':
            station.id = station.id.split(':')[1];
        } else {
            stationVariants[station.name.value] = ids;
            // mark id as non-unique so IntentHandler can start slot elicitation using variants
            // need to keep a unique part in the id, so we don't get duplicate values
            station.id = '*' + ids[0].split(':')[1];
        }
        return station;
    });

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
        // TODO: generate static lists from arrays to save LOC
        {
            name: 'LIST_OF_COUNTER_NOUNS',
            values: [
                {
                    name: {
                        value: 'Messstelle',
                    },
                },
                {
                    name: {
                        value: 'Messwert',
                    },
                },
                {
                    name: {
                        value: 'Pegel',
                    },
                },
                {
                    name: {
                        value: 'Pegelstand',
                    },
                },
                {
                    name: {
                        value: 'Wasserstand',
                    },
                },
                {
                    name: {
                        value: 'Wert',
                    },
                },
            ],
        },
    ];
    // serialize new interaction model
    fs.writeFileSync(MODEL_FILE, JSON.stringify(model, null, 2), UTF8);
}

createModel();
