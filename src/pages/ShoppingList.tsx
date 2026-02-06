import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getShoppingList, setShoppingList } from '../services/api';
import type { ShoppingItem } from '../types';

const MOCK_STORES = ['Tesco', 'Asda', 'Lidl'];

function genId() {
  return `shopping-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function groupByStore(items: ShoppingItem[]): { store: string; items: ShoppingItem[] }[] {
  return MOCK_STORES.map((store, idx) => ({
    store,
    items: items.filter((_, i) => i % MOCK_STORES.length === idx),
  })).filter((g) => g.items.length > 0);
}

export default function ShoppingList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const appliedAddItems = useRef(false);

  useEffect(() => {
    setError('');
    getShoppingList().then(setItems).catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }, []);

  useEffect(() => {
    const state = location.state as { addItems?: string[] } | undefined;
    if (state?.addItems?.length && !appliedAddItems.current) {
      appliedAddItems.current = true;
      setError('');
      getShoppingList()
        .then((list) => {
          const existing = new Set(list.map((i) => i.name.toLowerCase()));
          const toAdd: ShoppingItem[] = state.addItems!
            .filter((n) => !existing.has(n.toLowerCase()))
            .map((name) => ({ id: genId(), name, checked: false, addedAt: Date.now() }));
          const next = [...list, ...toAdd];
          return setShoppingList(next).then(() => {
            setItems(next);
            navigate(location.pathname, { replace: true, state: {} });
          });
        })
        .catch((e) => setError(e instanceof Error ? e.message : '添加失败'));
    }
  }, [location.state, location.pathname, navigate]);

  const addItem = async () => {
    const name = newName.trim();
    if (!name) return;
    setError('');
    const next = [...items, { id: genId(), name, checked: false, addedAt: Date.now() }];
    try {
      await setShoppingList(next);
      setItems(next);
      setNewName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请稍后重试');
    }
  };

  const toggle = async (id: string) => {
    setError('');
    const next = items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    try {
      await setShoppingList(next);
      setItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请稍后重试');
    }
  };

  const remove = async (id: string) => {
    setError('');
    const next = items.filter((i) => i.id !== id);
    try {
      await setShoppingList(next);
      setItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败，请稍后重试');
    }
  };

  const clearDone = async () => {
    setError('');
    const next = items.filter((i) => !i.checked);
    try {
      await setShoppingList(next);
      setItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请稍后重试');
    }
  };

  const groups = groupByStore(items);
  const hasDone = items.some((i) => i.checked);

  return (
    <div className="space-y-5 pb-28">
      {error && (
        <p className="text-red-300 text-sm text-center py-2 px-4 rounded-xl bg-red-500/20" role="alert">
          {error}
        </p>
      )}
      {groups.length === 0 ? (
        <p className="text-glass-secondary text-sm text-center py-12">暂无项目，在底部添加</p>
      ) : (
        <div className="space-y-4">
          {groups.map(({ store, items: storeItems }) => (
            <div
              key={store}
              className="liquid-card rounded-2xl border border-white/20 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-white/80">store</span>
                <span className="font-semibold text-glass-primary">{store}</span>
              </div>
              <div className="divide-y divide-white/10">
                {storeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggle(item.id)}
                      className="rounded-full w-5 h-5 border-2 border-white/40 bg-white/10 text-primary accent-primary shrink-0"
                    />
                    <span
                      className={`flex-1 font-medium text-sm ${
                        item.checked ? 'line-through text-glass-secondary' : 'text-white'
                      }`}
                    >
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="text-red-300 text-sm active:opacity-80 shrink-0"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部 Add Item + Clear */}
      <div className="fixed bottom-0 left-0 right-0 z-40 liquid-bar border-t border-white/15 px-5 py-4 safe-area-bottom">
        <div className="flex gap-2 max-w-lg mx-auto">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add item..."
            className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="button"
            onClick={addItem}
            className="pill-button px-5 py-3 rounded-full text-white font-semibold shrink-0"
          >
            Add
          </button>
        </div>
        {hasDone && (
          <button
            type="button"
            onClick={clearDone}
            className="w-full mt-2 py-2 rounded-full text-glass-secondary text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Clear checked
          </button>
        )}
      </div>
    </div>
  );
}
