import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { SKILL_ID } from '../config.js';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

const askArgs = process.argv.slice(2);
const replayOptionIndex = askArgs.findIndex(arg => arg === '--replay' || arg === '-r');
const replayFile = askArgs[replayOptionIndex + 1];

if (replayOptionIndex < 0 || !replayFile) {
    throw new Error('An ASK CLI replay file is required.');
}

const replay = JSON.parse(readFileSync(replayFile, 'utf8'));
const tempDirectory = mkdtempSync(path.join(tmpdir(), 'alexa-pegel-online-'));
const tempReplayFile = path.join(tempDirectory, 'replay.json');
const tempOutputFile = path.join(tempDirectory, 'output.json');
const expectedResponses = replay.userInput.filter(input => !input.startsWith('.')).length;

function readResponseBody() {
    try {
        const output = JSON.parse(readFileSync(tempOutputFile, 'utf8'));
        const completedResponses = output.invocations
            .map(invocation => invocation.response?.body)
            .filter(body => body?.status !== 'IN_PROGRESS');
        return {
            complete: completedResponses.length === expectedResponses,
            responseBody: completedResponses.at(-1),
        };
    } catch {
        return { complete: false, responseBody: undefined };
    }
}

try {
    replay.skillId = SKILL_ID;
    writeFileSync(tempReplayFile, JSON.stringify(replay), 'utf8');
    askArgs[replayOptionIndex + 1] = tempReplayFile;
    askArgs.push('--save-skill-io', tempOutputFile);

    let askResult;
    let complete;
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
