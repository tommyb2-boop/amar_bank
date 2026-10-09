import React, { useState } from 'react';
import { AdminUser, Customer } from '../types';
import { AmarBankLogo } from './AmarBankLogo';
import { generateOTP } from '../utils/formatters';
import { Lock, Mail, Phone, User, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface AuthScreenProps {
  admins: AdminUser[];
  customers: Customer[];
  onAdminLogin: (admin: AdminUser) => void;
  onCustomerLogin: (customer: Customer) => void;
  onRegisterAdmin: (newAdmin: AdminUser) => void;
  onResetAdminPin: (email: string, newPin: string) => void;
}

type PortalMode = 'ADMIN' | 'CUSTOMER';
type AdminAuthStep = 'LOGIN' | 'REGISTER' | 'FORGOT_STEP_1' | 'FORGOT_STEP_2';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  admins,
  customers,
  onAdminLogin,
  onCustomerLogin,
  onRegisterAdmin,
  onResetAdminPin,
}) => {
  const [portalMode, setPortalMode] = useState<PortalMode>('ADMIN');
  const [adminStep, setAdminStep] = useState<AdminAuthStep>('LOGIN');

  // Admin login states
  const [adminPin, setAdminPin] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Admin register states
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');

  // Admin Forgot states
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [otpSentNotification, setOtpSentNotification] = useState<string | null>(null);

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
      onAdminLogin(admin);
    } else {
      setErrorMessage('PIN Admin tidak valid. Periksa kembali atau gunakan fitur Lupa Password.');
    }
  };

  // 2. Handle Admin Register
  const handleAdminRegister = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regFullName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMessage('Harap lengkapi semua kolom pendaftaran.');
      return;
    }

    if (regPin.length < 6) {
      setErrorMessage('PIN minimal harus 6 digit angka.');
      return;
    }

    if (regPin !== regPinConfirm) {
      setErrorMessage('Konfirmasi PIN tidak cocok dengan PIN yang dibuat.');
      return;
    }

    // Check duplicate email
    if (admins.some((a) => a.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setErrorMessage('Email tersebut sudah terdaftar sebagai admin.');
      return;
    }

    const newAdmin: AdminUser = {
      id: `ADM-${String(admins.length + 1).padStart(3, '0')}`,
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      pin: regPin.trim(),
      createdAt: new Date().toISOString(),
    };

    onRegisterAdmin(newAdmin);
    setSuccessMessage('Pendaftaran Admin berhasil! Silakan masuk dengan PIN baru Anda.');
    setAdminStep('LOGIN');
    setAdminPin(regPin);
  };

  // 3. Handle Forgot Step 1 (Request OTP via Email)
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const targetEmail = forgotEmail.trim().toLowerCase();
    const admin = admins.find((a) => a.email.toLowerCase() === targetEmail);

    if (!admin) {
      setErrorMessage('Email tidak terdaftar sebagai admin di sistem Amar Bank.');
      return;
    }

    const otp = generateOTP();
    setGeneratedOtp(otp);
    setOtpSentNotification(`Kode OTP verifikasi telah dikirim ke: ${targetEmail}`);
    setSuccessMessage(`Simulasi Email: Kode verifikasi OTP Anda adalah ${otp}. Berlaku 10 menit.`);
    setAdminStep('FORGOT_STEP_2');
  };

  // 4. Handle Forgot Step 2 (Verify OTP & Reset PIN)
  const handleVerifyOtpAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (inputOtp.trim() !== generatedOtp.trim()) {
      setErrorMessage('Kode OTP verifikasi salah. Harap periksa kembali.');
      return;
    }

    if (newPin.length < 6) {
      setErrorMessage('PIN baru minimal harus 6 digit angka.');
      return;
    }

    if (newPin !== newPinConfirm) {
      setErrorMessage('Konfirmasi PIN baru tidak sesuai.');
      return;
    }

    onResetAdminPin(forgotEmail.trim().toLowerCase(), newPin.trim());
    setSuccessMessage('PIN Admin berhasil diperbarui! Silakan login dengan PIN baru.');
    setAdminStep('LOGIN');
    setAdminPin(newPin);
    setOtpSentNotification(null);
  };

  // 5. Handle Customer Login (Clean & Secure - Zero Leakage)
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
      setErrorMessage('ID Pelanggan / No. HP atau PIN tidak sesuai. Hubungi Admin jika Anda lupa PIN.');
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

                {/* Auxiliary Links */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('FORGOT_STEP_1');
                      clearMessages();
                    }}
                    className="hover:text-blue-900 underline font-medium cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('REGISTER');
                      clearMessages();
                    }}
                    className="text-blue-900 font-bold hover:underline cursor-pointer"
                  >
                    Daftar Pertama Kali
                  </button>
                </div>
              </form>
            )}

            {/* 2. DAFTAR PERTAMA KALI (ADMIN REGISTER) */}
            {adminStep === 'REGISTER' && (
              <form onSubmit={handleAdminRegister} className="space-y-3.5">
                <div className="text-center mb-1">
                  <h3 className="text-base font-bold text-slate-900">Pendaftaran Akun Admin</h3>
                  <p className="text-xs text-slate-500">Lengkapi formulir pendaftaran admin baru</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-900" />
                    <span>Nama Lengkap *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Petugas"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-900" />
                    <span>Email Resmi *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@amarbank.co.id"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-900" />
                    <span>No. WhatsApp / HP *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxxx"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Buat PIN (6 Angka) *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="6 Digit PIN"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-center tracking-widest text-slate-900 outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi PIN *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Ulangi PIN"
                      value={regPinConfirm}
                      onChange={(e) => setRegPinConfirm(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-center tracking-widest text-slate-900 outline-none focus:border-blue-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer mt-1"
                >
                  Daftarkan Akun Admin
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('LOGIN');
                      clearMessages();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Sudah punya akun? Kembali ke Login
                  </button>
                </div>
              </form>
            )}

            {/* 3. LUPA PASSWORD - STEP 1 (INPUT EMAIL) */}
            {adminStep === 'FORGOT_STEP_1' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="text-center mb-1">
                  <h3 className="text-base font-bold text-slate-900">Verifikasi Email Admin</h3>
                  <p className="text-xs text-slate-500">
                    Langkah 1: Masukkan email terdaftar untuk menerima 6-digit OTP
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-900" />
                    <span>Email Terdaftar Admin</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: dicoba.ngetes@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default admin: <span className="font-mono text-slate-600">dicoba.ngetes@gmail.com</span>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Kirim Kode Verifikasi (OTP)</span>
                  <ArrowRight className="w-4 h-4" />
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
                    Batal & Kembali ke Login
                  </button>
                </div>
              </form>
            )}

            {/* 4. LUPA PASSWORD - STEP 2 (INPUT OTP + NEW PIN) */}
            {adminStep === 'FORGOT_STEP_2' && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
                <div className="text-center mb-1">
                  <h3 className="text-base font-bold text-slate-900">Masukkan OTP & Buat PIN Baru</h3>
                  <p className="text-xs text-slate-500">
                    Langkah 2: Verifikasi 6-digit OTP yang dikirimkan
                  </p>
                </div>

                {otpSentNotification && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-[11px] flex items-center justify-between">
                    <span>{otpSentNotification}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = generateOTP();
                        setGeneratedOtp(newCode);
                        setSuccessMessage(`Kode baru dikirim: ${newCode}`);
                      }}
                      className="text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Kirim Ulang
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode OTP 6-Digit *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Masukkan 6 Digit OTP"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-center text-base tracking-widest text-slate-900 outline-none focus:border-blue-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PIN Baru (6 Digit) *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="PIN Baru"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-center text-xs tracking-widest text-slate-900 outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi PIN Baru *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Ulangi PIN"
                      value={newPinConfirm}
                      onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-center text-xs tracking-widest text-slate-900 outline-none focus:border-blue-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer"
                >
                  Reset PIN & Simpan
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
                    Batal
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* B. PORTAL PELANGGAN / NASABAH (BERSIH & ZERO-LEAKAGE) */}
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
