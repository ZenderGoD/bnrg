import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SimpleLoginModal } from '@/components/SimpleLoginModal';
import { auth, users, type User } from '@/lib/api';

const SpringMode = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const loggedIn = auth.isLoggedIn();
      
      if (loggedIn) {
        const userId = auth.getUserId();
        if (userId) {
          const userData = await users.getById(userId);
          if (userData) {
            setUser(userData as User);
            setShowAuthModal(false);
          } else {
            setShowAuthModal(true);
          }
        } else {
          setShowAuthModal(true);
        }
      } else {
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setShowAuthModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md"
          >
            <h1 className="text-3xl font-bold mb-4">Spring Mode</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in or sign up to access Spring Mode.
            </p>
          </motion.div>
        </div>
        <SimpleLoginModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6">Spring Mode</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Welcome to Spring Mode, {user.firstName || user.email}!
          </p>
          <div className="bg-card border rounded-lg p-6">
            <p className="text-muted-foreground">
              Spring Mode content will be displayed here.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SpringMode;

