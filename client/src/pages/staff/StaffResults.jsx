import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultsAPI, studentsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const StaffResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
        const student = students.find(
          (s) => s._id === r.student?._id || s._id === r.student
        );
        const studentClassName = student?.class?.class_name || student?.class;
        return studentClassName === filterClass;
      });
    }

    if (filterSemester) {
      filtered = filtered.filter((r) => r.semester === filterSemester);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((r) => {
        const student = students.find(
          (s) => s._id === r.student?._id || s._id === r.student
        );
        return (
          student?.name?.toLowerCase().includes(term) ||
          student?.student_id?.toLowerCase().includes(term) ||
          r.semester?.toLowerCase().includes(term)
        );
      });
    }

    // Remove details of unknown (orphaned results where student is missing)
    filtered = filtered.filter((r) => {
      const student = students.find((s) => s._id === r.student?._id || s._id === r.student);
      return (student?.name || r.student?.name);
    });

    return filtered;
  };

  const handleViewDetails = (studentId) => {
    // Navigate to a detail view or show modal
    // For now, we'll just show an alert or could navigate to student detail page
    if (studentId) {
      // Could navigate to a detail page if we create one
      console.log('View details for student:', studentId);
    }
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return '#27ae60';
    if (['B+', 'B'].includes(grade)) return '#3498db';
    if (['C+', 'C'].includes(grade)) return '#f39c12';
    if (grade === 'D') return '#e67e22';
    return '#e74c3c';
  };

  const uniqueClasses = [...new Set(students.map((s) => s.class?.class_name || s.class).filter(Boolean))];
  const uniqueSemesters = [...new Set(results.map((r) => r.semester))].filter(Boolean);

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredResults = getFilteredResults();

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>View Results</h2>
        <div style={styles.filters}>
          <input
            type="text"
            placeholder="Search by name, ID, or semester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
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
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="8" style={styles.noData}>
                  No results found
                </td>
              </tr>
            ) : (
              filteredResults.map((result) => {
                const student = students.find(
                  (s) => s._id === result.student?._id || s._id === result.student
                );
                return (
                  <tr key={result._id} style={styles.tableRow}>
                    <td style={styles.nameCell}>{student?.name || result.student?.name || '-'}</td>
                    <td>{student?.class?.class_name || student?.class || '-'}</td>
                    <td>{student?.section || '-'}</td>
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
  nameCell: {
    fontWeight: '500',
    color: '#2c3e50',
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
  tableRow: {
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default StaffResults;
