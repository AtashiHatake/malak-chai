import React, { useState, useEffect } from 'react';

const Khata = () => {
  // State for customers list
  const [customers, setCustomers] = useState([]);
  
  // State for toggling the 'Add Customer' form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  // 1. Load data from Local Storage when the component mounts
  useEffect(() => {
    const savedCustomers = localStorage.getItem('khataData');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
  }, []);

  // 2. Save data to Local Storage whenever 'customers' state changes
  useEffect(() => {
    localStorage.setItem('khataData', JSON.stringify(customers));
  }, [customers]);

  // Function to Add a New Customer
  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;
    
    const newCustomer = {
      id: Date.now(),
      name: newCustomerName,
      balance: 0, // 0 means settled, negative means they owe you
      lastUpdate: 'Just now'
    };
    
    // Add to the top of the list
    setCustomers([newCustomer, ...customers]);
    setNewCustomerName('');
    setShowAddForm(false);
  };

  // Function to update balance (Credit or Settle)
  const handleTransaction = (id, type) => {
    const amountStr = window.prompt(
      type === 'credit' 
        ? "Enter amount they are taking on credit (e.g. 50):" 
        : "Enter amount they are paying you (e.g. 50):"
    );
    
    if (!amountStr || isNaN(amountStr)) return;
    const amount = Number(amountStr);

    setCustomers(prev => prev.map(customer => {
      if (customer.id === id) {
        // If credit, balance goes down (negative). If settle, balance goes up (positive)
        const newBalance = type === 'credit' ? customer.balance - amount : customer.balance + amount;
        
        return { 
          ...customer, 
          balance: newBalance, 
          lastUpdate: new Date().toLocaleDateString('en-GB') // Formats as DD/MM/YYYY
        };
      }
      return customer;
    }));
  };

  // Function to delete a customer
  const handleDelete = (id) => {
    if(window.confirm("Are you sure you want to delete this customer?")) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className='p-4 h-full'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-stone-500 font-bold uppercase text-sm'>Khata (Ledger)</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className='bg-stone-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition'
        >
          {showAddForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Add Customer Form Toggle */}
      {showAddForm && (
        <div className='bg-white p-4 rounded-2xl shadow-sm border border-stone-200 mb-4 flex gap-2'>
          <input 
            type="text" 
            placeholder="Customer Name..." 
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            className='flex-1 border border-stone-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500'
            autoFocus
          />
          <button 
            onClick={handleAddCustomer}
            className='bg-orange-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm active:scale-95 transition'
          >
            Save
          </button>
        </div>
      )}

      {/* Empty State Message */}
      {customers.length === 0 && !showAddForm && (
        <div className='text-center py-10 text-stone-400'>
          <p className='text-4xl mb-2'>📓</p>
          <p>No customers added yet.</p>
        </div>
      )}

      {/* Customers List */}
      <div className='flex flex-col gap-3'>
        {customers.map(customer => (
          <div key={customer.id} className='bg-white p-4 rounded-2xl shadow-sm border border-stone-200'>
            
            <div className='flex justify-between items-center mb-3'>
              <div>
                <h3 className='font-bold text-stone-800 text-lg leading-tight'>{customer.name}</h3>
                <p className='text-xs text-stone-400 mt-0.5'>Last updated: {customer.lastUpdate}</p>
              </div>

              <div className='text-right'>
                <p className={`text-xl font-bold ${customer.balance < 0 ? 'text-red-500' : customer.balance > 0 ? 'text-emerald-600' : 'text-stone-800'}`}>
                  {customer.balance < 0 ? 'Owes ' : customer.balance > 0 ? 'Advance ' : ''}
                  ₹{Math.abs(customer.balance)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2 border-t border-stone-100 pt-3'>
              <button 
                onClick={() => handleTransaction(customer.id, 'credit')}
                className='flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-lg text-sm active:scale-95 transition'
              >
                + Give Credit
              </button>
              <button 
                onClick={() => handleTransaction(customer.id, 'settle')}
                className='flex-1 bg-emerald-50 text-emerald-700 font-bold py-2 rounded-lg text-sm active:scale-95 transition'
              >
                ✓ Settle Cash
              </button>
              <button 
                onClick={() => handleDelete(customer.id)}
                className='bg-stone-100 text-stone-500 px-3 py-2 rounded-lg active:scale-95 transition'
                aria-label="Delete Customer"
              >
                🗑️
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  )
}

export default Khata;