import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [inventory, setInventory] = useState([]);
  
  // Add Product Form State
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [branchId, setBranchId] = useState('');

  // Edit Product Form State
  const [editingItem, setEditingItem] = useState(null);

  // Add Branch Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBranchId, setNewBranchId] = useState('');

  // Reset Data State
  const [resetBranch, setResetBranch] = useState('ALL');

  const fetchInventory = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/inventory', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setInventory(data);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle adding new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const selectedBranch = Number(branchId);
    if (!selectedBranch || selectedBranch <= 0) {
      alert('Please select a valid branch (Branch 1 or Branch 2)');
      return;
    }

    const token = localStorage.getItem('token');
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        action: 'ADD_PRODUCT',
        name, 
        buy_price: Number(buyPrice), 
        sell_price: Number(sellPrice), 
        stock: Number(stock), 
        branch_id: selectedBranch 
      })
    });

    if (res.ok) {
      alert('Product added successfully!');
      setName(''); setBuyPrice(''); setSellPrice(''); setStock(''); setBranchId('');
      fetchInventory();
    } else {
      alert('Failed to add product');
    }
  };

  // Handle editing product
  const handleEditSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        action: 'EDIT_PRODUCT',
        id: editingItem.id,
        name: editingItem.name, 
        buy_price: Number(editingItem.buy_price), 
        sell_price: Number(editingItem.sell_price), 
        stock: Number(editingItem.stock), 
        branch_id: Number(editingItem.branch_id) 
      })
    });

    if (res.ok) {
      alert('Product updated successfully!');
      setEditingItem(null);
      fetchInventory();
    } else {
      alert('Failed to update product');
    }
  };

  // Handle deleting product
  const handleDeleteProduct = async (id, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;

    const token = localStorage.getItem('token');
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ action: 'DELETE_PRODUCT', id })
    });

    if (res.ok) {
      fetchInventory();
    } else {
      alert('Failed to delete product');
    }
  };

  // Handle Add Branch User
  const handleAddBranch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'CREATE_BRANCH', // Added this so the API triggers the right block
        username: newUsername,
        password: newPassword,
        branch_id: Number(newBranchId)
      })
    });

    if (res.ok) {
      alert(`Branch operator account created for ${newUsername}!`);
      setNewUsername('');
      setNewPassword('');
      setNewBranchId('');
    } else {
      const err = await res.json();
      alert(`Failed: ${err.error}`);
    }
  };

  // Password-Protected Clear Data Handler
  const handleResetData = async () => {
    const password = window.prompt("⚠️ SECURITY CHECK: Enter Admin Password to confirm resetting sales data:");
    if (!password) return;

    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        action: 'RESET_DATA',
        target_branch: resetBranch,
        admin_password: password
      })
    });

    if (res.ok) {
      alert("Sales data reset successfully!");
    } else {
      const err = await res.json();
      alert(`Reset Failed: ${err.error}`);
    }
  };

  return (
    <div className='p-4 h-full pb-24'>
      <h2 className='text-stone-500 font-bold uppercase mb-4 text-sm'>Admin Control Panel</h2>
      
      {/* Add New Product Form */}
      <div className='bg-white p-4 rounded-2xl shadow-sm border border-stone-200 mb-6'>
        <h3 className='font-bold text-stone-800 mb-3'>Add New Inventory</h3>
        <form onSubmit={handleAddProduct} className='flex flex-col gap-3'>
          <input 
            required 
            type="text" 
            placeholder="Product Name (e.g. Gold Flake)" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className='w-full border border-stone-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-sm' 
          />
          
          <div className='flex gap-2 w-full'>
            <input 
              required 
              type="number" 
              step="0.01" 
              placeholder="Wholesale (₹)" 
              value={buyPrice} 
              onChange={e => setBuyPrice(e.target.value)} 
              className='flex-1 min-w-0 border border-stone-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-sm' 
            />
            <input 
              required 
              type="number" 
              step="0.01" 
              placeholder="MRP (₹)" 
              value={sellPrice} 
              onChange={e => setSellPrice(e.target.value)} 
              className='flex-1 min-w-0 border border-stone-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-sm' 
            />
          </div>
          
          <div className='flex gap-2 w-full'>
            <input 
              required 
              type="number" 
              placeholder="Initial Stock" 
              value={stock} 
              onChange={e => setStock(e.target.value)} 
              className='flex-1 min-w-0 border border-stone-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-sm' 
            />

            <select 
              required 
              value={branchId} 
              onChange={e => setBranchId(e.target.value)} 
              className='flex-1 min-w-0 border border-stone-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-sm bg-white text-stone-700'
            >
              <option value="" disabled>Select Branch...</option>
              <option value="1">Branch 1</option>
              <option value="2">Branch 2</option>
            </select>
          </div>

          <button 
            type="submit" 
            className='bg-stone-800 text-white font-bold py-3 rounded-lg active:scale-95 transition mt-2 text-sm'
          >
            + Save to Database
          </button>
        </form>
      </div>

      {/* Create Branch Operator Account */}
      <div className='bg-white p-4 rounded-2xl shadow-sm border border-stone-200 mb-6'>
        <h3 className='font-bold text-stone-800 mb-3'>Create Branch Account</h3>
        <form onSubmit={handleAddBranch} className='flex flex-col gap-3'>
          <input
            required
            type="text"
            placeholder="Username (e.g. shop2)"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            className='w-full border border-stone-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-sm'
          />
          <div className='flex gap-2 w-full'>
            <input
              required
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className='flex-1 min-w-0 border border-stone-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-sm'
            />
            <input
              required
              type="number"
              placeholder="Branch ID"
              value={newBranchId}
              onChange={e => setNewBranchId(e.target.value)}
              className='flex-1 min-w-0 border border-stone-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-sm'
            />
          </div>
          <button
            type="submit"
            className='bg-orange-600 text-white font-bold py-3 rounded-lg active:scale-95 transition text-sm'
          >
            + Create Branch Login
          </button>
        </form>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className='bg-red-50 p-4 rounded-2xl border border-red-200 mb-6'>
        <h3 className='font-bold text-red-800 mb-2'>Danger Zone: Reset Sales Data</h3>
        <p className='text-xs text-red-600 mb-3'>Clear transactional sales data for testing or fresh starts. Password protected.</p>
        <div className='flex gap-2'>
          <select 
            value={resetBranch} 
            onChange={e => setResetBranch(e.target.value)}
            className='flex-1 border border-red-300 rounded-lg p-2.5 text-sm bg-white text-stone-800'
          >
            <option value="ALL">All Branches</option>
            <option value="1">Branch 1 Only</option>
            <option value="2">Branch 2 Only</option>
          </select>
          <button 
            onClick={handleResetData}
            className='bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm active:scale-95 transition'
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Global Inventory List */}
      <h3 className='font-bold text-stone-800 mb-3'>Global Inventory View</h3>
      <div className='flex flex-col gap-3'>
        {inventory.length === 0 ? (
          <p className='text-stone-400 text-sm text-center py-4'>No items in inventory.</p>
        ) : (
          inventory.map(item => (
            <div key={item.id} className='bg-white p-3.5 rounded-2xl shadow-sm border border-stone-200'>
              
              {/* If item is currently being edited */}
              {editingItem?.id === item.id ? (
                <form onSubmit={handleEditSave} className='flex flex-col gap-2'>
                  <input 
                    type="text" 
                    value={editingItem.name} 
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} 
                    className='border border-stone-300 rounded-lg p-2 text-sm font-bold'
                  />
                  <div className='flex gap-2'>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editingItem.buy_price} 
                      onChange={e => setEditingItem({ ...editingItem, buy_price: e.target.value })} 
                      className='flex-1 border border-stone-300 rounded-lg p-2 text-xs'
                      placeholder="Wholesale"
                    />
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editingItem.sell_price} 
                      onChange={e => setEditingItem({ ...editingItem, sell_price: e.target.value })} 
                      className='flex-1 border border-stone-300 rounded-lg p-2 text-xs'
                      placeholder="MRP"
                    />
                  </div>
                  <div className='flex gap-2'>
                    <input 
                      type="number" 
                      value={editingItem.stock} 
                      onChange={e => setEditingItem({ ...editingItem, stock: e.target.value })} 
                      className='flex-1 border border-stone-300 rounded-lg p-2 text-xs'
                      placeholder="Stock"
                    />
                    <select 
                      value={editingItem.branch_id} 
                      onChange={e => setEditingItem({ ...editingItem, branch_id: e.target.value })} 
                      className='flex-1 border border-stone-300 rounded-lg p-2 text-xs bg-white'
                    >
                      <option value="1">Branch 1</option>
                      <option value="2">Branch 2</option>
                    </select>
                  </div>
                  <div className='flex gap-2 mt-1'>
                    <button type="submit" className='flex-1 bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-xs'>Save</button>
                    <button type="button" onClick={() => setEditingItem(null)} className='bg-stone-200 text-stone-600 font-bold px-3 py-1.5 rounded-lg text-xs'>Cancel</button>
                  </div>
                </form>
              ) : (
                /* Standard Product View */
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-bold text-stone-800'>{item.name}</p>
                    <p className='text-xs text-stone-500'>Branch {item.branch_id} | Stock: <span className='font-bold text-stone-700'>{item.stock}</span></p>
                    <p className='text-xs text-stone-400 mt-0.5'>Cost: ₹{item.buy_price} | MRP: <span className='text-emerald-600 font-semibold'>₹{item.sell_price}</span></p>
                  </div>
                  <div className='flex gap-2'>
                    <button 
                      onClick={() => setEditingItem(item)} 
                      className='bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95'
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(item.id, item.name)} 
                      className='bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold active:scale-95'
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;