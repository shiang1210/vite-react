import React, { useState, useEffect } from 'react';

export default function App() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = 'YOUR_LIFF_ID_HERE';

  const mockDataFallback = [
    { id: 'm1', type: 'file', title: '離線備援資料', subtitle: '系統連線異常', content: '目前無法取得最新資料，請稍後重試或檢查系統日誌。', date: '今日', time: '剛剛', url: '#', icon: '⚠️', color: 'bg-red-100 text-red-800' }
  ];

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

  const handleBackup = () => {
    setToastMessage('備份執行中...');
    fetch(`${GAS_API_URL}?action=backup`, { redirect: 'follow' })
      .then(res => res.json())
      .then(data => {
        setToastMessage(data.success ? '系統備份成功' : '系統備份失敗');
        setTimeout(() => setToastMessage(''), 3000);
      })
      .catch(() => {
        setToastMessage('連線異常，備份失敗');
        setTimeout(() => setToastMessage(''), 3000);
      });
  };

  const filteredItems = items.filter(item => filter === 'all' ? true : item.type === filter);

  const handleCardClick = (url) => {
    if (url && url !== '#') {
      if (window.liff && window.liff.isInClient()) {
         window.liff.openWindow({ url: url, external: false });
      } else {
         window.open(url, '_blank');
      }
    }
  };

  const getTypeLabel = (type) => {
    const types = { 'email': '信件', 'file': '檔案', 'form': '表單', 'link': '連結' };
    return types[type] || '其他';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans relative">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {toastMessage}
        </div>
      )}

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">小幫手資訊牆</h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleBackup}
              className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              ☁️ 系統備份
            </button>
            {profile && (
              <img 
                src={profile.pictureUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-gray-200"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
              />
            )}
          </div>
        </div>
        
        <div className="max-w-md mx-auto px-4 pb-2 flex space-x-2 overflow-x-auto hide-scrollbar">
          {['all', 'email', 'file', 'form', 'link'].map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === t ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t === 'all' ? '全部' : t === 'email' ? '📧 郵件' : t === 'file' ? '📄 檔案' : t === 'form' ? '📝 表單' : '🔗 連結'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">資料讀取中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500">目前沒有相關資料</div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => handleCardClick(item.url)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform cursor-pointer flex flex-col"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex space-x-2">
                  <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${item.color}`}>
                    <span>{item.icon}</span>
                    <span>{getTypeLabel(item.type)}</span>
                  </div>
                  {item.subcategory && (
                    <div className="flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">
                      {item.subcategory}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {item.date && item.date.split ? item.date.split('T')[0] : item.date} {item.time}
                </div>
              </div>
              
              <h2 className="text-base font-bold text-gray-800 leading-snug mb-1">{item.title}</h2>
              <h3 className="text-sm font-medium text-gray-600 mb-3">{item.subtitle}</h3>
              
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 whitespace-pre-line border border-gray-100 mb-3">
                {item.content}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
