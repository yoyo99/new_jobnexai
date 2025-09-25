// netlify/functions/askMammouthFromCV.js

exports.handler = async () => {
  return {
    statusCode: 501,
    body: JSON.stringify({
      error: 'askMammouthFromCV est désactivée temporairement (dépendances manquantes).',
    }),
  };
};
