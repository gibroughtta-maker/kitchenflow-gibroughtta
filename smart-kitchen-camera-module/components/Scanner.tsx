import React, { useEffect, useState } from "react";
import { X, UploadCloud, Loader2, Wand2, Camera, Plus, Trash2 } from "lucide-react";
import {
    ScannerConfig,
    configureScanner,
    analyzeFridgeAudit,
    analyzeInvoice,
    analyzePOSReceipt
} from "../services/scannerService";
import { preprocessImage } from "../utils/imageProcessing";
import { DictionaryItem, InventoryItem } from "../types";

// Simple UI components for the standalone module
const Button = ({ children, onClick, disabled, variant = 'primary', className = '' }: any) => {
    const base = "px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const styles = {
        primary: "bg-black text-white hover:bg-gray-800",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        danger: "bg-red-50 text-red-600 hover:bg-red-100"
    };
    // @ts-ignore
    return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
};

export type ScanMode = "receipt" | "fridge" | "sales";

interface ScannerProps {
    apiKey?: string; // Optional if configured globally
    initialMode?: ScanMode;
    onClose: () => void;
    onScanComplete: (result: any, mode: ScanMode) => void;
    dictionary?: DictionaryItem[]; // Optional RAG data
}

export const Scanner: React.FC<ScannerProps> = ({
    apiKey,
    initialMode = "receipt",
    onClose,
    onScanComplete,
    dictionary = []
}) => {
    const [mode, setMode] = useState<ScanMode>(initialMode);
    const [files, setFiles] = useState<Array<{ file: File, preview: string }>>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState("");
    const [rawOutput, setRawOutput] = useState("");

    // Initialize API Key
    useEffect(() => {
        if (apiKey) {
            configureScanner({ apiKey });
        }
    }, [apiKey]);

    // Cleanup object URLs
    useEffect(() => {
        return () => files.forEach(f => URL.revokeObjectURL(f.preview));
    }, [files]);

    const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const preview = URL.createObjectURL(file);

            if (mode === 'fridge') {
                if (files.length >= 5) return;
                setFiles(prev => [...prev, { file, preview }]);
            } else {
                // Unit mode only allows 1 file
                setFiles([{ file, preview }]);
            }
            setError("");
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const runScan = async () => {
        if (files.length === 0) return;
        setAnalyzing(true);
        setError("");
        setRawOutput("");

        try {
            // 1. Preprocess Images
            const processedImages = await Promise.all(files.map(async (f) => {
                const processed = await preprocessImage(f.file, {
                    maxWidth: 1500,
                    targetSizeKB: 500
                });
                return {
                    base64: processed.base64,
                    mimeType: 'image/jpeg'
                };
            }));

            let result: any;

            // 2. Call Service based on Mode
            if (mode === 'fridge') {
                result = await analyzeFridgeAudit(processedImages, dictionary);
            } else if (mode === 'receipt') {
                // Use first image for invoice OCR
                result = await analyzeInvoice(processedImages[0].base64, 'image/jpeg', dictionary.map(d => d.name));
            } else if (mode === 'sales') {
                // Use first image for POS
                result = await analyzePOSReceipt(processedImages[0].base64, 'image/jpeg');
            }

            if (!result) throw new Error("No result returned from AI");

            // 3. Return result
            setRawOutput(JSON.stringify(result, null, 2));
            onScanComplete(result, mode);

            // Optional: Close on success if desired, or let user review
            // onClose(); 

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Scan failed");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">AI Scanner module</h2>
                        <p className="text-sm text-gray-500">Mode: {mode.toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-gray-100 border-b">
                    {(['receipt', 'fridge', 'sales'] as ScanMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setFiles([]); setRawOutput(""); setError(""); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-white shadow text-black' : 'text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {m === 'receipt' ? 'Invoice OCR' : m === 'fridge' ? 'Fridge Audit' : 'Sales Receipt'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* File Upload Area */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {files.map((f, i) => (
                                <div key={i} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border">
                                    <img src={f.preview} className="w-full h-full object-cover" alt="preview" />
                                    <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {(files.length === 0 || (mode === 'fridge' && files.length < 5)) && (
                                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-black hover:bg-gray-50 transition-colors">
                                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500 font-medium">Add Photo</span>
                                    <input type="file" accept="image/*" onChange={handleAddFile} className="hidden" />
                                </label>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                                <strong>Error:</strong> {error}
                            </div>
                        )}

                        {rawOutput && (
                            <div className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-auto max-h-60">
                                <pre>{rawOutput}</pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={runScan} disabled={files.length === 0 || analyzing}>
                        {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {analyzing ? 'Analyzing...' : 'Run Analysis'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
