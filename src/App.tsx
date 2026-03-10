import { useState, useEffect } from 'react';

declare global { interface Window { liff: any; } }

interface ItemData {
  id: string; type: string; title: string; subtitle: string; content: string;
  date: string; time: string; url: string; icon: string; color: string; subcategory?: string;
}

export default function App() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [filter, setFilter] = useState('all');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = '2009406684-H9fk9ysT';

  useEffect(() => {
    const init = async () => {
      try {
        if (window.liff) {
          await window.liff.init({ liffId: LIFF_ID });
          if (window.liff.isLoggedIn()) setProfile(await window.liff.getProfile());
        }
      } catch (e) { console.error(e); }

      try {
        const res = await fetch(GAS_URL, { redirect: 'follow' });
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      setIsLoading(false);
    };
    init();
  }, []);

  const filtered = items.filter(i => filter === 'all' ? true : i.type === filter);

  const handleOpen = (url: string) => {
    if (!url || url === '#') return;
    if (window.liff?.isInClient()) window.liff.openWindow({ url, external: false });
    else window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      {/* 導覽列：手機置頂，電腦加寬 */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">📊</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">智能資訊牆</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Enterprise Management Console</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 分類篩選：在電腦版會更寬鬆 */}
            <nav className="hidden md:flex gap-2 mr-4 border-r border-slate-200 pr-4">
              {['all', 'email', 'file', 'link'].map(t => (
                <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === t ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
                  {t.toUpperCase()}
                </button>
              ))}
            </nav>
            {profile && (
              <div className="flex items-center gap-3 bg-slate-100 p-1 pr-4 rounded-full border border-slate-200">
                <img src={profile.pictureUrl} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" />
                <span className="text-xs font-bold text-slate-600 hidden sm:block">{profile.displayName}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 手機版專用分類列 */}
        <div className="md:hidden px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['all', 'email', 'file', 'link'].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === t ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
              {t === 'all' ? '全部' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* 主內容：電腦版自動變為 3 欄 */}
      <main className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="py-40 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
            <p className="font-black text-slate-300">系統同步中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(item => (
              <div key={item.id} onClick={() => handleOpen(item.url)} className="group bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-6">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.color || 'bg-slate-100 text-slate-500'}`}>
                    <span>{item.icon}</span>
                    <span>{item.type}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-lg">
                    {item.date?.split('T')[0]}
                  </div>
                </div>
                
                <h2 className="text-lg font-black text-slate-800 leading-tight mb-2 group-hover:text-slate-600">{item.title}</h2>
                <h3 className="text-xs font-bold text-slate-400 mb-5">{item.subtitle}</h3>
                
                <div className="bg-slate-50 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed font-medium border border-slate-100/50">
                  {item.content}
                </div>
                
                <div className="mt-5 flex justify-end">
                  <span className="text-[10px] font-black text-slate-300 group-hover:text-slate-900 transition-colors uppercase italic">Click to open ↗</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
