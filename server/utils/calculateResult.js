// Calculate grade based on percentage
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
};

// Calculate SGPA (Simple Grade Point Average)
const calculateSGPA = (grade) => {
  const gradePoints = {
    'A+': 10,
    'A': 9,
    'B+': 8,
    'B': 7,
    'C+': 6,
    'C': 5,
    'D': 4,
    'F': 0,
  };
  return gradePoints[grade] || 0;
};

// Calculate percentage
const calculatePercentage = (totalMarks, maxMarks) => {
  if (maxMarks === 0) return 0;
  return ((totalMarks / maxMarks) * 100).toFixed(2);
};

module.exports = {
  calculateGrade,
  calculateSGPA,
  calculatePercentage,
};
