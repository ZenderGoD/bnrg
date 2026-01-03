import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const Privacy = () => {
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
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
              Privacy Policy
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
                At <strong className="text-foreground">TOESPRING</strong>, we are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. By using our website, you consent to the data practices described in this policy.
              </p>

              <div className="mt-8 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Personal Information</h3>
                      <p>When you create an account, place an order, or contact us, we may collect:</p>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li>Name, email address, phone number</li>
                        <li>Shipping and billing addresses</li>
                        <li>Payment information (processed securely through payment gateways)</li>
                        <li>Date of birth (for age verification)</li>
                        <li>Account credentials</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Usage Information</h3>
                      <p>We automatically collect information about your interaction with our website:</p>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li>IP address, browser type, device information</li>
                        <li>Pages visited, time spent, click patterns</li>
                        <li>Search queries and product preferences</li>
                        <li>Cookies and similar tracking technologies</li>
                      </ul>
                    </div>
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
                    <Eye className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Information</h2>
                  </div>
                  <div className="space-y-3 text-muted-foreground">
                    <p>We use the information we collect to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Process and fulfill your orders</li>
                      <li>Manage your account and provide customer support</li>
                      <li>Send order confirmations, shipping updates, and transactional emails</li>
                      <li>Personalize your shopping experience and recommend products</li>
                      <li>Send marketing communications (with your consent)</li>
                      <li>Improve our website, products, and services</li>
                      <li>Detect and prevent fraud, abuse, and security threats</li>
                      <li>Comply with legal obligations under Indian laws, including the Information Technology Act, 2000 and Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
                    </ul>
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
                    <Lock className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">3. Data Sharing and Disclosure</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li><strong className="text-foreground">Service Providers:</strong> With trusted third-party vendors who assist us in operating our website, processing payments, shipping orders, and providing customer support (all bound by confidentiality agreements)</li>
                      <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, court order, or government regulations in India</li>
                      <li><strong className="text-foreground">Business Transfers:</strong> In connection with any merger, acquisition, or sale of assets (with notice to users)</li>
                      <li><strong className="text-foreground">Consent:</strong> With your explicit consent for any other purpose</li>
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
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>We implement reasonable security practices and procedures to protect your personal information:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>SSL encryption for data transmission</li>
                      <li>Secure payment processing through PCI-DSS compliant gateways</li>
                      <li>Regular security assessments and updates</li>
                      <li>Access controls and employee training</li>
                      <li>Secure data storage with encryption at rest</li>
                    </ul>
                    <p className="mt-4">However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Cookies and Tracking Technologies</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>We use cookies and similar technologies to enhance your experience:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><strong className="text-foreground">Essential Cookies:</strong> Required for website functionality</li>
                      <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                      <li><strong className="text-foreground">Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                    </ul>
                    <p className="mt-4">You can control cookies through your browser settings. However, disabling certain cookies may affect website functionality.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights Under Indian Law</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>As per the Information Technology Act, 2000 and related rules, you have the right to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><strong className="text-foreground">Access:</strong> Request access to your personal information</li>
                      <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                      <li><strong className="text-foreground">Withdrawal:</strong> Withdraw consent for data processing (subject to legal obligations)</li>
                      <li><strong className="text-foreground">Grievance:</strong> File a complaint with our Grievance Officer (details below)</li>
                      <li><strong className="text-foreground">Data Portability:</strong> Request transfer of your data in a structured format</li>
                    </ul>
                    <p className="mt-4">To exercise these rights, please contact us at <a href="mailto:privacy@toespring.com" className="text-primary hover:underline">privacy@toespring.com</a></p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Data Retention</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>We retain your personal information only for as long as necessary to:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Fulfill the purposes outlined in this policy</li>
                      <li>Comply with legal, accounting, or reporting requirements under Indian law</li>
                      <li>Resolve disputes and enforce our agreements</li>
                    </ul>
                    <p className="mt-4">Transaction records are retained as required by Indian tax and commercial laws (typically 7 years for accounting records).</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a minor, please contact us immediately.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Third-Party Links</h2>
                  <p className="text-muted-foreground">
                    Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any information.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Grievance Officer</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>In accordance with the Information Technology Act, 2000, we have appointed a Grievance Officer:</p>
                    <div className="bg-background border border-border/30 rounded p-4 mt-4">
                      <p><strong className="text-foreground">Name:</strong> Grievance Officer</p>
                      <p><strong className="text-foreground">Email:</strong> <a href="mailto:grievance@toespring.com" className="text-primary hover:underline">grievance@toespring.com</a></p>
                      <p><strong className="text-foreground">Response Time:</strong> Within 30 days as per IT Rules, 2011</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">11. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-4">12. Contact Us</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
                    <div className="bg-background border border-border/30 rounded p-4 mt-4">
                      <p><strong className="text-foreground">TOESPRING</strong></p>
                      <p>Email: <a href="mailto:privacy@toespring.com" className="text-primary hover:underline">privacy@toespring.com</a></p>
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

export default Privacy;

