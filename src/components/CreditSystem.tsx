import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Share2, Copy, Check, CreditCard, History, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  getCustomerCredits, 
  createShareableCoupon, 
  getCreditTransactions,
  CustomerCredits,
  CreditTransaction,
  ShareableCoupon 
} from '@/lib/creditSystem';
import { getCustomerToken, getCustomer } from '@/lib/shopify';

interface Credit {
  id: string;
  amount: number;
  code: string;
  expiresAt: string;
  isUsed: boolean;
}

interface CreditSystemProps {
  // All props are now optional as we fetch from Shopify
}

export function CreditSystem(_props: CreditSystemProps) {
  const [shareAmount, setShareAmount] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [customerCredits, setCustomerCredits] = useState<CustomerCredits>({ balance: 0, earned: 0, pendingCredits: 0 });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [sharedCoupons, setSharedCoupons] = useState<ShareableCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'share' | 'history'>('overview');
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Get current customer and load credit data
  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      setIsLoading(true);
      const token = getCustomerToken();
      
      if (token?.accessToken) {
        const [customer, credits, creditTransactions] = await Promise.all([
          getCustomer(token.accessToken),
          getCustomerCredits(token.accessToken),
          getCreditTransactions(token.accessToken)
        ]);

        if (customer?.id) {
          setCustomerId(customer.id);
        }

        setCustomerCredits(credits);
        setTransactions(creditTransactions);

        // Load shared coupons from backend (Admin API) if available
        if (customer?.id) {
          try {
            const resp = await fetch(`/api/credits_coupons?customerId=${encodeURIComponent(customer.id)}`);
            if (resp.ok) {
              const data = await resp.json();
              if (Array.isArray(data.coupons)) {
                setSharedCoupons(data.coupons);
              }
            }
          } catch {
            // ignore if endpoint not configured locally
          }
        }
      }
    } catch (error) {
      console.error('Error loading credit data:', error);
      toast({
        title: "Error",
        description: "Failed to load credit information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareCredits = async () => {
    const amount = parseFloat(shareAmount);
    if (amount <= 0 || amount > customerCredits.balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your available credits.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = getCustomerToken();
      if (!token?.accessToken) {
        toast({
          title: "Error",
          description: "Please sign in to share credits.",
          variant: "destructive",
        });
        return;
      }

      if (!customerId) {
        toast({
          title: "Account Required",
          description: "We couldn't determine your account. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      const coupon = await createShareableCoupon(amount, customerId);
      
      if (coupon) {
        setSharedCoupons(prev => [...prev, coupon]);
        // Balance is updated server-side; UI will refresh via loadCreditData()
        
        toast({
          title: "Credits Shared!",
          description: `Created a $${amount} coupon: ${coupon.code}`,
        });
        
        setShareAmount('');
        await loadCreditData(); // Refresh data
      } else {
        throw new Error('Failed to create shareable coupon');
      }
    } catch (error) {
      console.error('Error sharing credits:', error);
      toast({
        title: "Error",
        description: "Failed to create shareable coupon. This feature requires Shopify Admin API via a secure backend (gift card create). See SHOPIFY_SETUP.md.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      
      toast({
        title: "Copied!",
        description: "Coupon code copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'earn' | 'share' | 'transactions')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="bg-gradient-accent text-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <CreditCard className="h-6 w-6" />
                  <span>Your MONTEVELORIS Credits</span>
                </CardTitle>
                <CardDescription className="text-white/80">
                  Earn 40% back in credits with every purchase and share them with friends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">${customerCredits.balance.toFixed(2)}</div>
                <p className="text-white/80">Available to spend or share</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How MONTEVELORIS Credits Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                  <div>
                    <p className="font-medium">Earn Credits</p>
                    <p className="text-sm text-muted-foreground">Get 40% back in credits on every purchase</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                  <div>
                    <p className="font-medium">Share with Friends</p>
                    <p className="text-sm text-muted-foreground">Create coupon codes to share your credits</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                  <div>
                    <p className="font-medium">Save Together</p>
                    <p className="text-sm text-muted-foreground">Your friends get discounts, you spread the love</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="share">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5" />
                  <span>Share Credits</span>
                </CardTitle>
                <CardDescription>Create a coupon code to share your credits with friends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <Input
                    type="number"
                    placeholder="Amount to share"
                    value={shareAmount}
                    onChange={(e) => setShareAmount(e.target.value)}
                    min="1"
                    max={customerCredits.balance}
                    step="0.01"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleShareCredits}
                    className="whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 min-w-fit"
                    disabled={!shareAmount || parseFloat(shareAmount) <= 0 || parseFloat(shareAmount) > customerCredits.balance}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Create Coupon
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Minimum: $1 • Maximum: ${customerCredits.balance.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Coupons</CardTitle>
                <CardDescription>Share these codes with friends or use them yourself</CardDescription>
              </CardHeader>
              <CardContent>
                {sharedCoupons.length > 0 ? (
                  <div className="space-y-3">
                    {sharedCoupons.map((coupon) => (
                      <motion.div
                        key={coupon.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded truncate">{coupon.code}</span>
                            <span className="text-lg font-bold text-accent">${coupon.amount}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => copyToClipboard(coupon.code)}
                          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex-shrink-0 touch-target"
                        >
                          {copiedCode === coupon.code ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No coupons available</p>
                    <p className="text-sm text-muted-foreground mt-1">Create your first coupon by sharing some credits above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="history">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Transaction History</span>
                </CardTitle>
                <CardDescription>Your recent credit activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length ? (
                  <div className="divide-y divide-border">
                    {transactions.map((txn) => (
                      <div key={txn.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {txn.type === 'earned' && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {txn.type === 'spent' && <CreditCard className="h-4 w-4 text-red-600" />}
                            {txn.type === 'shared' && <Share2 className="h-4 w-4 text-accent" />}
                            {txn.type === 'received' && <Gift className="h-4 w-4 text-accent" />}
                            {txn.type === 'refund' && <CreditCard className="h-4 w-4 text-gray-900 dark:text-amber-600" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className={`text-sm font-semibold ${txn.type === 'spent' ? 'text-red-600' : 'text-green-600'}`}>
                          {txn.type === 'spent' ? '-' : '+'}${txn.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}