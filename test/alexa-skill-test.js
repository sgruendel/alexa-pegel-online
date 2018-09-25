'use strict';

// include the testing framework
const alexaTest = require('alexa-skill-test-framework');

// initialize the testing framework
alexaTest.initialize(
    require('../src/index'),
    'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1',
    'amzn1.ask.account.VOID');
alexaTest.setLocale('de-DE');

describe('Pegel Online Skill', () => {
    describe('LaunchRequest', () => {
        alexaTest.test([
            {
                request: alexaTest.getLaunchRequest(),
                says: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstelle, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
                reprompts: 'Wie kann ich dir helfen?',
                shouldEndSession: false,
            },
        ]);
    });

    describe('HelpIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.HelpIntent'),
                says: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstelle, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
                reprompts: 'Wie kann ich dir helfen?',
                shouldEndSession: false,
            },
        ]);
    });

    describe('CancelIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.CancelIntent'),
                says: 'Auf Wiedersehen!',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('StopIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.StopIntent'),
                says: 'Auf Wiedersehen!',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('SessionEndedRequest', () => {
        alexaTest.test([
            {
                request: alexaTest.getSessionEndedRequest(),
                saysNothing: true, repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('WaterLevelIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('WaterLevelIntent', { Station: 'würzburg' }),
                saysLike: 'Der Wasserstand bei Würzburg beträgt',
                hasCardTitle: 'Pegel bei Würzburg',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.getIntentRequest('WaterLevelIntent', { Station: 'affoltern' }),
                saysLike: 'Der Wasserstand bei Affoldern beträgt',
                hasCardTitle: 'Pegel bei Affoldern',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.getIntentRequest('WaterLevelIntent', { Station: 'aller' }),
                saysLike: 'Der Wasserstand bei Eitze beträgt',
                hasCardTitle: 'Pegel bei Eitze',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.getIntentRequest('WaterLevelIntent', { Station: 'bodensee' }),
                saysLike: 'Der Wasserstand bei Konstanz beträgt',
                hasCardTitle: 'Pegel bei Konstanz',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.getIntentRequest('WaterLevelIntent', { Station: 'wilhelmshaven' }),
                saysLike: 'Der Wasserstand bei Wilhelmshaven Alter Vorhafen beträgt',
                hasCardTitle: 'Pegel bei Wilhelmshaven Alter Vorhafen',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.getIntentRequest('WaterLevelIntent', { Station: 'xyzxyzxyz' }),
                saysLike: 'Ich kenne diese Messstelle leider nicht.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('ErrorHandler', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest(''),
                says: 'Entschuldigung, das verstehe ich nicht. Bitte wiederholen Sie das?',
                reprompts: 'Entschuldigung, das verstehe ich nicht. Bitte wiederholen Sie das?',
                shouldEndSession: false,
            },
        ]);
    });
});
