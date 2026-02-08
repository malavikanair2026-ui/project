import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import { queriesAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherQueries = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all | pending | answered
  const [respondingToId, setRespondingToId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user?._id) fetchQueries();
  }, [user?._id]);

  const fetchQueries = async () => {
    if (!user?._id) return;
    try {
      const res = await queriesAPI.getByTeacher(user._id);
      setQueries(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch queries:', error);
      showToast('Failed to load queries', 'error');
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (queryId) => {
    if (!responseText.trim()) {
      showToast('Please enter a response', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await queriesAPI.respond(queryId, responseText.trim());
      showToast('Response sent successfully', 'success');
      setRespondingToId(null);
      setResponseText('');
      fetchQueries();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send response', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (queryId) => {
    if (!window.confirm('Delete this query? This cannot be undone.')) return;
    setDeletingId(queryId);
    try {
      await queriesAPI.delete(queryId);
      showToast('Query deleted', 'success');
      fetchQueries();
    } catch (error) {
      if (error.response?.status === 404) {
        showToast('Query already removed', 'success');
        fetchQueries();
      } else {
        showToast(error.response?.data?.message || 'Failed to delete query', 'error');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredQueries =
    filterStatus === 'all'
      ? queries
      : queries.filter((q) => q.status === filterStatus);

  const pendingCount = queries.filter((q) => q.status === 'pending').length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Student Queries</h2>
        {pendingCount > 0 && (
          <span style={styles.badge}>{pendingCount} pending</span>
        )}
      </div>

      <p style={styles.subtitle}>
        View and respond to queries sent by students. You see queries addressed to you and general queries.
      </p>

      <div style={styles.tabs}>
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          style={{
            ...styles.tab,
            ...(filterStatus === 'all' ? styles.tabActive : {}),
          }}
        >
          All ({queries.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('pending')}
          style={{
            ...styles.tab,
            ...(filterStatus === 'pending' ? styles.tabActive : {}),
          }}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('answered')}
          style={{
            ...styles.tab,
            ...(filterStatus === 'answered' ? styles.tabActive : {}),
          }}
        >
          Answered ({queries.filter((q) => q.status === 'answered').length})
        </button>
      </div>

      <div style={styles.list}>
        {filteredQueries.length === 0 ? (
          <div style={styles.empty}>
            <p>
              {filterStatus === 'all'
                ? 'No student queries yet.'
                : filterStatus === 'pending'
                  ? 'No pending queries.'
                  : 'No answered queries.'}
            </p>
          </div>
        ) : (
          filteredQueries.map((q, index) => (
            <div key={q._id ?? `query-${index}`} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.meta}>
                    <span style={styles.subject}>
                      {q.subject || 'General Query'}
                    </span>
                    <span style={styles.date}>
                      {new Date(q.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={styles.headerRight}>
                  <span
                    style={{
                      ...styles.status,
                      backgroundColor: q.status === 'answered' ? '#27ae60' : '#f39c12',
                    }}
                  >
                    {q.status === 'answered' ? 'Answered' : 'Pending'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(q._id)}
                    disabled={deletingId === q._id}
                    style={styles.deleteBtn}
                    title="Delete query"
                  >
                    {deletingId === q._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
              <div style={styles.queryBody}>
                <p style={styles.queryText}>{q.query}</p>
              </div>
              {q.response && (
                <div style={styles.responseSection}>
                  <strong>Your response:</strong>
                  <p style={styles.responseText}>{q.response}</p>
                </div>
              )}
              {q.status === 'pending' && (
                <div style={styles.respondSection}>
                  {respondingToId === q._id ? (
                    <>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Type your response..."
                        style={styles.textarea}
                        rows={4}
                      />
                      <div style={styles.respondActions}>
                        <button
                          type="button"
                          onClick={() => handleRespond(q._id)}
                          disabled={submitting || !responseText.trim()}
                          style={styles.respondBtn}
                        >
                          {submitting ? 'Sending...' : 'Send Response'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRespondingToId(null);
                            setResponseText('');
                          }}
                          style={styles.cancelBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRespondingToId(q._id)}
                      style={styles.respondBtn}
                    >
                      Respond
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: 0,
  },
  badge: {
    backgroundColor: '#f39c12',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
  },
  subtitle: {
    color: '#7f8c8d',
    marginBottom: '24px',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #dee2e6',
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    color: '#666',
  },
  tabActive: {
    color: '#1f2a44',
    borderBottomColor: '#4aa3ff',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  empty: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    borderLeft: '4px solid #4aa3ff',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  studentName: {
    fontSize: '16px',
    color: '#2c3e50',
  },
  studentId: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  meta: {
    marginTop: '4px',
    fontSize: '13px',
    color: '#7f8c8d',
  },
  subject: {
    marginRight: '12px',
  },
  date: {},
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  status: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  queryBody: {
    marginBottom: '12px',
  },
  queryText: {
    margin: 0,
    color: '#555',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  responseSection: {
    padding: '12px',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    marginTop: '12px',
    borderLeft: '4px solid #27ae60',
  },
  responseText: {
    margin: '8px 0 0 0',
    color: '#2c3e50',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  respondSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #eee',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    marginBottom: '10px',
  },
  respondActions: {
    display: 'flex',
    gap: '10px',
  },
  respondBtn: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default TeacherQueries;
