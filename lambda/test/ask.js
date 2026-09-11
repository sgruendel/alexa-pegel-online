import { fileURLToPath } from 'node:url';

import { expect } from 'chai';

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

export function verifyResult(error, output, diagnostics) {
    if (error) {
        console.error('ASK CLI command failed', diagnostics);
    }
    expect(error).to.be.null;

    let responseBody;
    try {
        responseBody = JSON.parse(output);
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
};
