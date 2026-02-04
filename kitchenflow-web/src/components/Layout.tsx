import { useLocation, useNavigate } from 'react-router-dom';

const titles: Record<string, string> = {
  '/': 'KitchenFlow',
  '/scan': '扫描冰箱',
  '/scan-results': '扫描结果',
  '/cravings': '想吃清单',
  '/shopping': '购物清单',
  '/inventory': '库存',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const title = titles[path] ?? 'KitchenFlow';
  const showBack = path !== '/';

  const scrollBottomPadding = path === '/scan-results' ? 'pb-44' : 'pb-8';

  return (
    <div className="immersive-bg fixed inset-0 min-h-[100dvh]">
      <div className="immersive-overlay absolute inset-0 z-0" />
      <div
        className={`relative z-10 flex min-h-full w-full flex-col overflow-y-auto overflow-x-hidden no-scrollbar ${scrollBottomPadding}`}
      >
        <header className="sticky top-0 z-50 flex w-full items-center justify-between px-5 pt-6 pb-4 shrink-0">
          {showBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="liquid-card flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-transform text-white"
            >
              <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
            </button>
          ) : (
            <div className="size-10 shrink-0" />
          )}
          <h1 className="text-glass-primary text-lg font-bold tracking-wide truncate">
            {title}
          </h1>
          <div className="size-10 shrink-0" />
        </header>

        <main className="flex-1 w-full min-w-0 px-5 pt-2">
          {children}
        </main>
      </div>
    </div>
  );
}
