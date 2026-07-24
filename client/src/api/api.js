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
 * Retrieves aggregate platform statistics.
 */
export const getPlatformStats = async () => {
  const response = await apiClient.get('/stats');
  return response.data;
};

/**
 * Updates administrative user credentials.
 */
export const updateCredentials = async (currentPassword, newUsername, newPassword) => {
  const response = await apiClient.put('/auth/credentials', { currentPassword, newUsername, newPassword });
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
 * Returns build and audit logs for a specific deployment.
 */
export const getDeploymentLogs = async (id) => {
  const response = await apiClient.get(`/deployments/${id}/logs`);
  return response.data;
};

/**
 * Deletes a deployment from system.
 */
export const deleteDeployment = async (id) => {
  const response = await apiClient.delete(`/deployments/${id}`);
  return response.data;
};

/**
 * Creates a new project from a template.
 */
export const createProject = async (name, template) => {
  const response = await apiClient.post('/projects/create', { name, template });
  return response.data;
};

/**
 * Redeploys a project from the editor.
 */
export const deployProject = async (id) => {
  const response = await apiClient.post(`/projects/${id}/deploy`);
  return response.data;
};

/**
 * Performs lexical search over filenames and text contents.
 */
export const searchFiles = async (id, query) => {
  const response = await apiClient.get(`/projects/${id}/search`, { params: { query } });
  return response.data;
};

/**
 * Retrieves the recursive file hierarchy tree for the project.
 */
export const getFiles = async (id) => {
  const response = await apiClient.get(`/projects/${id}/files`);
  return response.data;
};

/**
 * Reads a single file's content.
 */
export const getFileContent = async (id, filePath) => {
  const response = await apiClient.get(`/projects/${id}/files/content`, { params: { path: filePath } });
  return response.data;
};

/**
 * Overwrites text file content.
 */
export const saveFileContent = async (id, filePath, content) => {
  const response = await apiClient.put(`/projects/${id}/files/content`, { path: filePath, content });
  return response.data;
};

/**
 * Creates an empty file or folder.
 */
export const createFileOrFolder = async (id, filePath, isFolder) => {
  const response = await apiClient.post(`/projects/${id}/files/create`, { path: filePath, isFolder });
  return response.data;
};

/**
 * Deletes a file or directory recursively.
 */
export const deleteFileOrFolder = async (id, filePath) => {
  const response = await apiClient.delete(`/projects/${id}/files/delete`, { params: { path: filePath } });
  return response.data;
};

/**
 * Renames a file or folder.
 */
export const renameFileOrFolder = async (id, oldPath, newPath) => {
  const response = await apiClient.post(`/projects/${id}/files/rename`, { oldPath, newPath });
  return response.data;
};

/**
 * Retrieves aggregate platform storage sizes and stale folders lists.
 */
export const getStorageAnalytics = async () => {
  const response = await apiClient.get('/deployments/storage-analytics');
  return response.data;
};

/**
 * Quarantines stale local deployment folders (supports dryRun=true).
 */
export const cleanupStaleDeployments = async (dryRun = false) => {
  const response = await apiClient.post(`/deployments/cleanup-stale?dryRun=${dryRun}`);
  return response.data;
};

/**
 * Restores a folder from quarantine back to the live deployments directory.
 */
export const restoreQuarantine = async (id) => {
  const response = await apiClient.post(`/deployments/trash/${id}/restore`);
  return response.data;
};

export const purgeQuarantine = async (id) => {
  const response = await apiClient.delete(`/deployments/trash/${id}/delete-permanently`);
  return response.data;
};

/**
 * Commits draft changes, updates live deployment directory, and logs a new version.
 */
export const publishDraft = async (id) => {
  const response = await apiClient.post(`/projects/${id}/publish`);
  return response.data;
};

/**
 * Retrieves the version logs for a specific project.
 */
export const getVersionHistory = async (id) => {
  const response = await apiClient.get(`/projects/${id}/versions`);
  return response.data;
};

/**
 * Rolls back both drafts and live production workspaces to a previous Version.
 */
export const rollbackToVersion = async (id, versionNumber) => {
  const response = await apiClient.post(`/projects/${id}/rollback`, { versionNumber });
  return response.data;
};

export default apiClient;

