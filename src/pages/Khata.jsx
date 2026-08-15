import React, { useState, useEffect } from 'react';

const Khata = () => {
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  
  
  const [activeTabCustomer, setActiveTabCustomer] = useState(null);
  const [cart, setCart] = useState({});

  const fetchKhataAndInventory = async () => {
    const token = localStorage.getItem('token');
    
    // Fetch Khata Customers
    const resK = await fetch('/api/khata', { headers: { 'Authorization': `Bearer ${token}` } });
    if (resK.ok) setCustomers(await resK.json());

    
    const resI = await fetch('/api/inventory', { headers: { 'Authorization': `Bearer ${token}` } });
    if (resI.ok) {
      const invData = await resI.json();
      setInventory(invData);
      const initialCart = {};
      invData.forEach(p => initialCart[p.id] = { ...p, qty: 0 });
      setCart(initialCart);
    }
  };

  useEffect(() => { fetchKhataAndInventory(); }, []);

  
  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    const token = localStorage.getItem('token');
    await fetch('/api/khata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'ADD_CUSTOMER', name: newCustomerName })
    });
    setNewCustomerName('');
    setShowAddForm(false);
    fetchKhataAndInventory();
  };

  
  const updateQty = (id, op) => {
    setCart(prev => {
      const current = prev[id]?.qty || 0;
      if (op === 'minus' && current === 0) return prev;
      return { ...prev, [id]: { ...prev[id], qty: op === 'plus' ? current + 1 : current - 1 } };
    });
  };

  
  const handleAddCreditToCustomer = async () => {
    const itemsSold = Object.values(cart).filter(i => i.qty > 0);
    if (itemsSold.length === 0) return alert("Select at least 1 item");

    const token = localStorage.getItem('token');
    const res = await fetch('/api/khata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'ADD_CREDIT_ITEMS', id: activeTabCustomer.id, items: itemsSold })
    });

    if (res.ok) {
      alert("Items added to credit tab & stock deducted!");
      setActiveTabCustomer(null); 
      
      
      setCart(prev => {
        const reset = { ...prev };
        Object.keys(reset).forEach(k => reset[k].qty = 0);
        return reset;
      });
      
      fetchKhataAndInventory();
    }
  };

  
  const handleSettlePayment = async (customerId) => {
    const amountStr = window.prompt("Enter amount customer is paying to settle debt (₹):");
    if (!amountStr || isNaN(amountStr)) return;

    const token = localStorage.getItem('token');
    await fetch('/api/khata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'SETTLE_PAYMENT', id: customerId, payment_amount: Number(amountStr) })
    });
    fetchKhataAndInventory();
  };

  
  const handleDeleteCustomer = async (id) => {
    if (window.confirm("Delete this customer account completely?")) {
      const token = localStorage.getItem('token');
      await fetch('/api/khata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'DELETE_CUSTOMER', id })
      });
      fetchKhataAndInventory();
    }
  };

  return (
    <div className='p-4 h-full pb-24'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-stone-500 font-bold uppercase text-sm'>Itemized Cloud Khata</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className='bg-stone-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition'
        >
          {showAddForm ? 'Cancel' : '+ New Customer'}
        </button>
      </div>

      {showAddForm && (
        <div className='bg-white p-4 rounded-2xl shadow-sm border border-stone-200 mb-4 flex gap-2'>
          <input 
            type="text" 
            placeholder="Customer Name..." 
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            className='flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500'
            autoFocus
          />
          <button onClick={handleAddCustomer} className='bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm active:scale-95'>Save</button>
        </div>
      )}

     
      {activeTabCustomer && (
        <div className='fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm'>
          <div className='bg-white w-full max-w-md rounded-2xl p-5 max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl'>
            <div className='flex justify-between items-center mb-5'>
              <h3 className='font-bold text-stone-800 text-lg'>Credit for: <span className="text-orange-600">{activeTabCustomer.name}</span></h3>
              <button onClick={() => setActiveTabCustomer(null)} className='bg-stone-100 text-stone-500 hover:bg-stone-200 h-8 w-8 rounded-full font-bold flex items-center justify-center transition'>✕</button>
            </div>

            <div className='flex flex-col gap-3 mb-5'>
              {inventory.length === 0 ? (
                <p className='text-center text-sm text-stone-400 py-4'>No inventory available.</p>
              ) : (
                inventory.map(item => (
                  <div key={item.id} className='flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-200'>
                    <div>
                      <p className='font-bold text-stone-800 text-sm'>{item.name}</p>
                      <p className='text-xs text-orange-600 font-semibold mt-0.5'>₹{item.sell_price} | Stock: {item.stock}</p>
                    </div>
                    <div className='flex items-center gap-3 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-sm'>
                      <button onClick={() => updateQty(item.id, 'minus')} className='font-bold text-stone-600 text-xl active:scale-90 w-6'>-</button>
                      <span className='font-bold text-sm w-4 text-center'>{cart[item.id]?.qty || 0}</span>
                      <button onClick={() => updateQty(item.id, 'plus')} className='font-bold text-orange-600 text-xl active:scale-90 w-6'>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button onClick={handleAddCreditToCustomer} className='w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition shadow-md'>
              Confirm & Deduct Stock
            </button>
          </div>
        </div>
      )}

      <div className='flex flex-col gap-4'>
        {customers.map(c => (
          <div key={c.id} className='bg-white p-4 rounded-2xl shadow-sm border border-stone-200'>
            <div className='flex justify-between items-start mb-3'>
              <div>
                <h3 className='font-bold text-stone-800 text-lg'>{c.name}</h3>
                <p className='text-xs text-stone-400'>Last Tab: {new Date(c.updated_at).toLocaleDateString()}</p>
              </div>
              <div className='text-right'>
                <p className='text-xs text-stone-400 uppercase font-bold'>Total Debt</p>
                <p className='text-2xl font-bold text-red-500'>₹{Number(c.balance).toFixed(2)}</p>
              </div>
            </div>

           
            {c.items && c.items.length > 0 && (
              <div className='bg-stone-50 p-2.5 rounded-xl border border-stone-100 mb-3 text-xs flex flex-col gap-1'>
                <p className='font-bold text-stone-400 uppercase text-[10px]'>Recent Items Taken on Credit:</p>
                {c.items.map(i => (
                  <div key={i.id} className='flex justify-between text-stone-600'>
                    <span>{i.quantity}x {i.product_name}</span>
                    <span className='font-semibold'>₹{i.total}</span>
                  </div>
                ))}
              </div>
            )}

            <div className='flex gap-2 border-t border-stone-100 pt-3'>
              <button onClick={() => setActiveTabCustomer(c)} className='flex-1 bg-orange-50 text-orange-600 font-bold py-2 rounded-lg text-xs active:scale-95'>+ Add Items</button>
              <button onClick={() => handleSettlePayment(c.id)} className='flex-1 bg-emerald-50 text-emerald-700 font-bold py-2 rounded-lg text-xs active:scale-95'>✓ Settle Cash</button>
              <button onClick={() => handleDeleteCustomer(c.id)} className='bg-stone-100 text-stone-500 px-3 py-2 rounded-lg text-xs active:scale-95'>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Khata;