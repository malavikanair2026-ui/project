import { useState, useEffect } from 'react';
import { studentsAPI, resultsAPI, subjectsAPI } from '../../services/api';

const PrincipalDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalResults: 0,
    averagePercentage: 0,
    passRate: 0,
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

      const passCount = results.filter((r) => r.grade !== 'F').length;
      const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
      const averagePercentage = results.length > 0 ? totalPercentage / results.length : 0;
      const passRate = results.length > 0 ? (passCount / results.length) * 100 : 0;

      setStats({
        totalStudents: students.length,
        totalResults: results.length,
        averagePercentage,
        passRate,
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
      <h2 style={styles.title}>Principal Dashboard</h2>

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
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.averagePercentage.toFixed(1)}%</div>
            <div style={styles.statLabel}>Average Percentage</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.passRate.toFixed(1)}%</div>
            <div style={styles.statLabel}>Pass Rate</div>
          </div>
        </div>
      </div>

      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <p style={styles.info}>
          Use the navigation menu to view student results and analyze performance across the institution.
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

export default PrincipalDashboard;
