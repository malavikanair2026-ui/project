import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ToastContainer';
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
import GradingSchema from './pages/admin/GradingSchema';
import TeacherLayout from './components/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherStudents from './pages/teacher/TeacherStudents';
import MarksEntry from './pages/teacher/MarksEntry';
import EditMarks from './pages/teacher/EditMarks';
import TeacherPerformance from './pages/teacher/TeacherPerformance';
import TeacherAnalytics from './pages/teacher/TeacherAnalytics';
import TeacherFeedback from './pages/teacher/TeacherFeedback';
import TeacherQueries from './pages/teacher/TeacherQueries';
import TeacherNotifications from './pages/teacher/TeacherNotifications';
import TeacherProfile from './pages/teacher/TeacherProfile';
import StudentLayout from './components/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentResults from './pages/student/StudentResults';
import StudentPerformance from './pages/student/StudentPerformance';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentQueries from './pages/student/StudentQueries';
import StudentFeedback from './pages/student/StudentFeedback';
import StudentProfile from './pages/student/StudentProfile';
import PrincipalLayout from './components/PrincipalLayout';
import PrincipalDashboard from './pages/principal/PrincipalDashboard';
import PrincipalStudents from './pages/principal/PrincipalStudents';
import PrincipalStudentDetail from './pages/principal/PrincipalStudentDetail';
import PrincipalResults from './pages/principal/PrincipalResults';
import PrincipalAnalytics from './pages/principal/PrincipalAnalytics';
import PrincipalProfile from './pages/principal/PrincipalProfile';
import StaffLayout from './components/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffStudents from './pages/staff/StaffStudents';
import StaffMarksEntry from './pages/staff/StaffMarksEntry';
import StaffResults from './pages/staff/StaffResults';
import StaffProfile from './pages/staff/StaffProfile';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
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
        <Route
          path="/admin/grading-schema"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <GradingSchema />
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
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherStudents />
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
        <Route
          path="/teacher/edit-marks"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <EditMarks />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/performance"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherPerformance />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/analytics"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherAnalytics />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/feedback"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherFeedback />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/queries"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherQueries />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/notifications"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherNotifications />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherLayout>
                <TeacherProfile />
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
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentLayout>
                <StudentNotifications />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/queries"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentLayout>
                <StudentQueries />
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
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentLayout>
                <StudentProfile />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        {/* Principal Routes */}
        <Route
          path="/principal/dashboard"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin']}>
              <PrincipalLayout>
                <PrincipalDashboard />
              </PrincipalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/principal/students"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin']}>
              <PrincipalLayout>
                <PrincipalStudents />
              </PrincipalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/principal/student/:studentId"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin']}>
              <PrincipalLayout>
                <PrincipalStudentDetail />
              </PrincipalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/principal/results"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin']}>
              <PrincipalLayout>
                <PrincipalResults />
              </PrincipalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/principal/analytics"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin']}>
              <PrincipalLayout>
                <PrincipalAnalytics />
              </PrincipalLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/principal/profile"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin']}>
              <PrincipalLayout>
                <PrincipalProfile />
              </PrincipalLayout>
            </ProtectedRoute>
          }
        />
        {/* Staff Routes */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffLayout>
                <StaffDashboard />
              </StaffLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/students"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffLayout>
                <StaffStudents />
              </StaffLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/marks"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffLayout>
                <StaffMarksEntry />
              </StaffLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/results"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffLayout>
                <StaffResults />
              </StaffLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/profile"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffLayout>
                <StaffProfile />
              </StaffLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
