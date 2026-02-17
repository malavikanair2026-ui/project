import React, { useState, useEffect } from 'react';
import { resultsAPI, departmentsAPI, classesAPI, marksAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ResultsView = () => {
  const [results, setResults] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [marksByStudent, setMarksByStudent] = useState({});
  const [subjectMarksOverride, setSubjectMarksOverride] = useState({}); // resultId -> array (from on-demand fetch)
  const [loadingMarksForResultId, setLoadingMarksForResultId] = useState(null);
  const [expandedResultId, setExpandedResultId] = useState(null);
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
      const filtered = list.filter((r) => r.student?.name);
      setResults(filtered);
      setError('');
      setSubjectMarksOverride({});

      const studentIds = [...new Set(filtered.map((r) => String(r.student?._id || r.student).trim()).filter(Boolean))];
      if (studentIds.length > 0) {
        try {
          const marksRes = await marksAPI.getByStudentIds(studentIds);
          const raw = marksRes?.data;
          const byStudent = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
          setMarksByStudent(byStudent);
        } catch (marksErr) {
          console.error('Failed to fetch marks for subject-wise view:', marksErr);
          setMarksByStudent({});
        }
      } else {
        setMarksByStudent({});
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setError('Failed to load results');
      setResults([]);
      setMarksByStudent({});
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

  const getSubjectWiseMarks = (result) => {
    if (subjectMarksOverride[result._id]) return subjectMarksOverride[result._id];
    const studentId = result.student?._id ?? result.student;
    const semester = result.semester;
    if (studentId == null) return [];
    const key = String(studentId).trim();
    const studentMarks = marksByStudent[key];
    if (!Array.isArray(studentMarks)) return [];
    const semesterNorm = String(semester ?? '').trim();
    return studentMarks.filter((m) => String(m.semester ?? '').trim() === semesterNorm);
  };

  const fetchSubjectMarksOnDemand = async (result) => {
    const studentId = result.student?._id ?? result.student;
    const semester = result.semester;
    if (!studentId || semester == null) return;
    setLoadingMarksForResultId(result._id);
    try {
      const res = await marksAPI.getByStudent(studentId, semester);
      const list = Array.isArray(res?.data) ? res.data : [];
      const mapped = list.map((m) => ({
        subjectName: m.subject?.subject_name || m.subject?.name || '-',
        marks_obtained: m.marks_obtained,
        max_marks: m.subject?.max_marks,
        semester: m.semester,
      }));
      setSubjectMarksOverride((prev) => ({ ...prev, [result._id]: mapped }));
    } catch (err) {
      console.error('Failed to fetch subject marks on demand:', err);
      setSubjectMarksOverride((prev) => ({ ...prev, [result._id]: [] }));
    } finally {
      setLoadingMarksForResultId(null);
    }
  };

  const getTotalMaxMarks = (result) => {
    const subjectMarks = getSubjectWiseMarks(result);
    const fromMarks = subjectMarks.reduce((sum, m) => sum + (Number(m.max_marks) || 0), 0);
    if (fromMarks > 0) return fromMarks;
    return result.total_max_marks || 0;
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
              <th style={styles.th}></th>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Total Marks (out of)</th>
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
                <td colSpan="11" style={{ ...styles.td, ...styles.noData, textAlign: 'left' }}>
                  No results found
                </td>
              </tr>
            ) : (
              results.map((result) => {
                const subjectMarks = getSubjectWiseMarks(result);
                const isExpanded = expandedResultId === result._id;
                const totalMax = getTotalMaxMarks(result);
                const loadingMarks = loadingMarksForResultId === result._id;
                const handleExpandClick = () => {
                  const nextExpanded = isExpanded ? null : result._id;
                  setExpandedResultId(nextExpanded);
                  if (!isExpanded && nextExpanded && subjectMarks.length === 0 && !subjectMarksOverride[result._id]) {
                    fetchSubjectMarksOnDemand(result);
                  }
                };
                return (
                  <React.Fragment key={result._id}>
                    <tr
                      style={styles.tableRow}
                      onClick={handleExpandClick}
                    >
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.expandBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandClick();
                          }}
                          title={isExpanded ? 'Hide subject-wise marks' : 'Show subject-wise marks'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </td>
                      <td style={styles.td}>
                        {result.student?.name || '-'}
                      </td>
                      <td style={styles.td}>{departmentName(result.student?.department)}</td>
                      <td style={styles.td}>{className(result.student?.class)}</td>
                      <td style={styles.td}>{result.semester}</td>
                      <td style={styles.td}>
                        {totalMax > 0
                          ? `${result.total_marks ?? 0} / ${totalMax}`
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
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(result._id, 'approved'); }}
                              style={styles.approveButton}
                            >
                              Approve
                            </button>
                          )}
                          {result.status !== 'frozen' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(result._id, 'frozen'); }}
                              style={styles.freezeButton}
                            >
                              Freeze
                            </button>
                          )}
                          {result.status !== 'pending' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(result._id, 'pending'); }}
                              style={styles.pendingButton}
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${result._id}-details`}>
                        <td colSpan="11" style={{ ...styles.td, padding: 0, verticalAlign: 'top' }}>
                          <div style={styles.subjectWisePanel}>
                            <h4 style={styles.subjectWiseTitle}>Subject-wise Marks</h4>
                            {loadingMarks ? (
                              <p style={styles.subjectWiseEmpty}>Loading subject-wise marks...</p>
                            ) : subjectMarks.length === 0 ? (
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
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default ResultsView;
