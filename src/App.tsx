import { useState, useEffect } from 'react';

// 宣告全域 window.liff 型別定義
declare global {
  interface Window {
    liff: any;
  }
}

// 定義資料列型別
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
  subcategory?: string;
}

export default function App() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [filter, setFilter] = useState('all');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 硬編碼設定：請確保與後端及 LINE Developer 設定一致
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = '2009406684-H9fk9ysT';

  useEffect(() => {
    const initSystem = async () => {
      // 1. 初始化 LIFF
      try {
        if (window.liff) {
          await window.liff.init({ liffId: LIFF_ID });
          if (window.liff.isLoggedIn()) {
            const userProfile = await window.liff.getProfile();
            setProfile(userProfile);
          } else {
            // 非 LINE 環境或未登入時可選擇自動登入
            // window.liff.login(); 
          }
        }
      } catch (e) {
        console.error("LIFF 初始化失敗", e);
      }

      // 2. 抓取 GAS 資料
      try {
        const response = await fetch(GAS_URL, { redirect: 'follow' });
        const data = await response.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      } catch (e) {
        console.error("資料讀取失敗", e);
      } finally {
        setIsLoading(false);
      }
    };

    initSystem();
  }, []);

  const filteredItems = items.filter(item => filter === 'all' ? true : item.type === filter);

  const handleCardAction = (url: string) => {
    if (!url || url === '#') return;
    
    if (window.liff && window.liff.isInClient()) {
      window.liff.openWindow({ url: url, external: false });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 selection:bg-indigo-100">
      {/* 頂部導覽列 */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-md mx-auto px-5 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter">智能資訊牆</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version 8.0 Stable</p>
          </div>
          {profile && (
            <img 
              src={profile.pictureUrl} 
              alt="User" 
              className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm"
            />
          )}
        </div>
        
        {/* 分類篩選按鈕 */}
        <div className="max-w-md mx-auto px-5 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['all', 'email', 'file', 'link'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === t 
                ? 'bg-slate-800 text-white shadow-lg ring-2 ring-slate-800 ring-offset-2' 
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? '全部' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* 主內容區塊 */}
      <main className="max-w-md mx-auto p-5 space-y-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400">同步雲端資料中...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-sm font-bold text-slate-300">目前沒有相關紀錄</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardAction(item.url)}
              className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden active:scale-[0.97] transition-all cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.color || 'bg-slate-100 text-slate-600'}`}>
                    {item.icon} {item.type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">
                    {item.date} {item.time}
                  </span>
                </div>
                
                <h2 className="text-lg font-black text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h2>
                <h3 className="text-xs font-bold text-slate-400 mb-4">{item.subtitle}</h3>
                
                <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 leading-relaxed border border-slate-50 font-medium">
                  {item.content}
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <footer className="max-w-md mx-auto text-center py-6">
        <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">
          End of Information Wall
        </p>
      </footer>
    </div>
  );
}
