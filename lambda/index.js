import Alexa from 'ask-sdk-core';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';
import winston from 'winston';
import * as handlers from './handlers.js';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
    exitOnError: false,
});

const SKILL_ID = 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1';

const languageStrings = {
    de: {
        translation: {
            HELP_MESSAGE:
                'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstelle, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
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

i18next.use(sprintf).init({
    overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
    resources: languageStrings,
    returnObjects: true,
});

const QueryWaterLevelIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryWaterLevelIntent';
    },
    async handle(handlerInput) {
        return handlers.handleQueryWaterLevelIntent(handlerInput);
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        return (
            request.type === 'LaunchRequest' ||
            (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent')
        );
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
        return (
            request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent')
        );
    },
    handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speechOutput = requestAttributes.t('STOP_MESSAGE');
        return handlerInput.responseBuilder.speak(speechOutput).getResponse();
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
        return handlerInput.responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

const LocalizationInterceptor = {
    process(handlerInput) {
        i18next.changeLanguage(Alexa.getLocale(handlerInput.requestEnvelope));

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = (...args) => {
            // @ts-ignore
            return i18next.t(...args);
        };
    },
};

let skill;

export const handler = async function (event, context) {
    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .addRequestHandlers(
                QueryWaterLevelIntentHandler,
                HelpIntentHandler,
                CancelAndStopIntentHandler,
                SessionEndedRequestHandler,
            )
            .addRequestInterceptors(LocalizationInterceptor)
            .addErrorHandlers(ErrorHandler)
            .withSkillId(SKILL_ID)
            .create();
    }

    return skill.invoke(event, context);
};
