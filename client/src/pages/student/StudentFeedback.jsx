import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, feedbackAPI, notificationsAPI } from '../../services/api';

const StudentFeedback = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feedback');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const studentRes = await studentsAPI.getByUserId(user._id);
      setStudent(studentRes.data);

      if (!studentRes.data?._id) {
        setLoading(false);
        return;
      }

      const studentId = studentRes.data._id;

      // Fetch feedback and notifications in parallel
      const [feedbackRes, notificationsRes] = await Promise.all([
        feedbackAPI.getByStudent(studentId),
        notificationsAPI.getByStudent(studentId),
      ]);

      setFeedbacks(Array.isArray(feedbackRes?.data) ? feedbackRes.data : []);
      setNotifications(Array.isArray(notificationsRes?.data) ? notificationsRes.data : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setFeedbacks([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getFeedbackTypeColor = (type) => {
    const colors = {
      academic: '#3498db',
      behavioral: '#9b59b6',
      general: '#95a5a6',
    };
    return colors[type] || '#95a5a6';
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!student) {
    return (
      <div style={styles.noStudentCard}>
        <p>Student profile not found. Please contact your administrator.</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <h2 style={styles.title}>Feedback & Notifications</h2>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('feedback')}
          style={{
            ...styles.tab,
            ...(activeTab === 'feedback' ? styles.tabActive : {}),
          }}
        >
          Feedback ({feedbacks.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            ...styles.tab,
            ...(activeTab === 'notifications' ? styles.tabActive : {}),
          }}
        >
          Notifications ({notifications.length})
          {unreadCount > 0 && (
            <span style={styles.badge}>{unreadCount}</span>
          )}
        </button>
      </div>

      {activeTab === 'feedback' && (
        <div style={styles.content}>
          {feedbacks.length === 0 ? (
            <div style={styles.noDataCard}>
              <p>No feedback available yet.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {feedbacks.map((feedback) => (
                <div key={feedback._id} style={styles.feedbackCard}>
                  <div style={styles.feedbackHeader}>
                    <div>
                      <strong style={styles.teacherName}>
                        {feedback.teacher?.name || '-'}
                      </strong>
                      <span
                        style={{
                          ...styles.typeBadge,
                          backgroundColor: getFeedbackTypeColor(feedback.feedback_type),
                        }}
                      >
                        {feedback.feedback_type}
                      </span>
                    </div>
                    <span style={styles.date}>
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={styles.feedbackBody}>
                    <p>{feedback.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div style={styles.content}>
          {notifications.length === 0 ? (
            <div style={styles.noDataCard}>
              <p>No notifications available yet.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    ...styles.notificationCard,
                    ...(!notification.is_read ? styles.unreadCard : {}),
                  }}
                >
                  <div style={styles.notificationHeader}>
                    <div>
                      <h4 style={styles.notificationTitle}>{notification.title}</h4>
                      <span style={styles.notificationSender}>
                        From: {notification.sender?.name || 'System'}
                      </span>
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
              ))}
            </div>
          )}
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
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #dee2e6',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#666',
    position: 'relative',
  },
  tabActive: {
    color: '#27ae60',
    borderBottomColor: '#27ae60',
  },
  badge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '12px',
    marginLeft: '8px',
  },
  content: {
    marginTop: '20px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  feedbackCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #f0f0f0',
  },
  teacherName: {
    fontSize: '16px',
    color: '#2c3e50',
    marginRight: '10px',
  },
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  feedbackBody: {
    color: '#555',
    lineHeight: '1.6',
  },
  notificationCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #dee2e6',
  },
  unreadCard: {
    borderLeftColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  notificationTitle: {
    marginTop: 0,
    marginBottom: '5px',
    fontSize: '18px',
    color: '#2c3e50',
  },
  notificationSender: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  notificationActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  markReadBtn: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
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
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default StudentFeedback;
