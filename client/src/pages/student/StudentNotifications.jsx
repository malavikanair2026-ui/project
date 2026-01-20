import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, notificationsAPI, resultsAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentNotifications = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchData();
    // Set up polling for new results (check every 30 seconds)
    const interval = setInterval(() => {
      checkNewResults();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchData = async () => {
    try {
      const studentRes = await studentsAPI.getByUserId(user._id);
      setStudent(studentRes.data);

      const [notificationsRes, resultsRes] = await Promise.all([
        notificationsAPI.getByStudent(studentRes.data._id),
        resultsAPI.getByStudent(studentRes.data._id),
      ]);

      setNotifications(notificationsRes.data || []);
      setResults(Array.isArray(resultsRes.data) ? resultsRes.data : resultsRes.data ? [resultsRes.data] : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkNewResults = async () => {
    try {
      const studentRes = await studentsAPI.getByUserId(user._id);
      const resultsRes = await resultsAPI.getByStudent(studentRes.data._id);
      const newResults = Array.isArray(resultsRes.data) ? resultsRes.data : resultsRes.data ? [resultsRes.data] : [];
      
      // Check if there are new results
      const newResultsCount = newResults.filter(
        (r) => !results.some((existing) => existing._id === r._id)
      ).length;

      if (newResultsCount > 0) {
        setResults(newResults);
        showToast(`You have ${newResultsCount} new result(s) available!`, 'success');
      }
    } catch (error) {
      // Silently fail for polling
      console.error('Failed to check new results:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, is_read: true } : n))
      );
      showToast('Notification marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      showToast('Failed to mark notification as read', 'error');
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'result':
        return '#27ae60';
      case 'announcement':
        return '#f39c12';
      case 'feedback':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!student) {
    return (
      <div style={styles.noStudentCard}>
        <p>Student profile not found. Please contact your administrator.</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const newResultsCount = results.filter((r) => r.status === 'approved' && !r.viewed).length;

  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter((n) => n.notification_type === filterType);

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Notifications & Alerts</h2>
        <div style={styles.badges}>
          {unreadCount > 0 && (
            <span style={styles.badge}>
              {unreadCount} Unread Notification{unreadCount !== 1 ? 's' : ''}
            </span>
          )}
          {newResultsCount > 0 && (
            <span style={styles.alertBadge}>
              🎉 {newResultsCount} New Result{newResultsCount !== 1 ? 's' : ''} Available!
            </span>
          )}
        </div>
      </div>

      {/* New Results Alert */}
      {newResultsCount > 0 && (
        <div style={styles.alertCard}>
          <div style={styles.alertIcon}>🎉</div>
          <div style={styles.alertContent}>
            <h3 style={styles.alertTitle}>New Results Available!</h3>
            <p style={styles.alertMessage}>
              You have {newResultsCount} new result{newResultsCount !== 1 ? 's' : ''} that have been approved.
              Check your Results page to view them.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <button
          style={{
            ...styles.filterButton,
            ...(filterType === 'all' ? styles.filterButtonActive : {}),
          }}
          onClick={() => setFilterType('all')}
        >
          All
        </button>
        <button
          style={{
            ...styles.filterButton,
            ...(filterType === 'result' ? styles.filterButtonActive : {}),
          }}
          onClick={() => setFilterType('result')}
        >
          Results
        </button>
        <button
          style={{
            ...styles.filterButton,
            ...(filterType === 'announcement' ? styles.filterButtonActive : {}),
          }}
          onClick={() => setFilterType('announcement')}
        >
          Announcements
        </button>
        <button
          style={{
            ...styles.filterButton,
            ...(filterType === 'general' ? styles.filterButtonActive : {}),
          }}
          onClick={() => setFilterType('general')}
        >
          General
        </button>
      </div>

      {/* Notifications List */}
      <div style={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div style={styles.noDataCard}>
            <p>No notifications available.</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                ...styles.notificationCard,
                ...(!notification.is_read ? styles.unreadCard : {}),
                borderLeft: `4px solid ${getNotificationColor(notification.notification_type)}`,
              }}
            >
              <div style={styles.notificationHeader}>
                <div>
                  <h4 style={styles.notificationTitle}>{notification.title}</h4>
                  <div style={styles.notificationMeta}>
                    <span style={styles.notificationSender}>
                      From: {notification.sender?.name || 'System'}
                    </span>
                    <span style={styles.notificationType}>
                      {notification.notification_type || 'general'}
                    </span>
                  </div>
                </div>
                <div style={styles.notificationActions}>
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      style={styles.markReadBtn}
                    >
                      Mark as Read
                    </button>
                  )}
                  <span style={styles.date}>
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={styles.notificationBody}>
                <p>{notification.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  badges: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
  },
  alertBadge: {
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: '#d4edda',
    border: '2px solid #27ae60',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
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
  alertTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    color: '#155724',
  },
  alertMessage: {
    margin: 0,
    color: '#155724',
    lineHeight: '1.6',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#27ae60',
    color: 'white',
    borderColor: '#27ae60',
  },
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  notificationCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  unreadCard: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: '4px',
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  notificationTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    color: '#2c3e50',
  },
  notificationMeta: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  notificationSender: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  notificationType: {
    padding: '4px 10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#666',
    textTransform: 'capitalize',
  },
  notificationActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  markReadBtn: {
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  date: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  notificationBody: {
    color: '#555',
    lineHeight: '1.6',
  },
  noDataCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
  noStudentCard: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ffc107',
    color: '#856404',
  },
};

export default StudentNotifications;
