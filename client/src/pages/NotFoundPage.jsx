import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import Header from '../components/common/Header';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.pageWrapper}>
      <Header />
      <div className="glowing-bg"></div>

      <main className={styles.container}>
        <div className={styles.card}>
          <Zap size={44} className={styles.icon} />
          <h1 className={styles.title}>404</h1>
          <h2 className={styles.subtitle}>Lost in space?</h2>
          <p className={styles.desc}>
            The panel route or site deployment path you are trying to visit does not exist.
          </p>
          <Link to="/" className={styles.btn}>
            Return to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
