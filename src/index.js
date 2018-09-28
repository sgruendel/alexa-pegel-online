'use strict';

const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).alexa;

const manager = require('./manager');
const util = require('./util');

const SKILL_ID = 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1';
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

// returns true if the skill is running on a device with a display (show|spot)
function supportsDisplay(handlerInput) {
    const { context } = handlerInput.requestEnvelope;
    return context
        && context.System
        && context.System.device
        && context.System.device.supportedInterfaces
        && context.System.device.supportedInterfaces.Display;
}

const QueryStationIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryStationIntent';
    },
    async handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

        const slots = handlerInput.requestEnvelope.request.intent.slots;
        console.log('Station', slots.station);
        if (!slots.station.value) {
            console.error('No slot value given for station');
            const speechOutput = requestAttributes.t('UNKNOWN_STATION_MESSAGE');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }

        console.log('searching for station', slots.station.value);
        const uuids = await manager.findUuidsFor(slots.station.value);
        if (!uuids) {
            const speechOutput = requestAttributes.t('UNKNOWN_STATION_MESSAGE');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }

        try {
            const result = await manager.currentMeasurementForUuids(uuids);
            result.currentMeasurement.value = result.currentMeasurement.value.toString().replace('.', ',');

            const title = 'Pegel bei ' + result.station;

            var currentWaterLevel = requestAttributes.t('CURRENT_WATER_LEVEL_MESSAGE', { result });
            switch (result.currentMeasurement.trend) {
            case -1:
                currentWaterLevel += requestAttributes.t('TREND_FALLING');
                break;
            case 0:
                currentWaterLevel += requestAttributes.t('TREND_STABLE');
                break;
            case 1:
                currentWaterLevel += requestAttributes.t('TREND_RISING');
                break;
            case -999:
                console.log('Tendenz kann nicht ermittelt werden.');
                break;
            default:
                console.error('Undefinierte Tendenz:', result.currentMeasurement.trend);
            }
            currentWaterLevel += '.';

            const speechOutput = currentWaterLevel;
            console.log(speechOutput);

            var measurementTime;
            var cardContent = currentWaterLevel;
            if (result.currentMeasurement.timestamp) {
                measurementTime = 'Messung von '
                    + util.getTimeDesc(
                        new Date(result.currentMeasurement.timestamp),
                        handlerInput.requestEnvelope.request.locale)
                    + ' Uhr';
                cardContent = measurementTime + ': ' + cardContent;
            }

            if (supportsDisplay(handlerInput)) {
                const measurementImage = new Alexa.ImageHelper()
                    .withDescription('Wasserstandsdaten')
                    .addImageInstance(result.image.xsmall.url, 'X_SMALL', result.image.xsmall.width, result.image.xsmall.height)
                    .addImageInstance(result.image.medium.url, 'MEDIUM', result.image.medium.width, result.image.medium.height)
                    .getImage();
                const textContent = new Alexa.PlainTextContentHelper()
                    .withPrimaryText(speechOutput)
                    .withSecondaryText(measurementTime)
                    .getTextContent();
                handlerInput.responseBuilder
                    .addRenderTemplateDirective({
                        type: 'BodyTemplate2',
                        backButton: 'HIDDEN',
                        image: measurementImage,
                        title: title,
                        textContent: textContent,
                    });
            }
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .withStandardCard(title, cardContent, result.image.small.url, result.image.large.url)
                .getResponse();
        } catch (err) {
            console.error('Error getting current measurement', err);
            const speechOutput = requestAttributes.t('NO_RESULT_MESSAGE');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }
    },
};

const QueryWaterIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryWaterIntent';
    },
    async handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

        const slots = handlerInput.requestEnvelope.request.intent.slots;
        console.log('Water', slots.water);
        if (!slots.water.value) {
            console.error('No slot value given for water');
            const speechOutput = requestAttributes.t('UNKNOWN_STATION_MESSAGE');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }

        console.log('searching for water', slots.water.value);
        return handlerInput.responseBuilder
            .speak('Gewässer in Arbeit.')
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speechOutput = requestAttributes.t('HELP_MESSAGE');
        const repromptSpeechOutput = requestAttributes.t('HELP_REPROMPT');
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptSpeechOutput)
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speechOutput = requestAttributes.t('STOP_MESSAGE');
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log('Session ended with reason:', handlerInput.requestEnvelope.request.reason);
        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error('Error handled:', error);
        return handlerInput.responseBuilder
            .speak('Entschuldigung, das verstehe ich nicht. Bitte wiederholen Sie das?')
            .reprompt('Entschuldigung, das verstehe ich nicht. Bitte wiederholen Sie das?')
            .getResponse();
    },
};

const LocalizationInterceptor = {
    process(handlerInput) {
        const localizationClient = i18n.use(sprintf).init({
            lng: handlerInput.requestEnvelope.request.locale,
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languageStrings,
            returnObjects: true,
        });

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = (...args) => {
            return localizationClient.t(...args);
        };
    },
};

exports.handler = dashbot.handler(
    Alexa.SkillBuilders.custom()
        .addRequestHandlers(
            QueryStationIntentHandler,
            QueryWaterIntentHandler,
            HelpIntentHandler,
            CancelAndStopIntentHandler,
            SessionEndedRequestHandler)
        .addRequestInterceptors(LocalizationInterceptor)
        .addErrorHandlers(ErrorHandler)
        .withSkillId(SKILL_ID)
        .lambda());
