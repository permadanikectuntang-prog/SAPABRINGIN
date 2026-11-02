import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, UserStatus } from '../../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Edit3, 
  Trash2, 
  KeyRound, 
  X, 
  Save, 
  AlertTriangle 
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [status, setStatus] = useState<UserStatus>('AKTIF');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('OPERATOR');
    setStatus('AKTIF');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(''); // leave blank if not changing
    setRole(user.role);
    setStatus(user.status);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setErrorMsg('Nama lengkap dan username wajib diisi.');
      return;
    }

    if (!editingUser && !password.trim()) {
      setErrorMsg('Kata sandi wajib diisi untuk pengguna baru.');
      return;
    }

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        role,
        status,
        ...(password.trim() ? { password: password.trim() } : {}),
      };
      updateUser(updated);
      setIsModalOpen(false);
    } else {
      const success = addUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        role,
        status,
      });
      if (success) {
        setIsModalOpen(false);
      }
    }
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Manajemen Akses Petugas</span>
            <span aria-hidden="true">·</span>
            <span>Sheet: USERS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Pengguna & Hak Akses
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Atur akun petugas loket, staf administrasi PATEN, dan administrator sistem SIAP BRINGIN.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4 text-emerald-950" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-950 text-white rounded-xl p-4 border border-emerald-900 shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Administrator (Akses Penuh)</span>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Dapat mengelola seluruh jenis pelayanan, menambah/mengubah kolom formulir, mengelola akun petugas, melihat dan menghapus data, mengakses pengaturan database Google Sheets, dan mencetak laporan resmi.
          </p>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Operator / Petugas Loket PATEN</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dapat melakukan input berkas pelayanan pemohon, melihat data pelayanan, memperbarui data yang diperlukan, dan mencetak tanda terima atau laporan harian.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar Akun Pengguna ({users.length} Akun Terdaftar)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-emerald-950 text-white font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4 text-center">Role Akses</th>
                <th className="py-3 px-4 text-center">Status Akun</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, index) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    {currentUser?.id === u.id && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Akun Anda Saat Ini
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-800">
                    {u.username}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded ${
                      u.role === 'ADMINISTRATOR'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(u.id)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        u.status === 'AKTIF'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                      title="Klik untuk mengubah status"
                    >
                      {u.status}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                        title="Edit Akun"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {currentUser?.id !== u.id && (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingUser ? 'Ubah Data Akun Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg mb-3">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Rahmawati, S.AP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Username Login</label>
                <input
                  type="text"
                  placeholder="Contoh: sitirahma"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {editingUser ? 'Kata Sandi Baru (Kosongkan bila tidak diubah)' : 'Kata Sandi'}
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Role Kewenangan</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="OPERATOR">OPERATOR (Input, Lihat, Edit Pelayanan)</option>
                  <option value="ADMINISTRATOR">ADMINISTRATOR (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Status Akun</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="AKTIF">AKTIF (Dapat Login)</option>
                  <option value="NONAKTIF">NONAKTIF (Diblokir)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirm Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Hapus Akun Pengguna</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Apakah Anda yakin ingin menghapus akun <strong>{userToDelete.name}</strong> ({userToDelete.username})?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
