import React, { useState } from 'react';
import { Product } from '../types';
import { X, Save } from 'lucide-react';

interface EditProductModalProps {
  initialData?: Partial<Product>;
  barcode: string;
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ initialData, barcode, onSave, onClose }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || 'General');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    onSave({
      name,
      price: parseFloat(price),
      category,
      barcode
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">Product Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="bg-gray-100 p-2 rounded text-center text-xs font-mono text-gray-600">
                Barcode: {barcode}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none transition"
                    placeholder="e.g. Masala Tea"
                    autoFocus
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input 
                        type="number"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none transition"
                        placeholder="0.00"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:outline-none bg-white"
                    >
                        <option>General</option>
                        <option>Stationary</option>
                        <option>Personal care</option>
                        <option>Medicine</option>
                        <option>Snacks</option>
                        <option>Health care</option>
                    </select>
                </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition mt-2"
            >
                <Save size={20} /> Save Product
            </button>
        </form>
      </div>
    </div>
  );
};
