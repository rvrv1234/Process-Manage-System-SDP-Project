import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ amount, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Stripe.js hasn't yet loaded.
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setMessage('');

        // Confirm the payment with Stripe
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // For SPAs, we handle the redirect manually to avoid full page reloads
                return_url: window.location.origin,
            },
            redirect: 'if_required',
        });

        if (error) {
            // Show validation or network errors from Stripe
            setMessage(error.message);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            setMessage("Payment Successful! Finalizing order...");
            // Pass the generated Stripe Transaction ID back to your main system
            onPaymentSuccess(paymentIntent.id);
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>
                Secure Checkout: LKR {amount}
            </h3>

            {/* Stripe's pre-built, secure input fields */}
            <div style={{ padding: '10px 0', minHeight: '200px' }}>
                <PaymentElement />
            </div>

            {message && (
                <div style={{
                    color: message.includes('Successful') ? '#15803d' : '#b91c1c',
                    marginTop: '15px',
                    textAlign: 'center',
                    fontWeight: '500',
                    padding: '10px',
                    backgroundColor: message.includes('Successful') ? '#dcfce7' : '#fee2e2',
                    borderRadius: '6px'
                }}>
                    {message}
                </div>
            )}

            <button
                disabled={isProcessing || !stripe || !elements}
                style={{
                    marginTop: '25px', width: '100%', padding: '14px',
                    backgroundColor: '#2563eb', color: 'white', border: 'none',
                    borderRadius: '8px', fontSize: '16px', fontWeight: '600',
                    cursor: (isProcessing || !stripe || !elements) ? 'not-allowed' : 'pointer',
                    opacity: (isProcessing || !stripe || !elements) ? 0.7 : 1,
                    transition: 'background-color 0.2s'
                }}
            >
                {isProcessing ? "Processing Securely..." : `Pay LKR ${amount}`}
            </button>
        </form>
    );
};

export default CheckoutForm;