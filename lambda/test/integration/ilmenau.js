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

describe('Messstelle Ilmenau an der Ilm', () => {
    it('should elicit stations', (done) => {
        const args = ask.execArgs.concat(['test/integration/ilmenau.json']);
        execFile(ask.execFile, args, (error, stdout, stderr) => {
            verifyResponse(error, stdout, stderr, (val, msg) =>
                expect(val, msg).to.eq('Welche Messstelle, Ilmenau Sperrwerk oder Ilmenau an der Ilm?'),
            );
            done();
        });
    });

    it('should return measurement', (done) => {
        const args = ask.execArgs.concat(['test/integration/ilmenau_an_der_ilm.json']);
        execFile(ask.execFile, args, (error, stdout, stderr) => {
            verifyResponse(error, stdout, stderr, (val, msg) =>
                expect(val, msg).to.have.string('Der Wasserstand bei Ilmenau an der Ilm beträgt '),
            );
            done();
        });
    });
});
