import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BringinEmblem } from '../common/BringinEmblem';
import { Lock, User, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, settings } = useApp();

  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(username, password);
      setIsLoading(false);
    }, 250);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex flex-col justify-center items-center px-4 py-8">
      
      {/* Container */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-emerald-800/40 overflow-hidden">
        
        {/* Card Header with Bringin Emblem */}
        <div className="bg-emerald-950 p-6 text-center text-white relative border-b border-amber-500/30">
          <div className="inline-block p-2 bg-emerald-900/60 rounded-2xl border border-amber-400/40 shadow-md mb-3">
            <BringinEmblem size="xl" logoUrl={settings.logoUrl} />
          </div>

          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
            PEMERINTAH KABUPATEN SEMARANG
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            {settings.appName}
          </h1>
          <p className="text-xs text-emerald-200 mt-1 max-w-xs mx-auto leading-snug">
            {settings.appFullName}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 text-center">
              Masuk ke Portal Pelayanan
            </h2>
            <p className="text-xs text-slate-500 text-center mt-0.5">
              Silakan masukkan kredensial akun petugas Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pengguna (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Box for Testing & Evaluation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Akses Cepat Pengujian Akun:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="p-2 text-left bg-white border border-slate-200 hover:border-emerald-600 rounded-lg transition-colors group"
              >
                <div className="font-bold text-emerald-950 group-hover:text-emerald-700 text-[11px]">
                  Administrator
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  admin / admin123
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('operator', 'operator123')}
                className="p-2 text-left bg-white border border-slate-200 hover:border-emerald-600 rounded-lg transition-colors group"
              >
                <div className="font-bold text-emerald-950 group-hover:text-emerald-700 text-[11px]">
                  Operator PATEN
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  operator / operator123
                </div>
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-1">
            PATEN Kecamatan Bringin · Kab. Semarang, Jawa Tengah
          </div>

        </div>
      </div>
    </div>
  );
};
