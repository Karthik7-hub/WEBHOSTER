import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, FileCode, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import GlassConfirmModal from '../ui/GlassConfirmModal';
import styles from './TemplatesPanel.module.css';

export default function TemplatesPanel() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorAlertOpen, setErrorAlertOpen] = useState(false);
  const [errorAlertMsg, setErrorAlertMsg] = useState('');
  const navigate = useNavigate();

  const templatesList = [
    {
      id: 'vanilla',
      title: 'Vanilla Workspace',
      subtitle: 'Pure HTML, CSS, and JS',
      desc: 'Supercharged click micro-animations and Google Outfit font imports. Debounced auto-save active.',
      glow: 'var(--accent-primary)',
      badge: 'Sleek Starter'
    },
    {
      id: 'react',
      title: 'React 18 CDN App',
      subtitle: 'In-browser JSX compilation',
      desc: 'UMD scripts with Babel Standalone. Allows writing full React JSX code live in the editor preview.',
      glow: 'var(--accent-primary)',
      badge: 'Reactive Framework'
    },
    {
      id: 'landing',
      title: 'Apex SaaS Landing',
      subtitle: 'Modern dark marketing page',
      desc: 'Includes glowing headers, responsive grids, call-to-actions, and smooth scroll anchors.',
      glow: 'var(--accent-secondary)',
      badge: 'Conversion Booster'
    },
    {
      id: 'portfolio',
      title: 'Alex Rivera Portfolio',
      subtitle: 'Premium developer grid canvas',
      desc: 'Space-themed design featuring dynamic mesh, tag grids, timelines, and email templates.',
      glow: 'var(--accent-secondary)',
      badge: 'Personal Resume'
    }
  ];

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setProjectName(`${tpl.title.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 1000)}`);
    setSuccessData(null);
    setModalOpen(true);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !selectedTemplate) return;

    setLoading(true);
    try {
      const res = await api.createProject(projectName, selectedTemplate.id);
      if (res.success) {
        setSuccessData(res.data);
      } else {
        setErrorAlertMsg(res.error || 'Failed to generate project workspace.');
        setErrorAlertOpen(true);
      }
    } catch (err) {
      console.error(err);
      setErrorAlertMsg(err.response?.data?.error || 'Failed to connect to the compilation service.');
      setErrorAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Templates Marketplace</h2>
          <p className={styles.panelDesc}>Select a framework or boilerplate directory to bootstrap your live developer workspace instantly.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {templatesList.map((tpl) => (
          <div 
            key={tpl.id} 
            className={styles.card}
            style={{ '--tpl-glow': tpl.glow }}
            onClick={() => handleSelectTemplate(tpl)}
          >
            <div className={styles.cardGlow} />
            <div className={styles.cardHeader}>
              <span className={styles.badge}>{tpl.badge}</span>
              <FileCode className={styles.cardIcon} size={22} />
            </div>
            
            <h3 className={styles.cardTitle}>{tpl.title}</h3>
            <span className={styles.cardSubtitle}>{tpl.subtitle}</span>
            <p className={styles.cardDesc}>{tpl.desc}</p>
            
            <div className={styles.cardFooter}>
              <span className={styles.actionLink}>
                Use Template <Play size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Dialog Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !loading && setModalOpen(false)}
        title={successData ? "Project Generated successfully!" : `Create ${selectedTemplate?.title}`}
        size="small"
      >
        {successData ? (
          <div className={styles.successWrapper}>
            <div className={styles.successIconBox}>
              <Check size={28} />
            </div>
            <h4>Workspace Compiled!</h4>
            <p>Your beautiful project files have been populated successfully. Open the workspace to compile live code edits.</p>
            
            <div className={styles.successActions}>
              <Button 
                variant="primary" 
                onClick={() => {
                  setModalOpen(false);
                  window.open(`/project/${successData.id}/edit`, '_blank');
                }}
              >
                Open Cloud IDE
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setModalOpen(false)}
              >
                Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateProject} className={styles.form}>
            <p className={styles.formHint}>Provide a unique domain name to claim your static serving endpoint.</p>
            
            <div className={styles.inputGroup}>
              <label htmlFor="projectName">Project Name / Subdomain</label>
              <div className={styles.inputWrapper}>
                <input
                  id="projectName"
                  type="text"
                  required
                  placeholder="my-awesome-react-app"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={loading}
                />
                <span className={styles.domainAppend}>.webhost.io</span>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button 
                variant="secondary" 
                onClick={() => setModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                loading={loading}
              >
                Bootstrap Now
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <GlassConfirmModal
        isOpen={errorAlertOpen}
        onClose={() => {
          setErrorAlertOpen(false);
          setErrorAlertMsg('');
        }}
        title="Template Creation Failure"
        message={errorAlertMsg}
        confirmLabel="OK"
        type="warning"
      />
    </div>
  );
}
