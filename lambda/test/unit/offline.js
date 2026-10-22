import { expect } from 'chai';
import http from 'node:http';
import nodeFetch from 'node-fetch';

describe('offline isolation', () => {
    it('blocks unmocked HTTP requests', async () => {
        const error = await new Promise(resolve => {
            http.get('http://example.com').on('error', resolve);
        });
        expect(error.code).to.equal('ENETUNREACH');
        expect(error.message).to.contain('Disallowed net connect');
    });

    for (const [name, fetchRequest] of [['native fetch', fetch], ['node-fetch', nodeFetch]]) {
        it(`blocks unmocked ${name} requests`, async () => {
            let fetchError;
            try { await fetchRequest('https://example.com'); } catch (error) { fetchError = error; }
            const networkError = fetchError?.cause ?? fetchError;
            expect(networkError?.code).to.equal('ENETUNREACH');
            expect(networkError?.message).to.contain('Disallowed net connect');
        });
    }
});
