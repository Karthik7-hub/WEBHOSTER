import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDeployments } from '../context/DeploymentContext';
import UploadZone from '../components/upload/UploadZone';
import DeploymentList from '../components/dashboard/DeploymentList';
import AppShell from '../components/common/AppShell';
import TemplatesPanel from '../components/dashboard/TemplatesPanel';
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { deployments } = useDeployments();

  // Get active tab from URL query search parameters
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'overview'; // overview, projects, templates, analytics, settings

  const [showModal, setShowModal] = useState(false);

  // Check if marketplace launch was requested from other hooks
  const createQuery = queryParams.get('create');
  useEffect(() => {
    if (createQuery === 'template') {
      navigate('/?tab=templates');
    }
  }, [createQuery]);

  const handleUploadSuccess = (deployment) => {
    navigate(`/deployment/${deployment.id}`, { state: { justDeployed: true } });
  };

  // Render correct sub-panels based on path variables
  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplatesPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'projects':
      case 'overview':
      default:
        return (
          <div className={styles.dashboardContainer}>
            <DeploymentList onCreateClick={() => setShowModal(true)} />
          </div>
        );
    }
  };

  return (
    <AppShell>
      <div className={styles.pageWrapper}>
        {renderTabContent()}
      </div>

      {/* Creation Visual Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Project"
        size="medium"
      >
        <div className={styles.modalContentStacked}>
          {/* Main drag-drop area */}
          <UploadZone onUploadSuccess={(deployment) => {
            setShowModal(false);
            handleUploadSuccess(deployment);
          }} />

          {/* Action Row */}
          <div className={styles.modalActions}>
            <Button 
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                navigate('/?tab=templates');
              }}
            >
              Start from Template
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setShowModal(false)}
              type="button"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
