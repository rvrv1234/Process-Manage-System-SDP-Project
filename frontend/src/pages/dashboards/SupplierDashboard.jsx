import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MdDashboard, MdShoppingCart, MdNotifications, MdLogout, MdFactory, 
  MdLocalShipping, MdAccessTime, MdCheckCircle, MdVisibility, MdFileDownload,
  MdTrendingUp, MdTrendingDown, MdAttachMoney, MdClose
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';

export default function SupplierDashboard() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filter, setFilter] = useState('Total');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ full_name: '', address: '', contact_info: '' });
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', unit_cost: 0 });
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [returnRequests, setReturnRequests] = useState([]);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/suppliers/my-purchase-orders/${user.id}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching supplier orders:", err);
    }
  };

  const handleUpdateStatus = async (poId, newStatus) => {
    if (newStatus === 'Rejected') {
      setSelectedPO(poId);
      setDenyReason('');
      setShowDenyModal(true);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/suppliers/purchase-orders/${poId}/status`, { status: newStatus });
      alert(`Order marked as ${newStatus}!`);
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status.");
    }
  };

  const confirmDeny = async () => {
    if (!denyReason.trim()) {
      alert("Please enter a reason for denial.");
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/suppliers/purchase-orders/${selectedPO}/status`, { 
        status: 'Rejected',
        reason: denyReason
      });
      alert(`Order Rejected successfully.`);
      setShowDenyModal(false);
      fetchOrders();
    } catch (err) {
      console.error("Error rejecting order:", err);
      alert("Failed to reject order.");
    }
  };

  const fetchMyMaterials = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/suppliers/my-materials/${user.id}`);
      setMaterials(res.data || []);
    } catch (err) {
      console.error("Error fetching supplier materials:", err);
    }
  };

  const fetchReturnRequests = async () => {
    if (!user?.id) return;
    try {
      // 1. Fetch approved supplier record for current user
      const supRes = await axios.get('http://localhost:5000/api/suppliers/approved');
      const mySupplierRecord = supRes.data.find(s => 
        (s.user_id && user?.id && String(s.user_id) === String(user.id)) || 
        (s.email?.toLowerCase() === user?.email?.toLowerCase())
      );

      if (mySupplierRecord) {
        const res = await axios.get(`http://localhost:5000/api/returns/supplier/${mySupplierRecord.supplier_id}`);
        setReturnRequests(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching return requests:", err);
    }
  };

  const handleUpdateReturnStatus = async (returnId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this return request?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/returns/${returnId}/status`, { status: newStatus });
      alert(`Return request ${newStatus} successfully!`);
      fetchReturnRequests();
    } catch (err) {
      console.error("Error updating return status:", err);
      alert("Failed to update return status.");
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      // 1. Fetch all approved suppliers
      const supRes = await axios.get('http://localhost:5000/api/suppliers/approved');
      
      // 2. Find the supplier record that matches the current logged-in user
      console.log("DEBUG: Looking for supplier matching:", user);
      console.log("DEBUG: All approved suppliers:", supRes.data);

      const mySupplierRecord = supRes.data.find(s => 
        (s.user_id && user?.id && String(s.user_id) === String(user.id)) || 
        (s.email?.toLowerCase() === user?.email?.toLowerCase())
      );
      
      if (!mySupplierRecord) {
        console.error("Supplier lookup failed for user:", user);
        alert(`Action blocked: Could not find an approved supplier record for ${user?.email || 'this account'}. Please contact the owner.`);
        return;
      }

      await axios.post('http://localhost:5000/api/suppliers/materials', {
        ...newMaterial,
        supplier_id: mySupplierRecord.supplier_id
      });
      
      alert('Material Added Successfully!');
      setShowAddMaterialModal(false);
      setNewMaterial({ name: '', unit_cost: 0 });
      fetchMyMaterials();
    } catch (err) {
      console.error("Error adding material:", err);
      alert("Failed to add material.");
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/suppliers/materials/${id}`);
      alert("Material deleted.");
      fetchMyMaterials();
    } catch (err) {
      console.error("Error deleting material:", err);
      alert("Failed to delete material.");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMyMaterials();
    fetchReturnRequests();
    const interval = setInterval(() => {
      fetchOrders();
      fetchMyMaterials();
      fetchReturnRequests();
    }, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleEditProfileInit = () => {
    setProfileFormData({
      full_name: user?.name || '',
      contact_info: user?.contact_info || user?.phone || '',
      address: user?.address || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/suppliers/update-profile', profileFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUser = { ...user, ...res.data.user };
      // Sync React state and localStorage silently 
      login(updatedUser, token);
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // --- DERIVE STATS FROM REAL DATA ---
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    totalValue: orders.reduce((acc, o) => acc + parseFloat(o.total_amount), 0)
  };

  // --- STYLES ---
  const styles = {
    // 1. MAIN LAYOUT (FORCE FULL SCREEN)
    mainWrapper: {
      position: 'absolute',     // 🔴 Forces breakout from parent containers
      top: 0,
      left: 0,
      right: 0,
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f3f4f6',
      fontFamily: '"Inter", sans-serif',
      color: '#1f2937',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflowX: 'hidden',      // Prevent horizontal scrollbars
    },

    // 2. HEADER
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 40px',
      height: '70px',
      backgroundColor: '#1f1f1f',
      color: 'white',
      width: '100%',
      boxSizing: 'border-box',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    },
    logoSection: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoBox: { backgroundColor: '#f59e0b', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' },
    navSection: { display: 'flex', gap: '20px', alignItems: 'center' },
    navItem: (isActive) => ({
      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px',
      fontSize: '14px', fontWeight: isActive ? '600' : '500',
      backgroundColor: isActive ? '#f59e0b' : 'transparent',
      color: isActive ? 'white' : '#d1d5db',
      cursor: 'pointer', border: 'none', transition: 'all 0.2s'
    }),
    userSection: { display: 'flex', alignItems: 'center', gap: '20px' },
    
    // 3. CONTENT AREA
    contentContainer: { 
      padding: '40px 60px', 
      flex: 1, 
      width: '100%', 
      boxSizing: 'border-box' 
    },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px' },
    pageTitle: { fontSize: '30px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280' },

    // Stats Cards
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: '30px', 
      marginBottom: '40px',
      width: '100%' 
    },
    statCard: {
      backgroundColor: 'white', borderRadius: '16px', padding: '30px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', height: '160px', border: '1px solid #e5e7eb'
    },
    iconBox: (bg) => ({ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: bg, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '26px' }),

    // --- DASHBOARD TAB SPECIFIC ---
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    filterBtnGroup: { display: 'flex', gap: '10px' },
    filterBtn: (label) => ({
      padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
      backgroundColor: filter === label ? '#f59e0b' : 'white',
      color: filter === label ? 'white' : '#374151',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }),
    
    // Order List Card (Dashboard View)
    orderListContainer: { backgroundColor: 'white', borderRadius: '16px', padding: '35px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
    orderItemCard: { backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '25px', marginBottom: '20px', border: '1px solid #e5e7eb' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    orderId: { fontSize: '18px', fontWeight: '700', color: '#1f2937' },
    statusTag: (status) => ({
      backgroundColor: status === 'Pending' ? '#f59e0b' : 
                       status === 'Confirmed' ? '#3b82f6' :
                       status === 'Shipped' ? '#f97316' :
                       status === 'Delivered' ? '#10b981' :
                       status === 'Rejected' ? '#ef4444' : '#6b7280',
      color: 'white', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '600'
    }),
    orderMeta: { fontSize: '14px', color: '#6b7280', marginBottom: '5px' },
    orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' },
    price: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    btnGroup: { display: 'flex', gap: '15px' },
    actionBtn: (bg) => ({
      backgroundColor: bg, color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px',
      fontWeight: '600', cursor: 'pointer', fontSize: '14px'
    }),

    // --- ORDERS TAB SPECIFIC ---
    orderStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '35px', width: '100%' },
    osCard: { backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #e5e7eb' },
    
    // Table
    tableContainer: { backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', width: '100%' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '18px', backgroundColor: '#f3f4f6', fontSize: '14px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '18px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937', verticalAlign: 'middle' },
    
    // Footer
    footer: { backgroundColor: '#1f1f1f', color: '#9ca3af', padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: 'auto', width: '100%', boxSizing: 'border-box' },

    // --- MODAL STYLES ---
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', width: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.3)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' },
    modalTitle: { margin: 0, color: '#111827', fontSize: '20px', fontWeight: '700' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' },
    updateBtn: { backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
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
          <button style={styles.navItem(activeTab === 'orders')} onClick={() => setActiveTab('orders')}><MdShoppingCart size={18} /> Orders</button>
          <button style={styles.navItem(activeTab === 'materials')} onClick={() => setActiveTab('materials')}><MdFactory size={18} /> Materials</button>
          <button style={styles.navItem(activeTab === 'returns')} onClick={() => setActiveTab('returns')}><MdLocalShipping size={18} /> Return Requests</button>
        </div>
        <div style={styles.userSection}>
          <NotificationBell userId={user?.id} />
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
              <div style={{fontSize:'13px', fontWeight:'600', color:'white'}}>{user?.name || 'Supplier User'}</div>
              <span style={{fontSize:'10px', backgroundColor:'#f59e0b', padding:'2px 8px', borderRadius:'4px', fontWeight:'600', color:'white'}}>Supplier</span>
            </div>
            <div style={{width:'38px', height:'38px', borderRadius:'50%', backgroundColor:'#f59e0b', display:'flex', justifyContent:'center', alignItems:'center', color:'white', fontWeight:'700'}}>{user?.name?.substring(0, 2).toUpperCase() || 'SU'}</div>
          </button>
          
          <MdLogout 
            size={24} 
            color="#9ca3af" 
            style={{cursor:'pointer', marginLeft:'10px'}} 
            onClick={handleLogout} 
            title="Logout"
          />
        </div>
      </header>

      {/* CONTENT */}
      <div style={styles.contentContainer}>
        
        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Dashboard</h1><p style={styles.pageSubtitle}>Welcome back, {user?.name || 'Supplier User'}</p></div>
              <div style={{backgroundColor: '#f59e0b', color: 'white', padding: '6px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '12px'}}>Supplier</div>
            </div>

            {/* 3 Stats Cards */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#f59e0b')}><MdShoppingCart /></div><span style={{color:'#10b981',fontWeight:'600'}}>Live</span></div>
                <div><div style={{fontSize:'32px',fontWeight:'700'}}>{stats.total}</div><div style={{fontSize:'14px',color:'#6b7280'}}>Total Orders</div></div>
              </div>
              <div style={styles.statCard}>
                <div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#f59e0b')}><MdAccessTime /></div><span style={{color:'#f59e0b',fontWeight:'600'}}>Active</span></div>
                <div><div style={{fontSize:'32px',fontWeight:'700'}}>{stats.pending}</div><div style={{fontSize:'14px',color:'#6b7280'}}>Pending Orders</div></div>
              </div>
              <div style={styles.statCard}>
                <div style={{display:'flex',justifyContent:'space-between'}}><div style={styles.iconBox('#10b981')}><MdAttachMoney /></div><span style={{color:'#10b981',fontWeight:'600'}}>Total</span></div>
                <div><div style={{fontSize:'28px',fontWeight:'700'}}>LKR {stats.totalValue.toLocaleString()}</div><div style={{fontSize:'14px',color:'#6b7280'}}>Total Value</div></div>
              </div>
            </div>

            {/* Order Management Section */}
            <div style={styles.sectionHeader}>
              <div><h3 style={{fontSize:'18px', fontWeight:'600'}}>Order Management</h3><p style={{fontSize:'13px', color:'#6b7280'}}>Orders from Hasal Products</p></div>
              <div style={styles.filterBtnGroup}>
                {['Total', 'Pending', 'Shipped', 'Delivered', 'Rejected'].map(label => (
                  <button key={label} style={styles.filterBtn(label)} onClick={() => setFilter(label)}>{label} ({label === 'Total' ? orders.length : orders.filter(o => o.status === label).length})</button>
                ))}
              </div>
            </div>

            <div style={styles.orderListContainer}>
              {orders.filter(o => filter === 'Total' || o.status === filter).length === 0 ? (
                <div style={{textAlign:'center', padding:'40px', color:'#6b7280'}}>No orders found in this category.</div>
              ) : orders.filter(o => filter === 'Total' || o.status === filter).map(order => (
                <div key={order.po_id} style={styles.orderItemCard}>
                  <div style={styles.orderHeader}>
                    <div style={styles.orderId}>PO #{order.po_id}</div>
                    <span style={styles.statusTag(order.status)}>{order.status}</span>
                  </div>
                  {order.items_list?.split(', ').map((item, idx) => (
                    <div key={idx} style={styles.orderMeta}>{item}</div>
                  ))}
                  <div style={{...styles.orderMeta, marginTop:'10px'}}>{new Date(order.order_date).toLocaleDateString()}</div>
                  
                  <div style={styles.orderFooter}>
                    <div style={styles.btnGroup}>
                      {order.status === 'Pending' && (
                        <>
                          <button style={styles.actionBtn('#3b82f6')} onClick={() => handleUpdateStatus(order.po_id, 'Confirmed')}>Confirm Order</button>
                          <button style={styles.actionBtn('#ef4444')} onClick={() => handleUpdateStatus(order.po_id, 'Rejected')}>Reject</button>
                        </>
                      )}
                      {order.status === 'Confirmed' && (
                        <button style={styles.actionBtn('#8b5cf6')} onClick={() => handleUpdateStatus(order.po_id, 'Shipped')}>Mark as Shipped</button>
                      )}
                      {order.status === 'Shipped' && (
                        <span style={{fontSize:'14px', color:'#6b7280', fontStyle:'italic'}}>Waiting for receipt confirmation...</span>
                      )}
                      {order.status === 'Rejected' && order.denial_reason && (
                        <div style={{ fontSize: '13px', color: '#ef4444', fontStyle: 'italic', fontWeight: '600' }}>
                          Reason: {order.denial_reason}
                        </div>
                      )}
                    </div>
                    <div style={styles.price}>LKR {Number(order.total_amount).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- TAB 2: ORDERS --- */}
        {activeTab === 'orders' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Purchase Orders</h1><p style={styles.pageSubtitle}>Manage your purchase orders</p></div>
            </div>

            {/* 4 Stats Cards */}
            <div style={styles.orderStatsGrid}>
              {[
                { l:'Total Orders', v:stats.total, i:<MdShoppingCart />, c:'#f59e0b' },
                { l:'Pending', v:stats.pending, i:<MdAccessTime />, c:'#eab308' },
                { l:'Shipped', v:stats.shipped, i:<MdLocalShipping />, c:'#f97316' },
                { l:'Delivered', v:stats.delivered, i:<MdCheckCircle />, c:'#10b981' }
              ].map((s,i) => (
                <div key={i} style={styles.osCard}>
                  <div style={{...styles.iconBox(s.c), borderRadius:'10px', width:'45px', height:'45px', fontSize:'22px'}}>{s.i}</div>
                  <div><div style={{fontSize:'12px', color:'#6b7280'}}>{s.l}</div><div style={{fontSize:'20px', fontWeight:'700'}}>{s.v}</div></div>
                </div>
              ))}
            </div>

            {/* Orders Table */}
            <div style={styles.tableContainer}>
              <h3 style={{fontSize:'18px', fontWeight:'600', marginBottom:'20px'}}>Purchase Orders</h3>
              <p style={{fontSize:'13px', color:'#6b7280', marginBottom:'20px'}}>View and manage all orders history</p>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Summary</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="6" style={{...styles.td, textAlign:'center'}}>No purchase orders found.</td></tr>
                  ) : orders.map(order => (
                    <tr key={order.po_id}>
                      <td style={styles.td}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                          <div style={{backgroundColor:'#f59e0b', padding:'6px', borderRadius:'4px', color:'white'}}><MdShoppingCart /></div>
                          #{order.po_id}
                        </div>
                      </td>
                      <td style={styles.td}>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <div style={{maxWidth:'250px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={order.items_list}>
                          {order.items_list}
                        </div>
                      </td>
                      <td style={styles.td}>LKR {Number(order.total_amount).toLocaleString()}</td>
                      <td style={styles.td}><span style={styles.statusTag(order.status)}>{order.status}</span></td>
                      <td style={styles.td}>
                        <div style={{display:'flex', gap:'10px', color:'#6b7280'}}>
                          <MdVisibility style={{cursor:'pointer'}} title="View Details" />
                          {order.status === 'Pending' && <MdCheckCircle style={{cursor:'pointer', color:'#10b981'}} title="Confirm" onClick={() => handleUpdateStatus(order.po_id, 'Confirmed')} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- TAB 3: MATERIALS --- */}
        {activeTab === 'materials' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>My Materials</h1><p style={styles.pageSubtitle}>Manage your raw material stock and pricing</p></div>
              <button 
                style={styles.actionBtn('#f59e0b')}
                onClick={() => setShowAddMaterialModal(true)}
              >
                + Add New Material
              </button>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Material Name</th>
                    <th style={styles.th}>Unit Cost (LKR)</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr><td colSpan="4" style={{...styles.td, textAlign:'center'}}>No materials added yet.</td></tr>
                  ) : materials.map(mat => (
                    <tr key={mat.material_id}>
                      <td style={styles.td}>{mat.name}</td>
                      <td style={styles.td}>{Number(mat.unit_cost).toLocaleString()}</td>
                      <td style={styles.td}>
                        <button 
                          style={{...styles.actionBtn('#ef4444'), padding:'6px 12px', fontSize:'12px'}}
                          onClick={() => handleDeleteMaterial(mat.material_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ADD MATERIAL MODAL */}
            {showAddMaterialModal && (
              <div style={styles.modalOverlay} onClick={() => setShowAddMaterialModal(false)}>
                <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>Add New Material</h3>
                    <button style={styles.closeBtn} onClick={() => setShowAddMaterialModal(false)}><MdClose size={24} /></button>
                  </div>
                  <form onSubmit={handleAddMaterial} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <div>
                      <label style={{display:'block', marginBottom:'8px', fontSize:'14px', fontWeight:'600'}}>Material Name</label>
                      <input 
                        type="text" 
                        required 
                        style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #e5e7eb'}}
                        value={newMaterial.name}
                        onChange={e => setNewMaterial({...newMaterial, name: e.target.value})}
                        placeholder="e.g. Organic Pepper"
                      />
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'20px'}}>
                      <div>
                        <label style={{display:'block', marginBottom:'8px', fontSize:'14px', fontWeight:'600'}}>Unit Cost (LKR)</label>
                        <input 
                          type="number" 
                          required 
                          style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #e5e7eb'}}
                          value={newMaterial.unit_cost}
                          onChange={e => setNewMaterial({...newMaterial, unit_cost: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>
                    <button type="submit" style={styles.updateBtn}>Add Material</button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- TAB 4: RETURN REQUESTS --- */}
        {activeTab === 'returns' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Return Requests</h1><p style={styles.pageSubtitle}>Review and manage product return requests from the owner</p></div>
            </div>

            <div style={styles.tableContainer}>
              <h3 style={{fontSize:'18px', fontWeight:'600', marginBottom:'20px'}}>Return Request List</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Return ID</th>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Request Date</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRequests.length === 0 ? (
                    <tr><td colSpan="6" style={{...styles.td, textAlign:'center'}}>No return requests found.</td></tr>
                  ) : returnRequests.map(req => (
                    <tr key={req.return_id}>
                      <td style={styles.td}>RET-{req.return_id}</td>
                      <td style={styles.td}>PO-{req.po_id}</td>
                      <td style={styles.td}>
                        <div style={{maxWidth:'300px', fontSize:'13px', color:'#4b5563'}}>
                          {req.reason}
                        </div>
                      </td>
                      <td style={styles.td}>{new Date(req.request_date).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <span style={styles.statusTag(req.status)}>
                          {req.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {req.status === 'Pending' && (
                          <div style={{display:'flex', gap:'10px'}}>
                            <button 
                              style={{...styles.actionBtn('#10b981'), padding:'6px 14px', fontSize:'12px', whiteSpace:'nowrap'}}
                              onClick={() => handleUpdateReturnStatus(req.return_id, 'Approved')}
                            >
                              Approve
                            </button>
                            <button 
                              style={{...styles.actionBtn('#ef4444'), padding:'6px 14px', fontSize:'12px', whiteSpace:'nowrap'}}
                              onClick={() => handleUpdateReturnStatus(req.return_id, 'Rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status !== 'Pending' && (
                          <span style={{fontSize:'12px', color:'#9ca3af', fontStyle:'italic'}}>
                            No actions available
                          </span>
                        )}
                      </td>
                    </tr>
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
              <div style={{width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '32px', fontWeight: '700', margin: '0 auto 15px'}}>{user?.name?.substring(0, 2).toUpperCase() || 'SU'}</div>
              
              {!isEditingProfile ? (
                 <>
                  <h2 style={{margin: '0 0 5px 0'}}>{user?.name || 'Supplier User'}</h2>
                  <p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>{user?.email || 'supplier@example.com'}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Phone: {user?.phone || user?.contact_info || 'No phone provided'}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Address: {user?.address || 'No address provided'}</p>
                  <div style={{marginTop: '20px', display: 'inline-block', backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'}} onClick={handleEditProfileInit}>Edit Account</div>
                 </>
              ) : (
                 <div style={{ textAlign: 'left', marginTop: '10px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Full Name</label>
                    <input type="text" value={profileFormData.full_name} onChange={e => setProfileFormData({...profileFormData, full_name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Contact Info</label>
                    <input type="text" value={profileFormData.contact_info} onChange={e => setProfileFormData({...profileFormData, contact_info: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Address</label>
                    <input type="text" value={profileFormData.address} onChange={e => setProfileFormData({...profileFormData, address: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '10px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px'}}>
                <span style={{color: '#6b7280'}}>Business:</span>
                <span style={{fontWeight: '600'}}>Spice Master Co.</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
                <span style={{color: '#6b7280'}}>Status:</span>
                <span style={{fontWeight: '600', color: '#10b981'}}>Approved</span>
              </div>
            </div>
            {isEditingProfile ? (
              <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button style={{ ...styles.updateBtn, flex: 1, backgroundColor: '#6b7280' }} onClick={() => setIsEditingProfile(false)}>Cancel</button>
                <button style={{ ...styles.updateBtn, flex: 1 }} onClick={handleSaveProfile}>Save</button>
              </div>
            ) : (
              <button style={{...styles.updateBtn, width: '100%', marginTop: '30px'}} onClick={() => setShowProfileModal(false)}>Close</button>
            )}
          </div>
        </div>
      )}

      {/* --- DENY REASON MODAL --- */}
      {showDenyModal && (
        <div style={styles.modalOverlay} onClick={() => setShowDenyModal(false)}>
          <div style={{...styles.modalContent, width: '450px'}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Reason for Rejection</h3>
              <button style={styles.closeBtn} onClick={() => setShowDenyModal(false)}><MdClose size={24} /></button>
            </div>
            <div style={{padding: '10px 0'}}>
              <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '15px'}}>Please explain why you are rejecting PO #{selectedPO}:</p>
              <textarea 
                style={{
                  width: '100%', 
                  height: '120px', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  resize: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                placeholder="e.g. Out of stock, price mismatch, etc."
                value={denyReason}
                onChange={e => setDenyReason(e.target.value)}
              />
              <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                <button 
                  style={{...styles.updateBtn, flex: 1, backgroundColor: '#6b7280'}} 
                  onClick={() => setShowDenyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{...styles.updateBtn, flex: 1, backgroundColor: '#ef4444'}} 
                  onClick={confirmDeny}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}