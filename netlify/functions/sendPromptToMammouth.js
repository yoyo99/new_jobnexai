// netlify/functions/sendPromptToMammouth.js

exports.handler = async () => ({
  statusCode: 501,
  body: JSON.stringify({
    error: 'sendPromptToMammouth est désactivée temporairement (dépendances legacy manquantes).',
  }),
});
