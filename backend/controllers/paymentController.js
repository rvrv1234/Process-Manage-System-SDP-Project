const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
    console.log('💳 Stripe Controller Hit!');
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ message: "Invalid amount provided" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // LKR lowest denominator
            currency: 'lkr',
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error("Stripe Error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createPaymentIntent };
