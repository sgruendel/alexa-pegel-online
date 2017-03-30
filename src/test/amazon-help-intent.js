'use strict';

var expect = require('chai').expect;
var index = require('../index');

const context = require('aws-lambda-mock-context');
const ctx = context();

describe('Testing a session with the AMAZON.HelpIntent:', () => {
    var speechResponse = null
    var speechError = null
    
    before(function(done) {
        index.handler( {
            "session": {
                "sessionId": "SessionId.9775c4b5-6a82-4ed6-8542-dadc37e8fe5f",
                "application": {
                    "applicationId": "amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1"
                },
                "attributes": {},
                "user": {
                    "userId": "amzn1.ask.account.[unique-value-here]"
                },
                "new": true
            },
            "request": {
                "type": "IntentRequest",
                "requestId": "amzn1.echo-api.request.[unique-value-here]",
                "locale": "de-DE",
                "timestamp": "2017-03-29T07:52:30Z",
                "intent": {
                    "name": "AMAZON.HelpIntent",
                    "slots": {}
                }
            },
            "version": "1.0"
        }, ctx)
        
        ctx.Promise
            .then(resp => { speechResponse = resp; done(); })
            .catch(err => { speechError = err; done(); })
    })
    
    describe('The response', () => {
        it('should not have errored', () => {
            expect(speechError).to.be.null
        })
        
        it('should have a version', () => {
            expect(speechResponse.version).to.exist
        })
        
        it('should have a speechlet response', () => {
            expect(speechResponse.response).to.exist
        })

        it('should have a spoken response', () => {
            expect(speechResponse.response.outputSpeech).to.exist
        })
        
        it('should have a spoken reprompt', () => {
            expect(speechResponse.response.reprompt.outputSpeech).to.exist
        })

        it('should not end the alexa session', () => {
            expect(speechResponse.response.shouldEndSession).to.be.false
        })
    })
})