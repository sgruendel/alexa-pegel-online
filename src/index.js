'use strict';

const Alexa = require('ask-sdk-core');
const i18next = require('i18next');
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
const COMPLETED = 'COMPLETED';

const languageStrings = {
    de: {
        translation: {
            HELP_MESSAGE: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstelle, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Welche Messstelle soll ich abfragen?',
            STOP_MESSAGE: '<say-as interpret-as="interjection">bis dann</say-as>.',
            NOT_UNDERSTOOD_MESSAGE: 'Entschuldigung, das verstehe ich nicht. Bitte wiederhole das?',
            CURRENT_WATER_LEVEL_MESSAGE: 'Der Wasserstand bei %s beträgt %s %s',
            TREND_RISING: ', die Tendenz ist steigend',
            TREND_FALLING: ', die Tendenz ist fallend',
            TREND_STABLE: ', die Tendenz ist gleichbleibend',
            NO_RESULT_MESSAGE: 'Ich kann diesen Messwert zur Zeit leider nicht bestimmen.',
            UNKNOWN_STATION_MESSAGE: 'Ich kenne diese Messstelle leider nicht.',
            UNKNOWN_WATER_MESSAGE: 'Ich kenne dieses Gewässer leider nicht.',
        },
    },
};

function getElicitSlotPrompt(prefix, values, getNameForElement) {
    var result = prefix;
    const size = values.length;
    values.forEach((element, index) => {
        result += ((index === size - 1) ? ' oder ' : ', ') + getNameForElement(element);
    });
    return result + '?';
}

const QueryWaterLevelIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryWaterLevelIntent';
    },
    async handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = request.intent && request.intent.slots;

        const rpaStation = slots
            && slots.station
            && slots.station.resolutions
            && slots.station.resolutions.resolutionsPerAuthority[0];
        var station;
        if (rpaStation) {
            switch (rpaStation.status.code) {
            case ER_SUCCESS_NO_MATCH:
                logger.error('no match for station ' + slots.station.value);
                const speechOutput = requestAttributes.t('UNKNOWN_STATION_MESSAGE');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();

            case ER_SUCCESS_MATCH:
                if (rpaStation.values.length > 1) {
                    const prompt = getElicitSlotPrompt('Welche Messstelle', rpaStation.values, elt => { return elt.value.name; });
                    logger.info('eliciting station slot: ' + prompt);
                    return handlerInput.responseBuilder
                        .speak(prompt)
                        .reprompt(prompt)
                        .addElicitSlotDirective(slots.station.name)
                        .getResponse();
                }
                station = rpaStation.values[0].value.name;
                logger.debug('using station ' + station);
                break;

            default:
                logger.error('unexpected status code ' + rpaStation.status.code);
            }
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
                logger.debug('using variant ' + variant);
                break;

            default:
                logger.error('unexpected status code ' + rpaVariant.status.code);
            }
        }

        const rpaWater = slots
            && slots.water
            && slots.water.resolutions
            && slots.water.resolutions.resolutionsPerAuthority[0];
        var water;
        if (rpaWater) {
            switch (rpaWater.status.code) {
            case ER_SUCCESS_NO_MATCH:
                logger.error('no match for water ' + slots.water.value);
                const speechOutput = requestAttributes.t('UNKNOWN_WATER_MESSAGE');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();

            case ER_SUCCESS_MATCH:
                if (rpaWater.values.length > 1 && rpaWater.values[0].value.name.toLowerCase() !== slots.water.value) {
                    const prompt = getElicitSlotPrompt('Welches Gewässer', rpaWater.values, elt => { return elt.value.name; });
                    logger.info('eliciting water slot: ' + prompt);
                    return handlerInput.responseBuilder
                        .speak(prompt)
                        .reprompt(prompt)
                        .addElicitSlotDirective(slots.water.name)
                        .getResponse();
                }
                water = rpaWater.values[0].value.name;
                logger.debug('using water ' + water);
                break;

            default:
                logger.error('unexpected status code ' + rpaWater.status.code);
            }
        }

        if (station || water) {
            logger.debug('setting dialog state from ' + request.dialogState + ' to ' + COMPLETED);
            request.dialogState = COMPLETED;
        }
        // delegate to Alexa to collect all the required slots
        if (request.dialogState !== COMPLETED) {
            logger.debug('dialog state is ' + request.dialogState + ' => adding delegate directive');
            return handlerInput.responseBuilder
                .addDelegateDirective()
                .getResponse();
        }

        var uuidForWater;
        if (!station) {
            try {
                const result = await manager.getStations(water);
                const size = result.length;
                if (size === 0) {
                    return handlerInput.responseBuilder
                        .speak(requestAttributes.t('UNKNOWN_WATER_MESSAGE'))
                        .getResponse();
                } else if (size === 1) {
                    const stationVariant = utils.normalizeStation(result[0].longname, result[0].water.longname);
                    station = stationVariant.name;
                    variant = stationVariant.variant;
                    uuidForWater = result[0].uuid;
                } else if (size <= 5) {
                    const prompt = getElicitSlotPrompt('Welche Messstelle', result, elt => { return utils.normalizeStation(elt.longname, water).name; });
                    logger.info('eliciting station slot: ' + prompt);
                    return handlerInput.responseBuilder
                        .speak(prompt)
                        .reprompt(prompt)
                        .addElicitSlotDirective(slots.station.name)
                        .getResponse();
                } else {
                    return handlerInput.responseBuilder
                        .speak(requestAttributes.t('Es gibt zu viele Messstellen an diesem Gewässer, bitte nenne eine konkrete, z.B. '
                            + utils.normalizeStation(result[3].longname, water).name + '?'))
                        .reprompt('Welche Messstelle?')
                        .addElicitSlotDirective(slots.station.name)
                        .getResponse();
                }
            } catch (err) {
                logger.error(err.stack || err.toString());
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('NO_RESULT_MESSAGE'))
                    .getResponse();
            }
        }
        const uuid = uuidForWater || rpaStation.values[0].value.id;
        logger.debug('using station ' + station + ', uuid ' + uuid);

        var uuidForVariant;
        if (uuid.startsWith('*')) {
            // Need to start slot elicitation for variants
            const variantsIds = stationVariants[station];
            logger.info('station variants/ids', variantsIds);

            const prompt = getElicitSlotPrompt('Welcher Pegel', variantsIds, elt => { return station + ' ' + elt.split(':')[0]; });
            const variantId = variantsIds.find(elt => { return variant === elt.split(':')[0]; });
            if (variantId) {
                uuidForVariant = variantId.split(':')[1];
            } else {
                logger.info('eliciting variant slot: ' + prompt);
                return handlerInput.responseBuilder
                    .speak(prompt)
                    .reprompt(prompt)
                    .addElicitSlotDirective(slots.variant.name)
                    .getResponse();
            }
        }

        try {
            const stationVariant = station + (variant ? (' ' + variant) : '');
            const result = await manager.getCurrentMeasurement(uuidForVariant || uuid);

            result.currentMeasurement.value = result.currentMeasurement.value.toString().replace('.', ',');
            var currentWaterLevel = requestAttributes.t('CURRENT_WATER_LEVEL_MESSAGE', stationVariant, result.currentMeasurement.value, result.unit);
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
                        Alexa.getLocale(handlerInput.requestEnvelope))
                    + ' Uhr';
                cardContent = measurementTime + ': ' + cardContent;
            }
            logger.info(cardContent);

            const title = 'Pegel bei ' + stationVariant;
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope).Display) {
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
        logger.error(error.stack || error.toString(), handlerInput.requestEnvelope.request);
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
        i18next.use(sprintf).init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languageStrings,
            returnObjects: true,
        });

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = (...args) => {
            return i18next.t(...args);
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
