import { execFile } from 'child_process';
import { expect } from 'chai';

import * as ask from '../ask.js';

function verifyResponse(error, stdout, stderr, expectFn) {
    const result = ask.verifyResult(error, stderr);
    // console.log('alexa responses', result.alexaExecutionInfo.alexaResponses);
    // console.log('considered intents', result.alexaExecutionInfo.consideredIntents);
    // console.log('invocations', result.skillExecutionInfo.invocations);
    const { alexaResponses } = result.alexaExecutionInfo;
    expect(alexaResponses.length, 'one response').to.equal(1);
    expect(alexaResponses[0].type, 'speech response').to.equal('Speech');
    expectFn(alexaResponses[0].content.caption, 'output speech');
}

describe('Messstelle Havelberg', () => {
    it('should elicit stations', (done) => {
        const args = ask.execArgs.concat(['test/integration/havelberg.json']);
        execFile(ask.execFile, args, (error, stdout, stderr) => {
            verifyResponse(error, stdout, stderr, (val, msg) =>
                expect(val, msg).to.eq('Welcher Pegel, Havelberg Elbpegel, Havelberg Stadt oder Havelberg Unterpegel?'),
            );
            done();
        });
    });
});
