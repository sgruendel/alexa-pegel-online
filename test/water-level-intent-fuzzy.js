'use strict';

const expect = require('chai').expect;
const index = require('../src/index');

const event = {
    session: {
        sessionId: 'SessionId.154291c5-a13f-4e7a-ab5a-2342534adfeba',
        application: {
            applicationId: 'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1',
        },
        attributes: {},
        user: {
            userId: 'amzn1.ask.account.[unique-value-here]',
        },
        new: true,
    },
    request: {
        type: 'IntentRequest',
        requestId: 'amzn1.echo-api.request.[unique-value-here]',
        locale: 'de-DE',
        timestamp: '2017-03-29T07:52:30Z',
        intent: {
            name: 'WaterLevelIntent',
            slots: {
                Station: {
                    name: 'Station',
                    value: 'affoltern',
                },
            },
        },
    },
    version: '1.0',
};

// There was a request for station "affoltern" in the logs where Alexa
// misheard "Affoldern" (or the user mispronounced it), this should
// still be found by the fuzzy request

describe('Testing a session with the WaterLevelIntent for fuzzy station name:', () => {
    var speechResponse = null;
    var speechError = null;

    before(function() {
        return new Promise((resolve, reject) => {
            index.handler(event,
                null,
                (err, resp) => {
                    if (err) {
                        speechError = err;
                        reject(err);
                    } else {
                        speechResponse = resp;
                        resolve(speechResponse);
                    }
                });
        });
    });

    describe('The response', () => {
        it('should not have errored', () => {
            expect(speechError).to.be.null;
        });

        it('should have a version', () => {
            expect(speechResponse.version).to.exist;
        });

        it('should have a speechlet response', () => {
            expect(speechResponse.response).to.exist;
        });

        it('should have a spoken response', () => {
            expect(speechResponse.response.outputSpeech).to.exist;
        });

        it('should have a standard card response', () => {
            expect(speechResponse.response.card).to.exist;
            expect(speechResponse.response.card.type).to.eq('Standard');
            expect(speechResponse.response.card.title).contains('Affoldern');
            expect(speechResponse.response.card.image).to.exist;
            expect(speechResponse.response.card.image.smallImageUrl).to.match(/^https:\/\/.*\.png/);
            expect(speechResponse.response.card.image.largeImageUrl).to.match(/^https:\/\/.*\.png/);
        });

        it('should end the alexa session', () => {
            expect(speechResponse.response.shouldEndSession).to.be.true;
        });
    });
});
