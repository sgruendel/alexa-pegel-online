/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');
const pegelonline = require('./pegelonlineRestAPI');

const APP_ID = 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1';

const languageStrings = {
    'de-DE': {
        translation: {
            HELP_MESSAGE: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstation“, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
        },
    },
};

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetWaterLevel');
    },
    'WaterLevelIntent': function () {
        this.emit('GetWaterLevel');
    },
    'GetWaterLevel': function () {
        var stationSlot = this.event.request.intent.slots.Station;
        var station;
        if (stationSlot && stationSlot.value) {
            station = stationSlot.value;
        }
        console.log("station: " + station);

        // TODO get station names via
        // curl -s http://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json | grep '^    "longname":' >/tmp/stations.txt
        // generate slot values by normalized short names/longnames, store mapping from slot value to uuid or list of uuid for OW/UW stations
        
        // TODO request stations via uuid, which is the only id guaranteed to remain unchanged
        
        // TODO Alexa dialog for UW/OW or UP/OP stations, or return both values
        
        // TODO return card including PNG graph

        var myRequest = station;
        pegelonline.getCurrentMeasurement(station, (err, result) => {
            // TODO add unit
            if (result) {
                this.emit(':tell', 'Der Wasserstand beträgt ' + result.currentMeasurement.value + ' ' + result.unit);
            }
        });
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_REPROMPT');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'SessionEndedRequest': function () {
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
