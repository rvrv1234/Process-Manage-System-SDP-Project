import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MdDashboard, MdShoppingCart, MdLocalShipping, MdNotifications, MdLogout, 
  MdSearch, MdAccessTime, MdCheckCircle, MdVisibility, MdFileDownload,
  MdTrendingUp, MdLocationOn, MdDirectionsCar, MdMap, MdSupportAgent, MdStar, MdClose
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  // --- API DATA STATES ---
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [availRes, myRes] = await Promise.all([
        axios.get('http://localhost:5000/api/delivery/available', config),
        axios.get('http://localhost:5000/api/delivery/my-deliveries', config)
      ]);
      console.log('Fetched Orders for Delivery:', availRes.data);
      console.log('Fetched My Deliveries:', myRes.data);
      setAvailableOrders(availRes.data);
      setMyDeliveries(myRes.data);
    } catch (err) {
      console.error("Failed to load delivery data", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/delivery/claim/${orderId}`, {}, {
         headers: { Authorization: `Bearer ${token}` } 
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim order');
    }
  };

  // Helper to extract city from address string
  const extractCity = (address) => {
    if (!address) return 'Unknown Location';
    const knownCities = ['Galle', 'Baddegama', 'Kalegana', 'Imaduwa', 'Wanduramba', 'Colombo', 'Kandy'];
    for (let city of knownCities) {
        if (address.toLowerCase().includes(city.toLowerCase())) return city;
    }
    return address.split(',').pop().trim(); // Fallback to last segment
  };

  const currentDelivery = myDeliveries.find(d => d.status === 'Picked Up') || null;

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
          <button style={styles.navItem(activeTab === 'available')} onClick={() => setActiveTab('available')}><MdShoppingCart size={18} /> Available Orders</button>
          <button style={styles.navItem(activeTab === 'my-deliveries')} onClick={() => setActiveTab('my-deliveries')}><MdLocalShipping size={18} /> My Deliveries</button>
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
            {currentDelivery ? (
            <div style={styles.deliveryCard}>
              <div style={styles.dcHeader}>
                <div><h3 style={{fontSize:'20px', fontWeight:'700', marginBottom:'5px'}}>Current Active Delivery</h3><p style={{color:'#6b7280'}}>Order ID: {currentDelivery.id}</p></div>
                <span style={styles.statusBadge(currentDelivery.status)}>{currentDelivery.status}</span>
              </div>
              
              <div style={styles.dcDetailRow}>
                <div style={styles.dcDetailItem}><div style={styles.iconBox('#f3f4f6')}><MdLocationOn color="#f59e0b"/></div><div><div style={{fontSize:'12px',color:'#6b7280'}}>Destination City</div><div style={{fontWeight:'600'}}>{extractCity(currentDelivery.delivery)}</div></div></div>
                <div style={styles.dcDetailItem}><div style={styles.iconBox('#f3f4f6')}><MdAccessTime color="#f59e0b"/></div><div><div style={{fontSize:'12px',color:'#6b7280'}}>Deadline</div><div style={{fontWeight:'600'}}>{new Date(currentDelivery.deadline).toLocaleDateString()}</div></div></div>
                <div style={styles.dcDetailItem}><div style={styles.iconBox('#f3f4f6')}><MdDirectionsCar color="#f59e0b"/></div><div><div style={{fontSize:'12px',color:'#6b7280'}}>Vehicle</div><div style={{fontWeight:'600'}}>Delivery Fleet</div></div></div>
              </div>

              <div style={styles.progressContainer}>
                <div style={styles.progressLabels}><span>Picked Up</span><span>In Transit</span><span>Delivered</span></div>
                <div style={styles.progressBarTrack}><div style={styles.progressBarFill(50)}></div></div>
              </div>

              <div style={styles.dcActions}>
                <button style={styles.primaryBtn}><MdLocalShipping /> Complete Delivery</button>
                <button style={styles.outlineBtn}><MdMap /> View Route</button>
              </div>
            </div>
            ) : (
                <div style={{backgroundColor:'white', padding:'40px', borderRadius:'16px', textAlign:'center', border:'1px dashed #d1d5db', color:'#6b7280'}}>
                    <MdLocalShipping size={48} color="#e5e7eb" style={{marginBottom:'10px'}}/>
                    <h3>No Active Deliveries</h3>
                    <p>You have no ongoing deliveries. Claim a new order from the Available Orders tab!</p>
                </div>
            )}
          </>
        )}

        {/* --- TAB 2: AVAILABLE ORDERS --- */}
        {activeTab === 'available' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Available Orders</h1><p style={styles.pageSubtitle}>Packages waiting in the warehouse to be claimed</p></div>
            </div>

            <div style={styles.smallStatsGrid}>
              {[{l:'Waiting for Pickup',v:availableOrders.length,c:'#f59e0b',i:<MdShoppingCart/>},{l:'Urgent Deliveries',v:0,c:'#ef4444',i:<MdAccessTime/>}].map((s,i)=>(
                <div key={i} style={styles.smallStatCard}><div style={{...styles.iconBox(s.c),width:'45px',height:'45px',fontSize:'22px'}}>{s.i}</div><div><div style={{fontSize:'12px',color:'#6b7280'}}>{s.l}</div><div style={{fontSize:'20px',fontWeight:'700'}}>{s.v}</div></div></div>
              ))}
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableToolbar}>
                <h3 style={{fontSize:'18px', fontWeight:'600'}}>All Unassigned Deliveries</h3>
                <div style={styles.searchBox}><MdSearch color="#9ca3af" size={22} /><input type="text" placeholder="Search locations..." style={styles.searchInput} /></div>
              </div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Order #ID</th><th style={styles.th}>City / Area</th><th style={styles.th}>Full Address</th><th style={styles.th}>Contents</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
                <tbody>
                  {availableOrders.map(o => (
                    <tr key={o.id}>
                        <td style={styles.td}><strong>#{o.id}</strong></td>
                        <td style={styles.td}>
                            <span style={{backgroundColor:'#fef3c7', padding:'6px 12px', borderRadius:'6px', color:'#92400e', fontWeight:'600'}}>{extractCity(o.delivery)}</span>
                        </td>
                        <td style={styles.td}><div style={{fontSize:'12px', color:'#6b7280'}}>{o.delivery}</div></td>
                        <td style={styles.td}>
                            <div style={{fontSize:'13px', lineHeight:'1.4', maxWidth:'250px'}}>{o.items}</div>
                        </td>
                        <td style={styles.td}>
                            <span style={styles.statusBadge(o.status)}>{o.status}</span>
                        </td>
                        <td style={styles.td}>
                            <button onClick={() => handleClaimOrder(o.delivery_id)} style={{...styles.primaryBtn, backgroundColor:'#10b981', padding:'8px 16px'}}><MdCheckCircle /> Accept Order</button>
                        </td>
                    </tr>
                  ))}
                  {availableOrders.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#6b7280'}}>No available orders right now.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- TAB 3: MY DELIVERIES --- */}
        {activeTab === 'my-deliveries' && (
          <>
             <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>My Deliveries</h1><p style={styles.pageSubtitle}>Track your active assignments and completed trips</p></div>
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableToolbar}>
                <h3 style={{fontSize:'18px', fontWeight:'600'}}>Your Delivery Queue</h3>
                <div style={{display:'flex', gap:'10px'}}>
                  <button style={styles.outlineBtn}><MdFileDownload /> Export</button>
                </div>
              </div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Order ID</th><th style={styles.th}>Destination</th><th style={styles.th}>Date</th><th style={styles.th}>Contents</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
                <tbody>
                  {myDeliveries.map(d => (
                    <tr key={d.id}>
                        <td style={styles.td}>#{d.id}</td>
                        <td style={styles.td}>
                            <strong style={{display:'block'}}>{extractCity(d.dest)}</strong>
                            <span style={{fontSize:'12px', color:'#6b7280'}}>{d.dest}</span>
                        </td>
                        <td style={styles.td}>{new Date(d.date).toLocaleDateString()}</td>
                        <td style={styles.td}><div style={{fontSize:'13px', lineHeight:'1.4', maxWidth:'200px'}}>{d.items}</div></td>
                        <td style={styles.td}><span style={styles.statusBadge(d.status)}>{d.status}</span></td>
                        <td style={styles.td}>
                            {d.status !== 'Delivered' ? (
                                <button style={{...styles.primaryBtn, backgroundColor:'#3b82f6', padding:'6px 12px'}}><MdLocalShipping /> Process</button>
                            ) : (
                                <span style={{color:'#10b981', fontSize:'13px', fontWeight:'600'}}>Completed</span>
                            )}
                        </td>
                    </tr>
                  ))}
                  {myDeliveries.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#6b7280'}}>You have no assigned deliveries.</td></tr>}
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