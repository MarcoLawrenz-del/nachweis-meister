import { loadStripe } from '@stripe/stripe-js';

// Diese ist die publishable key - sicher für Frontend zu verwenden
const stripePromise = loadStripe('pk_test_51S5Oie1U5YNMmnrGGWaM5Uw0GSNRzWoGUkbdDshFiCu13pBC0k3RaMIHzhNod0rbLSuOPSS7En8FJbQYl2CnlRFb00MDTYoauz');

export { stripePromise };