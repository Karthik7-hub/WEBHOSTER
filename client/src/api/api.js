import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to append authorization token to every outgoing api call
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('webhoster_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch unauthorized 401s and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('webhoster_token');
      localStorage.removeItem('webhoster_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Sends login request to backend auth service.
 */
export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login', { username, password });
  return response.data;
};

/**
 * Queries server to verify if local token session is still active and valid.
 */
export const verifyToken = async () => {
  const response = await apiClient.get('/auth/verify');
  return response.data;
};

/**
 * Triggers backend token invalidation and clears local session.
 */
export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

/**
 * Uploads a static website ZIP archive with active progress notifications.
 * 
 * @param {File} file - The file to upload.
 * @param {Function} onProgress - Callbacks indicating percentage completed (0-100).
 */
export const deployZIP = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/deploy', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

/**
 * Returns all active deployments.
 */
export const getDeployments = async () => {
  const response = await apiClient.get('/deployments');
  return response.data;
};

/**
 * Returns details for a specific deployment.
 */
export const getDeployment = async (id) => {
  const response = await apiClient.get(`/deployments/${id}`);
  return response.data;
};

/**
 * Deletes a deployment from system.
 */
export const deleteDeployment = async (id) => {
  const response = await apiClient.delete(`/deployments/${id}`);
  return response.data;
};

export default apiClient;
