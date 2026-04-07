export class ApiClient {
    private apiKey: string = '';

    setApiKey(key: string) {
        this.apiKey = key;
    }

    getApiKey() {
        return this.apiKey;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        if (!this.apiKey) {
            throw new Error('No API Key provided. Please set an API Key first.');
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-admin-key': this.apiKey,
            ...(options.headers as Record<string, string> || {})
        };

        const response = await fetch(`/api/admin${endpoint}`, {
            ...options,
            headers
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API Request Failed');
        }

        return result.data ?? result;
    }

    async get<T>(endpoint: string, options: RequestInit = {}) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, body: any, options: RequestInit = {}) {
        return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    }

    async put<T>(endpoint: string, body: any, options: RequestInit = {}) {
        return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    }

    async delete<T>(endpoint: string, options: RequestInit = {}) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
