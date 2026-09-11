import Alexa from 'ask-sdk-core';
import { getTimeDesc } from './utils.js';

export function renderMeasurement(handlerInput, stationVariant, result) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
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
        default:
            // Missing and unknown trends do not change the measurement.
            break;
    }
    currentWaterLevel += '.';

    const speechOutput = currentWaterLevel;

    let measurementTime;
    let cardContent = currentWaterLevel;
    if (result.currentMeasurement.timestamp) {
        measurementTime =
            'Messung von ' +
            getTimeDesc(
                new Date(result.currentMeasurement.timestamp),
                Alexa.getLocale(handlerInput.requestEnvelope),
            ) +
            ' Uhr';
        cardContent = measurementTime + ': ' + cardContent;
    }

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
                imageSource: result.imageUrls.medium.url,
            },
        };
        handlerInput.responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: handlerInput.requestEnvelope.request.requestId,
            document,
            datasources,
        });
    }
    return handlerInput.responseBuilder
        .speak(speechOutput)
        .withStandardCard(title, cardContent, result.imageUrls.small.url, result.imageUrls.large.url)
        .getResponse();
}
