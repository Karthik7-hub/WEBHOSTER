import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, Zap, BarChart2, Settings, Sparkles, Terminal, FileCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeployments } from '../../context/DeploymentContext';
import GlassConfirmModal from './GlassConfirmModal';
import styles from './CommandPalette.module.css';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { deployments } = useDeployments();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [redeployAlertOpen, setRedeployAlertOpen] = useState(false);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle global key binds (e.g. Esc, Arrows, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query, deployments]);

  // Action definitions
  const staticActions = [
    {
      id: 'dash',
      title: 'Go to Dashboard',
      subtitle: 'View your static apps and templates',
      icon: <Zap size={16} />,
      category: 'Navigation',
      action: () => {
        navigate('/');
        onClose();
      }
    },
    {
      id: 'market',
      title: 'Templates Marketplace',
      subtitle: 'Bootstrap projects from professional frameworks',
      icon: <FileCode size={16} />,
      category: 'Workspace',
      action: () => {
        navigate('/?create=template');
        onClose();
      }
    },
    {
      id: 'stats',
      title: 'Analytics Edge Monitor',
      subtitle: 'Explore CPU, Memory, and global edge request counts',
      icon: <BarChart2 size={16} />,
      category: 'Analytics',
      action: () => {
        navigate('/'); // Switch to dashboard, analytics are visual panels there
        onClose();
      }
    },
    {
      id: 'cmd-redeploy',
      title: 'Trigger CDN Redeployment',
      subtitle: 'Repackage the current project directory',
      icon: <Terminal size={16} />,
      category: 'Actions',
      action: () => {
        setRedeployAlertOpen(true);
        onClose();
      }
    }
  ];

  // Dynamic projects actions
  const projectActions = deployments.map((d) => ({
    id: `project-${d.id}`,
    title: `Open project: ${d.name}`,
    subtitle: `IDE workspace: ${d.id}.webhost.io`,
    icon: <Folder size={16} />,
    category: 'Projects',
    action: () => {
      window.open(`/project/${d.id}/edit`, '_blank');
      onClose();
    }
  }));

  const allActions = [...staticActions, ...projectActions];

  const filteredActions = allActions.filter((act) => {
    return (
      act.title.toLowerCase().includes(query.toLowerCase()) ||
      act.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      act.category.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <div className={styles.overlay}>
          {/* Backdrop wrapper */}
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Palette Center Box */}
          <motion.div 
            className={styles.palette}
            initial={{ opacity: 0, scale: 0.97, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -20 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            {/* Command Search Field */}
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Type a command or search active projects..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <span className={styles.escKey}>ESC</span>
            </div>

            {/* List results */}
            <div className={styles.resultsList}>
              {filteredActions.length > 0 ? (
                filteredActions.map((action, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={action.id}
                      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                      onClick={action.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className={styles.itemIcon}>{action.icon}</div>
                      <div className={styles.itemMeta}>
                        <div className={styles.itemTitle}>{action.title}</div>
                        <div className={styles.itemSubtitle}>{action.subtitle}</div>
                      </div>
                      <span className={styles.itemCategory}>{action.category}</span>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noResults}>
                  <Sparkles size={24} className={styles.noResultsIcon} />
                  <h3>No matches found</h3>
                  <p>Try searching for dashboard routes, templates, or active websites.</p>
                </div>
              )}
            </div>

            {/* Bottom Keyboard Guide */}
            <div className={styles.paletteFooter}>
              <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to select</span>
              <span><kbd>Enter</kbd> to execute</span>
              <span><kbd>Esc</kbd> to close</span>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlassConfirmModal
        isOpen={redeployAlertOpen}
        onClose={() => setRedeployAlertOpen(false)}
        title="Redeploy Action"
        message="Redeployment action triggers within active Cloud IDE editor workspaces. Please open a project editor to compile static assets."
        confirmLabel="OK"
        type="info"
      />
    </>
  );
}
