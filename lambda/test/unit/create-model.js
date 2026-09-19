import { expect } from 'chai';
import { hasMeasurement, isRetryableError, requestWithRetry } from '../../scripts/create-model.js';

const station = { uuid: 'station-id', longname: 'TEST STATION' };
const logger = { log() {} };

function errorWithCode(code) {
    return Object.assign(new Error(code), { code });
}

describe('model creation request handling', () => {
    it('retries a connection reset with exponential backoff', async () => {
        let attempts = 0;
        const delays = [];
        const result = await hasMeasurement(station, {
            getCurrentMeasurement: async () => {
                attempts++;
                if (attempts < 3) throw errorWithCode('ECONNRESET');
                return {};
            },
            maxAttempts: 5,
            baseDelayMs: 100,
            random: () => 0.5,
            sleep: async milliseconds => delays.push(milliseconds),
            logger,
        });

        expect(result).to.equal(true);
        expect(attempts).to.equal(3);
        expect(delays).to.deep.equal([ 100, 200 ]);
    });

    it('bounds retries and skips a station after the final failure', async () => {
        let attempts = 0;
        const result = await hasMeasurement(station, {
            getCurrentMeasurement: async () => {
                attempts++;
                throw errorWithCode('ETIMEDOUT');
            },
            maxAttempts: 3,
            baseDelayMs: 1,
            random: () => 0.5,
            sleep: async () => {},
            logger,
        });

        expect(result).to.equal(false);
        expect(attempts).to.equal(3);
    });

    it('caps the jittered retry delay', async () => {
        const delays = [];
        await hasMeasurement(station, {
            getCurrentMeasurement: async () => { throw errorWithCode('ECONNRESET'); },
            maxAttempts: 2,
            baseDelayMs: 10000,
            random: () => 1,
            sleep: async milliseconds => delays.push(milliseconds),
            logger,
        });

        expect(delays).to.deep.equal([ 10000 ]);
    });

    it('retries transient catalog requests', async () => {
        let attempts = 0;
        const result = await requestWithRetry('station catalog', async () => {
            attempts++;
            if (attempts === 1) throw Object.assign(new Error('Unavailable'), { statusCode: 503 });
            return [ 'station' ];
        }, {
            baseDelayMs: 1,
            sleep: async () => {},
            logger,
        });

        expect(result).to.deep.equal([ 'station' ]);
        expect(attempts).to.equal(2);
    });

    it('does not retry a permanent request failure', async () => {
        let attempts = 0;
        const result = await hasMeasurement(station, {
            getCurrentMeasurement: async () => {
                attempts++;
                throw Object.assign(new Error('Not found'), { statusCode: 404 });
            },
            sleep: async () => {},
            logger,
        });

        expect(result).to.equal(false);
        expect(attempts).to.equal(1);
    });

    it('recognizes retryable HTTP and nested network failures', () => {
        expect(isRetryableError({ statusCode: 429 })).to.equal(true);
        expect(isRetryableError({ statusCode: 503 })).to.equal(true);
        expect(isRetryableError(new Error('wrapped', { cause: errorWithCode('EAI_AGAIN') }))).to.equal(true);
        expect(isRetryableError({ statusCode: 400 })).to.equal(false);
    });
});
