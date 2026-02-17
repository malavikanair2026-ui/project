import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultsAPI, studentsAPI, classesAPI, marksAPI } from '../../services/api';
import { usePrincipal } from '../../context/PrincipalContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const PrincipalResults = () => {
  const navigate = useNavigate();
  const { selectedSemester, selectedSection } = usePrincipal();
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [marksByStudent, setMarksByStudent] = useState({});
  const [expandedResultId, setExpandedResultId] = useState(null);
  const [loadingMarksFor, setLoadingMarksFor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resultsRes, studentsRes, classesRes] = await Promise.all([
        resultsAPI.getAll(),
        studentsAPI.getAll(),
        classesAPI.getAll(),
      ]);

      const resultsData = Array.isArray(resultsRes.data) ? resultsRes.data : [];
      setResults(resultsData);
      setStudents(studentsRes.data);
      const classesData = Array.isArray(classesRes.data) ? classesRes.data : classesRes.data?.data || classesRes.data || [];
      setClasses(classesData);

      const studentIds = [...new Set(
        resultsData.map((r) => {
          const s = r.student?._id ?? r.student;
          return s != null ? String(s) : null;
        }).filter(Boolean)
      )];
      if (studentIds.length > 0) {
        try {
          const marksRes = await marksAPI.getByStudentIds(studentIds);
          const raw = marksRes?.data ?? marksRes;
          setMarksByStudent(typeof raw === 'object' && raw !== null ? raw : {});
        } catch (e) {
          console.error('Failed to fetch marks:', e);
        }
      }
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
        const studentClassName = student?.class?.class_name || student?.class;
        return studentClassName === filterClass;
      });
    }

    if (selectedSemester) {
      filtered = filtered.filter((r) => r.semester === selectedSemester);
    }

    if (selectedSection) {
      filtered = filtered.filter((r) => {
        const student = students.find((s) => s._id === r.student?._id || s._id === r.student);
        return student?.section === selectedSection;
      });
    }

    // Remove details of unknown (orphaned results where student is missing)
    filtered = filtered.filter((r) => {
      const student = students.find((s) => s._id === r.student?._id || s._id === r.student);
      return (student?.name || r.student?.name);
    });

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

  const getSubjectMarksForResult = (result) => {
    const studentId = result.student?._id ?? result.student;
    if (!studentId) return [];
    const key = String(studentId);
    const list = marksByStudent[key] || marksByStudent[studentId] || [];
    if (!list.length) return [];
    const semester = result.semester;
    const bySemester = list.filter((m) => String(m.semester || '') === String(semester || ''));
    return bySemester.length > 0 ? bySemester : list;
  };

  const loadMarksForStudent = async (studentId, semester) => {
    const key = String(studentId);
    if (marksByStudent[key]?.length > 0) return;
    setLoadingMarksFor(key);
    try {
      const res = await marksAPI.getByStudent(studentId, semester);
      const raw = res?.data ?? res;
      const list = Array.isArray(raw) ? raw : [];
      const normalized = list.map((m) => ({
        subjectName: m.subject?.subject_name || m.subject?.name || '-',
        marks_obtained: m.marks_obtained,
        max_marks: m.subject?.max_marks,
        semester: m.semester,
      }));
      setMarksByStudent((prev) => ({ ...prev, [key]: normalized }));
    } catch (e) {
      console.error('Failed to fetch marks for student:', e);
    } finally {
      setLoadingMarksFor(null);
    }
  };

  const toggleExpand = (result) => {
    const nextId = expandedResultId === result._id ? null : result._id;
    setExpandedResultId(nextId);
    if (nextId) {
      const studentId = result.student?._id ?? result.student;
      if (studentId) loadMarksForStudent(studentId, result.semester);
    }
  };

  // Classes from same source as Class Management (classesAPI)
  const uniqueClasses = classes.map((c) => c.class_name).filter(Boolean).sort();

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
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 36 }}></th>
              <th style={styles.th}>Student Name</th>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Section</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Total Marks (out of)</th>
              <th style={styles.th}>Percentage</th>
              <th style={styles.th}>Grade</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ ...styles.td, ...styles.noData }}>
                  No results found
                </td>
              </tr>
            ) : (
              filteredResults.map((result) => {
                const student = students.find(
                  (s) => s._id === result.student?._id || s._id === result.student
                );
                const studentId = student?._id || result.student?._id || result.student;
                const subjectMarks = getSubjectMarksForResult(result);
                const isExpanded = expandedResultId === result._id;
                return (
                  <Fragment key={result._id}>
                    <tr style={styles.tableRow}>
                      <td style={styles.td}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(result); }}
                          style={styles.expandButton}
                          title={isExpanded ? 'Collapse subject-wise marks' : 'Show subject-wise marks'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </td>
                      <td style={{ ...styles.td, ...styles.nameCell }}>{student?.name || result.student?.name || '-'}</td>
                      <td style={styles.td}>{student?.class != null && typeof student.class === 'object' ? (student.class.class_name ?? '-') : (student?.class ?? 'cs')}</td>
                      <td style={styles.td}>{student?.section || '-'}</td>
                      <td style={styles.td}>{result.semester}</td>
                      <td style={styles.td}>
                        {result.total_max_marks > 0
                          ? `${result.total_marks ?? 0} / ${result.total_max_marks}`
                          : (result.total_marks ?? '-')}
                      </td>
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
                      <td style={styles.td}>
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
                    {isExpanded && (
                      <tr>
                        <td colSpan="10" style={styles.expandedTd}>
                          <div style={styles.subjectMarksSection}>
                            <h4 style={styles.subjectMarksTitle}>Subject-wise Marks</h4>
                            {loadingMarksFor === String(studentId || '') ? (
                              <div style={styles.noSubjectMarks}>Loading subject-wise marks...</div>
                            ) : subjectMarks.length === 0 ? (
                              <div style={styles.noSubjectMarks}>No subject-wise marks recorded for this semester.</div>
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
                                    const max = m.max_marks || 100;
                                    const pct = max > 0 ? ((m.marks_obtained / max) * 100).toFixed(1) : '-';
                                    return (
                                      <tr key={idx}>
                                        <td style={styles.subjectTd}>{m.subjectName}</td>
                                        <td style={styles.subjectTd}>{m.marks_obtained}</td>
                                        <td style={styles.subjectTd}>{max}</td>
                                        <td style={styles.subjectTd}>{pct}%</td>
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
                  </Fragment>
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
    textAlign: 'left',
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
  expandButton: {
    padding: '4px 8px',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    background: '#f8f9fa',
    cursor: 'pointer',
    fontSize: '12px',
  },
  expandedTd: {
    padding: 0,
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#f8fafc',
    verticalAlign: 'top',
  },
  subjectMarksSection: {
    padding: '16px 20px 16px 56px',
  },
  subjectMarksTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  noSubjectMarks: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  subjectTable: {
    width: '100%',
    maxWidth: '500px',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  subjectTh: {
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '1px solid #dee2e6',
    fontWeight: '600',
    color: '#2c3e50',
  },
  subjectTd: {
    padding: '8px 12px',
    borderBottom: '1px solid #eee',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default PrincipalResults;
