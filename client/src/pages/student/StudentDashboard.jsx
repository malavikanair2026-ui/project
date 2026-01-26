import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, resultsAPI, marksAPI, notificationsAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState({
    totalResults: 0,
    averagePercentage: 0,
    latestGrade: 'N/A',
    pendingResults: 0,
    unreadNotifications: 0,
    newResults: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // Check for new results periodically
    const interval = setInterval(() => {
      checkNewResults();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
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

      // Get notifications
      try {
        const notificationsRes = await notificationsAPI.getByStudent(studentRes.data._id);
        const notificationsData = notificationsRes.data || [];
        setNotifications(notificationsData);
        const unreadCount = notificationsData.filter((n) => !n.is_read).length;
        
        // Check for new approved results
        const newResults = results.filter((r) => r.status === 'approved').length;

        setStats((prev) => ({
          ...prev,
          unreadNotifications: unreadCount,
          newResults,
        }));
      } catch (notifError) {
        console.error('Failed to fetch notifications:', notifError);
      }

      if (results && results.length > 0) {
        const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
        const averagePercentage = totalPercentage / results.length;
        const latestResult = results[0]; // Assuming sorted by date
        const pendingResults = results.filter((r) => r.status === 'pending').length;

        setStats((prev) => ({
          ...prev,
          totalResults: results.length,
          averagePercentage,
          latestGrade: latestResult.grade,
          pendingResults,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Student might not be created yet, that's okay
    } finally {
      setLoading(false);
    }
  };

  const checkNewResults = async () => {
    try {
      const studentRes = await studentsAPI.getByUserId(user._id);
      const resultsRes = await resultsAPI.getByStudent(studentRes.data._id);
      const results = Array.isArray(resultsRes.data) 
        ? resultsRes.data 
        : resultsRes.data 
        ? [resultsRes.data] 
        : [];
      
      const newApprovedResults = results.filter((r) => r.status === 'approved').length;
      
      if (newApprovedResults > stats.newResults) {
        showToast(`You have ${newApprovedResults - stats.newResults} new result(s) available!`, 'success');
        setStats((prev) => ({ ...prev, newResults: newApprovedResults }));
      }
    } catch (error) {
      // Silently fail for polling
      console.error('Failed to check new results:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2 style={styles.title}>Welcome, {user?.name}!</h2>

      {student ? (
        <>
          {/* Alerts */}
          {(stats.newResults > 0 || stats.unreadNotifications > 0) && (
            <div style={styles.alertsSection}>
              {stats.newResults > 0 && (
                <div style={styles.alertCard}>
                  <div style={styles.alertIcon}>🎉</div>
                  <div style={styles.alertContent}>
                    <strong>New Results Available!</strong>
                    <p>You have {stats.newResults} new result(s). Check your Results page.</p>
                    <button
                      onClick={() => navigate('/student/results')}
                      style={styles.alertButton}
                    >
                      View Results
                    </button>
                  </div>
                </div>
              )}
              {stats.unreadNotifications > 0 && (
                <div style={styles.alertCard}>
                  <div style={styles.alertIcon}>🔔</div>
                  <div style={styles.alertContent}>
                    <strong>New Notifications!</strong>
                    <p>You have {stats.unreadNotifications} unread notification(s).</p>
                    <button
                      onClick={() => navigate('/student/notifications')}
                      style={styles.alertButton}
                    >
                      View Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Student Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <strong>Student ID:</strong> {student.student_id}
              </div>
              <div style={styles.infoItem}>
                <strong>Class:</strong> {student.class?.class_name || student.class || 'N/A'}
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

            {stats.unreadNotifications > 0 && (
              <div style={styles.statCard}>
                <div style={styles.statIcon}>🔔</div>
                <div style={styles.statInfo}>
                  <div style={styles.statValue}>{stats.unreadNotifications}</div>
                  <div style={styles.statLabel}>Unread Notifications</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={styles.quickActions}>
            <h3 style={styles.sectionTitle}>Quick Actions</h3>
            <div style={styles.actionGrid}>
              <div
                style={styles.actionCard}
                onClick={() => navigate('/student/results')}
              >
                <div style={styles.actionIcon}>📋</div>
                <div style={styles.actionTitle}>View Results</div>
              </div>
              <div
                style={styles.actionCard}
                onClick={() => navigate('/student/performance')}
              >
                <div style={styles.actionIcon}>📈</div>
                <div style={styles.actionTitle}>Performance Analysis</div>
              </div>
              <div
                style={styles.actionCard}
                onClick={() => navigate('/student/notifications')}
              >
                <div style={styles.actionIcon}>🔔</div>
                <div style={styles.actionTitle}>Notifications</div>
                {stats.unreadNotifications > 0 && (
                  <span style={styles.actionBadge}>{stats.unreadNotifications}</span>
                )}
              </div>
              <div
                style={styles.actionCard}
                onClick={() => navigate('/student/queries')}
              >
                <div style={styles.actionIcon}>💬</div>
                <div style={styles.actionTitle}>Send Query</div>
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
  alertsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
  },
  alertCard: {
    backgroundColor: '#d4edda',
    border: '2px solid #27ae60',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: '40px',
  },
  alertContent: {
    flex: 1,
  },
  alertButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  quickActions: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '30px',
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
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
  },
  actionIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#2c3e50',
  },
  actionBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
};

export default StudentDashboard;
