// Utiliser une approche compatible avec l'environnement Netlify
// Définir la fonction createClient manuellement sans dépendre d'importations externes

import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../hooks/useSupabaseConfig';

// Types nécessaires pour TypeScript
type SupabaseClientType = SupabaseClient; // Utiliser le vrai type SupabaseClient

// IMPORTANT: Nous utilisons maintenant uniquement getSupabase() de useSupabaseConfig.ts
// pour assurer la cohérence du client dans toute l'application

// Fonction pour créer un client Supabase selon l'environnement - gardée pour la compatibilité
// Mais nous encourageons l'utilisation de getSupabase() à la place
export function createClient(supabaseUrl: string, supabaseKey: string): SupabaseClientType {
  console.warn('[DEPRECATED] Utilisation directe de createClient() dans src/lib/supabase.ts. Utilisez getSupabase() à la place.');
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL ou Anon Key manquante. Le client Supabase ne peut pas être initialisé.');
    throw new Error('Supabase URL or Anon Key is missing.');
  }
  return supabaseCreateClient(supabaseUrl, supabaseKey);
}

// --- Types et interfaces ---
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type?: string;
  is_admin?: boolean | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, any>; // Ajout de user_metadata
}

export interface Subscription {
  id: string;
  user_id: string;
  status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
  plan: 'free' | 'pro' | 'enterprise';
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  job_skills?: Array<{
    job: {
      id: string;
      title: string;
      company: string;
      created_at: string;
    };
  }>;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: number;
  years_experience: number;
  created_at: string;
  updated_at: string;
  skill: Skill;
}

export interface SkillResponse {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: number;
  years_experience: number;
  created_at: string;
  updated_at: string;
  skill: {
    id: string;
    name: string;
    category: string;
    job_skills: Array<{
      job: {
        id: string;
        title: string;
        company: string;
        created_at: string;
      };
    }>;
  };
}

export interface Job {
  id: string;
  source_id: string;
  title: string;
  company: string;
  company_logo?: string | null;
  location: string;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  job_type: string;
  url: string;
  posted_at: string;
  created_at: string;
  updated_at: string;
  remote_type?: 'remote' | 'hybrid' | 'onsite';
  experience_level?: 'junior' | 'mid' | 'senior';
  required_skills?: string[];
  preferred_skills?: string[];
}

export interface JobSuggestion {
  job: Job;
  matchScore: number;
  matchingSkills: string[];
}

export interface MarketTrend {
  category: string;
  count: number;
  percentage: number;
}

// Interface pour les métadonnées des CVs utilisateurs
export interface CVMetadata {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  file_size?: number;
  file_type?: string;
  is_primary: boolean;
  uploaded_at: string;
}

export interface UserAISettingsData {
  feature_engines: Record<string, string>;
  api_keys: Record<string, string>;
  // user_id n'est pas nécessaire ici car il est passé en argument ou implicite
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: 'draft' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'accepted' | 'withdrawn';
  notes: string | null;
  applied_at: string | null;
  next_step_date: string | null;
  next_step_type: 'phone' | 'technical' | 'hr' | 'final' | 'other' | null;
  created_at: string;
  updated_at: string;
  job: Job | null; // Utilise le type Job complet et peut être null
  timeline?: { date: string; description: string }[];
}

// IMPORTANT : Ne jamais exposer la SERVICE_ROLE_KEY côté client ! Utiliser uniquement la clé publique (anon) pour le front-end.
// Log pour le débogage sur Netlify
console.log('[SupabaseInit] Attempting to initialize Supabase client.');
console.log('[SupabaseInit] Using unified Supabase client from useSupabaseConfig.ts');

// En cas d'erreur, utiliser un client mocké pour éviter les plantages complets
// Note: à terme, il faudra peut-être retirer ce mock et laisser l'application échouer
// proprement si les variables d'environnement sont manquantes
let supabaseExport: SupabaseClient;

// Simuler un client Supabase pour le développement local ou les tests si les clés ne sont pas définies
const mockSupabaseClient = {
  auth: {
    getSession: async () => {
      console.warn('[SupabaseInit] Using mock Supabase client: getSession');
      return { data: { session: null }, error: null };
    },
    signInWithPassword: async (credentials: any) => {
      console.warn('[SupabaseInit] Using mock Supabase client: signInWithPassword', credentials);
      return { data: { user: { id: 'mock-user-id', email: credentials.email }, session: { access_token: 'mock-token' } }, error: null };
    },
    signUp: async (credentials: any) => {
      console.warn('[SupabaseInit] Using mock Supabase client: signUp', credentials);
      return { data: { user: { id: 'mock-user-id', email: credentials.email }, session: { access_token: 'mock-token' } }, error: null };
    },
    signOut: async () => {
      console.warn('[SupabaseInit] Using mock Supabase client: signOut');
      return { error: null };
    },
    onAuthStateChange: (callback: (event: string, session: any | null) => void) => {
      console.warn('[SupabaseInit] Using mock Supabase client: onAuthStateChange');
      // Simuler un changement d'état initial (non authentifié)
      callback('INITIAL_SESSION', null);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              console.warn('[SupabaseInit] Mock subscription unsubscribe.');
            },
          }
        }
      };
    },
    updateUser: async (attributes: any) => {
      console.warn('[SupabaseInit] Using mock Supabase client: updateUser', attributes);
      return { data: { user: { id: 'mock-user-id', ...attributes } }, error: null };
    },
    sendPasswordResetEmail: async (email: string) => {
      console.warn('[SupabaseInit] Using mock Supabase client: sendPasswordResetEmail', email);
      return { error: null };
    },
    getUser: async () => {
      console.warn('[SupabaseInit] Using mock Supabase client: getUser');
      return { data: { user: null }, error: null }; // ou simuler un utilisateur connecté
    },
  },
  from: (table: string) => {
    console.warn(`[SupabaseInit] Using mock Supabase client: from(${table})`);
    const mockChain = {
      select: (...args: any[]) => { console.warn('[SupabaseInit] Mock select', args); return mockChain; },
      insert: (...args: any[]) => { console.warn('[SupabaseInit] Mock insert', args); return Promise.resolve({ data: [], error: null }); },
      update: (...args: any[]) => { console.warn('[SupabaseInit] Mock update', args); return Promise.resolve({ data: [], error: null }); },
      delete: (...args: any[]) => { console.warn('[SupabaseInit] Mock delete', args); return Promise.resolve({ data: [], error: null }); },
      eq: (...args: any[]) => { console.warn('[SupabaseInit] Mock eq', args); return mockChain; },
      single: () => Promise.resolve({ data: null, error: null }), // Simuler une réponse single()
    };
    return mockChain;
  },
  rpc: async (name: string, params?: any) => {
    console.warn(`[SupabaseInit] Using mock Supabase client: rpc(${name})`, params);
    if (name === 'calculate_total_price') {
      return Promise.resolve({ data: 100, error: null }); // Simuler une réponse pour rpc
    }
    return Promise.resolve({ data: null, error: null });
  },
  functions: {
    invoke: async (functionName: string, options?: any) => {
      console.warn(`[SupabaseInit] Using mock Supabase client: functions.invoke(${functionName})`, options);
      // Simuler la réponse pour create-stripe-checkout
      if (functionName === 'create-stripe-checkout') {
        return {
          data: {
            sessionId: 'mock_session_id_12345'
          },
          error: null
        };
      }
      // Simuler la réponse pour get_user_roles
      if (functionName === 'get_user_roles') {
        return {
          data: { roles: ['user'] }, // Simule un utilisateur avec le rôle 'user'
          error: null
        };
      }
      return { data: null, error: { message: 'Mock function not implemented' } }; // Réponse par défaut
    }
  },
  realtime: null, // ou simuler un client realtime basique si besoin
};

// Utiliser le client Supabase singleton de useSupabaseConfig.ts
try {
  console.log('[SupabaseInit] Initializing Supabase client with getSupabase().');
  supabaseExport = getSupabase(); // Utilise l'instance singleton
  console.log('[SupabaseInit] Supabase client initialized successfully.');
} catch (error) {
  console.error('[SupabaseInit] Error initializing Supabase client:', error);
  console.warn('[SupabaseInit] Falling back to mock client as last resort.');
  supabaseExport = mockSupabaseClient as unknown as SupabaseClient;
}

export const supabase = supabaseExport;

export async function getMarketTrends(): Promise<{
  jobTypes: MarketTrend[];
  locations: MarketTrend[];
  salary: {
    average: number;
    count: number;
  };
}> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*');
  if (error) throw error;
  if (!data) return { jobTypes: [], locations: [], salary: { average: 0, count: 0 } };

  // Job types
  const jobTypeCounts: Record<string, number> = {};
  for (const job of data) {
    if (job.job_type) {
      jobTypeCounts[job.job_type] = (jobTypeCounts[job.job_type] || 0) + 1;
    }
  }
  const totalJobs = data.length;
  const jobTypes: MarketTrend[] = Object.entries(jobTypeCounts).map(([category, count]) => ({
    category,
    count,
    percentage: totalJobs > 0 ? (count / totalJobs) * 100 : 0
  }));

  // Locations
  const locationCounts: Record<string, number> = {};
  for (const job of data) {
    if (job.location) {
      locationCounts[job.location] = (locationCounts[job.location] || 0) + 1;
    }
  }
  const locations: MarketTrend[] = Object.entries(locationCounts).map(([category, count]) => ({
    category,
    count,
    percentage: totalJobs > 0 ? (count / totalJobs) * 100 : 0
  }));

  // Salaries
  const salaries = data.filter((job: any) => typeof job.salary_min === 'number' && typeof job.salary_max === 'number');
  const avgSalary = salaries.length > 0
    ? salaries.reduce((sum: number, job: any) => sum + ((job.salary_min + job.salary_max) / 2), 0) / salaries.length
    : 0;

  return {
    jobTypes,
    locations,
    salary: {
      average: avgSalary,
      count: salaries.length
    }
  };
}

export async function getJobs(filters: {
  search?: string;
  jobType?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  remote?: 'remote' | 'hybrid' | 'onsite';
  experienceLevel?: 'junior' | 'mid' | 'senior';
  sortBy?: 'date' | 'salary';
  currency?: string; // Ajout du filtre de devise
  requiredSkills?: string[];
  preferredSkills?: string[];
} = {}): Promise<Job[]> {
  let query = supabase
    .from('jobs')
    .select('*');

  if (filters.search) {
    query = query.textSearch('search_vector', filters.search);
  }
  if (filters.jobType) {
    query = query.eq('job_type', filters.jobType);
  }
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters.salaryMin) {
    query = query.gte('salary_min', filters.salaryMin);
  }
  if (filters.salaryMax) {
    query = query.lte('salary_max', filters.salaryMax);
  }
  if (filters.remote) {
    query = query.eq('remote_type', filters.remote);
  }
  if (filters.experienceLevel) {
    query = query.eq('experience_level', filters.experienceLevel);
  }
  if (filters.currency) {
    query = query.eq('currency', filters.currency);
  }
  if (filters.sortBy === 'salary') {
    query = query.order('salary_max', { ascending: false });
  } else {
    query = query.order('posted_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  // On force le cast via unknown pour satisfaire TypeScript, car la structure est contrôlée par la requête Supabase.
  return data as unknown as Job[];
}

export async function getJobSuggestions(userId: string): Promise<JobSuggestion[]> {
  const { data: suggestions, error } = await supabase
    .from('job_suggestions')
    .select(`job_id, match_score, job:jobs (*)`)
    .eq('user_id', userId)
    .order('match_score', { ascending: false });

  if (error) throw error;
  if (!suggestions) return [];

  return suggestions.map(suggestion => ({
    job: Array.isArray(suggestion.job) ? suggestion.job[0] as Job : suggestion.job as Job,
    matchScore: suggestion.match_score,
    matchingSkills: [] // à adapter si tu veux un vrai calcul de matchingSkills
  }));
}

// --- Fonctions pour User AI Settings ---

export async function getUserAISettings(userId: string): Promise<UserAISettingsData | null> {
  if (!userId) {
    console.warn('getUserAISettings: userId is required.');
    return null;
  }
  const { data, error } = await supabase
    .from('user_ai_settings')
    .select('feature_engines, api_keys')
    .eq('user_id', userId)
    .single(); // .single() car un utilisateur n'a qu'un seul ensemble de paramètres

  if (error) {
    if (error.code === 'PGRST116') { // PGRST116: 'No rows found'
      console.log('No AI settings found for user:', userId);
      return null; // Pas une erreur, juste pas de paramètres encore
    }
    console.error('Error fetching user AI settings:', error);
    throw error;
  }
  return data as UserAISettingsData;
}

export async function saveUserAISettings(userId: string, settings: UserAISettingsData): Promise<void> {
  if (!userId) {
    console.warn('saveUserAISettings: userId is required.');
    return;
  }
  const { data, error } = await supabase
    .from('user_ai_settings')
    .upsert(
      {
        user_id: userId,
        feature_engines: settings.feature_engines,
        api_keys: settings.api_keys,
        updated_at: new Date().toISOString(), // Assurez-vous que updated_at est géré
      },
      {
        onConflict: 'user_id', // En cas de conflit sur user_id, met à jour
      }
    )
    .select(); // Pour obtenir les données insérées/mises à jour si nécessaire

  if (error) {
    console.error('Error saving user AI settings:', error);
    throw error;
  }
  console.log('User AI settings saved successfully for user:', userId, data);
}

// --- Fonctions pour la gestion des CVs Utilisateurs ---

const CV_STORAGE_BUCKET = 'cvs'; // Nom du bucket de stockage pour les CVs

/**
 * Récupère la liste des CVs d'un utilisateur.
 */
export const getUserCVs = async (userId: string): Promise<CVMetadata[]> => {
  if (!userId) throw new Error('User ID is required to fetch CVs.');

  const { data, error } = await supabase
    .from('user_cvs')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching user CVs:', error);
    throw error;
  }
  return data || [];
};

/**
 * Uploade un fichier CV vers Supabase Storage et enregistre ses métadonnées.
 * @param userId L'ID de l'utilisateur.
 * @param file Le fichier CV à uploader.
 * @returns Les métadonnées du CV uploadé.
 */
export const uploadUserCV = async (userId: string, file: File): Promise<CVMetadata> => {
  if (!userId) throw new Error('User ID is required to upload CV.');
  if (!file) throw new Error('File is required to upload CV.');

  // Vérifier la limite de CVs côté client (la BDD a aussi une RLS pour ça)
  const existingCVs = await getUserCVs(userId);
  if (existingCVs.length >= 2) {
    throw new Error('Limite de 2 CVs atteinte. Veuillez en supprimer un pour en ajouter un nouveau.');
  }

  const fileExt = file.name.split('.').pop();
  const uniqueFileName = `${userId}/${Date.now()}.${fileExt}`;
  const storagePath = `${uniqueFileName}`; // storagePath est relatif au bucket

  // 1. Upload vers Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(CV_STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false, // Ne pas remplacer si le fichier existe déjà (improbable avec nom unique)
    });

  if (uploadError) {
    console.error('Error uploading CV to storage:', uploadError);
    throw uploadError;
  }

  if (!uploadData) {
    throw new Error('Upload to storage failed, no data returned.');
  }

  // 2. Enregistrer les métadonnées dans la table user_cvs
  const cvMetadataToInsert = {
    user_id: userId,
    file_name: file.name,
    storage_path: uploadData.path, // Utiliser le chemin retourné par storage, qui est relatif au bucket
    file_size: file.size,
    file_type: file.type,
    is_primary: existingCVs.length === 0, // Le premier CV uploadé devient principal par défaut
  };

  const { data: dbData, error: dbError } = await supabase
    .from('user_cvs')
    .insert(cvMetadataToInsert)
    .select()
    .single();

  if (dbError) {
    console.error('Error saving CV metadata to database:', dbError);
    // Tenter de supprimer le fichier du storage si l'insertion en BDD échoue
    await supabase.storage.from(CV_STORAGE_BUCKET).remove([storagePath]);
    throw dbError;
  }

  return dbData as CVMetadata;
};

/**
 * Supprime un CV (métadonnées et fichier dans Storage).
 * @param cvId L'ID du CV dans la table user_cvs.
 * @param storagePath Le chemin du fichier dans Supabase Storage.
 */
export const deleteUserCV = async (cvId: string, storagePath: string): Promise<void> => {
  if (!cvId) throw new Error('CV ID is required to delete CV metadata.');
  if (!storagePath) throw new Error('Storage path is required to delete CV file.');

  // 1. Supprimer de la base de données
  const { error: dbError } = await supabase
    .from('user_cvs')
    .delete()
    .eq('id', cvId);

  if (dbError) {
    console.error('Error deleting CV metadata from database:', dbError);
    throw dbError;
  }

  // 2. Supprimer du Storage
  const { error: storageError } = await supabase.storage
    .from(CV_STORAGE_BUCKET)
    .remove([storagePath]);

  if (storageError) {
    console.error('Error deleting CV from storage:', storageError);
    // Note: La métadonnée est déjà supprimée. Gérer cette incohérence potentielle si nécessaire.
    throw storageError;
  }
};

/**
 * Définit un CV comme principal pour un utilisateur.
 * Tous les autres CVs de cet utilisateur seront marqués comme non principaux.
 * @param userId L'ID de l'utilisateur.
 * @param cvIdToMakePrimary L'ID du CV à marquer comme principal.
 */
export const setPrimaryCV = async (userId: string, cvIdToMakePrimary: string): Promise<void> => {
  if (!userId) throw new Error('User ID is required.');
  if (!cvIdToMakePrimary) throw new Error('CV ID to make primary is required.');

  // Étape 1: Mettre tous les CVs de l'utilisateur à is_primary = false
  const { error: updateError } = await supabase
    .from('user_cvs')
    .update({ is_primary: false })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error resetting primary CVs:', updateError);
    throw updateError;
  }

  // Étape 2: Mettre le CV spécifié à is_primary = true
  const { error: setError } = await supabase
    .from('user_cvs')
    .update({ is_primary: true })
    .eq('id', cvIdToMakePrimary)
    .eq('user_id', userId); // Assurer qu'on met à jour le CV du bon utilisateur

  if (setError) {
    console.error('Error setting primary CV:', setError);
    throw setError;
  }
};

// --- Fonctions pour appeler les Edge Functions --- 

/**
 * Appelle la fonction Edge 'extract-cv-text' pour extraire le texte d'un CV.
 * @param cvPath Le chemin de stockage du fichier CV dans Supabase Storage.
 * @returns Le texte extrait du CV.
 */
export const invokeExtractCvText = async (cvPath: string): Promise<string> => {
  if (!supabaseExport) throw new Error('Supabase client is not initialized');
  if (!cvPath) throw new Error('CV path is required to extract text.');

  const { data, error } = await supabaseExport.functions.invoke('extract-cv-text', {
    body: { cvPath },
  });

  if (error) {
    console.error('Error invoking extract-cv-text function:', error);
    throw error;
  }

  // La fonction retourne { extractedText: string, metadata: any } ou { error: string }
  if (data.error) {
    console.error('Error from extract-cv-text function:', data.error);
    throw new Error(data.error);
  }

  return data.extractedText;
};

/**
 * Appelle la fonction Edge 'generate-cover-letter' pour générer une lettre de motivation.
 * @param cvText Le texte du CV.
 * @param jobTitle Le titre du poste.
 * @param companyName Le nom de l'entreprise.
 * @param jobDescription La description du poste.
 * @param language La langue cible pour la lettre.
 * @param customInstructions Instructions personnalisées optionnelles.
 * @returns Le contenu de la lettre de motivation générée.
 */
export const invokeGenerateCoverLetter = async (
  cvText: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  language: string,
  customInstructions?: string
): Promise<string> => {
  if (!supabaseExport) throw new Error('Supabase client is not initialized');

  const body = {
    cvText,
    jobTitle,
    companyName,
    jobDescription,
    language,
    customInstructions,
  };

  const { data, error } = await supabaseExport.functions.invoke('generate-cover-letter', {
    body,
  });

  if (error) {
    console.error('Error invoking generate-cover-letter function:', error);
    throw error;
  }

  // La fonction retourne { coverLetter: string } ou { error: string }
  if (data.error) {
    console.error('Error from generate-cover-letter function:', data.error);
    throw new Error(data.error);
  }

  return data.coverLetter;
};

// --- Fonctions pour la gestion des Lettres de Motivation Utilisateurs ---

export interface CoverLetterMetadata {
  id: string;
  user_id: string;
  cv_id_used?: string | null; // ID du CV de user_cvs utilisé
  job_title?: string | null;
  company_name?: string | null;
  job_description_details?: string | null; // Description complète ou notes clés
  cover_letter_content: string; // Contenu de la lettre
  language: string; // Langue de la lettre (ex: 'fr', 'en')
  custom_instructions?: string | null; // Instructions spécifiques de l'utilisateur pour l'IA
  ai_model_used?: string | null; // Modèle d'IA utilisé
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Récupère toutes les lettres de motivation d'un utilisateur.
 */
export const getUserCoverLetters = async (userId: string): Promise<CoverLetterMetadata[]> => {
  if (!userId) throw new Error('User ID is required to fetch cover letters.');

  const { data, error } = await supabase
    .from('user_cover_letters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user cover letters:', error);
    throw error;
  }
  return data || [];
};

/**
 * Crée une nouvelle lettre de motivation.
 * @param coverLetterData Données de la lettre de motivation à créer. user_id sera extrait du token JWT par Supabase via RLS.
 */
export const createCoverLetter = async (coverLetterData: Omit<CoverLetterMetadata, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id: string }): Promise<CoverLetterMetadata> => {
  const { data, error } = await supabase
    .from('user_cover_letters')
    .insert(coverLetterData) // user_id doit être inclus ici pour la politique RLS au cas où elle ne peut pas l'inférer
    .select()
    .single();

  if (error) {
    console.error('Error creating cover letter:', error);
    throw error;
  }
  return data;
};

/**
 * Met à jour une lettre de motivation existante.
 */
export const updateCoverLetter = async (id: string, updates: Partial<Omit<CoverLetterMetadata, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<CoverLetterMetadata> => {
  const { data, error } = await supabase
    .from('user_cover_letters')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating cover letter:', error);
    throw error;
  }
  return data;
};

/**
 * Supprime une lettre de motivation.
 */
export const deleteCoverLetter = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_cover_letters')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting cover letter:', error);
    throw error;
  }
};
