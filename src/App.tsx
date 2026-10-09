import React, { useState, useEffect } from 'react';
import { AdminUser, Customer, Loan, Payment, NotificationItem } from './types';
import {
  INITIAL_ADMINS,
  INITIAL_CUSTOMERS,
  INITIAL_LOANS,
  INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS,
} from './data/initialData';
import { AuthScreen } from './components/AuthScreen';
import { AdminPortal } from './components/AdminPortal';
import { CustomerPortal } from './components/CustomerPortal';
import { Watermark } from './components/Watermark';
import { getDaysDifference } from './utils/formatters';
import { Smartphone, Monitor } from 'lucide-react';

const STORAGE_KEY_ADMINS = 'amar_bank_admins_v1';
const STORAGE_KEY_CUSTOMERS = 'amar_bank_customers_v1';
const STORAGE_KEY_LOANS = 'amar_bank_loans_v1';
const STORAGE_KEY_PAYMENTS = 'amar_bank_payments_v1';
const STORAGE_KEY_NOTIFS = 'amar_bank_notifs_v1';
const STORAGE_KEY_SESSION = 'amar_bank_session_v1';

export default function App() {
  // State initialization with localStorage fallback
  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMINS);
      return saved ? JSON.parse(saved) : INITIAL_ADMINS;
    } catch {
      return INITIAL_ADMINS;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOANS);
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAYMENTS);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Current Auth Session
const [currentUser, setCurrentUser] = useState<{
  role: 'ADMIN' | 'CUSTOMER' | null;
  adminData?: AdminUser;
  customerData?: Customer;
}>(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SESSION);
    // Jika perangkat sudah pernah login, muat data sesi tersimpan.
    // Jika perangkat baru / belum pernah login, set role ke null agar wajib ke halaman login.
    return saved ? JSON.parse(saved) : { role: null };
  } catch {
    return { role: null };
  }
});


  // Optional Phone Simulation Frame Toggle (desktop view)
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
    } catch (e) {
      console.error(e);
    }
  }, [admins]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
    } catch (e) {
      console.error(e);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.error(e);
    }
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Automatic Due-Date Check (≤ 3 days detection for notifications)
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setLoans((prevLoans) => {
      let hasChanges = false;
      const updatedLoans = prevLoans.map((loan) => {
        if (loan.remainingBalance <= 0) {
          if (loan.status !== 'LUNAS') {
            hasChanges = true;
            return { ...loan, status: 'LUNAS' as const };
          }
          return loan;
        }

        const daysDiff = getDaysDifference(loan.nextDueDate);
        if (daysDiff < 0 && loan.status !== 'MENUNGGAK') {
          hasChanges = true;
          return { ...loan, status: 'MENUNGGAK' as const };
        } else if (daysDiff >= 0 && daysDiff <= 3 && loan.status !== 'PERHATIAN') {
          hasChanges = true;
          return { ...loan, status: 'PERHATIAN' as const };
        }
        return loan;
      });

      return hasChanges ? updatedLoans : prevLoans;
    });
  }, []);

  // Handlers
  const handleAdminLogin = (admin: AdminUser) => {
    setCurrentUser({
      role: 'ADMIN',
      adminData: admin,
    });
  };

  const handleCustomerLogin = (customer: Customer) => {
    setCurrentUser({
      role: 'CUSTOMER',
      customerData: customer,
    });
  };

  const handleRegisterAdmin = (newAdmin: AdminUser) => {
    setAdmins((prev) => [...prev, newAdmin]);
  };

  const handleResetAdminPin = (email: string, newPin: string) => {
    setAdmins((prev) =>
      prev.map((a) => (a.email.toLowerCase() === email.toLowerCase() ? { ...a, pin: newPin } : a))
    );
  };

  const handleLogout = () => {
    setCurrentUser({ role: null });
  };

  const handleAddCustomer = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
    // Also update loans name/phone
    setLoans((prev) =>
      prev.map((l) =>
        l.customerId === updatedCust.id
          ? { ...l, customerName: updatedCust.fullName, customerPhone: updatedCust.phone }
          : l
      )
    );
  };

  const handleAddLoan = (loan: Loan) => {
    setLoans((prev) => [loan, ...prev]);
  };

  const handleRecordPayment = (payment: Payment, updatedLoan: Loan) => {
    setPayments((prev) => [payment, ...prev]);
    setLoans((prev) =>
      prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l))
    );

    // Add notification
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: 'Pembayaran Baru Terverifikasi',
      message: `${payment.customerName} membayar angsuran ${payment.loanTitle} sebesar ${payment.amount.toLocaleString('id-ID')} via ${payment.paymentMethod}.`,
      type: 'PAYMENT',
      loanId: payment.loanId,
      customerId: payment.customerId,
      date: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Render view
  return (
    <div className={`min-h-screen ${isPhoneFrame ? 'bg-slate-900 py-6 px-4 flex items-center justify-center' : 'bg-slate-100'} relative`}>
      
      {/* Device Frame View Switcher (Desktop Convenience for smartphone preview) */}
      <div className="fixed top-3 right-3 z-50 no-print hidden md:flex items-center gap-1.5 p-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20 shadow-md">
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            !isPhoneFrame ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
          title="Tampilan Penuh"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Layar Penuh</span>
        </button>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            isPhoneFrame ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
          title="Simulasi Ponsel Pintar"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Frame</span>
        </button>
      </div>

      {/* Frame Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[420px] h-[860px] bg-white rounded-[44px] shadow-2xl border-[10px] border-slate-800 overflow-y-auto relative ring-1 ring-white/10'
            : 'min-h-screen'
        }`}
      >
        {/* Notch for Phone frame simulation */}
        {isPhoneFrame && (
          <div className="sticky top-0 z-50 w-32 h-5 bg-slate-800 rounded-b-xl mx-auto flex items-center justify-center pointer-events-none mb-1">
            <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>
        )}

        {/* 1. If not logged in -> Show AuthScreen */}
        {!currentUser.role && (
          <AuthScreen
            admins={admins}
            customers={customers}
            onAdminLogin={handleAdminLogin}
            onCustomerLogin={handleCustomerLogin}
            onRegisterAdmin={handleRegisterAdmin}
            onResetAdminPin={handleResetAdminPin}
          />
        )}

        {/* 2. If logged in as ADMIN -> Show AdminPortal */}
        {currentUser.role === 'ADMIN' && currentUser.adminData && (
          <AdminPortal
            currentAdmin={currentUser.adminData}
            customers={customers}
            loans={loans}
            payments={payments}
            notifications={notifications}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onAddLoan={handleAddLoan}
            onRecordPayment={handleRecordPayment}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            onClearAllNotifications={handleClearAllNotifications}
            onLogout={handleLogout}
          />
        )}

        {/* 3. If logged in as CUSTOMER -> Show CustomerPortal (Zero Leakage) */}
        {currentUser.role === 'CUSTOMER' && currentUser.customerData && (
          <CustomerPortal
            currentCustomer={currentUser.customerData}
            loans={loans}
            payments={payments}
            adminPhone={admins[0]?.phone || '081298765432'}
            onLogout={handleLogout}
          />
        )}

        {/* Exclusive Watermark: "The Update" anchored at bottom-right of every screen */}
        <Watermark />
      </div>

    </div>
  );
}
