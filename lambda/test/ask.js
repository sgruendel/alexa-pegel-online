import { expect } from 'chai';
import { runDialog } from './helpers/dialog.js';

/** Assert the speech and skill request/response contract of every dialog turn. */
export function verifyTurns(turns, expectations) {
    expect(turns, 'dialog turns').to.have.length(expectations.length);
    for (const [index, expected] of expectations.entries()) {
        const result = turns[index].result;
        const caption = result.alexaExecutionInfo.alexaResponses
            .filter(response => response.type === 'Speech').map(response => response.content.caption.trim()).join(' ');
        if (expected.speech) expect(caption, `turn ${index + 1} speech`).to.equal(expected.speech);
        if (expected.speechIncludes) expect(caption, `turn ${index + 1} speech`).to.contain(expected.speechIncludes);
        const invocations = result.skillExecutionInfo?.invocations ?? [];
        const intentInvocation = invocations.filter(invocation => invocation.invocationRequest?.body?.request?.type === 'IntentRequest').at(-1);
        expect(intentInvocation, `turn ${index + 1} skill invocation`).to.exist;
        const request = intentInvocation.invocationRequest.body.request;
        expect(request.intent.name).to.equal('QueryWaterLevelIntent');
        const response = intentInvocation.invocationResponse?.body?.response;
        expect(response, `turn ${index + 1} skill response`).to.exist;
        const directives = response.directives ?? [];
        if (expected.elicit) {
            expect(directives.some(directive => directive.type === 'Dialog.ElicitSlot' && directive.slotToElicit === expected.elicit)).to.equal(true);
        }
        if (expected.delegate) expect(directives.some(directive => directive.type === 'Dialog.Delegate')).to.equal(true);
        if (expected.station) {
            const authorities = request.intent.slots.station?.resolutions?.resolutionsPerAuthority ?? [];
            expect(authorities.some(authority => authority.values?.some(value => value.value.name === expected.station))).to.equal(true);
            expect(directives.some(directive => directive.type.startsWith('Dialog.'))).to.equal(false);
        }
    }
}

export async function verifyDialog(replayFile, expectations) {
    const turns = await runDialog(replayFile, { skillId: process.env.SKILL_ID });
    verifyTurns(turns, expectations);
}
