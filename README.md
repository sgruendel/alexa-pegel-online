# alexa-pegel-online
Alexa Skill for interacting with http://www.pegelonline.wsv.de

## TODOs
- Ilmenau is a water and a station
- Main does not work properly, because Main-Donau-Kanal is also found
- Berlin is not found at all
- Handle built-in intents for DisplayInterface like NavigateHome, More, Next ...
- Implement proper integration/simulation tests, see
  - https://github.com/hideokamoto/alexa-test-practice/blob/master/lambda/custom/tests/integrations/index.js
  - https://chatbotslife.com/alexa-are-you-ok-test-automation-for-alexa-skills-53088429d53
  - https://github.com/codeforequity-at/botium-core/wiki/What-is-Botium-%3F
- Add tests for single-slot utterances, see https://developer.amazon.com/de/docs/custom-skills/use-a-dialog-model-to-manage-ambiguous-responses.html#single-slot-utterances-for-an-intent
and "Wilhelmshaven" and other values starting a dialog
- Test manager.js using mock REST API, see http://bulkan-evcimen.com/testing_with_mocha_sinon.html
- switch to SDK V2 ApiClient http://www.talkingtocomputers.com/alexa-skills-kit-ask-sdk-v2#apiclient
- Add test cases and all water bodies from http://www.pegelonline.wsv.de/webservices/rest-api/v2/waters.json?includeStations=true
- When asking for a water, return list of stations, or for "Bodensee" just use "Konstanz"
- "Frage Pegel Online nach dem Pegel des Bodensee*s*" doesn't work, maybe use synonyms?