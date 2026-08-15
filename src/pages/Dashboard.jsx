import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({ total_revenue: 0, total_cost: 0, total_profit: 0, total_transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('today'); 
  
  const role = localStorage.getItem('role');

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    fetch(`/api/admin?filter=${timeFilter}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [timeFilter]); 

  if (loading) return <div className='p-4 text-center text-stone-500'>Loading Analytics...</div>;

  return (
    <div className='p-4 h-full pb-24'>
      <h2 className='text-stone-500 font-bold uppercase mb-4 text-sm'>
        {role === 'ADMIN' ? 'Financial Analytics' : 'Shop Register Check'}
      </h2>

      
      <div className='bg-white rounded-xl shadow-sm border border-stone-200 p-2 mb-6 flex overflow-x-auto gap-2 no-scrollbar'>
         {['today', 'weekly', 'monthly', 'yearly', 'all'].map(f => (
           <button 
             key={f}
             onClick={() => setTimeFilter(f)}
             className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition ${timeFilter === f ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-600'}`}
           >
             {f}
           </button>
         ))}
      </div>
      
      <div className='bg-orange-600 text-white p-6 rounded-2xl shadow-md mb-6'>
        <p className='text-orange-200 font-semibold uppercase text-xs mb-1'>Total Cash Revenue</p>
        <h3 className='text-4xl font-bold'>₹{Number(metrics.total_revenue).toFixed(2)}</h3>
        <p className='text-xs text-orange-200 mt-2'>{metrics.total_transactions} sales logged</p>
      </div>

      {role === 'ADMIN' && (
        <>
          <div className='bg-emerald-600 text-white p-6 rounded-2xl shadow-md mb-6'>
            <p className='text-emerald-100 font-semibold uppercase text-xs mb-1'>Net Profit Realized</p>
            <h3 className='text-4xl font-bold'>₹{Number(metrics.total_profit).toFixed(2)}</h3>
          </div>

          <div className='grid grid-cols-2 gap-4 mb-6'>
            <div className='bg-white p-4 rounded-xl shadow-sm border border-stone-200'>
              <p className='text-stone-500 text-xs font-bold uppercase'>Revenue</p>
              <p className='text-xl font-bold text-stone-800'>₹{Number(metrics.total_revenue).toFixed(2)}</p>
            </div>
            <div className='bg-white p-4 rounded-xl shadow-sm border border-stone-200'>
              <p className='text-stone-500 text-xs font-bold uppercase'>Wholesale Cost</p>
              <p className='text-xl font-bold text-red-500'>₹{Number(metrics.total_cost).toFixed(2)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;