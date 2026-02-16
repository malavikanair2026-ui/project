import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, resultsAPI, marksAPI } from '../../services/api';

const StudentPerformance = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const studentRes = await studentsAPI.getByUserId(user._id);
      setStudent(studentRes.data);

      const resultsRes = await resultsAPI.getByStudent(studentRes.data._id);
      if (resultsRes.data) {
        setResults(Array.isArray(resultsRes.data) ? resultsRes.data : [resultsRes.data]);
      } else {
        setResults([]);
      }

      const marksRes = await marksAPI.getByStudent(studentRes.data._id);
      setMarks(Array.isArray(marksRes.data) ? marksRes.data : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance metrics (from results and/or marks)
  const calculateMetrics = () => {
    const marksList = Array.isArray(marks) ? marks : [];
    const resultsList = Array.isArray(results) ? results : [];

    // Subject-wise performance from marks (so Strengths / Areas for Improvement work even without calculated results)
    const subjectPerformance = {};
    marksList.forEach((mark) => {
      const subjectName = mark.subject?.subject_name || '-';
      const maxForSubject = mark.subject?.max_marks;
      if (maxForSubject == null || maxForSubject === 0) return;
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          total: 0,
          max: 0,
          count: 0,
          marks: [],
        };
      }
      subjectPerformance[subjectName].total += Number(mark.marks_obtained) || 0;
      subjectPerformance[subjectName].max += Number(maxForSubject) || 0;
      subjectPerformance[subjectName].count += 1;
      subjectPerformance[subjectName].marks.push(mark.marks_obtained);
    });

    // Calculate strengths and areas for improvement
    const strengths = [];
    const areasForImprovement = [];

    Object.entries(subjectPerformance).forEach(([subjectName, data]) => {
      if (!data.max) return;
      const avgMarks = data.total / data.count;
      const maxMarks = data.max / data.count;
      const subjectPercentage = maxMarks > 0 ? (avgMarks / maxMarks) * 100 : 0;

      if (subjectPercentage >= 80) {
        strengths.push({
          subject: subjectName,
          percentage: subjectPercentage,
          average: avgMarks,
          max: maxMarks,
        });
      } else {
        areasForImprovement.push({
          subject: subjectName,
          percentage: subjectPercentage,
          average: avgMarks,
          max: maxMarks,
        });
      }
    });

    strengths.sort((a, b) => b.percentage - a.percentage);
    areasForImprovement.sort((a, b) => a.percentage - b.percentage);

    const hasAnyData = resultsList.length > 0 || Object.keys(subjectPerformance).length > 0;
    if (!hasAnyData) return null;

    // Summary stats from results if available; otherwise from subject percentages
    let average = 0;
    let highest = 0;
    let lowest = 0;
    let trend = 0;
    const subjectPercentages = Object.values(subjectPerformance)
      .filter((d) => d.max > 0)
      .map((d) => (d.total / d.max) * 100);
    if (resultsList.length > 0) {
      const percentages = resultsList.map((r) => r.percentage);
      average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
      highest = Math.max(...percentages);
      lowest = Math.min(...percentages);
      trend = resultsList.length > 1
        ? (resultsList[0].percentage - resultsList[resultsList.length - 1].percentage)
        : 0;
    } else if (subjectPercentages.length > 0) {
      average = subjectPercentages.reduce((a, b) => a + b, 0) / subjectPercentages.length;
      highest = Math.max(...subjectPercentages);
      lowest = Math.min(...subjectPercentages);
    }

    return {
      average,
      highest,
      lowest,
      trend,
      subjectPerformance,
      strengths,
      areasForImprovement,
    };
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

  const metrics = calculateMetrics();

  if (!metrics) {
    return (
      <div style={styles.noDataCard}>
        <p>No performance data available yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={styles.title}>Performance Analysis</h2>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>📊</div>
          <div style={styles.metricInfo}>
            <div style={styles.metricValue}>{metrics.average.toFixed(1)}%</div>
            <div style={styles.metricLabel}>Average Percentage</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>⬆️</div>
          <div style={styles.metricInfo}>
            <div style={styles.metricValue}>{metrics.highest.toFixed(1)}%</div>
            <div style={styles.metricLabel}>Highest Score</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>⬇️</div>
          <div style={styles.metricInfo}>
            <div style={styles.metricValue}>{metrics.lowest.toFixed(1)}%</div>
            <div style={styles.metricLabel}>Lowest Score</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            {metrics.trend > 0 ? '📈' : metrics.trend < 0 ? '📉' : '➡️'}
          </div>
          <div style={styles.metricInfo}>
            <div
              style={{
                ...styles.metricValue,
                color: metrics.trend > 0 ? '#27ae60' : metrics.trend < 0 ? '#e74c3c' : '#95a5a6',
              }}
            >
              {metrics.trend > 0 ? '+' : ''}
              {metrics.trend.toFixed(1)}%
            </div>
            <div style={styles.metricLabel}>Performance Trend</div>
          </div>
        </div>
      </div>

      {/* Simple Bar Chart for Results Over Time */}
      {results.length > 0 && (
        <div style={styles.chartSection}>
          <h3 style={styles.sectionTitle}>Results Over Time</h3>
          <div style={styles.chartContainer}>
            {results.map((result, index) => {
              const percentage = result.percentage;
              const barWidth = (percentage / 100) * 100;
              return (
                <div key={result._id} style={styles.chartBar}>
                  <div style={styles.chartBarLabel}>
                    <span>{result.semester}</span>
                    <span style={styles.chartBarValue}>{percentage.toFixed(1)}%</span>
                  </div>
                  <div style={styles.chartBarContainer}>
                    <div
                      style={{
                        ...styles.chartBarFill,
                        width: `${barWidth}%`,
                        backgroundColor:
                          percentage >= 80
                            ? '#27ae60'
                            : percentage >= 60
                            ? '#3498db'
                            : percentage >= 40
                            ? '#f39c12'
                            : '#e74c3c',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths and Weaknesses */}
      <div style={styles.analysisSection}>
        <div style={styles.analysisGrid}>
          {/* Strengths */}
          <div style={styles.analysisCard}>
            <h3 style={styles.analysisTitle}>
              <span style={styles.strengthIcon}>💪</span> Strengths
            </h3>
            {metrics.strengths.length > 0 ? (
              <div style={styles.analysisList}>
                {metrics.strengths.map((item, index) => (
                  <div key={index} style={styles.analysisItem}>
                    <div style={styles.analysisItemHeader}>
                      <span style={styles.analysisSubject}>{item.subject}</span>
                      <span style={styles.analysisPercentage}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div style={styles.analysisBarContainer}>
                      <div
                        style={{
                          ...styles.analysisBar,
                          width: `${Math.min(item.percentage, 100)}%`,
                          backgroundColor: '#27ae60',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.noAnalysisData}>No strong subjects identified yet</p>
            )}
          </div>

          {/* Areas for Improvement */}
          <div style={styles.analysisCard}>
            <h3 style={styles.analysisTitle}>
              <span style={styles.weaknessIcon}>⚠️</span> Areas for Improvement
            </h3>
            {metrics.areasForImprovement.length > 0 ? (
              <div style={styles.analysisList}>
                {metrics.areasForImprovement.map((item, index) => (
                  <div key={index} style={styles.analysisItem}>
                    <div style={styles.analysisItemHeader}>
                      <span style={styles.analysisSubject}>{item.subject}</span>
                      <span style={styles.analysisPercentage}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div style={styles.analysisBarContainer}>
                      <div
                        style={{
                          ...styles.analysisBar,
                          width: `${Math.min(item.percentage, 100)}%`,
                          backgroundColor: item.percentage < 50 ? '#e74c3c' : '#f39c12',
                        }}
                      />
                    </div>
                    <div style={styles.suggestion}>
                      💡 {item.percentage < 50
                        ? `Focus on improving ${item.subject}. Consider extra practice or seeking help.`
                        : `You can do better in ${item.subject}. Keep practicing to reach 80%+.`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.noAnalysisData}>Great job! No areas for improvement identified</p>
            )}
          </div>
        </div>
      </div>

      {/* Subject-wise Performance */}
      {Object.keys(metrics.subjectPerformance).length > 0 && (
        <div style={styles.subjectSection}>
          <h3 style={styles.sectionTitle}>Subject-wise Performance</h3>
          <div style={styles.subjectGrid}>
            {Object.entries(metrics.subjectPerformance).map(([subject, data]) => {
              const percentage = (data.total / data.max) * 100;
              return (
                <div key={subject} style={styles.subjectCard}>
                  <h4 style={styles.subjectName}>{subject}</h4>
                  <div style={styles.subjectStats}>
                    <div style={styles.subjectStat}>
                      <span>Average:</span>
                      <strong>{percentage.toFixed(1)}%</strong>
                    </div>
                    <div style={styles.subjectStat}>
                      <span>Tests:</span>
                      <strong>{data.count}</strong>
                    </div>
                  </div>
                  <div style={styles.subjectBarContainer}>
                    <div
                      style={{
                        ...styles.subjectBar,
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor:
                          percentage >= 80
                            ? '#27ae60'
                            : percentage >= 60
                            ? '#3498db'
                            : percentage >= 40
                            ? '#f39c12'
                            : '#e74c3c',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    marginBottom: '30px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  metricCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  metricIcon: {
    fontSize: '40px',
  },
  metricInfo: {
    flex: 1,
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginTop: '5px',
  },
  chartSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    marginTop: 0,
    marginBottom: '20px',
    color: '#2c3e50',
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  chartBar: {
    marginBottom: '10px',
  },
  chartBarLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    fontSize: '14px',
    color: '#555',
  },
  chartBarValue: {
    fontWeight: '600',
  },
  chartBarContainer: {
    height: '30px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  subjectSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  subjectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  subjectCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  subjectName: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
    color: '#2c3e50',
  },
  subjectStats: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  subjectStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '14px',
    color: '#555',
  },
  subjectBarContainer: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  subjectBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  analysisSection: {
    marginBottom: '30px',
  },
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  analysisCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  analysisTitle: {
    fontSize: '20px',
    marginTop: 0,
    marginBottom: '20px',
    color: '#2c3e50',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  strengthIcon: {
    fontSize: '24px',
  },
  weaknessIcon: {
    fontSize: '24px',
  },
  analysisList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  analysisItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  },
  analysisItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  analysisSubject: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  analysisPercentage: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  analysisBarContainer: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  analysisBar: {
    height: '100%',
    transition: 'width 0.3s',
  },
  suggestion: {
    fontSize: '13px',
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: '8px',
  },
  noAnalysisData: {
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
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

export default StudentPerformance;
