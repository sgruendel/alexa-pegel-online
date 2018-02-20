'use strict';

const Alexa = require('alexa-sdk');
const pegelonline = require('./pegelonlineRestAPI');

const APP_ID = 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1';
const uuids = require('./uuids.json');
const names = require('./names.json');

var uuidsForLowerNames = {};
Object.keys(uuids).forEach(name => {
    uuidsForLowerNames[name.toLowerCase()] = uuids[name];
});

const languageStrings = {
    de: {
        translation: {
            CURRENT_WATER_LEVEL_MESSAGE: 'Der Wasserstand bei {station} beträgt {value} {unit}.',
            NO_RESULT_MESSAGE: 'Ich kann diesen Messwert zur Zeit leider nicht bestimmen.',
            UNKNOWN_STATION_MESSAGE: 'Ich kenne diese Messstelle leider nicht.',
            HELP_MESSAGE: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstation“, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
        },
    },
};

function pad(minutes) {
    return (minutes < 10) ? ('0' + minutes) : minutes;
}

function emitCurrentMeasurement(alexa, uuid) {
    const station = names[uuid];
    console.log('using station ' + station + '/uuid ' + uuid);
    pegelonline.getCurrentMeasurement(uuid, (err, result) => {
        if (result) {
            if (result.unit.endsWith('+NN')) {
                // Bad Essen liefert "m+NN"
                result.unit = result.unit.slice(0, result.unit.length - 3);
            }

            const currentWaterLevel = alexa.t('CURRENT_WATER_LEVEL_MESSAGE')
                .replace('{station}', station)
                .replace('{value}', result.currentMeasurement.value.toString().replace('.', ','))
                .replace('{unit}', result.unit);
            const speechOutput = currentWaterLevel;
            var cardContent = currentWaterLevel;
            if (result.currentMeasurement.timestamp) {
                const measurementDate = new Date(result.currentMeasurement.timestamp);
                const today = new Date();
                var measurementTimeDesc;
                if (measurementDate.getDate() === today.getDate()) {
                    // today, use "hours:minutes"
                    measurementTimeDesc = measurementDate.getHours() + ':' + pad(measurementDate.getMinutes());
                } else if ((measurementDate.getDate() + 1) === today.getDate()) {
                    // yesterday, use "yesterday hours:minutes"
                    // TODO this won't work on first day of month
                    measurementTimeDesc = 'gestern ' + measurementDate.getHours() + ':' + pad(measurementDate.getMinutes());
                } else {
                    measurementTimeDesc = measurementDate.toDateString();
                }
                // console.log(measurementTimeDesc);
                cardContent = 'Messung von ' + measurementTimeDesc + ' Uhr: ' + cardContent;
            }

            const imageObj = {
                smallImageUrl: pegelonline.getSmallImageUrl(uuid),
                largeImageUrl: pegelonline.getLargeImageUrl(uuid),
            };

            alexa.emit(':tellWithCard', speechOutput, 'Pegel bei ' + station, cardContent, imageObj);
        } else {
            console.error('Error getting current measurement', err);
            alexa.emit(':tell', alexa.t('NO_RESULT_MESSAGE'));
        }
    });
}

function emitForUuids(alexa, uuids) {
    // TODO Alexa dialog for multiple fuzzy matches (like UW/OW or UP/OP stations), or return both values
    const uuid = uuids[0];
    emitCurrentMeasurement(alexa, uuid);
}

const handlers = {
    LaunchRequest: function() {
        this.emit('AMAZON.HelpIntent');
    },
    WaterLevelIntent: function() {
        this.emit('WaterLevel');
    },
    WaterLevel: function() {
        const stationSlot = this.event.request.intent.slots.Station;
        if (stationSlot && stationSlot.value) {
            const station = stationSlot.value.toLowerCase();
            console.log('searching for station ' + station);
            const uuid = uuidsForLowerNames[station];

            if (uuid) {
                // we have a perfect match!
                console.log('found perfect match:', uuid);
                emitForUuids(this, [ uuid ]);
                return;
            }

            // try to interpret station as water body
            pegelonline.getUuidsForWater(station, (err, uuids) => {
                if (uuids && uuids.length > 0) {
                    // we have at least one water body match
                    console.log('found water matches:', uuids);
                    emitForUuids(this, uuids);
                    return;
                }

                pegelonline.getUuidsFuzzy(station, (err, uuids) => {
                    if (uuids && uuids.length > 0) {
                        // we have at least one fuzzy match
                        console.log('found fuzzy matches:', uuids);
                        emitForUuids(this, uuids);
                        return;
                    }

                    // search for best match
                    uuids = [];
                    Object.keys(uuidsForLowerNames).forEach(name => {
                        if (name.startsWith(station)) {
                            uuids.push(uuidsForLowerNames[name]);
                        }
                    });
                    if (uuids.length > 0) {
                        console.log('found matches:', uuids);
                        emitForUuids(this, uuids);
                        return;
                    }
                    console.error('No match found for ' + station);
                    this.emit(':tell', this.t('UNKNOWN_STATION_MESSAGE'));
                });
            });
        } else {
            console.error('No slot value given for station');
            this.emit(':tell', this.t('UNKNOWN_STATION_MESSAGE'));
        }
    },
    'AMAZON.HelpIntent': function() {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_REPROMPT');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    SessionEndedRequest: function() {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
