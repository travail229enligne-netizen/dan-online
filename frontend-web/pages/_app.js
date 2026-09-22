import { useState } from "react";
import "../styles/globals.css";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import CartBar from "../components/CartBar";
import PaymentWatcher from "../components/PaymentWatcher";
import SplashScreen from "../components/SplashScreen";

export default function App({ Component, pageProps }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <CartProvider>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        <PaymentWatcher />
        <Component {...pageProps} />
        <CartBar />
      </CartProvider>
    </AuthProvider>
  );
}
