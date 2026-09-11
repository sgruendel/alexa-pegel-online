import { fileURLToPath } from 'node:url';

import { expect } from 'chai';

/**
 * @typedef {{type: string, content: {caption: string}}} AlexaResponse
 * @typedef {{alexaResponses: AlexaResponse[]}} AlexaExecutionInfo
 * @typedef {{message: string}} SimulationError
 * @typedef {{error?: SimulationError, alexaExecutionInfo: AlexaExecutionInfo}} AlexaSimulationResult
 * @typedef {{result: AlexaSimulationResult}} SimulationResponseBody
 */

export const execFile = process.execPath;
// see https://github.com/alexa/ask-cli/issues/173
export const execArgs = [
    fileURLToPath(new URL('./run-dialog.js', import.meta.url)),
    '-l',
    'de-DE',
    '-g',
    'development',
    '-r',
];

/**
 * Verifies and returns a structured ASK simulation result.
 * @param {Error | null} error subprocess error
 * @param {string} output structured response body
 * @param {string} diagnostics ASK CLI output
 * @returns {AlexaSimulationResult} simulation result
 */
export function verifyResult(error, output, diagnostics) {
    if (error) {
        console.error('ASK CLI command failed', diagnostics);
    }
    expect(error).to.be.null;

    let responseBody;
    try {
        responseBody = /** @type {SimulationResponseBody} */ (JSON.parse(output));
    } catch (parseError) {
        console.error('response body is not valid JSON', diagnostics, output);
        throw parseError;
    }

    const { result } = responseBody;
    if (result.error) {
        console.error('error message in json', result.error);
        expect(result.error, result.error.message).to.be.null;
    }
    return result;
}
