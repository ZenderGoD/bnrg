import { motion } from 'framer-motion';
import { CreditSystem } from '@/components/CreditSystem';

export default function Credits() {
  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            2XY Credits & Rewards
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Earn credits with every purchase and share the love with your friends. 
            The more you shop, the more you save together.
          </p>
        </motion.div>

        <CreditSystem />
      </div>
    </div>
  );
}