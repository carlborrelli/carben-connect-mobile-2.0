import Constants from 'expo-constants';

function getBaseUrl(): string {
  const extra = Constants?.expoConfig?.extra;
  const manifestExtra = Constants?.manifest2?.extra?.expoClient?.extra;

  return (
    extra?.apiUrl ||
    manifestExtra?.apiUrl ||
    'https://www.carbenconnect.com'
  );
}

export interface ApiOptions extends RequestInit {
  timeout?: number;
}

export async function api(
  path: string,
  options: ApiOptions = {},
  token?: string
): Promise<any> {
  const timeout_val = options.timeout || 15000;
  const fetchOptions = { ...options };
  delete fetchOptions.timeout;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout_val);

  try {
    const baseUrl = getBaseUrl();
    const url = baseUrl + path;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const method = fetchOptions.method || 'GET';
    console.log('[API] ' + method + ' ' + url);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const errorMsg = 'HTTP ' + response.status + ': ' + response.statusText + (errorText ? ' - ' + errorText : '');
      const error = new Error(errorMsg);
      console.error('[API] Error:', error.message);
      throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: (path: string, token?: string, options?: ApiOptions) =>
    api(path, { ...options, method: 'GET' }, token),

  post: (path: string, data?: any, token?: string, options?: ApiOptions) =>
    api(
      path,
      {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      token
    ),

  put: (path: string, data?: any, token?: string, options?: ApiOptions) =>
    api(
      path,
      {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      token
    ),

  delete: (path: string, token?: string, options?: ApiOptions) =>
    api(path, { ...options, method: 'DELETE' }, token),
};
