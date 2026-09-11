import { expect } from 'chai';
import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { parseDialogOutput, runDialog } from '../helpers/dialog.js';
import { verifyTurns } from '../ask.js';

const successfulTurn = (caption = 'OK') => ({
    status: 'SUCCESSFUL',
    result: {
        alexaExecutionInfo: { alexaResponses: [{ type: 'Speech', content: { caption } }] },
        skillExecutionInfo: { invocations: [{
            invocationRequest: { body: { request: { type: 'IntentRequest', intent: { name: 'QueryWaterLevelIntent' } } } },
            invocationResponse: { body: { response: { directives: [{ type: 'Dialog.ElicitSlot', slotToElicit: 'station' }] } } },
        }] },
    },
});
const output = (...turns) => ({ invocations: turns.map(body => ({ response: { body } })) });

async function rejection(promise) {
    try { await promise; } catch (error) { return error; }
    throw new Error('Expected rejection');
}

describe('dialog runner', () => {
    let directory;
    let replayFile;
    let tempInput;
    beforeEach(async () => {
        directory = await mkdtemp(path.join(tmpdir(), 'alexa-dialog-test-'));
        replayFile = path.join(directory, 'replay.json');
        await writeFile(replayFile, JSON.stringify({ locale: 'de-DE', userInput: ['hello', 'station', '.quit'] }));
    });
    afterEach(async () => {
        await rm(directory, { recursive: true, force: true });
        if (tempInput) expect((await rejection(access(tempInput))).code).to.equal('ENOENT');
        tempInput = undefined;
    });
    const fakeRun = (responses, inspect = () => {}) => async (command, args, options) => {
        tempInput = args[args.indexOf('--replay') + 1];
        inspect(command, args, options);
        const replay = JSON.parse(await readFile(tempInput, 'utf8'));
        expect(replay.skillId).to.equal('test-skill');
        await writeFile(args[args.indexOf('--save-skill-io') + 1], JSON.stringify(responses));
        return { stdout: '', stderr: '' };
    };

    it('retains and validates every completed turn', async () => {
        const turns = await runDialog(replayFile, { skillId: 'test-skill', run: fakeRun(output(successfulTurn('First'), successfulTurn('Last')), (command, args, options) => {
            expect(command).to.equal('ask');
            expect(args[args.indexOf('--stage') + 1]).to.equal('development');
            expect(options.timeout).to.equal(35000);
            expect(options.killSignal).to.equal('SIGKILL');
        }) });
        verifyTurns(turns, [{ speech: 'First', elicit: 'station' }, { speech: 'Last', elicit: 'station' }]);
        expect(() => verifyTurns(turns, [{ speech: 'Wrong' }, { speech: 'Last' }])).to.throw();
    });
    it('fails an earlier error even when the final turn succeeds', async () => {
        let attempts = 0;
        const run = fakeRun(output({ status: 'FAILED', result: { error: { message: 'Invalid directive' } } }, successfulTurn()));
        const error = await rejection(runDialog(replayFile, { skillId: 'test-skill', run: (...args) => { attempts++; return run(...args); } }));
        expect(error.message).to.contain('Turn 1: Invalid directive');
        expect(attempts).to.equal(1);
    });
    it('deduplicates repeated polls by simulation ID', () => {
        const turn = { ...successfulTurn(), id: 'one' };
        expect(parseDialogOutput(output({ id: 'one', status: 'IN_PROGRESS' }, turn, turn), 1)).to.have.length(1);
    });
    it('retries incomplete output, then returns all turns', async () => {
        let attempts = 0;
        const turns = await runDialog(replayFile, { skillId: 'test-skill', retryDelayMs: 1, run: (...args) => {
            attempts++;
            return fakeRun(attempts === 1 ? output(successfulTurn()) : output(successfulTurn(), successfulTurn()))(...args);
        } });
        expect(attempts).to.equal(2);
        expect(turns).to.have.length(2);
    });
    it('bounds retries of the known transient simulation error', async () => {
        let attempts = 0;
        const run = fakeRun(output({ status: 'FAILED', result: { error: { message: 'An unexpected error occurred.' } } }));
        const error = await rejection(runDialog(replayFile, { skillId: 'test-skill', retryDelayMs: 1, run: (...args) => { attempts++; return run(...args); } }));
        expect(attempts).to.equal(2);
        expect(error.message).to.contain('unexpected error');
    });
    it('does not retry missing speech or malformed JSON', async () => {
        expect(() => parseDialogOutput(output({ status: 'SUCCESSFUL', result: {} }), 1)).to.throw('missing Alexa speech');
        let attempts = 0;
        const error = await rejection(runDialog(replayFile, { skillId: 'test-skill', run: async (command, args) => {
            attempts++;
            tempInput = args[args.indexOf('--replay') + 1];
            await writeFile(args[args.indexOf('--save-skill-io') + 1], '{');
            return {};
        } }));
        expect(error).to.be.instanceOf(SyntaxError);
        expect(attempts).to.equal(1);
    });
    it('kills a stalled subprocess and cleans up its replay files', async () => {
        let attempts = 0;
        const error = await rejection(runDialog(replayFile, { skillId: 'test-skill', attemptTimeoutMs: 50,
            run: (command, args, options) => {
                attempts++;
                tempInput = args[args.indexOf('--replay') + 1];
                return promisify(execFile)(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], options);
            },
        }));
        expect(error.killed).to.equal(true);
        expect(error.signal).to.equal('SIGKILL');
        expect(attempts).to.equal(1);
    });
    it('rejects missing configuration before launching ASK', async () => {
        expect((await rejection(runDialog(replayFile))).message).to.contain('SKILL_ID');
    });
});
