import { generateCoverLetter } from '../ai'
import { supabase } from '../supabase'

// Mock de la fonction invoke de manière plus générique pour couvrir tous les appels
jest.mock('../supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

// Mock de la fonction getBestModel pour contrôler le modèle utilisé dans les tests
jest.mock('../getBestModel', () => ({
  getBestModel: jest.fn(),
}));

jest.mock('../mammouthClient', () => ({
  sendPromptToMammouth: jest.fn(),
}));

describe('generateCoverLetter', () => {
  const mockCV = { education: [], experience: [] };
  const mockJobDescription = 'Description de poste';
  const mockLanguage = 'fr';
  const mockTone = 'professional';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('devrait générer une lettre de motivation avec succès via Mammouth.ai', async () => {
    const mockGeneratedLetter = 'Voici votre lettre de motivation.';
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { coverLetter: mockGeneratedLetter },
      error: null,
    });

    const result = await generateCoverLetter(mockCV, mockJobDescription, mockLanguage, mockTone);

    expect(result).toBe(mockGeneratedLetter);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('askMammouthFromCV', {
      body: {
        cv: mockCV,
        jobDescription: mockJobDescription,
        language: mockLanguage,
        tone: mockTone,
      },
    });
  });

  test('devrait gérer une erreur lors de la génération de la lettre de motivation', async () => {
    const error = new Error('Erreur de la fonction Netlify');
    (supabase.functions.invoke as any).mockResolvedValue({ data: null, error });

    await expect(
      generateCoverLetter(mockCV, mockJobDescription, mockLanguage, mockTone)
    ).rejects.toThrow('Erreur de la fonction Netlify');
  });
});