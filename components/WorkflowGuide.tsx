
import React from 'react';
import { ScanLine, ShoppingCart, ReceiptIndianRupee, X, UserCheck, IndianRupee } from 'lucide-react';

interface WorkflowGuideProps {
  onClose: () => void;
}

export const WorkflowGuide: React.FC<WorkflowGuideProps> = ({ onClose }) => {
  const steps = [
    {
      icon: <UserCheck size={24} className="text-white" />,
      title: "1. Login & Identify",
      desc: "Enter your mobile number to sign in. If you are new, create a profile to save your purchase history.",
      color: "bg-blue-600"
    },
    {
      icon: <IndianRupee size={24} className="text-white" />,
      title: "2. Set Budget",
      desc: "Set a spending limit before you shop. The app will warn you if a product exceeds your budget.",
      color: "bg-indigo-600"
    },
    {
      icon: <ScanLine size={24} className="text-white" />,
      title: "3. Scan Products",
      desc: "Point camera at barcodes. The app identifies the item and price instantly. You can also add items manually.",
      color: "bg-purple-600"
    },
    {
      icon: <ReceiptIndianRupee size={24} className="text-white" />,
      title: "4. Pay & Bill",
      desc: "Review your cart, generate the final bill with GST, pay via Cash/UPI, and get a digital receipt.",
      color: "bg-green-600"
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <div>
              <h2 className="font-bold text-xl">How it Works</h2>
              <p className="text-xs text-indigo-200">Simple 4-step process</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Timeline */}
        <div className="p-6 overflow-y-auto bg-white flex-1">
          <div className="relative pl-2">
            {/* Connecting Line */}
            <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-gray-100 -z-10"></div>

            <div className="space-y-10">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-5 relative group">
                  <div className={`relative z-10 w-14 h-14 rounded-2xl ${step.color} shadow-lg shadow-gray-200 flex items-center justify-center shrink-0 border-4 border-white`}>
                    {step.icon}
                  </div>
                  <div className="pt-1 flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg active:scale-95"
          >
            Got it, Let's Shop!
          </button>
        </div>
      </div>
    </div>
  );
};
