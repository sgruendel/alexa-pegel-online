'use strict';

const expect = require('chai').expect;

var exports = module.exports = {};

exports.execFile = 'ask';
exports.execArgs = [ 'dialog', '-s', 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1', '-l', 'de-DE', '-g', 'development', '--debug', '-r' ];

exports.verifyResult = (error, output) => {
    expect(error).to.be.null;
    const lastBody = output.lastIndexOf('Response body: "');
    if (lastBody < 0) {
        console.error('response body not found', output);
        expect(lastBody).to.be.greaterThan(0);
    }
    const { result } = JSON.parse(JSON.parse(output.substr(output.indexOf('"', lastBody))));
    if (result.error) {
        console.error('error message in json', result.error);
        expect(result.error, result.error.message).to.be.null;
    }
    return result;
};
