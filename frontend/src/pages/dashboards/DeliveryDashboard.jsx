import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdShoppingCart, MdLocalShipping, MdNotifications, MdLogout, 
  MdSearch, MdAccessTime, MdCheckCircle, MdVisibility, MdFileDownload,
  MdTrendingUp, MdLocationOn, MdDirectionsCar, MdMap, MdSupportAgent, MdStar, MdClose
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  // --- MOCK DATA ---
  // Tab 1: Dashboard Current Delivery
  const currentDelivery = {
    id: 'ORD002', status: 'In Transit', destination: 'Food Mart Chain, Kandy', 
    eta: '2 hours remaining', vehicle: 'Tata Ace (WP CA-1234)', progress: 60
  };

  // Tab 2: Assigned Orders
  const assignedOrders = [
    { id: 'ORD002', pickup: 'Main Warehouse, Colombo', delivery: 'Food Mart Chain, Kandy', items: 'Dry Goods (500kg)', deadline: '2025-10-27 14:00', status: 'In Transit' },
    { id: 'ORD003', pickup: 'Main Warehouse, Colombo', delivery: 'Metro Supermarket, Galle', items: 'Spices (200kg)', deadline: '2025-10-28 10:00', status: 'Ready for Pickup' },
    { id: 'ORD004', pickup: 'Production Facility B', delivery: 'Local Distributors', items: 'Mixed Batch (150kg)', deadline: '2025-10-28 16:00', status: 'Ready for Pickup' },
  ];

  // Tab 3: Delivery History
  const deliveryHistory = [
    { id: 'DEL001', orderId: 'ORD001', dest: 'Nimal Restaurant', date: '2025-10-25', duration: '4 hrs 30m', status: 'Delivered', rating: 5.0 },
    { id: 'DEL002', orderId: 'ORD005', dest: 'Fresh Market', date: '2025-10-24', duration: '3 hrs 15m', status: 'Delivered', rating: 4.5 },
    { id: 'DEL003', orderId: 'ORD008', dest: 'Spice Exports Ltd', date: '2025-10-22', duration: '5 hrs 00m', status: 'Delivered', rating: 5.0 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // --- STYLES ---
  const styles = {
    // 1. MAIN LAYOUT (Full Screen Fix)
    mainWrapper: {
      position: 'absolute', top: 0, left: 0, right: 0, minHeight: '100vh', width: '100%',
      backgroundColor: '#f3f4f6', fontFamily: '"Inter", sans-serif', color: '#1f2937',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowX: 'hidden',
    },

    // 2. HEADER
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px',
      height: '70px', backgroundColor: '#1f1f1f', color: 'white', width: '100%',
      boxSizing: 'border-box', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    },
    logoSection: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoBox: { backgroundColor: '#f59e0b', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' },
    navSection: { display: 'flex', gap: '20px', alignItems: 'center' },
    navItem: (isActive) => ({
      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px',
      fontSize: '14px', fontWeight: isActive ? '600' : '500',
      backgroundColor: isActive ? '#f59e0b' : 'transparent', color: isActive ? 'white' : '#d1d5db',
      cursor: 'pointer', border: 'none', transition: 'all 0.2s'
    }),
    userSection: { display: 'flex', alignItems: 'center', gap: '20px' },

    // 3. CONTENT AREA
    contentContainer: { padding: '40px 60px', flex: 1, width: '100%', boxSizing: 'border-box' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px' },
    pageTitle: { fontSize: '30px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280' },

    // Stats Cards (Large & Small)
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px', width: '100%' },
    statCard: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '160px', border: '1px solid #e5e7eb' },
    smallStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '35px', width: '100%' },
    smallStatCard: { backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #e5e7eb' },
    iconBox: (bg) => ({ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: bg, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '26px' }),

    // --- DASHBOARD TAB SPECIFIC ---
    deliveryCard: { backgroundColor: 'white', borderRadius: '16px', padding: '35px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
    dcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom:'20px', borderBottom:'1px solid #f3f4f6' },
    dcDetailRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' },
    dcDetailItem: { display: 'flex', gap: '15px', alignItems: 'center' },
    progressContainer: { marginBottom: '30px' },
    progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontWeight:'600' },
    progressBarTrack: { height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' },
    progressBarFill: (percent) => ({ height: '100%', width: `${percent}%`, backgroundColor: '#f59e0b', borderRadius: '5px' }),
    dcActions: { display: 'flex', gap: '15px' },

    // --- COMMON TABLE STYLES (Orders & History) ---
    tableCard: { backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', width: '100%' },
    tableToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    searchBox: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 15px', width: '350px', gap: '10px' },
    searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '18px', backgroundColor: '#f3f4f6', fontSize: '14px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '18px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937', verticalAlign: 'middle' },
    statusBadge: (status) => {
      const colors = { 'In Transit': '#f97316', 'Ready for Pickup': '#eab308', 'Delivered': '#10b981' };
      const bg = colors[status] || '#9ca3af';
      return { backgroundColor: bg, color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
    },
    
    // Buttons
    primaryBtn: { backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
    outlineBtn: { backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },

    footer: { backgroundColor: '#1f1f1f', color: '#9ca3af', padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: 'auto', width: '100%', boxSizing: 'border-box' },

    // --- MODAL STYLES ---
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', width: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.3)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' },
    modalTitle: { margin: 0, color: '#111827', fontSize: '20px', fontWeight: '700' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' },
  };

  return (
    <div style={styles.mainWrapper}>
      
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logoSection}>
          <div style={styles.logoBox}><MdLocalShipping size={24} /></div>
          <div><div style={{fontSize:'16px', fontWeight:'700'}}>Hasal Products</div><div style={{fontSize:'11px', color:'#9ca3af'}}>Manufacturing & Distribution</div></div>
        </div>
        <div style={styles.navSection}>
          <button style={styles.navItem(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}><MdDashboard size={18} /> Dashboard</button>
          <button style={styles.navItem(activeTab === 'orders')} onClick={() => setActiveTab('orders')}><MdShoppingCart size={18} /> Orders</button>
          <button style={styles.navItem(activeTab === 'delivery')} onClick={() => setActiveTab('delivery')}><MdLocalShipping size={18} /> Delivery</button>
        </div>
        <div style={styles.userSection}>
          <div style={{position:'relative'}}><MdNotifications size={24} color="#9ca3af" /><span style={{position:'absolute', top:'-6px', right:'-6px', backgroundColor:'#ef4444', color:'white', fontSize:'10px', width:'16px', height:'16px', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center'}}>1</span></div>
          <button 
            onClick={() => setShowProfileModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: '8px',
              transition: 'background 0.2s',
              color: 'inherit'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'13px', fontWeight:'600', color:'white'}}>{user?.name || 'Delivery Staff'}</div>
              <span style={{fontSize:'10px', backgroundColor:'#f59e0b', padding:'2px 8px', borderRadius:'4px', fontWeight:'600', color:'white'}}>Delivery</span>
            </div>
            <div style={{width:'38px', height:'38px', borderRadius:'50%', backgroundColor:'#f59e0b', display:'flex', justifyContent:'center', alignItems:'center', color:'white', fontWeight:'700'}}>{user?.name?.substring(0, 2).toUpperCase() || 'DS'}</div>
          </button>
          <MdLogout size={24} color="#9ca3af" style={{cursor:'pointer', marginLeft:'10px'}} onClick={handleLogout} title="Logout" />
        </div>
      </header>

      {/* CONTENT */}
      <div style={styles.contentContainer}>
        
        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Dashboard</h1><p style={styles.pageSubtitle}>Welcome back, {user?.name || 'Delivery Staff'}</p></div>
              <div style={{backgroundColor: '#f59e0b', color: 'white', padding: '6px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '12px'}}>Delivery</div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#f59e0b')}><MdLocalShipping /></div><span style={{color:'#10b981',fontWeight:'600'}}>↑ +2</span></div><div><div style={{fontSize:'32px',fontWeight:'700'}}>3</div><div style={{fontSize:'14px',color:'#6b7280'}}>Active Deliveries</div></div></div>
              <div style={styles.statCard}><div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#eab308')}><MdAccessTime /></div></div><div><div style={{fontSize:'32px',fontWeight:'700'}}>1</div><div style={{fontSize:'14px',color:'#6b7280'}}>Pending Assign</div><div style={{fontSize:'12px',color:'#9ca3af'}}>Waiting for acceptance</div></div></div>
              <div style={styles.statCard}><div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#10b981')}><MdCheckCircle /></div><span style={{color:'#10b981',fontWeight:'600'}}>↑ +4</span></div><div><div style={{fontSize:'32px',fontWeight:'700'}}>4</div><div style={{fontSize:'14px',color:'#6b7280'}}>Completed Today</div></div></div>
            </div>

            {/* Current Delivery Card */}
            <div style={styles.deliveryCard}>
              <div style={styles.dcHeader}>
                <div><h3 style={{fontSize:'20px', fontWeight:'700', marginBottom:'5px'}}>Current Delivery</h3><p style={{color:'#6b7280'}}>Order ID: {currentDelivery.id}</p></div>
                <span style={styles.statusBadge(currentDelivery.status)}>{currentDelivery.status}</span>
              </div>
              
              <div style={styles.dcDetailRow}>
                <div style={styles.dcDetailItem}><div style={styles.iconBox('#f3f4f6')}><MdLocationOn color="#f59e0b"/></div><div><div style={{fontSize:'12px',color:'#6b7280'}}>Destination</div><div style={{fontWeight:'600'}}>{currentDelivery.destination}</div></div></div>
                <div style={styles.dcDetailItem}><div style={styles.iconBox('#f3f4f6')}><MdAccessTime color="#f59e0b"/></div><div><div style={{fontSize:'12px',color:'#6b7280'}}>ETA</div><div style={{fontWeight:'600'}}>{currentDelivery.eta}</div></div></div>
                <div style={styles.dcDetailItem}><div style={styles.iconBox('#f3f4f6')}><MdDirectionsCar color="#f59e0b"/></div><div><div style={{fontSize:'12px',color:'#6b7280'}}>Vehicle</div><div style={{fontWeight:'600'}}>{currentDelivery.vehicle}</div></div></div>
              </div>

              <div style={styles.progressContainer}>
                <div style={styles.progressLabels}><span>Picked Up</span><span>In Transit</span><span>Delivered</span></div>
                <div style={styles.progressBarTrack}><div style={styles.progressBarFill(currentDelivery.progress)}></div></div>
              </div>

              <div style={styles.dcActions}>
                <button style={styles.primaryBtn}><MdLocalShipping /> Update Status</button>
                <button style={styles.outlineBtn}><MdMap /> View Route</button>
                <button style={styles.outlineBtn}><MdSupportAgent /> Contact Support</button>
              </div>
            </div>
          </>
        )}

        {/* --- TAB 2: ORDERS --- */}
        {activeTab === 'orders' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Assigned Orders</h1><p style={styles.pageSubtitle}>Orders ready for pickup and delivery</p></div>
            </div>

            <div style={styles.smallStatsGrid}>
              {[{l:'Total Assigned',v:5,c:'#f59e0b',i:<MdShoppingCart/>},{l:'Ready for Pickup',v:2,c:'#eab308',i:<MdAccessTime/>},{l:'In Transit',v:1,c:'#f97316',i:<MdLocalShipping/>},{l:'Delivered',v:2,c:'#10b981',i:<MdCheckCircle/>}].map((s,i)=>(
                <div key={i} style={styles.smallStatCard}><div style={{...styles.iconBox(s.c),width:'45px',height:'45px',fontSize:'22px'}}>{s.i}</div><div><div style={{fontSize:'12px',color:'#6b7280'}}>{s.l}</div><div style={{fontSize:'20px',fontWeight:'700'}}>{s.v}</div></div></div>
              ))}
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableToolbar}>
                <h3 style={{fontSize:'18px', fontWeight:'600'}}>Assigned Orders</h3>
                <div style={styles.searchBox}><MdSearch color="#9ca3af" size={22} /><input type="text" placeholder="Search orders..." style={styles.searchInput} /></div>
              </div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Order ID</th><th style={styles.th}>Pickup Location</th><th style={styles.th}>Delivery Location</th><th style={styles.th}>Items</th><th style={styles.th}>Deadline</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
                <tbody>
                  {assignedOrders.map(o => (
                    <tr key={o.id}><td style={styles.td}>{o.id}</td><td style={styles.td}>{o.pickup}</td><td style={styles.td}>{o.delivery}</td><td style={styles.td}>{o.items}</td><td style={styles.td}>{o.deadline}</td><td style={styles.td}><span style={styles.statusBadge(o.status)}>{o.status}</span></td><td style={styles.td}><div style={{display:'flex', gap:'10px'}}><MdVisibility style={{color:'#6b7280', cursor:'pointer'}} /><MdLocalShipping style={{color:'#f59e0b', cursor:'pointer'}} /></div></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- TAB 3: DELIVERY HISTORY --- */}
        {activeTab === 'delivery' && (
          <>
             <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Delivery History</h1><p style={styles.pageSubtitle}>Past delivery performance records</p></div>
            </div>

            <div style={styles.smallStatsGrid}>
              {[{l:'Total Deliveries',v:25},{l:'On-Time Rate',v:'96%',c:'#10b981'},{l:'Avg Time',v:'4.2 hrs'},{l:'Customer Rating',v:'4.8/5',c:'#f59e0b'}].map((s,i)=>(
                <div key={i} style={{...styles.smallStatCard, height:'100px', flexDirection:'column', alignItems:'flex-start', justifyContent:'center', gap:'5px'}}>
                   <div style={{fontSize:'12px',color:'#6b7280'}}>{s.l}</div><div style={{fontSize:'24px',fontWeight:'700', color:s.c || '#1f2937'}}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableToolbar}>
                <div style={styles.searchBox}><MdSearch color="#9ca3af" size={22} /><input type="text" placeholder="Search history..." style={styles.searchInput} /></div>
                <div style={{display:'flex', gap:'10px'}}>
                  <select style={{padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db'}}><option>This Month</option></select>
                  <button style={styles.outlineBtn}><MdFileDownload /> Export</button>
                </div>
              </div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Delivery ID</th><th style={styles.th}>Order ID</th><th style={styles.th}>Destination</th><th style={styles.th}>Completed Date</th><th style={styles.th}>Duration</th><th style={styles.th}>Status</th><th style={styles.th}>Rating</th><th style={styles.th}>Actions</th></tr></thead>
                <tbody>
                  {deliveryHistory.map(d => (
                    <tr key={d.id}><td style={styles.td}>{d.id}</td><td style={styles.td}>{d.orderId}</td><td style={styles.td}>{d.dest}</td><td style={styles.td}>{d.date}</td><td style={styles.td}>{d.duration}</td><td style={styles.td}><span style={styles.statusBadge(d.status)}>{d.status}</span></td><td style={styles.td}><div style={{display:'flex',alignItems:'center',gap:'5px'}}><MdStar color="#f59e0b"/>{d.rating}</div></td><td style={styles.td}><MdVisibility style={{color:'#6b7280', cursor:'pointer'}} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div>© 2025 Hasal Products | Powered by Innovation and Flavor</div>
        <div style={{display:'flex', gap:'20px'}}>
          <span style={{cursor:'pointer'}}>Privacy Policy</span>
          <span style={{cursor:'pointer'}}>Terms of Service</span>
          <span style={{cursor:'pointer'}}>Contact Support</span>
        </div>
      </footer>
      {/* --- PROFILE MODAL --- */}
      {showProfileModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={{...styles.modalContent, width: '400px', padding: '30px'}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>User Profile</h3>
              <button style={styles.closeBtn} onClick={() => setShowProfileModal(false)}><MdClose size={24} /></button>
            </div>
            <div style={{textAlign: 'center', padding: '20px 0'}}>
              <div style={{width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '32px', fontWeight: '700', margin: '0 auto 15px'}}>{user?.name?.substring(0, 2).toUpperCase() || 'DS'}</div>
              <h2 style={{margin: '0 0 5px 0'}}>{user?.name || 'Delivery Staff'}</h2>
              <p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>dilshan@gmail.com</p>
              <div style={{marginTop: '20px', display: 'inline-block', backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Field Representative</div>
            </div>
            <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '10px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px'}}>
                <span style={{color: '#6b7280'}}>Vehicle:</span>
                <span style={{fontWeight: '600'}}>Tata Ace (WP CA-1234)</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
                <span style={{color: '#6b7280'}}>Status:</span>
                <span style={{fontWeight: '600', color: '#10b981'}}>Available</span>
              </div>
            </div>
            <button style={{...styles.primaryBtn, width: '100%', marginTop: '30px', justifyContent: 'center'}} onClick={() => setShowProfileModal(false)}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}