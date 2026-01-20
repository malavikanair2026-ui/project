import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultsAPI, studentsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const PrincipalResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resultsRes, studentsRes] = await Promise.all([
        resultsAPI.getAll(),
        studentsAPI.getAll(),
      ]);

      setResults(resultsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResults = () => {
    let filtered = results;

    if (filterClass) {
      filtered = filtered.filter((r) => {
        const student = students.find((s) => s._id === r.student?._id || s._id === r.student);
        return student?.class === filterClass;
      });
    }

    if (filterSemester) {
      filtered = filtered.filter((r) => r.semester === filterSemester);
    }

    return filtered;
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return '#27ae60';
    if (['B+', 'B'].includes(grade)) return '#3498db';
    if (['C+', 'C'].includes(grade)) return '#f39c12';
    if (grade === 'D') return '#e67e22';
    return '#e74c3c';
  };

  const handleViewDetails = (studentId) => {
    navigate(`/principal/student/${studentId}`);
  };

  const uniqueClasses = [...new Set(students.map((s) => s.class))].filter(Boolean);
  const uniqueSemesters = [...new Set(results.map((r) => r.semester))].filter(Boolean);

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredResults = getFilteredResults();

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Student Results</h2>
        <div style={styles.filters}>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={styles.select}
          >
            <option value="">All Classes</option>
            {uniqueClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            style={styles.select}
          >
            <option value="">All Semesters</option>
            {uniqueSemesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Semester</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="9" style={styles.noData}>
                  No results found
                </td>
              </tr>
            ) : (
              filteredResults.map((result) => {
                const student = students.find(
                  (s) => s._id === result.student?._id || s._id === result.student
                );
                const studentId = student?._id || result.student?._id || result.student;
                return (
                  <tr key={result._id} style={styles.tableRow}>
                    <td style={styles.nameCell}>{student?.name || result.student?.name || 'Unknown'}</td>
                    <td>{student?.class || 'N/A'}</td>
                    <td>{student?.section || 'N/A'}</td>
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
                    <td>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            result.status === 'approved'
                              ? '#27ae60'
                              : result.status === 'pending'
                              ? '#f39c12'
                              : '#e74c3c',
                        }}
                      >
                        {result.status}
                      </span>
                    </td>
                    <td>
                      {studentId && (
                        <button
                          onClick={() => handleViewDetails(studentId)}
                          style={styles.viewButton}
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '10px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
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
  tableRow: {
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  nameCell: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
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

export default PrincipalResults;
