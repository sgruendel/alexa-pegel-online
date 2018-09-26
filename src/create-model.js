'use strict';

const fs = require('fs');
const pegelonline = require('./pegelonlineRestAPI');

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

    await getStations;
    await getWaters;
    const interactionModel = {
        interactionModel: {
            languageModel: {
                invocationName: 'pegel online',
                intents: [
                    {
                        name: 'QueryStationIntent',
                        slots: [
                            {
                                name: 'station',
                                type: 'LIST_OF_STATIONS',
                                samples: [
                                    '{station}',
                                    'am {station}',
                                    'auf {station}',
                                    'an {station}',
                                    'an der {station}',
                                    'bei {station}',
                                    'bei der {station}',
                                    'der {station}',
                                    'des {station}',
                                    'in {station}',
                                    'vom {station}',
                                    'von {station}',
                                ],
                            },
                        ],
                        samples: [
                            '{station}',
                            'nach der Messstelle {station}',
                            'nach der Messstelle am {station}',
                            'nach der Messstelle auf {station}',
                            'nach der Messstelle an {station}',
                            'nach der Messstelle an der {station}',
                            'nach der Messstelle bei {station}',
                            'nach der Messstelle bei der {station}',
                            'nach der Messstelle der {station}',
                            'nach der Messstelle des {station}',
                            'nach der Messstelle in {station}',
                            'nach der Messstelle vom {station}',
                            'nach der Messstelle von {station}',
                            'nach dem Messwert {station}',
                            'nach dem Messwert am {station}',
                            'nach dem Messwert auf {station}',
                            'nach dem Messwert an {station}',
                            'nach dem Messwert an der {station}',
                            'nach dem Messwert bei {station}',
                            'nach dem Messwert bei der {station}',
                            'nach dem Messwert der {station}',
                            'nach dem Messwert des {station}',
                            'nach dem Messwert in {station}',
                            'nach dem Messwert vom {station}',
                            'nach dem Messwert von {station}',
                            'nach dem Pegel {station}',
                            'nach dem Pegel am {station}',
                            'nach dem Pegel auf {station}',
                            'nach dem Pegel an {station}',
                            'nach dem Pegel an der {station}',
                            'nach dem Pegel bei {station}',
                            'nach dem Pegel bei der {station}',
                            'nach dem Pegel der {station}',
                            'nach dem Pegel des {station}',
                            'nach dem Pegel in {station}',
                            'nach dem Pegel vom {station}',
                            'nach dem Pegel von {station}',
                            'nach dem Pegelstand {station}',
                            'nach dem Pegelstand am {station}',
                            'nach dem Pegelstand auf {station}',
                            'nach dem Pegelstand an {station}',
                            'nach dem Pegelstand an der {station}',
                            'nach dem Pegelstand bei {station}',
                            'nach dem Pegelstand bei der {station}',
                            'nach dem Pegelstand der {station}',
                            'nach dem Pegelstand des {station}',
                            'nach dem Pegelstand in {station}',
                            'nach dem Pegelstand vom {station}',
                            'nach dem Pegelstand von {station}',
                            'nach dem Wasserstand {station}',
                            'nach dem Wasserstand am {station}',
                            'nach dem Wasserstand auf {station}',
                            'nach dem Wasserstand an {station}',
                            'nach dem Wasserstand an der {station}',
                            'nach dem Wasserstand bei {station}',
                            'nach dem Wasserstand bei der {station}',
                            'nach dem Wasserstand der {station}',
                            'nach dem Wasserstand des {station}',
                            'nach dem Wasserstand in {station}',
                            'nach dem Wasserstand vom {station}',
                            'nach dem Wasserstand von {station}',
                            'nach dem Wert {station}',
                            'nach dem Wert am {station}',
                            'nach dem Wert auf {station}',
                            'nach dem Wert an {station}',
                            'nach dem Wert an der {station}',
                            'nach dem Wert bei {station}',
                            'nach dem Wert bei der {station}',
                            'nach dem Wert der {station}',
                            'nach dem Wert des {station}',
                            'nach dem Wert in {station}',
                            'nach dem Wert vom {station}',
                            'nach dem Wert von {station}',
                            'wie der Messwert bei {station} ist',
                            'wie der Pegel bei {station} ist',
                            'wie der Pegelstand bei {station} ist',
                            'wie der Wasserstand bei {station} ist',
                            'wie der Wert bei {station} ist',
                        ],
                    },
                    {
                        name: 'QueryWaterIntent',
                        slots: [
                            {
                                name: 'water',
                                type: 'LIST_OF_WATERS',
                                samples: [
                                    '{water}',
                                    'am {water}',
                                    'auf {water}',
                                    'an {water}',
                                    'an der {water}',
                                    'bei {water}',
                                    'bei der {water}',
                                    'der {water}',
                                    'des {water}',
                                    'in {water}',
                                    'vom {water}',
                                    'von {water}',
                                ],
                            },
                        ],
                        samples: [
                            '{water}',
                            'nach der Messstelle {water}',
                            'nach der Messstelle am {water}',
                            'nach der Messstelle auf {water}',
                            'nach der Messstelle an {water}',
                            'nach der Messstelle an der {water}',
                            'nach der Messstelle bei {water}',
                            'nach der Messstelle bei der {water}',
                            'nach der Messstelle der {water}',
                            'nach der Messstelle des {water}',
                            'nach der Messstelle in {water}',
                            'nach der Messstelle vom {water}',
                            'nach der Messstelle von {water}',
                            'nach dem Messwert {water}',
                            'nach dem Messwert am {water}',
                            'nach dem Messwert auf {water}',
                            'nach dem Messwert an {water}',
                            'nach dem Messwert an der {water}',
                            'nach dem Messwert bei {water}',
                            'nach dem Messwert bei der {water}',
                            'nach dem Messwert der {water}',
                            'nach dem Messwert des {water}',
                            'nach dem Messwert in {water}',
                            'nach dem Messwert vom {water}',
                            'nach dem Messwert von {water}',
                            'nach dem Pegel {water}',
                            'nach dem Pegel am {water}',
                            'nach dem Pegel auf {water}',
                            'nach dem Pegel an {water}',
                            'nach dem Pegel an der {water}',
                            'nach dem Pegel bei {water}',
                            'nach dem Pegel bei der {water}',
                            'nach dem Pegel der {water}',
                            'nach dem Pegel des {water}',
                            'nach dem Pegel in {water}',
                            'nach dem Pegel vom {water}',
                            'nach dem Pegel von {water}',
                            'nach dem Pegelstand {water}',
                            'nach dem Pegelstand am {water}',
                            'nach dem Pegelstand auf {water}',
                            'nach dem Pegelstand an {water}',
                            'nach dem Pegelstand an der {water}',
                            'nach dem Pegelstand bei {water}',
                            'nach dem Pegelstand bei der {water}',
                            'nach dem Pegelstand der {water}',
                            'nach dem Pegelstand des {water}',
                            'nach dem Pegelstand in {water}',
                            'nach dem Pegelstand vom {water}',
                            'nach dem Pegelstand von {water}',
                            'nach dem Wasserstand {water}',
                            'nach dem Wasserstand am {water}',
                            'nach dem Wasserstand auf {water}',
                            'nach dem Wasserstand an {water}',
                            'nach dem Wasserstand an der {water}',
                            'nach dem Wasserstand bei {water}',
                            'nach dem Wasserstand bei der {water}',
                            'nach dem Wasserstand der {water}',
                            'nach dem Wasserstand des {water}',
                            'nach dem Wasserstand in {water}',
                            'nach dem Wasserstand vom {water}',
                            'nach dem Wasserstand von {water}',
                            'nach dem Wert {water}',
                            'nach dem Wert am {water}',
                            'nach dem Wert auf {water}',
                            'nach dem Wert an {water}',
                            'nach dem Wert an der {water}',
                            'nach dem Wert bei {water}',
                            'nach dem Wert bei der {water}',
                            'nach dem Wert der {water}',
                            'nach dem Wert des {water}',
                            'nach dem Wert in {water}',
                            'nach dem Wert vom {water}',
                            'nach dem Wert von {water}',
                            'wie der Messwert bei {water} ist',
                            'wie der Pegel bei {water} ist',
                            'wie der Pegelstand bei {water} ist',
                            'wie der Wasserstand bei {water} ist',
                            'wie der Wert bei {water} ist',
                        ],
                    },
                    {
                        name: 'AMAZON.HelpIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.StopIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.CancelIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.NavigateHomeIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.MoreIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.NavigateSettingsIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.NextIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.PageUpIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.PageDownIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.PreviousIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.ScrollRightIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.ScrollDownIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.ScrollLeftIntent',
                        samples: [],
                    },
                    {
                        name: 'AMAZON.ScrollUpIntent',
                        samples: [],
                    },
                ],
                types: [
                    {
                        name: 'LIST_OF_STATIONS',
                        values: listOfStations,
                    },
                    {
                        name: 'LIST_OF_WATERS',
                        values: listOfWaters,
                    },
                ],
            },
            dialog: {
                intents: [
                    {
                        name: 'QueryStationIntent',
                        confirmationRequired: false,
                        slots: [
                            {
                                name: 'station',
                                type: 'LIST_OF_STATIONS',
                                confirmationRequired: false,
                                elicitationRequired: true,
                                prompts: {
                                    elicitation: 'Elicit.Slot.station',
                                },
                            },
                        ],
                    },
                    {
                        name: 'QueryWaterIntent',
                        confirmationRequired: false,
                        slots: [
                            {
                                name: 'water',
                                type: 'LIST_OF_WATERS',
                                confirmationRequired: false,
                                elicitationRequired: true,
                                prompts: {
                                    elicitation: 'Elicit.Slot.water',
                                },
                            },
                        ],
                    },
                ],
            },
            prompts: [
                {
                    id: 'Elicit.Slot.station',
                    variations: [
                        {
                            type: 'PlainText',
                            value: 'Welche Messstelle?',
                        },
                    ],
                },
                {
                    id: 'Elicit.Slot.water',
                    variations: [
                        {
                            type: 'PlainText',
                            value: 'Welches Gewässer?',
                        },
                    ],
                },
            ],
        },
    };
    // serialize station uuid to name mapping to be used when calling Alexa Intent with station name
    fs.writeFileSync('models/de-DE.json', JSON.stringify(interactionModel, null, 2), 'utf8');

}

createModel();
