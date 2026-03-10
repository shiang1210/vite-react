import React, { useState, useEffect } from 'react';

export default function App() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('全部');
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = '2009406684-H9fk9ysT';

  const mockDataFallback = [
    { id: 'm1', type: 'file', title: '系統同步中', subtitle: '請稍候', content: '目前正在從試算表取得最新資料。', date: '今日', time: '剛剛', url: '#', icon: '⏳', color: 'bg-indigo-50 text-indigo-700' }
  ];

  // 輔助函式：處理 Google Drive 縮圖
  const getThumbnail = (url) => {
    if (!url || !url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600` : null;
  };

  useEffect(() => {
    if (window.liff) {
        window.liff.init({ liffId: LIFF_ID })
            .then(() => {
                if (window.liff.isLoggedIn()) {
                    window.liff.getProfile().then(p => setProfile(p));
                }
            })
            .catch(err => console.error("LIFF 初始化失敗", err));
    }

    fetch(GAS_API_URL, { redirect: 'follow' })
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.length > 0) setItems(data);
        else setItems([]);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("讀取資料失敗", err);
        setItems(mockDataFallback);
        setIsLoading(false);
      });
  }, []);

  const filteredItems = items.filter(item => {
    const map = { '全部': 'all', '郵件': 'email', '檔案': 'file', '連結': 'link' };
    return filter === '全部' ? true : item.type === map[filter];
  });

  const handleCardClick = (url) => {
    if (url && url !== '#') {
      if (window.liff && window.liff.isInClient()) {
         window.liff.openWindow({ url: url, external: false });
      } else {
         window.open(url, '_blank');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">📋</div>
            <h1 className="text-xl font-black tracking-tighter">智能資訊牆</h1>
          </div>
          {profile && (
            <div className="flex items-center gap-2 bg-slate-100 p-1 pr-3 rounded-full border">
              <img src={profile.pictureUrl} className="w-7 h-7 rounded-full shadow-sm" alt="User" />
              <span className="text-[10px] font-bold text-slate-600 hidden sm:block">{profile.displayName}</span>
            </div>
          )}
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['全部', '郵件', '檔案', '連結'].map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all ${filter === t ? 'bg-slate-900 text-white' : 'bg-white border text-slate-400'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="py-40 text-center text-slate-300 font-bold animate-pulse tracking-widest">系統連線中</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
            {filteredItems.map(item => {
              const thumb = getThumbnail(item.url);
              return (
                <div 
                  key={item.id} 
                  onClick={() => handleCardClick(item.url)}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden relative cursor-pointer"
                >
                  {item.type === 'file' && thumb && (
                    <div className="w-full h-36 bg-slate-100 overflow-hidden">
                      <img src={thumb} className="w-full h-full object-cover" alt="縮圖" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.color}`}>
                        {item.icon} {item.type === 'email' ? '郵件' : item.type === 'file' ? '檔案' : '連結'}
                      </div>
                      <div className="text-[9px] font-bold text-slate-300">{item.date?.split('T')[0]}</div>
                    </div>
                    <h2 className="text-base font-black text-slate-800 leading-tight mb-1 line-clamp-2 min-h-[40px]">{item.title}</h2>
                    <h3 className="text-xs font-medium text-slate-400 mb-4 truncate">{item.subtitle}</h3>
                    <div className="bg-slate-50/70 rounded-xl p-4 text-xs text-slate-600 leading-relaxed font-medium min-h-[80px] line-clamp-4">
                      {item.content}
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
