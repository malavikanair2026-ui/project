import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, queriesAPI, classesAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentQueries = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [queries, setQueries] = useState([]);
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
      const studentData = studentRes.data;
      setStudent(studentData);

      // Fetch queries submitted by this student
      const queriesRes = await queriesAPI.getByStudent(studentData._id);
      setQueries(Array.isArray(queriesRes.data) ? queriesRes.data : []);

      // Fetch teachers from student's class for dropdown
      if (studentData.class?._id || studentData.class) {
        const classId = studentData.class?._id || studentData.class;
        const classRes = await classesAPI.getById(classId);
        const classData = classRes.data;
        const teacherSet = new Map();
        // Add class teacher
        if (classData.class_teacher) {
          const t = classData.class_teacher;
          teacherSet.set(t._id, { _id: t._id, name: t.name });
        }
        // Add assigned teachers
        (classData.assigned_teachers || []).forEach((t) => {
          teacherSet.set(t._id, { _id: t._id, name: t.name });
        });
        // Add subject teachers
        (classData.subjects || []).forEach((s) => {
          if (s.teacher) teacherSet.set(s.teacher._id, { _id: s.teacher._id, name: s.teacher.name });
        });
        setTeachers(Array.from(teacherSet.values()));
      } else {
        setTeachers([]);
      }
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

    if (!formData.query.trim()) {
      showToast('Please enter your query', 'error');
      return;
    }

    setSubmitting(true);

    try {
      await queriesAPI.create({
        teacher: formData.teacher || undefined,
        subject: formData.subject?.trim() || undefined,
        query: formData.query.trim(),
      });

      showToast('Query submitted successfully! Your teacher will respond soon.', 'success');
      setFormData({ teacher: '', query: '', subject: '' });
      setShowForm(false);
      fetchData(); // Refresh queries list
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
              <select
                name="teacher"
                value={formData.teacher}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="">General Query (any teacher)</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {teachers.length === 0 && (
                <small style={styles.helpText}>
                  No teachers assigned to your class yet. Your query will be sent as a general query.
                </small>
              )}
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

      {/* Previous Queries */}
      <div style={styles.queriesSection}>
        <h3 style={styles.sectionTitle}>Previous Queries</h3>
        {queries.length === 0 ? (
          <p style={styles.emptyText}>No queries yet. Submit your first query using the form above.</p>
        ) : (
          <div style={styles.queriesList}>
            {queries.map((q) => (
              <div key={q._id} style={styles.queryCard}>
                <div style={styles.queryHeader}>
                  <div>
                    <strong style={styles.querySubject}>
                      {q.subject || 'General Query'}
                    </strong>
                    <div style={styles.queryDate}>
                      {new Date(q.createdAt).toLocaleDateString()}
                      {q.teacher?.name && (
                        <span> • To: {q.teacher.name}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ ...styles.queryStatus, backgroundColor: q.status === 'answered' ? '#27ae60' : '#f39c12' }}>
                    {q.status === 'answered' ? 'Answered' : 'Pending'}
                  </div>
                </div>
                <div style={styles.queryBody}>
                  <p>{q.query}</p>
                </div>
                {q.response && (
                  <div style={styles.queryResponse}>
                    <strong>Response:</strong>
                    <p>{q.response}</p>
                  </div>
                )}
              </div>
            ))}
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
  emptyText: {
    color: '#7f8c8d',
    fontSize: '14px',
    margin: 0,
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
