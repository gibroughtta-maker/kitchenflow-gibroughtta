import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getShoppingList, setShoppingList } from '../services/storage';
import type { ShoppingItem } from '../types';

function genId() {
  return `shopping-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ShoppingList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newName, setNewName] = useState('');
  const appliedAddItems = useRef(false);

  useEffect(() => {
    setItems(getShoppingList());
  }, []);

  useEffect(() => {
    const state = location.state as { addItems?: string[] } | undefined;
    if (state?.addItems?.length && !appliedAddItems.current) {
      appliedAddItems.current = true;
      const list = getShoppingList();
      const existing = new Set(list.map((i) => i.name.toLowerCase()));
      const toAdd: ShoppingItem[] = state.addItems
        .filter((n) => !existing.has(n.toLowerCase()))
        .map((name) => ({ id: genId(), name, checked: false, addedAt: Date.now() }));
      const next = [...list, ...toAdd];
      setShoppingList(next);
      setItems(next);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    const next = [...items, { id: genId(), name, checked: false, addedAt: Date.now() }];
    setShoppingList(next);
    setItems(next);
    setNewName('');
  };

  const toggle = (id: string) => {
    const next = items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    setShoppingList(next);
    setItems(next);
  };

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setShoppingList(next);
    setItems(next);
  };

  const clearDone = () => {
    const next = items.filter((i) => !i.checked);
    setShoppingList(next);
    setItems(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="添加一项"
          className="flex-1 px-4 py-3 rounded-2xl liquid-card border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          type="button"
          onClick={addItem}
          className="pill-button px-5 py-3 rounded-2xl text-white font-semibold shrink-0"
        >
          添加
        </button>
      </div>
      <div className="liquid-card rounded-3xl p-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-glass-secondary text-sm text-center py-6">暂无项目</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(item.id)}
                className="rounded-full w-6 h-6 border-2 border-white/40 bg-white/10 text-primary accent-primary"
              />
              <span
                className={`flex-1 font-medium ${
                  item.checked ? 'line-through text-glass-secondary' : 'text-white'
                }`}
              >
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-red-300 text-sm active:opacity-80"
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>
      {items.some((i) => i.checked) && (
        <button
          type="button"
          onClick={clearDone}
          className="w-full py-3 rounded-full liquid-card text-glass-secondary text-sm font-medium hover:bg-white/20"
        >
          清除已勾选
        </button>
      )}
    </div>
  );
}
