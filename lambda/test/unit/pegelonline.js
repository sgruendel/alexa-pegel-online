import { expect } from 'chai';
import nock from 'nock';

import * as pegelonline from '../../pegelonline.js';
import { BASE_URL, measurement, stations, STATION_UUID, waters } from '../fixtures/pegelonline.js';

describe('pegelonline', () => {
    describe('#getStations()', () => {
        it('returns all stations', async () => {
            nock(BASE_URL)
                .get('/webservices/rest-api/v2/stations.json')
                .query({ prettyprint: 'false' })
                .reply(200, stations);

            const result = await pegelonline.getStations();

            expect(result).to.deep.equal(stations);
        });

        it('filters stations by water', async () => {
            nock(BASE_URL)
                .get('/webservices/rest-api/v2/stations.json')
                .query({ prettyprint: 'false', waters: 'Main' })
                .reply(200, stations);

            const result = await pegelonline.getStations('Main');

            expect(result).to.deep.equal(stations);
        });
    });

    describe('#getWaters()', () => {
        it('returns all waters', async () => {
            nock(BASE_URL)
                .get('/webservices/rest-api/v2/waters.json')
                .query({ prettyprint: 'false' })
                .reply(200, waters);

            const result = await pegelonline.getWaters();

            expect(result).to.deep.equal(waters);
        });
    });

    describe('#getCurrentMeasurement()', () => {
        it('returns the current measurement', async () => {
            const expected = measurement();
            nock(BASE_URL)
                .get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`)
                .query({ prettyprint: 'false', includeCurrentMeasurement: 'true' })
                .reply(200, expected);

            const result = await pegelonline.getCurrentMeasurement(STATION_UUID);

            expect(result).to.deep.equal(expected);
        });

        it('aborts while waiting for a response body', async () => {
            nock(BASE_URL)
                .get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`)
                .query(true)
                .delayBody(200)
                .reply(200, measurement());
            try {
                await pegelonline.getCurrentMeasurement(STATION_UUID, { signal: AbortSignal.timeout(30) });
                expect.fail('Expected the request to be aborted');
            } catch (error) {
                expect(error.name).to.equal('AbortError');
            }
        });

        it('rejects malformed JSON', async () => {
            nock(BASE_URL)
                .get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`)
                .query(true)
                .reply(200, '{');
            try {
                await pegelonline.getCurrentMeasurement(STATION_UUID);
                expect.fail('Expected malformed JSON to fail');
            } catch (error) {
                expect(error).to.be.instanceOf(SyntaxError);
            }
        });

        it('exposes HTTP status errors', async () => {
            nock(BASE_URL)
                .get(`/webservices/rest-api/v2/stations/${STATION_UUID}/W.json`)
                .query({ prettyprint: 'false', includeCurrentMeasurement: 'true' })
                .reply(404, { message: 'Not found' });

            let error;
            try {
                await pegelonline.getCurrentMeasurement(STATION_UUID);
            } catch (caught) {
                error = caught;
            }

            expect(error).to.be.instanceOf(Error);
            expect(error).to.be.instanceOf(pegelonline.HttpError);
            expect(error.name).to.equal('HttpError');
            expect(error.statusCode).to.equal(404);
        });
    });

    describe('#getImageUrls()', () => {
        const result = pegelonline.getImageUrls(STATION_UUID);

        for (const size of ['xsmall', 'small', 'medium', 'large', 'xlarge']) {
            it(`returns the ${size} image`, () => {
                expect(result[size].url).to.contain(STATION_UUID);
                expect(result[size].width).to.be.a('number');
                expect(result[size].height).to.be.a('number');
            });
        }
    });

    describe('live API', function () {
        this.timeout(20000);

        before(() => {
            nock.enableNetConnect(/pegelonline\.wsv\.de/);
        });

        after(() => {
            nock.disableNetConnect();
        });

        it('returns the station catalog', async () => {
            const result = await pegelonline.getStations();
            expect(result).to.have.length.above(500);
        });

        it('returns the current measurement for Würzburg', async () => {
            const result = await pegelonline.getCurrentMeasurement(STATION_UUID);
            expect(result.unit).to.be.a('string');
            expect(result.currentMeasurement.value).to.be.a('number');
        });
    });
});
