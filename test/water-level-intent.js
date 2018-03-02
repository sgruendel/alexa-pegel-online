'use strict';

var expect = require('chai').expect;
var index = require('../src/index');

const context = require('aws-lambda-mock-context');
const ctx = context();

describe('Testing a session with the WaterLevelIntent:', () => {
    var speechResponse = null;
    var speechError = null;

    before(function(done) {
        index.handler({
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
                            value: 'bad essen',
                        },
                    },
                },
            },
            version: '1.0',
        }, ctx);

        ctx.Promise
            .then(resp => { speechResponse = resp; done(); })
            .catch(err => { speechError = err; done(); });
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
            expect(speechResponse.response.card.image).to.exist;
            expect(speechResponse.response.card.image.smallImageUrl).to.match(/^https:\/\/.*\.png/);
            expect(speechResponse.response.card.image.largeImageUrl).to.match(/^https:\/\/.*\.png/);
        });

        it('should not contain +NN in card response', () => {
            expect(speechResponse.response.card.text).to.not.contain('+NN');
        });

        it('should end the alexa session', () => {
            expect(speechResponse.response.shouldEndSession).to.be.true;
        });
    });
});
