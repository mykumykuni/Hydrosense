import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/Global.css';
import './styles/Auth.css';
import Login from './pages/Login';
import SignUp from './pages/SignUp'; // Ensure this is imported
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* ADD THIS ROUTE BELOW */}
        <Route path="/signup" element={<SignUp />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;