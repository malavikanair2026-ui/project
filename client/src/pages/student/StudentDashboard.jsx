import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, resultsAPI, marksAPI } from '../../services/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState({
    totalResults: 0,
    averagePercentage: 0,
    latestGrade: 'N/A',
    pendingResults: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Get student record by user ID
      const studentRes = await studentsAPI.getByUserId(user._id);
      setStudent(studentRes.data);

      // Get all results for this student
      const resultsRes = await resultsAPI.getByStudent(studentRes.data._id);
      const results = Array.isArray(resultsRes.data) 
        ? resultsRes.data 
        : resultsRes.data 
        ? [resultsRes.data] 
        : [];

      if (results && results.length > 0) {
        const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
        const averagePercentage = totalPercentage / results.length;
        const latestResult = results[0]; // Assuming sorted by date
        const pendingResults = results.filter((r) => r.status === 'pending').length;

        setStats({
          totalResults: results.length,
          averagePercentage,
          latestGrade: latestResult.grade,
          pendingResults,
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Student might not be created yet, that's okay
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>Welcome, {user?.name}!</h2>

      {student ? (
        <>
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Student Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <strong>Student ID:</strong> {student.student_id}
              </div>
              <div style={styles.infoItem}>
                <strong>Class:</strong> {student.class}
              </div>
              <div style={styles.infoItem}>
                <strong>Section:</strong> {student.section}
              </div>
              <div style={styles.infoItem}>
                <strong>Date of Birth:</strong>{' '}
                {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <div style={styles.statsGrid}>
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
                <div style={styles.statValue}>
                  {stats.averagePercentage.toFixed(1)}%
                </div>
                <div style={styles.statLabel}>Average Percentage</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⭐</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{stats.latestGrade}</div>
                <div style={styles.statLabel}>Latest Grade</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏳</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{stats.pendingResults}</div>
                <div style={styles.statLabel}>Pending Results</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={styles.noStudentCard}>
          <p>Student profile not found. Please contact your administrator to create your student record.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    marginBottom: '30px',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  infoTitle: {
    fontSize: '20px',
    marginTop: 0,
    marginBottom: '20px',
    color: '#2c3e50',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  infoItem: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    color: '#555',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
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
  noStudentCard: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ffc107',
    color: '#856404',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default StudentDashboard;
