import { useState, useEffect } from 'react';

/**
 * 智能資訊牆 V10.3 Elite (全自檢修復版)
 * 修正項目：
 * 1. 移除 window.confirm 與 alert，改用內建 Modal
 * 2. 修正 TypeScript 潛在型別衝突
 * 3. 強化行動裝置雙欄佈局
 */

interface ItemData {
  id: string; type: string; title: string; subtitle: string; content: string;
  date: string; time: string; url: string; icon: string; color: string;
}

interface LiffProfile { pictureUrl?: string; displayName: string; }

declare global { interface Window { liff: any; } }

export default function App() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [filter, setFilter] = useState<string>('全部');
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // UI 狀態控制
  const [confirmDelete, setConfirmDelete] = useState<{id: string, url: string} | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

  useEffect(() => {
    const init = async () => {
      if (window.liff) {
        try {
          await window.liff.init({ liffId: LIFF_ID });
          if (window.liff.isLoggedIn()) setProfile(await window.liff.getProfile());
        } catch (e) { console.error(e); }
      }
      fetchData();
    };
    init();
  }, []);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsProcessing(true);
    try {
      const target = `${GAS_URL}?action=delete&id=${confirmDelete.id}&url=${encodeURIComponent(confirmDelete.url)}`;
      const res = await fetch(target, { redirect: 'follow' });
      const result = await res.json();
      if (result.success) {
        setItems(prev => prev.filter(i => i.id !== confirmDelete.id));
        setMessage("刪除成功");
      } else {
        setMessage("刪除失敗，請檢查權限");
      }
    } catch (e) {
      setMessage("網路連線錯誤");
    } finally {
      setIsProcessing(false);
      setConfirmDelete(null);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const getThumbnail = (url: string) => {
    if (!url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400` : null;
  };

  const filterMap: Record<string, string> = { '全部': 'all', '郵件': 'email', '檔案': 'file', '連結': 'link' };
  const filtered = items.filter(i => filter === '全部' ? true : i.type === filterMap[filter]);

  const handleOpen = (url: string) => {
    if (!url || url === '#') return;
    if (window.liff?.isInClient()) window.liff.openWindow({ url, external: false });
    else window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {/* 導覽列 */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/50">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">📋</div>
            <h1 className="text-lg font-black tracking-tighter">智能資訊牆</h1>
          </div>
          {profile && (
            <div className="flex items-center gap-2 bg-white p-1 pr-3 rounded-xl border border-slate-200">
              <img src={profile.pictureUrl} className="w-6 h-6 rounded-lg object-cover" alt="" />
              <span className="text-[10px] font-black hidden xs:block">{profile.displayName}</span>
            </div>
          )}
        </div>
        <div className="max-w-[1920px] mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
          {['全部', '郵件', '檔案', '連結'].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all ${filter === t ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200/60'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* 主網格區 */}
      <main className="max-w-[1920px] mx-auto p-3 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="py-40 text-center text-slate-300 font-black animate-pulse">數據同步中</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 items-start">
            {filtered.map(item => {
              const thumb = getThumbnail(item.url);
              return (
                <div key={item.id} onClick={() => handleOpen(item.url)} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer flex flex-col relative">
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({id: item.id, url: item.url}); }} className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  {item.type === 'file' && thumb && (
                    <div className="w-full h-24 sm:h-28 bg-slate-50 overflow-hidden border-b border-slate-50">
                      <img src={thumb} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${item.color || 'bg-slate-100'}`}>{item.icon} {item.type === 'email' ? '郵件' : item.type === 'file' ? '檔案' : '連結'}</div>
                      <span className="text-[8px] font-bold text-slate-300">{item.date?.slice(5)}</span>
                    </div>
                    <h2 className="text-xs sm:text-sm font-black text-slate-800 leading-tight mb-1 line-clamp-2 min-h-[32px]">{item.title}</h2>
                    <div className="bg-slate-50 rounded-lg p-2 text-[10px] text-slate-500 line-clamp-3 min-h-[48px]">{item.content}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 自定義 Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black mb-2 text-slate-800">確認刪除？</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">此動作將同步移除試算表紀錄與雲端硬碟檔案，刪除後無法還原。</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200">取消</button>
              <button onClick={executeDelete} disabled={isProcessing} className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-black text-sm shadow-lg shadow-red-200 active:scale-95 transition-all">
                {isProcessing ? '刪除中...' : '確定刪除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 訊息通知 */}
      {message && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-black shadow-xl animate-bounce">
          {message}
        </div>
      )}
    </div>
  );
}
