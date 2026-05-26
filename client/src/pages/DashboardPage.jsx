import React from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/upload/UploadZone';
import DeploymentList from '../components/dashboard/DeploymentList';
import Header from '../components/common/Header';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();

  const handleUploadSuccess = (deployment) => {
    // Navigate straight to deployment success / details page
    navigate(`/deployment/${deployment.id}`, { state: { justDeployed: true } });
  };

  return (
    <div className="dashboard-container">
      <Header />
      
      <div className="glowing-bg"></div>

      <main className={styles.mainContent}>
        <div className={styles.heroSection}>
          <span className={styles.badge}>Cloud-Native Hosting v1.0</span>
          <h1 className="text-gradient">Instant Static Hosting</h1>
          <p className={styles.leadText}>
            Upload a ZIP archive containing your static HTML, CSS, and JS. 
            Receive a secure, globally accelerated public URL instantly. No config required.
          </p>
        </div>

        <section className={styles.uploadSection}>
          <UploadZone onUploadSuccess={handleUploadSuccess} />
        </section>

        <section className={styles.historySection}>
          <DeploymentList />
        </section>
      </main>
    </div>
  );
}
