# alexa-pegel-online

[![CI](https://github.com/sgruendel/alexa-pegel-online/actions/workflows/node.js.yaml/badge.svg?branch=master)](https://github.com/sgruendel/alexa-pegel-online/actions/workflows/node.js.yaml)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](mise.toml)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)

The [Pegel Online skill for Alexa](https://www.amazon.de/Stefan-Pegel-Online/dp/B06XPLVSFH)
provides water levels from <http://www.pegelonline.wsv.de>.

## Configuration

Commands are run from the `lambda/` directory. Copy `.env.example` to `.env` and set `SKILL_ID` to the Alexa skill
ID. The local file is ignored by Git.

The deployed Lambda function must provide `SKILL_ID` in its environment configuration. Offline tests use a
dummy ID and require no deployment configuration.

## Testing

Run commands from the `lambda/` directory:

```bash
npm test                 # offline unit + integration tests with coverage
npm run test:contract    # live PegelOnline API checks
npm run test:e2e         # dialogs against the deployed Alexa development skill
```

See [TESTING.md](TESTING.md) for setup, individual suites, CI, and device checks.

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