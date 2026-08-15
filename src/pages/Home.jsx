import React, { useState, useEffect } from 'react';
import { connectToPrinter, printReceipt } from '../printerUtils';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [total, setTotal] = useState(0);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);

  // Pulls data from DB and sets/updates the UI
  const fetchInventory = () => {
    const token = localStorage.getItem('token');
    fetch('/api/inventory', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        // Ensure cart exists for new items, keep qty if they are tapping fast
        setCart(prev => {
          const newCart = { ...prev };
          data.forEach(p => {
            if (!newCart[p.id]) {
              newCart[p.id] = { ...p, qty: 0 };
            } else {
              // Update stock number in cart object so UI matches
              newCart[p.id].stock = p.stock; 
            }
          });
          return newCart;
        });
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    let t = 0;
    Object.values(cart).forEach(item => t += (item.sell_price * item.qty));
    setTotal(t);
  }, [cart]);

  const updateQty = (id, operation) => {
    setCart(prev => {
      const currentQty = prev[id].qty;
      if (operation === 'minus' && currentQty === 0) return prev;
      const newQty = operation === 'plus' ? currentQty + 1 : currentQty - 1;
      return { ...prev, [id]: { ...prev[id], qty: newQty } };
    });
  };

  const handleConnectPrinter = async () => {
    const connected = await connectToPrinter();
    setIsPrinterConnected(connected);
  };

  const handleCheckout = async () => {
    if (total === 0) return;
    const token = localStorage.getItem('token');
    const itemsSold = Object.values(cart).filter(item => item.qty > 0);

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ cart: itemsSold })
    });

    if (res.ok) {
      alert(`₹${total} Sale Logged!`);
      
      // Print the receipt if the printer is connected
      if (isPrinterConnected) {
        await printReceipt({ items: itemsSold, total });
      }

      // 1. Reset all quantities back to zero
      setCart(prev => {
        const reset = { ...prev };
        Object.keys(reset).forEach(k => reset[k].qty = 0);
        return reset;
      });

      // 2. Force an immediate data refresh from the database to reflect new stock
      fetchInventory();
    }
  };

  return (
    <div className='p-4 pb-24 h-full bg-stone-50 min-h-screen'>
      
      {/* Printer Connection Button */}
      <div className="mb-4">
        <button
          onClick={handleConnectPrinter}
          className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            isPrinterConnected
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-stone-800 text-white shadow-md active:scale-95'
          }`}
        >
          {isPrinterConnected ? '🖨️ Printer Connected' : '🖨️ Connect Bluetooth Printer'}
        </button>
      </div>

      <div className='flex justify-between items-end mb-6'>
        <h2 className='text-stone-500 font-bold uppercase text-sm'>Live POS</h2>
        <div className='text-right'>
          <p className='text-xs text-stone-500 font-bold uppercase'>Current Bill</p>
          <p className='text-3xl font-bold text-orange-600'>₹{total}</p>
        </div>
      </div>
      
      <div className='flex flex-col gap-3'>
        {products.map(item => (
          <div key={item.id} className='flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-stone-200'>
            <div className='flex-1'>
              <p className='font-bold text-stone-800 text-lg'>{item.name}</p>
              <p className='text-orange-600 font-medium text-sm'>
                ₹{item.sell_price} <span className="text-stone-400">| Stock: {item.stock}</span>
              </p>
            </div>
            
            <div className='flex items-center gap-4 bg-stone-100 rounded-xl p-1 border border-stone-200'>
              <button onClick={() => updateQty(item.id, 'minus')} className='w-10 h-10 bg-white text-stone-600 rounded-lg shadow-sm font-bold text-xl active:scale-95'>-</button>
              <span className='w-4 text-center font-bold text-lg'>{cart[item.id]?.qty || 0}</span>
              <button onClick={() => updateQty(item.id, 'plus')} className='w-10 h-10 bg-orange-500 text-white rounded-lg shadow-sm font-bold text-xl active:scale-95'>+</button>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <button onClick={handleCheckout} className='fixed bottom-20 left-4 right-4 bg-stone-800 text-white font-bold text-xl h-14 rounded-xl shadow-xl active:scale-95 z-40 max-w-md mx-auto'>
          Complete Sale (₹{total})
        </button>
      )}
    </div>
  );
};

export default Home;