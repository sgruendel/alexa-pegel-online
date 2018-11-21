'use strict';

const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const dashbot = process.env.DASHBOT_API_KEY ? require('dashbot')(process.env.DASHBOT_API_KEY).alexa : undefined;
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
    exitOnError: false,
});

const manager = require('./manager');
const utils = require('./utils');
const stationVariants = require('./stationVariants.json');

const SKILL_ID = 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1';
const ER_SUCCESS_MATCH = 'ER_SUCCESS_MATCH';
const ER_SUCCESS_NO_MATCH = 'ER_SUCCESS_NO_MATCH';
const NORMAL = 'Normal';

const languageStrings = {
    de: {
        translation: {
            HELP_MESSAGE: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstelle, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Welche Messstelle soll ich abfragen?',
            STOP_MESSAGE: '<say-as interpret-as="interjection">bis dann</say-as>.',
            NOT_UNDERSTOOD_MESSAGE: 'Entschuldigung, das verstehe ich nicht. Bitte wiederhole das?',
            CURRENT_WATER_LEVEL_MESSAGE: 'Der Wasserstand bei {{stationVariant}} beträgt {{result.currentMeasurement.value}} {{result.unit}}',
            TREND_RISING: ', die Tendenz ist steigend',
            TREND_FALLING: ', die Tendenz ist fallend',
            TREND_STABLE: ', die Tendenz ist gleichbleibend',
            NO_RESULT_MESSAGE: 'Ich kann diesen Messwert zur Zeit leider nicht bestimmen.',
            UNKNOWN_STATION_MESSAGE: 'Ich kenne diese Messstelle leider nicht.',
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

const QueryWaterLevelIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryWaterLevelIntent';
    },
    async handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        // delegate to Alexa to collect all the required slots
        if (request.dialogState && request.dialogState !== 'COMPLETED') {
            logger.debug('dialog state is ' + request.dialogState + ' => adding delegate directive');
            return handlerInput.responseBuilder
                .addDelegateDirective()
                .getResponse();
        }

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = request.intent && request.intent.slots;
        const rpaStation = slots
            && slots.station
            && slots.station.resolutions
            && slots.station.resolutions.resolutionsPerAuthority[0];
        if (!rpaStation) {
            return handlerInput.responseBuilder
                .speak('Welche Messstelle?')
                .reprompt(requestAttributes.t('HELP_REPROMPT'))
                .getResponse();
        }

        switch (rpaStation.status.code) {
        case ER_SUCCESS_NO_MATCH:
            logger.error('no match for station ' + slots.station.value);
            const speechOutput = requestAttributes.t('UNKNOWN_STATION_MESSAGE');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();

        case ER_SUCCESS_MATCH:
            if (rpaStation.values.length > 1) {
                var prompt = 'Welche Messstelle';
                const size = rpaStation.values.length;

                rpaStation.values.forEach((element, index) => {
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
            logger.error('unexpected status code ' + rpaStation.status.code);
        }

        const rpaVariant = slots
            && slots.variant
            && slots.variant.resolutions
            && slots.variant.resolutions.resolutionsPerAuthority[0];
        var variant;
        if (rpaVariant) {
            switch (rpaVariant.status.code) {
            case ER_SUCCESS_NO_MATCH:
                logger.error('no match for variant ' + slots.variant.value);
                break;

            case ER_SUCCESS_MATCH:
                if (rpaVariant.values.length > 1) {
                    logger.error('multiple matches for variant ' + slots.variant.value);
                }
                variant = rpaVariant.values[0].value.name;
                break;

            default:
                logger.error('unexpected status code ' + rpaVariant.status.code);
            }
        }

        const station = rpaStation.values[0].value.name;
        const uuid = rpaStation.values[0].value.id;
        logger.debug('using station ' + station + ', uuid ' + uuid);

        var uuidForVariant;
        if (uuid.startsWith('*')) {
            // Need to start slot elicitation for variants
            const variantsIds = stationVariants[station];
            logger.info('station variants/ids', variantsIds);
            prompt = 'Welche Variante';
            const size = variantsIds.length;

            variantsIds.forEach((elt, index) => {
                const variantId = elt.split(':');
                const variantName = variantId[0] || NORMAL;
                prompt += ((index === size - 1) ? ' oder ' : ', ') + station + ' ' + variantName;
                if ((variant === variantName) || (variant === '' && variantName === NORMAL)) {
                    uuidForVariant = variantId[1];
                    logger.info('found uuid ' + uuidForVariant + ' for variant ' + variantName);
                }
            });

            if (uuidForVariant) {
                logger.debug('using variant ' + variant + ', uuid ' + uuidForVariant);
            } else {
                prompt += '?';
                logger.info('eliciting variant slot: ' + prompt);
                return handlerInput.responseBuilder
                    .speak(prompt)
                    .reprompt(prompt)
                    .addElicitSlotDirective('variant')
                    .getResponse();
            }
        }

        try {
            const stationVariant = station + (variant ? (' ' + variant) : '');
            const result = await manager.getCurrentMeasurement(uuidForVariant || uuid);

            result.currentMeasurement.value = result.currentMeasurement.value.toString().replace('.', ',');
            var currentWaterLevel = requestAttributes.t('CURRENT_WATER_LEVEL_MESSAGE', { stationVariant, result });
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
                logger.debug('Tendenz kann nicht ermittelt werden.');
                break;
            default:
                logger.error('Undefinierte Tendenz: ' + result.currentMeasurement.trend);
            }
            currentWaterLevel += '.';

            const speechOutput = currentWaterLevel;
            logger.debug(speechOutput);

            var measurementTime;
            var cardContent = currentWaterLevel;
            if (result.currentMeasurement.timestamp) {
                measurementTime = 'Messung von '
                    + utils.getTimeDesc(
                        new Date(result.currentMeasurement.timestamp),
                        request.locale)
                    + ' Uhr';
                cardContent = measurementTime + ': ' + cardContent;
            }

            const title = 'Pegel bei ' + stationVariant;
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
            logger.error(err.stack || err.toString());
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('NO_RESULT_MESSAGE'))
                .getResponse();
        }
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        return handlerInput.responseBuilder
            .speak(requestAttributes.t('HELP_MESSAGE'))
            .reprompt(requestAttributes.t('HELP_REPROMPT'))
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
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

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
        const { request } = handlerInput.requestEnvelope;
        try {
            if (request.reason === 'ERROR') {
                logger.error(request.error.type + ': ' + request.error.message);
            }
        } catch (err) {
            logger.error(err.stack || err.toString(), request);
        }

        logger.debug('session ended', request);
        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const { request } = handlerInput.requestEnvelope;
        logger.error(error.stack || error.toString(), request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speechOutput = requestAttributes.t('NOT_UNDERSTOOD_MESSAGE');
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
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
        QueryWaterLevelIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addRequestInterceptors(LocalizationInterceptor)
    .addErrorHandlers(ErrorHandler)
    .withSkillId(SKILL_ID)
    .lambda();
if (dashbot) exports.handler = dashbot.handler(exports.handler);
