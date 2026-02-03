import { useState, useEffect } from 'react';
import { resultsAPI, studentsAPI, analyticsAPI, classesAPI } from '../../services/api';
import { usePrincipal } from '../../context/PrincipalContext';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const PrincipalAnalytics = () => {
  const { selectedSemester } = usePrincipal();
  const [activeTab, setActiveTab] = useState('overview');
  const [classFilter, setClassFilter] = useState('cs');
  const [classes, setClasses] = useState([]);
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
  const [sectionPerformance, setSectionPerformance] = useState({});
  const [subjectAnalysis, setSubjectAnalysis] = useState({});
  const [rankings, setRankings] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesRes = await classesAPI.getAll();
        const classesData = Array.isArray(classesRes.data) ? classesRes.data : classesRes.data?.data || classesRes.data || [];
        setClasses(classesData);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [selectedSemester]);

  useEffect(() => {
    if (activeTab === 'section') {
      fetchSectionPerformance();
    } else if (activeTab === 'subject') {
      fetchSubjectAnalysis();
    } else if (activeTab === 'rankings') {
      fetchRankings();
    }
  }, [activeTab, selectedSemester, classFilter]);

  const fetchOverview = async () => {
    try {
      const [resultsRes, studentsRes] = await Promise.all([
        resultsAPI.getAll(),
        studentsAPI.getAll(),
      ]);
      const resultsList = Array.isArray(resultsRes?.data) ? resultsRes.data : [];
      const results = resultsList
        .filter((r) => !selectedSemester || r.semester === selectedSemester)
        .filter((r) => r.student?.name);
      const students = Array.isArray(studentsRes?.data) ? studentsRes.data : [];

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
          class: r.student?.class ?? 'cs',
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

  const fetchSectionPerformance = async () => {
    try {
      const response = await analyticsAPI.getSectionPerformance(selectedSemester);
      setSectionPerformance(response.data);
    } catch (error) {
      console.error('Failed to fetch section performance:', error);
      showToast('Failed to load section performance', 'error');
    }
  };

  const fetchSubjectAnalysis = async () => {
    try {
      const response = await analyticsAPI.getSubjectAnalysis(selectedSemester);
      setSubjectAnalysis(response.data);
    } catch (error) {
      console.error('Failed to fetch subject analysis:', error);
      showToast('Failed to load subject analysis', 'error');
    }
  };

  const fetchRankings = async () => {
    try {
      const response = await analyticsAPI.getRankings(selectedSemester, classFilter || undefined);
      setRankings(response.data);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
      showToast('Failed to load rankings', 'error');
    }
  };

  // Classes from same source as Class Management (classesAPI)
  const uniqueClasses = classes.map((c) => c.class_name).filter(Boolean).sort();

  if (loading && activeTab === 'overview') {
    return <LoadingSpinner />;
  }

  const passRate = overview.totalResults > 0
    ? ((overview.passCount / overview.totalResults) * 100).toFixed(1)
    : 0;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Performance Analytics</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
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

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'overview' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'section' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('section')}
        >
          🏫 Section Performance
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'subject' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('subject')}
        >
          📚 Subject Analysis
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'rankings' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('rankings')}
        >
          🏆 Rankings
        </button>
      </div>

      {/* Tab Content */}
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
                <div style={styles.statValue}>
                  {overview.averagePercentage.toFixed(1)}%
                </div>
                <div style={styles.statLabel}>Average Percentage</div>
              </div>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Grade Distribution</h3>
              <div style={styles.gradeList}>
                {Object.entries(overview.gradeDistribution).map(([grade, count]) => {
                  const percentage = overview.totalResults > 0
                    ? ((count / overview.totalResults) * 100).toFixed(1)
                    : 0;
                  return (
                    <div key={grade} style={styles.gradeItem}>
                      <div style={styles.gradeHeader}>
                        <span style={styles.gradeLabel}>Grade {grade}</span>
                        <span style={styles.gradeCount}>{count} ({percentage}%)</span>
                      </div>
                      <div style={styles.gradeBarContainer}>
                        <div
                          style={{
                            ...styles.gradeBar,
                            width: `${percentage}%`,
                            backgroundColor: getGradeColor(grade),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(overview.gradeDistribution).length === 0 && (
                  <p style={styles.noData}>No data available</p>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Top Performers</h3>
              <div style={styles.topPerformersList}>
                {overview.topPerformers.map((performer, index) => (
                  <div key={index} style={styles.performerItem}>
                    <div style={styles.rankBadge}>#{index + 1}</div>
                    <div style={styles.performerInfo}>
                      <div style={styles.performerName}>{performer.name}</div>
                      <div style={styles.performerDetails}>
                        ID: {performer.studentId} | Class: {performer.class}
                      </div>
                    </div>
                    <div style={styles.performerStats}>
                      <span style={styles.percentage}>{performer.percentage.toFixed(2)}%</span>
                      <span
                        style={{
                          ...styles.gradeBadge,
                          backgroundColor: getGradeColor(performer.grade),
                        }}
                      >
                        {performer.grade}
                      </span>
                    </div>
                  </div>
                ))}
                {overview.topPerformers.length === 0 && (
                  <p style={styles.noData}>No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'section' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Section-wise Performance</h3>
          {Object.keys(sectionPerformance).length === 0 ? (
            <LoadingSpinner />
          ) : (
            <div style={styles.classList}>
              {Object.entries(sectionPerformance).map(([sectionName, data]) => (
                <div key={sectionName} style={styles.classItem}>
                  <div style={styles.classHeader}>
                    <div>
                      <span style={styles.className}>Section {data.sectionName}</span>
                      <div style={styles.classStats}>
                        {data.totalStudents} students | {data.resultsCount} results
                      </div>
                    </div>
                    <div style={styles.classMetrics}>
                      <div style={styles.metric}>
                        <span style={styles.metricLabel}>Average</span>
                        <span style={styles.metricValue}>
                          {data.averagePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div style={styles.metric}>
                        <span style={styles.metricLabel}>Pass Rate</span>
                        <span style={styles.metricValue}>
                          {data.passRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.classBarContainer}>
                    <div
                      style={{
                        ...styles.classBar,
                        width: `${Math.min(data.averagePercentage, 100)}%`,
                        backgroundColor: getPerformanceColor(data.averagePercentage),
                      }}
                    />
                  </div>
                  <div style={styles.gradeDistribution}>
                    {Object.entries(data.gradeDistribution || {}).map(([grade, count]) => (
                      <span key={grade} style={styles.gradeTag}>
                        {grade}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'subject' && (
        <div>
          <h3 style={styles.cardTitle}>Subject-wise Performance Monitoring</h3>
          {Object.keys(subjectAnalysis).length === 0 ? (
            <LoadingSpinner />
          ) : (
            <div style={styles.subjectGrid}>
              {Object.entries(subjectAnalysis).map(([subjectName, data]) => (
                <div key={subjectName} style={styles.subjectCard}>
                  <div style={styles.subjectHeader}>
                    <h4 style={styles.subjectName}>{data.subjectName}</h4>
                    <span style={styles.subjectMaxMarks}>Max: {data.maxMarks}</span>
                  </div>
                  
                  <div style={styles.subjectStats}>
                    <div style={styles.subjectStat}>
                      <span style={styles.subjectStatLabel}>Average Marks</span>
                      <span style={styles.subjectStatValue}>
                        {data.averageMarks.toFixed(2)} / {data.maxMarks}
                      </span>
                    </div>
                    <div style={styles.subjectStat}>
                      <span style={styles.subjectStatLabel}>Average %</span>
                      <span style={styles.subjectStatValue}>
                        {data.averagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div style={styles.subjectStat}>
                      <span style={styles.subjectStatLabel}>Pass Rate</span>
                      <span style={styles.subjectStatValue}>
                        {data.passRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div style={styles.subjectBarContainer}>
                    <div
                      style={{
                        ...styles.subjectBar,
                        width: `${Math.min(data.averagePercentage, 100)}%`,
                        backgroundColor: getPerformanceColor(data.averagePercentage),
                      }}
                    />
                  </div>

                  <div style={styles.subjectDetails}>
                    <div style={styles.detailRow}>
                      <span>Total Entries:</span>
                      <span>{data.count}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span>Passed:</span>
                      <span style={styles.passCount}>{data.passCount}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span>Failed:</span>
                      <span style={styles.failCount}>{data.failCount}</span>
                    </div>
                  </div>

                  {data.topScorers?.filter((s) => s.studentName && s.studentName !== '-').length > 0 && (
                    <div style={styles.topScorers}>
                      <div style={styles.topScorersTitle}>Top Scorers</div>
                      {data.topScorers
                        .filter((s) => s.studentName && s.studentName !== '-')
                        .slice(0, 5)
                        .map((scorer, idx) => (
                        <div key={idx} style={styles.scorerItem}>
                          <span>{scorer.studentName}</span>
                          <span>{scorer.marks} ({scorer.percentage.toFixed(1)}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rankings' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Student Rankings</h3>
          {rankings.length === 0 ? (
            <LoadingSpinner />
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>SGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((ranking, index) => (
                    <tr key={index}>
                      <td style={styles.rankCell}>
                        <span style={styles.rankBadge}>#{ranking.rank}</span>
                      </td>
                      <td>{ranking.studentId}</td>
                      <td style={styles.nameCell}>{ranking.name}</td>
                      <td>{ranking.class}</td>
                      <td>{ranking.section}</td>
                      <td>{ranking.percentage.toFixed(2)}%</td>
                      <td>
                        <span
                          style={{
                            ...styles.gradeBadge,
                            backgroundColor: getGradeColor(ranking.grade),
                          }}
                        >
                          {ranking.grade}
                        </span>
                      </td>
                      <td>{ranking.sgpa != null ? ranking.sgpa.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const getGradeColor = (grade) => {
  if (['A+', 'A'].includes(grade)) return '#27ae60';
  if (['B+', 'B'].includes(grade)) return '#3498db';
  if (['C+', 'C'].includes(grade)) return '#f39c12';
  if (grade === 'D') return '#e67e22';
  return '#e74c3c';
};

const getPerformanceColor = (percentage) => {
  if (percentage >= 80) return '#27ae60';
  if (percentage >= 60) return '#3498db';
  if (percentage >= 40) return '#f39c12';
  return '#e74c3c';
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
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #dee2e6',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#7f8c8d',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#9b59b6',
    borderBottomColor: '#9b59b6',
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
    gap: '15px',
  },
  gradeItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  gradeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeLabel: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  gradeCount: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  gradeBarContainer: {
    height: '24px',
    backgroundColor: '#e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  gradeBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  topPerformersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  performerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  rankBadge: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9b59b6',
    color: 'white',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '4px',
  },
  performerDetails: {
    fontSize: '12px',
    color: '#7f8c8d',
  },
  performerStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  percentage: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  classList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  classItem: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  className: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
    display: 'block',
    marginBottom: '5px',
  },
  classStats: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  classMetrics: {
    display: 'flex',
    gap: '20px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  classBarContainer: {
    height: '24px',
    backgroundColor: '#e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  classBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  gradeDistribution: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  gradeTag: {
    padding: '4px 10px',
    backgroundColor: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#2c3e50',
  },
  sectionsContainer: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #dee2e6',
  },
  sectionsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  sectionItem: {
    marginBottom: '10px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
    fontSize: '13px',
  },
  sectionName: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  sectionStats: {
    color: '#7f8c8d',
    fontSize: '12px',
  },
  sectionBar: {
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  subjectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  subjectCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  subjectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #dee2e6',
  },
  subjectName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subjectMaxMarks: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  subjectStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  subjectStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectStatLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  subjectStatValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subjectBarContainer: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  subjectBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  subjectDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '15px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#2c3e50',
  },
  passCount: {
    color: '#27ae60',
    fontWeight: '600',
  },
  failCount: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  topScorers: {
    paddingTop: '15px',
    borderTop: '1px solid #dee2e6',
  },
  topScorersTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  scorerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '6px 0',
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
    borderBottom: '1px solid #dee2e6',
  },
  rankCell: {
    textAlign: 'center',
  },
  nameCell: {
    fontWeight: '500',
    color: '#2c3e50',
  },
  noData: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: '20px',
  },
};

export default PrincipalAnalytics;
