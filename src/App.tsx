import { useState, useEffect } from 'react';

declare global { interface Window { liff: any; } }

interface ItemData {
  id: string; type: string; title: string; subtitle: string; content: string;
  date: string; time: string; url: string; icon: string; color: string; subcategory?: string;
}

export default function App() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [filter, setFilter] = useState('全部');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = '2009406684-H9fk9ysT';

  const getThumbnail = (url: string) => {
    if (!url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600` : null;
  };

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

  const filterMap: any = { '全部': 'all', '郵件': 'email', '檔案': 'file', '連結': 'link' };
  const filtered = items.filter(i => filter === '全部' ? true : i.type === filterMap[filter]);

  const handleOpen = (url: string) => {
    if (!url || url === '#') return;
    if (window.liff?.isInClient()) window.liff.openWindow({ url, external: false });
    else window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/60">
        <div className="max-w-[1920px] mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg">📋</div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800">智能資訊牆</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">緊湊型版本 v9.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-1 border-r border-slate-200 pr-4">
              {['全部', '郵件', '檔案', '連結'].map(t => (
                <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === t ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
                  {t}
                </button>
              ))}
            </nav>
            {profile && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 pr-3 rounded-full border border-slate-200">
                <img src={profile.pictureUrl} className="w-7 h-7 rounded-full" alt="" />
                <span className="text-[10px] font-bold text-slate-600 hidden sm:block">{profile.displayName}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto p-6 lg:p-10">
        {isLoading ? (
          <div className="py-40 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="font-bold text-slate-300 text-sm">系統同步中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-40 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300">目前無紀錄</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
            {filtered.map(item => {
              const thumb = getThumbnail(item.url);
              return (
                <div key={item.id} onClick={() => handleOpen(item.url)} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden relative">
                  {item.type === 'file' && thumb && (
                    <div className="w-full h-36 overflow-hidden bg-slate-100">
                      <img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.color || 'bg-slate-100'}`}>
                        {item.icon} {item.type === 'email' ? '郵件' : item.type === 'file' ? '檔案' : '連結'}
                      </div>
                      <div className="text-[9px] font-bold text-slate-300">{item.date?.split('T')[0]}</div>
                    </div>
                    <h2 className="text-base font-black text-slate-800 leading-tight mb-1 line-clamp-2 min-h-[40px]">{item.title}</h2>
                    <h3 className="text-xs font-medium text-slate-400 mb-4 truncate">{item.subtitle}</h3>
                    <div className="bg-slate-50/70 rounded-xl p-4 text-xs text-slate-600 leading-relaxed font-medium min-h-[80px] line-clamp-4">{item.content}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
