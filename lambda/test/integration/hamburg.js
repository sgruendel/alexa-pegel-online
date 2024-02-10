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

describe('Messstelle Hamburg', () => {
    it('should elicit stations', (done) => {
        const args = ask.execArgs.concat(['test/integration/hamburg.json']);
        execFile(ask.execFile, args, (error, stdout, stderr) => {
            verifyResponse(error, stdout, stderr, (val, msg) =>
                expect(val, msg).to.eq('Welche Messstelle, Hamburg Harburg oder Hamburg Sankt Pauli?'),
            );
            done();
        });
    });

    it('should find Hamburg Harburg', (done) => {
        const args = ask.execArgs.concat(['test/integration/hamburg_harburg.json']);
        execFile(ask.execFile, args, (error, stdout, stderr) => {
            verifyResponse(error, stdout, stderr, (val, msg) =>
                expect(val, msg).to.have.string('Der Wasserstand bei Hamburg Harburg beträgt '),
            );
            done();
        });
    });

    it('should find Hamburg Sankt Pauli', (done) => {
        const args = ask.execArgs.concat(['test/integration/hamburg_sankt_pauli.json']);
        execFile(ask.execFile, args, (error, stdout, stderr) => {
            verifyResponse(error, stdout, stderr, (val, msg) =>
                expect(val, msg).to.have.string('Der Wasserstand bei Hamburg Sankt Pauli beträgt '),
            );
            done();
        });
    });
});
