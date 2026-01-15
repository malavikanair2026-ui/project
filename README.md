# Student Result Analyzer

A comprehensive MERN stack application for managing and analyzing student results in an educational institution. This system provides role-based access for administrators, principals, staff, teachers, and students to manage academic records, enter marks, view results, and generate performance analytics.

## 🚀 Features

### Role-Based Access Control
- **Admin**: Full system management (users, students, subjects, classes, results)
- **Principal**: View results, analyze performance, monitor institution-wide statistics
- **Staff**: Enter marks, view final results
- **Teacher**: Manage classes, enter marks, provide feedback
- **Student**: View results, performance analytics, feedback, and notifications

### Key Functionalities
- ✅ User authentication and authorization
- ✅ Student record management
- ✅ Subject and class management
- ✅ Marks entry and calculation
- ✅ Automatic result calculation (percentage, grade, SGPA)
- ✅ Result approval and freezing system
- ✅ Performance analytics and visualizations
- ✅ Teacher-student feedback system
- ✅ Notification system
- ✅ Responsive and modern UI

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd vrnproject
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

**Example MongoDB URI:**
- Local: `mongodb://localhost:27017/student-result-analyzer`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/student-result-analyzer`

Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal and navigate to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the `client` directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or the port shown in terminal)

## 📁 Project Structure

```
vrnproject/
├── server/                 # Backend (Node.js/Express)
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── models/             # Mongoose models
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Subject.js
│   │   ├── Marks.js
│   │   ├── Result.js
│   │   ├── Class.js
│   │   ├── Feedback.js
│   │   └── Notification.js
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── subjectRoutes.js
│   │   ├── marksRoutes.js
│   │   ├── resultRoutes.js
│   │   ├── classRoutes.js
│   │   ├── feedbackRoutes.js
│   │   └── notificationRoutes.js
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── calculateResult.js
│   ├── server.js           # Express app entry point
│   └── .env                # Environment variables
│
├── client/                 # Frontend (React/Vite)
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── TeacherLayout.jsx
│   │   │   ├── StudentLayout.jsx
│   │   │   ├── PrincipalLayout.jsx
│   │   │   ├── StaffLayout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── ToastContainer.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   ├── principal/
│   │   │   └── staff/
│   │   ├── services/
│   │   │   └── api.js      # API service layer
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── .env                # Frontend environment variables
│
└── README.md
```

## 🔑 Default Accounts

After setting up, you can register accounts through the registration page. For demonstration purposes, you can create accounts with different roles:

1. **Admin**: Full access to all features
2. **Principal**: View results and analytics
3. **Staff**: Enter marks and view results
4. **Teacher**: Manage classes and enter marks
5. **Student**: View own results and performance

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout user

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/user/:userId` - Get student by user ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:id` - Get subject by ID
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Marks
- `GET /api/marks/:studentId` - Get marks for student
- `POST /api/marks/:studentId` - Add/update marks

### Results
- `GET /api/results` - Get all results
- `GET /api/results/:studentId` - Get results for student
- `POST /api/results/calculate/:studentId` - Calculate result
- `PUT /api/results/:resultId/status` - Update result status

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class
- `POST /api/classes/:classId/subjects` - Add subject to class
- `PUT /api/classes/:classId` - Update class

### Feedback
- `GET /api/feedback/student/:studentId` - Get feedback for student
- `POST /api/feedback` - Create feedback

### Notifications
- `GET /api/notifications/student/:studentId` - Get notifications for student
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🎨 Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Context API** - State management

## 🧪 Testing

### Manual Testing Steps

1. **User Registration & Login**
   - Register accounts with different roles
   - Test login functionality
   - Verify role-based redirects

2. **Admin Functions**
   - Create students, subjects, classes
   - Manage users
   - View and approve results

3. **Teacher Functions**
   - View assigned classes
   - Enter marks for students
   - Provide feedback

4. **Student Functions**
   - View own results
   - Check performance analytics
   - View feedback and notifications

5. **Principal Functions**
   - View all results
   - Analyze performance
   - Monitor statistics

6. **Staff Functions**
   - Enter marks
   - View results

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check `MONGO_URI` in `.env` file
   - Verify connection string format

2. **JWT Secret Error**
   - Ensure `JWT_SECRET` is set in `.env`
   - Restart server after adding JWT_SECRET

3. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Or stop the process using the port

4. **CORS Errors**
   - Verify frontend URL matches CORS settings
   - Check `VITE_API_URL` in client `.env`

5. **Module Not Found**
   - Run `npm install` in both server and client directories
   - Clear `node_modules` and reinstall if needed

## 📝 Notes

- This is a final year project for demonstration purposes
- Security measures are simplified for ease of demonstration
- For production use, implement additional security features
- Ensure proper error handling and validation in production

## 👨‍💻 Development

### Running in Development Mode

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd client
npm run build
```

The built files will be in `client/dist`

## 📄 License

This project is created for educational purposes.

## 🙏 Acknowledgments

- Built as a final year degree project
- Uses modern web development practices
- Designed for easy demonstration and evaluation

---

**For questions or issues, please refer to the project documentation or contact the development team.**
