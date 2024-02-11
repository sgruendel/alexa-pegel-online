import Alexa from 'ask-sdk-core';
// eslint-disable-next-line no-unused-vars -- needed for typedefs
import services from 'ask-sdk-model';
import fs from 'fs';
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
    exitOnError: false,
});

import * as manager from './manager.js';
import * as utils from './utils.js';

/** @type {Object.<string,  string[]>} */
// @ts-ignore
const stationVariants = JSON.parse(fs.readFileSync('./stationVariants.json'));

const ER_SUCCESS_MATCH = 'ER_SUCCESS_MATCH';
const ER_SUCCESS_NO_MATCH = 'ER_SUCCESS_NO_MATCH';
const COMPLETED = 'COMPLETED';

function getElicitSlotPrompt(prefix, values, getNameForElement) {
    let result = prefix;
    const size = values.length;
    values.forEach((element, index) => {
        result += (index === size - 1 ? ' oder ' : ', ') + getNameForElement(element);
    });
    return result + '?';
}

/**
 * The function `handleQueryWaterLevelIntent` is an async function that handles the intent to query the
 * water level.
 * @param {Alexa.HandlerInput} handlerInput - The `handlerInput` parameter is an object that contains information about the
 * current request and response. It includes properties such as `requestEnvelope` (which contains the
 * request data), `attributesManager` (which allows you to get and set session attributes), and
 * `responseBuilder` (which helps you build
 * @returns The function `handleQueryWaterLevelIntent` returns a response object that is built using
 * the `handlerInput.responseBuilder` methods. The response object includes the speech output, card
 * content, and any directives for APL (Alexa Presentation Language) if supported.
 */
export async function handleQueryWaterLevelIntent(handlerInput) {
    /** @type {services.IntentRequest} */
    // @ts-ignore
    const { request } = handlerInput.requestEnvelope;
    logger.debug('request', request);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    /** @type {services.Intent} */
    const intent = request.intent;
    const slots = intent && intent.slots;

    const rpaStation =
        slots && slots.station && slots.station.resolutions && slots.station.resolutions.resolutionsPerAuthority[0];
    let station;
    if (rpaStation) {
        switch (rpaStation.status.code) {
            case ER_SUCCESS_NO_MATCH:
                logger.error('no match for station ' + slots.station.value);
                const speechOutput = requestAttributes.t('UNKNOWN_STATION_MESSAGE');
                return handlerInput.responseBuilder.speak(speechOutput).getResponse();

            case ER_SUCCESS_MATCH:
                // If we have only one match or an exact match, we use it.
                if (
                    rpaStation.values.length === 1 ||
                    rpaStation.values[0].value.name.toLowerCase() === slots.station.value.toLowerCase()
                ) {
                    station = rpaStation.values[0].value.name;
                    logger.debug('using station ' + station);
                    break;
                }
                const prompt = getElicitSlotPrompt('Welche Messstelle', rpaStation.values, (elt) => {
                    return elt.value.name;
                });
                logger.info('eliciting station slot: ' + prompt);
                return handlerInput.responseBuilder
                    .speak(prompt)
                    .reprompt(prompt)
                    .addElicitSlotDirective(slots.station.name)
                    .getResponse();

            default:
                logger.error('unexpected status code ' + rpaStation.status.code);
        }
    }

    const rpaVariant =
        slots && slots.variant && slots.variant.resolutions && slots.variant.resolutions.resolutionsPerAuthority[0];
    let variant;
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

    const rpaWater =
        slots && slots.water && slots.water.resolutions && slots.water.resolutions.resolutionsPerAuthority[0];
    /** @type {string} */
    let water;
    if (rpaWater) {
        switch (rpaWater.status.code) {
            case ER_SUCCESS_NO_MATCH:
                logger.error('no match for water ' + slots.water.value);
                const speechOutput = requestAttributes.t('UNKNOWN_WATER_MESSAGE');
                return handlerInput.responseBuilder.speak(speechOutput).getResponse();

            case ER_SUCCESS_MATCH:
                // If we have only one match or an exact match, we use it.
                if (rpaWater.values.length === 1 || rpaWater.values[0].value.name.toLowerCase() === slots.water.value) {
                    water = rpaWater.values[0].value.name;
                    logger.debug('using water ' + water);
                    break;
                }
                const prompt = getElicitSlotPrompt('Welches Gewässer', rpaWater.values, (elt) => {
                    return elt.value.name;
                });
                logger.info('eliciting water slot: ' + prompt);
                return handlerInput.responseBuilder
                    .speak(prompt)
                    .reprompt(prompt)
                    .addElicitSlotDirective(slots.water.name)
                    .getResponse();

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
        return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    }

    let uuidForWater;
    if (!station) {
        try {
            const result = await manager.getStations(water);
            const size = result.length;
            if (size === 0) {
                return handlerInput.responseBuilder.speak(requestAttributes.t('UNKNOWN_WATER_MESSAGE')).getResponse();
            } else if (size === 1) {
                const stationVariant = utils.normalizeStation(result[0].longname, result[0].water.longname);
                station = stationVariant.name;
                variant = stationVariant.variant;
                uuidForWater = result[0].uuid;
            } else if (size <= 5) {
                const prompt = getElicitSlotPrompt(
                    'Welche Messstelle',
                    result,
                    (elt) => utils.normalizeStation(elt.longname, water, true).name,
                );
                logger.info('eliciting station slot: ' + prompt);
                return handlerInput.responseBuilder
                    .speak(prompt)
                    .reprompt(prompt)
                    .addElicitSlotDirective(slots.station.name)
                    .getResponse();
            } else {
                return handlerInput.responseBuilder
                    .speak(
                        requestAttributes.t(
                            'Es gibt zu viele Messstellen an diesem Gewässer, bitte nenne eine konkrete, z.B. ' +
                                utils.normalizeStation(result[3].longname, water).name +
                                '?',
                        ),
                    )
                    .reprompt('Welche Messstelle?')
                    .addElicitSlotDirective(slots.station.name)
                    .getResponse();
            }
        } catch (err) {
            logger.error(err.stack || err.toString());
            return handlerInput.responseBuilder.speak(requestAttributes.t('NO_RESULT_MESSAGE')).getResponse();
        }
    }
    const uuid = uuidForWater || rpaStation.values[0].value.id;
    logger.debug('using station ' + station + ', uuid ' + uuid);

    let uuidForVariant;
    if (uuid.startsWith('*')) {
        // Need to start slot elicitation for variants
        const variantsIds = stationVariants[station];
        logger.info('station variants/ids', variantsIds);

        const prompt = getElicitSlotPrompt('Welcher Pegel', variantsIds, (elt) => station + ' ' + elt.split(':')[0]);
        const variantId = variantsIds.find((elt) => variant === elt.split(':')[0]);
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
        const stationVariant = station + (variant ? ' ' + variant : '');
        const result = await manager.getCurrentMeasurement(uuidForVariant || uuid);

        const formattedValue = result.currentMeasurement.value.toString().replace('.', ',');
        let currentWaterLevel = requestAttributes.t(
            'CURRENT_WATER_LEVEL_MESSAGE',
            stationVariant,
            formattedValue,
            result.unit,
        );
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
            // trend no longer is available, so just ignore
            // logger.error('Undefinierte Tendenz: ' + result.currentMeasurement.trend);
        }
        currentWaterLevel += '.';

        const speechOutput = currentWaterLevel;
        logger.debug(speechOutput);

        let measurementTime;
        let cardContent = currentWaterLevel;
        if (result.currentMeasurement.timestamp) {
            measurementTime =
                'Messung von ' +
                utils.getTimeDesc(
                    new Date(result.currentMeasurement.timestamp),
                    Alexa.getLocale(handlerInput.requestEnvelope),
                ) +
                ' Uhr';
            cardContent = measurementTime + ': ' + cardContent;
        }
        logger.info(cardContent);

        const title = 'Pegel bei ' + stationVariant;
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            const document = {
                type: 'APL',
                version: '1.6',
                import: [
                    {
                        name: 'alexa-layouts',
                        version: '1.3.0',
                    },
                ],
                mainTemplate: {
                    parameters: ['detailTemplateData'],
                    item: [
                        {
                            type: 'AlexaDetail',
                            headerTitle: '${detailTemplateData.headerTitle}',
                            primaryText: '${detailTemplateData.primaryText}',
                            secondaryText: '${detailTemplateData.secondaryText}',
                            imageSource: '${detailTemplateData.imageSource}',
                        },
                    ],
                },
            };
            const datasources = {
                detailTemplateData: {
                    headerTitle: title,
                    primaryText: speechOutput,
                    secondaryText: measurementTime,
                    imageSource: result.image.medium.url,
                },
            };
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.1',
                document,
                datasources,
            });
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withStandardCard(title, cardContent, result.image.small.url, result.image.large.url)
            .getResponse();
    } catch (err) {
        logger.error(err.stack || err.toString());
        return handlerInput.responseBuilder.speak(requestAttributes.t('NO_RESULT_MESSAGE')).getResponse();
    }
}
