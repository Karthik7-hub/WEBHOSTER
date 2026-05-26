import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, LogOut, User } from 'lucide-react';
import { useDeployments } from '../../context/DeploymentContext';
import styles from './Header.module.css';

export default function Header() {
  const { isAuthenticated, adminUser, logoutUser } = useDeployments();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <div className={styles.logo}>
            <Zap size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>Web<span className={styles.logoHighlight}>Hoster</span></span>
          </div>
        </Link>
        
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Dashboard</Link>
          
          {isAuthenticated && (
            <div className={styles.authActions}>
              <div className={styles.profileBadge}>
                <User size={14} />
                <span>{adminUser}</span>
              </div>
              <button 
                type="button" 
                className={styles.logoutBtn} 
                onClick={handleLogout}
                title="Logout admin session"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}

          <div className={styles.statusIndicator}>
            <span className={styles.pulseDot}></span>
            <span className={styles.statusText}>Cloud API Live</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
