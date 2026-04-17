import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import the 5 separate dashboards
import OwnerDashboard from './dashboards/OwnerDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import DeliveryDashboard from './dashboards/DeliveryDashboard';
import CustomerDashboard from './dashboards/CustomerDashboard';
import SupplierDashboard from './dashboards/SupplierDashboard';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Glass Container Style
  const containerStyle = {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '20px'
  };

  // 1. Determine which dashboard to show based on Role
  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <OwnerDashboard />;
      case 'inventory_manager':
      case 'production_manager':
        return <StaffDashboard />;
      case 'delivery_manager':
        return <DeliveryDashboard />;
      case 'supplier':
      case 'supplier_manager':
        return <SupplierDashboard />;
      case 'customer':
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <div style={containerStyle}>
      {/* Top Bar for Logout */}
      <div style={{
        width: '90%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>Logged in as: <strong>{user?.role}</strong></span>
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              padding: '8px 20px',
              background: 'rgba(255, 75, 75, 0.8)',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Render the specific dashboard here */}
      {renderDashboard()}

    </div>
  );
}