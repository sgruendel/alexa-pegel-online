'use strict';

// include the testing framework
const alexaTest = require('alexa-skill-test-framework');

// custom slot types
const LIST_OF_STATIONS = 'LIST_OF_STATIONS';
const LIST_OF_VARIANTS = 'LIST_OF_VARIANTS';
const LIST_OF_WATERS = 'LIST_OF_WATERS';

// initialize the testing framework
alexaTest.initialize(
    require('../../src/index'),
    'amzn1.ask.skill.8e865c2e-e851-4cea-8cad-4035af61bda1',
    'amzn1.ask.account.VOID');
alexaTest.setLocale('de-DE');

describe('Pegel Online Skill', () => {

    describe('ErrorHandler', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest(''),
                says: 'Entschuldigung, das verstehe ich nicht. Bitte wiederhole das?',
                reprompts: 'Entschuldigung, das verstehe ich nicht. Bitte wiederhole das?',
                shouldEndSession: false,
            },
        ]);
    });

    describe('HelpIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.HelpIntent'),
                says: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstelle, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
                reprompts: 'Welche Messstelle soll ich abfragen?',
                shouldEndSession: false,
            },
        ]);
    });

    describe('CancelIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.CancelIntent'),
                says: '<say-as interpret-as="interjection">bis dann</say-as>.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('StopIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.StopIntent'),
                says: '<say-as interpret-as="interjection">bis dann</say-as>.',
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

    describe('LaunchRequest', () => {
        alexaTest.test([
            {
                request: alexaTest.getLaunchRequest(),
                says: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstelle, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
                reprompts: 'Welche Messstelle soll ich abfragen?',
                shouldEndSession: false,
            },
        ]);
    });

    describe('QueryWaterLevelIntent station', () => {
        alexaTest.test([
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'würzburg', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Würzburg', '915d76e1-3bf9-4e37-9a9a-4d144cd771cc'),
                saysLike: 'Der Wasserstand bei Würzburg beträgt',
                hasCardTitle: 'Pegel bei Würzburg',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'anderten', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Anderten', '*bc20d819-1782-4588-885d-129f21a27cf9'),
                elicitsSlot: 'variant',
                says: 'Welcher Pegel, Anderten Oberwasser oder Anderten Unterwasser?',
                reprompts: 'Welcher Pegel, Anderten Oberwasser oder Anderten Unterwasser?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'artlenburg', variant: '' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Artlenburg (Elbe)', id: 'b3492c68-8373-4769-9b29-22f66635a478' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Artlenburg (Elbe-Seitenkanal)', id: '7fec2f4f-6a2e-47ec-8f3c-016c581e4bbd' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Artlenburg (Elbe) oder Artlenburg (Elbe-Seitenkanal)?',
                reprompts: 'Welche Messstelle, Artlenburg (Elbe) oder Artlenburg (Elbe-Seitenkanal)?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'bad karlshafen', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Karlshafen', '1e51195c-f9d7-4cff-9db1-d92bb855005c'),
                saysLike: 'Der Wasserstand bei Karlshafen beträgt',
                hasCardTitle: 'Pegel bei Karlshafen',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'dömitz', variant: '' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Dömitz (Elbe)', id: '6e3ea719-48b1-408a-bc55-0986c1e94cd5' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Dömitz (Müritz-Elde-Wasserstraße)', id: '*ec8188ee-f4e4-4f5e-91ae-472e765060cd' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Dömitz (Elbe) oder Dömitz (Müritz-Elde-Wasserstraße)?',
                reprompts: 'Welche Messstelle, Dömitz (Elbe) oder Dömitz (Müritz-Elde-Wasserstraße)?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'frankfurt', variant: '' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Frankfurt (Oder)', id: 'bffdf7f2-6200-42a2-a4bc-a8111e27e043' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Frankfurt Osthafen', id: '66ff3eb4-513b-478b-abd2-2f5126ea66fd' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Frankfurt (Oder) oder Frankfurt Osthafen?',
                reprompts: 'Welche Messstelle, Frankfurt (Oder) oder Frankfurt Osthafen?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'geesthacht', variant: '' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Geesthacht (Elbe)', id: '44f7e955-c97d-45c8-9ed7-19406806fb4c' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Wehr Geesthacht', id: '0f7f58a8-411f-43d9-b42a-e897e63c4faa' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Geesthacht (Elbe) oder Wehr Geesthacht?',
                reprompts: 'Welche Messstelle, Geesthacht (Elbe) oder Wehr Geesthacht?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'grauerort', variant: '' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Grauerort', id: 'ccf0645d-ddad-4c9e-b4f1-dc1f1edb2aa4' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Grauerort Reede', id: '7398029b-c6a1-484f-b1f6-1afe568ee1e2' },
                    ]),
                saysLike: 'Der Wasserstand bei Grauerort beträgt',
                hasCardTitle: 'Pegel bei Grauerort',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'Halle', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Trotha', '*ea6870dc-507e-4ec4-a38c-cd8a5e8b7025'),
                elicitsSlot: 'variant',
                says: 'Welcher Pegel, Trotha Oberpegel oder Trotha Unterpegel?',
                reprompts: 'Welcher Pegel, Trotha Oberpegel oder Trotha Unterpegel?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'karlsruhe', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Maxau', 'b6c6d5c8-e2d5-4469-8dd8-fa972ef7eaea'),
                saysLike: 'Der Wasserstand bei Maxau beträgt',
                hasCardTitle: 'Pegel bei Maxau',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'kelheim', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Kelheimwinzer', 'c9409937-b794-4b69-b36b-38467daab09a'),
                saysLike: 'Der Wasserstand bei Kelheimwinzer beträgt',
                hasCardTitle: 'Pegel bei Kelheimwinzer',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'koblenz', variant: '' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Koblenz (Mosel)', id: '9dbcac54-db55-4d24-88b2-74a0d75a68c4' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Koblenz (Rhein)', id: '4c7d796a-39f2-4f26-97a9-3aad01713e29' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Koblenz (Mosel) oder Koblenz (Rhein)?',
                reprompts: 'Welche Messstelle, Koblenz (Mosel) oder Koblenz (Rhein)?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'lüneburg', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Lüneburg', 'c7364d1e-6139-4575-84cb-b420d21275c4'),
                saysLike: 'Der Wasserstand bei Lüneburg beträgt',
                hasCardTitle: 'Pegel bei Lüneburg',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'neustadt', variant: '' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Neustadt-Glewe', id: 'c4381eb3-d21f-4bd1-bc1c-66c03b7d8bcf' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Neustadt (Leine)', id: 'dda39817-d01d-467f-a6a3-7487011a45d1' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Neustadt (Ostsee)', id: '3f0b6b74-80a9-4576-a3cb-ea967dfc349f' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Neustadt-Glewe, Neustadt (Leine) oder Neustadt (Ostsee)?',
                reprompts: 'Welche Messstelle, Neustadt-Glewe, Neustadt (Leine) oder Neustadt (Ostsee)?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'nienburg', variant: '' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Nienburg (Saale)', id: 'ace7d4b0-33e5-46db-a41d-2fa7a321f67a' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Nienburg (Weser)', id: '38497786-6c29-47f4-93de-d96001629496' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Nienburg (Saale) oder Nienburg (Weser)?',
                reprompts: 'Welche Messstelle, Nienburg (Saale) oder Nienburg (Weser)?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'sülfeld', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Sülfeld', '*a8604e8f-9330-4431-8cf6-0a68fc793c82'),
                elicitsSlot: 'variant',
                says: 'Welcher Pegel, Sülfeld Oberwasser oder Sülfeld Unterwasser?',
                reprompts: 'Welcher Pegel, Sülfeld Oberwasser oder Sülfeld Unterwasser?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'uelzen', variant: '' }),
                    'station', LIST_OF_STATIONS, 'Uelzen', '*728bd3e3-23f2-41c6-8ac5-4cfa223a5a7e'),
                elicitsSlot: 'variant',
                says: 'Welcher Pegel, Uelzen Oberwasser oder Uelzen Unterwasser?',
                reprompts: 'Welcher Pegel, Uelzen Oberwasser oder Uelzen Unterwasser?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'wilhelmshaven' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Wilhelmshaven Neuer Vorhafen', id: 'f77317d9-654f-4f51-925e-004c592049da' },
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Wilhelmshaven Alter Vorhafen', id: 'f85bd17b-06c7-49bd-8bfc-ee2bf3ffea99' },
                    ]),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Wilhelmshaven Neuer Vorhafen oder Wilhelmshaven Alter Vorhafen?',
                reprompts: 'Welche Messstelle, Wilhelmshaven Neuer Vorhafen oder Wilhelmshaven Alter Vorhafen?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionNoMatchToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent'),
                    'station', LIST_OF_STATIONS, 'xyzxyzxyz'),
                saysLike: 'Ich kenne diese Messstelle leider nicht.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('QueryWaterLevelIntent station variant', () => {
        alexaTest.test([
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'wittorf', variant: 'oberpegel' }),
                    [
                        { slotName: 'station', slotType: LIST_OF_STATIONS, value: 'Wittorf', id: '*eb3d4195-8c73-46b6-87e9-ef0de83edddf' },
                        { slotName: 'variant', slotType: LIST_OF_VARIANTS, value: 'Oberpegel' },
                    ]),
                saysLike: 'Der Wasserstand bei Wittorf Oberpegel beträgt',
                hasCardTitle: 'Pegel bei Wittorf Oberpegel',
                repromptsNothing: true, shouldEndSession: true,
            },
            // there are periodic invocations where someone queries a station and a water, but the water is matched as variant
            {
                request: alexaTest.addEntityResolutionNoMatchToRequest(
                    alexaTest.addEntityResolutionToRequest(
                        alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: 'höxter', variant: 'weser' }),
                        'station', LIST_OF_STATIONS, 'Höxter', '763633e7-3b4b-470a-978e-f9e456e4df7c'),
                    'variant', LIST_OF_VARIANTS, 'weser'),
                saysLike: 'Der Wasserstand bei Höxter beträgt',
                hasCardTitle: 'Pegel bei Höxter',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('QueryWaterLevelIntent water', () => {
        alexaTest.test([
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: '', water: 'vils' }),
                    'water', LIST_OF_WATERS, 'Vils'),
                says: 'Ich kenne dieses Gewässer leider nicht.',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: '', water: 'bodensee' }),
                    'water', LIST_OF_WATERS, 'Bodensee'),
                saysLike: 'Der Wasserstand bei Konstanz (Bodensee) beträgt',
                hasCardTitle: 'Pegel bei Konstanz (Bodensee)',
                repromptsNothing: true, shouldEndSession: true,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: '', water: 'aller' }),
                    'water', LIST_OF_WATERS, 'Aller'),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Eitze, Rethem, Ahlden, Marklendorf oder Celle?',
                reprompts: 'Welche Messstelle, Eitze, Rethem, Ahlden, Marklendorf oder Celle?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: '', water: 'oranienburger kanal' }),
                    'water', LIST_OF_WATERS, 'Oranienburger Kanal'),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Sachsenhausen Unterpegel oder Sachsenhausen Oberpegel?',
                reprompts: 'Welche Messstelle, Sachsenhausen Unterpegel oder Sachsenhausen Oberpegel?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: '', water: 'datteln-hamm-kanal' }),
                    'water', LIST_OF_WATERS, 'Datteln-Hamm-Kanal'),
                elicitsSlot: 'station',
                says: 'Welche Messstelle, Waltrop, Hamm Unterwasser, Hamm Oberwasser oder Werries Oberwasser?',
                reprompts: 'Welche Messstelle, Waltrop, Hamm Unterwasser, Hamm Oberwasser oder Werries Oberwasser?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: '', water: 'rhein' }),
                    'water', LIST_OF_WATERS, 'Rhein'),
                elicitsSlot: 'station',
                saysLike: 'Es gibt zu viele Messstellen an diesem Gewässer, bitte nenne eine konkrete, z.B. ',
                reprompts: 'Welche Messstelle?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: '', water: 'main' }),
                    [
                        { slotName: 'water', slotType: LIST_OF_WATERS, value: 'Main' },
                        { slotName: 'water', slotType: LIST_OF_WATERS, value: 'Main-Donau-Kanal' },
                    ]),
                saysLike: 'Es gibt zu viele Messstellen an diesem Gewässer, bitte nenne eine konkrete, z.B. ',
                reprompts: 'Welche Messstelle?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionsToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent', { station: '', water: 'verbindungskanal' }),
                    [
                        { slotName: 'water', slotType: LIST_OF_WATERS, value: 'Niegripper Verbindungskanal' },
                        { slotName: 'water', slotType: LIST_OF_WATERS, value: 'Verbindungskanal Hohensaaten' },
                    ]),
                elicitsSlot: 'water',
                says: 'Welches Gewässer, Niegripper Verbindungskanal oder Verbindungskanal Hohensaaten?',
                reprompts: 'Welches Gewässer, Niegripper Verbindungskanal oder Verbindungskanal Hohensaaten?',
                shouldEndSession: false,
            },
            {
                request: alexaTest.addEntityResolutionNoMatchToRequest(
                    alexaTest.getIntentRequest('QueryWaterLevelIntent'),
                    'water', LIST_OF_STATIONS, 'vils'),
                saysLike: 'Ich kenne dieses Gewässer leider nicht.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });
});
