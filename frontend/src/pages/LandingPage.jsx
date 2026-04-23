// src/pages/LandingPage.jsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Zap, TrendingUp, Eye, CheckCircle, Star } from 'lucide-react';

const Feature = ({ icon: Icon, title, desc }) => (
  <motion.div whileHover={{ y: -4 }} className="glass-card p-6">
    <div className="w-11 h-11 bg-brand-500/20 rounded-xl flex items-center justify-center mb-4">
      <Icon size={22} className="text-brand-400" />
    </div>
    <h3 className="font-bold text-white mb-2">{title}</h3>
    <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-4xl font-black text-white mb-1">{value}</div>
    <div className="text-white/50 text-sm">{label}</div>
  </div>
);

const LandingPage = () => (
  <div className="min-h-screen">
    {/* Hero */}
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30 px-4 py-1.5 rounded-full mb-6">
            <Shield size={12} /> Trust-Based Advertisement Platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-7xl font-black text-white leading-tight mb-6"
        >
          Ads You Can <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Actually Trust</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Advertisement Express uses AI-powered trust scoring to verify every ad before it goes live.
          No scams. No spam. Only real, verified listings.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Start for Free →
          </Link>
          <Link to="/ads" className="btn-secondary text-base px-8 py-3">
            Browse Trusted Ads
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 glass-card p-8 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <Stat value="98%" label="Fraud Detection Rate" />
          <Stat value="<2min" label="Avg. Approval Time" />
          <Stat value="100%" label="Verified Listings" />
        </motion.div>
      </div>
    </section>

    {/* How it works */}
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-white mb-4">How Trust Scoring Works</h2>
        <p className="text-white/50 max-w-xl mx-auto">Every ad goes through our 4-step verification engine before reaching users.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { step: '01', title: 'Submit Ad', desc: 'Post your ad with title, description, category, and optional image.' },
          { step: '02', title: 'AI Scan', desc: 'Our engine checks for scam keywords, suspicious formatting, and content quality.' },
          { step: '03', title: 'Trust Score', desc: 'A 0–100 score is assigned. ≥80 auto-approves, 50–79 goes to admin.' },
          { step: '04', title: 'Go Live', desc: 'Approved ads appear on the Trusted Feed with verified badges.' },
        ].map((item) => (
          <motion.div key={item.step} whileHover={{ y: -4 }} className="glass-card p-6 text-center">
            <div className="text-4xl font-black text-brand-500/30 mb-3">{item.step}</div>
            <h3 className="font-bold text-white mb-2">{item.title}</h3>
            <p className="text-white/50 text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section className="py-24 px-6 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Why Advertisement Express?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Feature icon={Shield} title="Fraud Prevention" desc="Multi-layer scam keyword detection and content analysis keeps bad actors out." />
          <Feature icon={Zap} title="Instant Verification" desc="High-trust ads are auto-approved in seconds. No waiting for simple, clean listings." />
          <Feature icon={TrendingUp} title="Analytics Dashboard" desc="Track impressions, clicks, and engagement on every ad you post." />
          <Feature icon={Eye} title="Community Reporting" desc="Users can flag suspicious ads. Three reports auto-escalates for admin review." />
          <Feature icon={CheckCircle} title="Verified Vendors" desc="Admin-verified users get a trust boost and a visible verification badge." />
          <Feature icon={Star} title="Featured Ads" desc="Boost your listing to the top of the feed with priority placement." />
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-24 px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass-card max-w-2xl mx-auto p-12">
        <h2 className="text-4xl font-black text-white mb-4">Ready to post your first ad?</h2>
        <p className="text-white/50 mb-8">Join a platform where trust is built in — not bolted on.</p>
        <Link to="/register" className="btn-primary text-base px-10 py-3">Create Free Account →</Link>
      </motion.div>
    </section>

    {/* Footer */}
    <footer className="border-t border-white/5 py-8 text-center text-white/30 text-sm">
      © {new Date().getFullYear()} Advertisement Express. All rights reserved.
    </footer>
  </div>
);

export default LandingPage;
