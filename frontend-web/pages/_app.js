import "../styles/globals.css";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import CartBar from "../components/CartBar";
import PaymentWatcher from "../components/PaymentWatcher";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CartProvider>
        <PaymentWatcher />
        <Component {...pageProps} />
        <CartBar />
      </CartProvider>
    </AuthProvider>
  );
}
