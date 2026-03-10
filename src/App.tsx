import { useState, useEffect } from 'react';

declare global { interface Window { liff: any; } }

interface ItemData {
  id: string; type: string; title: string; subtitle: string; content: string;
  date: string; time: string; url: string; icon: string; color: string; subcategory?: string;
}

export default function App() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [filter, setFilter] = useState('all');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwOtD3IcS0tzeHMTbvPNk7wZtm6ShTfzkQ7HaqNY_kMMkJEJRW0_ucxmcO3Qoeb1chi/exec'; 
  const LIFF_ID = '2009406684-H9fk9ysT';

  useEffect(() => {
    const init = async () => {
      try {
        await window.liff.init({ liffId: LIFF_ID });
        if (window.liff.isLoggedIn()) setProfile(await window.liff.getProfile());
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

  const filtered = items.filter(i => filter === 'all' ? true : i.type === filter);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 p-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-800 tracking-tighter">智能資訊牆</h1>
          {profile && <img src={profile.pictureUrl} className="w-10 h-10 rounded-2xl shadow-sm" alt="" />}
        </div>
        <div className="max-w-md mx-auto mt-4 flex gap-2 overflow-x-auto no-scrollbar py-1">
          {['all', 'email', 'file', 'link'].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === t ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
              {t === 'all' ? '全部' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold animate-pulse">載入中...</div>
        ) : filtered.map(item => (
          <div key={item.id} onClick={() => item.url !== '#' && window.open(item.url, '_blank')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.color}`}>
                {item.icon} {item.type}
              </span>
              <span className="text-[10px] font-bold text-slate-300">{item.date}</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-1">{item.title}</h2>
            <p className="text-xs font-bold text-slate-400 mb-4">{item.subtitle}</p>
            <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 leading-relaxed font-medium">
              {item.content}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
