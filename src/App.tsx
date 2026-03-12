import { useState, useEffect, useCallback } from 'react';

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
  const [keyword, setKeyword] = useState<string>('');
  
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [editingItem, setEditingItem] = useState<ItemData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{id: string, url: string} | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = '2009406684-H9fk9ysT';

  const fetchData = useCallback(async (searchKw = '', pageNum = 1) => {
    setIsLoading(true);
    try {
      let url = `${GAS_URL}?limit=20&page=${pageNum}`;
      if (searchKw) url += `&keyword=${encodeURIComponent(searchKw)}`;
      const res = await fetch(url, { redirect: 'follow' });
      const data = await res.json();
      if (Array.isArray(data)) {
        if (pageNum === 1) setItems(data);
        else setItems(prev => [...prev, ...data]);
        setHasMore(data.length === 20);
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [GAS_URL]);

  useEffect(() => {
    const init = async () => {
      if (window.liff) {
        try {
          await window.liff.init({ liffId: LIFF_ID });
          if (window.liff.isLoggedIn()) setProfile(await window.liff.getProfile());
        } catch (e) { console.error(e); }
      }
      fetchData('', 1);
    };
    init();
  }, [fetchData]);

  useEffect(() => {
    if (page > 1) fetchData(keyword, page);
  }, [page, keyword, fetchData]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (!isLoading && hasMore) setPage(p => p + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);
      const target = `${GAS_URL}?action=deleteBatch&ids=${encodeURIComponent(JSON.stringify(idsArray))}`;
      const res = await fetch(target, { redirect: 'follow' });
      const result = await res.json();
      if (result.success) {
        setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
        setMessage(`已刪除 ${selectedIds.size} 筆資料`);
        setSelectedIds(new Set());
        setIsManageMode(false);
      } else {
        setMessage("批次刪除失敗");
      }
    } catch (e) { setMessage("網路連線錯誤"); }
    setIsProcessing(false);
    setTimeout(() => setMessage(null), 2000);
  };

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
    } catch (e) { setMessage("網路連線錯誤"); }
    setIsProcessing(false);
    setConfirmDelete(null);
    setTimeout(() => setMessage(null), 2000);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setIsProcessing(true);
    try {
      const params = new URLSearchParams();
      params.append('action', 'updateFull');
      params.append('id', editingItem.id);
      params.append('title', encodeURIComponent(editingItem.title));
      params.append('content', encodeURIComponent(editingItem.content));
      params.append('type', editingItem.type);

      const res = await fetch(`${GAS_URL}?${params.toString()}`, { redirect: 'follow', method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setItems(prev => prev.map(i => i.id === editingItem.id ? editingItem : i));
        setMessage("更新成功");
      } else {
        setMessage("更新失敗");
      }
    } catch (e) { setMessage("網路錯誤"); }
    setIsProcessing(false);
    setEditingItem(null);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleToggleTodo = async (id: string, currentContent: string, lineIndex: number) => {
    const lines = currentContent.split('\n');
    if (lines[lineIndex].includes('- [ ]')) lines[lineIndex] = lines[lineIndex].replace('- [ ]', '- [x]');
    else if (lines[lineIndex].includes('- [x]')) lines[lineIndex] = lines[lineIndex].replace('- [x]', '- [ ]');
    const newContent = lines.join('\n');
    
    setItems(prev => prev.map(item => item.id === id ? { ...item, content: newContent } : item));
    fetch(`${GAS_URL}?action=updateFull&id=${id}&content=${encodeURIComponent(newContent)}`, { redirect: 'follow', method: 'POST' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData(keyword, 1);
  };

  const handleExport = () => window.open(`${GAS_URL}?action=export`, '_blank');

  const getThumbnail = (url: string) => {
    if (!url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400` : null;
  };

  const filterMap: Record<string, string> = { '全部': 'all', '待辦': 'todo', '行程': 'event', '好文': 'article', '檔案': 'file' };
  const filtered = items.filter(i => filter === '全部' ? true : i.type === filterMap[filter]);

  return (
    <div className={`min-h-screen font-sans pb-10 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'}`}>
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">📋</div>
            <h1 className="text-lg font-black tracking-tighter hidden sm:block">智能資訊牆 V11.3</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => { setIsManageMode(!isManageMode); setSelectedIds(new Set()); }} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${isManageMode ? 'bg-indigo-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>
              批次管理
            </button>
            <button onClick={handleExport} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-black hover:bg-emerald-600 transition-colors">
              匯出 CSV
            </button>
            {profile && <img src={profile.pictureUrl} className="w-8 h-8 rounded-lg object-cover border border-slate-200" alt="" />}
          </div>
        </div>
        
        <div className="max-w-[1920px] mx-auto px-4 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {['全部', '待辦', '行程', '好文', '檔案'].map(t => (
              <button key={t} onClick={() => { setFilter(t); setPage(1); }} className={`px-4 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all ${filter === t ? 'bg-indigo-600 text-white shadow-md' : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-400 border border-slate-200/60')}`}>
                {t}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜尋關鍵字..." className={`px-3 py-1.5 rounded-lg text-sm focus:outline-none w-full sm:w-48 transition-colors ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white border-slate-200'}`} />
            <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold">搜尋</button>
          </form>
        </div>
        
        {isManageMode && (
          <div className={`px-4 py-2 border-t flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-indigo-50/50'}`}>
            <span className="text-sm font-bold text-indigo-500">已選擇 {selectedIds.size} 筆</span>
            <button onClick={handleBatchDelete} disabled={selectedIds.size === 0} className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold disabled:opacity-50">刪除選取項目</button>
          </div>
        )}
      </header>

      <main className="max-w-[1920px] mx-auto p-3 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {filtered.map(item => {
            const thumb = getThumbnail(item.url);
            const isSelected = selectedIds.has(item.id);
            return (
              <div key={item.id} onClick={() => isManageMode && toggleSelection(item.id)} className={`group rounded-2xl border shadow-sm transition-all overflow-hidden flex flex-col relative ${isManageMode ? 'cursor-pointer' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
                
                {!isManageMode && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingItem(item)} className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">✏️</button>
                    <button onClick={() => setConfirmDelete({id: item.id, url: item.url})} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                  </div>
                )}
                
                {item.type === 'file' && thumb && (
                  <div onClick={(e) => { if (!isManageMode) window.open(item.url); e.stopPropagation(); }} className="w-full h-32 overflow-hidden cursor-pointer">
                    <img src={thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${item.color || 'bg-slate-100 text-slate-600'} ${isDarkMode && item.color.includes('slate') ? 'bg-slate-700 text-slate-300' : ''}`}>
                      {item.icon} {item.type.toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{item.date} {item.time}</span>
                  </div>

                  <h2 onClick={(e) => { if (!isManageMode && item.type !== 'todo') window.open(item.url); e.stopPropagation(); }} className={`text-base font-black leading-tight mb-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'} ${item.type !== 'todo' && !isManageMode ? 'cursor-pointer hover:text-indigo-500' : ''}`}>{item.title}</h2>
                  
                  {item.type === 'todo' ? (
                    <div className="space-y-2 mt-3">
                      {item.content.split('\n').map((line, idx) => {
                        const isChecked = line.includes('- [x]');
                        const isTodo = line.includes('- [ ]') || isChecked;
                        if (!isTodo) return <p key={idx} className="text-xs text-slate-500">{line}</p>;
                        return (
                          <div key={idx} className="flex items-start gap-2 cursor-pointer group/todo" onClick={(e) => { if (!isManageMode) handleToggleTodo(item.id, item.content, idx); e.stopPropagation(); }}>
                            <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-400 group-hover/todo:border-indigo-400'}`}>
                              {isChecked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-sm font-medium ${isChecked ? 'text-slate-500 line-through' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{line.replace(/- \[(x| )\] /, '')}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`rounded-xl p-3 text-xs font-medium leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap ${isDarkMode ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                      {item.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {isLoading && <div className="py-10 text-center text-slate-400 font-bold animate-pulse">載入中...</div>}
      </main>

      {editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`rounded-[2rem] p-6 w-full max-w-md shadow-2xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className="text-lg font-black mb-4">編輯紀錄</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">分類</label>
                <select value={editingItem.type} onChange={e => setEditingItem({...editingItem, type: e.target.value})} className={`w-full p-2 rounded-xl text-sm outline-none border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                  <option value="article">好文</option><option value="todo">待辦</option>
                  <option value="event">行程</option><option value="file">檔案</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">標題</label>
                <input type="text" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className={`w-full p-2 rounded-xl text-sm outline-none border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">內容</label>
                <textarea rows={5} value={editingItem.content} onChange={e => setEditingItem({...editingItem, content: e.target.value})} className={`w-full p-2 rounded-xl text-sm outline-none border resize-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingItem(null)} className={`flex-1 py-2.5 rounded-xl font-black text-sm ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}>取消</button>
              <button onClick={saveEdit} disabled={isProcessing} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-sm shadow-lg active:scale-95 transition-all">儲存變更</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className={`rounded-[2rem] p-8 max-w-sm w-full shadow-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>確認刪除？</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">刪除後無法還原。</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className={`flex-1 py-3 rounded-2xl font-black text-sm ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>取消</button>
              <button onClick={executeDelete} disabled={isProcessing} className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-black text-sm shadow-lg active:scale-95">確定刪除</button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] bg-indigo-600 text-white px-6 py-3 rounded-full text-xs font-black shadow-xl animate-bounce">{message}</div>}
    </div>
  );
}
