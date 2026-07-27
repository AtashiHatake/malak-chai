import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [todaySales, setTodaySales] = useState(0);
  const [pendingKhata, setPendingKhata] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);

  // Load data from local storage when the page opens
  useEffect(() => {
    // 1. Load Today's Sales
    const savedSales = Number(localStorage.getItem('todaySales')) || 0;
    setTodaySales(savedSales);

    // 2. Load Monthly Sales
    const savedMonthly = Number(localStorage.getItem('monthlySales')) || 0;
    setMonthlySales(savedMonthly);

    // 3. Load Khata Data and calculate the total pending credit
    const savedKhata = localStorage.getItem('khataData');
    if (savedKhata) {
      const customers = JSON.parse(savedKhata);
      
      // Sum up all negative balances (money owed to the shop)
      const totalOwed = customers.reduce((sum, customer) => {
        if (customer.balance < 0) {
          return sum + Math.abs(customer.balance);
        }
        return sum;
      }, 0);
      
      setPendingKhata(totalOwed);
    }
  }, []);

  const clearData = () => {
    localStorage.setItem('todaySales', 0);
    setTodaySales(0);
  };

  return (
    <div className='p-4 h-full'>
      <h2 className='text-stone-500 font-bold uppercase mb-4 text-sm'>Dashboard</h2>
      
      <div className='bg-orange-600 text-white p-6 rounded-2xl shadow-md mb-6'>
        <p className='text-orange-200 font-semibold uppercase text-sm mb-1'>Today's Cash Realized</p>
        <h3 className='text-4xl font-bold'>₹{todaySales}</h3>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='bg-white p-4 rounded-xl shadow-sm border border-stone-200'>
          <p className='text-stone-500 text-xs font-bold uppercase'>Pending Khata</p>
          <p className='text-xl font-bold text-red-500'>₹{pendingKhata}</p>
        </div>
        <div className='bg-white p-4 rounded-xl shadow-sm border border-stone-200'>
          <p className='text-stone-500 text-xs font-bold uppercase'>This Month</p>
          <p className='text-xl font-bold text-stone-800'>₹{monthlySales}</p>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-stone-200 p-4'>
         <h3 className='font-bold text-stone-800 mb-2'>Recent Filters</h3>
         <div className='flex gap-2'>
            <button className='bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm font-bold'>Today</button>
            <button className='bg-stone-100 text-stone-600 px-4 py-2 rounded-lg text-sm font-bold'>Weekly</button>
            <button className='bg-stone-100 text-stone-600 px-4 py-2 rounded-lg text-sm font-bold'>Monthly</button>
         </div>
      </div>

      {/* For MVP demo purposes only - a way to reset the day */}
      <button 
        onClick={clearData}
        className='w-full mt-8 bg-stone-200 text-stone-500 font-bold py-3 rounded-xl'
      >
        Reset Day (Demo)
      </button>
    </div>
  )
}

export default Dashboard;