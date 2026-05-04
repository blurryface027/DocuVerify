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
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-extrabold tracking-tight"
        >
          Verify Documents <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Instantly with QR
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-400 leading-relaxed"
        >
          DocuVerify provides a secure, decentralized way to store and verify your important certificates, identity cards, and legal documents.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link to="/auth?signup=true" className="btn-primary px-8 py-4 text-lg flex items-center space-x-2">
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/auth" className="btn-secondary px-8 py-4 text-lg">
            Sign In
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="card group hover:bg-slate-800/50"
          >
            <div className="bg-blue-500/10 p-3 rounded-xl w-fit group-hover:bg-blue-500/20 transition-colors mb-4 text-blue-400">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Stats / Proof Section */}
      <section className="glass rounded-3xl p-12 text-center border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="text-4xl font-bold text-blue-400">100%</p>
            <p className="text-slate-400 mt-2">Secure Encryption</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-indigo-400">Instant</p>
            <p className="text-slate-400 mt-2">QR Generation</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-purple-400">24/7</p>
            <p className="text-slate-400 mt-2">Public Verification</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
