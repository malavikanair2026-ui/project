import { useState, useEffect } from 'react';
import { studentsAPI, resultsAPI } from '../../services/api';

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalResults: 0,
    pendingMarks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentsRes, resultsRes] = await Promise.all([
        studentsAPI.getAll(),
        resultsAPI.getAll(),
      ]);

      const students = studentsRes.data;
      const results = resultsRes.data;
      const pendingResults = results.filter((r) => r.status === 'pending').length;

      setStats({
        totalStudents: students.length,
        totalResults: results.length,
        pendingMarks: pendingResults,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>Staff Dashboard</h2>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎓</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.totalStudents}</div>
            <div style={styles.statLabel}>Total Students</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📋</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.totalResults}</div>
            <div style={styles.statLabel}>Total Results</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.pendingMarks}</div>
            <div style={styles.statLabel}>Pending Results</div>
          </div>
        </div>
      </div>

      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <p style={styles.info}>
          Use the navigation menu to enter marks for students and view final results.
        </p>
      </div>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    marginBottom: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  statIcon: {
    fontSize: '40px',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginTop: '5px',
  },
  quickActions: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#2c3e50',
  },
  info: {
    color: '#666',
    lineHeight: '1.6',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default StaffDashboard;
