import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const About = () => {
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
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img
                src="/monte-veloris-logo.png"
                alt="TOESPRING"
                className="h-16 sm:h-20 md:h-24 w-auto"
              />
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
              Elevated Comfort.
              <br />
              Timeless Design.
            </h1>

            <div className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed space-y-3 max-w-2xl mx-auto">
              <p>
                Luxury footwear crafted with precision, inspired by elegance, and designed for everyday comfort.
              </p>
              <p>
                At Toespring, we believe true luxury is not just seen — it is felt with every step.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Where Craft Meets Comfort */}
      <section id="story" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Where Craft Meets Comfort
            </h2>
            <div className="text-base sm:text-lg text-muted-foreground leading-relaxed space-y-4 max-w-3xl mx-auto">
              <p>
                <strong className="text-foreground">TOESPRING</strong> is a premium footwear brand born from a deep understanding of materials, craftsmanship, and the way people move. Rooted in refined design and uncompromising comfort, our footwear is thoughtfully created for those who appreciate understated luxury.
              </p>
              <p>
                Every pair reflects a balance of heritage-inspired aesthetics and modern comfort engineering, making Toespring ideal for long days, elegant evenings, and everything in between.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Designed to Walk Above */}
      <section className="py-16 sm:py-24 bg-[#F4F1EA] dark:bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Designed to Walk Above
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              At Toespring, luxury is never loud.
              <br />
              It is expressed through clean lines, superior materials, and attention to detail.
            </p>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              From carefully selected leathers to ergonomically designed footbeds, each product is crafted to deliver:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
              {[
                'Exceptional comfort',
                'Timeless elegance',
                'Enduring quality'
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50"
                >
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{item}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              We design footwear that looks refined — and feels effortless.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Toespring Promise */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-foreground">
              The Toespring Promise
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
              {[
                'Premium materials, responsibly sourced',
                'Comfort-focused construction',
                'Minimal, elegant design language',
                'Crafted for Indian conditions, styled for global appeal'
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border/50"
                >
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our creations are not driven by trends, but by longevity — in style, comfort, and craftsmanship.
            </p>

            <div className="text-center space-y-4">
              <p className="text-xl sm:text-2xl font-semibold text-foreground">
                Step into a world where elegance rises above excess.
              </p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                Step into TOESPRING.
              </p>
            </div>

            <div className="mt-8">
              <Button asChild size="lg" className="group">
                <Link to="/catalog">
                  Discover More
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;

