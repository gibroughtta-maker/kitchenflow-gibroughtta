import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanFridge } from '../services/api';
import type { FridgeSnapshotResult } from '../types';

type StorageLocation = 'fridge' | 'freezer' | 'pantry';

export default function Scan() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('fridge');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const next = Array.from(list).slice(0, 5);
    setFiles(next);
    const urls = next.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return urls;
    });
    setError('');
  }, []);

  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) resolve({ mimeType: match[1], base64: match[2] });
        else reject(new Error('parse'));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleScan = async () => {
    if (files.length === 0) {
      setError('请先选择 1～5 张照片');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const images = await Promise.all(files.map(fileToBase64));
      const result = await scanFridge(images);
      if (!result?.items?.length) {
        setError('未识别到食材，请重试或换几张照片');
        return;
      }
      const withLocation: FridgeSnapshotResult = {
        items: result.items.map((i) => ({ ...i, storageLocation })),
        scanQuality: result.scanQuality ?? 'medium',
      };
      navigate('/scan-results', { state: { result: withLocation } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '扫描失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <label className="block w-full aspect-[2/1] max-h-52 rounded-3xl glass-frame overflow-hidden relative cursor-pointer bg-white/5">
        <input type="file" accept="image/*" multiple className="hidden" onChange={onSelect} />
        {previews[0] ? (
          <img src={previews[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-glass-secondary">
            <span className="text-4xl mb-2">📷</span>
            <span className="text-sm font-medium">点击选择照片（1～5 张）</span>
          </div>
        )}
      </label>
      {previews.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {previews.map((src, i) => (
            <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
          ))}
        </div>
      )}
      <div>
        <p className="text-sm text-glass-secondary mb-2 pl-1">存储位置</p>
        <div className="flex gap-2">
          {(['fridge', 'freezer', 'pantry'] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setStorageLocation(loc)}
              className={`flex-1 py-3 rounded-full text-sm font-semibold transition pill-button ${
                storageLocation === loc ? '!bg-white/25 border-white/50' : ''
              }`}
            >
              {loc === 'fridge' ? '❄️ 冰箱' : loc === 'freezer' ? '🧊 冷冻' : '🥫 Pantry'}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-300 text-sm">{error}</p>}
      <button
        type="button"
        onClick={handleScan}
        disabled={loading || files.length === 0}
        className="btn-primary-glass disabled:opacity-50"
      >
        {loading ? 'AI 识别中…' : '开始扫描'}
      </button>
    </div>
  );
}
