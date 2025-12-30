import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PreLoader } from "@/components/PreLoader";
import { Chatbot } from "@/components/Chatbot";
import Index from "./pages/Index";
import Men from "./pages/Men";
import Women from "./pages/Women";
import Cart from "./pages/Cart";
import Product from "./pages/Product";
import Credits from "./pages/Credits";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Catalog from "./pages/Catalog";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle route-based preloader
function AppWithRoutes() {
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
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/product/:handle" element={<Product />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <Chatbot />
        </div>
      )}
    </AnimatePresence>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ChatbotProvider>
                <AppWithRoutes />
              </ChatbotProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
