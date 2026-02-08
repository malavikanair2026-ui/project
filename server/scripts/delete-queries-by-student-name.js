/**
 * One-time script: delete all student queries where the student's name is "student".
 * Run from project root: node server/scripts/delete-queries-by-student-name.js
 * Requires MONGO_URI (e.g. in server/.env).
 */
const path = require('path');
const dotenv = require('dotenv');

// Load env from server folder
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Query = require('../models/Query');
const Student = require('../models/Student');

const STUDENT_NAME = 'student';

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Set it in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected.');

  const students = await Student.find({ name: STUDENT_NAME }).select('_id name');
  const studentIds = students.map((s) => s._id);

  if (studentIds.length === 0) {
    console.log(`No students found with name "${STUDENT_NAME}". Nothing to delete.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const result = await Query.deleteMany({ student: { $in: studentIds } });
  console.log(
    `Deleted ${result.deletedCount} query/queries for ${studentIds.length} student(s) named "${STUDENT_NAME}".`
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
