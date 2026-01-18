import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Home from './pages/Home';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Hardware from './pages/Hardware';
import Promotions from './pages/Promotions';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import CashManagement from './pages/CashManagement';
import Estimates from './pages/Estimates';
import Stocktake from './pages/Stocktake';
import AuditLogs from './pages/AuditLogs';
import StaffPage from './pages/StaffPage';
import Notifications from './pages/Notifications';
import Barcodes from './pages/Barcodes';
import Dashboard from './pages/Dashboard';
import AIAssist from './pages/AIAssist';
// import { AIChatWidget } from './components/AIChatWidget'; // Moved to page
import { cashService } from './services/cashService';
import { Button } from './components/Button';
import { Modal } from './components/Modal';

import { useState, useEffect } from 'react';
import Login from './pages/Login';
import type { User } from './types/db';
import { settingsService } from './services/settingsService';
import { databaseService } from './services/databaseService';
import { notificationService } from './services/notificationService';

import { proactiveService } from './services/proactiveService';
import { commandGateway } from './services/CommandGateway';
import { eventBus } from './utils/EventBus';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  // Debug Location
  useEffect(() => {
    console.log("Current Hash:", window.location.hash);
  }, [window.location.hash]);

  useEffect(() => {
    // Initialize Services
    commandGateway.init();
    proactiveService.init();

    // Emit APP_INIT for proactive service
    eventBus.emit('APP_INIT', undefined);

    // Event Bus for Theme
    const removeThemeListener = eventBus.on('THEME_CHANGE', (newTheme: 'light' | 'dark') => {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });

    return () => {
      removeThemeListener();
    };
  }, []); // This effect should run only once on mount

  useEffect(() => {
    const init = async () => {
      await settingsService.init();
      await databaseService.init();
      if (window.electronAPI) {
        window.electronAPI.dbQuery('SELECT 1').then(() => console.log('DB Ready')).catch(console.error);
      }
      if (localStorage.getItem('disableAnimations') === 'true') {
        document.body.classList.add('no-animations');
      }
      if (localStorage.getItem('lightMode') === 'true') {
        document.body.classList.add('light-mode');
      }
      setTimeout(() => {
        notificationService.checkStockLevels();
      }, 2000);
    };
    init();
  }, []);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    try {
      const session = await cashService.getCurrentSession();
      if (!session) {
        setIsShiftModalOpen(true);
      }
    } catch (e) {
      console.error("Error checking session", e);
    }
  };

  const handleStartShift = async () => {
    if (!user || openingBalance === '') return;
    try {
      await cashService.startSession(user.id, parseFloat(openingBalance));
      setIsShiftModalOpen(false);
    } catch (error) {
      console.error("Error starting shift", error);
      alert("Failed to start shift");
    }
  };

  const isStandalone = window.location.href.includes('standalone=true');
  if (isStandalone) {
    return (
      <Router>
        <div className="h-screen w-screen bg-mac-bg overflow-hidden text-white">
          <Routes>
            <Route path="*" element={<Products />} />
          </Routes>
        </div>
      </Router>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <AppShell user={user} onLogout={() => setUser(null)}>
        <Routes>
          {/* Explicit Routes FIRST */}
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/barcodes" element={<Barcodes />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/hardware" element={<Hardware />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/cash" element={<CashManagement user={user} />} />
          <Route path="/stocktake" element={<Stocktake />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai-assist" element={<AIAssist />} />

          {/* Fallback & Home */}
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>
        {/* <AIChatWidget /> Moved to /ai-assist */}

        <Modal
          isOpen={isShiftModalOpen}
          onClose={() => { }}
          title="START SHIFT"
        >
          <div className="space-y-4">
            <p className="text-mac-text-secondary font-bold">Please enter the opening cash balance for this register.</p>
            <div>
              <label className="text-xs font-bold text-mac-text-secondary uppercase tracking-wider mb-1 block">Opening Balance</label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="mac-input w-full h-12 text-lg font-black"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setUser(null)}>Cancel & Logout</Button>
              <Button className="flex-1" onClick={handleStartShift}>Start Shift</Button>
            </div>
          </div>
        </Modal>
      </AppShell>
    </Router >
  );
}

export default App;
// Force Update
