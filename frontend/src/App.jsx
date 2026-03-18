import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- Auth Pages ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import DeliveryDashboard from './pages/dashboards/DeliveryDashboard';

// --- NEW Dashboard Pages ---
import OwnerDashboard from './pages/dashboards/OwnerDashboard';
import SupplierDashboard from './pages/dashboards/SupplierDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default to Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />

          {/* --- NEW DASHBOARD ROUTES --- */}
          {/* This directs users to the SPECIFIC new designs we built */}
          <Route path="/dashboard/owner" element={<OwnerDashboard />} />
          <Route path="/dashboard/supplier" element={<SupplierDashboard />} />
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/dashboard/staff" element={<StaffDashboard />} />
          <Route path="/dashboard/delivery" element={<DeliveryDashboard />} />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;