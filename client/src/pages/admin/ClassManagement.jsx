import { useState, useEffect } from 'react';
import { classesAPI, subjectsAPI, usersAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    class_id: '',
    class_name: '',
  });
  const [subjectFormData, setSubjectFormData] = useState({
    subject: '',
    teacher: '',
  });
  const [editSubjectFormData, setEditSubjectFormData] = useState({
    teacher: '',
  });
  const [error, setError] = useState('');
  const { showToast } = useToast();

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
      if (editingClass) {
        await classesAPI.update(editingClass._id, formData);
        showToast('Class updated successfully!', 'success');
      } else {
        await classesAPI.create(formData);
        showToast('Class created successfully!', 'success');
      }
      setShowModal(false);
      setEditingClass(null);
      setFormData({ class_id: '', class_name: '' });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save class';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await classesAPI.addSubject(selectedClass._id, subjectFormData);
      showToast('Subject added successfully!', 'success');
      setShowSubjectModal(false);
      setSubjectFormData({ subject: '', teacher: '' });
      setSelectedClass(null);
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add subject';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      class_id: classItem.class_id,
      class_name: classItem.class_name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) return;
    
    try {
      await classesAPI.delete(id);
      showToast('Class deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to delete class';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleRemoveSubject = async (classId, subjectId) => {
    if (!window.confirm('Are you sure you want to remove this subject from the class?')) return;

    try {
      await classesAPI.removeSubject(classId, subjectId);
      showToast('Subject removed successfully!', 'success');
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to remove subject';
      showToast(errorMsg, 'error');
    }
  };

  const handleEditSubject = (classItem, subjectItem) => {
    setSelectedClass(classItem);
    setEditingSubject(subjectItem);
    setEditSubjectFormData({
      teacher: subjectItem.teacher?._id || subjectItem.teacher || '',
    });
    setShowEditSubjectModal(true);
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await classesAPI.updateSubject(selectedClass._id, editingSubject._id, editSubjectFormData);
      showToast('Subject updated successfully!', 'success');
      setShowEditSubjectModal(false);
      setSelectedClass(null);
      setEditingSubject(null);
      setEditSubjectFormData({ teacher: '' });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update subject';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({ class_id: '', class_name: '' });
    setError('');
  };

  const handleCloseSubjectModal = () => {
    setShowSubjectModal(false);
    setSelectedClass(null);
    setSubjectFormData({ subject: '', teacher: '' });
    setError('');
  };

  const handleCloseEditSubjectModal = () => {
    setShowEditSubjectModal(false);
    setSelectedClass(null);
    setEditingSubject(null);
    setEditSubjectFormData({ teacher: '' });
    setError('');
  };

  if (loading) {
    return <LoadingSpinner message="Loading classes..." />;
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
                      <div style={styles.subjectInfo}>
                        <strong>
                          {subj.subject?.subject_name || 'Unknown Subject'}
                        </strong>
                        {subj.teacher && (
                          <span style={styles.teacherName}>
                            {' '}
                            - Teacher: {subj.teacher?.name || 'Unassigned'}
                          </span>
                        )}
                      </div>
                      <div style={styles.subjectActions}>
                        <button
                          onClick={() => handleEditSubject(classItem, subj)}
                          style={styles.editSubjectButton}
                          title="Edit Subject"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleRemoveSubject(classItem._id, subj._id)}
                          style={styles.removeSubjectButton}
                          title="Remove Subject"
                        >
                          🗑️
                        </button>
                      </div>
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
            <div style={styles.cardActions}>
              <button
                onClick={() => handleEdit(classItem)}
                style={styles.editButton}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(classItem._id)}
                style={styles.deleteButton}
              >
                Delete
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
          onClick={handleCloseModal}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h3>
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
                  {editingClass ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
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
          onClick={handleCloseSubjectModal}
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
                  onClick={handleCloseSubjectModal}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSubjectModal && (
        <div
          style={styles.modalOverlay}
          onClick={handleCloseEditSubjectModal}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              Edit Subject in {selectedClass?.class_name}
            </h3>
            <form onSubmit={handleUpdateSubject}>
              <div style={styles.formGroup}>
                <label>Subject</label>
                <input
                  type="text"
                  value={editingSubject?.subject?.subject_name || 'Unknown Subject'}
                  disabled
                  style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Teacher</label>
                <select
                  name="teacher"
                  value={editSubjectFormData.teacher}
                  onChange={(e) => setEditSubjectFormData({ teacher: e.target.value })}
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
                  Update
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditSubjectModal}
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
    width: '100%',
    marginTop: '10px',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectActions: {
    display: 'flex',
    gap: '5px',
  },
  editSubjectButton: {
    padding: '4px 8px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  removeSubjectButton: {
    padding: '4px 8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  subjectItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    color: '#555',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    paddingTop: '15px',
    marginTop: '15px',
    borderTop: '2px solid #f0f0f0',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    flex: 1,
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    flex: 1,
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
