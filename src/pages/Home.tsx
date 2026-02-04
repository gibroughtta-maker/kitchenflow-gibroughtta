import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-8 pt-2">
      <div className="text-center py-6">
        <p className="text-glass-secondary text-sm">
          拍冰箱 → AI 识别食材 → 推荐食谱与购物清单
        </p>
      </div>
      <Link
        to="/scan"
        className="block w-full liquid-card rounded-3xl p-6 text-center hover:bg-white/20 active:scale-[0.98] transition-all border border-white/30"
      >
        <span className="material-symbols-outlined text-4xl mb-3 block">add_photo_alternate</span>
        <span className="font-bold text-glass-primary text-lg">上传照片 · 扫描冰箱</span>
        <p className="text-sm text-glass-secondary mt-1">选择 1～5 张照片，AI 识别食材与新鲜度</p>
      </Link>
      <div className="grid grid-cols-3 gap-3">
        <Link
          to="/cravings"
          className="liquid-card rounded-2xl p-4 text-center hover:bg-white/20 active:scale-[0.98] transition"
        >
          <span className="material-symbols-outlined text-2xl block mb-1">restaurant</span>
          <span className="text-sm font-semibold text-glass-primary">想吃</span>
        </Link>
        <Link
          to="/shopping"
          className="liquid-card rounded-2xl p-4 text-center hover:bg-white/20 active:scale-[0.98] transition"
        >
          <span className="material-symbols-outlined text-2xl block mb-1">shopping_cart</span>
          <span className="text-sm font-semibold text-glass-primary">购物</span>
        </Link>
        <Link
          to="/inventory"
          className="liquid-card rounded-2xl p-4 text-center hover:bg-white/20 active:scale-[0.98] transition"
        >
          <span className="material-symbols-outlined text-2xl block mb-1">kitchen</span>
          <span className="text-sm font-semibold text-glass-primary">库存</span>
        </Link>
      </div>
    </div>
  );
}
