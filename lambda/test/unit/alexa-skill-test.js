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
    });

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
