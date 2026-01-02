import { motion, AnimatePresence } from 'framer-motion';

interface KidsCategoriesDropdownProps {
  isVisible: boolean;
}

export function KidsCategoriesDropdown({ isVisible }: KidsCategoriesDropdownProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute top-full right-0 mt-2 w-[90vw] max-w-[800px] sm:w-[600px] md:w-[800px] bg-background/95 backdrop-blur-xl border-2 border-border/30 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <motion.h3
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Coming Soon
              </motion.h3>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
