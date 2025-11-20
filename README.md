# QR Code Based Student Attendance System

A modern, web-based attendance management system that uses QR codes for seamless student attendance tracking. Teachers can generate time-bound QR codes, and students can scan them to mark their attendance automatically.

## 🚀 Features

### For Teachers
- **QR Code Generation**: Create unique, time-bound QR codes for attendance
- **Real-time Dashboard**: View attendance statistics and recent activity
- **Attendance Management**: View, filter, and delete attendance records
- **Student Management**: View all registered students
- **Export Capabilities**: Export attendance data for reporting

### For Students
- **QR Code Scanning**: Scan QR codes to mark attendance
- **Attendance History**: View personal attendance records and statistics
- **Profile Management**: Update personal information and change password
- **Real-time Status**: See immediate feedback on attendance marking

### System Features
- **Time-bound Validation**: QR codes expire after a configurable time (default: 10 minutes)
- **Duplicate Prevention**: Students can only mark attendance once per QR code
- **Late Detection**: Automatically marks students as late if they scan after 5 minutes
- **Secure Authentication**: JWT-based authentication with role-based access
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful, intuitive interface with real-time notifications

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **qrcode** - QR code generation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

### Frontend
- **React.js** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React QR Reader** - QR code scanning
- **QRCode.react** - QR code display
- **React Toastify** - Notifications
- **React Icons** - Icon library
- **Bootstrap** - CSS framework
- **Chart.js** - Data visualization

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd qr-attendance-system
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Create a `config.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/qr-attendance
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

### 5. Run the Application

#### Development Mode (Both Frontend and Backend)
```bash
npm run dev
```

#### Production Mode
```bash
# Build the frontend
npm run build

# Start the server
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📱 Usage Guide

### For Teachers

1. **Registration/Login**
   - Register as a teacher with your email and password
   - Login to access the teacher dashboard

2. **Generate QR Code**
   - Navigate to "Generate QR" section
   - Fill in description, location, and course details
   - Set validity time (default: 10 minutes)
   - Click "Generate QR Code"
   - Display the QR code to students

3. **View Attendance**
   - Go to "View Attendance" section
   - Select date to view attendance records
   - View statistics and individual records
   - Delete incorrect entries if needed

### For Students

1. **Registration/Login**
   - Register as a student with your details
   - Include student ID, department, and year
   - Login to access the student dashboard

2. **Mark Attendance**
   - Navigate to "Scan QR" section
   - Click "Start Scanning"
   - Point camera at the QR code displayed by teacher
   - Wait for confirmation of attendance marking

3. **View History**
   - Go to "My Attendance" section
   - View your attendance history and statistics
   - Filter by date range

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/change-password` - Change password

### QR Code Management
- `POST /api/qr/generate` - Generate new QR code (Teachers only)
- `GET /api/qr/active` - Get active QR codes (Teachers only)
- `POST /api/qr/validate` - Validate QR code (Students only)
- `GET /api/qr/history` - Get QR code history (Teachers only)

### Attendance Management
- `POST /api/attendance/mark` - Mark attendance (Students only)
- `GET /api/attendance/daily` - Get daily attendance (Teachers only)
- `GET /api/attendance/my-attendance` - Get student's attendance (Students only)
- `DELETE /api/attendance/:id` - Delete attendance record (Teachers only)

## 🏗️ Project Structure

```
qr-attendance-system/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── QRCode.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── qr.js
│   │   └── attendance.js
│   ├── middleware/
│   │   └── auth.js
│   └── index.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   └── common/
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   └── index.js
│   └── public/
├── package.json
├── config.env
└── README.md
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Role-based Access**: Different permissions for teachers and students
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Secure cross-origin requests
- **Helmet Security**: Additional security headers

## 🎨 UI/UX Features

- **Responsive Design**: Works on all device sizes
- **Modern Interface**: Clean, intuitive design
- **Real-time Notifications**: Toast notifications for user feedback
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Deployment

### Heroku Deployment
1. Create a Heroku account
2. Install Heroku CLI
3. Create a new Heroku app
4. Set environment variables in Heroku dashboard
5. Deploy using Git

### Vercel Deployment (Frontend)
1. Connect your GitHub repository to Vercel
2. Configure build settings
3. Set environment variables
4. Deploy automatically

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **Face Recognition**: Integrate face recognition for added security
- **Email Notifications**: Send attendance reports via email
- **Mobile App**: Native mobile applications
- **Analytics Dashboard**: Advanced analytics and reporting
- **Multi-language Support**: Internationalization
- **Offline Support**: Work without internet connection
- **Bulk Operations**: Import/export student lists
- **API Documentation**: Swagger/OpenAPI documentation

---

**Built with ❤️ for modern education** 