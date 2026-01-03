import { motion } from 'framer-motion';
import { FileText, ShoppingBag, CreditCard, Truck, RotateCcw } from 'lucide-react';

const Terms = () => {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-[#F4F1EA] dark:from-black to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8 flex justify-center">
              <FileText className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Welcome to <strong className="text-foreground">TOESPRING</strong>. These Terms of Service ("Terms") govern your access to and use of our website, products, and services. By accessing our website or making a purchase, you agree to be bound by these Terms. Please read them carefully.
              </p>

              <div className="mt-8 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>By accessing or using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree with these Terms, you must not use our services.</p>
                    <p>These Terms constitute a legally binding agreement between you and TOESPRING, governed by the laws of India and subject to the exclusive jurisdiction of courts in India.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">2. Products and Pricing</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Product Information</h3>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>We strive to display accurate product descriptions, images, and prices</li>
                        <li>Product colors may vary slightly due to screen settings and lighting</li>
                        <li>All prices are in Indian Rupees (INR) and include applicable taxes (GST as per Indian tax laws)</li>
                        <li>Prices are subject to change without prior notice</li>
                        <li>We reserve the right to limit quantities and refuse orders</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Payment Terms</h3>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Payment must be made at the time of order placement</li>
                        <li>We accept credit/debit cards, UPI, net banking, and other payment methods as available</li>
                        <li>All transactions are processed securely through PCI-DSS compliant payment gateways</li>
                        <li>Payment is processed only after order confirmation</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">3. Orders and Payment</h2>
                  </div>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">Order Acceptance:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Your order is an offer to purchase, which we may accept or reject</li>
                      <li>Order confirmation will be sent via email</li>
                      <li>We reserve the right to cancel orders due to pricing errors, stock unavailability, or suspected fraud</li>
                    </ul>
                    <p className="mt-4"><strong className="text-foreground">Payment Processing:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>By providing payment information, you authorize us to charge the specified amount</li>
                      <li>If payment fails, your order will be cancelled</li>
                      <li>Refunds will be processed as per our Refund Policy (Section 5)</li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">4. Shipping</h2>
                  </div>
                  <div className="space-y-3 text-muted-foreground">
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>We ship throughout India. Shipping times vary by location (typically 5-10 business days)</li>
                      <li>Shipping charges are calculated at checkout based on destination and order value</li>
                      <li>You must provide accurate shipping address. We are not liable for shipping failures due to incorrect addresses</li>
                      <li>Risk of loss and title pass to you upon shipping to the carrier</li>
                      <li>Shipping delays due to circumstances beyond our control (natural disasters, strikes, etc.) are not our responsibility</li>
                      <li>You may be required to provide identification and sign for shipping</li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <RotateCcw className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">5. Returns, Exchanges, and Refunds</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Return Policy</h3>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Items must be returned within 7 days of receipt in original condition (unworn, with tags, in original packaging)</li>
                        <li>Defective or damaged items may be returned within 15 days</li>
                        <li>Customized or personalized items are non-returnable unless defective</li>
                        <li>Return shipping costs are borne by the customer unless the item is defective or wrong item was delivered</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Refund Processing</h3>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Refunds will be processed within 7-10 business days after receipt and inspection of returned items</li>
                        <li>Refunds will be issued to the original payment method</li>
                        <li>Shipping charges (if any) are non-refundable unless the return is due to our error</li>
                        <li>We reserve the right to refuse returns that do not meet our return policy criteria</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. User Accounts</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>When you create an account, you agree to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Provide accurate, current, and complete information</li>
                      <li>Maintain and update your information as necessary</li>
                      <li>Maintain the security of your account credentials</li>
                      <li>Accept responsibility for all activities under your account</li>
                      <li>Notify us immediately of unauthorized use</li>
                      <li>Be at least 18 years of age to create an account</li>
                    </ul>
                    <p className="mt-4">We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Intellectual Property</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>All content on this website, including but not limited to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Text, graphics, logos, images, product designs</li>
                      <li>Software, code, and website design</li>
                      <li>Trademarks and brand names (including "TOESPRING")</li>
                    </ul>
                    <p className="mt-4">are the property of TOESPRING or its licensors and are protected by Indian copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our written permission.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Prohibited Uses</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>You agree not to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Use the website for any illegal purpose or in violation of Indian laws</li>
                      <li>Attempt to gain unauthorized access to our systems or interfere with website functionality</li>
                      <li>Use automated systems (bots, scrapers) to access the website</li>
                      <li>Transmit viruses, malware, or harmful code</li>
                      <li>Impersonate others or provide false information</li>
                      <li>Engage in fraudulent transactions or payment fraud</li>
                      <li>Resell products purchased from our website for commercial purposes without authorization</li>
                      <li>Reverse engineer or attempt to extract source code</li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Limitation of Liability</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>To the maximum extent permitted by Indian law:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>TOESPRING shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
                      <li>Our total liability shall not exceed the amount you paid for the product in question</li>
                      <li>We are not responsible for damages resulting from:</li>
                      <ul className="list-disc list-inside ml-8 mt-1 space-y-1">
                        <li>Use or inability to use our website</li>
                        <li>Unauthorized access to your account or data</li>
                        <li>Third-party conduct or products</li>
                        <li>Force majeure events</li>
                      </ul>
                    </ul>
                    <p className="mt-4">Nothing in these Terms excludes or limits our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded under Indian law.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Consumer Protection</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>In accordance with the Consumer Protection Act, 2019, you have the right to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Receive goods as described and of satisfactory quality</li>
                      <li>Return defective products and receive refunds or replacements</li>
                      <li>File complaints with consumer forums in India</li>
                      <li>Protection against unfair trade practices</li>
                    </ul>
                    <p className="mt-4">For grievances, please contact our customer service or file a complaint with the appropriate consumer forum in your jurisdiction.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">11. Governing Law and Dispute Resolution</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">Governing Law:</strong> These Terms are governed by the laws of India, without regard to conflict of law principles.</p>
                    <p><strong className="text-foreground">Jurisdiction:</strong> Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of courts in [City], India.</p>
                    <p><strong className="text-foreground">Dispute Resolution:</strong> We encourage resolving disputes through good faith negotiation. If unresolved, disputes may be resolved through:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Mediation through a mutually agreed mediator</li>
                      <li>Arbitration under the Arbitration and Conciliation Act, 1996</li>
                      <li>Consumer forums as per the Consumer Protection Act, 2019</li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">12. Modifications to Terms</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these Terms at any time. Material changes will be notified by posting the updated Terms on this page with a revised "Last Updated" date. Your continued use of our services after such modifications constitutes acceptance of the updated Terms.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">13. Severability</h2>
                  <p className="text-muted-foreground">
                    If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.3 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">14. Contact Information</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>For questions about these Terms, please contact us:</p>
                    <div className="bg-background border border-border/30 rounded p-4 mt-4">
                      <p><strong className="text-foreground">TOESPRING</strong></p>
                      <p>Email: <a href="mailto:legal@toespring.com" className="text-primary hover:underline">legal@toespring.com</a></p>
                      <p>Customer Service: <a href="mailto:support@toespring.com" className="text-primary hover:underline">support@toespring.com</a></p>
                      <p>Phone: +91-XXXX-XXXXXX</p>
                      <p className="mt-2">Address: [Company Address], India</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Terms;

