import { useState, useEffect } from 'react';
import { gradingSchemaAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const GradingSchema = () => {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    pass_percentage: 33,
    is_active: false,
    grade_ranges: [
      { grade: 'A+', min_percentage: 90, max_percentage: 100, grade_point: 10 },
      { grade: 'A', min_percentage: 80, max_percentage: 89, grade_point: 9 },
      { grade: 'B+', min_percentage: 70, max_percentage: 79, grade_point: 8 },
      { grade: 'B', min_percentage: 60, max_percentage: 69, grade_point: 7 },
      { grade: 'C+', min_percentage: 50, max_percentage: 59, grade_point: 6 },
      { grade: 'C', min_percentage: 40, max_percentage: 49, grade_point: 5 },
      { grade: 'D', min_percentage: 33, max_percentage: 39, grade_point: 4 },
      { grade: 'F', min_percentage: 0, max_percentage: 32, grade_point: 0 },
    ],
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    try {
      const response = await gradingSchemaAPI.getAll();
      setSchemas(response.data);
    } catch (error) {
      console.error('Failed to fetch schemas:', error);
      showToast('Failed to load grading schemas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : name === 'pass_percentage' ? Number(value) : value,
    });
  };

  const handleGradeRangeChange = (index, field, value) => {
    const updatedRanges = [...formData.grade_ranges];
    updatedRanges[index] = {
      ...updatedRanges[index],
      [field]: field === 'min_percentage' || field === 'max_percentage' || field === 'grade_point'
        ? Number(value)
        : value,
    };
    setFormData({ ...formData, grade_ranges: updatedRanges });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchema) {
        await gradingSchemaAPI.update(editingSchema._id, formData);
        showToast('Grading schema updated successfully!', 'success');
      } else {
        await gradingSchemaAPI.create(formData);
        showToast('Grading schema created successfully!', 'success');
      }
      setShowModal(false);
      setEditingSchema(null);
      resetForm();
      fetchSchemas();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save grading schema', 'error');
    }
  };

  const handleEdit = (schema) => {
    setEditingSchema(schema);
    setFormData({
      name: schema.name,
      pass_percentage: schema.pass_percentage,
      is_active: schema.is_active,
      grade_ranges: [...schema.grade_ranges],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grading schema?')) return;

    try {
      await gradingSchemaAPI.delete(id);
      showToast('Grading schema deleted successfully!', 'success');
      fetchSchemas();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete grading schema', 'error');
    }
  };

  const handleSetActive = async (id) => {
    try {
      await gradingSchemaAPI.update(id, { is_active: true });
      showToast('Grading schema activated successfully!', 'success');
      fetchSchemas();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to activate grading schema', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      pass_percentage: 33,
      is_active: false,
      grade_ranges: [
        { grade: 'A+', min_percentage: 90, max_percentage: 100, grade_point: 10 },
        { grade: 'A', min_percentage: 80, max_percentage: 89, grade_point: 9 },
        { grade: 'B+', min_percentage: 70, max_percentage: 79, grade_point: 8 },
        { grade: 'B', min_percentage: 60, max_percentage: 69, grade_point: 7 },
        { grade: 'C+', min_percentage: 50, max_percentage: 59, grade_point: 6 },
        { grade: 'C', min_percentage: 40, max_percentage: 49, grade_point: 5 },
        { grade: 'D', min_percentage: 33, max_percentage: 39, grade_point: 4 },
        { grade: 'F', min_percentage: 0, max_percentage: 32, grade_point: 0 },
      ],
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchema(null);
    resetForm();
  };

  if (loading) {
    return <LoadingSpinner message="Loading grading schemas..." />;
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Grading Schema Management</h2>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + Create Schema
        </button>
      </div>

      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          <strong>Note:</strong> Only one grading schema can be active at a time. The active schema
          will be used for calculating grades and determining pass/fail status.
        </p>
      </div>

      <div style={styles.grid}>
        {schemas.map((schema) => (
          <div key={schema._id} style={styles.schemaCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.schemaName}>{schema.name}</h3>
              {schema.is_active && (
                <span style={styles.activeBadge}>Active</span>
              )}
            </div>
            <div style={styles.cardBody}>
              <p style={styles.passCriteria}>
                Pass Criteria: {schema.pass_percentage}%
              </p>
              <div style={styles.gradeRanges}>
                <strong>Grade Ranges:</strong>
                <div style={styles.gradeList}>
                  {schema.grade_ranges.map((range, idx) => (
                    <div key={idx} style={styles.gradeItem}>
                      <span style={styles.gradeLabel}>{range.grade}:</span>
                      <span style={styles.gradeRange}>
                        {range.min_percentage}% - {range.max_percentage}% (GP: {range.grade_point})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={styles.cardActions}>
              {!schema.is_active && (
                <button
                  onClick={() => handleSetActive(schema._id)}
                  style={styles.activateButton}
                >
                  Set Active
                </button>
              )}
              <button
                onClick={() => handleEdit(schema)}
                style={styles.editButton}
              >
                Edit
              </button>
              {!schema.is_active && (
                <button
                  onClick={() => handleDelete(schema._id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {schemas.length === 0 && (
          <div style={styles.noData}>No grading schemas found. Create one to get started.</div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingSchema ? 'Edit Grading Schema' : 'Create New Grading Schema'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Schema Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="e.g., Standard Grading System"
                />
              </div>

              <div style={styles.formGroup}>
                <label>Pass Percentage</label>
                <input
                  type="number"
                  name="pass_percentage"
                  value={formData.pass_percentage}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="100"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  Set as Active Schema
                </label>
              </div>

              <div style={styles.formGroup}>
                <label>Grade Ranges</label>
                <div style={styles.gradeRangesTable}>
                  <div style={styles.tableHeader}>
                    <div style={styles.tableCell}>Grade</div>
                    <div style={styles.tableCell}>Min %</div>
                    <div style={styles.tableCell}>Max %</div>
                    <div style={styles.tableCell}>Grade Point</div>
                  </div>
                  {formData.grade_ranges.map((range, index) => (
                    <div key={index} style={styles.tableRow}>
                      <div style={styles.tableCell}>
                        <select
                          value={range.grade}
                          onChange={(e) => handleGradeRangeChange(index, 'grade', e.target.value)}
                          style={styles.select}
                        >
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="B+">B+</option>
                          <option value="B">B</option>
                          <option value="C+">C+</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="F">F</option>
                        </select>
                      </div>
                      <div style={styles.tableCell}>
                        <input
                          type="number"
                          value={range.min_percentage}
                          onChange={(e) =>
                            handleGradeRangeChange(index, 'min_percentage', e.target.value)
                          }
                          min="0"
                          max="100"
                          required
                          style={styles.numberInput}
                        />
                      </div>
                      <div style={styles.tableCell}>
                        <input
                          type="number"
                          value={range.max_percentage}
                          onChange={(e) =>
                            handleGradeRangeChange(index, 'max_percentage', e.target.value)
                          }
                          min="0"
                          max="100"
                          required
                          style={styles.numberInput}
                        />
                      </div>
                      <div style={styles.tableCell}>
                        <input
                          type="number"
                          value={range.grade_point}
                          onChange={(e) =>
                            handleGradeRangeChange(index, 'grade_point', e.target.value)
                          }
                          min="0"
                          max="10"
                          step="0.5"
                          required
                          style={styles.numberInput}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveButton}>
                  {editingSchema ? 'Update' : 'Create'}
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
  infoBox: {
    backgroundColor: '#e8f4f8',
    border: '1px solid #bee5eb',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '20px',
  },
  infoText: {
    margin: 0,
    color: '#0c5460',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
  },
  schemaCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
  },
  schemaName: {
    margin: 0,
    fontSize: '20px',
    color: '#2c3e50',
  },
  activeBadge: {
    padding: '4px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: '15px',
  },
  passCriteria: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#34495e',
    fontWeight: '500',
  },
  gradeRanges: {
    marginTop: '10px',
  },
  gradeList: {
    marginTop: '10px',
  },
  gradeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  gradeLabel: {
    fontWeight: '600',
    color: '#2c3e50',
    minWidth: '40px',
  },
  gradeRange: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    paddingTop: '15px',
    borderTop: '1px solid #f0f0f0',
  },
  activateButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
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
    gridColumn: '1 / -1',
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
    overflowY: 'auto',
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  gradeRangesTable: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    fontWeight: '600',
    borderBottom: '2px solid #dee2e6',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: '10px',
    borderBottom: '1px solid #f0f0f0',
  },
  tableCell: {
    padding: '0 5px',
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  numberInput: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
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
};

export default GradingSchema;
