import { useState, useEffect } from 'react';
import { studentsAPI, resultsAPI, marksAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalResults: 0,
    pendingResults: 0,
    approvedResults: 0,
    totalMarksEntries: 0,
    averagePercentage: 0,
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
      const approvedResults = results.filter((r) => r.status === 'approved').length;
      const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
      const averagePercentage = results.length > 0 ? totalPercentage / results.length : 0;

      setStats({
        totalStudents: students.length,
        totalResults: results.length,
        pendingResults,
        approvedResults,
        totalMarksEntries: results.length, // Approximate, could be enhanced
        averagePercentage,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
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
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.approvedResults}</div>
            <div style={styles.statLabel}>Approved Results</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.pendingResults}</div>
            <div style={styles.statLabel}>Pending Results</div>
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
          <div style={styles.statIcon}>📝</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{stats.totalMarksEntries}</div>
            <div style={styles.statLabel}>Marks Entries</div>
          </div>
        </div>
      </div>

      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionGrid}>
          <div style={styles.actionCard}>
            <div style={styles.actionIcon}>👥</div>
            <div style={styles.actionTitle}>View Students</div>
            <div style={styles.actionDesc}>Browse all students to enter marks</div>
          </div>
          <div style={styles.actionCard}>
            <div style={styles.actionIcon}>✏️</div>
            <div style={styles.actionTitle}>Enter Marks</div>
            <div style={styles.actionDesc}>Add marks for students</div>
          </div>
          <div style={styles.actionCard}>
            <div style={styles.actionIcon}>📋</div>
            <div style={styles.actionTitle}>View Results</div>
            <div style={styles.actionDesc}>Check final results of students</div>
          </div>
        </div>
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
    marginBottom: '20px',
    color: '#2c3e50',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  actionCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  },
  actionIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  actionDesc: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default StaffDashboard;
