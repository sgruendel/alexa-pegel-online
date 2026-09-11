import { execFile } from 'child_process';
import { expect } from 'chai';

import * as ask from '../ask.js';

function verifyResponse(error, stdout, stderr, expectFn) {
    const result = ask.verifyResult(error, stdout, stderr);
    // console.log('alexa responses', result.alexaExecutionInfo.alexaResponses);
    // console.log('considered intents', result.alexaExecutionInfo.consideredIntents);
    // console.log('invocations', result.skillExecutionInfo.invocations);
    const { alexaResponses } = result.alexaExecutionInfo;
    expect(alexaResponses.length, 'one response').to.equal(1);
    expect(alexaResponses[0].type, 'speech response').to.equal('Speech');
    expectFn(alexaResponses[0].content.caption.trim(), 'output speech');
}

describe('Messstelle Ilmenau Sperrwerk', () => {
    it('should return measurement', (done) => {
        const args = ask.execArgs.concat(['test/integration/ilmenau.json']);
        execFile(ask.execFile, args, (error, stdout, stderr) => {
            verifyResponse(error, stdout, stderr, (val, msg) =>
                expect(val, msg).to.have.string('Der Wasserstand bei Ilmenau Sperrwerk beträgt '),
            );
            done();
        });
    });
});
