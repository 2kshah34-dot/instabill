
import React, { useState, useEffect } from 'react';
import { X, QrCode, Banknote, CreditCard, CheckCircle2, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  amount: number;
  onComplete: (method: 'UPI' | 'CASH' | 'CARD') => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ amount, onComplete, onClose }) => {
  const [method, setMethod] = useState<'UPI' | 'CASH' | 'CARD'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Cash Calculator State
  const [cashGiven, setCashGiven] = useState<string>('');
  
  // Calculate values
  const numericCashGiven = parseFloat(cashGiven || '0');
  const changeAmount = numericCashGiven - amount;
  const isInsufficient = method === 'CASH' && numericCashGiven < amount;

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate API call / Hardware interaction
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        onComplete(method);
      }, 1500);
    }, 2000);
  };

  const handleQuickCash = (val: number) => {
      setCashGiven(val.toString());
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[60] bg-green-600 flex items-center justify-center animate-in fade-in duration-300">
        <div className="text-white text-center">
          <CheckCircle2 size={80} className="mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold">Payment Successful!</h2>
          <p className="text-green-200 mt-2 text-xl">₹{amount.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Payment Method</h3>
            <p className="text-xs text-gray-500">Total Payable: <span className="text-black font-bold text-base">₹{amount.toFixed(2)}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-gray-50">
          <button 
            onClick={() => setMethod('UPI')}
            className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 text-sm font-medium transition ${method === 'UPI' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-indigo-200' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <QrCode size={20} /> UPI / QR
          </button>
          <button 
            onClick={() => setMethod('CASH')}
            className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 text-sm font-medium transition ${method === 'CASH' ? 'bg-white shadow-sm text-green-600 ring-1 ring-green-200' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <Banknote size={20} /> Cash
          </button>
          <button 
            onClick={() => setMethod('CARD')}
            className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 text-sm font-medium transition ${method === 'CARD' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-blue-200' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <CreditCard size={20} /> Card
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 min-h-[350px] flex flex-col justify-start">
          
          {method === 'UPI' && (
            <div className="text-center space-y-4 animate-in fade-in flex flex-col items-center justify-center h-full">
              <div className="bg-white p-6 border-2 border-dashed border-indigo-200 rounded-xl inline-flex items-center justify-center shadow-sm">
                {/* Local Placeholder QR */}
                <div className="relative">
                  <QrCode size={140} className="text-indigo-900" strokeWidth={1.5} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-1 rounded-full">
                       <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                         Pay
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">Scan using any UPI App<br/>(GPay, PhonePe, Paytm)</p>
            </div>
          )}

          {method === 'CASH' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cash Received</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 text-lg border-2 rounded-xl focus:outline-none transition ${isInsufficient && cashGiven ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`}
                    placeholder="Enter amount"
                    autoFocus
                  />
                  {cashGiven && (
                      <button onClick={() => setCashGiven('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                          <RotateCcw size={16} />
                      </button>
                  )}
                </div>
                {/* Validation Message */}
                {isInsufficient && cashGiven && (
                    <div className="flex items-center gap-2 text-red-500 text-xs font-medium mt-2 animate-in slide-in-from-top-1">
                        <AlertCircle size={14} />
                        <span>Amount cannot be less than total bill (₹{amount.toFixed(2)})</span>
                    </div>
                )}
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-4 gap-2">
                 {[50, 100, 200, 500].map(val => (
                     <button 
                        key={val} 
                        onClick={() => handleQuickCash(val)}
                        className="py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-green-100 hover:text-green-700 transition"
                     >
                         ₹{val}
                     </button>
                 ))}
                 <button 
                    onClick={() => handleQuickCash(2000)}
                    className="col-span-4 py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-green-100 hover:text-green-700 transition"
                 >
                     ₹2000
                 </button>
              </div>

              <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center">
                <span className="text-gray-600 font-medium">Change to Return</span>
                <span className={`text-xl font-bold ${changeAmount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  ₹{changeAmount >= 0 ? changeAmount.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          )}

          {method === 'CARD' && (
             <div className="text-center space-y-6 animate-in fade-in flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500 animate-pulse">
                   <CreditCard size={48} />
                </div>
                <div>
                   <h4 className="font-bold text-lg mb-1">Waiting for terminal...</h4>
                   <p className="text-gray-500 text-sm">Please swipe or insert card on the machine.</p>
                </div>
             </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-white">
          <button 
            onClick={handlePayment}
            disabled={isProcessing || isInsufficient}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition active:scale-95 shadow-lg
              ${isProcessing || isInsufficient
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'}
            `}
          >
            {isProcessing ? (
              <span>Processing...</span>
            ) : (
              <>
                Confirm Payment <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
