import { useState, useEffect } from 'react';
import { classesAPI, subjectsAPI, usersAPI } from '../../services/api';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    class_id: '',
    class_name: '',
  });
  const [subjectFormData, setSubjectFormData] = useState({
    subject: '',
    teacher: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, subjectsRes, usersRes] = await Promise.all([
        classesAPI.getAll(),
        subjectsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setTeachers(usersRes.data.filter((u) => u.role === 'teacher'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'class_id'
        ? Number(e.target.value)
        : e.target.value,
    });
  };

  const handleSubjectInputChange = (e) => {
    setSubjectFormData({
      ...subjectFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await classesAPI.create(formData);
      setShowModal(false);
      setFormData({ class_id: '', class_name: '' });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save class');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await classesAPI.addSubject(selectedClass._id, subjectFormData);
      setShowSubjectModal(false);
      setSubjectFormData({ subject: '', teacher: '' });
      setSelectedClass(null);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    // Note: Delete endpoint not implemented, would need to be added
    setError('Delete functionality not implemented yet');
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Class Management</h2>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + Add Class
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {classes.map((classItem) => (
          <div key={classItem._id} style={styles.classCard}>
            <div style={styles.classHeader}>
              <h3 style={styles.className}>{classItem.class_name}</h3>
              <span style={styles.classId}>ID: {classItem.class_id}</span>
            </div>
            <div style={styles.subjectsList}>
              <h4 style={styles.subjectsTitle}>Subjects:</h4>
              {classItem.subjects && classItem.subjects.length > 0 ? (
                <ul style={styles.subjectsUl}>
                  {classItem.subjects.map((subj, idx) => (
                    <li key={idx} style={styles.subjectItem}>
                      <strong>
                        {subj.subject?.subject_name || 'Unknown Subject'}
                      </strong>
                      {subj.teacher && (
                        <span style={styles.teacherName}>
                          {' '}
                          - Teacher: {subj.teacher?.name || 'Unassigned'}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={styles.noSubjects}>No subjects assigned</p>
              )}
              <button
                onClick={() => {
                  setSelectedClass(classItem);
                  setShowSubjectModal(true);
                }}
                style={styles.addSubjectButton}
              >
                + Add Subject
              </button>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div style={styles.noData}>No classes found</div>
        )}
      </div>

      {showModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Add New Class</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Class ID</label>
                <input
                  type="number"
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Class Name</label>
                <input
                  type="text"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubjectModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => {
            setShowSubjectModal(false);
            setSelectedClass(null);
          }}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              Add Subject to {selectedClass?.class_name}
            </h3>
            <form onSubmit={handleAddSubject}>
              <div style={styles.formGroup}>
                <label>Subject</label>
                <select
                  name="subject"
                  value={subjectFormData.subject}
                  onChange={handleSubjectInputChange}
                  required
                  style={styles.input}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Teacher (Optional)</label>
                <select
                  name="teacher"
                  value={subjectFormData.teacher}
                  onChange={handleSubjectInputChange}
                  style={styles.input}
                >
                  <option value="">No Teacher Assigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  Add Subject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubjectModal(false);
                    setSelectedClass(null);
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
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
    marginBottom: '20px',
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
    fontSize: '16px',
    fontWeight: '500',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  classCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
  },
  className: {
    margin: 0,
    fontSize: '20px',
    color: '#2c3e50',
  },
  classId: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  subjectsList: {
    marginTop: '15px',
  },
  subjectsTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#34495e',
  },
  subjectsUl: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '15px',
  },
  subjectItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    color: '#555',
  },
  teacherName: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  noSubjects: {
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: '15px',
  },
  addSubjectButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '24px',
    color: '#2c3e50',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#333',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default ClassManagement;
