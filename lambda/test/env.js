// Load before the skill imports config.js. Offline tests never use deployment credentials.
process.env.SKILL_ID = 'amzn1.ask.skill.00000000-0000-4000-8000-000000000000';
process.env.LOG_LEVEL = 'error';
