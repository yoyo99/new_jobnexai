export function getBestModel(promptType) {
  switch (promptType) {
    case 'image':
      return 'midjourney'; // ou 'stable-diffusion'
    case 'reasoning':
      return 'claude-3-sonnet'; // meilleur pour Chain of Thought
    case 'chat':
      return 'gpt-4o'; // rapide et contextuel
    case 'code':
      return 'gpt-4o'; // très bon en code
    default:
      return 'claude-3-sonnet'; // safe bet
  }
}
