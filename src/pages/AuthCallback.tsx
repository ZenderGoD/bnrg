import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// This page is no longer needed for Storefront API authentication
// Redirecting to homepage
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Redirect to homepage since we're using Storefront API authentication now
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {status === 'loading' && (
            <>
              <motion.div
                className="w-16 h-16 mx-auto mb-4 text-accent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader className="w-full h-full" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Completing Authentication
              </h2>
              <p className="text-muted-foreground text-sm">
                Please wait while we securely log you in...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                className="w-16 h-16 mx-auto mb-4 text-green-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <CheckCircle className="w-full h-full" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Welcome to TOESPRING!
              </h2>
              <p className="text-muted-foreground text-sm">
                You've been successfully authenticated with Shopify. Redirecting to your account...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                className="w-16 h-16 mx-auto mb-4 text-red-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <XCircle className="w-full h-full" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Authentication Failed
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {error}
              </p>
              <motion.button
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/', { replace: true })}
              >
                Return Home
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}