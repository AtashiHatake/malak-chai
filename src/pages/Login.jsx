import React, { useState } from 'react';

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token); 
      localStorage.setItem('role', data.role);
      // Update this line:
      setAuth(true, data.role); 
    } else {
      alert("Invalid login");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-stone-100 px-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-orange-600 mb-6 text-center">Malak Chai POS</h1>
        <input className="w-full p-3 mb-4 border border-stone-300 rounded-lg" type="text" placeholder="Username (e.g. shop1)" onChange={e => setUsername(e.target.value)} />
        <input className="w-full p-3 mb-6 border border-stone-300 rounded-lg" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-stone-800 text-white font-bold py-3 rounded-xl active:scale-95 transition">Login for the Day</button>
      </form>
    </div>
  );
};

export default Login;