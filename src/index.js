'use strict';

const Alexa = require('alexa-sdk');
const manager = require('./manager');
const util = require('./util');

const APP_ID = 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1';

const languageStrings = {
    de: {
        translation: {
            CURRENT_WATER_LEVEL_MESSAGE: 'Der Wasserstand bei {{result.station}} beträgt {{result.currentMeasurement.value}} {{result.unit}}',
            TREND_RISING: ', die Tendenz ist steigend',
            TREND_FALLING: ', die Tendenz ist fallend',
            TREND_STABLE: ', die Tendenz ist gleichbleibend',
            NO_RESULT_MESSAGE: 'Ich kann diesen Messwert zur Zeit leider nicht bestimmen.',
            UNKNOWN_STATION_MESSAGE: 'Ich kenne diese Messstelle leider nicht.',
            HELP_MESSAGE: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstelle, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
        },
    },
};

const handlers = {
    LaunchRequest: function() {
        this.emit('AMAZON.HelpIntent');
    },
    WaterLevelIntent: function() {
        this.emit('WaterLevel');
    },
    WaterLevel: function() {
        const slots = this.event.request.intent.slots;
        if (slots.Station.value) {
            console.log('searching for station', slots.Station.value);

            manager.findUuidsFor(slots.Station.value, (err, uuids) => {
                if (err) {
                    console.error(err);
                    this.emit(':tell', this.t('UNKNOWN_STATION_MESSAGE'));
                } else {
                    manager.currentMeasurementForUuids(uuids, (err, result) => {
                        if (result) {
                            result.currentMeasurement.value = result.currentMeasurement.value.toString().replace('.', ',');
                            var currentWaterLevel = this.t('CURRENT_WATER_LEVEL_MESSAGE', { result });
                            switch (result.currentMeasurement.trend) {
                            case -1:
                                currentWaterLevel += this.t('TREND_FALLING');
                                break;
                            case 0:
                                currentWaterLevel += this.t('TREND_STABLE');
                                break;
                            case 1:
                                currentWaterLevel += this.t('TREND_RISING');
                                break;
                            case -999:
                                console.log('Tendenz kann nicht ermittelt werden.');
                                break;
                            default:
                                console.error('Undefinierte Tendenz:', result.currentMeasurement.trend);
                            }
                            currentWaterLevel += '.';

                            const speechOutput = currentWaterLevel;
                            var cardContent = currentWaterLevel;
                            if (result.currentMeasurement.timestamp) {
                                const measurementTimeDesc =
                                    util.getTimeDesc(
                                        new Date(result.currentMeasurement.timestamp),
                                        this.event.request.locale);
                                cardContent = 'Messung von ' + measurementTimeDesc + ' Uhr: ' + cardContent;
                            }

                            const imageObj = {
                                smallImageUrl: result.smallImageUrl,
                                largeImageUrl: result.largeImageUrl,
                            };

                            console.log(speechOutput);
                            this.emit(':tellWithCard', speechOutput, 'Pegel bei ' + result.station, cardContent, imageObj);
                        } else {
                            console.error('Error getting current measurement', err);
                            this.emit(':tell', this.t('NO_RESULT_MESSAGE'));
                        }
                    });
                };
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

exports.handler = (event, context, callback) => {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
