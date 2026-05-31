import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, LogOut, Shield, LayoutGrid, Globe, Sun, Moon, Monitor, ChevronDown, User } from 'lucide-react';
import { useDeployments } from '../../context/DeploymentContext';
import { useTheme } from '../../context/ThemeContext.jsx';
import GlassConfirmModal from '../ui/GlassConfirmModal';
import styles from './Header.module.css';

export default function Header() {
  const { isAuthenticated, adminUser, logoutUser } = useDeployments();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await logoutUser();
    navigate('/login');
  };

  // Determine if on deployment detail page to render dynamic breadcrumbs
  const isDeploymentDetailPage = location.pathname.startsWith('/deployment/');
  const currentProjectId = isDeploymentDetailPage ? location.pathname.split('/').pop() : null;

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
          <div className={styles.navLinksGroup}>
            <NavLink 
              to="/" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              <LayoutGrid size={15} />
              <span>Dashboard</span>
            </NavLink>
            
            {currentProjectId && (
              <>
                <span className={styles.separator}>/</span>
                <div className={styles.breadcrumbItem}>
                  <Globe size={14} className={styles.breadcrumbIcon} />
                  <span className={styles.breadcrumbText}>{currentProjectId}</span>
                </div>
              </>
            )}
          </div>
          
          <div className={styles.navActionsGroup}>
            {isAuthenticated && (
              <div className={styles.authContainer} ref={dropdownRef}>
                <button
                  type="button"
                  className={styles.profileTrigger}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  title="Open user settings and appearance toggle"
                >
                  <div className={styles.avatarCircle}>
                    <User size={12} />
                  </div>
                  <span className={styles.usernameText}>{adminUser}</span>
                  <ChevronDown size={14} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <span className={styles.dropdownLabel}>Session Owner</span>
                      <span className={styles.dropdownUser}>{adminUser}</span>
                    </div>

                    <div className={styles.dropdownDivider} />

                    <div className={styles.dropdownSection}>
                      <span className={styles.sectionTitle}>Theme Appearance</span>
                      <div className={styles.themeToggleGrid}>
                        <button
                          type="button"
                          className={`${styles.themeToggleOption} ${theme === 'dark' ? styles.themeToggleOptionActive : ''}`}
                          onClick={() => setTheme('dark')}
                          title="Switch to dark theme"
                        >
                          <Moon size={14} />
                          <span>Dark</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.themeToggleOption} ${theme === 'light' ? styles.themeToggleOptionActive : ''}`}
                          onClick={() => setTheme('light')}
                          title="Switch to light theme"
                        >
                          <Sun size={14} />
                          <span>Light</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.themeToggleOption} ${theme === 'system' ? styles.themeToggleOptionActive : ''}`}
                          onClick={() => setTheme('system')}
                          title="Follow system theme"
                        >
                          <Monitor size={14} />
                          <span>System</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.dropdownDivider} />

                    <button
                      type="button"
                      className={styles.dropdownLogoutBtn}
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={14} />
                      <span>Logout Session</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className={styles.statusIndicator}>
              <span className={styles.pulseDot}></span>
              <span className={styles.statusText}>Cloud API Live</span>
            </div>
          </div>
        </nav>
      </div>

      <GlassConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Logout Session?"
        message="Are you sure you want to end your WebHoster administration session? Active dev server state will keep serving."
        confirmLabel="Logout Session"
        cancelLabel="Stay Logged In"
        type="warning"
        isDestructive={true}
      />
    </header>
  );
}

