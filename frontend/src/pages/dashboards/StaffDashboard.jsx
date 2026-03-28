import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import Axios for API calls
import {
  MdDashboard, MdInventory, MdFactory, MdNotifications, MdLogout, 
  MdSearch, MdAdd, MdDownload, MdEdit, MdDelete, MdCheckCircle, 
  MdAccessTime, MdArrowForward, MdTrendingUp, MdClose
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- NEW STATE FOR UPDATE CATALOG FEATURE ---
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [apiProducts, setApiProducts] = useState([]); // Products fetched from DB for dropdown
  const [batches, setBatches] = useState([]); // Real production batches
  const [selectedProduct, setSelectedProduct] = useState('');
  const [packetCounts, setPacketCounts] = useState({
      '50g': 0,
      '100g': 0,
      '200g': 0
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // --- API CALLS ---
  const fetchProducts = async () => {
    try {
        // Fetching products for the inventory table and dropdown
        const res = await axios.get('http://localhost:5000/api/products');
        setApiProducts(res.data);
    } catch (err) {
        console.error('Failed to fetch products:', err);
    }
  };

  const fetchBatches = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/production/grouped-orders');
        setBatches(res.data);
    } catch (err) {
        console.error('Failed to fetch production batches:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBatches();

    // Polling for real-time updates
    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePacketChange = (weight, value) => {
    setPacketCounts({
        ...packetCounts,
        [weight]: value
    });
  };

  const handleUpdateBatchStatus = async (orderId, newStatus) => {
    try {
        await axios.put(`http://localhost:5000/api/production/${orderId}/status`, { status: newStatus });
        fetchBatches();
    } catch (err) {
        console.error('Failed to update batch status:', err);
        alert('Failed to update batch status.');
    }
  };

  const handleUpdateCatalog = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
        alert("Please select a product.");
        return;
    }

    try {
        await axios.put('http://localhost:5000/api/staff/catalog', {
            productId: selectedProduct,
            packets: packetCounts
        });

        alert("Catalog updated successfully!");
        setShowUpdateModal(false);
        setPacketCounts({ '50g': 0, '100g': 0, '200g': 0 }); // Reset
        fetchProducts(); // Refresh the list to show new counts
    } catch (error) {
        console.error("Error updating catalog:", error);
        alert(error.response?.data?.message || "Failed to update catalog. Check backend connection.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const getStockStatus = (stock) => {
    const level = parseFloat(stock) || 0;
    if (level > 10) return { label: 'In Stock', color: '#10b981' };
    if (level > 0) return { label: 'Low Stock', color: '#eab308' };
    return { label: 'Out of Stock', color: '#ef4444' };
  };

  // --- STYLES ---
  const styles = {
    // 1. MAIN LAYOUT
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

    // Stats Cards
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px', width: '100%' },
    statCard: {
      backgroundColor: 'white', borderRadius: '16px', padding: '30px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', height: '160px', border: '1px solid #e5e7eb'
    },
    invStatCard: (isActive) => ({ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '15px', 
      border: isActive ? '2px solid #f59e0b' : '1px solid #e5e7eb', 
      boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      transform: isActive ? 'translateY(-2px)' : 'none'
    }),
    iconBox: (bg) => ({ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: bg, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '26px' }),

    // --- DASHBOARD TAB SPECIFIC ---
    queueContainer: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
    queueItem: { backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '20px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: (status) => ({
      backgroundColor: status === 'In Process' ? '#f59e0b' : '#eab308',
      color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
    }),

    // --- INVENTORY TAB ---
    tableCard: { backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
    tableToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    searchBox: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', width: '300px', gap: '8px' },
    searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
    primaryBtn: { backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
    outlineBtn: { backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '15px', backgroundColor: '#f3f4f6', fontSize: '13px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '15px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937', verticalAlign: 'middle' },
    
    // --- PRODUCTION TAB (KANBAN) ---
    prodGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' },
    prodCol: (bg) => ({ backgroundColor: bg, borderRadius: '12px', padding: '20px', minHeight: '400px' }),
    prodColHeader: (color) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: color, fontWeight: '600', fontSize: '16px' }),
    prodCard: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
    prodTag: (bg, text) => ({ backgroundColor: bg, color: text, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }),
    prodBtn: (bg, text) => ({ width: '100%', backgroundColor: bg, color: text, border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '600', marginTop: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }),
    
    // --- MODAL STYLES (NEW) ---
    modalOverlay: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    },
    modalContent: {
        backgroundColor: '#fff', padding: '20px 30px', borderRadius: '8px', width: '500px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)', position: 'relative'
    },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    modalTitle: { margin: 0, color: '#333', fontSize: '20px', fontWeight: '700' },
    closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' },
    modalBody: { display: 'flex', flexDirection: 'column' },
    modalLabel: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555', fontSize: '14px', marginTop: '10px' },
    modalSelect: { width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', color: '#333', backgroundColor: 'white'},
    packetInputGroup: { display: 'flex', alignItems: 'center', marginBottom: '15px' },
    weightBadge: (color) => ({
        display: 'inline-block', width: '60px', padding: '8px 0', textAlign: 'center',
        borderRadius: '20px', color: 'white', fontWeight: 'bold', marginRight: '15px',
        backgroundColor: color, fontSize: '13px'
    }),
    packetInput: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'left', color: '#333', backgroundColor: 'white' },
    unitText: { marginLeft: '10px', color: '#777', fontSize: '14px', whiteSpace: 'nowrap' },
    modalFooter: { display: 'flex', justifyContent: 'flex-start', marginTop: '20px', gap: '10px' },
    updateBtn: { backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { backgroundColor: '#e0e0e0', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
    infoText: { fontSize: '12px', color: '#6b7280', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '4px', marginTop: '10px' },
    label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555', fontSize: '14px' },
    input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', color: '#333', backgroundColor: 'white' },

    footer: { backgroundColor: '#1f1f1f', color: '#9ca3af', padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: 'auto', width: '100%', boxSizing: 'border-box' }
  };

  return (
    <div style={styles.mainWrapper}>
      
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logoSection}>
          <div style={styles.logoBox}><MdFactory size={22} /></div>
          <div><div style={{fontSize:'16px', fontWeight:'700'}}>Hasal Products</div><div style={{fontSize:'11px', color:'#9ca3af'}}>Manufacturing & Distribution</div></div>
        </div>
        <div style={styles.navSection}>
          <button style={styles.navItem(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}><MdDashboard size={18} /> Dashboard</button>
          <button style={styles.navItem(activeTab === 'inventory')} onClick={() => setActiveTab('inventory')}><MdInventory size={18} /> Inventory</button>
          <button style={styles.navItem(activeTab === 'production')} onClick={() => setActiveTab('production')}><MdFactory size={18} /> Production</button>
        </div>
        <div style={styles.userSection}>
          <div style={{position:'relative'}}><MdNotifications size={24} color="#9ca3af" /><span style={{position:'absolute', top:'-6px', right:'-6px', backgroundColor:'#ef4444', color:'white', fontSize:'10px', width:'16px', height:'16px', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center'}}>2</span></div>
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
              <div style={{fontSize:'13px', fontWeight:'600', color:'white'}}>{user?.name || 'Staff User'}</div>
              <span style={{fontSize:'10px', backgroundColor:'#f59e0b', padding:'2px 8px', borderRadius:'4px', fontWeight:'600', color:'white'}}>Staff</span>
            </div>
            <div style={{width:'38px', height:'38px', borderRadius:'50%', backgroundColor:'#f59e0b', display:'flex', justifyContent:'center', alignItems:'center', color:'white', fontWeight:'700'}}>{user?.name?.substring(0, 2).toUpperCase() || 'ST'}</div>
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
              <div><h1 style={styles.pageTitle}>Dashboard</h1><p style={styles.pageSubtitle}>Welcome back, {user?.name || 'Staff User'}</p></div>
              <div style={{backgroundColor: '#f59e0b', color: 'white', padding: '6px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '12px'}}>Staff</div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#f59e0b')}><MdFactory /></div><span style={{color:'#10b981',fontWeight:'600'}}>↑</span></div>
                <div><div style={{fontSize:'32px',fontWeight:'700'}}>{batches.filter(b => b.status === 'To Produce' || b.status === 'In Process').length}</div><div style={{fontSize:'14px',color:'#6b7280'}}>Active Batches</div></div>
              </div>
              <div style={styles.statCard}>
                <div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#f59e0b')}><MdAccessTime /></div><span style={{color:'white',fontWeight:'600'}}></span></div>
                <div><div style={{fontSize:'32px',fontWeight:'700'}}>{batches.filter(b => b.status === 'In Process').length}</div><div style={{fontSize:'14px',color:'#6b7280'}}>In Production</div></div>
              </div>
              <div style={styles.statCard}>
                <div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#10b981')}><MdTrendingUp /></div><span style={{color:'#10b981',fontWeight:'600'}}>↑</span></div>
                <div><div style={{fontSize:'32px',fontWeight:'700'}}>{batches.filter(b => b.status === 'Completed').length}</div><div style={{fontSize:'14px',color:'#6b7280'}}>Completed Total</div></div>
              </div>
            </div>

            {/* Production Queue List */}
            <div style={{marginBottom:'20px'}}>
              <h3 style={{fontSize:'18px', fontWeight:'600', marginBottom:'5px'}}>Production Queue</h3>
              <p style={{fontSize:'14px', color:'#6b7280'}}>Your assigned production batches</p>
            </div>

            {batches.filter(b => b.status !== 'Completed').map((item, idx) => (
              <div key={item.order_id} style={styles.queueItem}>
                <div>
                  <h4 style={{margin:'0 0 5px 0', fontSize:'16px', color:'#374151'}}>Order #{item.order_id} - {item.customer_name}</h4>
                  <div style={{fontSize:'13px', color:'#6b7280'}}>Items: {item.merged_items}</div>
                  <div style={{fontSize:'11px', color:'#9ca3af'}}>Due: {new Date(item.due_date).toLocaleDateString()}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <span style={styles.statusBadge(item.status)}>{item.status}</span>
                  <div style={{fontSize:'11px', color:'#9ca3af', marginTop:'5px'}}>{item.assigned_team}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* --- TAB 2: INVENTORY --- */}
        {activeTab === 'inventory' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Inventory Management</h1><p style={styles.pageSubtitle}>Manage your spice products and stock levels</p></div>
            </div>

            {/* Inventory Stats */}
            <div style={{...styles.statsGrid, gridTemplateColumns: 'repeat(4, 1fr)'}}>
              {[
                {label:'Total Products', val:apiProducts.length, col:'#f59e0b', filter: 'All'},
                {label:'In Stock', val:apiProducts.filter(p => getStockStatus(p.stock_level).label === 'In Stock').length, col:'#10b981', filter: 'In Stock'},
                {label:'Low Stock', val:apiProducts.filter(p => getStockStatus(p.stock_level).label === 'Low Stock').length, col:'#eab308', filter: 'Low Stock'},
                {label:'Out of Stock', val:apiProducts.filter(p => getStockStatus(p.stock_level).label === 'Out of Stock').length, col:'#ef4444', filter: 'Out of Stock'}
              ].map((s,i) => (
                <div 
                  key={i} 
                  style={styles.invStatCard(inventoryFilter === s.filter)}
                  onClick={() => setInventoryFilter(s.filter)}
                >
                  <div style={{...styles.iconBox(s.col),marginBottom:0,borderRadius:'10px',width:'45px',height:'45px',fontSize:'22px'}}>
                    <MdInventory />
                  </div>
                  <div>
                    <div style={{fontSize:'12px',color:'#6b7280'}}>{s.label}</div>
                    <div style={{fontSize:'20px',fontWeight:'700'}}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory Table */}
            <div style={styles.tableCard}>
              <div style={styles.tableToolbar}>
                <div><h3 style={{fontSize:'18px', fontWeight:'600'}}>Products Catalog</h3><p style={{fontSize:'13px', color:'#6b7280'}}>View and manage all spice products</p></div>
                <div style={{display:'flex', gap:'10px'}}>
                  {/* Export CSV button removed */}
                  {/* UPDATED BUTTON */}
                  <button style={styles.primaryBtn} onClick={() => setShowUpdateModal(true)}>
                    <MdEdit /> Update Catalog
                  </button>
                </div>
              </div>

              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                <div style={styles.searchBox}>
                  <MdSearch color="#9ca3af" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search products (Name or ID)..." 
                    style={styles.searchInput} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select style={{padding:'8px', borderRadius:'8px', border:'1px solid #d1d5db'}}><option>All</option></select>
              </div>

              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Product ID</th><th style={styles.th}>Name</th><th style={styles.th}>Packets (Available)</th><th style={styles.th}>Stock (Bulk)</th><th style={styles.th}>Price (Base)</th><th style={styles.th}>Status</th></tr></thead>
                <tbody>
                  {(() => {
                    const filteredProducts = apiProducts.filter(item => {
                      // 1. Filter by Stock Status
                      const statusMatch = inventoryFilter === 'All' || getStockStatus(item.stock_level).label === inventoryFilter;
                      
                      // 2. Filter by Search Term (Name or ID)
                      const searchStr = searchTerm.toLowerCase();
                      const nameMatch = item.name.toLowerCase().includes(searchStr);
                      const idMatch = `#${item.product_id}`.includes(searchStr) || String(item.product_id).includes(searchStr);
                      
                      return statusMatch && (nameMatch || idMatch);
                    });

                    if (apiProducts.length === 0) {
                      return <tr><td colSpan="6" style={{...styles.td, textAlign:'center'}}>No products found in catalog.</td></tr>;
                    }

                    if (filteredProducts.length === 0) {
                      return <tr><td colSpan="6" style={{...styles.td, textAlign:'center'}}>No products match your search "{searchTerm}".</td></tr>;
                    }

                    return filteredProducts.map(item => {
                      const statusInfo = getStockStatus(item.stock_level);
                      return (
                        <tr key={item.product_id}>
                          <td style={styles.td}>#{item.product_id}</td>
                          <td style={styles.td}>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                              <div style={{backgroundColor:'#f59e0b', padding:'6px', borderRadius:'4px', color:'white'}}>
                                <MdInventory />
                              </div> 
                              {item.name}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={{fontSize:'12px', display:'flex', flexWrap:'wrap', gap:'5px'}}>
                              {item.packets && item.packets.length > 0 ? (
                                item.packets.map(p => (
                                  <span key={p.weight} style={{backgroundColor:'#f3f4f6', padding:'2px 6px', borderRadius:'4px'}}>
                                    {p.weight}: <strong>{p.quantity}</strong>
                                  </span>
                                ))
                              ) : (
                                <span style={{color:'#9ca3af', fontStyle:'italic'}}>No packets added</span>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            {parseFloat(item.stock_level || 0).toLocaleString()} kg
                          </td>
                          <td style={styles.td}>LKR {Number(item.price).toLocaleString()}</td>
                          <td style={styles.td}>
                            <span style={{
                              backgroundColor: statusInfo.color, 
                              color:'white', padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'600'
                            }}>
                              {statusInfo.label}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- TAB 3: PRODUCTION --- */}
        {activeTab === 'production' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Production Management</h1><p style={styles.pageSubtitle}>Track and manage production batches</p></div>
              <button style={styles.primaryBtn}><MdAdd /> New Batch</button>
            </div>

            {/* Production Stats */}
            <div style={{...styles.statsGrid, gridTemplateColumns: 'repeat(4, 1fr)'}}>
              {[
                {l:'Total Batches', v:batches.length, i:<MdFactory />, c:'#f59e0b'},
                {l:'To Produce', v:batches.filter(b => b.status === 'To Produce').length, i:<MdAccessTime />, c:'#eab308'},
                {l:'In Process', v:batches.filter(b => b.status === 'In Process').length, i:<MdArrowForward />, c:'#f97316'},
                {l:'Completed', v:batches.filter(b => b.status === 'Completed' || b.status === 'Ready for Delivery').length, i:<MdCheckCircle />, c:'#10b981'}
              ].map((s,i) => (
                 <div key={i} style={styles.invStatCard}><div style={{...styles.iconBox(s.c),marginBottom:0,borderRadius:'10px',width:'45px',height:'45px',fontSize:'22px'}}>{s.i}</div><div><div style={{fontSize:'12px',color:'#6b7280'}}>{s.l}</div><div style={{fontSize:'20px',fontWeight:'700'}}>{s.v}</div></div></div>
              ))}
            </div>

            {/* Kanban Board */}
            <div style={styles.prodGrid}>
              {/* Column 1: To Produce */}
              <div style={styles.prodCol('#fefce8')}>
                <div style={styles.prodColHeader('#a16207')}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><MdAccessTime /> To Produce</div><span style={{backgroundColor:'#a16207',color:'white',padding:'2px 8px',borderRadius:'12px',fontSize:'12px'}}>{batches.filter(b => b.status === 'To Produce').length}</span></div>
                {batches.filter(b => b.status === 'To Produce').map(batch => (
                  <div key={batch.order_id} style={styles.prodCard}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
                      <h4 style={{margin:0}}>
                        Order #{batch.order_id} - {batch.customer_name}
                      </h4>
                      <span style={styles.prodTag('#eab308','white')}>To Produce</span>
                    </div>
                    <div style={{fontSize:'13px',color:'#6b7280',marginBottom:'15px', lineHeight: '1.4'}}>
                      {batch.merged_items}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#6b7280',marginBottom:'5px'}}><span>Due Date:</span><span>{new Date(batch.due_date).toLocaleDateString()}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#6b7280'}}><span>Assigned To:</span><span>{batch.assigned_team}</span></div>
                    <button onClick={() => handleUpdateBatchStatus(batch.order_id, 'In Process')} style={styles.prodBtn('#eab308','white')}><MdArrowForward /> Start Production</button>
                  </div>
                ))}
              </div>

              {/* Column 2: In Process */}
              <div style={styles.prodCol('#fff7ed')}>
                <div style={styles.prodColHeader('#c2410c')}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><MdArrowForward /> In Process</div><span style={{backgroundColor:'#c2410c',color:'white',padding:'2px 8px',borderRadius:'12px',fontSize:'12px'}}>{batches.filter(b => b.status === 'In Process').length}</span></div>
                {batches.filter(b => b.status === 'In Process').map(batch => (
                  <div key={batch.order_id} style={styles.prodCard}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
                      <h4 style={{margin:0}}>
                        Order #{batch.order_id} - {batch.customer_name}
                      </h4>
                      <span style={styles.prodTag('#f97316','white')}>In Process</span>
                    </div>
                    <div style={{fontSize:'13px',color:'#6b7280',marginBottom:'15px', lineHeight: '1.4'}}>
                      {batch.merged_items}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#6b7280',marginBottom:'5px'}}><span>Start Date:</span><span>{batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'Today'}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#6b7280',marginBottom:'5px'}}><span>Due Date:</span><span>{new Date(batch.due_date).toLocaleDateString()}</span></div>
                    <button onClick={() => handleUpdateBatchStatus(batch.order_id, 'Completed')} style={styles.prodBtn('#10b981','white')}><MdCheckCircle /> Mark Complete</button>
                  </div>
                ))}
              </div>

              {/* Column 3: Completed */}
              <div style={styles.prodCol('#f0fdf4')}>
                <div style={styles.prodColHeader('#15803d')}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><MdCheckCircle /> Completed</div><span style={{backgroundColor:'#15803d',color:'white',padding:'2px 8px',borderRadius:'12px',fontSize:'12px'}}>{batches.filter(b => b.status === 'Completed' || b.status === 'Ready for Delivery').length}</span></div>
                {batches.filter(b => b.status === 'Completed' || b.status === 'Ready for Delivery').map(batch => (
                  <div key={batch.order_id} style={styles.prodCard}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
                      <h4 style={{margin:0}}>
                        Order #{batch.order_id} - {batch.customer_name}
                      </h4>
                      <span style={styles.prodTag('#10b981','white')}>Completed</span>
                    </div>
                    <div style={{fontSize:'13px',color:'#6b7280',marginBottom:'15px', lineHeight: '1.4'}}>
                      {batch.merged_items}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#6b7280',marginBottom:'5px'}}><span>Completed:</span><span>{batch.completed_date ? new Date(batch.completed_date).toLocaleDateString() : 'Recently'}</span></div>
                    <button style={{...styles.prodBtn('#10b981','white'), opacity:0.8, cursor:'default'}}>Completed ✓</button>
                  </div>
                ))}
              </div>
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
          <div style={{...styles.modalContent, width: '400px'}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>User Profile</h3>
              <button style={styles.closeBtn} onClick={() => setShowProfileModal(false)}><MdClose size={24} /></button>
            </div>
            <div style={{textAlign: 'center', padding: '20px 0'}}>
              <div style={{width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '32px', fontWeight: '700', margin: '0 auto 15px'}}>{user?.name?.substring(0, 2).toUpperCase() || 'ST'}</div>
              <h2 style={{margin: '0 0 5px 0'}}>{user?.name || 'Staff User'}</h2>
              <p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>saman@gmail.com</p>
              <div style={{marginTop: '20px', display: 'inline-block', backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Production Staff</div>
            </div>
            <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '10px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px'}}>
                <span style={{color: '#6b7280'}}>Team:</span>
                <span style={{fontWeight: '600'}}>Production Team A</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
                <span style={{color: '#6b7280'}}>Status:</span>
                <span style={{fontWeight: '600', color: '#10b981'}}>On Duty</span>
              </div>
            </div>
            <button style={{...styles.updateBtn, width: '100%', marginTop: '30px'}} onClick={() => setShowProfileModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* --- UPDATE CATALOG MODAL --- */}
      {showUpdateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowUpdateModal(false)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>Update Product Catalog</h3>
                    <button style={styles.closeBtn} onClick={() => setShowUpdateModal(false)}><MdClose /></button>
                </div>
                
                <div style={styles.modalBody}>
                    {/* Additive Update Notice */}
              <div style={{backgroundColor:'#fffbeb', padding:'12px', borderRadius:'8px', border:'1px solid #fef3c7', marginBottom:'15px', fontSize:'13px', color:'#92400e'}}>
                <strong>Note:</strong> Quantities entered below will be <strong>added</strong> to the current remaining stock.
              </div>

                    <p style={styles.pageSubtitle}>Update product availability in the customer catalog</p>

                    <label style={styles.modalLabel}>Select Product</label>
                    <select
                        style={styles.modalSelect}
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                        <option value="">-- Select a Product --</option>
                        {apiProducts.map((product) => (
                            <option key={product.product_id} value={product.product_id}>
                                {product.name}
                            </option>
                        ))}
                    </select>

                    <label style={styles.modalLabel}>Update Packet Quantities (number of NEW packets to add)</label>
                    
                    {/* 50g Input */}
                    <div style={styles.packetInputGroup}>
                        <div style={{display:'flex', justifyContent:'space-between', width:'100%', marginBottom:'5px'}}>
                            <span style={styles.weightBadge('#f59e0b')}>50g</span>
                            <span style={{fontSize:'12px', color:'#6b7280'}}>Current Remaining: <strong>{apiProducts.find(p => p.product_id === Number(selectedProduct))?.packets?.find(pkg => pkg.weight === '50g')?.quantity || 0}</strong></span>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', width:'100%'}}>
                          <input
                              type="number"
                              min="0"
                              style={styles.packetInput}
                              value={packetCounts['50g']}
                              onChange={(e) => handlePacketChange('50g', e.target.value)}
                              placeholder="0"
                          />
                          <span style={styles.unitText}>packets</span>
                        </div>
                    </div>

                    {/* 100g Input */}
                    <div style={styles.packetInputGroup}>
                        <div style={{display:'flex', justifyContent:'space-between', width:'100%', marginBottom:'5px'}}>
                            <span style={styles.weightBadge('#10b981')}>100g</span>
                            <span style={{fontSize:'12px', color:'#6b7280'}}>Current Remaining: <strong>{apiProducts.find(p => p.product_id === Number(selectedProduct))?.packets?.find(pkg => pkg.weight === '100g')?.quantity || 0}</strong></span>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', width:'100%'}}>
                          <input
                              type="number"
                              min="0"
                              style={styles.packetInput}
                              value={packetCounts['100g']}
                              onChange={(e) => handlePacketChange('100g', e.target.value)}
                              placeholder="0"
                          />
                          <span style={styles.unitText}>packets</span>
                        </div>
                    </div>

                    {/* 200g Input */}
                    <div style={styles.packetInputGroup}>
                        <div style={{display:'flex', justifyContent:'space-between', width:'100%', marginBottom:'5px'}}>
                            <span style={styles.weightBadge('#3b82f6')}>200g</span>
                            <span style={{fontSize:'12px', color:'#6b7280'}}>Current Remaining: <strong>{apiProducts.find(p => p.product_id === Number(selectedProduct))?.packets?.find(pkg => pkg.weight === '200g')?.quantity || 0}</strong></span>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', width:'100%'}}>
                          <input
                              type="number"
                              min="0"
                              style={styles.packetInput}
                              value={packetCounts['200g']}
                              onChange={(e) => handlePacketChange('200g', e.target.value)}
                              placeholder="0"
                          />
                          <span style={styles.unitText}>packets</span>
                        </div>
                    </div>
                    
                    <div style={styles.infoText}>
                        Update the available quantities for each packet size after processing.
                    </div>

                </div>
                
                <div style={styles.modalFooter}>
                    <button style={styles.updateBtn} onClick={handleUpdateCatalog}>Update Catalog</button>
                    <button style={styles.cancelBtn} onClick={() => setShowUpdateModal(false)}>Cancel</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}