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

  // 輔助函式：將 Google Drive 連結轉換為縮圖連結
  const getThumbnail = (url: string) => {
    if (!url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : null;
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

  // 語意對照表
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">📋</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-800">智能資訊牆</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">系統穩定版本 v8.1</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-1 mr-4 border-r border-slate-200 pr-4">
              {['全部', '郵件', '檔案', '連結'].map(t => (
                <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === t ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
                  {t}
                </button>
              ))}
            </nav>
            {profile && (
              <div className="flex items-center gap-2 bg-slate-50 p-1 pr-3 rounded-full border border-slate-200">
                <img src={profile.pictureUrl} className="w-7 h-7 rounded-full shadow-sm" alt="" />
                <span className="text-[10px] font-bold text-slate-600 hidden sm:block">{profile.displayName}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 手機版篩選列 */}
        <div className="md:hidden px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['全部', '郵件', '檔案', '連結'].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-6 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filter === t ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="py-40 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="font-bold text-slate-300 text-sm">正在同步最新資料...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filtered.map(item => {
              const thumb = getThumbnail(item.url);
              return (
                <div key={item.id} onClick={() => handleOpen(item.url)} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden">
                  
                  {/* 若有縮圖則顯示 */}
                  {item.type === 'file' && thumb && (
                    <div className="w-full h-48 overflow-hidden bg-slate-100">
                      <img src={thumb} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="預覽圖" />
                    </div>
                  )}

                  <div className="p-7">
                    <div className="flex justify-between items-center mb-6">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.color || 'bg-slate-100'}`}>
                        <span>{item.icon}</span>
                        <span>{item.type === 'email' ? '郵件/文字' : item.type === 'file' ? '檔案/照片' : '網址連結'}</span>
                      </div>
                      <div className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-md">
                        {item.date?.split('T')[0]}
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {item.title}
                    </h2>
                    <h3 className="text-xs font-bold text-slate-400 mb-6">{item.subtitle}</h3>
                    
                    <div className="bg-slate-50/50 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed font-medium border border-slate-100/50 min-h-[80px]">
                      {item.content}
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center border-t border-slate-50 pt-4">
                      <span className="text-[10px] font-black text-slate-300 group-hover:text-slate-900 transition-colors uppercase italic">點擊開啟內容 ↗</span>
                      <span className="text-[10px] font-bold text-slate-200">{item.time?.split('T')[1]?.substring(0, 5)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      <div className="text-center py-10 opacity-20">
        <p className="text-[10px] font-black tracking-[0.3em] text-slate-400">END OF INFORMATION WALL</p>
      </div>
    </div>
  );
}
