import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import StudentManagement from './pages/admin/StudentManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import ClassManagement from './pages/admin/ClassManagement';
import ResultsView from './pages/admin/ResultsView';
import Analytics from './pages/admin/Analytics';
import TeacherLayout from './components/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClasses from './pages/teacher/TeacherClasses';
import MarksEntry from './pages/teacher/MarksEntry';
import StudentLayout from './components/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentResults from './pages/student/StudentResults';
import StudentPerformance from './pages/student/StudentPerformance';
import StudentFeedback from './pages/student/StudentFeedback';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <StudentManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <SubjectManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <ClassManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/results"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <ResultsView />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <Analytics />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherDashboard />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherClasses />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/marks"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <MarksEntry />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentLayout>
                <StudentDashboard />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentLayout>
                <StudentResults />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/performance"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentLayout>
                <StudentPerformance />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/feedback"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentLayout>
                <StudentFeedback />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
