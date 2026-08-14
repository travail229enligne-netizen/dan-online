import "../styles/globals.css";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import CartBar from "../components/CartBar";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Component {...pageProps} />
        <CartBar />
      </CartProvider>
    </AuthProvider>
  );
}
