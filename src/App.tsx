import { useState, useEffect } from 'react';

/**
 * 智能資訊牆 V10.0 Elite
 * 優化重點：
 * 1. 導入毛玻璃 (Glassmorphism) 導覽列
 * 2. 強化卡片懸浮動畫與陰影層次
 * 3. 優化圖片縮圖裁切比例
 * 4. 提升 TypeScript 型別嚴謹度
 */

interface ItemData {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  content: string;
  date: string;
  time: string;
  url: string;
  icon: string;
  color: string;
}

interface LiffProfile {
  pictureUrl?: string;
  displayName: string;
}

declare global {
  interface Window {
    liff: any;
  }
}

export default function App() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [filter, setFilter] = useState<string>('全部');
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = '2009406684-H9fk9ysT';

  const getThumbnail = (url: string): string | null => {
    if (!url || !url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : null;
  };

  useEffect(() => {
    const initLiff = async () => {
      if (window.liff) {
        try {
          await window.liff.init({ liffId: LIFF_ID });
          if (window.liff.isLoggedIn()) {
            const p = await window.liff.getProfile();
            setProfile(p as LiffProfile);
          }
        } catch (err) {
          console.error("LIFF 初始化失敗", err);
        }
      }
    };

    const fetchData = async () => {
      try {
        const res = await fetch(GAS_API_URL, { redirect: 'follow' });
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data as ItemData[]);
        }
      } catch (err) {
        console.error("讀取資料失敗", err);
      } finally {
        setIsLoading(false);
      }
    };

    initLiff();
    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
    const typeMap: Record<string, string> = { '全部': 'all', '郵件': 'email', '檔案': 'file', '連結': 'link' };
    return filter === '全部' ? true : item.type === typeMap[filter];
  });

  const handleCardClick = (url: string) => {
    if (!url || url === '#') return;
    if (window.liff && window.liff.isInClient()) {
      window.liff.openWindow({ url, external: false });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans pb-24 selection:bg-indigo-100">
      <header className="bg-white/70 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-200/50 transition-all">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200/50">📋</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-800">智能資訊牆</h1>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] hidden sm:block">Professional Dashboard V10</p>
            </div>
          </div>
          {profile && (
            <div className="flex items-center gap-2 bg-white/50 p-1.5 pr-4 rounded-2xl border border-slate-200/60 shadow-sm">
              <img src={profile.pictureUrl} className="w-8 h-8 rounded-xl object-cover border-2 border-white shadow-inner" alt="User" />
              <span className="text-xs font-black text-slate-700 hidden sm:block">{profile.displayName}</span>
            </div>
          )}
        </div>
        
        <div className="max-w-[1920px] mx-auto px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['全部', '郵件', '檔案', '連結'].map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-6 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-300 ${
                filter === t 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 ring-2 ring-slate-900 ring-offset-2' 
                : 'bg-white text-slate-400 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto p-6 lg:p-12">
        {isLoading ? (
          <div className="py-60 text-center flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-xl">☁️</div>
            </div>
            <p className="text-sm font-black text-slate-300 tracking-widest animate-pulse uppercase">Syncing Cloud Database</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-50 shadow-inner">
            <div className="text-6xl mb-6 grayscale opacity-20">📭</div>
            <p className="font-black text-slate-300 tracking-tighter">當前分類暫無紀錄</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 items-start">
            {filteredItems.map(item => {
              const thumb = getThumbnail(item.url);
              return (
                <div 
                  key={item.id} 
                  onClick={() => handleCardClick(item.url)}
                  className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-3 transition-all duration-500 overflow-hidden relative cursor-pointer flex flex-col"
                >
                  {item.type === 'file' && thumb && (
                    <div className="w-full h-40 bg-slate-50 overflow-hidden">
                      <img src={thumb} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" alt="預覽" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  
                  <div className="p-7 flex flex-col relative">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${item.color || 'bg-slate-100 text-slate-500'}`}>
                        <span>{item.icon}</span>
                        <span>{item.type === 'email' ? '郵件' : item.type === 'file' ? '檔案' : '連結'}</span>
                      </div>
                      <div className="text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-1 rounded-lg">
                        {item.date ? item.date.split('T')[0] : '無日期'}
                      </div>
                    </div>
                    
                    <h2 className="text-lg font-black text-slate-800 leading-tight mb-2 line-clamp-2 min-h-[56px] group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h2>
                    <h3 className="text-[11px] font-black text-slate-400 mb-5 truncate uppercase tracking-widest">{item.subtitle}</h3>
                    
                    <div className="bg-slate-50/80 rounded-3xl p-5 text-xs text-slate-600 leading-relaxed font-bold min-h-[100px] line-clamp-4 border border-slate-100/30 group-hover:bg-indigo-50/30 transition-colors">
                      {item.content}
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-200 group-hover:text-slate-900 transition-colors uppercase tracking-widest">Detail View ↗</span>
                       <span className="w-2 h-2 rounded-full bg-slate-100 group-hover:bg-indigo-500 transition-colors animate-pulse" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-20">
        <div className="inline-block px-8 py-2 bg-slate-100/50 rounded-full border border-slate-200/50">
          <p className="text-[10px] font-black tracking-[0.6em] text-slate-300 uppercase">End of Enterprise Console</p>
        </div>
      </footer>
    </div>
  );
}
