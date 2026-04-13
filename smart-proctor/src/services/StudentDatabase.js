/**
 * Student Database Service
 * Contains student records with roll numbers and reference face images
 */

// Image paths - using process.env.PUBLIC_URL for deployment compatibility
const getImagePath = (filename) => {
  return `${process.env.PUBLIC_URL || ''}/img_data/${filename}`;
};

const STUDENTS_DATABASE = [
  {
    rollNo: '25MCS1012',
    name: 'SK INJAMAM JAMAN',
    email: 'injamam@student.edu',
    photo: getImagePath('IMG1.jpg'),
    enrollmentDate: '2025-01-15'
  },
  {
    rollNo: '25MCS1021',
    name: 'PARTH ANANTRAO GAWANDE',
    email: 'parth@student.edu',
    photo: getImagePath('IMG2.jpg'),
    enrollmentDate: '2025-01-15'
  },
  {
    rollNo: '25MCS1005',
    name: 'SONAL AGNIHOTRI',
    email: 'sonal@student.edu',
    photo: getImagePath('IMG3.jpg'),
    enrollmentDate: '2025-01-15'
  }
];

/**
 * Validate if roll number exists in database
 */
export const validateRollNo = (rollNo) => {
  return STUDENTS_DATABASE.find(s => s.rollNo === rollNo);
};

/**
 * Get student by roll number
 */
export const getStudentByRollNo = (rollNo) => {
  return STUDENTS_DATABASE.find(s => s.rollNo === rollNo);
};

/**
 * Get all students
 */
export const getAllStudents = () => {
  return STUDENTS_DATABASE;
};

/**
 * Get student reference face image
 */
export const getStudentPhoto = (rollNo) => {
  const student = validateRollNo(rollNo);
  return student ? student.photo : null;
};

export default {
  validateRollNo,
  getStudentByRollNo,
  getAllStudents,
  getStudentPhoto
};
