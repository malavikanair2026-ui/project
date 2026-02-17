import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, resultsAPI, marksAPI } from '../../services/api';

const StudentResults = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchData();
  }, [user, selectedSemester]);

  const fetchData = async () => {
    try {
      // Get student record
      const studentRes = await studentsAPI.getByUserId(user._id);
      setStudent(studentRes.data);

      // Get results
      const resultsRes = await resultsAPI.getByStudent(
        studentRes.data._id,
        selectedSemester || undefined
      );
      // Handle both single result and array of results
      if (resultsRes.data) {
        setResults(Array.isArray(resultsRes.data) ? resultsRes.data : [resultsRes.data]);
      } else {
        setResults([]);
      }

      // Get marks
      const marksRes = await marksAPI.getByStudent(
        studentRes.data._id,
        selectedSemester || undefined
      );
      setMarks(marksRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status !== 404) {
        // 404 is okay if student doesn't exist yet
      }
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return '#27ae60';
    if (['B+', 'B'].includes(grade)) return '#3498db';
    if (['C+', 'C'].includes(grade)) return '#f39c12';
    if (grade === 'D') return '#e67e22';
    return '#e74c3c';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      approved: '#27ae60',
      frozen: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  // Total maximum marks for a semester (sum of max_marks of all mark rows in that semester)
  const getMaxMarksForSemester = (semester) => {
    const semesterMarks = marks.filter((m) => (m.semester || '') === (semester || ''));
    return semesterMarks.reduce((sum, m) => sum + (m.subject?.max_marks || 0), 0);
  };

  // Total obtained and max from marks for a semester (so result cards and table total match)
  const getTotalFromMarksForSemester = (semester) => {
    const semesterMarks = marks.filter((m) => (m.semester || '') === (semester || ''));
    if (!semesterMarks.length) return null;
    let totalObtained = 0;
    let totalMax = 0;
    semesterMarks.forEach((m) => {
      totalObtained += Number(m.marks_obtained) || 0;
      totalMax += Number(m.subject?.max_marks) || 0;
    });
    return { totalObtained, totalMax };
  };

  const exportToPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('My Results', pageWidth / 2, y, { align: 'center' });
    y += 12;

    // Student info
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Student: ${student.name || 'N/A'}`, 14, y);
    y += 6;
    doc.text(`Student ID: ${student.student_id || 'N/A'}`, 14, y);
    y += 6;
    doc.text(`Semester: ${selectedSemester || 'All Semesters'}`, 14, y);
    y += 14;

    // Results summary table
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Result Summary', 14, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Semester', 'Total Marks', 'Percentage', 'Grade', 'SGPA', 'Status']],
      body: results.map((r) => {
        const fromMarks = getTotalFromMarksForSemester(r.semester);
        const totalObtained = fromMarks ? fromMarks.totalObtained : (r.total_marks ?? '-');
        const maxM = fromMarks?.totalMax ?? marks.filter((m) => (m.semester || '') === (r.semester || '')).reduce((s, m) => s + (m.subject?.max_marks || 0), 0);
        const totalStr = maxM > 0 ? `${totalObtained} / ${maxM}` : String(totalObtained);
        return [
          r.semester || '-',
          totalStr,
          r.percentage != null ? `${r.percentage.toFixed(2)}%` : '-',
          r.grade || '-',
          r.sgpa != null ? r.sgpa.toFixed(2) : '-',
          (r.status || '-').toUpperCase(),
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 },
    });
    y = doc.lastAutoTable.finalY + 14;

    // Subject-wise marks
    if (marks.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Subject-wise Marks', 14, y);
      y += 10;

      autoTable(doc, {
        startY: y,
        head: [['Subject', 'Marks Obtained', 'Max Marks', 'Exam Type', 'Semester']],
        body: marks.map((m) => [
          m.subject?.subject_name || 'N/A',
          String(m.marks_obtained ?? '-'),
          String(m.subject?.max_marks ?? 'N/A'),
          m.exam_type || '-',
          m.semester || 'N/A',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14 },
      });
    }

    doc.save(`results_${student.student_id || 'student'}_${selectedSemester || 'all'}.pdf`);
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!student) {
    return (
      <div style={styles.noStudentCard}>
        <p>Student profile not found. Please contact your administrator.</p>
      </div>
    );
  }

  const uniqueSemesters = [...new Set(results.map((r) => r.semester))];

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>My Results</h2>
        <div style={styles.headerActions}>
          {uniqueSemesters.length > 0 && (
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={styles.select}
            >
              <option value="">All Semesters</option>
              {uniqueSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          )}
          {results.length > 0 && (
            <button type="button" onClick={exportToPdf} style={styles.exportBtn}>
              Export to PDF
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div style={styles.noDataCard}>
          <p>No results available yet.</p>
        </div>
      ) : (
        <>
          <div style={styles.resultsGrid}>
            {results.map((result) => {
              const fromMarks = getTotalFromMarksForSemester(result.semester);
              const totalObtained = fromMarks ? fromMarks.totalObtained : (result.total_marks ?? 0);
              const totalMax = fromMarks?.totalMax ?? (result.total_max_marks > 0
                ? result.total_max_marks
                : getMaxMarksForSemester(result.semester));
              return (
              <div key={result._id} style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <h3 style={styles.semesterTitle}>{result.semester}</h3>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(result.status),
                    }}
                  >
                    {result.status}
                  </span>
                </div>
                <div style={styles.resultBody}>
                  <div style={styles.resultRow}>
                    <span>Total Marks:</span>
                    <strong>
                      {totalObtained}
                      {totalMax > 0 ? ` / ${totalMax}` : ''}
                    </strong>
                  </div>
                  <div style={styles.resultRow}>
                    <span>Percentage:</span>
                    <strong>{result.percentage.toFixed(2)}%</strong>
                  </div>
                  <div style={styles.resultRow}>
                    <span>Grade:</span>
                    <span
                      style={{
                        ...styles.gradeBadge,
                        backgroundColor: getGradeColor(result.grade),
                      }}
                    >
                      {result.grade}
                    </span>
                  </div>
                  <div style={styles.resultRow}>
                    <span>SGPA:</span>
                    <strong>{result.sgpa.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {marks.length > 0 && (
            <div style={styles.marksSection}>
              <h3 style={styles.sectionTitle}>Subject-wise Marks</h3>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Marks Obtained</th>
                      <th style={styles.th}>Max Marks</th>
                      <th style={styles.th}>Exam Type</th>
                      <th style={styles.th}>Semester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((mark) => (
                      <tr key={mark._id}>
                        <td style={styles.td}>{mark.subject?.subject_name || 'N/A'}</td>
                        <td style={styles.td}>{mark.marks_obtained}</td>
                        <td style={styles.td}>{mark.subject?.max_marks || 'N/A'}</td>
                        <td style={styles.td}>{mark.exam_type}</td>
                        <td style={styles.td}>{mark.semester || 'N/A'}</td>
                      </tr>
                    ))}
                    {marks.length > 0 && (() => {
                      let sumObtained = 0;
                      let sumMax = 0;
                      marks.forEach((m) => {
                        sumObtained += Number(m.marks_obtained) || 0;
                        sumMax += Number(m.subject?.max_marks) || 0;
                      });
                      return (
                        <tr style={styles.totalRow}>
                          <td style={styles.td}><strong>Total</strong></td>
                          <td style={styles.td}><strong>{sumObtained}</strong></td>
                          <td style={styles.td}><strong>{sumMax}</strong></td>
                          <td style={styles.td}></td>
                          <td style={styles.td}></td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  exportBtn: {
    padding: '10px 18px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  resultCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
  },
  semesterTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#2c3e50',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  resultBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  totalRow: {
    fontWeight: '600',
    backgroundColor: '#f8f9fa',
    borderTop: '2px solid #dee2e6',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
  },
  marksSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    marginTop: 0,
    marginBottom: '20px',
    color: '#2c3e50',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#f8f9fa',
  },
  td: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #dee2e6',
  },
  noDataCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
  noStudentCard: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ffc107',
    color: '#856404',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
  },
};

export default StudentResults;
