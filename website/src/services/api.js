const API_URL = 'http://localhost:3000/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function fetchWithAuth(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = getHeaders();
  
  if (isFormData) {
    delete headers['Content-Type']; // Let browser set boundary
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API Request failed');
  }
  return data;
}

export const api = {
  getDashboard: () => fetchWithAuth('/users/dashboard'),
  
  getDocuments: () => fetchWithAuth('/platform/documents'),
  uploadDocument: (formData) => fetchWithAuth('/platform/documents/upload', { method: 'POST', body: formData }),
  deleteDocument: (id) => fetchWithAuth(`/platform/documents/${id}`, { method: 'DELETE' }),
  
  chatWithCopilot: (message, liveContext, conversationId) => fetchWithAuth('/ai/chat', { method: 'POST', body: JSON.stringify({ message, liveContext, conversationId }) }),
  getChatHistory: () => fetchWithAuth('/ai'),
  getChatConversation: (id) => fetchWithAuth(`/ai/${id}`),
  
  getHistory: () => fetchWithAuth('/platform/sessions/history'),
};
