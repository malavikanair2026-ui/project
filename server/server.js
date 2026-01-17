const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not defined in .env file!');
  console.error('Please add JWT_SECRET=your_secret_key_here to your server/.env file');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not defined in .env file!');
  console.error('Please add MONGO_URI=your_mongodb_connection_string to your server/.env file');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Student Result Analyzer API' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/marks', require('./routes/marksRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/grading-schemas', require('./routes/gradingSchemaRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

