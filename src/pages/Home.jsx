import React, { useState, useEffect } from 'react';

const Home = () => {
  // Setup items with prices
  const [items, setItems] = useState({
    chai: { name: 'Chai', price: 12, count: 0 },
    ca: { name: 'Choti Advance', price: 15, count: 0 },
    cc: { name: 'Classic Connect', price: 20, count: 0 },
    coffee: { name: 'Coffee', price: 20, count: 0 },
  });

  const [total, setTotal] = useState(0);

  // Update total whenever items change
  useEffect(() => {
    let newTotal = 0;
    Object.values(items).forEach(item => {
      newTotal += item.price * item.count;
    });
    setTotal(newTotal);
  }, [items]);

  const handleAdd = (key) => {
    setItems(prev => ({
      ...prev,
      [key]: { ...prev[key], count: prev[key].count + 1 }
    }));
  };

  const handleCheckout = () => {
    if (total === 0) return;
    
    // Update Today's Sales in local storage
    const currentSales = Number(localStorage.getItem('todaySales')) || 0;
    localStorage.setItem('todaySales', currentSales + total);

    // Update Monthly Sales in local storage
    const currentMonthlySales = Number(localStorage.getItem('monthlySales')) || 0;
    localStorage.setItem('monthlySales', currentMonthlySales + total);

    // Reset counts
    setItems(prev => {
      const resetItems = { ...prev };
      Object.keys(resetItems).forEach(key => resetItems[key].count = 0);
      return resetItems;
    });
    
    alert(`₹${total} Sale Added Successfully!`);
  };

  return (
    <div className='p-4 h-full'>
      <div className='flex justify-between items-end mb-4'>
        <h2 className='text-stone-500 font-bold uppercase text-sm'>Quick Add</h2>
        <div className='text-right'>
          <p className='text-xs text-stone-500 font-bold uppercase'>Current Bill</p>
          <p className='text-2xl font-bold text-orange-600'>₹{total}</p>
        </div>
      </div>
      
      <div className='flex flex-col gap-3 mb-6'>
        {Object.entries(items).map(([key, item]) => (
          <div key={key} className='flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-stone-200'>
            <button 
              className='bg-orange-600 text-white text-lg font-bold h-14 flex-1 rounded-xl mr-4 transition active:scale-95 shadow-sm text-left px-4 flex justify-between items-center' 
              onClick={() => handleAdd(key)}
            >
              <span>{item.name}</span>
              <span className='text-orange-200 text-sm font-medium'>₹{item.price}</span>
            </button>
            <div className='w-12 text-center'>
              <p className='text-2xl font-bold text-stone-800'>{item.count}</p>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <button 
          onClick={handleCheckout}
          className='w-full bg-stone-800 text-white font-bold text-xl h-14 rounded-xl shadow-lg transition active:scale-95'
        >
          Complete Sale (₹{total})
        </button>
      )}
    </div>
  )
}

export default Home;