import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserProvider from './context/userContext';
import SignUpForm from './pages/Auth/SignUpForm';
import Login from './pages/Auth/loginForm';
import Dashboard from './pages/Dashboard/Dashboard';
import Home from './pages/Dashboard/Home';
import CreatePoll from './pages/Dashboard/CreatePoll';
import Mypolls from './pages/Dashboard/Mypolls';
import VotedPolls from './pages/Dashboard/VotedPolls';
import Bookmark from './pages/Dashboard/Bookmark';
import Settings from './pages/Dashboard/Settings';
import EditProfile from './pages/Dashboard/EditProfile';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <UserProvider>
        <Routes>
          {/* Auth Routes - Accessible to all */}
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/login" element={<Login />} />

          {/* Public Dashboard Route */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-poll"
            element={
              <ProtectedRoute>
                <CreatePoll />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/my-polls"
            element={
              <ProtectedRoute>
                <Mypolls />
              </ProtectedRoute>
            }
          />

          <Route
            path="/voted-polls"
            element={
              <ProtectedRoute>
                <VotedPolls />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <Bookmark />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 - Not Found Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* Toast Container for notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </UserProvider>
    </Router>
  );
}

export default App;