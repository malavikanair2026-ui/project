import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { resultsAPI, studentsAPI, analyticsAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const CHART_COLORS = ['#3498db', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
const GRADE_COLORS = { A: '#27ae60', B: '#3498db', C: '#f39c12', D: '#e67e22', F: '#e74c3c' };

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
  const [sectionPerformance, setSectionPerformance] = useState({});
  const [subjectAnalysis, setSubjectAnalysis] = useState({});
  const [rankings, setRankings] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchOverview();
  }, [semesterFilter]);

  useEffect(() => {
    if (activeTab === 'section') {
      fetchSectionPerformance();
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
      const resultsList = Array.isArray(resultsRes?.data) ? resultsRes.data : [];
      const results = resultsList
        .filter((r) => !semesterFilter || r.semester === semesterFilter)
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
      const response = await analyticsAPI.getSectionPerformance(semesterFilter);
      setSectionPerformance(response.data);
    } catch (error) {
      console.error('Failed to fetch section performance:', error);
      showToast('Failed to load section performance', 'error');
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
          style={{ ...styles.tab, ...(activeTab === 'section' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('section')}
        >
          Section-wise Performance
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

          <div style={styles.chartSection}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Grade Distribution</h3>
              {Object.keys(overview.gradeDistribution).length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={Object.entries(overview.gradeDistribution)
                      .sort(([a], [b]) => (a < b ? -1 : 1))
                      .map(([grade, count]) => ({ grade, count }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                    <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                      {Object.entries(overview.gradeDistribution)
                        .sort(([a], [b]) => (a < b ? -1 : 1))
                        .map((entry, index) => (
                          <Cell key={entry[0]} fill={GRADE_COLORS[entry[0]] || CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={styles.noData}>No data available</p>
              )}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Pass / Fail</h3>
              {overview.totalResults > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Passed', value: overview.passCount, fill: '#27ae60' },
                        { name: 'Failed', value: overview.failCount, fill: '#e74c3c' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell key="pass" fill="#27ae60" />
                      <Cell key="fail" fill="#e74c3c" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} students`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={styles.noData}>No data available</p>
              )}
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Grade Distribution (Table)</h3>
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

      {activeTab === 'section' && (
        <div>
          {Object.keys(sectionPerformance).length > 0 ? (
            <>
              <div style={styles.chartCard}>
                <h3 style={styles.cardTitle}>Section Performance Comparison</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={Object.values(sectionPerformance).map((s) => ({
                      section: s.sectionName,
                      avgPercent: Number(s.averagePercentage.toFixed(1)),
                      passRate: Number(s.passRate.toFixed(1)),
                      students: s.totalStudents,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="section" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="avgPercent" name="Avg %" fill="#3498db" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="passRate" name="Pass Rate %" fill="#27ae60" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={styles.classGrid}>
              {Object.values(sectionPerformance).map((sectionData) => (
                <div key={sectionData.sectionName} style={styles.classCard}>
                  <h3 style={styles.classTitle}>Section {sectionData.sectionName}</h3>
                  <div style={styles.classStats}>
                    <div style={styles.classStatItem}>
                      <span style={styles.classStatLabel}>Average:</span>
                      <span style={styles.classStatValue}>
                        {sectionData.averagePercentage.toFixed(2)}%
                      </span>
                    </div>
                    <div style={styles.classStatItem}>
                      <span style={styles.classStatLabel}>Pass Rate:</span>
                      <span style={styles.classStatValue}>
                        {sectionData.passRate.toFixed(1)}%
                      </span>
                    </div>
                    <div style={styles.classStatItem}>
                      <span style={styles.classStatLabel}>Students:</span>
                      <span style={styles.classStatValue}>{sectionData.totalStudents}</span>
                    </div>
                    <div style={styles.classStatItem}>
                      <span style={styles.classStatLabel}>Results:</span>
                      <span style={styles.classStatValue}>{sectionData.resultsCount}</span>
                    </div>
                  </div>
                  <div style={styles.progressBarContainer}>
                    <div
                      style={{
                        ...styles.progressBar,
                        width: `${Math.min(sectionData.averagePercentage, 100)}%`,
                        backgroundColor:
                          sectionData.averagePercentage >= 80
                            ? '#27ae60'
                            : sectionData.averagePercentage >= 60
                            ? '#3498db'
                            : sectionData.averagePercentage >= 40
                            ? '#f39c12'
                            : '#e74c3c',
                      }}
                    />
                  </div>
                  {sectionData.gradeDistribution && Object.keys(sectionData.gradeDistribution).length > 0 && (
                    <div style={styles.sectionsContainer}>
                      <h4 style={styles.sectionsTitle}>Grade distribution</h4>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.entries(sectionData.gradeDistribution).map(([grade, count]) => (
                          <span key={grade} style={styles.gradeTag}>
                            {grade}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
          ) : (
            <div style={styles.noDataCard}>No section performance data available</div>
          )}
        </div>
      )}

      {activeTab === 'subject' && (
        <div>
          {Object.keys(subjectAnalysis).length > 0 ? (
            <>
              <div style={styles.chartCard}>
                <h3 style={styles.cardTitle}>Subject-wise Average & Pass Rate</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={Object.values(subjectAnalysis).map((s) => ({
                      subject: s.subjectName?.length > 12 ? s.subjectName.slice(0, 12) + '…' : s.subjectName,
                      fullName: s.subjectName,
                      avgPercent: Number(s.averagePercentage.toFixed(1)),
                      passRate: Number(s.passRate.toFixed(1)),
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value}%`, '']} content={({ active, payload }) => active && payload?.[0] ? <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '13px' }}><div style={{ fontWeight: 600, marginBottom: 6 }}>{payload[0].payload.fullName}</div><div>Avg %: {payload[0].payload.avgPercent}%</div><div>Pass Rate: {payload[0].payload.passRate}%</div></div> : null} />
                    <Legend />
                    <Bar dataKey="avgPercent" name="Avg %" fill="#9b59b6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="passRate" name="Pass Rate %" fill="#1abc9c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
            </>
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
                      <td style={styles.td}>cs</td>
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
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
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
  chartSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  chartCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
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
  gradeTag: {
    padding: '4px 10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#2c3e50',
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
  sectionsContainer: {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #e0e0e0',
  },
  sectionsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '12px',
    marginTop: 0,
  },
  sectionItem: {
    marginBottom: '12px',
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
