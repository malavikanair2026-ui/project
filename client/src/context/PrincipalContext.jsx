import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { classesAPI, studentsAPI } from '../services/api';

const PrincipalContext = createContext();

export const usePrincipal = () => {
  const context = useContext(PrincipalContext);
  if (!context) {
    throw new Error('usePrincipal must be used within a PrincipalProvider');
  }
  return context;
};

// Same source as admin Class Management: semesters from classesAPI (classes.semesters)
// Same source as admin Student Management: sections from students (student.section)
export const PrincipalProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll(),
        studentsAPI.getAll(),
      ]);
      const classesData = Array.isArray(classesRes.data)
        ? classesRes.data
        : classesRes.data?.data || classesRes.data || [];
      const studentsData = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data?.data || studentsRes.data || [];
      setClasses(classesData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch principal context data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Same derivation as Class Management: semesters from classes
  const uniqueSemesters = useMemo(() => {
    return [...new Set(
      classes.flatMap((c) => (c.semesters || []).map((s) => s.semester_name).filter(Boolean))
    )].filter(Boolean).sort();
  }, [classes]);

  // Same derivation as Student Management: sections from students
  const uniqueSections = useMemo(() => {
    return [...new Set(students.map((s) => s.section).filter(Boolean))].sort();
  }, [students]);

  const value = {
    classes,
    students,
    loading,
    uniqueSemesters,
    uniqueSections,
    selectedSemester,
    selectedSection,
    setSelectedSemester,
    setSelectedSection,
    refreshData: fetchData,
  };

  return (
    <PrincipalContext.Provider value={value}>
      {children}
    </PrincipalContext.Provider>
  );
};
