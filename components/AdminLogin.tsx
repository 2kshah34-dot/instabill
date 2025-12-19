import React, { useState } from 'react';
import { ShieldCheck, X, ArrowRight, Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      onLogin();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-slate-900 p-6 text-center text-white relative">
             <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                 <X size={20} />
             </button>
             <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                 <ShieldCheck size={32} />
             </div>
             <h2 className="text-xl font-bold">Admin Access</h2>
             <p className="text-slate-400 text-xs mt-1">Authorized Personnel Only</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-6">
             <div className="mb-6">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2 text-center">Enter Access PIN</label>
                 <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                        type="password" 
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 text-center tracking-[0.5em] text-xl font-bold border-2 rounded-xl focus:outline-none transition ${error ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 focus:border-slate-900'}`}
                      
                        maxLength={4}
                        autoFocus
                        inputMode="numeric"
                     />
                 </div>
                 {error && <p className="text-red-500 text-xs text-center mt-2 font-medium">Incorrect PIN. Try again.</p>}
             </div>

             <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg"
             >
                 Access Dashboard <ArrowRight size={18} />
             </button>
             
             <p className="text-center text-gray-400 text-[10px] mt-4">
             </p>
        </form>
      </div>
    </div>
  );
};