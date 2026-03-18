import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MdDashboard, MdShoppingCart, MdInventory, MdPeople, MdFactory, MdLocalShipping, MdAssessment,
  MdNotifications, MdLogout, MdTrendingUp, MdAttachMoney, MdShowChart, MdAdd, MdVisibility,
  MdCheckCircle, MdCancel, MdSearch, MdEdit, MdStar, MdPhone, MdEmail, MdMessage,
  MdDownload, MdTimer, MdArrowForward, MdAccessTime, MdFileDownload, MdClose, MdBadge, MdDelete
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSupplierId, setSelectedSupplierId] = useState(1);

  // --- STATE FOR PENDING REQUESTS ---
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);

  // --- NEW STATE FOR STAFF MANAGEMENT ---
  const [staffList, setStaffList] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Staff', email: '', phone: '', password: '' });

  // --- STATE FOR INVENTORY MANAGEMENT ---
  const [inventoryList, setInventoryList] = useState([]);
  const [showAddInvModal, setShowAddInvModal] = useState(false);
  const [showEditInvModal, setShowEditInvModal] = useState(false);
  const [editingInvItem, setEditingInvItem] = useState(null);
  const [newInvItem, setNewInvItem] = useState({ name: '', category: '', stock: 0, unit: 'kg', price: 0 });

  // --- STATE FOR CATALOG MANAGEMENT ---
  const [catalogList, setCatalogList] = useState([]);
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false);
  const [showEditCatalogModal, setShowEditCatalogModal] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState(null);
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', category: '', description: '', price: 0, stock_level: 0, raw_material_id: '', raw_material_quantity: 0, packets: { '50g': 0, '100g': 0, '200g': 0 } });

  // --- STATE FOR ORDER MANAGEMENT ---
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [orderSubTab, setOrderSubTab] = useState('customer'); // 'customer' or 'purchase'

  // --- STATE FOR PROFILE MODAL ---
  const [showProfileModal, setShowProfileModal] = useState(false);

  // --- STATE FOR SUPPLIERS (REAL DATA) ---
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState([]); // Real production batches
  const [financialSummary, setFinancialSummary] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });
  const [salesByProduct, setSalesByProduct] = useState([]);
  const [orderTrends, setOrderTrends] = useState([]);
  const [inventoryDistribution, setInventoryDistribution] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuth();

  // --- API FUNCTIONS: SUPPLIERS ---

  const handleOpenPending = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/suppliers/pending');
      setPendingSuppliers(res.data);
      setShowPendingModal(true);
    } catch (err) {
      console.error("Error fetching requests:", err);
      alert("Could not load requests. Is the backend running?");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/suppliers/approved');
      setSuppliers(res.data);
      if (res.data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(res.data[0].supplier_id);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/suppliers/${id}/status`, { status: newStatus });
      setPendingSuppliers(prev => prev.filter(s => s.supplier_id !== id));
      alert(`Supplier successfully ${newStatus}!`);
      fetchSuppliers(); // Refresh the approved list if one was approved

      if (pendingSuppliers.length <= 1) {
        setTimeout(() => setShowPendingModal(false), 500);
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update status.");
    }
  };

  // --- API FUNCTIONS: STAFF (NEW) ---

  // 1. Fetch Staff
  const fetchStaff = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  // 2. Add Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/staff', newStaff);
      alert('Staff Member Added!');
      setShowStaffModal(false);
      setNewStaff({ name: '', role: 'Manager', email: '', phone: '', password: '' }); // Reset form
      fetchStaff(); // Refresh list
    } catch (err) {
      console.error(err);
      alert('Failed to add staff.');
    }
  };

  // 3. Remove Staff
  const handleRemoveStaff = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/staff/${id}`);
      setStaffList(prev => prev.filter(s => s.id !== id));
      alert('Staff removed successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to remove staff.');
    }
  };

  // --- API FUNCTIONS: INVENTORY ---
  const fetchInventory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory');
      setInventoryList(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/inventory', newInvItem);
      alert('Inventory Item Added!');
      setShowAddInvModal(false);
      setNewInvItem({ name: '', category: '', stock: 0, unit: 'kg', price: 0 });
      fetchInventory();
    } catch (err) {
      console.error(err);
      alert('Failed to add inventory item.');
    }
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/inventory/${editingInvItem.inventory_id}`, editingInvItem);
      alert('Inventory Item Updated!');
      setShowEditInvModal(false);
      setEditingInvItem(null);
      fetchInventory();
    } catch (err) {
      console.error(err);
      alert('Failed to update inventory item.');
    }
  };

  // --- API FUNCTIONS: MARKETPLACE (SUPPLIER MATERIALS) ---
  const [supplierMaterials, setSupplierMaterials] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState(1);

  const fetchSupplierMaterials = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/suppliers/materials');
      setSupplierMaterials(res.data);
    } catch (err) {
      console.error("Error fetching supplier materials:", err);
    }
  };

  const handlePlaceMarketplaceOrder = async () => {
    if (!activeMaterial) return;
    const qty = Number(purchaseQty);
    if (!qty || qty < 1) {
      alert("Please enter a valid quantity (minimum 1 kg).");
      return;
    }

    // --- FRONTEND STOCK VALIDATION ---
    if (qty > activeMaterial.stock_level) {
      alert("Requested quantity exceeds available stock");
      return;
    }

    try {
      const orderData = {
        supplier_id: activeMaterial.supplier_id,
        total_amount: activeMaterial.unit_cost * qty,
        items: [
          {
            material_id: activeMaterial.material_id,
            quantity: qty,
            unit_price: activeMaterial.unit_cost
          }
        ]
      };

      await axios.post('http://localhost:5000/api/suppliers/purchase', orderData);
      alert('Purchase Order Placed Successfully!');
      setShowPurchaseModal(false);
      setPurchaseQty(1);
      fetchSupplierMaterials();
      fetchPurchaseOrders(); // Refresh PO list for the Orders tab
    } catch (err) {
      console.error("Purchase failed:", err);
      const errorMessage = err.response?.data?.message || 'Failed to place purchase order.';
      alert(errorMessage);
    }
  };

  const openPurchaseModal = (material) => {
    setActiveMaterial(material);
    setPurchaseQty(1);
    setShowPurchaseModal(true);
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/suppliers/all-purchase-orders');
      setPurchaseOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching purchase orders:", err);
    }
  };

  const [customerOrders, setCustomerOrders] = useState([]);
  const fetchCustomerOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders/all');
      setCustomerOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching customer orders:", err);
    }
  };

  const handleUpdatePOStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/suppliers/purchase-orders/${id}/status`, { status });
      alert(`Order marked as ${status}!`);
      fetchPurchaseOrders();
    } catch (err) {
      console.error("Error updating PO status:", err);
      alert("Failed to update order status.");
    }
  };

  const handleUpdateCustomerOrderStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status });
      alert(`Customer order marked as ${status}!`);
      fetchCustomerOrders();
    } catch (err) {
      console.error("Error updating customer order status:", err);
      alert("Failed to update order status.");
    }
  };

  // --- API FUNCTIONS: CATALOG (PRODUCT MANAGEMENT) ---
  const fetchCatalog = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setCatalogList(res.data);
    } catch (err) {
      console.error("Error fetching catalog:", err);
    }
  };

  const handleAddCatalog = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/products', newCatalogItem);
      alert('Product Added to Catalog!');
      setShowAddCatalogModal(false);
      setNewCatalogItem({ name: '', category: '', description: '', price: 0, stock_level: 0, raw_material_id: '', raw_material_quantity: 0, packets: { '50g': 0, '100g': 0, '200g': 0 } });
      fetchCatalog();
      // Refetch inventory to show deducted stock
      fetchInventory();
    } catch (err) {
      console.error(err);
      alert('Failed to add product.');
    }
  };

  const handleUpdateCatalog = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/products/${editingCatalogItem.product_id}`, editingCatalogItem);
      alert('Catalog Product Updated!');
      setShowEditCatalogModal(false);
      setEditingCatalogItem(null);
      fetchCatalog();
      // Refetch inventory to show deducted stock
      fetchInventory();
    } catch (err) {
      console.error(err);
      alert('Failed to update product.');
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/production');
      setBatches(res.data || []);
    } catch (err) {
      console.error("Error fetching batches:", err);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports/financial-summary');
      setFinancialSummary(res.data);
    } catch (err) {
      console.error("Error fetching financial summary:", err);
    }
  };

  const fetchSalesReport = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports/sales-by-product');
      setSalesByProduct(res.data);
    } catch (err) {
      console.error("Error fetching sales report:", err);
    }
  };

  const fetchOrderTrends = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports/order-trends');
      setOrderTrends(res.data);
    } catch (err) {
      console.error("Error fetching order trends:", err);
    }
  };

  const fetchInventoryDistribution = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports/inventory-distribution');
      setInventoryDistribution(res.data);
    } catch (err) {
      console.error("Error fetching inventory distribution:", err);
    }
  };

  const handleDeleteCatalog = async (id) => {
    if (!window.confirm("Are you sure you want to remove this product from the catalog?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      setCatalogList(prev => prev.filter(p => p.product_id !== id));
      alert('Product removed from Catalog.');
    } catch (err) {
      console.error(err);
      alert('Failed to remove product.');
    }
  };

  // Trigger fetch when tab changes
  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaff();
    }
    if (activeTab === 'inventory') {
      fetchInventory();
    }
    if (activeTab === 'catalog') {
      fetchCatalog();
    }
    if (activeTab === 'dashboard') {
      fetchSupplierMaterials();
      fetchFinancialSummary();
      fetchSuppliers();
    }
    if (activeTab === 'orders') {
      fetchPurchaseOrders();
      fetchCustomerOrders();
    }
    if (activeTab === 'suppliers' || activeTab === 'dashboard') {
      fetchSuppliers();
    }
    if (activeTab === 'production') {
      fetchBatches();
    }
    if (activeTab === 'reports') {
      fetchSalesReport();
      fetchOrderTrends();
      fetchInventoryDistribution();
      fetchFinancialSummary();
    }
  }, [activeTab]);

  // Real-time polling for production tab
  useEffect(() => {
    let interval;
    if (activeTab === 'production') {
      interval = setInterval(fetchBatches, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // --- REMOVED MOCK DATA ---

  const selectedSupplier = suppliers.find(s => s.supplier_id === selectedSupplierId);

  const deliveryData = [
    { id: 'DEL001', order: 'ORD002', dest: 'Food Mart Chain, Kandy', status: 'In Transit', driver: 'Kamal Perera', eta: '2 hrs' },
    { id: 'DEL002', order: 'ORD001', dest: 'Nimal Restaurant, Colombo', status: 'Delivered', driver: 'Sunil Shantha', eta: '-' },
    { id: 'DEL003', order: 'ORD005', dest: 'Fresh Market, Galle', status: 'Pending', driver: '-', eta: 'Pending' },
  ];

  // --- STYLES ---
  const styles = {
    mainWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: '#f3f4f6',
      minHeight: '100vh',
      fontFamily: '"Inter", sans-serif',
      color: '#1f2937',
      display: 'flex',
      flexDirection: 'column'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', height: '70px', backgroundColor: '#1f1f1f', color: 'white', width: '100%', boxSizing: 'border-box', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' },
    logoBox: { backgroundColor: '#f59e0b', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' },
    navSection: { display: 'flex', gap: '4px', alignItems: 'center', flex: 1, justifyContent: 'center' },
    navItem: (isActive) => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: isActive ? '600' : '500', backgroundColor: isActive ? '#f59e0b' : 'transparent', color: isActive ? 'white' : '#d1d5db', cursor: 'pointer', border: 'none', transition: 'all 0.2s' }),
    userSection: { display: 'flex', alignItems: 'center', gap: '20px', minWidth: '220px', justifyContent: 'flex-end' },
    contentContainer: { padding: '40px 60px', flex: 1, width: '100%', boxSizing: 'border-box' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
    pageSubtitle: { fontSize: '14px', color: '#6b7280' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '30px' },
    statCard: { backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', border: '1px solid #e5e7eb' },
    statIconBox: (color) => ({ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: color, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '24px', marginBottom: '15px' }),
    invStatCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    tableCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '15px', backgroundColor: '#f3f4f6', fontSize: '13px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '15px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937', verticalAlign: 'middle' },
    statusBadge: (bg, text = 'white') => ({ backgroundColor: bg, color: text, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block' }),
    primaryBtn: { backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
    prodGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' },
    prodCol: (bg) => ({ backgroundColor: bg, borderRadius: '12px', padding: '20px', minHeight: '400px' }),
    prodColHeader: (color) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: color, fontWeight: '600', fontSize: '16px' }),
    prodCard: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
    prodTag: (bg, text) => ({ backgroundColor: bg, color: text, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }),
    prodBtn: (bg, text) => ({ width: '100%', backgroundColor: bg, color: text, border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '600', marginTop: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }),
    chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
    chartCard: { backgroundColor: 'white', borderRadius: '12px', padding: '30px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '400px' },
    barChartContainer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '250px', marginTop: '40px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' },
    barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
    barWrapper: { display: 'flex', gap: '8px', alignItems: 'flex-end' },
    bar: (height, color) => ({ width: '20px', height: height, backgroundColor: color, borderRadius: '4px 4px 0 0' }),
    pieChart: { width: '220px', height: '220px', borderRadius: '50%', background: 'conic-gradient(#f59e0b 0% 35%, #eab308 35% 55%, #10b981 55% 60%, #1f2937 60% 75%, #c0392b 75% 100%)', margin: '40px auto' },
    legend: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginTop: '20px' },
    legendItem: (color) => ({ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280' }),
    legendDot: (color) => ({ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }),
    footer: { backgroundColor: '#1f1f1f', color: '#9ca3af', padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: 'auto' },

    // --- PRODUCT CATALOG STYLES (PORTED FROM CUSTOMER) ---
    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
    productCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' },
    productHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
    productName: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' },
    productTag: { backgroundColor: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', marginBottom: '12px' },
    productDescription: { fontSize: '13px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.5', flex: 1 },
    price: { fontSize: '18px', fontWeight: '700', color: '#111827' },
    priceLabel: { fontSize: '11px', color: '#6b7280' },

    // --- MODAL STYLES ---
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', width: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.3)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' },
    reqCard: { backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnGroup: { display: 'flex', gap: '10px' },
    approveBtn: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' },
    rejectBtn: { backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', color: '#1f2937' },
    submitBtn: { width: '100%', backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }
  };

  return (
    <div style={styles.mainWrapper}>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logoSection}>
          <div style={styles.logoBox}><MdFactory size={22} /></div>
          <div><div style={{ fontSize: '16px', fontWeight: '700' }}>Hasal Products</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>Manufacturing & Distribution</div></div>
        </div>
        <nav style={styles.navSection}>
          <button style={styles.navItem(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}><MdDashboard size={18} /> Dashboard</button>
          <button style={styles.navItem(activeTab === 'catalog')} onClick={() => setActiveTab('catalog')}><MdStar size={18} /> Manage Catalog</button>
          <button style={styles.navItem(activeTab === 'orders')} onClick={() => setActiveTab('orders')}><MdShoppingCart size={18} /> Orders</button>
          <button style={styles.navItem(activeTab === 'inventory')} onClick={() => setActiveTab('inventory')}><MdInventory size={18} /> Inventory</button>
          <button style={styles.navItem(activeTab === 'suppliers')} onClick={() => setActiveTab('suppliers')}><MdPeople size={18} /> Suppliers</button>
          <button style={styles.navItem(activeTab === 'production')} onClick={() => setActiveTab('production')}><MdFactory size={18} /> Production</button>
          <button style={styles.navItem(activeTab === 'delivery')} onClick={() => setActiveTab('delivery')}><MdLocalShipping size={18} /> Delivery</button>
          <button style={styles.navItem(activeTab === 'reports')} onClick={() => setActiveTab('reports')}><MdAssessment size={18} /> Reports</button>
          {/* 👇 REPLACED SETTINGS WITH STAFF */}
          <button style={styles.navItem(activeTab === 'staff')} onClick={() => setActiveTab('staff')}><MdBadge size={18} /> Staff</button>
        </nav>
        <div style={styles.userSection}>
          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              background: 'none',
              border: 'none',
              textAlign: 'right',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 10px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{user?.name || 'Owner'}</div>
              <span style={{ fontSize: '10px', backgroundColor: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', color: 'white' }}>Admin</span>
            </div>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>{user?.name?.substring(0, 2).toUpperCase() || 'OW'}</div>
          </button>
          <MdLogout size={22} color="#9ca3af" style={{ cursor: 'pointer', marginLeft: '10px' }} onClick={handleLogout} title="Logout" />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div style={styles.contentContainer}>

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Dashboard</h1><p style={styles.pageSubtitle}>Welcome back, {user?.name || 'Business Owner'}</p></div>
              <div style={{ backgroundColor: '#f59e0b', color: 'white', padding: '6px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '12px' }}>Owner</div>
            </div>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={styles.statIconBox('#10b981')}><MdTrendingUp /></div><span style={{ color: '#10b981', fontWeight: '600' }}>Live</span></div><div><div style={{ fontSize: '24px', fontWeight: '700' }}>LKR {Number(financialSummary.totalRevenue).toLocaleString()}</div><div style={{ fontSize: '14px', color: '#6b7280' }}>Total Revenue</div></div></div>
              <div style={styles.statCard}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={styles.statIconBox('#c0392b')}><MdAttachMoney /></div><span style={{ color: '#ef4444', fontWeight: '600' }}>Total</span></div><div><div style={{ fontSize: '24px', fontWeight: '700' }}>LKR {Number(financialSummary.totalExpenses).toLocaleString()}</div><div style={{ fontSize: '14px', color: '#6b7280' }}>Total Expenses</div></div></div>
              <div style={styles.statCard}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={styles.statIconBox('#f59e0b')}><MdShowChart /></div><span style={{ color: financialSummary.netProfit >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>Calculated</span></div><div><div style={{ fontSize: '24px', fontWeight: '700' }}>LKR {Number(financialSummary.netProfit).toLocaleString()}</div><div style={{ fontSize: '14px', color: '#6b7280' }}>Net Profit</div></div></div>
            </div>

            {/* INTEGRATED: SUPPLIER MARKETPLACE (Visual Grid) */}
            <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '30px' }}>
              <div style={styles.pageHeader}>
                <div><h1 style={{ ...styles.pageTitle, fontSize: '22px' }}>Supplier Marketplace</h1><p style={styles.pageSubtitle}>Purchase raw materials from verified suppliers</p></div>
                <div style={{ ...styles.statusBadge('#10b981') }}>Live Marketplace</div>
              </div>

              <div style={styles.productGrid}>
                {supplierMaterials.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <p style={{ color: '#6b7280' }}>No raw materials currently available in the marketplace.</p>
                  </div>
                ) : (
                  supplierMaterials.map(material => (
                    <div key={material.material_id} style={styles.productCard}>
                      <div style={styles.productHeader}>
                        <div>
                          <h3 style={styles.productName}>{material.name}</h3>
                          <span style={styles.productTag}>{material.company_name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '600', fontSize: '14px' }}>
                          <MdBadge /> Verified
                        </div>
                      </div>
                      <p style={styles.productDescription}>High quality raw {material.name.toLowerCase()} sourced directly from the supplier.</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                        <div>
                          <div style={styles.priceLabel}>Unit Price</div>
                          <div style={styles.price}>LKR {Number(material.unit_cost).toLocaleString()} /kg</div>
                        </div>
                        <button
                          onClick={() => openPurchaseModal(material)}
                          style={{
                            backgroundColor: '#3b82f6', // Changed to Blue for "View"
                            color: 'white',
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* --- 2. ORDERS --- */}
        {activeTab === 'orders' && (
          <>
            <div style={styles.pageHeader}>
              <div>
                <h1 style={styles.pageTitle}>Order Management</h1>
                <p style={styles.pageSubtitle}>Manage customer and purchase orders</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{ ...styles.navItem(orderSubTab === 'customer'), padding: '8px 15px', color: orderSubTab === 'customer' ? 'white' : '#4b5563' }}
                  onClick={() => setOrderSubTab('customer')}
                >
                  Customer Orders
                </button>
                <button
                  style={{ ...styles.navItem(orderSubTab === 'purchase'), padding: '8px 15px', color: orderSubTab === 'purchase' ? 'white' : '#4b5563' }}
                  onClick={() => setOrderSubTab('purchase')}
                >
                  Purchase Orders (Suppliers)
                </button>
              </div>
            </div>

            {orderSubTab === 'customer' ? (
              <div style={styles.tableCard}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Customer Orders (Incoming)</h3>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Customer</th><th style={styles.th}>Date</th><th style={styles.th}>Items Count</th><th style={styles.th}>Total</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
                  <tbody>
                    {customerOrders.length === 0 ? (
                      <tr><td colSpan="7" style={{ ...styles.td, textAlign: 'center' }}>No customer orders found.</td></tr>
                    ) : (
                      customerOrders.map(o => (
                        <tr key={o.order_id}>
                          <td style={styles.td}>#{o.order_id}</td>
                          <td style={styles.td}>{o.customer_name}</td>
                          <td style={styles.td}>{new Date(o.order_date).toLocaleDateString()}</td>
                          <td style={styles.td}>{o.item_count} items</td>
                          <td style={styles.td}>LKR {Number(o.total_amount).toLocaleString()}</td>
                          <td style={styles.td}>
                            <span style={styles.statusBadge(o.status === 'PENDING' || o.status === 'Pending' ? '#eab308' : '#3b82f6')}>
                              {o.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {/* Confirmation is now automatic when order is placed */}
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Processing...</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* ACTIVE PURCHASE ORDERS */}
                <div style={styles.tableCard}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#f59e0b' }}>Active Purchase Orders</h3>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Supplier</th>
                        <th style={styles.th}>Items</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Total</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.filter(po => po.status !== 'Delivered').length === 0 ? (
                        <tr><td colSpan="7" style={{ ...styles.td, textAlign: 'center' }}>No active purchase orders.</td></tr>
                      ) : (
                        purchaseOrders.filter(po => po.status !== 'Delivered').map(po => (
                          <tr key={po.po_id}>
                            <td style={styles.td}>#{po.po_id}</td>
                            <td style={styles.td}>{po.company_name}</td>
                            <td style={styles.td}>{po.items || 'N/A'}</td>
                            <td style={styles.td}>{new Date(po.order_date).toLocaleDateString()}</td>
                            <td style={styles.td}>LKR {Number(po.total_amount).toLocaleString()}</td>
                            <td style={styles.td}><span style={styles.statusBadge('#f59e0b')}>{po.status}</span></td>
                            <td style={styles.td}>
                              <button
                                style={styles.primaryBtn}
                                onClick={() => handleUpdatePOStatus(po.po_id, 'Delivered')}
                              >
                                Received
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAST PURCHASE ORDERS */}
                <div style={styles.tableCard}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#10b981' }}>Past Purchase Orders (Finished)</h3>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Supplier</th>
                        <th style={styles.th}>Items</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Total</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.filter(po => po.status === 'Delivered').length === 0 ? (
                        <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center' }}>No past purchase orders.</td></tr>
                      ) : (
                        purchaseOrders.filter(po => po.status === 'Delivered').map(po => (
                          <tr key={po.po_id}>
                            <td style={styles.td}>#{po.po_id}</td>
                            <td style={styles.td}>{po.company_name}</td>
                            <td style={styles.td}>{po.items || 'N/A'}</td>
                            <td style={styles.td}>{new Date(po.order_date).toLocaleDateString()}</td>
                            <td style={styles.td}>LKR {Number(po.total_amount).toLocaleString()}</td>
                            <td style={styles.td}><span style={styles.statusBadge('#10b981')}>{po.status}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- 2.5 CATALOG --- */}
        {activeTab === 'catalog' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Product Catalog Manager</h1><p style={styles.pageSubtitle}>Manage the public products visible to Customers</p></div>
              <button style={{ ...styles.primaryBtn, backgroundColor: '#10b981' }} onClick={() => setShowAddCatalogModal(true)}><MdAdd size={20} /> Add Product</button>
            </div>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Name</th><th style={styles.th}>Category</th><th style={styles.th}>Packets</th><th style={styles.th}>Stock (Bulk)</th><th style={styles.th}>Price</th><th style={styles.th}>Actions</th></tr></thead>
                <tbody>
                  {catalogList.length === 0 ? <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center' }}>No products in the catalog</td></tr> : catalogList.map(item => (
                    <tr key={item.product_id}>
                      <td style={styles.td}>{item.product_id}</td>
                      <td style={styles.td}><div style={{ fontWeight: '600', color: '#1f2937' }}>{item.name}</div><div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div></td>
                      <td style={styles.td}>{item.category}</td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {item.packets && item.packets.length > 0 ? (
                            item.packets.map(p => (
                              <span key={p.weight} style={{ backgroundColor: '#f3f4f6', padding: '1px 5px', borderRadius: '3px' }}>
                                {p.weight}: <strong>{p.quantity}</strong>
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>{item.stock_level} kg</td>
                      <td style={styles.td}>LKR {Number(item.price).toLocaleString()}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <MdEdit style={{ color: '#6b7280', cursor: 'pointer' }} size={18} onClick={() => { setEditingCatalogItem(item); setShowEditCatalogModal(true); }} />
                          <MdDelete style={{ color: '#ef4444', cursor: 'pointer' }} size={18} onClick={() => handleDeleteCatalog(item.product_id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}



        {/* --- 3. INVENTORY --- */}
        {activeTab === 'inventory' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Inventory Management</h1><p style={styles.pageSubtitle}>Manage your spice products and stock levels</p></div>
              <button style={styles.primaryBtn} onClick={() => setShowAddInvModal(true)}><MdAdd size={20} /> Add Item</button>
            </div>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Name</th><th style={styles.th}>Category</th><th style={styles.th}>Stock</th><th style={styles.th}>Unit</th><th style={styles.th}>Price</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
                <tbody>
                  {inventoryList.map(item => (
                    <tr key={item.inventory_id}><td style={styles.td}>{item.inventory_id}</td><td style={styles.td}>{item.name}</td><td style={styles.td}>{item.category}</td><td style={styles.td}>{item.stock}</td><td style={styles.td}>{item.unit}</td><td style={styles.td}>LKR {Number(item.price).toLocaleString()}</td><td style={styles.td}><span style={styles.statusBadge('#10b981')}>{item.status || 'In Stock'}</span></td><td style={styles.td}><MdEdit style={{ color: '#6b7280', cursor: 'pointer' }} onClick={() => { setEditingInvItem(item); setShowEditInvModal(true); }} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- 4. SUPPLIERS (WITH PENDING REQUESTS) --- */}
        {activeTab === 'suppliers' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Supplier Management</h1><p style={styles.pageSubtitle}>Manage relationships with spice suppliers</p></div>

              <button
                style={{ ...styles.primaryBtn, backgroundColor: '#f59e0b' }}
                onClick={handleOpenPending}
              >
                <MdTimer /> Pending Requests
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Suppliers</h3>
                {suppliers.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>No approved suppliers found.</p>
                ) : (
                  suppliers.map(s => (
                    <div key={s.supplier_id} onClick={() => setSelectedSupplierId(s.supplier_id)} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedSupplierId === s.supplier_id ? '#fff7ed' : 'transparent', borderLeft: selectedSupplierId === s.supplier_id ? '4px solid #f59e0b' : '4px solid transparent' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f59e0b', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '700' }}>{(s.company_name || s.name).charAt(0)}</div>
                      <div><div style={{ fontWeight: '600', color: '#374151' }}>{s.company_name}</div><div style={{ fontSize: '11px', color: '#6b7280' }}>{s.name}</div></div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', border: '1px solid #e5e7eb' }}>
                {selectedSupplier ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}><div style={{ display: 'flex', gap: '20px' }}><div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f59e0b', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: '700' }}>{(selectedSupplier.company_name || selectedSupplier.name).charAt(0)}</div><div><h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedSupplier.company_name}</h2><div style={{ color: '#6b7280' }}>{selectedSupplier.name} (Contact Person)</div></div></div><button style={styles.primaryBtn}><MdMessage /> Message</button></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}><div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', display: 'flex', gap: '15px' }}><MdPhone color="#f59e0b" size={20} /><div><div style={{ fontSize: '11px', color: '#6b7280' }}>Phone / Contact</div><div>{selectedSupplier.contact_info}</div></div></div><div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', display: 'flex', gap: '15px' }}><MdEmail color="#f59e0b" size={20} /><div><div style={{ fontSize: '11px', color: '#6b7280' }}>Email</div><div>{selectedSupplier.email}</div></div></div></div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '50px' }}>Select a supplier to view details</div>
                )}
              </div>
            </div>
          </>
        )}



        {/* --- 6. DELIVERY --- */}
        {activeTab === 'delivery' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Delivery Management</h1><p style={styles.pageSubtitle}>Track and manage product deliveries</p></div>
            </div>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Order</th><th style={styles.th}>Destination</th><th style={styles.th}>Driver</th><th style={styles.th}>Status</th></tr></thead>
                <tbody>
                  {deliveryData.map(d => (
                    <tr key={d.id}><td style={styles.td}>{d.id}</td><td style={styles.td}>{d.order}</td><td style={styles.td}>{d.dest}</td><td style={styles.td}>{d.driver}</td><td style={styles.td}><span style={styles.statusBadge(d.status === 'In Transit' ? '#f97316' : d.status === 'Delivered' ? '#10b981' : '#eab308')}>{d.status}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- 7. REPORTS --- */}
        {activeTab === 'reports' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Reports & Analytics</h1><p style={styles.pageSubtitle}>Business insights and performance metrics</p></div>
            </div>

            {/* Top Stats for Reports */}
            <div style={{ ...styles.statsGrid, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '40px' }}>
              <div style={styles.invStatCard}><div style={{ ...styles.statIconBox('#10b981'), marginBottom: 0, borderRadius: '10px', width: '45px', height: '45px', fontSize: '22px' }}><MdTrendingUp /></div><div><div style={{ fontSize: '12px', color: '#6b7280' }}>Total Revenue</div><div style={{ fontSize: '20px', fontWeight: '700' }}>LKR {Number(financialSummary.totalRevenue).toLocaleString()}</div></div></div>
              <div style={styles.invStatCard}><div style={{ ...styles.statIconBox('#ef4444'), marginBottom: 0, borderRadius: '10px', width: '45px', height: '45px', fontSize: '22px' }}><MdAttachMoney /></div><div><div style={{ fontSize: '12px', color: '#6b7280' }}>Total Expenses</div><div style={{ fontSize: '20px', fontWeight: '700' }}>LKR {Number(financialSummary.totalExpenses).toLocaleString()}</div></div></div>
              <div style={styles.invStatCard}><div style={{ ...styles.statIconBox('#f59e0b'), marginBottom: 0, borderRadius: '10px', width: '45px', height: '45px', fontSize: '22px' }}><MdShowChart /></div><div><div style={{ fontSize: '12px', color: '#6b7280' }}>Net Profit</div><div style={{ fontSize: '20px', fontWeight: '700' }}>LKR {Number(financialSummary.netProfit).toLocaleString()}</div></div></div>
            </div>

            <div style={styles.chartGrid}>
              {/* Sales by Product Bar Chart */}
              <div style={styles.chartCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Sales by Product (KGs)</h3>
                  <MdAssessment color="#6b7280" />
                </div>
                <div style={{ ...styles.barChartContainer, marginTop: '20px' }}>
                  {salesByProduct.length === 0 ? (
                    <div style={{ width: '100%', textAlign: 'center', color: '#9ca3af', marginBottom: '100px' }}>No sales data available</div>
                  ) : (
                    salesByProduct.slice(0, 7).map((item, idx) => {
                      const maxQty = Math.max(...salesByProduct.map(s => parseFloat(s.total_quantity)));
                      const height = (parseFloat(item.total_quantity) / maxQty) * 200;
                      return (
                        <div key={idx} style={styles.barGroup}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#4b5563' }}>{item.total_quantity}kg</div>
                          <div style={styles.bar(`${height}px`, idx % 2 === 0 ? '#f59e0b' : '#fbbf24')}></div>
                          <div style={{ fontSize: '10px', color: '#6b7280', width: '40px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                            {item.name}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Inventory Distribution Pie Chart */}
              <div style={styles.chartCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Raw Material Inventory</h3>
                  <MdInventory color="#6b7280" />
                </div>
                {inventoryDistribution.length === 0 ? (
                  <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9ca3af' }}>No inventory data available</div>
                ) : (
                  <>
                    <div style={{ 
                      ...styles.pieChart,
                      background: `conic-gradient(
                        ${['#f59e0b', '#fbbf24', '#fcd34d', '#10b981', '#3b82f6', '#ef4444', '#1f2937']
                          .map((color, i) => {
                            const total = inventoryDistribution.reduce((acc, curr) => acc + parseFloat(curr.stock), 0);
                            const prevStocks = inventoryDistribution.slice(0, i).reduce((acc, curr) => acc + parseFloat(curr.stock), 0);
                            const currentStock = parseFloat(inventoryDistribution[i]?.stock || 0);
                            const startPercent = (prevStocks / total) * 100;
                            const endPercent = ((prevStocks + currentStock) / total) * 100;
                            return `${color} ${startPercent}% ${endPercent}%`;
                          }).filter(Boolean).join(', ')
                        }
                      )`
                    }}></div>
                    <div style={styles.legend}>
                      {inventoryDistribution.slice(0, 5).map((item, i) => (
                        <div key={i} style={styles.legendItem('#f59e0b')}>
                          <div style={styles.legendDot(['#f59e0b', '#fbbf24', '#fcd34d', '#10b981', '#3b82f6'][i])}></div>
                          <span>{item.name} ({item.stock}kg)</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sales Trends Table/List */}
            <div style={{ ...styles.tableCard, marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Revenue Trends (Last 30 Days)</h3>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Grouped by Date</div>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Daily Revenue</th>
                    <th style={styles.th}>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {orderTrends.length === 0 ? (
                    <tr><td colSpan="3" style={{ ...styles.td, textAlign: 'center' }}>No recent trends found.</td></tr>
                  ) : (
                    orderTrends.map((trend, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{new Date(trend.date).toLocaleDateString()}</td>
                        <td style={{ ...styles.td, fontWeight: '700' }}>LKR {Number(trend.revenue).toLocaleString()}</td>
                        <td style={styles.td}>
                          <div style={{ width: '100px', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', position: 'relative' }}>
                            <div style={{ 
                              position: 'absolute', 
                              left: 0, 
                              top: 0, 
                              height: '100%', 
                              backgroundColor: '#10b981', 
                              borderRadius: '4px',
                              width: `${Math.min(100, (parseFloat(trend.revenue) / Math.max(...orderTrends.map(t => parseFloat(t.revenue)))) * 100)}%` 
                            }}></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- 8. STAFF MANAGEMENT (NEW REPLACEMENT FOR SETTINGS) --- */}
        {activeTab === 'staff' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Staff Management</h1><p style={styles.pageSubtitle}>Manage your employees and permissions</p></div>
              <button style={styles.primaryBtn} onClick={() => setShowStaffModal(true)}>
                <MdAdd size={20} /> Add Staff
              </button>
            </div>

            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Name</th><th style={styles.th}>Role</th><th style={styles.th}>Contact</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>No staff members found. Add one!</td></tr>
                  ) : (
                    staffList.map(s => (
                      <tr key={s.id}>
                        <td style={styles.td}>#{s.id}</td>
                        <td style={styles.td}><div style={{ fontWeight: '600' }}>{s.name}</div></td>
                        <td style={styles.td}><span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{s.role}</span></td>
                        <td style={styles.td}><div style={{ fontSize: '12px' }}>{s.email}</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>{s.phone}</div></td>
                        <td style={styles.td}><span style={styles.statusBadge('#10b981')}>Active</span></td>
                        <td style={styles.td}>
                          <button onClick={() => handleRemoveStaff(s.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                            <MdDelete size={20} title="Remove Staff" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- 9. PRODUCTION (VIEW ONLY) --- */}
        {activeTab === 'production' && (
          <>
            <div style={styles.pageHeader}>
              <div><h1 style={styles.pageTitle}>Production Monitoring</h1><p style={styles.pageSubtitle}>Real-time view of manufacturing batches</p></div>
              <div style={{ ...styles.statusBadge('#10b981') }}>Live View</div>
            </div>

            {/* Production Stats */}
            <div style={{ ...styles.statsGrid, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '40px' }}>
              {[
                { l: 'Total Batches', v: batches.length, i: <MdFactory />, c: '#f59e0b' },
                { l: 'To Produce', v: batches.filter(b => b.status === 'To Produce').length, i: <MdAccessTime />, c: '#eab308' },
                { l: 'In Process', v: batches.filter(b => b.status === 'In Process').length, i: <MdArrowForward />, c: '#f97316' },
                { l: 'Completed', v: batches.filter(b => b.status === 'Completed').length, i: <MdCheckCircle />, c: '#10b981' }
              ].map((s, i) => (
                <div key={i} style={styles.invStatCard}><div style={{ ...styles.statIconBox(s.c), marginBottom: 0, borderRadius: '10px', width: '45px', height: '45px', fontSize: '22px' }}>{s.i}</div><div><div style={{ fontSize: '12px', color: '#6b7280' }}>{s.l}</div><div style={{ fontSize: '20px', fontWeight: '700' }}>{s.v}</div></div></div>
              ))}
            </div>

            {/* Kanban Board */}
            <div style={styles.prodGrid}>
              {/* Column 1: To Produce */}
              <div style={styles.prodCol('#fefce8')}>
                <div style={styles.prodColHeader('#a16207')}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdAccessTime /> To Produce</div><span style={{ backgroundColor: '#a16207', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{batches.filter(b => b.status === 'To Produce').length}</span></div>
                {batches.filter(b => b.status === 'To Produce').map(batch => (
                  <div key={batch.batch_id} style={styles.prodCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0 }}>
                        {batch.product_name} {batch.packet_size && `(${batch.packet_size})`}
                      </h4>
                      <span style={styles.prodTag('#eab308', 'white')}>To Produce</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>
                      Quantity: {batch.quantity} units {batch.order_id && `(Order #${batch.order_id})`}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}><span>Due Date:</span><span>{new Date(batch.due_date).toLocaleDateString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}><span>Assigned To:</span><span>{batch.assigned_team}</span></div>
                  </div>
                ))}
              </div>

              {/* Column 2: In Process */}
              <div style={styles.prodCol('#fff7ed')}>
                <div style={styles.prodColHeader('#c2410c')}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdArrowForward /> In Process</div><span style={{ backgroundColor: '#c2410c', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{batches.filter(b => b.status === 'In Process').length}</span></div>
                {batches.filter(b => b.status === 'In Process').map(batch => (
                  <div key={batch.batch_id} style={styles.prodCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><h4 style={{ margin: 0 }}>{batch.product_name}</h4><span style={styles.prodTag('#f97316', 'white')}>In Process</span></div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>Quantity: {batch.quantity} units</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}><span>Start Date:</span><span>{new Date(batch.start_date).toLocaleDateString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}><span>Due Date:</span><span>{new Date(batch.due_date).toLocaleDateString()}</span></div>
                  </div>
                ))}
              </div>

              {/* Column 3: Completed */}
              <div style={styles.prodCol('#f0fdf4')}>
                <div style={styles.prodColHeader('#15803d')}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdCheckCircle /> Completed</div><span style={{ backgroundColor: '#15803d', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{batches.filter(b => b.status === 'Completed').length}</span></div>
                {batches.filter(b => b.status === 'Completed').map(batch => (
                  <div key={batch.batch_id} style={styles.prodCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><h4 style={{ margin: 0 }}>{batch.product_name}</h4><span style={styles.prodTag('#10b981', 'white')}>Completed</span></div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '15px' }}>Quantity: {batch.quantity} units</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}><span>Completed:</span><span>{new Date(batch.completed_date).toLocaleDateString()}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MODAL 1: PENDING REQUESTS --- */}
      {showPendingModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Pending Supplier Requests</h3>
              <MdClose size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowPendingModal(false)} />
            </div>

            {pendingSuppliers.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No pending requests.</p>
            ) : (
              pendingSuppliers.map((supplier) => (
                <div key={supplier.supplier_id} style={styles.reqCard}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>{supplier.company_name}</div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>{supplier.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{supplier.email} | {supplier.contact_info}</div>
                  </div>
                  <div style={styles.btnGroup}>
                    <button
                      style={styles.approveBtn}
                      onClick={() => handleStatusUpdate(supplier.supplier_id, 'Approved')}
                    >
                      <MdCheckCircle /> Approve
                    </button>
                    <button
                      style={styles.rejectBtn}
                      onClick={() => handleStatusUpdate(supplier.supplier_id, 'Rejected')}
                    >
                      <MdCancel /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD STAFF (NEW) --- */}
      {showStaffModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MdBadge color="#f59e0b" /> Add Staff Member
              </h3>
              <MdClose size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowStaffModal(false)} />
            </div>

            <form onSubmit={handleAddStaff}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input type="text" required style={styles.input} value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="e.g. Kamal Perera" />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Role</label>
                <select
                  style={styles.input}
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option>Staff</option>
                  <option>Delivery Staff</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <input type="email" required style={styles.input} value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="staff@hasal.lk" />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone</label>
                  <input type="text" required style={styles.input} value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="077xxxxxxx" />
                </div>
              </div>

              <div style={{ ...styles.inputGroup, marginTop: '5px' }}>
                <label style={styles.label}>Initial Password</label>
                <input type="password" required style={styles.input} value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} placeholder="Enter temporary password for staff" />
              </div>

              <button type="submit" style={styles.submitBtn}><MdAdd size={18} /> Add Member</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: ADD INVENTORY ITEM --- */}
      {showAddInvModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MdAdd color="#f59e0b" /> Add Inventory Item
              </h3>
              <MdClose size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowAddInvModal(false)} />
            </div>

            <form onSubmit={handleAddInventory}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Product Name</label>
                <input type="text" required style={styles.input} value={newInvItem.name} onChange={(e) => setNewInvItem({ ...newInvItem, name: e.target.value })} placeholder="e.g. Turmeric Powder" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <input type="text" required style={styles.input} value={newInvItem.category} onChange={(e) => setNewInvItem({ ...newInvItem, category: e.target.value })} placeholder="e.g. Powder" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Initial Stock</label>
                  <input type="number" required style={styles.input} value={newInvItem.stock} onChange={(e) => setNewInvItem({ ...newInvItem, stock: parseInt(e.target.value) })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Unit</label>
                  <select style={styles.input} value={newInvItem.unit} onChange={(e) => setNewInvItem({ ...newInvItem, unit: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="liters">liters</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>

              <div style={{ ...styles.inputGroup, marginTop: '5px' }}>
                <label style={styles.label}>Price (LKR)</label>
                <input type="number" required min="0" step="0.01" style={styles.input} value={newInvItem.price} onChange={(e) => setNewInvItem({ ...newInvItem, price: parseFloat(e.target.value) })} />
              </div>

              <button type="submit" style={styles.submitBtn}><MdAdd size={18} /> Add Item</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: EDIT INVENTORY ITEM --- */}
      {showEditInvModal && editingInvItem && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MdEdit color="#f59e0b" /> Edit Inventory Item
              </h3>
              <MdClose size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowEditInvModal(false)} />
            </div>

            <form onSubmit={handleUpdateInventory}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Product Name</label>
                <input type="text" required style={styles.input} value={editingInvItem.name} onChange={(e) => setEditingInvItem({ ...editingInvItem, name: e.target.value })} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <input type="text" required style={styles.input} value={editingInvItem.category} onChange={(e) => setEditingInvItem({ ...editingInvItem, category: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Stock quantity</label>
                  <input type="number" required style={styles.input} value={editingInvItem.stock} onChange={(e) => setEditingInvItem({ ...editingInvItem, stock: parseInt(e.target.value) })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Unit</label>
                  <select style={styles.input} value={editingInvItem.unit} onChange={(e) => setEditingInvItem({ ...editingInvItem, unit: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="liters">liters</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>

              <div style={{ ...styles.inputGroup, marginTop: '5px' }}>
                <label style={styles.label}>Price (LKR)</label>
                <input type="number" required min="0" step="0.01" style={styles.input} value={editingInvItem.price} onChange={(e) => setEditingInvItem({ ...editingInvItem, price: parseFloat(e.target.value) })} />
              </div>

              <button type="submit" style={styles.submitBtn}><MdCheckCircle size={18} /> Update Item</button>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CATALOG MODAL --- */}
      {showAddCatalogModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Add New Product</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowAddCatalogModal(false)}><MdClose size={24} /></button>
            </div>
            <form onSubmit={handleAddCatalog}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Product Name</label>
                <input type="text" required style={styles.input} value={newCatalogItem.name} onChange={(e) => setNewCatalogItem({ ...newCatalogItem, name: e.target.value })} placeholder="e.g. Premium Cinnamon" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <input type="text" required style={styles.input} value={newCatalogItem.category} onChange={(e) => setNewCatalogItem({ ...newCatalogItem, category: e.target.value })} placeholder="e.g. Whole Spices" />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Public Description</label>
                <textarea required style={{ ...styles.input, height: '80px', resize: 'none' }} value={newCatalogItem.description} onChange={(e) => setNewCatalogItem({ ...newCatalogItem, description: e.target.value })} placeholder="Describe the product for customers..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Total Bulk Stock (kg)</label>
                  <input type="number" step="0.01" required style={styles.input} value={newCatalogItem.stock_level} onChange={(e) => setNewCatalogItem({ ...newCatalogItem, stock_level: parseFloat(e.target.value) })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Price (LKR)</label>
                  <input type="number" required min="0" step="0.01" style={styles.input} value={newCatalogItem.price} onChange={(e) => setNewCatalogItem({ ...newCatalogItem, price: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div style={{ ...styles.tableCard, backgroundColor: '#f9fafb', padding: '15px', marginTop: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Initial Packet Quantities</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['50g', '100g', '200g'].map(w => (
                    <div key={w} style={styles.inputGroup}>
                      <label style={{ ...styles.label, fontSize: '11px' }}>{w} Packets</label>
                      <input type="number" style={styles.input} value={newCatalogItem.packets[w]} onChange={(e) => setNewCatalogItem({ ...newCatalogItem, packets: { ...newCatalogItem.packets, [w]: parseInt(e.target.value) || 0 } })} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.tableCard, backgroundColor: '#f9fafb', padding: '15px', marginTop: '15px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Raw Material Consumption</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Raw Material (Optional)</label>
                    <select style={styles.input} value={newCatalogItem.raw_material_id} onChange={(e) => setNewCatalogItem({ ...newCatalogItem, raw_material_id: e.target.value })}>
                      <option value="">Select Raw Material</option>
                      {inventoryList.map(inv => (
                        <option key={inv.inventory_id} value={inv.inventory_id}>{inv.name} (Stock: {inv.stock} {inv.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Total Quantity Used (kg/L)</label>
                    <input type="number" step="0.01" min="0" style={styles.input} disabled={!newCatalogItem.raw_material_id} value={newCatalogItem.raw_material_quantity} onChange={(e) => setNewCatalogItem({ ...newCatalogItem, raw_material_quantity: parseFloat(e.target.value) })} placeholder="e.g. 10.5" />
                  </div>
                </div>
              </div>

              <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#10b981' }}><MdAdd size={18} /> Publish Product</button>
            </form>
          </div>
        </div>
      )}

      {/* --- PROFILE MODAL --- */}
      {showProfileModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={{ ...styles.modalContent, width: '400px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>User Profile</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowProfileModal(false)}><MdClose size={24} /></button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '32px', fontWeight: '700', margin: '0 auto 15px' }}>{user?.name?.substring(0, 2).toUpperCase() || 'OW'}</div>
              <h2 style={{ margin: '0 0 5px 0' }}>{user?.name || 'Owner'}</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>owner@gmail.com</p>
              <div style={{ marginTop: '20px', display: 'inline-block', backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Business Owner</div>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>Role:</span>
                <span style={{ fontWeight: '600' }}>Administrator</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>Status:</span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>Active</span>
              </div>
            </div>
            <button style={{ ...styles.submitBtn, marginTop: '30px' }} onClick={() => setShowProfileModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* --- EDIT CATALOG MODAL --- */}
      {showEditCatalogModal && editingCatalogItem && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MdEdit color="#10b981" /> Edit Catalog Product
              </h3>
              <MdClose size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowEditCatalogModal(false)} />
            </div>

            <form onSubmit={handleUpdateCatalog}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Product Name</label>
                <input type="text" required style={styles.input} value={editingCatalogItem.name} onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, name: e.target.value })} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <input type="text" required style={styles.input} value={editingCatalogItem.category} onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, category: e.target.value })} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Public Description</label>
                <textarea required style={{ ...styles.input, height: '80px', resize: 'none' }} value={editingCatalogItem.description} onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Total Bulk Stock (kg)</label>
                  <input type="number" step="0.01" required style={styles.input} value={editingCatalogItem.stock_level} onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, stock_level: parseFloat(e.target.value) })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Price (LKR)</label>
                  <input type="number" required min="0" step="0.01" style={styles.input} value={editingCatalogItem.price} onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, price: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div style={{ ...styles.tableCard, backgroundColor: '#f3f4f6', padding: '15px', marginTop: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Packet Inventory (Absolute Counts)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['50g', '100g', '200g'].map(w => {
                    const pkg = editingCatalogItem.packets?.find(p => p.weight === w);
                    return (
                      <div key={w} style={styles.inputGroup}>
                        <label style={{ ...styles.label, fontSize: '11px' }}>{w} Packets</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={pkg ? pkg.quantity : 0}
                          onChange={(e) => {
                            const newPackets = [...(editingCatalogItem.packets || [])];
                            const idx = newPackets.findIndex(p => p.weight === w);
                            if (idx > -1) {
                              newPackets[idx] = { ...newPackets[idx], quantity: parseInt(e.target.value) || 0 };
                            } else {
                              newPackets.push({ weight: w, quantity: parseInt(e.target.value) || 0 });
                            }
                            setEditingCatalogItem({ ...editingCatalogItem, packets: newPackets });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ ...styles.tableCard, backgroundColor: '#f9fafb', padding: '15px', marginTop: '15px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Deduct Extra Raw Material on Stock Increase</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Raw Material (Optional)</label>
                    <select style={styles.input} value={editingCatalogItem.raw_material_id || ''} onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, raw_material_id: e.target.value })}>
                      <option value="">Select Raw Material</option>
                      {inventoryList.map(inv => (
                        <option key={inv.inventory_id} value={inv.inventory_id}>{inv.name} (Stock: {inv.stock} {inv.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Qty Used PER NEW PACKET (kg/L)</label>
                    <input type="number" step="0.01" min="0" style={styles.input} disabled={!editingCatalogItem.raw_material_id} value={editingCatalogItem.raw_material_quantity_per_unit || ''} onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, raw_material_quantity_per_unit: parseFloat(e.target.value) })} placeholder="e.g. 0.25" />
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>If you increase the stock level, this material will be deducted automatically based on the newly added packets.</p>
              </div>

              <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#10b981' }}><MdCheckCircle size={18} /> Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 6: PURCHASE RAW MATERIAL --- */}
      {showPurchaseModal && activeMaterial && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, width: '450px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Purchase {activeMaterial.name}</h3>
              <MdClose size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowPurchaseModal(false)} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                Supplier: <span style={{ fontWeight: '600', color: '#111827' }}>{activeMaterial.company_name}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                Unit Price: <span style={{ fontWeight: '600', color: '#111827' }}>LKR {Number(activeMaterial.unit_cost).toLocaleString()} /kg</span>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Quantity to Buy (kg)</label>
                <input
                  type="number"
                  min="1"
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(e.target.value)}
                  style={{ ...styles.input, color: '#000', backgroundColor: '#fff' }} // Force black text on white bg
                />
              </div>

              <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Total Amount:</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>LKR {(activeMaterial.unit_cost * (Number(purchaseQty) || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button
                onClick={() => setShowPurchaseModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceMarketplaceOrder}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer' }}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div>© 2025 Hasal Products | Powered by Innovation and Flavor</div>
      </footer>
    </div>
  );
}