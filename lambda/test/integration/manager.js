import { expect } from 'chai';
import nock from 'nock';

import * as manager from '../../manager.js';
import { BASE_URL, measurement, STATION_UUID } from '../fixtures/pegelonline.js';

function mockMeasurement(uuid, overrides) {
    return nock(BASE_URL)
        .get(`/webservices/rest-api/v2/stations/${uuid}/W.json`)
        .query({ prettyprint: 'false', includeCurrentMeasurement: 'true' })
        .reply(200, measurement(overrides));
}

describe('manager', () => {
    describe('#getCurrentMeasurement()', () => {
        it('returns normalized measurement data and image URLs', async () => {
            mockMeasurement(STATION_UUID);

            const result = await manager.getCurrentMeasurement(STATION_UUID);

            expect(result.unit).to.equal('cm');
            expect(result.currentMeasurement.value).to.equal(182.4);
            expect(result.imageUrls.small.url).to.contain(STATION_UUID);
            expect(result.imageUrls.large.url).to.contain(STATION_UUID);
        });

        it('removes +NN from the unit', async () => {
            mockMeasurement(STATION_UUID, { unit: 'm+NN' });

            const result = await manager.getCurrentMeasurement(STATION_UUID);

            expect(result.unit).to.equal('m');
        });

        it('removes +PNP from the unit', async () => {
            mockMeasurement(STATION_UUID, { unit: 'm+PNP' });

            const result = await manager.getCurrentMeasurement(STATION_UUID);

            expect(result.unit).to.equal('m');
        });

        it('preserves the measurement instant and timezone offset', async () => {
            mockMeasurement(STATION_UUID);

            const result = await manager.getCurrentMeasurement(STATION_UUID);

            expect(result.currentMeasurement.timestamp).to.equal('2026-09-09T12:30:00+02:00');
        });
    });
});
