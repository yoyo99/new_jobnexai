exports.handler = async () => ({
  statusCode: 501,
  body: JSON.stringify({
    error: 'users Netlify function désactivée temporairement (dépendances legacy manquantes).',
  }),
});
