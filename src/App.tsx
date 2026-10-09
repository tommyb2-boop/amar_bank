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
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY_SESSION = 'amar_bank_session_v1';

export default function App() {
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [currentUser, setCurrentUser] = useState<{
    role: 'ADMIN' | 'CUSTOMER' | null;
    adminData?: AdminUser;
    customerData?: Customer;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      return saved ? JSON.parse(saved) : { role: null };
    } catch {
      return { role: null };
    }
  });

  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);

  useEffect(() => {
    const unsubAdmins = onSnapshot(collection(db, "admins"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => doc.data() as AdminUser);
        setAdmins(data);
      } else {
        INITIAL_ADMINS.forEach(async (adm) => {
          await setDoc(doc(db, "admins", adm.id), adm);
        });
      }
    });

    const unsubCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => doc.data() as Customer);
        setCustomers(data);
      } else {
        INITIAL_CUSTOMERS.forEach(async (c) => {
          await setDoc(doc(db, "customers", c.id), c);
        });
      }
    });

    const unsubLoans = onSnapshot(collection(db, "loans"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => doc.data() as Loan);
        
        data.forEach(async (loan) => {
          let updatedStatus = loan.status;
          if (loan.remainingBalance <= 0 && loan.status !== 'LUNAS') {
            updatedStatus = 'LUNAS';
          } else {
            const daysDiff = getDaysDifference(loan.nextDueDate);
            if (daysDiff < 0 && loan.status !== 'MENUNGGAK') {
              updatedStatus = 'MENUNGGAK';
            } else if (daysDiff >= 0 && daysDiff <= 3 && loan.status !== 'PERHATIAN') {
              updatedStatus = 'PERHATIAN';
            }
          }

          if (updatedStatus !== loan.status) {
            const updated = { ...loan, status: updatedStatus };
            await setDoc(doc(db, "loans", loan.id), updated);
          }
        });

        setLoans(data);
      } else {
        INITIAL_LOANS.forEach(async (l) => {
          await setDoc(doc(db, "loans", l.id), l);
        });
      }
    });

    const unsubPayments = onSnapshot(collection(db, "payments"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => doc.data() as Payment);
        setPayments(data);
      } else {
        INITIAL_PAYMENTS.forEach(async (p) => {
          await setDoc(doc(db, "payments", p.id), p);
        });
      }
    });

    const unsubNotifs = onSnapshot(collection(db, "notifications"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => doc.data() as NotificationItem);
        setNotifications(data);
      } else {
        INITIAL_NOTIFICATIONS.forEach(async (n) => {
          await setDoc(doc(db, "notifications", n.id), n);
        });
      }
    });

    return () => {
      unsubAdmins();
      unsubCustomers();
      unsubLoans();
      unsubPayments();
      unsubNotifs();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const handleAdminLogin = (admin: AdminUser) => {
    setCurrentUser({ role: 'ADMIN', adminData: admin });
  };

  const handleCustomerLogin = (customer: Customer) => {
    setCurrentUser({ role: 'CUSTOMER', customerData: customer });
  };

  const handleRegisterAdmin = async (newAdmin: AdminUser) => {
    await setDoc(doc(db, "admins", newAdmin.id), newAdmin);
  };

  const handleResetAdminPin = async (email: string, newPin: string) => {
    const targetAdmin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (targetAdmin) {
      const updated = { ...targetAdmin, pin: newPin };
      await setDoc(doc(db, "admins", targetAdmin.id), updated);
    }
  };

  const handleUpdateAdminProfile = async (updatedAdmin: AdminUser) => {
    await setDoc(doc(db, "admins", updatedAdmin.id), updatedAdmin);
    setCurrentUser((prev) => ({ ...prev, adminData: updatedAdmin }));
  };

  const handleResetAllData = async () => {
    try {
      for (const c of customers) await deleteDoc(doc(db, "customers", c.id));
      for (const l of loans) await deleteDoc(doc(db, "loans", l.id));
      for (const p of payments) await deleteDoc(doc(db, "payments", p.id));
      for (const n of notifications) await deleteDoc(doc(db, "notifications", n.id));
      alert('Semua data sistem di Cloud Database berhasil di-reset total.');
    } catch (e) {
      console.error(e);
      alert('Gagal mereset data.');
    }
  };

  const handleLocalBackup = () => {
    const backupData = {
      admins, customers, loans, payments, notifications,
      backupDate: new Date().toISOString(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `amar_bank_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLocalRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (parsedData && parsedData.customers && parsedData.loans) {
            if (window.confirm("Pulihkan data ke Cloud Database? Data saat ini akan ditimpa.")) {
              if (parsedData.customers) {
                for (const c of parsedData.customers) await setDoc(doc(db, "customers", c.id), c);
              }
              if (parsedData.loans) {
                for (const l of parsedData.loans) await setDoc(doc(db, "loans", l.id), l);
              }
              if (parsedData.payments) {
                for (const p of parsedData.payments) await setDoc(doc(db, "payments", p.id), p);
              }
              alert("Data berhasil dipulihkan ke Cloud Database!");
            }
          } else {
            alert("Format file cadangan tidak valid.");
          }
        } catch (error) {
          alert("Gagal membaca file JSON.");
        }
      };
    }
  };

  const handleLogout = () => {
    setCurrentUser({ role: null });
  };

  const handleAddCustomer = async (customer: Customer) => {
    await setDoc(doc(db, "customers", customer.id), customer);
  };

  const handleUpdateCustomer = async (updatedCust: Customer) => {
    await setDoc(doc(db, "customers", updatedCust.id), updatedCust);
    const relatedLoans = loans.filter(l => l.customerId === updatedCust.id);
    for (const l of relatedLoans) {
      const updatedLoan = { ...l, customerName: updatedCust.fullName, customerPhone: updatedCust.phone };
      await setDoc(doc(db, "loans", l.id), updatedLoan);
    }
  };

  const handleAddLoan = async (loan: Loan) => {
    await setDoc(doc(db, "loans", loan.id), loan);
  };

  const handleRecordPayment = async (payment: Payment, updatedLoan: Loan) => {
    await setDoc(doc(db, "payments", payment.id), payment);
    await setDoc(doc(db, "loans", updatedLoan.id), updatedLoan);

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
    await setDoc(doc(db, "notifications", newNotif.id), newNotif);
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (target) {
      await setDoc(doc(db, "notifications", id), { ...target, isRead: true });
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    for (const n of notifications) {
      await setDoc(doc(db, "notifications", n.id), { ...n, isRead: true });
    }
  };

  const handleClearAllNotifications = async () => {
    for (const n of notifications) {
      await deleteDoc(doc(db, "notifications", n.id));
    }
  };

  return (
    <div className={`min-h-screen ${isPhoneFrame ? 'bg-slate-900 py-6 px-4 flex items-center justify-center' : 'bg-slate-100'} relative`}>
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

      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[420px] h-[860px] bg-white rounded-[44px] shadow-2xl border-[10px] border-slate-800 overflow-y-auto relative ring-1 ring-white/10'
            : 'min-h-screen'
        }`}
      >
        {isPhoneFrame && (
          <div className="sticky top-0 z-50 w-32 h-5 bg-slate-800 rounded-b-xl mx-auto flex items-center justify-center pointer-events-none mb-1">
            <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>
        )}

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
            onUpdateAdminProfile={handleUpdateAdminProfile}
            onResetAllData={handleResetAllData}
            onLocalBackup={handleLocalBackup}
            onLocalRestore={handleLocalRestore}
          />
        )}

        {currentUser.role === 'CUSTOMER' && currentUser.customerData && (
          <CustomerPortal
            currentCustomer={currentUser.customerData}
            loans={loans}
            payments={payments}
            adminPhone={admins[0]?.phone || '081298765432'}
            onLogout={handleLogout}
          />
        )}

        <Watermark />
      </div>
    </div>
  );
}
