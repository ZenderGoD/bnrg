import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export default function Kids() {
  return (
    <div className="min-h-screen pt-20 sm:pt-24 flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-accent via-primary to-accent rounded-full flex items-center justify-center shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Clock className="w-12 h-12 text-white" />
          </motion.div>
          
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Coming Soon
          </motion.h1>
          
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            We're working on something amazing for you. Check back soon!
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
