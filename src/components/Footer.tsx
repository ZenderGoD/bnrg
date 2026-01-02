import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#F4F1EA] dark:bg-black border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#052e16] dark:text-amber-600 mb-2">MONTEVELORIS</h3>
              <p className="text-gray-900 dark:text-amber-600 text-sm leading-relaxed">
                Where style meets exceptional comfort. Discover the perfect blend of fashion and functionality in every step.
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <motion.a
                href="coming soon"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-gray-900 dark:text-amber-600 hover:bg-amber-600/20 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="coming soon"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-gray-900 dark:text-amber-600 hover:bg-amber-600/20 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="coming soon"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-gray-900 dark:text-amber-600 hover:bg-amber-600/20 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-amber-600 mb-4">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/men" 
                  className="text-gray-900 dark:text-amber-600 hover:text-gray-800 dark:hover:text-amber-500 transition-colors text-sm"
                  onClick={scrollToTop}
                >
                  Men's Coming Soon
                </Link>
              </li>
              <li>
                <Link 
                  to="/women" 
                  className="text-gray-900 dark:text-amber-600 hover:text-gray-800 dark:hover:text-amber-500 transition-colors text-sm"
                  onClick={scrollToTop}
                >
                  Women's Collection
                </Link>
              </li>
              <li>
                <Link 
                  to="/coming soon" 
                  className="text-gray-900 dark:text-amber-600 hover:text-gray-800 dark:hover:text-amber-500 transition-colors text-sm"
                  onClick={scrollToTop}
                >
                  Kids's Coming Soon
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalog" 
                  className="text-gray-900 dark:text-amber-600 hover:text-gray-800 dark:hover:text-amber-500 transition-colors text-sm"
                  onClick={scrollToTop}
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link 
                  to="/search" 
                  className="text-gray-900 dark:text-amber-600 hover:text-gray-800 dark:hover:text-amber-500 transition-colors text-sm"
                  onClick={scrollToTop}
                >
                  Search
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-amber-600 mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/profile" 
                  className="text-gray-900 dark:text-amber-600 hover:text-gray-800 dark:hover:text-amber-500 transition-colors text-sm"
                  onClick={scrollToTop}
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link 
                  to="/cart" 
                  className="text-gray-900 dark:text-amber-600 hover:text-gray-800 dark:hover:text-amber-500 transition-colors text-sm"
                  onClick={scrollToTop}
                >
                  Cart
                </Link>
              </li>
              <li>
                <Link 
                  to="/size-guide" 
                  className="text-gray-900 dark:text-amber-600 hover:text-gray-800 dark:hover:text-amber-500 transition-colors text-sm"
                  onClick={scrollToTop}
                >
                  Size Guide
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-amber-600 mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-900 dark:text-amber-600" />
                <span className="text-gray-900 dark:text-amber-600 text-sm">support@toespring.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-900 dark:text-amber-600" />
                <span className="text-gray-900 dark:text-amber-600 text-sm">+91 9972801985</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-900 dark:text-amber-600" />
                <span className="text-gray-900 dark:text-amber-600 text-sm">Chennai, India</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-border/50 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
        >
          <div className="text-center sm:text-left">
            <p className="text-gray-900 dark:text-amber-600 text-sm">
              © 2024 MONTEVELORIS. All rights reserved. | 
              <Link to="/privacy" className="hover:text-gray-800 dark:hover:text-amber-500 transition-colors ml-1">Privacy Policy</Link> | 
              <Link to="/terms" className="hover:text-gray-800 dark:hover:text-amber-500 transition-colors ml-1">Terms of Service</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
} 