
import React, { useState } from 'react';
import { Transaction, Product, StoreProfile, Customer } from '../types';
import { ArrowLeft, TrendingUp, ShoppingBag, Users, Calendar, Download, Settings, Package, LayoutDashboard, Plus, Trash2, Edit2, Search, Save, LogOut } from 'lucide-react';
import { Bill } from './Bill';

interface AdminDashboardProps {
  transactions: Transaction[];
  inventory: Product[];
  storeProfile: StoreProfile;
  customers: Customer[];
  onUpdateInventory: (newInventory: Product[]) => void;
  onUpdateStoreProfile: (newProfile: StoreProfile) => void;
  onBack: () => void;
  onClearHistory: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    transactions, 
    inventory,
    storeProfile,
    customers,
    onUpdateInventory,
    onUpdateStoreProfile,
    onBack, 
    onClearHistory,
    onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'settings'>('overview');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // --- INVENTORY STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', price: '', category: 'General', barcode: '' });

  // --- STATS CALC ---
  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalOrders = transactions.length;
  const uniqueCustomers = new Set(transactions.map(t => t.customerId).filter(Boolean)).size;
  const today = new Date().toDateString();
  const todaysRevenue = transactions
    .filter(t => new Date(t.timestamp).toDateString() === today)
    .reduce((sum, t) => sum + t.totalAmount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // --- INVENTORY HANDLERS ---
  const handleSaveProduct = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.price) return;

      const newProduct: Product = {
          id: editingProduct ? editingProduct.id : Date.now().toString(),
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          barcode: formData.barcode || Date.now().toString(), // Generate if empty
          quantity: 0 // Master inventory qty irrelevant
      };

      if (editingProduct) {
          const updated = inventory.map(p => p.id === editingProduct.id ? newProduct : p);
          onUpdateInventory(updated);
      } else {
          onUpdateInventory([...inventory, newProduct]);
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', category: 'General',barcode: ''});
  };

  const startEdit = (product: Product) => {
      setEditingProduct(product);
      setFormData({
          name: product.name,
          price: product.price.toString(),
          category: product.category,
          barcode: product.barcode || ''
      });
      setShowProductForm(true);
  };

  const handleDeleteProduct = (id: string) => {
      if(window.confirm("Delete this product?")) {
          onUpdateInventory(inventory.filter(p => p.id !== id));
      }
  };

  const filteredInventory = inventory.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchTerm))
  );

  // --- SETTINGS HANDLERS ---
  const [settingsForm, setSettingsForm] = useState(storeProfile);
  const handleSaveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateStoreProfile(settingsForm);
      alert("Settings Saved!");
  };

  // --- CONDITIONAL RENDER FOR BILL VIEW ---
  if (selectedTransaction) {
      const txnCustomer = selectedTransaction.customerId 
          ? customers.find(c => c.id === selectedTransaction.customerId) 
          : null;
      
      const displayCustomer = txnCustomer || (selectedTransaction.customerId ? {
          id: selectedTransaction.customerId,
          name: selectedTransaction.customerName || 'Unknown',
          phone: '',
          address: ''
      } : null);

      return (
         <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
            <Bill 
               cart={selectedTransaction.items}
               customer={displayCustomer}
               storeProfile={storeProfile}
               onBack={() => setSelectedTransaction(null)}
               onPay={() => {}} // Admin view, already paid
               isPaid={true}
               transactionData={selectedTransaction}
            />
         </div>
      );
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <div className="bg-slate-900 text-white w-full md:w-64 p-4 flex flex-col gap-2 shrink-0">
         <div className="flex items-center gap-2 mb-8 px-2 mt-2">
             <button onClick={onBack} className="hover:bg-white/10 p-1 rounded transition mr-2">
                 <ArrowLeft size={20} />
             </button>
             <h1 className="font-bold text-lg">Admin Panel</h1>
         </div>

         <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
         >
             <LayoutDashboard size={18} /> Overview
         </button>
         <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
         >
             <Package size={18} /> Inventory <span className="ml-auto text-xs bg-slate-800 px-2 py-0.5 rounded-full">{inventory.length}</span>
         </button>
         <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
         >
             <Settings size={18} /> Store Settings
         </button>

         <div className="mt-auto pt-4 border-t border-slate-800">
            <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition w-full"
            >
                <LogOut size={18} /> Logout
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto h-screen bg-gray-50 p-4 md:p-8">
        
        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-300 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Total Sales</div>
                        <div className="text-2xl font-bold text-indigo-600">₹{totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Today's Sales</div>
                        <div className="text-2xl font-bold text-emerald-600">₹{todaysRevenue.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Total Orders</div>
                        <div className="text-2xl font-bold text-gray-800">{totalOrders}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Avg Order</div>
                        <div className="text-2xl font-bold text-orange-500">₹{avgOrderValue.toFixed(0)}</div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">Recent Transactions</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={onClearHistory}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition"
                            >
                                Clear History
                            </button>
                            <button 
                                onClick={() => {
                                    const csv = transactions.map(t => `${t.date},${t.customerName || 'Guest'},${t.paymentMethod},${t.totalAmount}`).join('\n');
                                    const blob = new Blob([`Date,Customer,Method,Amount\n${csv}`], { type: 'text/csv' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'sales.csv';
                                    a.click();
                                }}
                                className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50 transition font-medium"
                            >
                                <Download size={12} /> CSV
                            </button>
                        </div>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No transactions yet.</div>
                        ) : (
                            transactions.slice().reverse().map(txn => (
                                <div 
                                    key={txn.id} 
                                    onClick={() => setSelectedTransaction(txn)}
                                    className="p-4 flex justify-between items-center hover:bg-gray-50 transition cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${txn.paymentMethod === 'UPI' ? 'bg-indigo-500' : txn.paymentMethod === 'CASH' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                            {txn.paymentMethod[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{txn.customerName || 'Guest'}</div>
                                            <div className="text-xs text-gray-500">{txn.date} • {txn.items.length} items</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900">₹{txn.totalAmount.toFixed(2)}</div>
                                        <div className="text-[10px] text-gray-400 uppercase">{txn.paymentMethod}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* === PRODUCTS TAB === */}
        {activeTab === 'products' && (
            <div className="animate-in fade-in duration-300 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                    <button 
                        onClick={() => {
                            setEditingProduct(null);
                            setFormData({ name: '', price: '', category: 'General', barcode: '' });
                            setShowProductForm(true);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    >
                        <Plus size={18} /> Add Product
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search products by name or barcode..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Product List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3">Product Name</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3 text-right">Price</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInventory.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{product.barcode || 'No Barcode'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full uppercase tracking-wide font-bold">{product.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800">
                                            ₹{product.price}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => startEdit(product)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredInventory.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-400">
                                            No products found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Modal Overlay */}
                {showProductForm && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                <h3 className="font-bold text-lg">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                                <button onClick={() => setShowProductForm(false)} className="text-gray-400 hover:text-black">
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none" placeholder="e.g. Masala Tea" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (₹)</label>
                                        <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none bg-white">
                                            <option>General</option>
                                            <option>Grocery</option>
                                            <option>Dairy</option>
                                            <option>Snacks</option>
                                            <option>Beverages</option>
                                            <option>Personal Care</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Barcode</label>
                                    <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-indigo-500 outline-none font-mono text-sm" placeholder="Scan or type barcode" />
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition mt-2">
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-300 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Store Settings</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                                <ShoppingBag size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Business Profile</h3>
                                <p className="text-sm text-gray-500">This information will appear on your printed bills.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                                <input required type="text" value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                                <input required type="text" value={settingsForm.addressLine1} onChange={e => setSettingsForm({...settingsForm, addressLine1: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Shop No, Building" />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                                <input type="text" value={settingsForm.addressLine2} onChange={e => setSettingsForm({...settingsForm, addressLine2: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Area, City, Pincode" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                                <input type="text" value={settingsForm.gstin} onChange={e => setSettingsForm({...settingsForm, gstin: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input type="tel" value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                <input type="email" value={settingsForm.email} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                             <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200">
                                 <Save size={20} /> Save Changes
                             </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
