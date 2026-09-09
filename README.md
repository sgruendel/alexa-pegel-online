# alexa-pegel-online
Alexa Skill for interacting with http://www.pegelonline.wsv.de

## Configuration

Commands are run from the `lambda/` directory. Copy `.env.example` to `.env` and set `SKILL_ID` to the Alexa skill
ID. The local file is ignored by Git.

GitHub Actions reads `SKILL_ID` from a repository variable. The deployed Lambda function must provide the same
variable in its environment configuration.

## TODOs
- Integration tests:
  * borkum
  * brunsbüttel
  * calbe
  * elsfleth
  * havelberg
  * hamburg
  * ilmenau
  * lübeck
  * rot(h)enburg
- Handle built-in intents for DisplayInterface like NavigateHome, More, Next ...
- Implement proper integration/simulation tests, see
  - https://github.com/hideokamoto/alexa-test-practice/blob/master/lambda/custom/tests/integrations/index.js
  - https://chatbotslife.com/alexa-are-you-ok-test-automation-for-alexa-skills-53088429d53
  - https://github.com/codeforequity-at/botium-core/wiki/What-is-Botium-%3F
- Add tests for single-slot utterances, see https://developer.amazon.com/de/docs/custom-skills/use-a-dialog-model-to-manage-ambiguous-responses.html#single-slot-utterances-for-an-intent
and "Wilhelmshaven" and other values starting a dialog
- Test manager.js using mock REST API, see http://bulkan-evcimen.com/testing_with_mocha_sinon.html