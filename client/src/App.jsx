// client/src/App.jsx - REVISED
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import { getCurrentUser } from './services/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const nav = useNavigate();

  // 1. Initial Load: ONLY retrieve the user from storage once. 
  // DO NOT force navigation here.
  useEffect(() => {
    setUser(getCurrentUser());
    // Note: Removed all 'nav()' calls from here.
  }, []); // Empty dependency array ensures it runs only once.

  // 2. Auth Change Handler: STILL handles navigation after login/logout
  function handleAuthChange(u) {
    setUser(u);
    if (u) {
      // User logged in, navigate to home
      nav('/');
    } else {
      // User logged out, navigate to login
      nav('/login');
    }
  }

  // 3. Conditional Dashboard Component
  const Dashboard = user 
    ? (user.role === 'doctor' ? DoctorDashboard : PatientDashboard) 
    : Login;
    
  const dashboardElement = user 
    ? <Dashboard user={user} /> 
    : <Login onAuthChange={handleAuthChange} />;


  return (
    <div className="app-root">
      {/* Header is always visible */}
      <Header user={user} onAuthChange={handleAuthChange} />
      <main className="container">
        <Routes>
          {/* Main Route: Conditionally renders the correct dashboard or the login screen. 
              The initial state of 'user' (null) is handled naturally here. */}
          <Route 
            path="/" 
            element={dashboardElement} 
          />
          
          {/* Public Routes: */}
          <Route path="/login" element={<Login onAuthChange={handleAuthChange} />} />
          <Route path="/signup" element={<Signup onAuthChange={handleAuthChange} />} />
          <Route path="/forgot" element={<ForgotPassword />} />
        </Routes>
      </main>
    </div>
  );
}