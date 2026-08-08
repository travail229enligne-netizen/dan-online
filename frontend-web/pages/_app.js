import "../styles/globals.css";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </AuthProvider>
  );
}
