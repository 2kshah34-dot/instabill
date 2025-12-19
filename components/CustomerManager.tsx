
import React, { useState } from 'react';
import { Customer } from '../types';
import { User, ArrowRight, X, Phone, MapPin, Loader2, UserPlus, UserX } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onAddCustomer: (customer: Customer) => void;
  onSelectCustomer: (id: string) => void;
  onClose: () => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  onAddCustomer,
  onSelectCustomer,
  onClose
}) => {
  const [step, setStep] = useState<'PHONE' | 'SIGNUP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setIsLoading(true);

    // Simulate network lookup
    setTimeout(() => {
      const existingUser = customers.find(c => c.phone === phone);
      if (existingUser) {
        onSelectCustomer(existingUser.id);
        onClose();
      } else {
        setStep('SIGNUP');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsLoading(true);
    setTimeout(() => {
        const newCustomer: Customer = {
          id: Date.now().toString(),
          name: formData.name,
          phone: phone,
          address: formData.address
        };
        onAddCustomer(newCustomer);
        // Automatically select/login
        onSelectCustomer(newCustomer.id);
        onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center relative">
           <button onClick={onClose} className="absolute top-4 right-4 hover:bg-white/20 p-1 rounded-full transition">
               <X size={20} />
           </button>
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
               {step === 'SIGNUP' ? <UserPlus size={32} /> : <User size={32} />}
           </div>
           <h2 className="text-2xl font-bold">{step === 'SIGNUP' ? 'Sign Up' : 'Login / Sign Up'}</h2>
           <p className="text-indigo-100 text-sm">
             {step === 'SIGNUP' ? 'Create your account' : 'Enter mobile number to continue'}
           </p>
        </div>

        <div className="p-6">
            {step === 'PHONE' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition text-lg tracking-wide"
                                placeholder="9876543210"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Continue <ArrowRight size={20} /></>}
                    </button>
                    
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-400 mb-4">
                            New user? Just enter your number to <span className="text-indigo-600 font-bold">Sign Up</span> automatically.
                        </p>
                        
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-100"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-300 text-[10px] uppercase tracking-widest">OR</span>
                            <div className="flex-grow border-t border-gray-100"></div>
                        </div>

                        <button 
                            type="button"
                            onClick={onClose}
                            className="w-full mt-2 text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-800 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                        >
                            <UserX size={16} /> Continue as Guest
                        </button>
                    </div>
                </form>
            )}

            {step === 'SIGNUP' && (
                <form onSubmit={handleSignUp} className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="text-center mb-2">
                        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">New Account</span>
                        <p className="text-sm text-gray-500 mt-2">Setting up profile for <span className="font-bold text-gray-800">{phone}</span></p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                                placeholder="Enter your name"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address (Optional)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <textarea 
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                placeholder="Flat / Area / City"
                                rows={2}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                    >
                         {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Sign Up'}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => setStep('PHONE')}
                        className="w-full text-gray-500 text-sm py-2 hover:text-gray-800"
                    >
                        Change Number
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};
