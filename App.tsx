
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, ScanLine, ReceiptIndianRupee, Trash2, Plus, Minus, Search, PackageOpen, Users, WifiOff, Edit3, ShieldCheck, HelpCircle, AlertTriangle, IndianRupee, XCircle, Download, Lock, LogOut, History, ChevronRight } from 'lucide-react';
import { Scanner } from './components/Scanner';
import { Bill } from './components/Bill';
import { CustomerManager } from './components/CustomerManager';
import { EditProductModal } from './components/EditProductModal';
import { PaymentModal } from './components/PaymentModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { WorkflowGuide } from './components/WorkflowGuide';
import { identifyProductFromBarcode, identifyProductFromImage, DEFAULT_INVENTORY_LIST } from './services/gemini';
import { AppView, Product, Customer, Transaction, PaymentMethod, StoreProfile } from './types';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.HOME);
  
  // --- STATE PERISTENCE ---

  // 1. Inventory State (Master Database)
  const [inventory, setInventory] = useState<Product[]>(() => {
    const saved = localStorage.getItem('instabill_inventory');
    if (saved) return JSON.parse(saved);
    return DEFAULT_INVENTORY_LIST.map((p, idx) => ({ ...p, id: `init_${idx}`, quantity: 0 }));
  });

  // 2. Store Profile (Settings)
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
      const saved = localStorage.getItem('instabill_store_profile');
      return saved ? JSON.parse(saved) : {
          name: "InstaMart India",
          addressLine1: "Gujrat",
          addressLine2: "Bhavnagar",
          gstin: "29AAAAA0000A1Z5",
          phone: "+91 9529989821",
          email: "support@instamart.in"
      };
  });
  
  // 3. Current Cart
  const [cart, setCart] = useState<Product[]>(() => {
    const saved = localStorage.getItem('instabill_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 4. Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('instabill_customers');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 5. Selected Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
    return localStorage.getItem('instabill_selected_customer') || null;
  });

  // 6. Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
      const saved = localStorage.getItem('instabill_transactions');
      return saved ? JSON.parse(saved) : [];
  });

  // 7. Budget State
  const [budget, setBudget] = useState<number | null>(() => {
    const saved = localStorage.getItem('instabill_budget');
    return saved ? parseFloat(saved) : null;
  });

  // --- UI STATE ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  
  // Budget Increase State
  const [increaseBudgetMode, setIncreaseBudgetMode] = useState(false);
  const [tempIncreaseAmount, setTempIncreaseAmount] = useState('');

  // Last Transaction for Receipt View
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  // For manual editing
  const [editingProduct, setEditingProduct] = useState<{barcode: string, data?: Partial<Product>} | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{type: 'error' | 'success', msg: string} | null>(null);

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Focus ref for budget input
  const budgetInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('instabill_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('instabill_store_profile', JSON.stringify(storeProfile)); }, [storeProfile]);
  useEffect(() => { localStorage.setItem('instabill_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('instabill_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('instabill_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { 
      if (selectedCustomerId) localStorage.setItem('instabill_selected_customer', selectedCustomerId);
      else localStorage.removeItem('instabill_selected_customer');
  }, [selectedCustomerId]);
  useEffect(() => {
      if (budget !== null) localStorage.setItem('instabill_budget', budget.toString());
      else localStorage.removeItem('instabill_budget');
  }, [budget]);

  // Network Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA Install Listener
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
      setToastMessage({ type, msg });
      setTimeout(() => setToastMessage(null), 3000);
  };

  const playBeep = (type: 'success' | 'error' = 'success') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
      } else {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { console.error("Audio play failed", e); }
  };

  const speakAlert = (msg: string) => {
    try {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous speech
            const utterance = new SpeechSynthesisUtterance(msg);
            utterance.lang = 'en-IN'; // Prefer Indian English accent
            window.speechSynthesis.speak(utterance);
        }
    } catch (e) {
        console.error("TTS Error", e);
    }
  };

  // Calculations
  const GST_RATE = 0.18;
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = subtotal + (subtotal * GST_RATE);
  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  // Optimistic Total Ref to prevent race conditions during rapid scans/updates
  const optimisticTotalRef = useRef(totalAmount);
  
  // Sync ref with state when state updates (source of truth)
  useEffect(() => {
    optimisticTotalRef.current = totalAmount;
  }, [totalAmount]);

  // Budget Validation Helper
  // Now uses optimistic ref to catch rapid-fire additions
  const checkBudgetLimit = (additionalCostWithTax: number): boolean => {
      if (budget === null) return true;
      const currentTotal = optimisticTotalRef.current; // Use Ref for immediate check
      const projectedTotal = currentTotal + additionalCostWithTax;
      
      // Allow a tiny floating point margin
      if (projectedTotal > budget + 0.05) {
          playBeep('error');
          const msg = 'Budget limit reached! You cannot add more items.';
          speakAlert(msg); // Speak voice message
          setIncreaseBudgetMode(false); // Reset mode
          setShowBudgetWarning(true); // Trigger modal
          return false;
      }
      return true;
  };

  const commitToOptimisticTotal = (amount: number) => {
      optimisticTotalRef.current += amount;
  };

  const handleBudgetIncreaseSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseFloat(tempIncreaseAmount);
      if (val > 0 && budget !== null) {
          setBudget(budget + val);
          setShowBudgetWarning(false);
          setIncreaseBudgetMode(false);
          setTempIncreaseAmount('');
          playBeep('success');
          showToast(`Budget increased to ₹${budget + val}`, 'success');
      }
  };

  const handleScan = async (data: string, type: 'barcode' | 'image') => {
    // 1. Strict Processing Gate to prevent race conditions on scanner
    if (isProcessing) return;
    if (type === 'barcode' && data === lastScannedCode) return;
    
    if (type === 'barcode') {
        setLastScannedCode(data);
        setTimeout(() => setLastScannedCode(null), 3000);
    }

    setView(AppView.HOME);
    setIsProcessing(true);

    try {
      if (type === 'barcode') {
        const existingItem = cart.find(p => p.barcode === data);
        if (existingItem) {
          // Check Budget before incrementing (Price + GST)
          const costOfOne = existingItem.price * (1 + GST_RATE);
          if (!checkBudgetLimit(costOfOne)) {
              setIsProcessing(false);
              return;
          }

          commitToOptimisticTotal(costOfOne);
          updateQuantity(existingItem.id, 1, true); // Pass true to skip check inside updateQuantity
          playBeep('success');
          setIsProcessing(false);
          return;
        }

        // Check local inventory
        const localItem = inventory.find(p => p.barcode === data);
        if (localItem) {
            // Check Budget before adding new item (Price + GST)
            const costWithTax = localItem.price * (1 + GST_RATE);
            if (!checkBudgetLimit(costWithTax)) {
                setIsProcessing(false);
                return;
            }

            commitToOptimisticTotal(costWithTax);
            const newProduct: Product = {
                ...localItem,
                id: Date.now().toString(),
                quantity: 1
            };
            setCart(prev => [...prev, newProduct]);
            playBeep('success');
            setIsProcessing(false);
            return;
        }
      }

      let productData;
      try {
        if (type === 'barcode') {
          productData = await identifyProductFromBarcode(data);
        } else {
          productData = await identifyProductFromImage(data);
        }
      } catch (err: any) {
        // Trigger Manual Entry
        const barcodeForEdit = type === 'barcode' ? data : '';
        setEditingProduct({ barcode: barcodeForEdit });
        setIsProcessing(false);
        return;
      }

      // Check Budget for API identified item (Price + GST)
      const newItemCost = productData.price * (1 + GST_RATE);
      if (!checkBudgetLimit(newItemCost)) {
          setIsProcessing(false);
          return;
      }

      commitToOptimisticTotal(newItemCost);
      const newProduct: Product = {
        id: Date.now().toString(),
        ...productData,
        quantity: 1,
      };
      setCart(prev => [...prev, newProduct]);
      playBeep('success');

    } catch (err) {
      console.error("Failed to process scan", err);
      const barcodeForEdit = type === 'barcode' ? data : '';
      setEditingProduct({ barcode: barcodeForEdit });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQuantity = (id: string, delta: number, skipCheck = false) => {
    // Check Budget on Increment
    if (delta > 0 && !skipCheck) {
        const item = cart.find(i => i.id === id);
        if (item) {
            const costOfOne = item.price * (1 + GST_RATE);
            if (!checkBudgetLimit(costOfOne)) return;
            commitToOptimisticTotal(costOfOne);
        }
    }

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleManualAdd = (data: Partial<Product>) => {
    const price = data.price || 0;
    const costWithTax = price * (1 + GST_RATE);
    
    if (!checkBudgetLimit(costWithTax)) return;

    commitToOptimisticTotal(costWithTax);
    const newProduct: Product = {
      id: Date.now().toString(),
      name: data.name || "Manual Item",
      price: price,
      category: data.category || "General",
      quantity: 1,
      barcode: data.barcode,
      isOfflineAdded: true
    };
    setCart(prev => [...prev, newProduct]);
    setEditingProduct(null);
    playBeep('success');
  };

  const handleEditExisting = (item: Product) => {
      setEditingProduct({
          barcode: item.barcode || "",
          data: { name: item.name, price: item.price, category: item.category }
      });
      removeFromCart(item.id);
  };

  const handlePaymentComplete = (method: PaymentMethod) => {
      // Payment Success Sound
      playBeep('success');

      const newTransaction: Transaction = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('en-IN'),
          timestamp: Date.now(),
          items: [...cart],
          totalAmount: totalAmount,
          paymentMethod: method,
          customerId: currentCustomer?.id,
          customerName: currentCustomer?.name
      };
      
      setTransactions(prev => [...prev, newTransaction]);
      setLastTransaction(newTransaction);
      
      // Cleanup
      setCart([]);
      // Do NOT clear selected customer so they can continue shopping
      setBudget(null); 
      setShowPaymentModal(false);
      
      // Navigate to Receipt View
      setView(AppView.RECEIPT);
  };

  const handleLogout = () => {
      const isGuest = !selectedCustomerId;
      const confirmMsg = isGuest ? "Clear current session?" : "Are you sure you want to logout?";
      
      if (window.confirm(confirmMsg)) {
          // Clear current user
          setSelectedCustomerId(null);
          // Clear session data to ensure next user has a clean state
          setCart([]);
          setBudget(null);
          setLastTransaction(null);
          // Navigate to home to show Login option
          setView(AppView.HOME);
          showToast(isGuest ? 'Session cleared' : 'Logged out successfully', 'success');
      }
  };

  // --- VIEW ROUTING ---

  if (view === AppView.SCANNER) {
    return <Scanner onScan={handleScan} onClose={() => setView(AppView.HOME)} />;
  }

  if (view === AppView.BILL) {
    return (
        <>
            <Bill 
                cart={cart} 
                customer={currentCustomer} 
                storeProfile={storeProfile}
                onBack={() => setView(AppView.HOME)} 
                onPay={() => setShowPaymentModal(true)}
            />
            {showPaymentModal && (
                <PaymentModal 
                    amount={totalAmount} 
                    onComplete={handlePaymentComplete} 
                    onClose={() => setShowPaymentModal(false)} 
                />
            )}
        </>
    );
  }

  if (view === AppView.RECEIPT && lastTransaction) {
      // Reconstruct customer object for display
      const receiptCustomer: Customer | null = lastTransaction.customerId 
        ? customers.find(c => c.id === lastTransaction.customerId) || { 
            id: lastTransaction.customerId, 
            name: lastTransaction.customerName || 'Customer', 
            phone: '', 
            address: '' 
          }
        : null;

      return (
          <Bill 
            cart={lastTransaction.items}
            customer={receiptCustomer}
            storeProfile={storeProfile}
            onBack={() => {
                // Keep the current user logged in, just go back to home to start new bill
                setBudget(null);
                setLastTransaction(null);
                setView(AppView.HOME);
            }}
            onPay={() => {}} // Disabled in receipt mode
            isPaid={true}
            transactionData={lastTransaction}
          />
      );
  }

  if (view === AppView.ADMIN) {
      if (!isAdminAuthenticated) {
          return <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} onCancel={() => setView(AppView.HOME)} />;
      }
      return (
          <AdminDashboard 
            transactions={transactions} 
            inventory={inventory}
            storeProfile={storeProfile}
            customers={customers}
            onUpdateInventory={setInventory}
            onUpdateStoreProfile={setStoreProfile}
            onBack={() => {
                // IMPORTANT: Reset auth when leaving dashboard to ensure password is asked next time
                setIsAdminAuthenticated(false);
                setView(AppView.HOME);
            }} 
            onClearHistory={() => setTransactions([])}
            onLogout={() => { setIsAdminAuthenticated(false); setView(AppView.HOME); }}
          />
      );
  }
  
  if (view === AppView.HISTORY) {
      const userTransactions = transactions.filter(t => t.customerId === currentCustomer?.id).reverse();
      return (
          <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col">
              <div className="bg-indigo-600 p-4 pt-6 pb-6 text-white shadow-md sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setView(AppView.HOME)} className="hover:bg-white/10 p-2 rounded-full transition">
                          <ChevronRight className="rotate-180" size={24} />
                      </button>
                      <h1 className="text-xl font-bold">My Order History</h1>
                  </div>
              </div>
              <div className="flex-1 p-4 space-y-4">
                  {userTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                          <History size={64} className="mb-4 opacity-50" />
                          <p>No past orders found.</p>
                      </div>
                  ) : (
                      userTransactions.map(txn => (
                          <div 
                            key={txn.id} 
                            onClick={() => {
                                setLastTransaction(txn);
                                setView(AppView.RECEIPT);
                            }}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-95 transition cursor-pointer"
                          >
                              <div>
                                  <div className="font-bold text-gray-900">₹{txn.totalAmount.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500">{txn.date} • {txn.items.length} items</div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${txn.paymentMethod === 'UPI' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                      {txn.paymentMethod}
                                  </span>
                                  <ChevronRight size={16} className="text-gray-400" />
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden flex flex-col relative">
      
      {/* Toast Notification */}
      {toastMessage && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
              {toastMessage.type === 'error' ? <XCircle size={20} /> : <ShieldCheck size={20} />}
              <span className="font-medium text-sm">{toastMessage.msg}</span>
          </div>
      )}

      {/* Budget Warning Overlay */}
      {showBudgetWarning && (
        <div className="fixed inset-0 z-[100] bg-red-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                
                {!increaseBudgetMode ? (
                    <>
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 animate-pulse">
                            <AlertTriangle size={48} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Budget Limit!</h2>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                            You have reached your limit of <span className="font-bold text-black text-xl">₹{budget}</span>. 
                            <br/><span className="text-sm">Cannot add this item.</span>
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => setIncreaseBudgetMode(true)}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg"
                            >
                                Increase Limit
                            </button>
                            <button 
                                onClick={() => setShowBudgetWarning(false)}
                                className="w-full bg-gray-100 text-gray-800 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition"
                            >
                                Cancel Item
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                            <IndianRupee size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add to Budget</h2>
                        <p className="text-gray-500 mb-6">Current Limit: ₹{budget}</p>
                        
                        <form onSubmit={handleBudgetIncreaseSubmit}>
                             <div className="relative mb-6">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">+</span>
                                <input 
                                    type="number" 
                                    value={tempIncreaseAmount}
                                    onChange={(e) => setTempIncreaseAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-center border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                                    placeholder="Amount"
                                    autoFocus
                                    min="1"
                                />
                             </div>
                             <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIncreaseBudgetMode(false);
                                        setTempIncreaseAmount('');
                                    }}
                                    className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                                >
                                    Back
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition"
                                >
                                    Update
                                </button>
                             </div>
                        </form>
                    </>
                )}
            </div>
        </div>
      )}

      {/* Workflow Guide Modal */}
      {showGuide && <WorkflowGuide onClose={() => setShowGuide(false)} />}

      {/* Edit Modal for Cart */}
      {editingProduct && (
        <EditProductModal 
           barcode={editingProduct.barcode}
           initialData={editingProduct.data}
           onSave={handleManualAdd} 
           onClose={() => setEditingProduct(null)} 
        />
      )}

      {/* User Login Modal (Previously CustomerManager) */}
      {view === AppView.CUSTOMERS && (
        <CustomerManager 
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onAddCustomer={(c) => {
              setCustomers(prev => [...prev, c]);
              setSelectedCustomerId(c.id);
          }}
          onSelectCustomer={(id) => {
              // Toggle logic removed, always set if logging in
              setSelectedCustomerId(id);
          }}
          onClose={() => setView(AppView.HOME)}
        />
      )}

      {/* Header */}
      <header className={`p-4 pt-6 pb-6 rounded-b-[2rem] shadow-md z-0 relative transition-all duration-300 bg-indigo-600`}>
        <div className="flex justify-between items-start mb-4 text-white">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ReceiptIndianRupee /> {storeProfile.name.split(' ')[0] || 'InstaBill'}
            </h1>
            <div className="flex items-center gap-2 text-indigo-100 text-sm">
                <span>Smart AI Billing</span>
                {!isOnline && (
                    <span className="bg-red-500/20 text-red-100 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border border-red-500/30">
                        <WifiOff size={10} /> Offline
                    </span>
                )}
            </div>
          </div>
          <div className="flex items-center gap-2">
             {installPrompt && (
               <button 
                  onClick={handleInstallClick}
                  className="bg-white text-indigo-600 p-2 rounded-full hover:bg-white/90 transition shadow-lg animate-bounce"
                  title="Install App"
               >
                  <Download size={20} strokeWidth={3} />
               </button>
             )}
             <button 
                onClick={() => setShowGuide(true)}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"
                title="How it Works"
             >
                <HelpCircle size={20} className="text-indigo-100" />
             </button>
             {!currentCustomer && (
                 <button 
                    onClick={() => {
                       // Ensure we start with a clean auth state when clicking the admin button
                       setIsAdminAuthenticated(false);
                       setView(AppView.ADMIN);
                    }}
                    className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"
                    title="Admin Dashboard"
                 >
                    <ShieldCheck size={20} className="text-indigo-100" />
                 </button>
             )}
             <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm ml-1 text-center min-w-[70px]">
                <div className="text-[10px] uppercase opacity-75">Total</div>
                <span className="font-bold text-lg leading-none">₹{subtotal.toFixed(0)}</span>
             </div>
          </div>
        </div>
        
        {/* Budget Status / User Pill */}
        <div className="flex gap-2 mb-2">
            {currentCustomer ? (
                <div className="flex-1 flex gap-2">
                    <button 
                        onClick={() => setView(AppView.HISTORY)}
                        className="flex-1 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-black/10 transition text-white bg-indigo-800/50"
                    >
                        <History size={16} className="text-indigo-200" />
                        <span className="font-semibold truncate max-w-[100px]">{currentCustomer.name}</span>
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="bg-indigo-800/50 text-white p-2 rounded-xl hover:bg-red-500/50 transition"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            ) : (cart.length > 0 || budget !== null) ? (
                 <div className="flex-1 flex gap-2">
                    <button 
                        onClick={() => setView(AppView.CUSTOMERS)}
                        className="flex-1 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-black/10 transition text-white bg-indigo-800/50"
                    >
                        <Users size={16} className="text-indigo-200" />
                        <span className="font-semibold">Guest</span>
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="bg-indigo-800/50 text-white p-2 rounded-xl hover:bg-red-500/50 transition"
                        title="Clear Session"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setView(AppView.CUSTOMERS)}
                    className="flex-1 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-black/10 transition text-white bg-indigo-800/50 justify-center font-semibold"
                >
                    <Users size={16} className="text-indigo-200" /> Login / Sign Up
                </button>
            )}

            {budget !== null && (
                 <button 
                     onClick={() => {
                         if(confirm('Clear budget limit?')) setBudget(null);
                     }}
                     className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white border transition hover:scale-105 active:scale-95 ${totalAmount >= budget ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-indigo-800 border-indigo-400'}`}
                     title="Tap to change budget"
                 >
                     <IndianRupee size={12} />
                     Limit: {budget}
                 </button>
            )}
        </div>
      </header>

      {/* Main List */}
      <main className="flex-1 pt-6 px-4 pb-24 overflow-y-auto no-scrollbar">

        {/* Budget Setup Box - Shows inline when budget is null */}
        {budget === null && (
            <div className="mb-6 bg-white p-5 rounded-2xl shadow-lg shadow-indigo-100 border border-indigo-50 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 opacity-50"></div>
                 
                 <div className="relative z-10">
                     <div className="flex justify-between items-center mb-2">
                         <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                             Set Budget
                         </h2>
                         <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">
                             <IndianRupee size={16} />
                         </div>
                     </div>
                     <p className="text-gray-500 text-xs mb-4">Track expenses while you shop.</p>
                     
                     <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            const input = (e.currentTarget.elements.namedItem('budget') as HTMLInputElement);
                            const val = parseFloat(input.value);
                            if (val > 0) {
                                setBudget(val);
                                playBeep('success');
                            }
                        }}
                        className="flex gap-3"
                     >
                         <input 
                            ref={budgetInputRef}
                            name="budget"
                            type="number" 
                            inputMode="numeric"
                            placeholder="₹ Limit" 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            autoFocus
                         />
                         <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-200">
                             Set
                         </button>
                     </form>
                 </div>
            </div>
        )}
        
        {isProcessing && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-indigo-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
              <div className="h-3 bg-indigo-200 rounded w-1/2"></div>
            </div>
          </div>
        )}

        {cart.length === 0 && budget !== null ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <PackageOpen size={64} className="mb-4 opacity-50" />
            <p className="font-medium">Your cart is empty</p>
            <p className="text-xs mb-4">Scan a barcode to start billing</p>
            <button 
               onClick={() => setShowGuide(true)}
               className="mt-4 text-indigo-500 text-xs font-semibold hover:underline flex items-center gap-1"
            >
               <HelpCircle size={12} /> See how it works
            </button>
          </div>
        ) : cart.length > 0 ? (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 flex items-center gap-3 transition-all hover:shadow-md group">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-xl font-bold text-indigo-500 relative">
                  {item.name.charAt(0).toUpperCase()}
                  {item.isOfflineAdded && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white" title="Manually Added"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0" onClick={() => handleEditExisting(item)}>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="truncate">{item.name}</span>
                      <Edit3 size={12} className="opacity-0 group-hover:opacity-50 text-gray-500 shrink-0" />
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">{item.category}</span>
                  </div>
                  <div className="mt-1 font-bold text-gray-900">₹{item.price}</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center bg-white shadow-sm rounded text-gray-600 hover:text-red-500 active:scale-95"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-black">{item.quantity}</span>
                        <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white shadow-sm rounded text-gray-600 hover:text-green-600 active:scale-95"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-400 hover:text-red-600 mt-1 flex items-center gap-1">
                        <Trash2 size={10} /> Remove
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </main>

      {/* Bottom Actions */}
      <div className="absolute bottom-6 left-6 right-6 flex gap-4">
        <button 
          onClick={() => {
              if (budget === null) {
                  showToast('Please set a shopping budget first', 'error');
                  if (budgetInputRef.current) budgetInputRef.current.focus();
                  playBeep('error');
                  return;
              }
              setView(AppView.SCANNER);
          }}
          className={`flex-1 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 font-semibold transition active:scale-95 text-white ${budget === null ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'}`}
        >
          {budget === null ? <Lock size={20} /> : <ScanLine size={20} />} 
          {budget === null ? 'Set Budget First' : 'Scan Item'}
        </button>
        
        {cart.length > 0 && (
          <button 
            onClick={() => setView(AppView.BILL)}
            className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 font-semibold hover:bg-indigo-700 transition active:scale-95"
          >
            Checkout Bill
          </button>
        )}
      </div>

    </div>
  );
}
