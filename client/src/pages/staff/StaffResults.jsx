import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultsAPI, studentsAPI, marksAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const StaffResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [marksByStudent, setMarksByStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedResultId, setExpandedResultId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resultsRes, studentsRes] = await Promise.all([
        resultsAPI.getAll(),
        studentsAPI.getAll(),
      ]);
      const resultsList = Array.isArray(resultsRes?.data) ? resultsRes.data : [];
      const studentsList = Array.isArray(studentsRes?.data) ? studentsRes.data : [];
      setResults(resultsList);
      setStudents(studentsList);

      const studentIds = [...new Set(resultsList.map((r) => String(r.student?._id || r.student)).filter(Boolean))];
      if (studentIds.length > 0) {
        const marksRes = await marksAPI.getByStudentIds(studentIds);
        setMarksByStudent(marksRes?.data || {});
      } else {
        setMarksByStudent({});
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setResults([]);
      setStudents([]);
      setMarksByStudent({});
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
        const nameStr = String(student?.name ?? '');
        const idStr = String(student?.student_id ?? '');
        const semesterStr = String(r.semester ?? '');
        return (
          nameStr.toLowerCase().includes(term) ||
          idStr.toLowerCase().includes(term) ||
          semesterStr.toLowerCase().includes(term)
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

  const getSubjectWiseMarks = (result) => {
    const studentId = result.student?._id || result.student;
    const semester = result.semester;
    if (!studentId) return [];
    const key = String(studentId);
    if (!marksByStudent[key]) return [];
    return (marksByStudent[key] || []).filter((m) => m.semester === semester);
  };

  const getTotalMaxMarks = (result) => {
    const subjectMarks = getSubjectWiseMarks(result);
    const fromMarks = subjectMarks.reduce((sum, m) => sum + (Number(m.max_marks) || 0), 0);
    if (fromMarks > 0) return fromMarks;
    return result.total_max_marks || 0;
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
              <th style={styles.th}></th>
              <th style={styles.th}>Student Name</th>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Section</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Total Marks</th>
              <th style={styles.th}>Percentage</th>
              <th style={styles.th}>Grade</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ ...styles.td, ...styles.noData }}>
                  No results found
                </td>
              </tr>
            ) : (
              filteredResults.map((result) => {
                const student = students.find(
                  (s) => s._id === result.student?._id || s._id === result.student
                );
                const subjectMarks = getSubjectWiseMarks(result);
                const isExpanded = expandedResultId === result._id;
                return (
                  <React.Fragment key={result._id}>
                    <tr
                      style={styles.tableRow}
                      onClick={() => setExpandedResultId(isExpanded ? null : result._id)}
                    >
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.expandBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedResultId(isExpanded ? null : result._id);
                          }}
                          title={isExpanded ? 'Hide subject-wise marks' : 'Show subject-wise marks'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </td>
                      <td style={{ ...styles.td, ...styles.nameCell }}>{student?.name || result.student?.name || '-'}</td>
                      <td style={styles.td}>{student?.class?.class_name || student?.class || '-'}</td>
                      <td style={styles.td}>{student?.section || '-'}</td>
                      <td style={styles.td}>{result.semester}</td>
                      <td style={styles.td}>
                        {(() => {
                          const totalMax = getTotalMaxMarks(result);
                          return totalMax > 0
                            ? `${result.total_marks ?? 0} / ${totalMax}`
                            : (result.total_marks ?? '-');
                        })()}
                      </td>
                      <td style={styles.td}>{result.percentage?.toFixed(2)}%</td>
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
                      <td style={styles.td}>
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
                    {isExpanded && (
                      <tr key={`${result._id}-details`}>
                        <td colSpan="9" style={{ ...styles.td, padding: 0, verticalAlign: 'top' }}>
                          <div style={styles.subjectWisePanel}>
                            <h4 style={styles.subjectWiseTitle}>Subject-wise Marks</h4>
                            {subjectMarks.length === 0 ? (
                              <p style={styles.subjectWiseEmpty}>No subject-wise marks found for this semester.</p>
                            ) : (
                              <table style={styles.subjectTable}>
                                <thead>
                                  <tr>
                                    <th style={styles.subjectTh}>Subject</th>
                                    <th style={styles.subjectTh}>Marks Obtained</th>
                                    <th style={styles.subjectTh}>Max Marks</th>
                                    <th style={styles.subjectTh}>Percentage</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subjectMarks.map((m, idx) => {
                                    const max = m.max_marks ?? 100;
                                    const pct = max > 0 ? ((m.marks_obtained / max) * 100).toFixed(1) : '-';
                                    return (
                                      <tr key={idx}>
                                        <td style={styles.subjectTd}>{m.subjectName}</td>
                                        <td style={styles.subjectTd}>{m.marks_obtained}</td>
                                        <td style={styles.subjectTd}>{max}</td>
                                        <td style={styles.subjectTd}>{pct === '-' ? '-' : `${pct}%`}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    minWidth: '200px',
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
    textAlign: 'left',
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
  expandBtn: {
    padding: '4px 8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#2c3e50',
  },
  subjectWisePanel: {
    padding: '16px 24px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dee2e6',
  },
  subjectWiseTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  subjectWiseEmpty: {
    margin: 0,
    fontSize: '14px',
    color: '#7f8c8d',
  },
  subjectTable: {
    width: '100%',
    maxWidth: '500px',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  subjectTh: {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#fff',
  },
  subjectTd: {
    padding: '8px 12px',
    borderBottom: '1px solid #eee',
  },
};

export default StaffResults;
