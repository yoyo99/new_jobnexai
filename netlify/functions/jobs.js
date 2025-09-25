// netlify/functions/jobs.js

exports.handler = async () => ({
  statusCode: 501,
  body: JSON.stringify({
    error: 'jobs Netlify function désactivée temporairement (dépendances legacy manquantes).',
  }),
});
