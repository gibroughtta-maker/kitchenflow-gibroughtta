import { useState } from 'react';
import { identifyCravingFromText, identifyCravingFromLink, getRecipeDetails } from '../services/api';
import type { RecipeDetails } from '../types';
import RecipeModal from '../components/RecipeModal';

function genId() {
  return `craving-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';

type InputMode = 'text' | 'link';

type CravingCard = {
  id: string;
  name: string;
  image: string;
  recipe: RecipeDetails | null;
};

export default function Cravings() {
  const [mode, setMode] = useState<InputMode>('text');
  const [input, setInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cards, setCards] = useState<CravingCard[]>([]);
  const [modalCard, setModalCard] = useState<CravingCard | null>(null);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);

  const fetchRecipeByFoodName = async (foodName: string): Promise<RecipeDetails | null> => {
    const recipe = await getRecipeDetails(foodName);
    return recipe ?? null;
  };

  const handleAnalyze = async () => {
    if (mode === 'text') {
      const raw = input.trim();
      if (!raw) {
        setError('请输入想吃的菜名或描述');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const identified = await identifyCravingFromText(raw);
        const foodName = (identified?.foodName ?? raw).trim();
        if (!foodName) {
          setError('请输入想吃的菜名或描述');
          setLoading(false);
          return;
        }
        const recipe = await fetchRecipeByFoodName(foodName);
        if (!recipe) {
          setError('获取食谱失败，请重试或换一种说法');
          setLoading(false);
          return;
        }
        const card: CravingCard = {
          id: genId(),
          name: foodName,
          image: PLACEHOLDER_IMAGE,
          recipe,
        };
        setCards((prev) => [card, ...prev]);
        setModalCard(card);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '分析失败');
      } finally {
        setLoading(false);
      }
    } else {
      const url = linkInput.trim();
      if (!url) {
        setError('请粘贴食谱或美食链接');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const identified = await identifyCravingFromLink(url);
        if (!identified?.foodName) {
          setError('未能从链接识别菜名，请换一个链接');
          setLoading(false);
          return;
        }
        const recipe = await fetchRecipeByFoodName(identified.foodName);
        const card: CravingCard = {
          id: genId(),
          name: identified.foodName,
          image: PLACEHOLDER_IMAGE,
          recipe,
        };
        setCards((prev) => [card, ...prev]);
        setModalCard(card);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '分析失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const openCard = async (card: CravingCard) => {
    if (card.recipe) {
      setModalCard(card);
      return;
    }
    setLoadingCardId(card.id);
    try {
      const recipe = await fetchRecipeByFoodName(card.name);
      if (recipe) {
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, recipe } : c))
        );
        setModalCard({ ...card, recipe });
      }
    } finally {
      setLoadingCardId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-2xl p-1 liquid-card border border-white/20">
        <button
          type="button"
          onClick={() => {
            setMode('text');
            setError('');
          }}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === 'text' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
        >
          文字
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('link');
            setError('');
          }}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === 'link' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
        >
          链接
        </button>
      </div>
      <div className="flex gap-2">
        {mode === 'text' ? (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="输入菜名或描述，如：我想吃番茄炒蛋"
            className="flex-1 px-4 py-3 rounded-2xl liquid-card border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        ) : (
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="粘贴食谱或美食链接..."
            className="flex-1 px-4 py-3 rounded-2xl liquid-card border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        )}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-primary-glass shrink-0 h-12 px-5 disabled:opacity-50"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            '分析'
          )}
        </button>
      </div>
      {error && <p className="text-red-300 text-sm">{error}</p>}

      {/* 瀑布流卡片 */}
      <div className="columns-2 gap-3 space-y-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => openCard(card)}
            className="relative group w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-white/10 break-inside-avoid cursor-pointer active:scale-95 text-left"
          >
            <img
              alt={card.name}
              src={card.image}
              className="w-full h-auto min-h-[160px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 !bg-black/50 !backdrop-blur-md p-3 flex justify-between items-center border-t border-white/10">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{card.name}</span>
                <span className="text-[10px] text-white/60">Just now</span>
              </div>
              {loadingCardId === card.id && (
                <span className="material-symbols-outlined text-[16px] text-white/60 animate-spin">progress_activity</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {modalCard?.recipe && (
        <RecipeModal
          data={modalCard.recipe}
          image={modalCard.image}
          onClose={() => setModalCard(null)}
        />
      )}
    </div>
  );
}
