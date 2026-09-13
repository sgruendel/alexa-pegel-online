# Testing Pegel Online

Use Node 24, matching the Lambda runtime in `ask-resources.json`. Run the commands below from `lambda/` after `npm ci`.

| Command | Scope | External access |
| --- | --- | --- |
| `npm test` | Unit and local integration tests, with runtime coverage thresholds | None |
| `npm run test:unit` | Normalization, dates, slot resolution, model consistency, dialog runner | None |
| `npm run test:integration` | Actual Lambda handler, ASK SDK, manager, HTTP adapter with Nock fixtures | None |
| `npm run test:contract` | Live station catalog and measurement contract | PegelOnline |
| `npm run test:e2e` | Every turn of a dialog against the deployed development skill | Alexa and PegelOnline |
| `npm run lint` | ESLint checks | None |

## Offline tests and coverage

Offline commands preload `test/env.js`, which sets a dummy skill ID and ignores local deployment configuration.
`test/setup.js` blocks HTTP connections with Nock, cleans up mocks after each test,
and fails tests with unconsumed expectations.

`npm test` includes unexecuted runtime files in coverage and enforces at least 90% line, statement, and
function coverage and 85% branch coverage. Reports are written to `lambda/coverage/`.
Model-generation and deployment scripts are excluded from runtime coverage; the checked-in interaction model and station
variant mappings are checked for consistency by a dedicated test.

GitHub Actions runs lint and the offline suite on Node 24 in both UTC and Europe/Berlin.
This checks that formatting German measurement times is independent of the Lambda host timezone. The API contract
workflow runs separately, weekly or on demand, so an upstream outage does not fail ordinary PR tests.

## Deployed Alexa dialogs

Install and configure ASK CLI (validated with version 2.30.7), for example with `npm install --global ask-cli@2.30.7`
and `ask configure`.
The default ASK profile must have access to the development skill, and the skill must be enabled for that account.
Copy `.env.example` to `.env` and set `SKILL_ID`.

Run `npm run test:e2e` after deploying the intended Lambda code and interaction model and waiting for the model build
to finish. These tests do not deploy code or models. They exercise whatever version is already deployed to the
development skill, so their results alone cannot validate an un-deployed working tree.

Replay utterances live in `test/e2e/*.json`; `expectations.json` specifies speech, slot elicitation/delegation, and
resolved station expectations for every turn. The runner retains every completed simulation result and
validates each turn. It permits two attempts only for incomplete output or the known transient
"An unexpected error occurred." simulation error.
Each ASK process has a 35-second timeout within an 80-second overall budget, below Mocha's 90-second timeout.
A timed-out subprocess is killed and temporary replay/output files are removed.
Assertion failures and other skill or CLI errors are not retried.

For a single replay, use:

```bash
node --env-file-if-exists=.env test/run-dialog.js -r test/e2e/hamburg_harburg.json
```

## Before release: device checks

Text simulations do not verify speech recognition, pronunciation, microphone behavior, or actual rendering.
Check at least one voice-only Echo and one Echo Show
(or use the developer console APL preview for additional viewport sizes):

- Launch, help, cancel, and stop, including microphone/session behavior.
- A direct gauge query and a follow-up station or upper/lower gauge choice.
- Water-level pronunciation, decimal values, units, and trend wording.
- Echo Show title, measurement time, graph visibility, and small/large layouts.
- Alexa app card content and graph; speech on a device without APL support.

The Lambda gives lookups a shared six-second budget, shortened if less invocation time remains.
Measurement timestamps retain their offsets and display in Europe/Berlin, including daylight-saving changes.
