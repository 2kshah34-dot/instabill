
import React, { useRef, useState } from 'react';
import { Product, Customer, StoreProfile, Transaction } from '../types';
import { ArrowLeft, Share2, User, CreditCard, Loader2, Download, CheckCircle2, ScanLine } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BillProps {
  cart: Product[];
  customer: Customer | null;
  storeProfile: StoreProfile;
  onBack: () => void;
  onPay: () => void;
  isPaid?: boolean;
  transactionData?: Transaction | null;
}

export const Bill: React.FC<BillProps> = ({ 
    cart, 
    customer, 
    storeProfile, 
    onBack, 
    onPay, 
    isPaid = false,
    transactionData = null
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstRate = 0.18;
  const gstAmount = subtotal * gstRate;
  const total = subtotal + gstAmount;
  
  const displayDate = transactionData?.date || new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handleDownloadPDF = async () => {
      if (!receiptRef.current) return;
      setIsGeneratingPdf(true);

      try {
          if (receiptRef.current.parentElement) {
              receiptRef.current.parentElement.scrollTop = 0;
          }

          const elementHeight = receiptRef.current.scrollHeight;

          const canvas = await html2canvas(receiptRef.current, {
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false,
              useCORS: true,
              height: elementHeight,
              windowHeight: elementHeight,
              onclone: (doc) => {
                  const el = doc.getElementById('receipt-content');
                  if (el) {
                      el.style.boxShadow = 'none';
                      el.style.height = 'auto';
                      el.style.overflow = 'visible';
                  }
              }
          });

          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = 210; 
          const imgProps = { width: canvas.width, height: canvas.height };
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: [pdfWidth, pdfHeight]
          });

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          const fileName = `Bill_${storeProfile.name.split(' ')[0]}_${Date.now()}.pdf`;
          pdf.save(fileName);

      } catch (err) {
          console.error("PDF Gen Error", err);
          alert("Could not generate PDF. Please try again.");
      } finally {
          setIsGeneratingPdf(false);
      }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setIsSharing(true);

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
            const clonedReceipt = clonedDoc.getElementById('receipt-content');
            if (clonedReceipt) {
                clonedReceipt.style.boxShadow = 'none'; 
            }
        }
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
            setIsSharing(false);
            return;
        }

        const fileName = `InstaBill_${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Bill from ${storeProfile.name}`,
              text: `Here is your receipt for ₹${total.toFixed(2)}`,
              files: [file],
            });
          } catch (err) {
            console.log('Share dismissed or failed', err);
          }
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
        }
        setIsSharing(false);
      }, 'image/png');

    } catch (err) {
      console.error('Failed to generate receipt', err);
      setIsSharing(false);
      alert('Failed to generate shareable receipt.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className={`p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 transition-colors ${isPaid ? 'bg-green-600 text-white' : 'bg-white text-gray-900'}`}>
        <button onClick={onBack} className={`${isPaid ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg flex items-center gap-2">
            {isPaid ? <><CheckCircle2 size={20} /> Payment Successful</> : 'Checkout'}
        </h1>
        <div className="w-6"></div> 
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="max-w-md mx-auto w-full pb-32">
            <div 
                id="receipt-content"
                ref={receiptRef}
                className="bg-white p-4 sm:p-8 shadow-xl relative w-full font-mono text-sm leading-relaxed"
            >
                {isPaid && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-green-500 text-green-500 rounded-lg p-4 text-4xl font-bold opacity-20 rotate-[-15deg] pointer-events-none uppercase tracking-widest z-0">
                       PAID
                   </div>
                )}

                <div className="absolute -top-1.5 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_0.35rem,white_0.35rem)] bg-[length:0.75rem_0.75rem] -mt-1.5"></div>

                <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4 relative z-10">
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider mb-2">{storeProfile.name}</h2>
                  <div className="text-xs text-gray-500 space-y-0.5">
                      <p>{storeProfile.addressLine1}</p>
                      <p>{storeProfile.addressLine2}</p>
                      {storeProfile.phone && <p>Ph: {storeProfile.phone}</p>}
                      <p className="mt-1 font-semibold text-gray-600">GSTIN: {storeProfile.gstin}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end text-xs mb-4 relative z-10">
                    <div className="text-gray-500 space-y-1">
                        <p>Date: <span className="text-gray-800 font-medium">{displayDate}</span></p>
                        <p>Bill #: <span className="text-gray-800 font-medium">{transactionData?.id.slice(-6) || Math.floor(Math.random() * 1000000)}</span></p>
                    </div>
                    <div className="text-right text-gray-500">
                        {isPaid && transactionData && (
                            <p className="font-bold text-green-600 uppercase mb-1">{transactionData.paymentMethod}</p>
                        )}
                        <p>Term: 01</p>
                        <p>Cashier: Admin</p>
                    </div>
                </div>
                  
                {customer && (
                    <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs relative z-10">
                      <div className="font-bold text-gray-800 flex items-center gap-1 mb-1">
                         <User size={12} /> Bill To:
                      </div>
                      <div className="pl-4 space-y-0.5">
                          <p className="font-medium text-base text-black">{customer.name}</p>
                          {customer.phone && <p className="text-gray-500">Ph: {customer.phone}</p>}
                          {customer.address && <p className="text-gray-500">{customer.address}</p>}
                      </div>
                    </div>
                )}

                <table className="w-full mb-4 border-collapse relative z-10">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 border-b-2 border-gray-800">
                      <th className="py-2 w-[45%]">Item</th>
                      <th className="py-2 text-center w-[15%]">Qty</th>
                      <th className="py-2 text-right w-[20%]">Rate</th>
                      <th className="py-2 text-right w-[20%]">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs sm:text-sm">
                    {cart.map((item) => (
                      <tr key={item.id} className="align-top border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-1">
                          <div className="font-semibold text-gray-900 break-words">{item.name}</div>
                          <div className="flex flex-col mt-0.5">
                              {item.barcode && <span className="text-[10px] text-gray-500 font-mono tracking-wide">{item.barcode}</span>}
                              {item.isOfflineAdded && <span className="text-[8px] bg-yellow-100 text-yellow-800 px-1 rounded font-sans tracking-tight w-fit mt-0.5">MANUAL</span>}
                          </div>
                        </td>
                        <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                        <td className="py-2 text-right text-gray-600">₹{item.price}</td>
                        <td className="py-2 text-right font-medium text-gray-900">₹{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-1.5 text-xs sm:text-sm relative z-10">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST ({gstRate * 100}%)</span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl sm:text-2xl mt-3 border-t-2 border-black pt-3">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 text-center relative z-10">
                  <div className="text-[10px] text-gray-400 mb-2">**************************************</div>
                  <p className="text-xs font-semibold text-gray-600">Thank you for shopping!</p>
                  <p className="text-[10px] text-gray-400 mt-1">Visit us again</p>
                  
                  <div className="mt-6 mb-2 px-4 flex flex-col items-center justify-center">
                     <svg 
                        className="w-full max-w-[200px] h-12" 
                        viewBox="0 0 100 30" 
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                     >
                         {/* Algorithmic Barcode Generation - Pure SVG */}
                         {Array.from({ length: 45 }).map((_, i) => {
                             const x = i * 2.2;
                             const isSpace = (i % 7 === 0) || (i % 13 === 0);
                             const width = (i % 2 === 0) ? 1.8 : 0.8;
                             if(isSpace) return null;
                             return <rect key={i} x={x + 1} y="0" width={width} height="30" fill="black" />
                         })}
                         <rect x="0" y="0" width="2" height="30" fill="black" />
                         <rect x="98" y="0" width="2" height="30" fill="black" />
                     </svg>
                     <span className="text-[10px] tracking-[0.4em] text-gray-600 font-bold block mt-1 font-mono">
                         {transactionData?.id ? transactionData.id.slice(-12).toUpperCase() : Math.random().toString().slice(2, 14)}
                     </span>
                  </div>
                </div>

                <div className="absolute -bottom-1.5 left-0 right-0 h-3 bg-[radial-gradient(circle,white_0.35rem,transparent_0.35rem)] bg-[length:0.75rem_0.75rem] rotate-180 -mb-1.5"></div>
            </div>
        </div>
      </div>

      <div className="bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] sticky bottom-0 z-20 border-t border-gray-100">
         <div className="max-w-md mx-auto flex gap-3">
             
             {isPaid ? (
                 <>
                    <button 
                        onClick={onBack}
                        className="flex-1 bg-gray-100 text-gray-800 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition active:scale-95"
                    >
                        <ScanLine size={18} /> New Bill
                    </button>
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPdf}
                        className="flex-[1.5] bg-green-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        <span>{isGeneratingPdf ? 'Creating...' : 'Download PDF'}</span>
                    </button>
                 </>
             ) : (
                 <>
                    <button 
                        onClick={handleShare}
                        disabled={isSharing}
                        className="flex-1 bg-gray-100 text-gray-800 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-wait active:scale-95"
                    >
                        {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                        <span className="text-sm sm:text-base">{isSharing ? 'Saving...' : 'Share Bill'}</span>
                    </button>
                    <button 
                        onClick={onPay}
                        className="flex-[1.5] bg-indigo-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition"
                    >
                        <CreditCard size={18} /> 
                        <span className="text-sm sm:text-base">Collect Payment</span>
                    </button>
                 </>
             )}
         </div>
      </div>
    </div>
  );
};
