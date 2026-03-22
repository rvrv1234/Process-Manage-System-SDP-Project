import React, { useState, useEffect } from 'react';
// Ensure this line includes 'useNavigate'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentWrapper from '../../components/PaymentWrapper';

import {
  MdDashboard,
  MdShoppingCart,
  MdNotifications,
  MdLogout,
  MdLocalShipping,
  MdAttachMoney,
  MdTrendingUp,
  MdFactory,
  MdStar,
  MdSearch,
  MdAdd,
  MdClose,
  MdDelete
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- NEW STATE FOR CART FUNCTIONALITY ---
  const [cartItems, setCartItems] = useState([]);
  const [showPacketModal, setShowPacketModal] = useState(false);
  const [selectedProductForPackets, setSelectedProductForPackets] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedPacketOption, setSelectedPacketOption] = useState(null); // Track selected size in modal
  const [orderQuantity, setOrderQuantity] = useState(1); // Track how many they want to buy from modal
  const [pastOrders, setPastOrders] = useState([]); // Track completed checkouts locally
  const [showProfileModal, setShowProfileModal] = useState(false); // Toggle for user profile visibility
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'online'
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Stripe modal


  // --- DYNAMIC CATALOG STATE ---
  const [catalogList, setCatalogList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setCatalogList(res.data);
      } catch (err) {
        console.error("Error fetching catalog:", err);
      }
    };
    fetchCatalog();
  }, []);

  const fetchPastOrders = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/customer/${user.id}`);
      setPastOrders(res.data);
    } catch (err) {
      console.error("Error fetching past orders:", err);
    }
  };

  useEffect(() => {
    fetchPastOrders();
  }, [user]);

  // --- NEW FUNCTIONS FOR CART LOGIC ---

  // 1. Open Packet Selection Modal
  const handleOpenPacketModal = (product) => {
    const standardWeights = ['50g', '100g', '200g'];
    const packetOptions = standardWeights.map(weight => {
      const found = (product.packets || []).find(p => p.weight === weight);
      const stockQty = found ? parseInt(found.quantity) : 0;

      // Pricing logic: assume base price is for 100g
      const numericPrice = Number(product.price);
      const ratio = parseInt(weight) / 100;

      return {
        size: weight,
        price: Math.round(numericPrice * ratio),
        label: `${weight} Packet`,
        desc: stockQty > 0 ? 'In Stock' : 'Out of Stock',
        quantity: stockQty
      };
    });
    const legacyProductFormat = {
      id: product.product_id,
      name: product.name,
      category: product.category,
      rating: 5.0,
      description: product.description,
      price: product.price, // Keep raw price for base calculation
      packets: packetOptions
    };
    setSelectedProductForPackets(legacyProductFormat);
    setSelectedPacketOption(null); // Reset selection
    setOrderQuantity(1); // Reset modal quantity
    setShowPacketModal(true);
  };

  // 2. Add Selected Packet to Cart
  const handleAddToCart = () => {
    if (!selectedProductForPackets || !selectedPacketOption || orderQuantity < 1) return;

    if (orderQuantity > selectedPacketOption.quantity) {
      alert("Requested quantity exceeds available stock");
      return;
    }

    const newItem = {
      cartId: `${selectedProductForPackets.id}-${selectedPacketOption.size}`, // Unique ID
      productId: selectedProductForPackets.id,
      name: selectedProductForPackets.name,
      size: selectedPacketOption.size,
      price: selectedPacketOption.price,
      quantity: orderQuantity,
    };

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.cartId === newItem.cartId);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += orderQuantity;
        return updatedItems;
      } else {
        return [...prevItems, newItem];
      }
    });

    setShowPacketModal(false);
    setSelectedPacketOption(null);
    setOrderQuantity(1);
  };

  // 3. Update Quantity in Cart (+/- buttons)
  const handleUpdateQuantity = (cartId, change) => {
    setCartItems(prevItems => prevItems.map(item => {
      if (item.cartId === cartId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  // 4. Remove Item from Cart
  const handleRemoveItem = (cartId) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartId !== cartId));
  };

  // 5. Calculate Total
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // 6. Checkout Flow
  const handleCheckout = async () => {
    console.log("Checking out with payment method:", paymentMethod);

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!user?.id) {
      alert("Please log in to place an order.");
      return;
    }

    if (paymentMethod === 'online') {
      setShowPaymentModal(true);
      return;
    }

    const orderData = {
      user_id: user.id,
      total_amount: cartTotal,
      payment_method: paymentMethod, // Added for future-proofing
      items: cartItems.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        packet_size: item.size
      }))
    };

    console.log("Sending order data:", orderData);

    try {
      const response = await axios.post('http://localhost:5000/api/orders/create', orderData);
      console.log("Order result:", response.data);
      alert('Order placed securely! Redirecting to Past Orders.');
      setCartItems([]);
      setShowCartModal(false);
      setActiveTab('orders'); // Go to dedicated orders tab
      fetchPastOrders(); // Refresh the list
    } catch (err) {
      console.error("Error placing order:", err);
      const errorMessage = err.response?.data?.message || 'Failed to place order. Please try again.';
      alert(errorMessage);
    }
  };

  const handlePaymentSuccess = async (transactionId) => {
    const orderData = {
      user_id: user.id,
      total_amount: cartTotal,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      items: cartItems.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        packet_size: item.size
      }))
    };

    try {
      await axios.post('http://localhost:5000/api/orders/create', orderData);
      alert('Online Payment Successful and Order Placed!');
      setShowPaymentModal(false);
      setCartItems([]);
      setShowCartModal(false);
      setActiveTab('orders');
      fetchPastOrders();
    } catch (err) {
      console.error("Error placing online order:", err);
      alert('Payment succeeded but order creation failed. Please contact support.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

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
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      color: '#1f2937',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
    },
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
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    logoBox: {
      backgroundColor: '#f59e0b',
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
    },
    companyName: {
      fontSize: '18px',
      fontWeight: '600',
      lineHeight: '1.2',
    },
    subText: {
      fontSize: '12px',
      color: '#9ca3af',
      fontWeight: '400',
    },
    navSection: {
      display: 'flex',
      gap: '30px',
    },
    navButtonActive: {
      backgroundColor: '#f59e0b',
      color: 'white',
      border: 'none',
      padding: '10px 25px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)',
      transition: 'all 0.2s',
    },
    navButtonInactive: {
      backgroundColor: 'transparent',
      color: '#d1d5db',
      border: 'none',
      padding: '10px 25px',
      fontWeight: '500',
      fontSize: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      transition: 'color 0.2s',
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '25px',
    },
    userInfo: {
      textAlign: 'right',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
    },
    roleBadge: {
      fontSize: '11px',
      backgroundColor: '#f59e0b',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '4px',
      display: 'inline-block',
      marginTop: '2px',
      fontWeight: '600',
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#f59e0b',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontWeight: '600',
      fontSize: '16px',
      border: '2px solid #1f1f1f',
    },
    contentContainer: {
      padding: '40px 50px',
      width: '100%',
      boxSizing: 'border-box',
    },
    pageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: '35px',
    },
    pageTitle: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '5px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '30px',
      marginBottom: '40px',
      width: '100%',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '160px',
      border: '1px solid #e5e7eb',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '15px',
    },
    iconSquare: (color) => ({
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      backgroundColor: color,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontSize: '28px',
    }),
    trendText: (isPositive) => ({
      color: isPositive ? '#10b981' : '#ef4444',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: isPositive ? '#ecfdf5' : '#fef2f2',
      padding: '4px 8px',
      borderRadius: '6px',
    }),
    cardValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#111827',
      marginTop: '10px',
      letterSpacing: '-0.02em',
    },
    cardLabel: {
      fontSize: '15px',
      color: '#6b7280',
      fontWeight: '500',
      marginTop: '5px',
    },
    portalContainer: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
      border: '1px solid #e5e7eb',
      marginTop: '40px',
    },
    portalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
    },
    portalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
    },
    filterSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
    },
    searchBarWrapper: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '10px 15px',
      width: '300px',
      gap: '10px',
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      width: '100%',
      fontSize: '14px',
      color: '#111827',
    },
    categoryDropdown: {
      padding: '10px 15px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: 'white',
      color: '#111827',
      fontSize: '14px',
      cursor: 'pointer',
      outline: 'none',
    },
    productGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '25px',
    },
    productCard: {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
    },
    productHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '10px',
    },
    productName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '8px',
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: '#f59e0b',
      fontWeight: '600',
      fontSize: '14px',
    },
    productTag: {
      backgroundColor: '#f59e0b',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block',
      marginBottom: '12px',
    },
    productDescription: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '20px',
      lineHeight: '1.5',
      flex: 1,
    },
    productFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: '20px',
    },
    price: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#111827',
    },
    priceLabel: {
      fontSize: '12px',
      color: '#6b7280',
    },
    minOrder: {
      fontSize: '12px',
      color: '#6b7280',
    },
    addToCartButton: {
      width: '100%',
      backgroundColor: '#f59e0b',
      color: 'white',
      border: 'none',
      padding: '12px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s',
    },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    packetModalContent: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', width: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    packetOptionCard: (isSelected) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', border: isSelected ? '2px solid #f59e0b' : '2px solid #e5e7eb', borderRadius: '12px', marginBottom: '15px', cursor: 'pointer', backgroundColor: isSelected ? '#fff7ed' : 'white', transition: 'all 0.2s' }),
    packetIconBox: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', marginRight: '15px' },
    cartSidebar: { position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: 'white', boxShadow: '-5px 0 15px rgba(0,0,0,0.05)', zIndex: 2001, display: 'flex', flexDirection: 'column', padding: '30px', boxSizing: 'border-box' },
    cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    cartItemsList: { flex: 1, overflowY: 'auto' },
    cartItem: { padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e5e7eb' },
    cartItemHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    sizeTag: { backgroundColor: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', marginRight: '10px' },
    qtySelector: { display: 'flex', alignItems: 'center', backgroundColor: '#e5e7eb', borderRadius: '8px', padding: '5px' },
    qtyBtn: { border: 'none', background: 'transparent', padding: '5px 10px', cursor: 'pointer', fontSize: '16px', color: '#374151' },
    cartFooter: { borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: 'auto' },
    checkoutBtn: { width: '100%', backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }
  };

  return (
    <div style={styles.mainWrapper}>
      <header style={styles.header}>
        <div style={styles.logoSection}>
          <div style={styles.logoBox}>
            <MdFactory size={24} />
          </div>
          <div>
            <div style={styles.companyName}>Hasal Products</div>
            <div style={styles.subText}>Manufacturing & Distribution</div>
          </div>
        </div>
        <div style={styles.navSection}>
          <button
            style={activeTab === 'dashboard' ? styles.navButtonActive : styles.navButtonInactive}
            onClick={() => setActiveTab('dashboard')}
          >
            <MdDashboard size={20} /> Dashboard
          </button>
          <button
            style={activeTab === 'orders' ? styles.navButtonActive : styles.navButtonInactive}
            onClick={() => setActiveTab('orders')}
          >
            <MdShoppingCart size={20} /> Orders
          </button>
        </div>
        <div style={styles.userSection}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowCartModal(true)}>
            <MdShoppingCart size={24} color="#9ca3af" />
            {cartItems.length > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#f59e0b', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                {cartItems.length}
              </span>
            )}
          </div>
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
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.name || 'Customer'}</div>
              <span style={styles.roleBadge}>Customer</span>
            </div>
            <div style={styles.avatar}>{user?.name?.substring(0, 2).toUpperCase() || 'CU'}</div>
          </button>
          <MdLogout
            size={24}
            color="#9ca3af"
            style={{ cursor: 'pointer', marginLeft: '10px' }}
            onClick={handleLogout}
            title="Logout"
          />
        </div>
      </header>

      <div style={styles.contentContainer}>

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>{activeTab === 'dashboard' ? 'Dashboard' : 'My Orders'}</h1>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>{activeTab === 'dashboard' ? `Welcome back, ${user?.name || 'Customer'}` : 'Track and manage your previous orders'}</p>
          </div>
          <div style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            Customer
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* STATS CARDS */}
            <div style={styles.statsGrid}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconSquare('#f59e0b')}>
                    <MdShoppingCart />
                  </div>
                  <div style={styles.trendText(true)}>
                    <MdTrendingUp /> +2
                  </div>
                </div>
                <div>
                  <div style={styles.cardValue}>3</div>
                  <div style={styles.cardLabel}>Total Orders</div>
                </div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconSquare('#f59e0b')}>
                    <MdLocalShipping />
                  </div>
                </div>
                <div>
                  <div style={styles.cardValue}>6</div>
                  <div style={styles.cardLabel}>Pending Deliveries</div>
                </div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconSquare('#10b981')}>
                    <MdAttachMoney />
                  </div>
                  <div style={styles.trendText(true)}>
                    <MdTrendingUp /> +18%
                  </div>
                </div>
                <div>
                  <div style={styles.cardValue}>LKR 2.3M</div>
                  <div style={styles.cardLabel}>Total Spent</div>
                </div>
              </div>
            </div>

            <div style={styles.portalContainer}>
              <div style={styles.portalHeader}>
                <h2 style={styles.portalTitle}>Product Catalog</h2>
                <button style={{ ...styles.addToCartButton, width: 'auto', padding: '10px 20px' }} onClick={() => setShowCartModal(true)}>
                  <MdShoppingCart size={18} /> Cart
                </button>
              </div>

              <div style={styles.filterSection}>
                <div style={styles.searchBarWrapper}>
                  <MdSearch size={20} color="#9ca3af" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    style={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  style={styles.categoryDropdown}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Powder">Powder</option>
                  <option value="Whole Spices">Whole Spices</option>
                  <option value="Seeds">Seeds</option>
                  <option value="Spice Mix">Spice Mix</option>
                </select>
              </div>

              <div style={styles.productGrid}>
                {(() => {
                  const filtered = catalogList.filter(product => {
                    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      product.description.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
                    return matchesSearch && matchesCategory;
                  });

                  if (filtered.length === 0) {
                    return <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#6b7280', padding: '40px' }}>No products matched your search.</p>;
                  }

                  return filtered.map(product => (
                    <div key={product.product_id} style={styles.productCard}>
                      <div style={styles.productHeader}>
                        <div>
                          <h3 style={styles.productName}>{product.name}</h3>
                          <span style={styles.productTag}>{product.category}</span>
                        </div>
                        <div style={styles.rating}>
                          <MdStar /> 5.0
                        </div>
                      </div>
                      <p style={styles.productDescription}>{product.description}</p>
                      <div style={styles.productFooter}>
                        <div>
                          <div style={styles.price}>LKR {Number(product.price).toLocaleString()}</div>
                          <div style={styles.priceLabel}>per packet</div>
                        </div>
                        <div style={styles.minOrder}>Min: 1 packet</div>
                      </div>
                      <button style={styles.addToCartButton} onClick={() => handleOpenPacketModal(product)}>
                        <MdShoppingCart /> Select Options
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div style={styles.portalContainer}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#111827' }}>Past Orders</h3>
            {pastOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                You have not placed any orders yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {pastOrders.map((order, idx) => (
                  <div key={idx} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f3f4f6' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>Order ID: {order.id}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>Placed on {order.date}</div>
                      </div>
                      <div style={{ backgroundColor: '#dbeafe', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {order.status}
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ fontSize: '14px', color: '#374151', marginBottom: '10px' }}>Items:</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#4b5563' }}>
                        {order.items.map((item, iIndex) => (
                          <li key={iIndex} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>{item.quantity}x {item.name} ({item.size})</span>
                            <span>LKR {(item.price * item.quantity).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Amount</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>LKR {order.total.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MODALS --- */}
      {showPacketModal && selectedProductForPackets && (
        <div style={styles.modalOverlay}>
          <div style={styles.packetModalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Select Packet Size</h3><p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>Choose size for {selectedProductForPackets.name}</p></div>
              <MdClose size={24} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setShowPacketModal(false)} />
            </div>

            <div>
              {selectedProductForPackets.packets.map((option, index) => {
                const isSelected = selectedPacketOption && selectedPacketOption.size === option.size;
                const isOutOfStock = option.quantity <= 0;

                return (
                  <div
                    key={index}
                    style={{
                      ...styles.packetOptionCard(isSelected),
                      opacity: isOutOfStock ? 0.6 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => !isOutOfStock && setSelectedPacketOption(option)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ ...styles.packetIconBox, backgroundColor: isOutOfStock ? '#9ca3af' : '#f59e0b' }}>
                        <MdLocalShipping />
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: isOutOfStock ? '#6b7280' : '#1f2937' }}>{option.label}</div>
                        <div style={{ fontSize: '13px', color: isOutOfStock ? '#9ca3af' : '#10b981', fontWeight: '600' }}>
                          {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: isOutOfStock ? '#9ca3af' : '#1f2937' }}>LKR {option.price}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>per packet</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedPacketOption && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>How many packets do you want to buy?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button style={{ ...styles.qtyBtn, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px' }} onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}>−</button>
                  <input type="number" value={orderQuantity} onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '60px', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', fontSize: '16px' }} />
                  <button style={{ ...styles.qtyBtn, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px' }} onClick={() => setOrderQuantity(orderQuantity + 1)}>+</button>
                  <div style={{ marginLeft: 'auto', fontWeight: '700', fontSize: '18px' }}>
                    Total: LKR {(selectedPacketOption.price * orderQuantity).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <button style={{ ...styles.addToCartButton, marginTop: '20px', opacity: selectedPacketOption ? 1 : 0.5, cursor: selectedPacketOption ? 'pointer' : 'not-allowed' }} disabled={!selectedPacketOption} onClick={handleAddToCart}>
              Confirm & Add to Cart
            </button>
          </div>
        </div>
      )}

      {showCartModal && (
        <>
          <div style={styles.modalOverlay} onClick={() => setShowCartModal(false)}></div>
          <div style={styles.cartSidebar}>
            <div style={styles.cartHeader}>
              <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Shopping Cart</h3>
              <MdClose size={24} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setShowCartModal(false)} />
            </div>
            <p style={{ color: '#6b7280', marginBottom: '25px' }}>Review your items and place order</p>

            <div style={styles.cartItemsList}>
              {cartItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '50px' }}>Your cart is empty.</p>
              ) : (
                cartItems.map(item => (
                  <div key={item.cartId} style={styles.cartItem}>
                    <div style={styles.cartItemHeader}>
                      <div><h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{item.name}</h4><div style={{ fontSize: '13px', color: '#6b7280' }}>Powder</div></div>
                      <MdDelete color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => handleRemoveItem(item.cartId)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}><span style={styles.sizeTag}>{item.size}</span><span style={{ fontSize: '14px', color: '#6b7280' }}>LKR {item.price} / packet</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={styles.qtySelector}>
                        <button style={styles.qtyBtn} onClick={() => handleUpdateQuantity(item.cartId, -1)}>−</button>
                        <span style={{ fontWeight: '600', padding: '0 10px' }}>{item.quantity} packet{item.quantity > 1 ? 's' : ''}</span>
                        <button style={styles.qtyBtn} onClick={() => handleUpdateQuantity(item.cartId, 1)}>+</button>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>LKR {item.price * item.quantity}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={styles.cartFooter}>
              {/* Payment Method Selector */}
              <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '15px' }}>Select Payment Method</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', padding: '8px', borderRadius: '8px', backgroundColor: paymentMethod === 'cod' ? '#fff7ed' : 'transparent', border: paymentMethod === 'cod' ? '1px solid #f59e0b' : '1px solid transparent' }}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} style={{ accentColor: '#f59e0b' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: paymentMethod === 'cod' ? '600' : '500' }}>Cash on Delivery</span>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', padding: '8px', borderRadius: '8px', backgroundColor: paymentMethod === 'online' ? '#eff6ff' : 'transparent', border: paymentMethod === 'online' ? '1px solid #3b82f6' : '1px solid transparent' }}>
                    <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} style={{ accentColor: '#3b82f6' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: paymentMethod === 'online' ? '600' : '500' }}>Online Payment</span>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', color: '#6b7280' }}>Total</div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>LKR {cartTotal.toLocaleString()}</div>
              </div>
              <button style={styles.checkoutBtn} disabled={cartItems.length === 0} onClick={handleCheckout}>Place Order</button>
            </div>
          </div>
        </>
      )}

      {showProfileModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={{ ...styles.packetModalContent, width: '400px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.cartHeader}>
              <h3 style={{ margin: 0 }}>User Profile</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowProfileModal(false)}><MdClose size={24} /></button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '32px', fontWeight: '700', margin: '0 auto 15px' }}>{user?.name?.substring(0, 2).toUpperCase() || 'CU'}</div>
              <h2 style={{ margin: '0 0 5px 0' }}>{user?.name || 'Customer'}</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>kasun@gmail.com</p>
              <div style={{ marginTop: '20px', display: 'inline-block', backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Valued Customer</div>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>Member Since:</span>
                <span style={{ fontWeight: '600' }}>March 2024</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>Status:</span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>Active</span>
              </div>
            </div>
            <button style={{ ...styles.checkoutBtn, marginTop: '30px' }} onClick={() => setShowProfileModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showPaymentModal && <PaymentWrapper amount={cartTotal} onClose={() => setShowPaymentModal(false)} onPaymentSuccess={handlePaymentSuccess} />}
    </div>
  );
}