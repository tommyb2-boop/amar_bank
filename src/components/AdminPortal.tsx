import React, { useState, useMemo } from 'react';
import { AdminUser, Customer, Loan, Payment, NotificationItem, LoanStatus } from '../types';
import { formatRupiah, formatDateIndo, createWhatsAppLink } from '../utils/formatters';
import { AmarBankLogo } from './AmarBankLogo';
import { CustomerModal } from './CustomerModal';
import { LoanModal } from './LoanModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { ReportModal } from './ReportModal';
import { NotificationModal } from './NotificationModal';
import { downloadSpreadsheet, openEmailBackup } from '../utils/exporter';
import {
  Users,
  CreditCard,
  Banknote,
  FileSpreadsheet,
  Plus,
  Search,
  Bell,
  LogOut,
  MessageCircle,
  FileText,
  AlertTriangle,
  Receipt,
  Download,
  Upload,
  Mail,
  Home,
  Settings,
  Trash2,
  User,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface AdminPortalProps {
  currentAdmin: AdminUser;
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  notifications: NotificationItem[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onAddLoan: (loan: Loan) => void;
  onRecordPayment: (payment: Payment, updatedLoan: Loan) => void;
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearAllNotifications: () => void;
  onLogout: () => void;
  onUpdateAdminProfile?: (updatedAdmin: AdminUser) => void;
  onResetAllData?: () => void;
  onLocalBackup?: () => void;
  onLocalRestore?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type TabType = 'BERANDA' | 'NASABAH' | 'KREDIT' | 'PEMBAYARAN' | 'LAPORAN';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentAdmin,
  customers,
  loans,
  payments,
  notifications,
  onAddCustomer,
  onUpdateCustomer,
  onAddLoan,
  onRecordPayment,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onLogout,
  onUpdateAdminProfile,
  onResetAllData,
  onLocalBackup,
  onLocalRestore,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('BERANDA');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  
  // New States for Settings & Reset Modals
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Admin Profile Settings Form States
  const [editFullName, setEditFullName] = useState(currentAdmin.fullName);
  const [editEmail, setEditEmail] = useState(currentAdmin.email);
  const [editPhone, setEditPhone] = useState(currentAdmin.phone);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const [preselectedCustomerId, setPreselectedCustomerId] = useState<string | undefined>(undefined);
  const [preselectedLoanId, setPreselectedLoanId] = useState<string | undefined>(undefined);

  // Search & Filters
  const [customerSearch, setCustomerSearch] = useState('');
  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'ALL' | LoanStatus>('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Unread notifications count
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  // Global Financial Statistics
  const financialStats = useMemo(() => {
    const totalPiutang = loans.reduce((acc, l) => acc + l.totalBill, 0);
    const totalTerkumpul = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalSisaPiutang = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
    const activeLoansCount = loans.filter((l) => l.status !== 'LUNAS').length;
    const attentionCount = loans.filter((l) => l.status === 'PERHATIAN').length;
    const overdueCount = loans.filter((l) => l.status === 'MENUNGGAK').length;

    return {
      totalPiutang,
      totalTerkumpul,
      totalSisaPiutang,
      activeLoansCount,
      attentionCount,
      overdueCount,
    };
  }, [loans, payments]);

  // Customer List with computed metrics per customer
  const enrichedCustomers = useMemo(() => {
    return customers.map((c) => {
      const custLoans = loans.filter((l) => l.customerId === c.id);
      const activeCustLoans = custLoans.filter((l) => l.remainingBalance > 0);
      const totalSisa = custLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

      let smoothness: LoanStatus = 'LANCAR';
      if (custLoans.some((l) => l.status === 'MENUNGGAK')) {
        smoothness = 'MENUNGGAK';
      } else if (custLoans.some((l) => l.status === 'PERHATIAN')) {
        smoothness = 'PERHATIAN';
      } else if (custLoans.length > 0 && custLoans.every((l) => l.status === 'LUNAS')) {
        smoothness = 'LUNAS';
      }

      return {
        ...c,
        totalLoans: custLoans.length,
        activeLoansCount: activeCustLoans.length,
        totalSisa,
        smoothness,
      };
    });
  }, [customers, loans]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return enrichedCustomers;
    const q = customerSearch.toLowerCase();
    return enrichedCustomers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [enrichedCustomers, customerSearch]);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const matchSearch =
        !loanSearch.trim() ||
        l.loanTitle.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.customerName.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.id.toLowerCase().includes(loanSearch.toLowerCase()) ||
        (l.itemDescription && l.itemDescription.toLowerCase().includes(loanSearch.toLowerCase()));

      const matchStatus =
        loanStatusFilter === 'ALL' || l.status === loanStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [loans, loanSearch, loanStatusFilter]);

  const filteredPayments = useMemo(() => {
    if (!paymentSearch.trim()) return payments;
    const q = paymentSearch.toLowerCase();
    return payments.filter(
      (p) =>
        p.invoiceNo.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.loanTitle.toLowerCase().includes(q) ||
        p.customerId.toLowerCase().includes(q)
    );
  }, [payments, paymentSearch]);

  // Handle Admin Profile & Password Update
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsMessage('');

    if (!editFullName.trim() || !editEmail.trim() || !editPhone.trim()) {
      setSettingsError('Harap lengkapi semua kolom profil.');
      return;
    }

    let updatedPin = currentAdmin.pin;

    if (oldPin || newPin || newPinConfirm) {
      if (oldPin !== currentAdmin.pin) {
        setSettingsError('PIN lama tidak sesuai.');
        return;
      }
      if (newPin.length < 6) {
        setSettingsError('PIN baru minimal harus 6 digit angka.');
        return;
      }
      if (newPin !== newPinConfirm) {
        setSettingsError('Konfirmasi PIN baru tidak cocok.');
        return;
      }
      updatedPin = newPin.trim();
    }

    const updatedAdminData: AdminUser = {
      ...currentAdmin,
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      pin: updatedPin,
    };

    if (onUpdateAdminProfile) {
      onUpdateAdminProfile(updatedAdminData);
    }
    setSettingsMessage('Pengaturan profil dan password berhasil diperbarui!');
    setOldPin('');
    setNewPin('');
    setNewPinConfirm('');
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-800">
      
      {/* 1. TOP MOBILE APP BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <AmarBankLogo size="sm" showText={true} />

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Notifikasi & Jatuh Tempo"
            >
              <Bell className="w-4 h-4 text-slate-800" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Tombol Pengaturan Profil & Password */}
            <button
              onClick={() => {
                setEditFullName(currentAdmin.fullName);
                setEditEmail(currentAdmin.email);
                setEditPhone(currentAdmin.phone);
                setSettingsError('');
                setSettingsMessage('');
                setIsSettingsModalOpen(true);
              }}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              title="Pengaturan Profil & Password"
            >
              <Settings className="w-4 h-4 text-blue-900" />
              <span className="text-xs font-semibold hidden sm:inline">Pengaturan</span>
            </button>

            {/* Tombol Reset Data Total */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer flex items-center gap-1"
              title="Reset Data Total"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-semibold hidden sm:inline">Reset Total</span>
            </button>

            {/* Admin Profile & Logout */}
            <div className="flex items-center pl-2 border-l border-slate-200 gap-2">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {currentAdmin.fullName}
                </span>
                <span className="text-[10px] text-blue-900 font-semibold">
                  Administrator
                </span>
              </div>

              <button
                onClick={onLogout}
                title="Keluar dari Portal Admin"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
        
        {/* TAB 1: BERANDA */}
        {activeTab === 'BERANDA' && (
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 rounded-3xl text-white shadow-xl shadow-blue-950/15 relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
                  Dashboard Pengelola Kredit
                </span>
                <h1 className="text-lg md:text-xl font-black mt-0.5 tracking-tight">
                  Selamat Datang, {currentAdmin.fullName}
                </h1>
                <p className="text-xs text-blue-200/90 mt-1 max-w-md">
                  Kelola pencatatan kredit, piutang nasabah, angsuran berjalan, dan ekspor laporan resmi.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      setPreselectedCustomerId(undefined);
                      setIsLoanModalOpen(true);
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-blue-900" />
                    <span>Catat Kredit Baru</span>
                  </button>

                  <button
                    onClick={() => {
                      setCustomerToEdit(null);
                      setIsCustomerModalOpen(true);
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-blue-800/80 hover:bg-blue-800 text-white font-semibold text-xs border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Tambah Nasabah</span>
                  </button>

                  <button
                    onClick={() => {
                      setPreselectedLoanId(undefined);
                      setIsPaymentModalOpen(true);
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Terima Pembayaran</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Plafon Piutang
                </span>
                <p className="font-mono text-base md:text-lg font-black text-slate-900 mt-1">
                  {formatRupiah(financialStats.totalPiutang)}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {loans.length} Total Akad Kredit
                </span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Total Angsuran Masuk
                </span>
                <p className="font-mono text-base md:text-lg font-black text-emerald-700 mt-1">
                  {formatRupiah(financialStats.totalTerkumpul)}
                </p>
                <span className="text-[10px] text-emerald-800/80 mt-0.5 block">
                  {payments.length} Kwitansi Diterbitkan
                </span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider block">
                  Sisa Piutang Aktif
                </span>
                <p className="font-mono text-base md:text-lg font-black text-blue-950 mt-1">
                  {formatRupiah(financialStats.totalSisaPiutang)}
                </p>
                <span className="text-[10px] text-blue-700 mt-0.5 block">
                  {financialStats.activeLoansCount} Akad Berjalan
                </span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Nasabah
                </span>
                <p className="font-mono text-base md:text-lg font-black text-slate-900 mt-1">
                  {customers.length} Orang
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                  {financialStats.attentionCount > 0 && (
                    <span className="text-amber-800 font-bold">
                      {financialStats.attentionCount} Dekat Tempo
                    </span>
                  )}
                  {financialStats.overdueCount > 0 && (
                    <span className="text-rose-700 font-bold">
                      · {financialStats.overdueCount} Menunggak
                    </span>
                  )}
                </div>
              </div>
            </div>

            {financialStats.attentionCount > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-amber-900 font-medium">
                    Ada {financialStats.attentionCount} tagihan pinjaman yang jatuh tempo dalam kurun ≤ 3 hari.
                  </span>
                </div>
                <button
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                >
                  Lihat Notifikasi
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-900" />
                    <span>Akad Kredit Terbaru</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('KREDIT')}
                    className="text-xs text-blue-900 font-semibold hover:underline cursor-pointer"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-2">
                  {loans.slice(0, 4).map((loan) => (
                    <div
                      key={loan.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">
                          {loan.customerName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {loan.loanTitle}
                        </p>
                        <span className="font-mono text-[10px] text-slate-400">
                          Sisa: {formatRupiah(loan.remainingBalance)}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          loan.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-800' :
                          loan.status === 'PERHATIAN' ? 'bg-amber-100 text-amber-800' :
                          loan.status === 'MENUNGGAK' ? 'bg-rose-100 text-rose-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Pembayaran Masuk Terbaru</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('PEMBAYARAN')}
                    className="text-xs text-blue-900 font-semibold hover:underline cursor-pointer"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-2">
                  {payments.slice(0, 4).map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => setSelectedReceipt(pay)}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-900">
                            {pay.invoiceNo}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800 text-[11px] mt-0.5">
                          {pay.customerName}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono font-extrabold text-emerald-700">
                          {formatRupiah(pay.amount)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDateIndo(pay.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NASABAH */}
        {activeTab === 'NASABAH' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-blue-900" />
                  <span>Daftar Nasabah Terpusat ({customers.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola data nasabah, ID unik login, dan komunikasi WhatsApp langsung
                </p>
              </div>

              <button
                onClick={() => {
                  setCustomerToEdit(null);
                  setIsCustomerModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pendaftaran Nasabah Baru</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama nasabah, ID (CUST-...), atau nomor WhatsApp..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700 shadow-xs"
              />
            </div>

            <div className="space-y-3">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium">Tidak ada nasabah yang sesuai dengan pencarian.</p>
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const smoothnessBadge =
                    c.smoothness === 'LUNAS' ? 'bg-emerald-100 text-emerald-800' :
                    c.smoothness === 'PERHATIAN' ? 'bg-amber-100 text-amber-800' :
                    c.smoothness === 'MENUNGGAK' ? 'bg-rose-100 text-rose-800' :
                    'bg-blue-100 text-blue-800';

                  const greetingMessage = `Halo Bapak/Ibu ${c.fullName},
Kami dari Amar Bank ingin menginformasikan terkait akun kredit Anda (ID: ${c.id}).
Apakah ada yang dapat kami bantu mengenai informasi pembiayaan Anda?`;

                  const waChatLink = createWhatsAppLink(c.phone, greetingMessage);

                  return (
                    <div
                      key={c.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {c.id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${smoothnessBadge}`}>
                              Status: {c.smoothness}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1">
                            {c.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {c.address}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">PIN Nasabah:</span>
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {c.pin}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 text-[11px]">Pinjaman Aktif:</span>
                          <p className="font-semibold text-slate-800">
                            {c.activeLoansCount} Akad Berjalan ({c.totalLoans} Total)
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Total Sisa Piutang:</span>
                          <p className="font-mono font-bold text-slate-900">
                            {formatRupiah(c.totalSisa)}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-slate-400 text-[11px]">Catatan:</span>
                          <p className="text-slate-600 truncate text-[11px]">
                            {c.notes || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <a
                          href={waChatLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Hubungi WhatsApp</span>
                        </a>

                        <button
                          onClick={() => {
                            setPreselectedCustomerId(c.id);
                            setIsLoanModalOpen(true);
                          }}
                          className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold text-xs border border-blue-200 transition-colors cursor-pointer"
                        >
                          + Akad Baru
                        </button>

                        <button
                          onClick={() => {
                            setCustomerToEdit(c);
                            setIsCustomerModalOpen(true);
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                        >
                          Ubah
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KREDIT */}
        {activeTab === 'KREDIT' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-5 h-5 text-blue-900" />
                  <span>Daftar Akad Kredit ({loans.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Kredit barang & pinjaman tunai dengan margin % dan tenor fleksibel
                </p>
              </div>

              <button
                onClick={() => {
                  setPreselectedCustomerId(undefined);
                  setIsLoanModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pencatatan Akad Baru</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'ALL', label: 'Semua Status' },
                { id: 'LANCAR', label: 'Lancar' },
                { id: 'PERHATIAN', label: 'Dekat Tempo' },
                { id: 'MENUNGGAK', label: 'Menunggak' },
                { id: 'LUNAS', label: 'Lunas' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLoanStatusFilter(item.id as any)}
                  className={`py-1.5 px-3 rounded-lg font-medium transition-colors cursor-pointer ${
                    loanStatusFilter === item.id
                      ? 'bg-blue-900 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari akad, nama nasabah, atau objek barang..."
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700 shadow-xs"
              />
            </div>

            <div className="space-y-3">
              {filteredLoans.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                  <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium">Tidak ada akad kredit yang ditemukan.</p>
                </div>
              ) : (
                filteredLoans.map((loan) => {
                  const isLunas = loan.status === 'LUNAS';
                  const percentPaid = Math.round((loan.totalPaid / loan.totalBill) * 100);

                  return (
                    <div
                      key={loan.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {loan.id}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">
                              {loan.type === 'BARANG' ? 'Barang' : 'Tunai'} · Margin {loan.marginPercentage}%
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 mt-1">
                            {loan.loanTitle}
                          </h3>
                          <p className="text-xs font-medium text-slate-600">
                            Nasabah: {loan.customerName} ({loan.customerId})
                          </p>
                          {loan.itemDescription && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {loan.itemDescription}
                            </p>
                          )}
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isLunas ? 'bg-emerald-100 text-emerald-800' :
                          loan.status === 'PERHATIAN' ? 'bg-amber-100 text-amber-900 animate-pulse' :
                          loan.status === 'MENUNGGAK' ? 'bg-rose-100 text-rose-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {loan.status}
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                          <span>Pelunasan ({percentPaid}%)</span>
                          <span className="font-mono">
                            {formatRupiah(loan.totalPaid)} / {formatRupiah(loan.totalBill)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isLunas ? 'bg-emerald-500' : 'bg-blue-900'
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400">Pokok Bersih:</span>
                          <p className="font-mono font-medium text-slate-800">{formatRupiah(loan.netPrincipal)}</p>
                          {loan.dpAmount > 0 && (
                            <span className="text-[9px] text-slate-400">DP: {formatRupiah(loan.dpAmount)}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Margin ({loan.marginPercentage}%):</span>
                          <p className="font-mono font-medium text-blue-900">+{formatRupiah(loan.marginAmount)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Angsuran / Periode:</span>
                          <p className="font-mono font-bold text-slate-900">{formatRupiah(loan.installmentPerPeriod)}</p>
                          <span className="text-[10px] text-slate-500">Tenor {loan.tenorCount} {loan.tenorUnit.toLowerCase()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Sisa Tagihan:</span>
                          <p className="font-mono font-black text-slate-950">{formatRupiah(loan.remainingBalance)}</p>
                          {!isLunas && (
                            <span className="text-[10px] text-amber-700 font-medium block">
                              Tempo: {formatDateIndo(loan.nextDueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {!isLunas && (
                          <button
                            onClick={() => {
                              setPreselectedLoanId(loan.id);
                              setIsPaymentModalOpen(true);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Bayar Angsuran</span>
                          </button>
                        )}

                        <a
                          href={createWhatsAppLink(
                            loan.customerPhone,
                            `Halo Bapak/Ibu ${loan.customerName}, kami dari Amar Bank mengonfirmasi status akad ${loan.loanTitle} (Sisa: ${formatRupiah(loan.remainingBalance)}).`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PEMBAYARAN */}
        {activeTab === 'PEMBAYARAN' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-5 h-5 text-blue-900" />
                  <span>Pencatatan Pembayaran & Kwitansi ({payments.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Setiap pembayaran menghasilkan E-Receipt resmi berstempel
                </p>
              </div>

              <button
                onClick={() => {
                  setPreselectedLoanId(undefined);
                  setIsPaymentModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Pembayaran Baru</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor faktur (KW-...), nama nasabah, atau akad..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700 shadow-xs"
              />
            </div>

            <div className="space-y-2.5">
              {filteredPayments.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium">Tidak ada riwayat transaksi pembayaran.</p>
                </div>
              ) : (
                filteredPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {pay.invoiceNo}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateIndo(pay.date)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {pay.customerName}
                        </h4>
                        <p className="text-xs text-slate-600">
                          {pay.loanTitle} · Angsuran ke-{pay.installmentNumber} dari {pay.totalInstallments}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Metode: {pay.paymentMethod} {pay.bankOrWalletDetail ? `(${pay.bankOrWalletDetail})` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="sm:text-right">
                        <span className="text-[10px] text-slate-400 block">Nominal Bayar:</span>
                        <span className="font-mono text-sm font-black text-emerald-700">
                          {formatRupiah(pay.amount)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Sisa: {formatRupiah(pay.remainingAfter)}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedReceipt(pay)}
                        className="py-2 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        title="Buka Kwitansi Digital Resmi"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Kwitansi</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: LAPORAN */}
        {activeTab === 'LAPORAN' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-5 h-5 text-blue-900" />
                <span>Pusat Laporan & Backup Data Amar Bank</span>
              </h2>
              <p className="text-xs text-slate-500">
                Ekspor berkas PDF resmi dengan kop, unduh spreadsheet XLS, atau kirim cadangan ke email
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                    DOKUMEN RESMI
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    Laporan Rekapitulasi PDF (Filter Rentang Tanggal)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Menghasilkan lembar laporan formal dengan Kop Amar Bank, ringkasan keuangan, daftar akad kredit, tabel penerimaan pembayaran, dan kolom tanda tangan penanggung jawab.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buka & Cetak Laporan PDF</span>
                </button>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-[10px] font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                CADANGAN DATA (BACKUP)
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                Backup Data Lengkap ke Spreadsheet (.xls / Excel)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mengekstrak seluruh data nasabah terdaftar, akad kredit piutang, dan riwayat mutasi pembayaran ke dalam berkas Excel dengan struktur rapi.
              </p>

              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  onClick={() => downloadSpreadsheet(customers, loans, payments)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Spreadsheet (.xls)</span>
                </button>

                <button
                  onClick={() => openEmailBackup('dicoba.ngetes@gmail.com', customers, loans, payments)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Kirim ke Email (dicoba.ngetes@gmail.com)</span>
                </button>
              </div>
            </div>

            {/* Tombol Backup & Restore Lokal (JSON) */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-[10px] font-bold tracking-wider text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
                BACKUP & RESTORE LOKAL (JSON)
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                Cadangkan & Pulihkan Database Perangkat
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simpan file cadangan database ke penyimpanan lokal perangkat Anda atau impor file cadangan untuk memulihkan data sebelumnya.
              </p>

              <div className="pt-2 flex flex-wrap gap-2.5 items-center">
                {onLocalBackup && (
                  <button
                    onClick={onLocalBackup}
                    className="py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Backup Lokal (.json)</span>
                  </button>
                )}

                {onLocalRestore && (
                  <label className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Restore dari File (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={onLocalRestore}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. FIXED BOTTOM TAB BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
          {[
            { id: 'BERANDA', label: 'Beranda', icon: Home },
            { id: 'NASABAH', label: 'Nasabah', icon: Users },
            { id: 'KREDIT', label: 'Kredit', icon: CreditCard },
            { id: 'PEMBAYARAN', label: 'Bayar', icon: Banknote },
            { id: 'LAPORAN', label: 'Laporan', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
                  isActive ? 'text-blue-900 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-100 text-blue-900' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========================================================= */}
      {/* MODALS & POPUPS */}
      {/* ========================================================= */}

      {/* 1. Modal Pengaturan Profil & Password Admin */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">Pengaturan Profil & Password</h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {settingsError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <span>{settingsError}</span>
              </div>
            )}

            {settingsMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{settingsMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-3">
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
                  <Users className="w-3.5 h-3.5 text-blue-900" />
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

              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-blue-900" />
                  <span>Ubah PIN / Password (Opsional)</span>
                </p>

                <div className="mb-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">PIN Lama</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Masukkan PIN lama"
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

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-900/20 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Konfirmasi Reset Data Total */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Reset Data Total</h3>
              <p className="text-xs text-slate-500 mt-1 px-2 leading-relaxed">
                Tindakan ini akan menghapus seluruh data transaksi, daftar nasabah, dan pengaturan yang tersimpan secara permanen.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onResetAllData) {
                    onResetAllData();
                  }
                  setIsResetConfirmOpen(false);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Ya, Hapus dan Reset Semua Data
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Modals */}
      {isCustomerModalOpen && (
        <CustomerModal
          existingCustomers={customers}
          customerToEdit={customerToEdit}
          onSave={(cust) => {
            if (customerToEdit) {
              onUpdateCustomer(cust);
            } else {
              onAddCustomer(cust);
            }
          }}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setCustomerToEdit(null);
          }}
        />
      )}

      {isLoanModalOpen && (
        <LoanModal
          customers={customers}
          existingLoans={loans}
          preselectedCustomerId={preselectedCustomerId}
          onSave={onAddLoan}
          onClose={() => {
            setIsLoanModalOpen(false);
            setPreselectedCustomerId(undefined);
          }}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          loans={loans}
          preselectedLoanId={preselectedLoanId}
          onRecordPayment={(pay, updatedLoan) => {
            onRecordPayment(pay, updatedLoan);
            setIsPaymentModalOpen(false);
            setSelectedReceipt(pay);
          }}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPreselectedLoanId(undefined);
          }}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          customers={customers}
          loans={loans}
          payments={payments}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {isNotificationModalOpen && (
        <NotificationModal
          notifications={notifications}
          loans={loans}
          onClose={() => setIsNotificationModalOpen(false)}
          onMarkAllAsRead={onMarkAllNotificationsAsRead}
          onClearAll={onClearAllNotifications}
          onMarkAsRead={onMarkNotificationAsRead}
        />
      )}

    </div>
  );
};
