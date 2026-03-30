import { useState, useRef } from "react";
import { Upload, X, Check, Loader2, Sparkles } from "lucide-react";
import { useScanReceiptMutation } from "@/hooks/use-receipts";
import { useCreateItemMutation } from "@/hooks/use-items";
import type { ScanReceiptResponse } from "@workspace/api-client-react";

interface ScanReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScanReceiptDialog({ open, onOpenChange }: ScanReceiptDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanResult, setScanResult] = useState<ScanReceiptResponse | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useScanReceiptMutation();
  const createMutation = useCreateItemMutation();

  if (!open) return null;

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && (selectedFile.type === "image/jpeg" || selectedFile.type === "image/png")) {
      setFile(selectedFile);
    }
  };

  const handleScan = () => {
    if (!file) return;
    scanMutation.mutate(
      { file },
      {
        onSuccess: (data) => {
          setScanResult(data);
        }
      }
    );
  };

  const handleAddItems = async () => {
    if (!scanResult) return;
    setIsAdding(true);
    
    try {
      const today = new Date();
      // Mock expiry generation based on items
      await Promise.all(scanResult.extractedItems.map(item => {
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + 7); // Default 7 days for scanned items
        
        return createMutation.mutateAsync({
          name: item.name,
          category: "Other", // Default category
          quantity: item.quantity,
          unit: item.unit,
          purchaseDate: today.toISOString().split('T')[0],
          expiryDate: expiryDate.toISOString().split('T')[0],
          estimatedCost: item.estimatedCost
        });
      }));
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to add scanned items");
    } finally {
      setIsAdding(false);
    }
  };

  const reset = () => {
    setFile(null);
    setScanResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-border/50">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Magic Receipt Scan
          </h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 bg-card rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!scanResult ? (
            <div className="space-y-6">
              <p className="text-muted-foreground text-center">
                Upload your grocery receipt. Our AI will automatically extract items and estimate expiry dates.
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileChange(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-3 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
                  ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
                  ${file ? 'border-primary bg-primary/5' : ''}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${file ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {file ? <Check className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                <div className="text-center">
                  {file ? (
                    <span className="font-semibold text-primary">{file.name}</span>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">Click to upload</span> or drag and drop<br/>
                      <span className="text-sm text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {file && (
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleScan}
                  disabled={!file || scanMutation.isPending}
                  className="flex-[2] px-4 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {scanMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Receipt...</>
                  ) : (
                    "Scan Receipt"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-center">
                <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <h3 className="font-bold font-display text-lg">Scan Successful!</h3>
                <p className="text-sm opacity-80">{scanResult.message}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Extracted Items:</h4>
                <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                  {scanResult.extractedItems.map((item, i) => (
                    <div key={i} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                      </div>
                      {item.estimatedCost && (
                        <p className="text-sm font-semibold text-muted-foreground">₹{item.estimatedCost}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  Scan Another
                </button>
                <button
                  onClick={handleAddItems}
                  disabled={isAdding}
                  className="flex-[2] px-4 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isAdding ? "Adding Items..." : `Add ${scanResult.extractedItems.length} Items`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
