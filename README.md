# alexa-pegel-online
Alexa Skill for interacting with http://www.pegelonline.wsv.de

## TODOs
- Fix new interaction model, see:
  * https://developer.amazon.com/de/docs/custom-skills/dialog-interface-reference.html#use-updatedintent
  * https://www.iot-experiments.com/create-an-alexa-skill/
  * https://developer.amazon.com/de/blogs/alexa/post/5fe7565a-9547-4e03-be36-6c62ed356d57/dynamically-elicit-slots-during-dialog-management-based-on-previously-given-slot-values
- Add test cases for single-slot utterances, see https://developer.amazon.com/de/docs/custom-skills/use-a-dialog-model-to-manage-ambiguous-responses.html#single-slot-utterances-for-an-intent
- Test manager.js using mock REST API, see http://bulkan-evcimen.com/testing_with_mocha_sinon.html
- switch to SDK V2 ApiClient http://www.talkingtocomputers.com/alexa-skills-kit-ask-sdk-v2#apiclient
- Add test cases and all water bodies from http://www.pegelonline.wsv.de/webservices/rest-api/v2/waters.json?includeStations=true
- There are two stations named "Frankfurt", they need to be distinguised
- There are two stations named "Neustadt", they need to be distinguised
- There are two stations named "Nienburg", they need to be distinguised
- When asking for a water, return list of stations, or for "Bodensee" just use "Konstanz"
- "Frage Pegel Online nach dem Pegel des Bodensee*s*" doesn't work, maybe use synonyms?