import React from 'react';
import { motion } from 'motion/react';

const LandingPage = () => {
  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };
  
  const fadeInDown = {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };
  
  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const scaleOnHover = {
    scale: 1.05,
    transition: { type: "spring", stiffness: 300, damping: 10 }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-gray-900 overflow-hidden">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Alkatra:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Animated Header */}
      <motion.header 
        className="fixed top-0 left-0 w-full bg-white bg-opacity-95 backdrop-blur-sm shadow-sm z-50 py-4 px-6 md:px-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto flex justify-between items-center max-w-6xl">
          <motion.h1 
            className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight"
            style={{ fontFamily: "Alkatra, cursive" }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Zeeta
          </motion.h1>
          
          <motion.nav
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <ul className="flex space-x-4 sm:space-x-6">
              <motion.li variants={fadeInDown}>
                <motion.a
                  href="#"
                  className="text-gray-700 hover:text-black transition-colors duration-200 font-medium text-base sm:text-lg"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  Sign In
                </motion.a>
              </motion.li>
              <motion.li variants={fadeInDown}>
                <motion.a
                  href="#"
                  className="text-gray-700 hover:text-black transition-colors duration-200 font-medium text-base sm:text-lg"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  Get Started
                </motion.a>
              </motion.li>
            </ul>
          </motion.nav>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 pt-28 sm:pt-36 max-w-6xl">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Animated Main Heading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight" 
                style={{ fontFamily: "Alkatra, cursive" }}>
              Join the{' '}
              <motion.span 
                className="text-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                Conversation
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                .
              </motion.span>
            </h1>
          </motion.div>

          {/* Animated Subtext */}
          <motion.p
            className="text-lg sm:text-xl leading-relaxed text-gray-700 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Share your thoughts. Connect with others. A microblogging experience reimagined for the modern world.
          </motion.p>

          {/* Animated Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-20 sm:mb-28"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {/* Get Started Button */}
            <motion.div
              variants={fadeInUp}
              whileHover={scaleOnHover}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href="#"
                className="inline-flex items-center justify-center text-lg sm:text-xl px-8 sm:px-10 py-3 sm:py-4
                           bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full shadow-lg
                           transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-300"
              >
                Get Started
              </a>
            </motion.div>

            {/* Sign In Button */}
            <motion.div
              variants={fadeInUp}
              whileHover={scaleOnHover}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href="#"
                className="inline-flex items-center justify-center text-lg sm:text-xl px-8 sm:px-10 py-3 sm:py-4
                           bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold rounded-full shadow-lg
                           transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-200"
              >
                Sign In
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Floating Elements for Visual Interest */}
      <motion.div
        className="absolute top-1/4 left-8 w-4 h-4 bg-gray-300 rounded-full opacity-60"
        animate={{
          y: [0, -10, 0],
          opacity: [0.6, 0.3, 0.6]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-12 w-6 h-6 bg-gray-400 rounded-full opacity-40"
        animate={{
          y: [0, 15, 0],
          x: [0, 5, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute top-1/3 right-24 w-3 h-3 bg-gray-300 rounded-full opacity-50"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.2, 0.5]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

export default LandingPage;