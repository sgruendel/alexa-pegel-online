'use strict';

// include the testing framework
const alexaTest = require('alexa-skill-test-framework');

// custom slot types
const LIST_OF_STATIONS = 'LIST_OF_STATIONS';
const LIST_OF_WATERS = 'LIST_OF_WATERS';

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

    describe('QueryStationIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryStationIntent'),
                    'station', LIST_OF_STATIONS, 'Würzburg', '915d76e1-3bf9-4e37-9a9a-4d144cd771cc'),
                saysLike: 'Der Wasserstand bei Würzburg beträgt',
                hasCardTitle: 'Pegel bei Würzburg',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryStationIntent', { station: 'Wilhelmshaven' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Wilhelmshaven Alter Vorhafen', id: 'f85bd17b-06c7-49bd-8bfc-ee2bf3ffea99' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Wilhelmshaven Neuer Vorhafen', id: 'f77317d9-654f-4f51-925e-004c592049da' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Wilhelmshaven Alter Vorhafen oder Wilhelmshaven Neuer Vorhafen?',
                reprompts: 'Welche Messstelle, Wilhelmshaven Alter Vorhafen oder Wilhelmshaven Neuer Vorhafen?',
                shouldEndSession: false,
            },
            /*
            {
                request: alexaTest.getIntentRequest('QueryStationIntent', { Station: 'affoltern' }),
                saysLike: 'Der Wasserstand bei Affoldern beträgt',
                hasCardTitle: 'Pegel bei Affoldern',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.getIntentRequest('QueryStationIntent', { Station: 'aller' }),
                saysLike: 'Der Wasserstand bei Eitze beträgt',
                hasCardTitle: 'Pegel bei Eitze',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.getIntentRequest('QueryStationIntent', { Station: 'bodensee' }),
                saysLike: 'Der Wasserstand bei Konstanz beträgt',
                hasCardTitle: 'Pegel bei Konstanz',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.getIntentRequest('QueryStationIntent', { Station: 'wilhelmshaven' }),
                saysLike: 'Der Wasserstand bei Wilhelmshaven Alter Vorhafen beträgt',
                hasCardTitle: 'Pegel bei Wilhelmshaven Alter Vorhafen',
                repromptsNothing: true, shouldEndSession: true,
            },
            */
            {
                request: alexaTest.addEntityResolutionNoMatchToRequest(
                    alexaTest.getIntentRequest('QueryStationIntent'),
                    'station', LIST_OF_STATIONS, 'xyzxyzxyz'),
                saysLike: 'Ich kenne diese Messstelle leider nicht.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('QueryWaterIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterIntent'),
                    'water', LIST_OF_WATERS, 'Bodensee'),
                says: 'Gewässer in Arbeit.',
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
