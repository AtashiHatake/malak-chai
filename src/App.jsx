import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Khata from './pages/Khata';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard'; // We will create this next

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  // Logout Function
  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!isAuthenticated) {
    // Pass both auth state and role up from the Login component
    return <Login setAuth={(auth, role) => {
      setIsAuthenticated(auth);
      setUserRole(role);
    }} />;
  }

  return (
    <div className='bg-stone-100 min-h-screen max-w-md mx-auto relative shadow-2xl font-sans pb-20'>
      
      {/* Top Header with Logout */}
      <header className='bg-orange-600 text-white p-4 sticky top-0 z-10 shadow-md flex justify-between items-center'>
        <h1 className='text-xl font-bold'>Malak Chai {userRole === 'ADMIN' ? '(Admin)' : ''}</h1>
        <button 
          onClick={handleLogout} 
          className='bg-orange-700 hover:bg-orange-800 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition'
        >
          Logout
        </button>
      </header>

      <Routes>
        {/* Route based on Role */}
        {userRole === 'ADMIN' ? (
          <Route path="/" element={<AdminDashboard />} />
        ) : (
          <Route path="/" element={<Home />} />
        )}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/khata" element={<Khata />} />
      </Routes>
      
      <Navbar />
    </div>
  )
}

export default App;