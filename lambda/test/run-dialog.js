import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { SKILL_ID } from '../config.js';

/**
 * @typedef {{skillId?: string, userInput: string[]}} Replay
 * @typedef {{message?: string}} SimulationError
 * @typedef {{error?: SimulationError, alexaExecutionInfo?: {alexaResponses?: unknown[]}}} SimulationResult
 * @typedef {{status: string, result?: SimulationResult}} SimulationResponseBody
 * @typedef {{response?: {body?: SimulationResponseBody}}} Invocation
 * @typedef {{invocations: Invocation[]}} AskOutput
 */

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

const askArgs = process.argv.slice(2);
const replayOptionIndex = askArgs.findIndex(arg => arg === '--replay' || arg === '-r');
const replayFile = askArgs[replayOptionIndex + 1];

if (replayOptionIndex < 0 || !replayFile) {
    throw new Error('An ASK CLI replay file is required.');
}

const replay = /** @type {Replay} */ (JSON.parse(readFileSync(replayFile, 'utf8')));
const tempDirectory = mkdtempSync(path.join(tmpdir(), 'alexa-pegel-online-'));
const tempReplayFile = path.join(tempDirectory, 'replay.json');
const tempOutputFile = path.join(tempDirectory, 'output.json');
const expectedResponses = replay.userInput.filter(input => !input.startsWith('.')).length;

/**
 * Reads the last completed response from the ASK CLI output file.
 * @returns {{complete: boolean, responseBody: SimulationResponseBody | undefined}} parsed response state
 */
function readResponseBody() {
    try {
        const output = /** @type {AskOutput} */ (JSON.parse(readFileSync(tempOutputFile, 'utf8')));
        /** @type {SimulationResponseBody[]} */
        const completedResponses = [];
        for (const invocation of output.invocations) {
            const responseBody = invocation.response?.body;
            if (responseBody && responseBody.status !== 'IN_PROGRESS') {
                completedResponses.push(responseBody);
            }
        }
        return {
            complete: completedResponses.length === expectedResponses,
            responseBody: completedResponses.at(-1),
        };
    } catch {
        return { complete: false, responseBody: undefined };
    }
}

async function runDialog() {
    try {
        replay.skillId = SKILL_ID;
        writeFileSync(tempReplayFile, JSON.stringify(replay), 'utf8');
        askArgs[replayOptionIndex + 1] = tempReplayFile;
        askArgs.push('--save-skill-io', tempOutputFile);

        /** @type {import('node:child_process').SpawnSyncReturns<string> | undefined} */
        let askResult;
        let complete = false;
        /** @type {SimulationResponseBody | undefined} */
        let responseBody;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            writeFileSync(tempOutputFile, JSON.stringify({ invocations: [] }), 'utf8');
            askResult = spawnSync('ask', ['dialog', ...askArgs], { encoding: 'utf8' });
            if (askResult.stdout) {
                process.stderr.write(askResult.stdout);
            }
            if (askResult.stderr) {
                process.stderr.write(askResult.stderr);
            }
            if (askResult.error) {
                throw askResult.error;
            }

            ({ complete, responseBody } = readResponseBody());
            const resultError = responseBody?.result?.error?.message;
            const transientError = resultError === 'An unexpected error occurred.';
            const missingAlexaResponse =
                !resultError && responseBody?.result?.alexaExecutionInfo?.alexaResponses?.length !== 1;
            if (
                attempt === MAX_ATTEMPTS ||
                (askResult.status === 0 && complete && !transientError && !missingAlexaResponse)
            ) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }

        if (!askResult) {
            throw new Error('The ASK CLI command was not executed.');
        }
        if (askResult.status !== 0) {
            process.exitCode = askResult.status ?? 1;
        } else if (!complete || !responseBody) {
            throw new Error(`The ASK CLI output did not contain all ${expectedResponses} response bodies.`);
        } else {
            process.stdout.write(`${JSON.stringify(responseBody)}\n`);
        }
    } finally {
        rmSync(tempDirectory, { recursive: true, force: true });
    }
}

runDialog().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
