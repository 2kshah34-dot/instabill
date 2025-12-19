
import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { X, Zap, Upload, Camera, Image as ImageIcon, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ScannerProps {
  onScan: (data: string, type: 'barcode' | 'image') => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize reader lazily with advanced hints
  if (!codeReader.current) {
    const hints = new Map();
    // "Try Harder" is crucial for reliability, even if slightly slower
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX
    ]);
    codeReader.current = new BrowserMultiFormatReader(hints);
  }

  // Camera Lifecycle Management
  useEffect(() => {
    // Cleanup previous stream when mode changes or component unmounts
    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    if (mode !== 'camera' || scanSuccess) {
        stopStream();
        return;
    }

    const startCamera = async () => {
        try {
            setError(null);
            
            // Request high resolution and environment camera
            // 1080p is ideal for barcodes to ensure lines are distinct
            const constraints = { 
                video: { 
                    facingMode: 'environment',
                    width: { min: 1280, ideal: 1920 },
                    height: { min: 720, ideal: 1080 }
                } 
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            // Attempt to enable continuous autofocus
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            // @ts-ignore - focusMode is not in all TS definitions yet
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                try {
                    // @ts-ignore
                    await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
                } catch (e) {
                    console.log("Autofocus not supported/failed", e);
                }
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Important: playing manually ensures the feed starts
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("Play error:", e));
                };
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setError("Camera access denied. Please check permissions.");
        }
    };

    startCamera();

    return stopStream;
  }, [mode, scanSuccess]);

  const handleManualScan = async () => {
      if (!videoRef.current || !codeReader.current || !streamRef.current || isProcessing) return;
      
      setIsProcessing(true);
      setError(null);

      try {
          // HYBRID SNAPSHOT STRATEGY
          // Since "Upload" works reliably for the user, we mimic it here.
          // Instead of streaming decoder (which may fail on some devices), we take
          // 3 high-res snapshots and feed them to the image decoder logic.
          
          const maxAttempts = 3;
          let found = false;

          for (let i = 0; i < maxAttempts; i++) {
              if (found) break;

              const canvas = document.createElement('canvas');
              // Use actual video dimensions for max resolution
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                  // Capture current frame
                  ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL('image/png');
                  
                  try {
                      // Use decodeFromImageUrl as it's the proven working method
                      const result = await codeReader.current.decodeFromImageUrl(dataUrl);
                      if (result && result.getText()) {
                          handleSuccess(result.getText());
                          found = true;
                          return;
                      }
                  } catch (snapshotErr) {
                      // Frame failed, wait slightly and retry
                      console.log(`Attempt ${i+1} failed`);
                      await new Promise(r => setTimeout(r, 300));
                  }
              }
          }
          
          if (!found) {
              throw new Error("No barcode found");
          }

      } catch (err: any) {
          console.log("Scan Failed:", err.message);
          setError("No barcode found. Hold steady & ensure good light.");
          setTimeout(() => setError(null), 3000);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSuccess = (text: string) => {
      if (scanSuccess) return;
      setScanSuccess(true);
      
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(200);

      // Stop scanning/camera
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Small delay for visual feedback
      setTimeout(() => {
          onScan(text, 'barcode');
      }, 500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      const imageUrl = URL.createObjectURL(file);
      try {
        const result = await codeReader.current!.decodeFromImageUrl(imageUrl);
        if (result && result.getText()) {
            handleSuccess(result.getText());
        }
      } catch (decodeErr) {
        console.error(decodeErr);
        setError("No valid barcode found in this image.");
        setIsProcessing(false);
      }
    } catch (err) {
      setError("Failed to process image.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/70 to-transparent">
        <div className="text-white">
          <h2 className="text-lg font-bold">Scan Product</h2>
          <p className="text-xs opacity-80">
            {mode === 'camera' ? 'Align code & Tap Capture' : 'Upload an image with a barcode'}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-900">
        
        {/* CAMERA MODE */}
        {mode === 'camera' && (
           <>
             {/* Video Feed */}
             <video 
                ref={videoRef} 
                className={`absolute w-full h-full object-cover transition-opacity duration-300 ${scanSuccess ? 'opacity-50' : 'opacity-100'}`} 
                muted
                playsInline
                autoPlay
             />

             {/* Scanning Overlay */}
             <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
                 
                 {/* Guide Box */}
                 <div className={`
                    w-72 h-48 border-2 rounded-2xl relative shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300
                    ${scanSuccess ? 'border-green-500 bg-green-500/20' : 'border-white/70'}
                    ${isProcessing ? 'border-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.5)]' : ''}
                 `}>
                     {/* Scanning Laser Animation */}
                     {isProcessing && !scanSuccess && (
                         <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[scan_1.5s_infinite_linear]"></div>
                     )}

                     {!scanSuccess && (
                         <>
                            {/* Corner Markers */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                         </>
                     )}
                     
                     {/* Success Icon */}
                     {scanSuccess && (
                         <div className="absolute inset-0 flex items-center justify-center text-green-500 animate-in zoom-in duration-300">
                             <CheckCircle2 size={64} className="drop-shadow-lg" />
                         </div>
                     )}
                 </div>

                 {/* Instructions or Success Msg */}
                 <div className="mt-8">
                     {scanSuccess ? (
                        <p className="bg-green-500 text-white px-4 py-1 rounded-full font-bold shadow-lg animate-in fade-in">
                            Barcode Detected!
                        </p>
                     ) : (
                        <div className="bg-black/50 text-white/90 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md transition-all">
                            {isProcessing ? 'Processing Image...' : 'Tap button below to scan'}
                        </div>
                     )}
                 </div>

                 {/* Error Message */}
                 {error && (
                    <div className="absolute top-24 bg-red-500/90 text-white px-6 py-3 rounded-xl text-sm font-medium animate-bounce shadow-lg mx-4 text-center">
                        <Zap size={16} className="inline mr-2" />
                        {error}
                    </div>
                 )}
             </div>

             {/* Manual Capture Button */}
             {!scanSuccess && (
                <div className="absolute bottom-28 left-0 right-0 flex justify-center items-center z-30 pointer-events-auto">
                    <button 
                        onClick={handleManualScan}
                        disabled={isProcessing}
                        className="group relative touch-manipulation"
                    >
                        {/* Outer Ring */}
                        <div className={`
                            w-20 h-20 rounded-full border-4 shadow-lg flex items-center justify-center transition-all duration-300 bg-white/10 backdrop-blur-sm
                            ${isProcessing ? 'border-indigo-500 scale-110' : 'border-white/80 group-active:scale-95'}
                        `}>
                             {/* Inner Button */}
                             {isProcessing ? (
                                 <RefreshCw className="animate-spin text-indigo-400" size={32} />
                             ) : (
                                 <div className="w-16 h-16 bg-white rounded-full border-4 border-transparent group-hover:border-indigo-500 transition-colors shadow-inner flex items-center justify-center">
                                     <Camera size={24} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </div>
                             )}
                        </div>
                    </button>
                </div>
             )}
           </>
        )}

        {/* UPLOAD MODE */}
        {mode === 'upload' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gray-800">
                <div className="bg-gray-700/50 border-2 border-dashed border-gray-500 rounded-2xl p-8 w-full max-w-sm flex flex-col items-center text-center">
                    {isProcessing ? (
                        <div className="animate-spin text-indigo-400 mb-4">
                            <RefreshCw size={48} />
                        </div>
                    ) : (
                        <ImageIcon size={64} className="text-gray-400 mb-4" />
                    )}
                    
                    <h3 className="text-white font-bold text-lg mb-2">
                        {isProcessing ? 'Scanning Image...' : 'Upload Barcode Image'}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Select an image from your gallery containing a clear barcode.
                    </p>
                    
                    <label className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer hover:bg-indigo-700 transition flex items-center gap-2">
                        <Upload size={20} />
                        Select Image
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload}
                            disabled={isProcessing}
                        />
                    </label>
                    
                    {error && (
                        <div className="mt-6 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-200 text-sm flex items-center gap-2">
                            <Zap size={16} /> {error}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Controls Toggle */}
      {!scanSuccess && (
          <div className="bg-black p-6 pb-8 flex justify-center items-center gap-2 z-20">
             <div className="bg-gray-800 p-1 rounded-xl flex">
                <button 
                    onClick={() => { setMode('camera'); setError(null); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition ${mode === 'camera' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                    <Camera size={18} />
                    Camera
                </button>
                <button 
                    onClick={() => { setMode('upload'); setError(null); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition ${mode === 'upload' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                    <Upload size={18} />
                    Upload
                </button>
             </div>
          </div>
      )}
      
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
