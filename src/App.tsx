import { useEffect, useState } from "react";
import { Preloader } from "./components/Preloader";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Services } from "./components/Services";
import { WhyUs } from "./components/WhyUs";
import { Projects } from "./components/Projects";
import { Testimonials } from "./components/Testimonials";
import { FAQ } from "./components/FAQ";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { CustomCursor } from "./components/CustomCursor";
import { ScrollProgress } from "./components/ScrollProgress";
import { ProductDetail } from "./components/ProductDetail";
import { CartDrawer } from "./components/CartDrawer";
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { LoginPage } from "./components/LoginPage";
import { AccountPage } from "./components/AccountPage";
import { CartProvider } from "./hooks/useCart";
import { RouterProvider, useRouter } from "./hooks/useRouter";
import { AuthProvider } from "./hooks/useAuth";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import "./styles/portfolio.css";

function AppShell() {
  const [ready, setReady] = useState(false);
  const { view } = useRouter();
  useSmoothScroll(ready);

  const isHome = view.name === "home";

  // Keep ScrollTrigger from firing pins while the home view is hidden.
  useEffect(() => {
    document.body.classList.toggle("is-product-view", !isHome);
  }, [isHome]);

  return (
    <>
      {!ready && <Preloader onComplete={() => setReady(true)} />}
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <main className="view view--home" hidden={!isHome} aria-hidden={!isHome}>
        <Hero />
        <About />
        <Services />
        <Projects />
        <WhyUs />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      {view.name === "product" && (
        <main className="view view--product">
          <ProductDetail id={view.id} />
        </main>
      )}
      {view.name === "cart" && (
        <main className="view view--page">
          <CartPage />
        </main>
      )}
      {view.name === "checkout" && (
        <main className="view view--page">
          <CheckoutPage />
        </main>
      )}
      {view.name === "login" && (
        <main className="view view--page">
          <LoginPage redirect={view.redirect} />
        </main>
      )}
      {view.name === "account" && (
        <main className="view view--page">
          <AccountPage />
        </main>
      )}
      <Footer />
      <CartDrawer />
    </>
  );
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;
