import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, LayoutGrid, BarChart3, Settings,
  Search, ChevronLeft, ChevronRight, LogOut,
  Sun, Moon, Monitor, ChevronDown, User
} from 'lucide-react';
import { useDeployments } from '../../context/DeploymentContext';
import { useTheme } from '../../context/ThemeContext.jsx';
import CommandPalette from '../ui/CommandPalette';
import GlassConfirmModal from '../ui/GlassConfirmModal';
import styles from './AppShell.module.css';

export default function AppShell({ children }) {
  const { isAuthenticated, adminUser, logoutUser, deployments } = useDeployments();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // States for Sidebars and Modals
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const headerDropdownRef = useRef(null);

  // Bind Command Palette to Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target)) {
        setHeaderDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setUserDropdownOpen(false);
    setHeaderDropdownOpen(false);
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await logoutUser();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutGrid size={21} /> },
    { to: '/?tab=templates', label: 'Templates', icon: <Zap size={21} /> },
    { to: '/?tab=analytics', label: 'Storage', icon: <BarChart3 size={21} /> },
    { to: '/?tab=settings', label: 'Settings', icon: <Settings size={21} /> }
  ];

  return (
    <div className={styles.appLayout}>
      {/* 1. Desktop Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.brand}>
            <Zap size={22} className={styles.logoIcon} />
            {!isCollapsed && (
              <span className={styles.logoText}>
                Web<span className={styles.logoHighlight}>Hoster</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            if (item.onClick) {
              return (
                <a
                  key={item.label}
                  href="#"
                  onClick={item.onClick}
                  className={styles.navLink}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                </a>
              );
            }
            const isTabActive = item.to.includes('?')
              ? location.search.includes(item.to.split('?')[1])
              : (location.pathname === '/' && !location.search);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${styles.navLink} ${isTabActive ? styles.navLinkActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Admin Footer area */}
        {isAuthenticated && (
          <div className={styles.sidebarFooter}>
            <div
              className={styles.userProfile}
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              <div className={styles.avatar}>
                {adminUser ? adminUser.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              {!isCollapsed && (
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{adminUser}</span>
                  <span className={styles.userRole}>Platform Owner</span>
                </div>
              )}
            </div>

            {userDropdownOpen && !isCollapsed && (
              <div className={styles.userDropdown}>
                <button type="button" onClick={handleLogoutClick} className={styles.dropdownBtn}>
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* 2. Main content area containing Header Console & Body View */}
      <div className={styles.mainWrapper}>
        <header className={styles.headerConsole}>
          {/* Mobile top header search button */}
          <button
            type="button"
            className={styles.mobileSearchBtn}
            onClick={() => setCommandPaletteOpen(true)}
            title="Search commands"
          >
            <Search size={18} />
          </button>
          {/* Desktop search console */}
          <div
            className={styles.searchConsole}
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search size={15} />
            <span className={styles.searchText}>Quick search commands...</span>
            <span className={styles.searchKeyBinds}>⌘K</span>
          </div>

          {/* Center Title for Mobile top header */}
          <div className={styles.mobileBrandTitle}>
            <Zap size={16} className={styles.mobileBrandIcon} />
            <span>WebHoster</span>
          </div>

          <div className={styles.consoleActions}>
            <div className={styles.statusIndicator}>
              <span className={styles.pulseDot}></span>
              <span className={styles.statusText}>Cloud API Online</span>
            </div>

            {isAuthenticated && (
              <div className={styles.authContainer} ref={headerDropdownRef}>
                <button
                  type="button"
                  className={styles.profileTrigger}
                  onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                  aria-expanded={headerDropdownOpen}
                  title="Open user settings and appearance toggle"
                >
                  <div className={styles.avatarCircle}>
                    <User size={12} />
                  </div>
                  <span className={styles.usernameText}>{adminUser}</span>
                  <ChevronDown size={14} className={`${styles.chevron} ${headerDropdownOpen ? styles.chevronOpen : ''}`} />
                </button>

                {headerDropdownOpen && (
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
          </div>
        </header>

        {/* Workspace views content slot */}
        <main className={styles.workspaceArea}>
          {children}
        </main>
      </div>

      {/* 3. Mobile Fixed Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => {
          const isTabActive = item.to.includes('?')
            ? location.search.includes(item.to.split('?')[1])
            : (location.pathname === '/' && !location.search);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.bottomNavItem} ${isTabActive ? styles.bottomNavItemActive : ''}`}
            >
              <span className={styles.bottomNavIcon}>{item.icon}</span>
              <span className={styles.bottomNavLabel}>{item.label}</span>
              <span className={`${styles.bottomNavIndicator} ${isTabActive ? styles.bottomNavIndicatorActive : ''}`} />
            </Link>
          );
        })}
      </nav>

      {/* 4. Global Command Palette overlay */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

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
    </div>
  );
}
