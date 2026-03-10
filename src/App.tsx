import { useState, useEffect } from 'react';

/**
 * 智能資訊牆 V10.2 Elite (具備同步刪除功能)
 * 優化重點：
 * 1. 新增同步刪除按鈕 (具備二次確認)
 * 2. 聯動 GAS 進行試算表與 Drive 檔案清理
 * 3. 優化手機版操作手感
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

declare global { interface Window { liff: any; } }

export default function App() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [filter, setFilter] = useState<string>('全部');
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = '2009406684-H9fk9ysT';

  const fetchData = async () => {
    try {
      const res = await fetch(GAS_URL, { redirect: 'follow' });
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const initLiff = async () => {
    if (window.liff) {
      try {
        await window.liff.init({ liffId: LIFF_ID });
        if (window.liff.isLoggedIn()) setProfile(await window.liff.getProfile());
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    initLiff();
    fetchData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation(); // 防止觸發卡片點擊
    if (!window.confirm('確定要刪除此項目嗎？如果是檔案，雲端硬碟中的正本也會一併移除。')) return;
    
    setIsDeleting(id);
    try {
      const target = `${GAS_URL}?action=delete&id=${id}&url=${encodeURIComponent(url)}`;
      const res = await fetch(target, { redirect: 'follow' });
      const result = await res.json();
      if (result.success) {
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        alert('刪除失敗，請檢查權限設定。');
      }
    } catch (e) {
      alert('網路錯誤，請重試。');
    } finally {
      setIsDeleting(null);
    }
  };

  const getThumbnail = (url: string) => {
    if (!url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400` : null;
  };

  const filterMap: any = { '全部': 'all', '郵件': 'email', '檔案': 'file', '連結': 'link' };
  const filtered = items.filter(i => filter === '全部' ? true : i.type === filterMap[filter]);

  const handleOpen = (url: string) => {
    if (!url || url === '#') return;
    if (window.liff?.isInClient()) window.liff.openWindow({ url, external: false });
    else window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10 selection:bg-indigo-100">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/50">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg shadow-md">📋</div>
            <h1 className="text-lg font-black tracking-tighter text-slate-800">智能資訊牆</h1>
          </div>
          {profile && (
            <div className="flex items-center gap-2 bg-white/50 p-1 pr-3 rounded-xl border border-slate-200/60">
              <img src={profile.pictureUrl} className="w-6 h-6 rounded-lg object-cover" alt="" />
              <span className="text-[10px] font-black text-slate-700 hidden xs:block">{profile.displayName}</span>
            </div>
          )}
        </div>
        <div className="max-w-[1920px] mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
          {['全部', '郵件', '檔案', '連結'].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all duration-200 ${filter === t ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200/60 hover:text-slate-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto p-3 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="py-40 text-center flex flex-col items-center gap-4 animate-pulse text-slate-300 font-black">同步雲端數據中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-300 font-bold">目前無紀錄</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 items-start">
            {filtered.map(item => {
              const thumb = getThumbnail(item.url);
              return (
                <div key={item.id} onClick={() => handleOpen(item.url)} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col relative">
                  
                  {/* 刪除按鈕 */}
                  <button 
                    onClick={(e) => handleDelete(e, item.id, item.url)}
                    className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    disabled={isDeleting === item.id}
                  >
                    {isDeleting === item.id ? '...' : '✕'}
                  </button>

                  {item.type === 'file' && thumb && (
                    <div className="w-full h-24 sm:h-28 bg-slate-50 overflow-hidden">
                      <img src={thumb} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    </div>
                  )}
                  <div className="p-3 sm:p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-50">
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${item.color || 'bg-slate-100 text-slate-500'}`}>
                        <span>{item.icon}</span>
                        <span>{item.type === 'email' ? '郵件' : item.type === 'file' ? '檔案' : '連結'}</span>
                      </div>
                    </div>
                    <h2 className="text-xs sm:text-sm font-black text-slate-800 leading-tight mb-1 line-clamp-2 min-h-[32px] group-hover:text-indigo-600 transition-colors">{item.title}</h2>
                    <div className="bg-slate-50/80 rounded-lg p-2 text-[10px] text-slate-500 leading-snug font-medium line-clamp-3 min-h-[48px] border border-slate-100/30">{item.content}</div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-300">{item.date?.slice(5)}</span>
                      <span className="text-[8px] font-black text-slate-200 group-hover:text-indigo-500 uppercase">Detail ↗</span>
                    </div>
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
