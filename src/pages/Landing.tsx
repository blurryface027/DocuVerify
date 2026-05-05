import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, QrCode, Lock, Search, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  const features = [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "Unique QR IDs",
      description: "Every document gets a cryptographic QR code for instant scanning."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Tamper Proof",
      description: "Blockchain-inspired verification ensures document integrity."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Secure Storage",
      description: "Your files are encrypted and stored in secure Supabase buckets."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Public Verification",
      description: "Third parties can verify status without needing an account."
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pt-4 sm:pt-12">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight"
        >
          Verify Documents <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Instantly with QR
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto"
        >
          DocuVerify provides a secure, decentralized way to store and verify your important certificates, identity cards, and legal documents.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <Link to="/auth?signup=true" className="w-full sm:w-auto btn-primary px-8 py-4 text-lg flex items-center justify-center space-x-2">
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/auth" className="w-full sm:w-auto btn-secondary px-8 py-4 text-lg">
            Sign In
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="card group hover:bg-slate-800/50 flex flex-col items-center sm:items-start text-center sm:text-left"
          >
            <div className="bg-blue-500/10 p-3 rounded-xl w-fit group-hover:bg-blue-500/20 transition-colors mb-4 text-blue-400">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Stats / Proof Section */}
      <section className="mx-4 sm:mx-0 glass rounded-3xl p-8 sm:p-12 text-center border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-bold text-blue-400">100%</p>
            <p className="text-slate-400 text-sm sm:text-base mt-2">Secure Encryption</p>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/5 pt-8 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-bold text-indigo-400">Instant</p>
            <p className="text-slate-400 text-sm sm:text-base mt-2">QR Generation</p>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/5 pt-8 sm:pt-0">
            <p className="text-3xl sm:text-4xl font-bold text-purple-400">24/7</p>
            <p className="text-slate-400 text-sm sm:text-base mt-2">Public Verification</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
