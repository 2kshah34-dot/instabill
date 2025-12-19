
import React, { useState } from 'react';
import { IndianRupee, ArrowRight } from 'lucide-react';

interface BudgetModalProps {
  onSetBudget: (amount: number) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ onSetBudget }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val > 0) {
      onSetBudget(val);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-indigo-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in duration-300">
        <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <IndianRupee size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Set Shopping Budget</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your spending limit to start</p>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
                <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-center border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition text-gray-800"
                    placeholder="0"
                    autoFocus
                    required
                    min="1"
                />
            </div>
            <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
                Start Shopping <ArrowRight size={20} />
            </button>
        </form>
      </div>
    </div>
  );
};
