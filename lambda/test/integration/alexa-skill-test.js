import { expect } from 'chai';
import nock from 'nock';

import { handler } from '../../index.js';
import { BASE_URL, measurement, stations, STATION_UUID } from '../fixtures/pegelonline.js';
import { intentRequest, launchRequest, resolvedSlot, sessionEndedRequest, unresolvedSlot } from '../helpers/alexa.js';

const ANDERTEN_SLOT_ID = '*bc20d819-1782-4588-885d-129f21a27cf9';
const ANDERTEN_OBERWASSER_UUID = 'bc20d819-1782-4588-885d-129f21a27cf9';

function speech(responseEnvelope) {
    return responseEnvelope.response.outputSpeech.ssml;
}

describe('Pegel Online skill workflow', () => {
    it('handles a launch request', async () => {
        const result = await handler(launchRequest(), {});

        expect(speech(result)).to.contain('Wie kann ich dir helfen?');
        expect(result.response.reprompt.outputSpeech.ssml).to.contain('Welche Messstelle soll ich abfragen?');
        expect(result.response.shouldEndSession).to.equal(false);
    });

    it('handles the stop intent', async () => {
        const result = await handler(intentRequest('AMAZON.StopIntent'), {});

        expect(speech(result)).to.contain('bis dann');
        expect(result.response).to.not.have.property('reprompt');
        expect(result.response.shouldEndSession).to.equal(true);
    });

    it('handles the help intent', async () => {
        const result = await handler(intentRequest('AMAZON.HelpIntent'), {});

        expect(speech(result)).to.contain('Wie kann ich dir helfen?');
        expect(result.response.reprompt.outputSpeech.ssml).to.contain('Welche Messstelle soll ich abfragen?');
        expect(result.response.shouldEndSession).to.equal(false);
    });

    it('handles a session-ended request', async () => {
        const result = await handler(sessionEndedRequest('ERROR'), {});

        expect(result.response).to.not.have.property('outputSpeech');
        expect(result.response).to.not.have.property('reprompt');
        expect(result.response.shouldEndSession).to.equal(true);
    });

    it('uses the error handler for unsupported intents', async () => {
        const result = await handler(intentRequest('UnsupportedIntent'), {});

        expect(speech(result)).to.contain('Entschuldigung, das verstehe ich nicht.');
        expect(result.response.reprompt.outputSpeech.ssml).to.contain('Entschuldigung, das verstehe ich nicht.');
        expect(result.response.shouldEndSession).to.equal(false);
    });

    for (const state of ['STARTED', 'IN_PROGRESS']) {
        it(`delegates an empty ${state} dialog without mutating the request`, async () => {
            const event = intentRequest('QueryWaterLevelIntent', {}, state);
            const original = structuredClone(event);
            const result = await handler(event, {});
            expect(result.response.directives).to.deep.equal([{ type: 'Dialog.Delegate' }]);
            expect(event).to.deep.equal(original);
        });
    }

    it('asks for a station when a completed dialog has no usable slots', async () => {
        const result = await handler(intentRequest('QueryWaterLevelIntent'), {});
        expect(result.response.directives[0]).to.include({ type: 'Dialog.ElicitSlot', slotToElicit: 'station' });
    });

    it('re-elicits a station when entity resolution fails', async () => {
        const station = resolvedSlot('station', 'würzburg', [], 'ER_ERROR_TIMEOUT');
        const result = await handler(intentRequest('QueryWaterLevelIntent', { station }), {});
        expect(result.response.directives[0]).to.include({ type: 'Dialog.ElicitSlot', slotToElicit: 'station' });
    });

    it('reports a stale station variant mapping as unavailable data', async () => {
        const station = resolvedSlot('station', 'missing', [{ name: 'Missing', id: '*missing' }]);
        const result = await handler(intentRequest('QueryWaterLevelIntent', { station }), {});
        expect(speech(result)).to.contain('Ich kann diesen Messwert zur Zeit leider nicht bestimmen.');
    });

    it('elicits a variant and accepts the next turn in the same session', async () => {
        const station = resolvedSlot('station', 'anderten', [{ name: 'Anderten', id: ANDERTEN_SLOT_ID }]);
        const first = intentRequest('QueryWaterLevelIntent', { station, variant: unresolvedSlot('variant') }, 'STARTED');
        const result = await handler(first, {});
        expect(result.response.directives[0].slotToElicit).to.equal('variant');
        const second = intentRequest('QueryWaterLevelIntent', {
            station, variant: resolvedSlot('variant', 'oberwasser', [{ name: 'Oberwasser' }]),
        }, 'IN_PROGRESS', {
            sessionNew: false, sessionId: first.session.sessionId, sessionAttributes: result.sessionAttributes,
        });
        nock(BASE_URL).get(`/webservices/rest-api/v2/stations/${ANDERTEN_OBERWASSER_UUID}/W.json`)
            .query(true).reply(200, measurement());
        const answer = await handler(second, {});
        expect(speech(answer)).to.contain('Der Wasserstand bei Anderten Oberwasser beträgt');
        expect(second.request.dialogState).to.equal('IN_PROGRESS');
        expect(answer.response).not.to.have.property('directives');
    });

    for (const data of [{}, { unit: 'cm', currentMeasurement: { value: null } }, measurement({ timestamp: 'invalid' })]) {
        it('returns a friendly message for invalid measurement data', async () => {
            nock(BASE_URL).get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`).query(true).reply(200, data);
            const station = resolvedSlot('station', 'würzburg', [{ name: 'Würzburg', id: STATION_UUID }]);
            const result = await handler(intentRequest('QueryWaterLevelIntent', { station }), {});
            expect(speech(result)).to.contain('Ich kann diesen Messwert zur Zeit leider nicht bestimmen.');
        });
    }

    it('reports an unknown station', async () => {
        const station = resolvedSlot('station', 'unbekannt', [], 'ER_SUCCESS_NO_MATCH');

        const result = await handler(intentRequest('QueryWaterLevelIntent', { station }), {});

        expect(speech(result)).to.contain('Ich kenne diese Messstelle leider nicht.');
    });

    it('elicits a station when Alexa resolves multiple matches', async () => {
        const station = resolvedSlot('station', 'hamburg', [
            { name: 'Hamburg Harburg', id: 'harburg' },
            { name: 'Hamburg Sankt Pauli', id: 'sankt-pauli' },
        ]);

        const result = await handler(intentRequest('QueryWaterLevelIntent', { station }), {});

        expect(speech(result)).to.contain('Welche Messstelle, Hamburg Harburg oder Hamburg Sankt Pauli?');
        expect(result.response.directives[0]).to.include({ type: 'Dialog.ElicitSlot', slotToElicit: 'station' });
    });

    it('returns a water level for a resolved station', async () => {
        nock(BASE_URL)
            .get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`)
            .query({ prettyprint: 'false', includeCurrentMeasurement: 'true' })
            .reply(200, measurement());
        const station = resolvedSlot('station', 'würzburg', [{ name: 'Würzburg', id: STATION_UUID }]);

        const result = await handler(intentRequest('QueryWaterLevelIntent', { station }), {});

        expect(speech(result)).to.contain('Der Wasserstand bei Würzburg beträgt 182,4 cm, die Tendenz ist steigend.');
        expect(result.response.card).to.include({ type: 'Standard', title: 'Pegel bei Würzburg' });
        expect(result.response).not.to.have.property('directives');
    });

    it('renders a complete APL directive on screen devices', async () => {
        nock(BASE_URL)
            .get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`)
            .query({ prettyprint: 'false', includeCurrentMeasurement: 'true' })
            .reply(200, measurement());
        const station = resolvedSlot('station', 'würzburg', [{ name: 'Würzburg', id: STATION_UUID }]);
        const event = intentRequest('QueryWaterLevelIntent', { station }, 'COMPLETED', {
            supportedInterfaces: { 'Alexa.Presentation.APL': { runtime: { maxVersion: '1.6' } } },
        });

        const result = await handler(event, {});

        expect(result.response.directives).to.have.length(1);
        const directive = result.response.directives[0];
        expect(directive).to.have.all.keys('type', 'token', 'document', 'datasources');
        expect(directive.type).to.equal('Alexa.Presentation.APL.RenderDocument');
        expect(directive.token).to.equal(event.request.requestId);
        expect(directive.document).to.include({ type: 'APL', version: '1.6' });
        expect(directive.datasources.detailTemplateData).to.include({
            headerTitle: 'Pegel bei Würzburg',
            primaryText: 'Der Wasserstand bei Würzburg beträgt 182,4 cm, die Tendenz ist steigend.',
        });
        expect(directive.datasources.detailTemplateData.imageSource).to.contain(STATION_UUID);
        expect(result.response.card.type).to.equal('Standard');
    });

    for (const [trend, suffix] of [[-1, ', die Tendenz ist fallend.'], [0, ', die Tendenz ist gleichbleibend.'], [-999, '.'], [null, '.']]) {
        it(`formats measurement trend ${trend} without a timestamp`, async () => {
            nock(BASE_URL).get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`).query(true)
                .reply(200, measurement({ trend, timestamp: '' }));
            const station = resolvedSlot('station', 'würzburg', [{ name: 'Würzburg', id: STATION_UUID }]);
            const result = await handler(intentRequest('QueryWaterLevelIntent', { station }), {});
            expect(speech(result)).to.equal(`<speak>Der Wasserstand bei Würzburg beträgt 182,4 cm${suffix}</speak>`);
            expect(result.response.card.text).not.to.contain('Messung von');
        });
    }

    it('elicits a variant for a station with multiple gauges', async () => {
        const station = resolvedSlot('station', 'anderten', [{ name: 'Anderten', id: ANDERTEN_SLOT_ID }]);
        const variant = unresolvedSlot('variant');

        const result = await handler(
            intentRequest('QueryWaterLevelIntent', { station, variant }, 'COMPLETED', { sessionNew: false }),
            {},
        );

        expect(speech(result)).to.contain('Welcher Pegel, Anderten Oberwasser oder Anderten Unterwasser?');
        expect(result.response.reprompt.outputSpeech.ssml).to.contain(
            'Welcher Pegel, Anderten Oberwasser oder Anderten Unterwasser?',
        );
        expect(result.response.directives[0]).to.include({ type: 'Dialog.ElicitSlot', slotToElicit: 'variant' });
        expect(result.response.shouldEndSession).to.equal(false);
    });

    it('uses the selected station variant', async () => {
        nock(BASE_URL)
            .get(`/webservices/rest-api/v2/stations/${ANDERTEN_OBERWASSER_UUID}/W.json`)
            .query({ prettyprint: 'false', includeCurrentMeasurement: 'true' })
            .reply(200, measurement());
        const station = resolvedSlot('station', 'anderten', [{ name: 'Anderten', id: ANDERTEN_SLOT_ID }]);
        const variant = resolvedSlot('variant', 'oberwasser', [{ name: 'Oberwasser' }]);

        const result = await handler(
            intentRequest('QueryWaterLevelIntent', { station, variant }, 'COMPLETED', { sessionNew: false }),
            {},
        );

        expect(speech(result)).to.contain('Der Wasserstand bei Anderten Oberwasser beträgt 182,4 cm');
        expect(result.response.card).to.include({ type: 'Standard', title: 'Pegel bei Anderten Oberwasser' });
    });

    it('returns a friendly message when PegelOnline is unavailable', async () => {
        nock(BASE_URL)
            .get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`)
            .query({ prettyprint: 'false', includeCurrentMeasurement: 'true' })
            .reply(503, { message: 'PegelOnline unavailable' });
        const station = resolvedSlot('station', 'würzburg', [{ name: 'Würzburg', id: STATION_UUID }]);

        const result = await handler(intentRequest('QueryWaterLevelIntent', { station }), {});

        expect(speech(result)).to.contain('Ich kann diesen Messwert zur Zeit leider nicht bestimmen.');
    });

    it('shares the remaining Lambda budget across sequential API calls', async () => {
        nock(BASE_URL).get('/webservices/rest-api/v2/stations.json').query(true)
            .delay(40).reply(200, stations);
        nock(BASE_URL).get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`).query(true)
            .delay(200).reply(200, measurement());
        const water = resolvedSlot('water', 'main', [{ name: 'Main' }]);
        let budgetReads = 0;
        const result = await handler(
            intentRequest('QueryWaterLevelIntent', { station: unresolvedSlot('station'), water }),
            { getRemainingTimeInMillis() { budgetReads += 1; return 650; } },
        );
        expect(budgetReads).to.equal(1);
        expect(speech(result)).to.contain('Ich kann diesen Messwert zur Zeit leider nicht bestimmen.');
    });

    it('elicits a station when a water has multiple gauges', async () => {
        const waterStations = [
            { ...stations[0], longname: 'CELLE', uuid: 'celle', water: { shortname: 'ALLER', longname: 'ALLER' } },
            {
                ...stations[0],
                longname: 'MARKLENDORF',
                uuid: 'marklendorf',
                water: { shortname: 'ALLER', longname: 'ALLER' },
            },
        ];
        nock(BASE_URL)
            .get('/webservices/rest-api/v2/stations.json')
            .query({ prettyprint: 'false', waters: 'Aller' })
            .reply(200, waterStations);
        const water = resolvedSlot('water', 'aller', [{ name: 'Aller' }]);
        const station = unresolvedSlot('station');

        const result = await handler(intentRequest('QueryWaterLevelIntent', { station, water }), {});

        expect(speech(result)).to.contain('Welche Messstelle, Celle oder Marklendorf?');
        expect(result.response.directives[0]).to.include({ type: 'Dialog.ElicitSlot', slotToElicit: 'station' });
    });

    it('reports an unresolved water', async () => {
        const water = resolvedSlot('water', 'unbekannt', [], 'ER_SUCCESS_NO_MATCH');

        const result = await handler(
            intentRequest('QueryWaterLevelIntent', { station: unresolvedSlot('station'), water }),
            {},
        );

        expect(speech(result)).to.contain('Ich kenne dieses Gewässer leider nicht.');
    });

    it('reports a water without gauges', async () => {
        nock(BASE_URL)
            .get('/webservices/rest-api/v2/stations.json')
            .query({ prettyprint: 'false', waters: 'Vils' })
            .reply(200, []);
        const water = resolvedSlot('water', 'vils', [{ name: 'Vils' }]);

        const result = await handler(
            intentRequest('QueryWaterLevelIntent', { station: unresolvedSlot('station'), water }),
            {},
        );

        expect(speech(result)).to.contain('Ich kenne dieses Gewässer leider nicht.');
    });

    it('elicits a water when Alexa resolves multiple matches', async () => {
        const water = resolvedSlot('water', 'verbindungskanal', [
            { name: 'Niegripper Verbindungskanal' },
            { name: 'Verbindungskanal Hohensaaten' },
        ]);

        const result = await handler(
            intentRequest('QueryWaterLevelIntent', { station: unresolvedSlot('station'), water }),
            {},
        );

        expect(speech(result)).to.contain(
            'Welches Gewässer, Niegripper Verbindungskanal oder Verbindungskanal Hohensaaten?',
        );
        expect(result.response.directives[0]).to.include({ type: 'Dialog.ElicitSlot', slotToElicit: 'water' });
    });

    it('asks for a concrete station when a water has too many gauges', async () => {
        const waterStations = Array.from({ length: 6 }, (_, index) => ({
            ...stations[0],
            uuid: `rhein-${index}`,
            longname: `RHEIN STATION ${index + 1}`,
            water: { shortname: 'RHEIN', longname: 'RHEIN' },
        }));
        nock(BASE_URL)
            .get('/webservices/rest-api/v2/stations.json')
            .query({ prettyprint: 'false', waters: 'Rhein' })
            .reply(200, waterStations);
        const water = resolvedSlot('water', 'rhein', [{ name: 'Rhein' }]);

        const result = await handler(
            intentRequest('QueryWaterLevelIntent', { station: unresolvedSlot('station'), water }),
            {},
        );

        expect(speech(result)).to.contain(
            'Es gibt zu viele Messstellen an diesem Gewässer, bitte nenne eine konkrete, z.B. Rhein Station 4?',
        );
        expect(result.response.reprompt.outputSpeech.ssml).to.contain('Welche Messstelle?');
        expect(result.response.directives[0]).to.include({ type: 'Dialog.ElicitSlot', slotToElicit: 'station' });
    });

    it('uses the only gauge for a water', async () => {
        const waterStation = {
            ...stations[0],
            longname: 'KONSTANZ',
            water: { shortname: 'BODENSEE', longname: 'BODENSEE' },
        };
        nock(BASE_URL)
            .get('/webservices/rest-api/v2/stations.json')
            .query({ prettyprint: 'false', waters: 'Bodensee' })
            .reply(200, [waterStation]);
        nock(BASE_URL)
            .get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`)
            .query({ prettyprint: 'false', includeCurrentMeasurement: 'true' })
            .reply(200, measurement());
        const water = resolvedSlot('water', 'bodensee', [{ name: 'Bodensee' }]);

        const result = await handler(
            intentRequest('QueryWaterLevelIntent', { station: unresolvedSlot('station'), water }),
            {},
        );

        expect(speech(result)).to.contain('Der Wasserstand bei Konstanz (Bodensee) beträgt 182,4 cm');
        expect(result.response.card).to.include({ type: 'Standard', title: 'Pegel bei Konstanz (Bodensee)' });
    });
});
