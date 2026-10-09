import React, { useState } from 'react';
import { AdminUser, Customer } from '../types';
import { AmarBankLogo } from './AmarBankLogo';
import { Lock, Mail, Phone, User, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Settings, Trash2 } from 'lucide-react';

interface AuthScreenProps {
  admins: AdminUser[];
  customers: Customer[];
  onAdminLogin: (admin: AdminUser) => void;
  onCustomerLogin: (customer: Customer) => void;
  onUpdateAdminProfile?: (updatedAdmin: AdminUser) => void;
  onResetAllData?: () => void;
}

type PortalMode = 'ADMIN' | 'CUSTOMER';
type AdminAuthStep = 'LOGIN' | 'SETTINGS' | 'RESET_DATA_CONFIRM';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  admins,
  customers,
  onAdminLogin,
  onCustomerLogin,
  onUpdateAdminProfile,
  onResetAllData,
}) => {
  const [portalMode, setPortalMode] = useState<PortalMode>('ADMIN');
  const [adminStep, setAdminStep] = useState<AdminAuthStep>('LOGIN');

  // Admin login states
  const [adminPin, setAdminPin] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Logged-in admin session simulation for profile editing (if editing while logged in)
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(admins[0] || null);

  // Admin Profile & Password Settings states
  const [editFullName, setEditFullName] = useState(currentAdmin?.fullName || '');
  const [editEmail, setEditEmail] = useState(currentAdmin?.email || '');
  const [editPhone, setEditPhone] = useState(currentAdmin?.phone || '');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');

  // Customer login states
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [customerPin, setCustomerPin] = useState('');

  // Feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 1. Handle Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const pinToMatch = adminPin.trim();
    const admin = admins.find(
      (a) => a.pin === pinToMatch || (adminEmail && a.email.toLowerCase() === adminEmail.toLowerCase().trim() && a.pin === pinToMatch)
    );

    if (admin) {
      setCurrentAdmin(admin);
      onAdminLogin(admin);
    } else {
      setErrorMessage('PIN Admin tidak valid. Periksa kembali PIN Anda.');
    }
  };

  // 2. Handle Update Admin Profile & Password
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!currentAdmin) {
      setErrorMessage('Tidak ada sesi admin yang aktif.');
      return;
    }

    if (!editFullName.trim() || !editEmail.trim() || !editPhone.trim()) {
      setErrorMessage('Harap lengkapi informasi profil.');
      return;
    }

    let updatedPin = currentAdmin.pin;

    // If changing PIN
    if (oldPin || newPin || newPinConfirm) {
      if (oldPin !== currentAdmin.pin) {
        setErrorMessage('PIN lama tidak sesuai.');
        return;
      }
      if (newPin.length < 6) {
        setErrorMessage('PIN baru minimal harus 6 digit angka.');
        return;
      }
      if (newPin !== newPinConfirm) {
        setErrorMessage('Konfirmasi PIN baru tidak cocok.');
        return;
      }
      updatedPin = newPin.trim();
    }

    const updatedData: AdminUser = {
      ...currentAdmin,
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      pin: updatedPin,
    };

    if (onUpdateAdminProfile) {
      onUpdateAdminProfile(updatedData);
    }
    setCurrentAdmin(updatedData);
    setSuccessMessage('Pengaturan profil dan password berhasil diperbarui!');
    setOldPin('');
    setNewPin('');
    setNewPinConfirm('');
  };

  // 3. Handle Reset All Data Confirmation
  const handleConfirmResetAll = () => {
    if (onResetAllData) {
      onResetAllData();
    }
    setSuccessMessage('Semua data sistem berhasil di-reset total.');
    setAdminStep('LOGIN');
  };

  // 4. Handle Customer Login
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const identifier = customerIdentifier.trim();
    const pin = customerPin.trim();

    if (!identifier || !pin) {
      setErrorMessage('Harap masukkan ID Pelanggan / No. HP dan PIN Anda.');
      return;
    }

    const customer = customers.find(
      (c) =>
        (c.id.toLowerCase() === identifier.toLowerCase() ||
          c.phone.replace(/\D/g, '') === identifier.replace(/\D/g, '')) &&
        c.pin === pin
    );

    if (customer) {
      onCustomerLogin(customer);
    } else {
      setErrorMessage('ID Pelanggan / No. HP atau PIN tidak sesuai.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 transition-all duration-300">
        
        {/* Top Brand Banner */}
        <div className="p-6 text-center border-b border-slate-100 bg-slate-50/70">
          <div className="flex justify-center mb-3">
            <AmarBankLogo size="lg" showText={true} />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Sistem Pencatatan Kredit, Piutang & Manajemen Angsuran
          </p>

          {/* Dual Portal Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-2xl mt-5">
            <button
              type="button"
              onClick={() => {
                setPortalMode('ADMIN');
                setAdminStep('LOGIN');
                clearMessages();
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                portalMode === 'ADMIN'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portal Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('CUSTOMER');
                clearMessages();
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                portalMode === 'CUSTOMER'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portal Pelanggan
            </button>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* A. PORTAL ADMIN VIEW */}
        {/* ============================================================ */}
        {portalMode === 'ADMIN' && (
          <div className="p-6">
            
            {/* 1. ADMIN LOGIN */}
            {adminStep === 'LOGIN' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="text-center mb-1">
                  <h3 className="text-base font-bold text-slate-900">Masuk Sebagai Pengelola</h3>
                  <p className="text-xs text-slate-500">Masukkan 6-digit PIN keamanan Admin</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-900" />
                    <span>PIN Akses Admin</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="Masukkan 6 Digit PIN (Default: 123456)"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-center font-mono text-lg tracking-widest text-slate-900 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Buka Akses Admin</span>
                </button>

                {/* Auxiliary Links: Pengaturan & Reset Data Total */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentAdmin) {
                        setEditFullName(currentAdmin.fullName);
                        setEditEmail(currentAdmin.email);
                        setEditPhone(currentAdmin.phone);
                      }
                      setAdminStep('SETTINGS');
                      clearMessages();
                    }}
                    className="flex items-center gap-1 hover:text-blue-900 font-medium cursor-pointer text-slate-700"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Pengaturan Profil & Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('RESET_DATA_CONFIRM');
                      clearMessages();
                    }}
                    className="flex items-center gap-1 text-rose-600 font-semibold hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Data Total</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. PENGATURAN EDIT PROFIL & PASSWORD */}
            {adminStep === 'SETTINGS' && (
              <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                <div className="text-center mb-1">
                  <h3 className="text-base font-bold text-slate-900">Pengaturan Admin</h3>
                  <p className="text-xs text-slate-500">Ubah profil akun atau perbarui PIN sandi Anda</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-900" />
                    <span>Nama Lengkap</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-900" />
                    <span>Email Resmi</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-900" />
                    <span>No. WhatsApp / HP</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700"
                  />
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <p className="text-xs font-bold text-slate-800 mb-2">Ubah PIN / Password (Opsional)</p>
                  
                  <div className="mb-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">PIN Lama</label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Masukkan PIN lama jika ingin mengubah"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center tracking-widest text-slate-900 outline-none focus:border-blue-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">PIN Baru (6 Digit)</label>
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="PIN Baru"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center tracking-widest text-slate-900 outline-none focus:border-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Konfirmasi PIN</label>
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="Ulangi PIN"
                        value={newPinConfirm}
                        onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center tracking-widest text-slate-900 outline-none focus:border-blue-700"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer mt-1"
                >
                  Simpan Perubahan Profil
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('LOGIN');
                      clearMessages();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Kembali ke Login
                  </button>
                </div>
              </form>
            )}

            {/* 3. KONFIRMASI RESET DATA TOTAL */}
            {adminStep === 'RESET_DATA_CONFIRM' && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Data Total?</h3>
                  <p className="text-xs text-slate-500 mt-1 px-4 leading-relaxed">
                    Tindakan ini akan menghapus seluruh data transaksi, daftar pelanggan, dan pengaturan yang tersimpan secara permanen.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmResetAll}
                    className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    Ya, Hapus dan Reset Semua Data
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('LOGIN');
                      clearMessages();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* B. PORTAL PELANGGAN / NASABAH */}
        {/* ============================================================ */}
        {portalMode === 'CUSTOMER' && (
          <div className="p-6">
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-11 h-11 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-blue-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Portal Mandiri Nasabah</h3>
                <p className="text-xs text-slate-500">
                  Akses aman & terisolasi untuk cek tagihan pribadi dan unduh kwitansi
                </p>
              </div>

              {/* ID Pelanggan / No. HP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Pelanggan / No. WhatsApp Terdaftar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CUST-1001 atau 081234567890"
                  value={customerIdentifier}
                  onChange={(e) => setCustomerIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-semibold text-slate-900 outline-none transition-all"
                />
              </div>

              {/* PIN Pelanggan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-900" />
                  <span>PIN Akses Nasabah *</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="Masukkan PIN Anda"
                  value={customerPin}
                  onChange={(e) => setCustomerPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-center font-mono text-lg tracking-widest text-slate-900 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Masuk ke Akun Saya</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-500 leading-relaxed">
                Belum memiliki ID atau lupa PIN? Silakan hubungi Customer Service Amar Bank melalui WhatsApp kantor cabang.
              </div>
            </form>
          </div>
        )}

        {/* Footer Notice */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">
            Dilindungi Protokol Enkripsi & Verifikasi Amar Bank Indonesia
          </p>
        </div>

      </div>
    </div>
  );
};
