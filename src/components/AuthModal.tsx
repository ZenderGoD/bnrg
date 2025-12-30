import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { customerAccountClient, type CustomerAccountCustomer } from '@/lib/customerAccountApi';
import { customerLogin, customerRegister, getCustomer, customerRecover } from '@/lib/shopify';

// Use Customer Account API types
type ShopifyCustomer = CustomerAccountCustomer;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: ShopifyCustomer) => void;
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showDevHelper, setShowDevHelper] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    acceptsMarketing: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (isSignUp) {
        // Handle sign up
        await customerRegister(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          formData.acceptsMarketing
        );
        
        setSuccess('Account created! Please check your email to verify your account.');
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          acceptsMarketing: false
        });
      } else {
        // Handle sign in
        const token = await customerLogin(formData.email, formData.password);
        if (token) {
          const customer = await getCustomer(token.accessToken);
          if (customer) {
            onLogin(customer);
            onClose();
          }
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      if (error.message.includes('email verification required')) {
        setSuccess('Please check your email and click the verification link to activate your account.');
      } else if (error.message.includes('Account not verified')) {
        setError('Please verify your email account first. Check your inbox for the verification email.');
      } else if (error.message.includes('Email has already been taken')) {
        setError('An account with this email already exists. Please try signing in instead.');
      } else if (error.message.includes('Unidentified customer')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first, then click "Forgot password?"');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      await customerRecover(formData.email);
      setSuccess('Password reset email sent! Please check your inbox and follow the instructions.');
    } catch (error: any) {
      console.error('Password recovery error:', error);
      setError('Failed to send password reset email. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevActivation = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Development helper - this should be replaced with proper Shopify activation
      setError('Development mode: Please use the "Sign in with Shopify" button for secure authentication.');
    } catch (err: any) {
      setError(err.message || 'Account activation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove Shopify redirect - we'll handle everything on our website

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto scroll-smooth">
      <motion.div
        className="bg-gradient-to-br from-background via-background to-secondary/20 rounded-2xl shadow-2xl shadow-black/20 max-w-sm w-full p-4 border border-border/50 backdrop-blur-md my-4"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              {isSignUp ? 'Join 2XY' : 'Welcome Back'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <motion.div 
            className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Always show Shopify Auth Button */}
        <div className="mb-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </Button>

              {/* Remove Shopify fallback - everything stays on our website */}
        </div>

        {success && (
          <motion.div 
            className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20 border border-green-200 dark:border-green-800 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Check Your Email!</h4>
                <p className="text-sm text-green-600 dark:text-green-300 leading-relaxed">{success}</p>
                <div className="mt-4 p-3 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">
                    <strong>Didn't receive the email?</strong> Check your spam folder or try registering again with a different email.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!registrationSuccess && (
          <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      className="pl-10 h-12 border-border/50 focus:border-accent focus:ring-accent/20 transition-all rounded-lg bg-background/50"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required={isSignUp}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      className="pl-10 h-12 border-border/50 focus:border-accent focus:ring-accent/20 transition-all rounded-lg bg-background/50"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required={isSignUp}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10 h-12 border-border/50 focus:border-accent focus:ring-accent/20 transition-all rounded-lg bg-background/50"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 h-12 border-border/50 focus:border-accent focus:ring-accent/20 transition-all rounded-lg bg-background/50"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 w-4 h-4 text-muted-foreground hover:text-accent transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              {isSignUp && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  Password must be at least 6 characters long
                </p>
              )}
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
                >
                  Forgot password?
                </button>
              )}
            </div>
          </div>

          {isSignUp && (
            <div className="flex items-start space-x-3 p-4 bg-accent/5 rounded-xl border border-accent/10">
              <input
                type="checkbox"
                id="acceptsMarketing"
                checked={formData.acceptsMarketing}
                onChange={(e) => setFormData(prev => ({ ...prev, acceptsMarketing: e.target.checked }))}
                className="mt-0.5 rounded border-gray-300 text-accent focus:ring-accent focus:ring-offset-0"
                disabled={isLoading}
              />
              <Label htmlFor="acceptsMarketing" className="text-sm leading-relaxed cursor-pointer">
                I would like to receive marketing emails about <span className="font-medium text-accent">new sneaker drops</span> and <span className="font-medium text-accent">exclusive offers</span>
              </Label>
            </div>
          )}

          <motion.div
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            <Button 
              type="submit" 
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold text-base rounded-xl shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <User className="w-5 h-5 mr-2" />
                      Create Shopify Account
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Sign In with Shopify
                    </>
                  )}
                </>
              )}
            </Button>
          </motion.div>
        </form>
        )}

        {registrationSuccess && (
          <div className="space-y-4">
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                type="button"
                onClick={() => {
                  setRegistrationSuccess(false);
                  setSuccess('');
                  setIsSignUp(false);
                }}
                className="flex-1 h-12 bg-gradient-to-r from-accent via-primary to-accent hover:from-accent/90 hover:via-primary/90 hover:to-accent/90 text-white font-semibold rounded-xl shadow-lg"
              >
                <Mail className="w-4 h-4 mr-2" />
                Try Signing In
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 border-accent/30 hover:bg-accent/5 hover:border-accent/50 rounded-xl"
              >
                Close
              </Button>
            </motion.div>
          </div>
        )}

        {!registrationSuccess && (
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Already have a Shopify account?' : "Don't have a Shopify account?"}
          </p>
          <motion.button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="mt-2 text-accent hover:text-accent/80 font-medium text-sm transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSignUp ? 'Sign in instead' : 'Create new account'}
          </motion.button>
          
          {/* Benefits highlight */}
          <div className="mt-6 p-4 bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl border border-accent/10">
            <p className="text-xs text-center text-muted-foreground">
              🎯 <span className="font-medium">Shopify Account Benefits:</span> Order tracking, exclusive drops, 2XY credits & faster checkout
            </p>
          </div>
        </div>
        )}
      </motion.div>
    </div>
  );
}