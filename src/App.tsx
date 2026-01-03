import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PreLoader } from "@/components/PreLoader";
import Index from "./pages/Index";
import Men from "./pages/Men";
import Women from "./pages/Women";
import Kids from "./pages/Kids";
import Product from "./pages/Product";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Catalog from "./pages/Catalog";
import Admin from "./pages/Admin";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import SpringMode from "./pages/SpringMode";

const queryClient = new QueryClient();

// Component to handle route-based preloader
function AppWithRoutes() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(() => {
    // Only show preloader on initial load/manual reload
    // Check if this is a fresh page load (not navigation)
    return !sessionStorage.getItem('hasInitialLoad');
  });

  useEffect(() => {
    // Mark that initial load has happened
    if (isLoading) {
      sessionStorage.setItem('hasInitialLoad', 'true');
    }
  }, [isLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <PreLoader key="preloader" onComplete={handleLoadingComplete} />
      ) : (
        <div key="main-app" className="min-h-screen bg-background w-full overflow-x-hidden">
          <Header />
          <main className="w-full overflow-x-hidden pt-16">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/men" element={<Men />} />
              <Route path="/women" element={<Women />} />
              <Route path="/kids" element={<Kids />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/product/:handle" element={<Product />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/spring-mode" element={<SpringMode />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          {!isAdminPage && <Footer />}
        </div>
      )}
    </AnimatePresence>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppWithRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
