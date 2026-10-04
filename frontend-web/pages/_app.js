import "../styles/globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import CartBar from "../components/CartBar";
import PaymentWatcher from "../components/PaymentWatcher";
import PushManager from "../components/PushManager";
import { ThemeProvider } from "../lib/theme";

const GOOGLE_CLIENT_ID = "653014387931-hq0i9h3v354vsjvaqel9lcs0rqr399r3.apps.googleusercontent.com";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <CartProvider>
            <PaymentWatcher />
            <PushManager />
            <Component {...pageProps} />
            <CartBar />
          </CartProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
