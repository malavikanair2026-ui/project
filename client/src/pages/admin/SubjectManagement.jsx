import { useState, useEffect } from 'react';
import { subjectsAPI } from '../../services/api';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    subject_name: '',
    max_marks: 100,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response.data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'subject_id' || e.target.name === 'max_marks'
        ? Number(e.target.value)
        : e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSubject) {
        await subjectsAPI.update(editingSubject._id, formData);
      } else {
        await subjectsAPI.create(formData);
      }
      setShowModal(false);
      setEditingSubject(null);
      setFormData({ subject_id: '', subject_name: '', max_marks: 100 });
      fetchSubjects();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      subject_id: subject.subject_id,
      subject_name: subject.subject_name,
      max_marks: subject.max_marks,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await subjectsAPI.delete(id);
      fetchSubjects();
    } catch (error) {
      setError('Failed to delete subject');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({ subject_id: '', subject_name: '', max_marks: 100 });
    setError('');
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Subject Management</h2>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + Add Subject
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Subject ID</th>
              <th>Subject Name</th>
              <th>Max Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan="4" style={styles.noData}>
                  No subjects found
                </td>
              </tr>
            ) : (
              subjects.map((subject) => (
                <tr key={subject._id}>
                  <td>{subject.subject_id}</td>
                  <td>{subject.subject_name}</td>
                  <td>{subject.max_marks}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(subject)}
                      style={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subject._id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Subject ID</label>
                <input
                  type="number"
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Subject Name</label>
                <input
                  type="text"
                  name="subject_name"
                  value={formData.subject_name}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Max Marks</label>
                <input
                  type="number"
                  name="max_marks"
                  value={formData.max_marks}
                  onChange={handleInputChange}
                  required
                  min="1"
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  {editingSubject ? 'Update' : 'Create'}
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
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#f8f9fa',
  },
  td: {
    padding: '15px',
    borderBottom: '1px solid #dee2e6',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
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

export default SubjectManagement;
