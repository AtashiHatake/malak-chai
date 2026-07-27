import React from 'react'
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Khata from './pages/Khata';
import Navbar from './components/Navbar';

const App = () => {
  return (
    // max-w-md keeps it phone-sized. pb-20 leaves room for the fixed navbar.
    <div className='bg-stone-100 min-h-screen max-w-md mx-auto relative shadow-2xl font-sans pb-20'>
      
      {/* Top Header */}
      <header className='bg-orange-600 text-white p-4 sticky top-0 z-10 shadow-md'>
        <h1 className='text-xl font-bold'>Malak Chai</h1>
      </header>

      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/khata" element={<Khata />} />
      </Routes>
      
      <Navbar />
    </div>
  )
}

export default App;