import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api/api';

const DeploymentContext = createContext();

export const useDeployments = () => {
  const context = useContext(DeploymentContext);
  if (!context) {
    throw new Error('useDeployments must be used within a DeploymentProvider');
  }
  return context;
};

export const DeploymentProvider = ({ children }) => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  // 1. Fetch all deployments from the backend server
  const fetchDeployments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getDeployments();
      if (response.success) {
        setDeployments(response.data);
      } else {
        setError(response.error || 'Failed to fetch deployments');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Network error, please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Session verification on app boot
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem('webhoster_token');
      const storedUser = localStorage.getItem('webhoster_user');
      
      if (!storedToken) {
        setIsAuthenticated(false);
        setAuthLoading(false);
        return;
      }

      try {
        const verifyRes = await api.verifyToken();
        if (verifyRes.success && verifyRes.isValid) {
          setIsAuthenticated(true);
          const currentUsername = verifyRes.username || storedUser || 'admin';
          setAdminUser(currentUsername);
          if (verifyRes.username && verifyRes.username !== storedUser) {
            localStorage.setItem('webhoster_user', verifyRes.username);
          }
          await fetchDeployments();
        } else {
          // Token is invalid, wipe local storage
          localStorage.removeItem('webhoster_token');
          localStorage.removeItem('webhoster_user');
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } catch (err) {
        console.error('Session validation error:', err);
        // Wipe local state to trigger standard login redirections
        localStorage.removeItem('webhoster_token');
        localStorage.removeItem('webhoster_user');
        setIsAuthenticated(false);
        setAdminUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();
  }, []);

  // 3. Login Service Method
  const loginUser = async (username, password) => {
    setError(null);
    try {
      const response = await api.login(username, password);
      if (response.success) {
        localStorage.setItem('webhoster_token', response.data.token);
        localStorage.setItem('webhoster_user', response.data.username);
        
        setIsAuthenticated(true);
        setAdminUser(response.data.username);
        
        // Fetch deployments list immediately upon login
        await fetchDeployments();
        return { success: true };
      } else {
        throw new Error(response.error || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Login failed due to network error.';
      setError(msg);
      throw new Error(msg);
    }
  };

  // 4. Logout Service Method
  const logoutUser = async () => {
    setError(null);
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error on backend:', err);
    } finally {
      localStorage.removeItem('webhoster_token');
      localStorage.removeItem('webhoster_user');
      setIsAuthenticated(false);
      setAdminUser(null);
      setDeployments([]);
    }
  };

  // 5. Perform ZIP deploy upload
  const uploadAndDeploy = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const response = await api.deployZIP(file, (progress) => {
        setUploadProgress(progress);
      });
      
      if (response.success) {
        // Prepend new deployment to history list
        setDeployments((prev) => [response.data, ...prev]);
        return response.data;
      } else {
        throw new Error(response.error || 'Deployment failed');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Failed to deploy website ZIP.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // 6. Delete deployment
  const removeDeployment = async (id) => {
    setError(null);
    try {
      const response = await api.deleteDeployment(id);
      if (response.success) {
        setDeployments((prev) => prev.filter((d) => d.id !== id));
        return true;
      } else {
        setError(response.error || 'Failed to delete deployment');
        return false;
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete deployment due to system error.');
      return false;
    }
  };

  return (
    <DeploymentContext.Provider
      value={{
        deployments,
        loading,
        error,
        uploadProgress,
        isUploading,
        isAuthenticated,
        authLoading,
        adminUser,
        setAdminUser,
        fetchDeployments,
        uploadAndDeploy,
        removeDeployment,
        loginUser,
        logoutUser,
        setError,
      }}
    >
      {children}
    </DeploymentContext.Provider>
  );
};
