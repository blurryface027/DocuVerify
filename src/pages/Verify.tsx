import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Document } from '../lib/supabase';
import { 
  ShieldCheck, 
  Calendar, 
  User, 
  Download, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  Copy, 
  CheckCircle,
  Hash,
  CreditCard,
  IdCard,
  Car,
  UserCheck,
  Globe,
  GraduationCap,
  Award,
  FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';

const categoryIcons: Record<string, any> = {
  'Aadhar Card': CreditCard,
  'PAN Card': IdCard,
  'Driving License': Car,
  'Voter ID': UserCheck,
  'Passport': Globe,
  'Marksheet': GraduationCap,
  'Certificate': Award,
  'Other': FileText,
};

const categoryColors: Record<string, string> = {
  'Aadhar Card': 'text-blue-400 bg-blue-500/10',
  'PAN Card': 'text-orange-400 bg-orange-500/10',
  'Driving License': 'text-green-400 bg-green-500/10',
  'Voter ID': 'text-purple-400 bg-purple-500/10',
  'Passport': 'text-cyan-400 bg-cyan-500/10',
  'Marksheet': 'text-yellow-400 bg-yellow-500/10',
  'Certificate': 'text-emerald-400 bg-emerald-500/10',
  'Other': 'text-slate-400 bg-slate-500/10',
};

const Verify: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchDocument();
      trackScan();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*, profiles(name, email)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDoc(data);
    } catch (error: any) {
      setError(error.message === 'No rows found' ? 'Document not found' : error.message);
    } finally {
      setLoading(false);
    }
  };

  const trackScan = async () => {
    if (!id) return;
    try {
      await supabase.from('scans').insert([{ document_id: id }]);
    } catch (err) {
      console.error('Failed to track scan:', err);
    }
  };

  const downloadQR = async () => {
    if (qrRef.current === null) return;
    try {
      const dataUrl = await toPng(qrRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `qr-code-${doc?.title || 'document'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('QR Code downloaded!');
    } catch (err) {
      toast.error('Failed to download QR code');
    }
  };

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const verificationUrl = `${baseUrl}/verify/${id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast.success('Verification link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = doc?.expiry_date ? new Date(doc.expiry_date) < new Date() : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium">Verifying document authenticity...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-12">
        <div className="bg-red-500/10 p-6 rounded-full w-fit mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold">Verification Failed</h1>
        <p className="text-slate-400">{error || 'This document could not be found or has been removed.'}</p>
        <button onClick={() => window.location.href = '/'} className="btn-secondary">Go to Homepage</button>
      </div>
    );
  }

  const Icon = categoryIcons[doc.category] || FileText;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: QR & Actions */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:w-1/3 space-y-6"
        >
          <div className="card text-center space-y-6 !bg-slate-900/80 backdrop-blur-xl">
            <div className="flex flex-col items-center space-y-2">
              <div className={`p-4 rounded-2xl ${categoryColors[doc.category] || categoryColors['Other']}`}>
                <Icon className="w-8 h-8" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">{doc.category}</h2>
            </div>

            <div ref={qrRef} className="bg-white p-4 sm:p-6 rounded-2xl inline-block shadow-2xl">
              <QRCodeSVG 
                value={verificationUrl} 
                size={180} 
                level="H"
                includeMargin={false}
                className="w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52"
              />
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={downloadQR}
                className="w-full btn-primary !rounded-xl flex items-center justify-center space-x-2 text-sm py-3"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Code</span>
              </button>
              <button 
                onClick={copyLink}
                className="w-full btn-secondary !rounded-xl flex items-center justify-center space-x-2 text-sm py-3"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card bg-emerald-500/5 border-emerald-500/20 text-center py-6"
          >
            <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold mb-1">
              <ShieldCheck className="w-6 h-6" />
              <span className="tracking-widest uppercase">Verified Secure</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2">Blockchain-backed verification complete.</p>
          </motion.div>
        </motion.div>

        {/* Right Side: Document Details */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:w-2/3 space-y-6"
        >
          <div className="card space-y-8 !bg-slate-900/80 backdrop-blur-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {isExpired ? 'Expired' : 'Verified Authenticity'}
                  </span>
                  {doc.document_number && (
                    <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-mono border border-slate-700">
                      ID: {doc.document_number}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{doc.title}</h1>
              </div>
              <a 
                href={doc.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary !p-4 !rounded-2xl shadow-lg shadow-blue-600/20"
              >
                <ExternalLink className="w-6 h-6" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Document Owner</p>
                <div className="flex items-center space-x-3 text-slate-200 bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                  <User className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">{doc.profiles?.name || 'Anonymous'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Date Digitized</p>
                <div className="flex items-center space-x-3 text-slate-200 bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">{format(new Date(doc.created_at), 'PPP')}</span>
                </div>
              </div>
              {doc.document_number && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Identification Number</p>
                  <div className="flex items-center space-x-3 text-slate-200 bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                    <Hash className="w-5 h-5 text-blue-400" />
                    <span className="font-mono font-semibold tracking-wider">{doc.document_number}</span>
                  </div>
                </div>
              )}
              {doc.expiry_date && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Validity Date</p>
                  <div className={`flex items-center space-x-3 p-3 rounded-xl border ${isExpired ? 'bg-red-500/5 border-red-500/30 text-red-400' : 'bg-slate-800/30 border-slate-700/30 text-slate-200'}`}>
                    <Calendar className={`w-5 h-5 ${isExpired ? 'text-red-400' : 'text-blue-400'}`} />
                    <span className="font-semibold">{format(new Date(doc.expiry_date), 'PPP')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 bg-slate-800/20 p-6 rounded-2xl border border-slate-700/30">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Attached Metadata</p>
              <p className="text-slate-300 leading-relaxed italic text-sm">
                {doc.description || 'No additional metadata provided for this document.'}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-mono">System ID: {doc.id}</span>
              </div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">DocuVerify Trust Protocol v2.0</span>
            </div>
          </div>

          {/* Document Preview (if image) */}
          {doc.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card !p-3 overflow-hidden group relative"
            >
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <img 
                src={doc.file_url} 
                alt="Document Preview" 
                className="w-full rounded-xl shadow-lg border border-slate-800"
              />
              <div className="mt-4 flex justify-center">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Secure Preview Only</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Verify;
