import { useState, useEffect } from 'react';
import { resultsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ResultsView = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await resultsAPI.getAll();
      setResults(response.data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setError('Failed to load results');
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

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Results Management</h2>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Semester</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>SGPA</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan="8" style={styles.noData}>
                  No results found
                </td>
              </tr>
            ) : (
              results.map((result) => (
                <tr key={result._id}>
                  <td>
                    {result.student?.name || 'Unknown Student'}
                  </td>
                  <td>{result.semester}</td>
                  <td>{result.total_marks}</td>
                  <td>{result.percentage.toFixed(2)}%</td>
                  <td>
                    <span
                      style={{
                        ...styles.gradeBadge,
                        backgroundColor: getGradeColor(result.grade),
                      }}
                    >
                      {result.grade}
                    </span>
                  </td>
                  <td>{result.sgpa.toFixed(2)}</td>
                  <td>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusBadgeColor(result.status),
                      }}
                    >
                      {result.status}
                    </span>
                  </td>
                  <td>
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
