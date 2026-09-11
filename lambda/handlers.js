import { readFileSync } from 'node:fs';
import winston from 'winston';

import * as manager from './manager.js';
import { normalizeStation } from './utils.js';
import { createRequestSignal } from './request-budget.js';
import { resolveSlot, getElicitSlotPrompt } from './slot-resolution.js';
import { renderMeasurement } from './presentation.js';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [new winston.transports.Console({ format: winston.format.simple() })],
    exitOnError: false,
});
const stationVariants = JSON.parse(readFileSync(new URL('./stationVariants.json', import.meta.url), 'utf8'));

function elicit(handlerInput, slot, prompt, reprompt = prompt) {
    return handlerInput.responseBuilder.speak(prompt).reprompt(reprompt).addElicitSlotDirective(slot).getResponse();
}

async function stationForWater(handlerInput, water, signal) {
    const stations = await manager.getStations(water, { signal });
    if (!Array.isArray(stations)) throw new Error('Invalid station catalog');
    if (stations.length === 0) {
        const { t } = handlerInput.attributesManager.getRequestAttributes();
        return { response: handlerInput.responseBuilder.speak(t('UNKNOWN_WATER_MESSAGE')).getResponse() };
    }
    if (stations.length === 1) {
        const station = stations[0];
        return { ...normalizeStation(station.longname, station.water.longname), id: station.uuid };
    }
    const prompt = stations.length <= 5
        ? getElicitSlotPrompt('Welche Messstelle', stations.map(station => normalizeStation(station.longname, water, true).name))
        : 'Es gibt zu viele Messstellen an diesem Gewässer, bitte nenne eine konkrete, z.B. ' +
            normalizeStation(stations[3].longname, water).name + '?';
    return { response: elicit(handlerInput, 'station', prompt, stations.length <= 5 ? prompt : 'Welche Messstelle?') };
}

/** Resolve a gauge, then retrieve and present its measurement. */
export async function handleQueryWaterLevelIntent(handlerInput) {
    const signal = createRequestSignal(handlerInput.context);
    const request = handlerInput.requestEnvelope.request;
    const slots = request.intent.slots ?? {};
    const { t } = handlerInput.attributesManager.getRequestAttributes();
    const station = resolveSlot(slots.station, { requireId: true });
    const water = resolveSlot(slots.water);
    const variant = resolveSlot(slots.variant);

    for (const [slot, resolution, prefix, unknown] of [
        ['station', station, 'Welche Messstelle', 'UNKNOWN_STATION_MESSAGE'],
        ['water', water, 'Welches Gewässer', 'UNKNOWN_WATER_MESSAGE'],
    ]) {
        if (resolution.status === 'unknown') return handlerInput.responseBuilder.speak(t(unknown)).getResponse();
        if (resolution.status === 'error') return elicit(handlerInput, slot, prefix + '?');
        if (resolution.status === 'ambiguous') {
            return elicit(handlerInput, slot, getElicitSlotPrompt(prefix, resolution.candidates.map(value => value.name)));
        }
    }
    if (station.status !== 'matched' && water.status !== 'matched') {
        return request.dialogState === 'COMPLETED'
            ? elicit(handlerInput, 'station', 'Welche Messstelle?')
            : handlerInput.responseBuilder.addDelegateDirective().getResponse();
    }

    try {
        const gauge = station.status === 'matched'
            ? { ...station.value, variant: variant.value?.name }
            : await stationForWater(handlerInput, water.value.name, signal);
        if (gauge.response) return gauge.response;
        if (typeof gauge.id !== 'string' || !gauge.id) throw new Error('Missing gauge ID');
        if (gauge.id.startsWith('*')) {
            const variants = stationVariants[gauge.name];
            if (!Array.isArray(variants) || variants.length === 0) throw new Error('Missing station variant mapping');
            const selected = variants.find(value => value.split(':')[0] === gauge.variant);
            if (!selected) {
                return elicit(handlerInput, 'variant', getElicitSlotPrompt('Welcher Pegel',
                    variants.map(value => gauge.name + ' ' + value.split(':')[0])));
            }
            gauge.id = selected.split(':')[1];
            if (!gauge.id) throw new Error('Missing variant gauge ID');
        }
        const measurement = await manager.getCurrentMeasurement(gauge.id, { signal });
        return renderMeasurement(handlerInput, gauge.name + (gauge.variant ? ' ' + gauge.variant : ''), measurement);
    } catch (error) {
        logger.error(error.stack || error.toString());
        return handlerInput.responseBuilder.speak(t('NO_RESULT_MESSAGE')).getResponse();
    }
}
