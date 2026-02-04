import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeCraving } from '../services/gemini';
import { getShoppingList, setShoppingList } from '../services/storage';
import type { CravingAnalysisResult } from '../types';
import type { ShoppingItem } from '../types';

function genId() {
  return `craving-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Cravings() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CravingAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    const name = input.trim();
    if (!name) {
      setError('请输入想吃的菜名');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeCraving(name);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '分析失败');
    } finally {
      setLoading(false);
    }
  };

  const addMissingToShopping = () => {
    if (!result?.requiredIngredients?.length) return;
    const list = getShoppingList();
    const existing = new Set(list.map((i) => i.name.toLowerCase()));
    const toAdd: ShoppingItem[] = result.requiredIngredients
      .filter((name) => !existing.has(name.toLowerCase()))
      .map((name) => ({
        id: genId(),
        name,
        checked: false,
        addedAt: Date.now(),
      }));
    setShoppingList([...list, ...toAdd]);
    navigate('/shopping');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="输入菜名，如：番茄炒蛋"
          className="flex-1 px-4 py-3 rounded-2xl liquid-card border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-primary-glass shrink-0 h-12 px-5 disabled:opacity-50"
        >
          {loading ? '…' : '分析'}
        </button>
      </div>
      {error && <p className="text-red-300 text-sm">{error}</p>}
      {result && (
        <div className="liquid-card rounded-3xl p-5 space-y-4 active:scale-[0.98] transition-transform">
          <h3 className="font-bold text-lg text-glass-primary">{result.dishName}</h3>
          {(result.cuisine || result.estimatedTime) && (
            <p className="text-sm text-glass-secondary">
              {result.cuisine && `菜系：${result.cuisine}`}
              {result.estimatedTime && ` · 约 ${result.estimatedTime}`}
            </p>
          )}
          <div>
            <p className="text-sm font-semibold text-glass-primary mb-2">所需食材</p>
            <ul className="list-disc list-inside text-glass-secondary text-sm space-y-1">
              {result.requiredIngredients.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={addMissingToShopping}
            className="w-full py-3 rounded-full btn-primary-glass"
          >
            🛒 缺失食材加入购物清单
          </button>
        </div>
      )}
    </div>
  );
}
