"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export const LandingPage = () => {
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
        staggerChildren: 0.08
      }
    }
  };
  
  const scaleOnHover = {
    scale: 1.03,
    transition: { type: "spring", stiffness: 300, damping: 14 }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-gray-900 overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Alkatra:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50 py-4 px-6 md:px-8"
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
            logger
          </motion.h1>
          
          <motion.nav
            variants={stagger}
            initial="initial"
            animate="animate"
            className="hidden sm:block"
          >
            <ul className="flex items-center space-x-2 sm:space-x-4">
              <motion.li variants={fadeInDown}>
                <a href="#features" className="text-gray-700 hover:text-black transition-colors duration-200 text-sm sm:text-base">Features</a>
              </motion.li>
              <motion.li variants={fadeInDown}>
                <a href="#how" className="text-gray-700 hover:text-black transition-colors duration-200 text-sm sm:text-base">How it works</a>
              </motion.li>
              <motion.li variants={fadeInDown}>
                <a href="#testimonials" className="text-gray-700 hover:text-black transition-colors duration-200 text-sm sm:text-base">Stories</a>
              </motion.li>
            </ul>
          </motion.nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/sign-in" className="hidden sm:inline-flex px-5 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-sm font-medium transition">Sign In</Link>
            <Link href="/auth/sign-up" className="inline-flex px-5 py-2 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition">Get Started</Link>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <div className="container mx-auto px-4 pt-28 sm:pt-36 max-w-6xl">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight" 
                style={{ fontFamily: "Alkatra, cursive" }}>
              Join the <span className="text-gray-700">Conversation</span>.
            </h1>
          </motion.div>

          <motion.p
            className="text-lg sm:text-xl leading-relaxed text-gray-700 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Share your thoughts. Connect with others. A microblogging experience reimagined for the modern world.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-16"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeInUp} whileHover={scaleOnHover} whileTap={{ scale: 0.96 }}>
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center text-lg px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full shadow-lg transition focus:outline-none focus:ring-4 focus:ring-gray-300"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div variants={fadeInUp} whileHover={scaleOnHover} whileTap={{ scale: 0.96 }}>
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center justify-center text-lg px-8 py-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold rounded-full shadow-lg transition focus:outline-none focus:ring-4 focus:ring-gray-200"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="relative">
        <div className="container mx-auto px-4 max-w-6xl py-8 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: "Clean, focused writing",
                desc: "Compose posts with a distraction-free editor and smart formatting.",
              },
              {
                title: "Meaningful conversations",
                desc: "Replies, mentions, and threads designed to keep context clear.",
              },
              {
                title: "Thoughtful discovery",
                desc: "A timeline tuned for relevance, not noise—see what matters.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white/60">
        <div className="container mx-auto px-4 max-w-6xl py-10 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "10k+", label: "Creators" },
              { value: "120k+", label: "Posts shared" },
              { value: "98%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how">
        <div className="container mx-auto px-4 max-w-6xl py-10 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { step: "1", title: "Create", desc: "Start an account in seconds. Set your profile and you're ready." },
              { step: "2", title: "Share", desc: "Write and share ideas. Add media, mention friends, start threads." },
              { step: "3", title: "Connect", desc: "Join conversations that matter. Discover people and topics you love." },
            ].map((h, i) => (
              <motion.div key={i} className="rounded-2xl border border-gray-200 bg-white p-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold mb-3">{h.step}</div>
                <h3 className="text-lg font-semibold mb-1">{h.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-white">
        <div className="container mx-auto px-4 max-w-6xl py-10 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { quote: "The most refreshing writing experience I've had in years.", name: "Aarav", role: "Writer" },
              { quote: "Conversations here stay focused and meaningful.", name: "Maya", role: "Designer" },
              { quote: "I found my people. The timeline feels curated for me.", name: "Liam", role: "Engineer" },
            ].map((t, i) => (
              <motion.blockquote key={i} className="rounded-2xl border border-gray-200 bg-white p-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <p className="text-gray-800 text-sm leading-relaxed">“{t.quote}”</p>
                <footer className="mt-3 text-xs text-gray-600">— {t.name}, {t.role}</footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="container mx-auto px-4 max-w-6xl py-12 sm:py-16">
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold">Ready to share your voice?</h2>
            <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base">Join thousands of creators building thoughtful conversations.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/auth/sign-up" className="px-6 py-3 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition">Create your account</Link>
              <Link href="/auth/sign-in" className="px-6 py-3 rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-sm font-medium transition">Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80">
        <div className="container mx-auto px-4 max-w-6xl py-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="logo-font text-sm">logger</span>
            <span className="text-xs text-gray-500">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <a href="#features" className="text-xs text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how" className="text-xs text-gray-600 hover:text-gray-900">How it works</a>
            <a href="#testimonials" className="text-xs text-gray-600 hover:text-gray-900">Stories</a>
          </div>
        </div>
      </footer>

      {/* Floating Ornaments */}
      <motion.div
        className="absolute top-1/4 left-8 w-4 h-4 bg-gray-300 rounded-full opacity-60"
        animate={{ y: [0, -10, 0], opacity: [0.6, 0.3, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-12 w-6 h-6 bg-gray-400 rounded-full opacity-40"
        animate={{ y: [0, 15, 0], x: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-24 w-3 h-3 bg-gray-300 rounded-full opacity-50"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};