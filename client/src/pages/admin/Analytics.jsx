import { useState, useEffect } from 'react';
import { resultsAPI, studentsAPI, analyticsAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalStudents: 0,
    totalResults: 0,
    passCount: 0,
    failCount: 0,
    averagePercentage: 0,
    gradeDistribution: {},
    topPerformers: [],
  });
  const [classPerformance, setClassPerformance] = useState({});
  const [subjectAnalysis, setSubjectAnalysis] = useState({});
  const [rankings, setRankings] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchOverview();
  }, [semesterFilter]);

  useEffect(() => {
    if (activeTab === 'class') {
      fetchClassPerformance();
    } else if (activeTab === 'subject') {
      fetchSubjectAnalysis();
    } else if (activeTab === 'rankings') {
      fetchRankings();
    }
  }, [activeTab, semesterFilter]);

  const fetchOverview = async () => {
    try {
      const [resultsRes, studentsRes] = await Promise.all([
        resultsAPI.getAll(),
        studentsAPI.getAll(),
      ]);

      const results = resultsRes.data
        .filter((r) => !semesterFilter || r.semester === semesterFilter)
        .filter((r) => r.student?.name);
      const students = studentsRes.data;

      const passCount = results.filter((r) => r.grade !== 'F').length;
      const failCount = results.filter((r) => r.grade === 'F').length;
      const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
      const averagePercentage = results.length > 0 ? totalPercentage / results.length : 0;

      const gradeDistribution = {};
      results.forEach((r) => {
        gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
      });

      const topPerformers = [...results]
        .filter((r) => r.student?.name)
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10)
        .map((r) => ({
          name: r.student?.name,
          percentage: r.percentage,
          grade: r.grade,
          studentId: r.student?.student_id ?? '-',
        }));

      setOverview({
        totalStudents: students.length,
        totalResults: results.length,
        passCount,
        failCount,
        averagePercentage,
        gradeDistribution,
        topPerformers,
      });
    } catch (error) {
      console.error('Failed to fetch overview:', error);
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassPerformance = async () => {
    try {
      const response = await analyticsAPI.getClassPerformance(semesterFilter);
      setClassPerformance(response.data);
    } catch (error) {
      console.error('Failed to fetch class performance:', error);
      showToast('Failed to load class performance', 'error');
    }
  };

  const fetchSubjectAnalysis = async () => {
    try {
      const response = await analyticsAPI.getSubjectAnalysis(semesterFilter);
      setSubjectAnalysis(response.data);
    } catch (error) {
      console.error('Failed to fetch subject analysis:', error);
      showToast('Failed to load subject analysis', 'error');
    }
  };

  const fetchRankings = async () => {
    try {
      const response = await analyticsAPI.getRankings(semesterFilter);
      setRankings(response.data);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
      showToast('Failed to load rankings', 'error');
    }
  };

  if (loading && activeTab === 'overview') {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  const passRate =
    overview.totalResults > 0
      ? ((overview.passCount / overview.totalResults) * 100).toFixed(1)
      : 0;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Analytics & Reports</h2>
        <div style={styles.filterContainer}>
          <label style={styles.filterLabel}>Semester:</label>
          <input
            type="text"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            placeholder="Filter by semester (optional)"
            style={styles.filterInput}
          />
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'class' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('class')}
        >
          Class-wise Performance
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'subject' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('subject')}
        >
          Subject-wise Analysis
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'rankings' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('rankings')}
        >
          Full Rankings
        </button>
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🎓</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{overview.totalStudents}</div>
                <div style={styles.statLabel}>Total Students</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📋</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{overview.totalResults}</div>
                <div style={styles.statLabel}>Total Results</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{overview.passCount}</div>
                <div style={styles.statLabel}>Passed</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>❌</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{overview.failCount}</div>
                <div style={styles.statLabel}>Failed</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{passRate}%</div>
                <div style={styles.statLabel}>Pass Rate</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📈</div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{overview.averagePercentage.toFixed(1)}%</div>
                <div style={styles.statLabel}>Average Percentage</div>
              </div>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Grade Distribution</h3>
              <div style={styles.gradeList}>
                {Object.entries(overview.gradeDistribution).map(([grade, count]) => (
                  <div key={grade} style={styles.gradeItem}>
                    <span style={styles.gradeLabel}>Grade {grade}:</span>
                    <span style={styles.gradeCount}>{count} students</span>
                  </div>
                ))}
                {Object.keys(overview.gradeDistribution).length === 0 && (
                  <p style={styles.noData}>No data available</p>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Top 10 Performers</h3>
              <div style={styles.topPerformersList}>
                {overview.topPerformers.length > 0 ? (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>Student ID</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Percentage</th>
                        <th style={styles.th}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.topPerformers.map((student, index) => (
                        <tr key={index}>
                          <td style={styles.td}>{index + 1}</td>
                          <td style={styles.td}>{student.studentId}</td>
                          <td style={styles.td}>{student.name}</td>
                          <td style={styles.td}>{student.percentage.toFixed(2)}%</td>
                          <td style={styles.td}>
                            <span style={styles.gradeBadge}>{student.grade}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={styles.noData}>No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'class' && (
        <div>
          {Object.keys(classPerformance).length > 0 ? (
            <div style={styles.classGrid}>
              {Object.values(classPerformance).map((classData) => (
                <div key={classData.className} style={styles.classCard}>
                  <h3 style={styles.classTitle}>{classData.className}</h3>
                  <div style={styles.classStats}>
                    <div style={styles.classStatItem}>
                      <span style={styles.classStatLabel}>Average:</span>
                      <span style={styles.classStatValue}>
                        {classData.averagePercentage.toFixed(2)}%
                      </span>
                    </div>
                    <div style={styles.classStatItem}>
                      <span style={styles.classStatLabel}>Pass Rate:</span>
                      <span style={styles.classStatValue}>
                        {classData.passRate.toFixed(1)}%
                      </span>
                    </div>
                    <div style={styles.classStatItem}>
                      <span style={styles.classStatLabel}>Students:</span>
                      <span style={styles.classStatValue}>{classData.totalStudents}</span>
                    </div>
                    <div style={styles.classStatItem}>
                      <span style={styles.classStatLabel}>Results:</span>
                      <span style={styles.classStatValue}>{classData.resultsCount}</span>
                    </div>
                  </div>
                  <div style={styles.progressBarContainer}>
                    <div
                      style={{
                        ...styles.progressBar,
                        width: `${Math.min(classData.averagePercentage, 100)}%`,
                        backgroundColor:
                          classData.averagePercentage >= 80
                            ? '#27ae60'
                            : classData.averagePercentage >= 60
                            ? '#3498db'
                            : classData.averagePercentage >= 40
                            ? '#f39c12'
                            : '#e74c3c',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noDataCard}>No class performance data available</div>
          )}
        </div>
      )}

      {activeTab === 'subject' && (
        <div>
          {Object.keys(subjectAnalysis).length > 0 ? (
            <div style={styles.subjectGrid}>
              {Object.values(subjectAnalysis).map((subject) => (
                <div key={subject.subjectId} style={styles.subjectCard}>
                  <h3 style={styles.subjectTitle}>{subject.subjectName}</h3>
                  <div style={styles.subjectStats}>
                    <div style={styles.subjectStatRow}>
                      <span>Average Marks:</span>
                      <strong>{subject.averageMarks.toFixed(2)} / {subject.maxMarks}</strong>
                    </div>
                    <div style={styles.subjectStatRow}>
                      <span>Average %:</span>
                      <strong>{subject.averagePercentage.toFixed(2)}%</strong>
                    </div>
                    <div style={styles.subjectStatRow}>
                      <span>Pass Rate:</span>
                      <strong>{subject.passRate.toFixed(1)}%</strong>
                    </div>
                    <div style={styles.subjectStatRow}>
                      <span>Total Attempts:</span>
                      <strong>{subject.count}</strong>
                    </div>
                  </div>
                  {subject.topScorers.filter((s) => s.studentName && s.studentName !== '-').length > 0 && (
                    <div style={styles.topScorersSection}>
                      <strong>Top Scorers:</strong>
                      <ol style={styles.topScorersList}>
                        {subject.topScorers
                          .filter((s) => s.studentName && s.studentName !== '-')
                          .slice(0, 5)
                          .map((scorer, idx) => (
                          <li key={idx} style={styles.topScorerItem}>
                            {scorer.studentName} - {scorer.marks}/{subject.maxMarks} ({scorer.percentage.toFixed(1)}%)
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noDataCard}>No subject analysis data available</div>
          )}
        </div>
      )}

      {activeTab === 'rankings' && (
        <div>
          {rankings.length > 0 ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Rank</th>
                    <th style={styles.th}>Student ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Section</th>
                    <th style={styles.th}>Semester</th>
                    <th style={styles.th}>Total Marks</th>
                    <th style={styles.th}>Percentage</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>SGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((student, index) => (
                    <tr key={index}>
                      <td style={styles.td}>
                        <strong>{student.rank}</strong>
                      </td>
                      <td style={styles.td}>{student.studentId}</td>
                      <td style={styles.td}>{student.name}</td>
                      <td style={styles.td}>{student.class?.class_name || student.class || '-'}</td>
                      <td style={styles.td}>{student.section}</td>
                      <td style={styles.td}>{student.semester}</td>
                      <td style={styles.td}>{student.totalMarks}</td>
                      <td style={styles.td}>{student.percentage.toFixed(2)}%</td>
                      <td style={styles.td}>
                        <span style={styles.gradeBadge}>{student.grade}</span>
                      </td>
                      <td style={styles.td}>{student.sgpa.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.noDataCard}>No rankings data available</div>
          )}
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
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filterLabel: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  filterInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#7f8c8d',
    transition: 'all 0.3s',
  },
  tabActive: {
    color: '#3498db',
    borderBottomColor: '#3498db',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  statIcon: {
    fontSize: '40px',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginTop: '5px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '20px',
    marginTop: 0,
    marginBottom: '20px',
    color: '#2c3e50',
  },
  gradeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  gradeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  gradeLabel: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  gradeCount: {
    color: '#7f8c8d',
  },
  topPerformersList: {
    overflowX: 'auto',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
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
    borderBottom: '1px solid #dee2e6',
  },
  gradeBadge: {
    padding: '4px 10px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  noData: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: '20px',
  },
  noDataCard: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  classGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  classCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  classTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '20px',
    color: '#2c3e50',
  },
  classStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '15px',
  },
  classStatItem: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  classStatLabel: {
    color: '#7f8c8d',
  },
  classStatValue: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  progressBarContainer: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: '10px',
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  subjectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  subjectCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  subjectTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '20px',
    color: '#2c3e50',
  },
  subjectStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  subjectStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  topScorersSection: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '2px solid #f0f0f0',
  },
  topScorersList: {
    marginTop: '10px',
    paddingLeft: '20px',
  },
  topScorerItem: {
    padding: '5px 0',
    color: '#555',
  },
};

export default Analytics;
