import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, User, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordlessAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (customer: any) => void;
}

type AuthStep = 'email' | 'code' | 'profile';

export function PasswordlessAuthModal({ isOpen, onClose, onLogin }: PasswordlessAuthModalProps) {
  const [step, setStep] = useState<AuthStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    firstName: '',
    lastName: '',
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');

      // Import the storefront auth functions
      const { customerLogin, customerRecover } = await import('@/lib/passwordlessAuth');
      
      // Try to login first (for existing customers)
      const loginResult = await customerLogin(formData.email, 'temporary-password');
      
      if (loginResult.success) {
        // Customer exists and logged in
        onLogin(loginResult.customer);
        onClose();
        resetForm();
      } else {
        // Customer doesn't exist or invalid password - show profile form for registration
        setIsNewCustomer(true);
        setStep('profile');
      }
    } catch (error: any) {
      console.error('Email submit error:', error);
      setError('Failed to process login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');

      // Create customer and send verification code
      const response = await fetch('/api/create-customer-passwordless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (response.ok) {
        setSuccess('Account created! Verification code sent to your email.');
        setStep('code');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create account.');
      }
    } catch (error: any) {
      console.error('Profile creation error:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');

      // Verify code and sign in
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        onLogin(userData.customer);
        onClose();
        // Reset form
        setFormData({ email: '', code: '', firstName: '', lastName: '' });
        setStep('email');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid verification code.');
      }
    } catch (error: any) {
      console.error('Code verification error:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setSuccess('New verification code sent!');
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch (error: any) {
      console.error('Resend code error:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', code: '', firstName: '', lastName: '' });
    setStep('email');
    setError('');
    setSuccess('');
    setIsNewCustomer(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-background rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-border/50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {step !== 'email' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => step === 'code' ? (isNewCustomer ? setStep('profile') : setStep('email')) : setStep('email')}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-lg font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {step === 'email' ? 'Welcome to 2XY' : 
               step === 'profile' ? 'Complete Profile' : 
               'Verify Email'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { onClose(); resetForm(); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                🔐 Secure passwordless login powered by Shopify
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 h-10"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.email}
              className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting to Shopify...
                </>
              ) : (
                'Continue with Shopify'
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Complete your profile to create your account
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    className="pl-10 h-10"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    className="pl-10 h-10"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                📧 Creating account for: <strong>{formData.email}</strong>
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.firstName || !formData.lastName}
              className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Send Code'
              )}
            </Button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to
              </p>
              <p className="text-sm font-medium text-foreground">{formData.email}</p>
            </div>

            <div>
              <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                className="h-12 text-center text-2xl font-mono tracking-widest"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || formData.code.length !== 6}
              className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-sm text-accent hover:text-accent/80"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}