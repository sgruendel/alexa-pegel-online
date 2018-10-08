# alexa-pegel-online
Alexa Skill for interacting with http://www.pegelonline.wsv.de

## TODOs
- Add integration tests for single-slot utterances, see https://developer.amazon.com/de/docs/custom-skills/use-a-dialog-model-to-manage-ambiguous-responses.html#single-slot-utterances-for-an-intent
and "Wilhelmshaven" and other values starting a dialog
- Test manager.js using mock REST API, see http://bulkan-evcimen.com/testing_with_mocha_sinon.html
- switch to SDK V2 ApiClient http://www.talkingtocomputers.com/alexa-skills-kit-ask-sdk-v2#apiclient
- Add test cases and all water bodies from http://www.pegelonline.wsv.de/webservices/rest-api/v2/waters.json?includeStations=true
- There are two stations named "Frankfurt", they need to be distinguised
- There are two stations named "Neustadt", they need to be distinguised
- There are two stations named "Nienburg", they need to be distinguised
- There's a station "Weser" at Mittellandkanal, and a water "Weser"
- When asking for a water, return list of stations, or for "Bodensee" just use "Konstanz"
- "Frage Pegel Online nach dem Pegel des Bodensee*s*" doesn't work, maybe use synonyms?