import { useState, useEffect } from "react";
import "../styles/globals.css";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import CartBar from "../components/CartBar";
import PaymentWatcher from "../components/PaymentWatcher";
import SplashScreen from "../components/SplashScreen";

const SPLASH_KEY = "shopyz_splash_shown";

export default function App({ Component, pageProps }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !sessionStorage.getItem(SPLASH_KEY)) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashFinish = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SPLASH_KEY, "1");
    }
    setShowSplash(false);
  };

  return (
    <AuthProvider>
      <CartProvider>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <PaymentWatcher />
        <Component {...pageProps} />
        <CartBar />
      </CartProvider>
    </AuthProvider>
  );
}
