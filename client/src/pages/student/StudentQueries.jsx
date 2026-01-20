import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, feedbackAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentQueries = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    teacher: '',
    query: '',
    subject: '',
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const studentRes = await studentsAPI.getByUserId(user._id);
      setStudent(studentRes.data);

      // Fetch feedbacks sent by this student (if any)
      // Note: This might need a different API endpoint
      // For now, we'll just show the form
      setFeedbacks([]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
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

    if (!formData.teacher || !formData.query.trim()) {
      showToast('Please select a teacher and enter your query', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Since the backend feedback API expects teacher to send feedback to student,
      // we might need a different approach. For now, we'll show a message.
      // This could be implemented as a separate "Query" model or use notifications
      showToast('Query submission feature - backend implementation needed', 'info');
      
      // Alternative: Could use notifications API to send message to teacher
      // await notificationsAPI.create({
      //   recipients: [formData.teacher],
      //   sender: user._id,
      //   title: `Query from ${student?.name || 'Student'}`,
      //   message: formData.query,
      //   notification_type: 'general',
      // });

      setFormData({
        teacher: '',
        query: '',
        subject: '',
      });
      setShowForm(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send query', 'error');
    } finally {
      setSubmitting(false);
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

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Send Query to Teacher</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? 'Cancel' : '+ New Query'}
        </button>
      </div>

      {/* Query Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Send Your Query</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Subject/Topic (Optional)</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="e.g., Mathematics, Assignment Help, etc."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select Teacher (Optional)</label>
              <input
                type="text"
                name="teacher"
                value={formData.teacher}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter teacher name or leave blank for general query"
              />
              <small style={styles.helpText}>
                Note: Teacher selection will be available once backend supports student-to-teacher queries
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Query/Question *</label>
              <textarea
                name="query"
                value={formData.query}
                onChange={handleInputChange}
                style={styles.textarea}
                rows="6"
                required
                placeholder="Enter your question, feedback, or query for your teacher..."
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                disabled={submitting}
                style={styles.submitButton}
              >
                {submitting ? 'Sending...' : 'Send Query'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ teacher: '', query: '', subject: '' });
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Card */}
      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>How to Send Queries</h3>
        <div style={styles.infoList}>
          <div style={styles.infoItem}>
            <span style={styles.infoIcon}>1️⃣</span>
            <div>
              <strong>Click "New Query"</strong> to start a new query
            </div>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoIcon}>2️⃣</span>
            <div>
              <strong>Enter your question</strong> or feedback in the text area
            </div>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoIcon}>3️⃣</span>
            <div>
              <strong>Optionally specify</strong> the subject or teacher
            </div>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoIcon}>4️⃣</span>
            <div>
              <strong>Submit</strong> and your teacher will receive your query
            </div>
          </div>
        </div>
      </div>

      {/* Previous Queries (if any) */}
      {feedbacks.length > 0 && (
        <div style={styles.queriesSection}>
          <h3 style={styles.sectionTitle}>Previous Queries</h3>
          <div style={styles.queriesList}>
            {feedbacks.map((feedback) => (
              <div key={feedback._id} style={styles.queryCard}>
                <div style={styles.queryHeader}>
                  <div>
                    <strong style={styles.querySubject}>
                      {feedback.subject || 'General Query'}
                    </strong>
                    <div style={styles.queryDate}>
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={styles.queryStatus}>
                    {feedback.status || 'Pending'}
                  </div>
                </div>
                <div style={styles.queryBody}>
                  <p>{feedback.query || feedback.feedback}</p>
                </div>
                {feedback.response && (
                  <div style={styles.queryResponse}>
                    <strong>Response:</strong>
                    <p>{feedback.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  formTitle: {
    fontSize: '20px',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2c3e50',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  helpText: {
    display: 'block',
    marginTop: '5px',
    fontSize: '12px',
    color: '#7f8c8d',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
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
    color: '#2c3e50',
    marginBottom: '20px',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  infoIcon: {
    fontSize: '24px',
  },
  queriesSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  queriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  queryCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  },
  queryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #dee2e6',
  },
  querySubject: {
    fontSize: '16px',
    color: '#2c3e50',
    display: 'block',
    marginBottom: '5px',
  },
  queryDate: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  queryStatus: {
    padding: '4px 12px',
    backgroundColor: '#f39c12',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  queryBody: {
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  queryResponse: {
    padding: '15px',
    backgroundColor: '#e7f7ef',
    borderRadius: '6px',
    borderLeft: '4px solid #27ae60',
    marginTop: '15px',
  },
  noStudentCard: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ffc107',
    color: '#856404',
  },
};

export default StudentQueries;
