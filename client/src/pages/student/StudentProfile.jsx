import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, authAPI } from '../../services/api';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentProfile = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const studentRes = await studentsAPI.getByUserId(user._id);
      setStudent(studentRes.data);

      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile({ name: formData.name });
      const updatedUser = response.data;
      setUser(updatedUser);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      showToast('All password fields are required', 'error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword(formData.currentPassword, formData.newPassword);
      showToast('Password changed successfully', 'success');
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Failed to change password:', error);
      showToast(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !student) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2 style={styles.title}>My Profile</h2>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'profile' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'password' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
          {/* Student Information */}
          {student && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Student Information</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Student ID</div>
                  <div style={styles.infoValue}>{student.student_id}</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Name</div>
                  <div style={styles.infoValue}>{student.name}</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Class</div>
                  <div style={styles.infoValue}>{student.class?.class_name || student.class || 'N/A'}</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Section</div>
                  <div style={styles.infoValue}>{student.section || 'N/A'}</div>
                </div>
                {student.dob && (
                  <div style={styles.infoItem}>
                    <div style={styles.infoLabel}>Date of Birth</div>
                    <div style={styles.infoValue}>
                      {new Date(student.dob).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Information */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Account Information</h3>
            <form onSubmit={handleUpdateProfile}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled
                />
                <small style={styles.helpText}>Email cannot be changed</small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <input
                  type="text"
                  value={user?.role || 'student'}
                  style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
                  disabled
                />
              </div>

              <div style={styles.formActions}>
                <button
                  type="submit"
                  disabled={loading}
                  style={styles.submitButton}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                style={styles.input}
                required
                minLength={6}
              />
              <small style={styles.helpText}>
                Password must be at least 6 characters
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={styles.input}
                required
                minLength={6}
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                disabled={loading}
                style={styles.submitButton}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
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
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#27ae60',
    borderBottomColor: '#27ae60',
  },
  card: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  cardTitle: {
    fontSize: '20px',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  infoItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '5px',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#2c3e50',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2c3e50',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  helpText: {
    display: 'block',
    marginTop: '5px',
    fontSize: '12px',
    color: '#7f8c8d',
  },
  formActions: {
    marginTop: '30px',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default StudentProfile;
