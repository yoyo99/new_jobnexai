/**
 * Utilitaires pour les appels API vers les fonctions Netlify et autres endpoints
 */

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface ApiOptions {
  headers?: Record<string, string>;
  token?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
}

/**
 * Client fetch configuré pour les appels API
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { headers = {}, token, method = 'GET', body } = options;
  
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `/.netlify/functions/${endpoint}`;
  
  const authHeaders = token 
    ? { Authorization: `Bearer ${token}` } 
    : {};
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Gérer les différents types de réponses
    let data = null;
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      data = await response.text();
    }

    if (!response.ok) {
      // Si c'est une erreur 4xx ou 5xx, formater la réponse d'erreur
      return {
        data: null,
        error: data?.error || response.statusText || 'Une erreur est survenue',
        status: response.status,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error: any) {
    // Erreurs réseau ou autre erreur inattendue
    return {
      data: null,
      error: error.message || 'Erreur de connexion',
      status: 0, // 0 indique une erreur de connexion
    };
  }
}

/**
 * Méthodes HTTP communes
 */
export const api = {
  async get<T = any>(endpoint: string, options: Omit<ApiOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: 'GET' });
  },
  
  async post<T = any>(endpoint: string, body: any, options: Omit<ApiOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: 'POST', body });
  },
  
  async put<T = any>(endpoint: string, body: any, options: Omit<ApiOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: 'PUT', body });
  },
  
  async delete<T = any>(endpoint: string, options: Omit<ApiOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
  },
  
  async patch<T = any>(endpoint: string, body: any, options: Omit<ApiOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { ...options, method: 'PATCH', body });
  },
};
