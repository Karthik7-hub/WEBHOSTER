import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeployments } from '../context/DeploymentContext';
import { Lock, User, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { loginUser, error, setError } = useDeployments();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(username.trim(), password);
      if (res.success) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setLocalError(err.message || 'Invalid administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className="glowing-bg"></div>
      
      <div className={`${styles.loginCard} ${localError ? styles.shake : ''}`}>
        <div className={styles.iconContainer}>
          <Lock size={32} className={styles.lockIcon} />
        </div>

        <div className={styles.headerArea}>
          <h1>WebHoster Login</h1>
          <p>Provide administration credentials to manage deployments</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {localError && (
            <div className={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{localError}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <div className={styles.inputField}>
              <User size={16} className={styles.inputIcon} />
              <input
                type="text"
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputField}>
              <KeyRound size={16} className={styles.inputIcon} />
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span className={styles.spinner}></span>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Authenticate Session</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
