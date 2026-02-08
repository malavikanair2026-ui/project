import { useState, useEffect } from 'react';
import { resultsAPI, departmentsAPI, classesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ResultsView = () => {
  const [results, setResults] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [deptRes, classRes] = await Promise.all([
          departmentsAPI.getAll(),
          classesAPI.getAll(),
        ]);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [selectedDepartment, selectedClass]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedClass) params.class = selectedClass;
      const response = await resultsAPI.getAll(params);
      const list = Array.isArray(response.data) ? response.data : [];
      setResults(list.filter((r) => r.student?.name));
      setError('');
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setError('Failed to load results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (resultId, newStatus) => {
    try {
      await resultsAPI.updateStatus(resultId, newStatus, user._id);
      fetchResults();
    } catch (error) {
      setError('Failed to update result status');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: '#f39c12',
      approved: '#27ae60',
      frozen: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return '#27ae60';
    if (['B+', 'B'].includes(grade)) return '#3498db';
    if (['C+', 'C'].includes(grade)) return '#f39c12';
    if (grade === 'D') return '#e67e22';
    return '#e74c3c';
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  const departmentName = (d) => d?.department_name ?? d?.name ?? '-';
  const className = (c) => c?.class_name ?? c?.name ?? '-';

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Results Management</h2>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedClass('');
            }}
            style={styles.select}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {departmentName(d)}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={styles.select}
          >
            <option value="">All Classes</option>
            {classes
              .filter((c) => !selectedDepartment || String(c.department?._id ?? c.department) === String(selectedDepartment))
              .map((c) => (
                <option key={c._id} value={c._id}>
                  {className(c)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Total Marks</th>
              <th style={styles.th}>Percentage</th>
              <th style={styles.th}>Grade</th>
              <th style={styles.th}>SGPA</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ ...styles.td, ...styles.noData, textAlign: 'left' }}>
                  No results found
                </td>
              </tr>
            ) : (
              results.map((result) => (
                <tr key={result._id}>
                  <td style={styles.td}>
                    {result.student?.name || '-'}
                  </td>
                  <td style={styles.td}>{departmentName(result.student?.department)}</td>
                  <td style={styles.td}>{className(result.student?.class)}</td>
                  <td style={styles.td}>{result.semester}</td>
                  <td style={styles.td}>{result.total_marks}</td>
                  <td style={styles.td}>{result.percentage.toFixed(2)}%</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.gradeBadge,
                        backgroundColor: getGradeColor(result.grade),
                      }}
                    >
                      {result.grade}
                    </span>
                  </td>
                  <td style={styles.td}>{result.sgpa.toFixed(2)}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusBadgeColor(result.status),
                      }}
                    >
                      {result.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      {result.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusChange(result._id, 'approved')}
                          style={styles.approveButton}
                        >
                          Approve
                        </button>
                      )}
                      {result.status !== 'frozen' && (
                        <button
                          onClick={() => handleStatusChange(result._id, 'frozen')}
                          style={styles.freezeButton}
                        >
                          Freeze
                        </button>
                      )}
                      {result.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusChange(result._id, 'pending')}
                          style={styles.pendingButton}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#2c3e50',
  },
  select: {
    padding: '10px 14px',
    minWidth: '200px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
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
    textAlign: 'left',
    borderBottom: '1px solid #dee2e6',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionButtons: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap',
  },
  approveButton: {
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  freezeButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  pendingButton: {
    padding: '6px 12px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default ResultsView;
