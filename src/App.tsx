import { useState, useEffect } from 'react';

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
  
  const [confirmDelete, setConfirmDelete] = useState<{id: string, url: string} | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 請替換為新的 GAS URL
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
        setMessage("刪除失敗");
      }
    } catch (e) {
      setMessage("網路連線錯誤");
    } finally {
      setIsProcessing(false);
      setConfirmDelete(null);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleToggleTodo = async (id: string, currentContent: string, lineIndex: number) => {
    const lines = currentContent.split('\n');
    if (lines[lineIndex].includes('- [ ]')) {
      lines[lineIndex] = lines[lineIndex].replace('- [ ]', '- [x]');
    } else if (lines[lineIndex].includes('- [x]')) {
      lines[lineIndex] = lines[lineIndex].replace('- [x]', '- [ ]');
    }
    const newContent = lines.join('\n');
    
    setItems(prev => prev.map(item => item.id === id ? { ...item, content: newContent } : item));
    
    try {
      await fetch(`${GAS_URL}?action=update&id=${id}&content=${encodeURIComponent(newContent)}`, { redirect: 'follow', method: 'POST' });
    } catch (e) {
      setMessage("狀態更新失敗");
    }
  };

  const getThumbnail = (url: string) => {
    if (!url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400` : null;
  };

  const filterMap: Record<string, string> = { '全部': 'all', '待辦': 'todo', '行程': 'event', '好文': 'article', '檔案': 'file' };
  const filtered = items.filter(i => filter === '全部' ? true : i.type === filterMap[filter]);

  const handleOpen = (url: string) => {
    if (!url || url === '#') return;
    if (window.liff?.isInClient()) window.liff.openWindow({ url, external: false });
    else window.open(url, '_blank');
  };

  const generateCalendarUrl = (title: string, details: string) => {
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', title);
    url.searchParams.append('details', details);
    return url.toString();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/50">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">📋</div>
            <h1 className="text-lg font-black tracking-tighter">智能資訊牆 V11</h1>
          </div>
          {profile && (
            <div className="flex items-center gap-2 bg-white p-1 pr-3 rounded-xl border border-slate-200">
              <img src={profile.pictureUrl} className="w-6 h-6 rounded-lg object-cover" alt="" />
              <span className="text-[10px] font-black hidden xs:block">{profile.displayName}</span>
            </div>
          )}
        </div>
        <div className="max-w-[1920px] mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
          {['全部', '待辦', '行程', '好文', '檔案'].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all ${filter === t ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200/60'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto p-3 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="py-40 text-center text-slate-300 font-black animate-pulse">數據同步中</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {filtered.map(item => {
              const thumb = getThumbnail(item.url);
              return (
                <div key={item.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col relative">
                  <button onClick={() => setConfirmDelete({id: item.id, url: item.url})} className="absolute top-2 right-2 z-10 w-8 h-8 bg-slate-100 hover:bg-red-500 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-colors">✕</button>
                  
                  {item.type === 'file' && thumb && (
                    <div onClick={() => handleOpen(item.url)} className="w-full h-32 bg-slate-50 overflow-hidden cursor-pointer border-b border-slate-50">
                      <img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${item.color || 'bg-slate-100 text-slate-600'}`}>
                        {item.icon} {item.type.toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{item.date} {item.time}</span>
                    </div>

                    <h2 onClick={() => item.type !== 'todo' && handleOpen(item.url)} className={`text-base font-black text-slate-800 leading-tight mb-2 ${item.type !== 'todo' ? 'cursor-pointer hover:text-indigo-600' : ''}`}>{item.title}</h2>
                    
                    {item.type === 'todo' ? (
                      <div className="space-y-2 mt-3">
                        {item.content.split('\n').map((line, idx) => {
                          const isChecked = line.includes('- [x]');
                          const isTodo = line.includes('- [ ]') || isChecked;
                          if (!isTodo) return <p key={idx} className="text-xs text-slate-500">{line}</p>;
                          const text = line.replace(/- \[(x| )\] /, '');
                          return (
                            <div key={idx} className="flex items-start gap-2 cursor-pointer group/todo" onClick={() => handleToggleTodo(item.id, item.content, idx)}>
                              <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 group-hover/todo:border-indigo-400'}`}>
                                {isChecked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className={`text-sm font-medium ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{text}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 font-medium leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                        {item.content}
                      </div>
                    )}

                    {item.type === 'event' && (
                      <a href={generateCalendarUrl(item.title, item.content)} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-black transition-colors">
                        📅 加入 Google 行事曆
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black mb-2 text-slate-800">確認刪除？</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">此動作將同步移除紀錄，刪除後無法還原。</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200">取消</button>
              <button onClick={executeDelete} disabled={isProcessing} className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-black text-sm shadow-lg shadow-red-200 active:scale-95 transition-all">
                {isProcessing ? '處理中...' : '確定刪除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-black shadow-xl animate-bounce">
          {message}
        </div>
      )}
    </div>
  );
}
