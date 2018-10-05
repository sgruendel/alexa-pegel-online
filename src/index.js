'use strict';

const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const dashbot = process.env.DASHBOT_API_KEY ? require('dashbot')(process.env.DASHBOT_API_KEY).alexa : undefined;

const manager = require('./manager');
const util = require('./util');

const SKILL_ID = 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1';
const ER_SUCCESS_MATCH = 'ER_SUCCESS_MATCH';
const ER_SUCCESS_NO_MATCH = 'ER_SUCCESS_NO_MATCH';
const languageStrings = {
    de: {
        translation: {
            CURRENT_WATER_LEVEL_MESSAGE: 'Der Wasserstand bei {{slots.station.value}} beträgt {{result.currentMeasurement.value}} {{result.unit}}',
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
        const { request } = handlerInput.requestEnvelope;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryStationIntent';
    },
    async handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        // delegate to Alexa to collect all the required slots
        if (request.dialogState && request.dialogState !== 'COMPLETED') {
            console.log('dialog state is', request.dialogState, '=> adding delegate directive');
            return handlerInput.responseBuilder
                .addDelegateDirective()
                .getResponse();
        }

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const { slots } = request.intent;

        console.log('station', JSON.stringify(slots.station));
        const rpa = slots.station
            && slots.station.resolutions
            && slots.station.resolutions.resolutionsPerAuthority[0];
        switch (rpa.status.code) {
        case ER_SUCCESS_NO_MATCH:
            console.error('no match for station', slots.station.value);
            const speechOutput = requestAttributes.t('UNKNOWN_STATION_MESSAGE');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();

        case ER_SUCCESS_MATCH:
            if (rpa.values.length > 1) {
                var prompt = 'Welche Messstelle';
                const size = rpa.values.length;

                rpa.values.forEach((element, index) => {
                    prompt += ((index === size - 1) ? ' oder ' : ', ') + element.value.name;
                });

                prompt += '?';
                return handlerInput.responseBuilder
                    .speak(prompt)
                    .reprompt(prompt)
                    .addElicitSlotDirective(slots.station.name)
                    .getResponse();
            }
            break;

        default:
            console.error('unexpected status code', rpa.status.code);
        }

        const uuid = rpa.values[0].value.id;
        try {
            const result = await manager.getCurrentMeasurement(uuid);

            result.currentMeasurement.value = result.currentMeasurement.value.toString().replace('.', ',');
            var currentWaterLevel = requestAttributes.t('CURRENT_WATER_LEVEL_MESSAGE', { result, slots });
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
                        request.locale)
                    + ' Uhr';
                cardContent = measurementTime + ': ' + cardContent;
            }

            const title = 'Pegel bei ' + slots.station.value;
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
        const { request } = handlerInput.requestEnvelope;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryWaterIntent';
    },
    async handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        // delegate to Alexa to collect all the required slots
        if (request.dialogState && request.dialogState !== 'COMPLETED') {
            console.log('dialog state is', request.dialogState, '=> adding delegate directive');
            return handlerInput.responseBuilder
                .addDelegateDirective()
                .getResponse();
        }

        // const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const { slots } = request.intent;

        console.log('water', JSON.stringify(slots.water));

        return handlerInput.responseBuilder
            .speak('Gewässer in Arbeit.')
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
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
        const { request } = handlerInput.requestEnvelope;
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

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        QueryStationIntentHandler,
        QueryWaterIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addRequestInterceptors(LocalizationInterceptor)
    .addErrorHandlers(ErrorHandler)
    .withSkillId(SKILL_ID)
    .lambda();
if (dashbot) exports.handler = dashbot.handler(exports.handler);
