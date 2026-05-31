import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeployments } from '../context/DeploymentContext';
import { Mail, Key, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
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
      setLocalError('Please enter both email and password.');
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
      {/* LEFT COLUMN: BRANDING & GLOWS */}
      <div className={styles.brandingColumn}>
        <div className={styles.glowingBg}>
          <div className={styles.glowPurple}></div>
          <div className={styles.glowBlue}></div>
        </div>

        <div className={styles.brandingContent}>
          <div className={styles.brandTitle}>
            <Zap size={38} className={styles.logoIcon} />
            <span className={styles.logoText}>Web<span className={styles.logoHighlight}>Hoster</span></span>
          </div>

          <h2 className={styles.brandingHeadline}>
            Build, edit, deploy, and manage static websites
          </h2>

          <div className={styles.featuresPills}>
            <span className={styles.featurePill}>Instant Deployments</span>
            <span className={styles.featurePill}>Browser-Based IDE</span>
            <span className={styles.featurePill}>Global CDN</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className={styles.formColumn}>
        <motion.div 
          className={`${styles.loginCard} ${localError ? styles.shake : ''}`}
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardBrand}>
              <Zap size={22} className={styles.cardLogoIcon} />
              <span className={styles.cardLogoText}>Web<span className={styles.logoHighlight}>Hoster</span></span>
            </div>
            <h1 className={styles.welcomeTitle}>Welcome Back</h1>
            <p className={styles.welcomeSubtitle}>Sign in to manage your projects</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {localError && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{localError}</span>
              </div>
            )}

            <div className={styles.inputGroup}>
              <div className={styles.inputField}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  id="username"
                  placeholder="Email Address"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputField}>
                <Key size={16} className={styles.inputIcon} />
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              loading={loading}
              className={styles.submitBtn}
            >
              Sign In
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
