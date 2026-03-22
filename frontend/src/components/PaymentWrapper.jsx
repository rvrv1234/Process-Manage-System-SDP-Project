import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import CheckoutForm from './CheckoutForm';


const stripePromise = loadStripe('pk_test_51TBcgCPgXnPhSzbUsBpooqmoWIc1lKpXMRtdAICb1rQ58DGV5iTVNYofUorODnxPYK6dfZnd7AP3zi7BEZRyak0d00rjYvJbfg');

const PaymentWrapper = ({ amount, onClose, onPaymentSuccess }) => {
    const [clientSecret, setClientSecret] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        // Fetch the secure PaymentIntent secret from your Node.js backend
        const fetchIntent = async () => {
            try {
                const res = await axios.post('http://localhost:5000/api/payments/create-payment-intent', { amount });
                setClientSecret(res.data.clientSecret);
            } catch (err) {
                console.error("Payment Gateway Error:", err);
                setError("Failed to initialize payment gateway. Please check your connection.");
            }
        };

        if (amount > 0) {
            fetchIntent();
        }
    }, [amount]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white', padding: '32px', borderRadius: '16px',
                width: '90%', maxWidth: '480px', position: 'relative',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px', background: 'none',
                        border: 'none', fontSize: '28px', cursor: 'pointer', color: '#9ca3af',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '50%', transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Close modal"
                >
                    &times;
                </button>

                {error ? (
                    <div style={{ textAlign: 'center', color: '#b91c1c', padding: '20px' }}>{error}</div>
                ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <CheckoutForm amount={amount} onPaymentSuccess={onPaymentSuccess} />
                    </Elements>
                ) : (
                    <div style={{ textAlign: 'center', padding: '50px 0', color: '#6b7280' }}>
                        <p style={{ fontSize: '16px', fontWeight: '500' }}>Initializing secure connection...</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>Please wait.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentWrapper;