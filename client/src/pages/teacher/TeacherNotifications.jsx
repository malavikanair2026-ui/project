import { useState, useEffect } from 'react';
import { classesAPI, studentsAPI, notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherNotifications = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({
    student: '',
    title: '',
    message: '',
    type: 'info',
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchNotifications();
    }
  }, [selectedStudent]);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll({ teacher: user?._id }),
        studentsAPI.getAll(),
      ]);

      setClasses(classesRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getByStudent(selectedStudent);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.student || !formData.title.trim() || !formData.message.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      await notificationsAPI.create({
        recipients: [formData.student],
        sender: user?._id,
        title: formData.title,
        message: formData.message,
        notification_type: formData.type,
      });

      showToast('Notification sent successfully', 'success');
      setFormData({
        student: '',
        title: '',
        message: '',
        type: 'info',
      });
      setShowForm(false);
      if (selectedStudent === formData.student) {
        fetchNotifications();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send notification', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const teacherClasses = classes.filter((cls) => {
    return cls.subjects?.some(
      (s) => String(s.teacher?._id || s.teacher) === String(user?._id)
    );
  });

  const classStudents = teacherClasses.length > 0
    ? students.filter((s) => {
        return teacherClasses.some((cls) => s.class === cls.class_name);
      })
    : [];

  const selectedStudentObj = students.find((s) => s._id === selectedStudent);

  const getNotificationColor = (type) => {
    switch (type) {
      case 'result':
        return '#27ae60';
      case 'announcement':
        return '#f39c12';
      case 'feedback':
        return '#e74c3c';
      default:
        return '#3498db';
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Send Notifications</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? 'Cancel' : '+ Send Notification'}
        </button>
      </div>

      {/* Notification Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Send Notification to Student</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Student</label>
              <select
                name="student"
                value={formData.student}
                onChange={handleInputChange}
                style={styles.input}
                required
              >
                <option value="">Select Student</option>
                {classStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} - {student.class} {student.section} (ID: {student.student_id})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notification Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="general">General</option>
                <option value="result">Result</option>
                <option value="announcement">Announcement</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                style={styles.input}
                required
                placeholder="Enter notification title..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                style={styles.textarea}
                rows="4"
                required
                placeholder="Enter notification message..."
              />
            </div>

            <button type="submit" style={styles.submitButton}>
              Send Notification
            </button>
          </form>
        </div>
      )}

      {/* View Notifications */}
      <div style={styles.viewSection}>
        <h3 style={styles.sectionTitle}>View Student Notifications</h3>
        <div style={styles.filters}>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={styles.select}
          >
            <option value="">Select Student to View Notifications</option>
            {classStudents.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} - {student.class} {student.section} (ID: {student.student_id})
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div style={styles.noData}>
                No notifications available for {selectedStudentObj?.name || 'this student'}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    ...styles.notificationCard,
                    borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                  }}
                >
                  <div style={styles.notificationHeader}>
                    <div>
                      <div style={styles.notificationTitle}>{notification.title}</div>
                      <div style={styles.notificationDate}>
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      style={{
                        ...styles.notificationType,
                        backgroundColor: getNotificationColor(notification.notification_type),
                      }}
                    >
                      {notification.notification_type || 'general'}
                    </div>
                  </div>
                  <div style={styles.notificationMessage}>{notification.message}</div>
                  <div style={styles.notificationFooter}>
                    <span style={styles.teacherName}>
                      From: {notification.sender?.name || user?.name || 'Teacher'}
                    </span>
                    {notification.is_read && (
                      <span style={styles.readBadge}>Read</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
    marginBottom: '20px',
  },
  title: {
    fontSize: '26px',
    color: '#1f2a44',
    margin: 0,
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#1f8b4c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  formTitle: {
    fontSize: '18px',
    color: '#1f2a44',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2a44',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#1f2a44',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  viewSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#1f2a44',
    marginBottom: '16px',
  },
  filters: {
    marginBottom: '20px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '300px',
  },
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  notificationCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  notificationTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2a44',
    marginBottom: '4px',
  },
  notificationDate: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  notificationType: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  notificationMessage: {
    fontSize: '14px',
    color: '#2c3e50',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  notificationFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#7f8c8d',
  },
  teacherName: {
    fontWeight: '500',
  },
  readBadge: {
    padding: '2px 8px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '10px',
    fontSize: '11px',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
  },
};

export default TeacherNotifications;
