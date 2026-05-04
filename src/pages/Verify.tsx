import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Document } from '../lib/supabase';
import { ShieldCheck, Calendar, User, Download, ExternalLink, Loader2, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';

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
        <p className="text-slate-400">Verifying document authenticity...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-12">
        <div className="bg-red-500/10 p-4 rounded-full w-fit mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold">Verification Failed</h1>
        <p className="text-slate-400">{error || 'This document could not be found or has been removed.'}</p>
        <button onClick={() => window.location.href = '/'} className="btn-secondary">Go to Homepage</button>
      </div>
    );
  }


    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Side: QR & Actions */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:w-1/3 space-y-6"
          >
            <div className="card text-center space-y-6">
              <div ref={qrRef} className="bg-white p-4 rounded-xl inline-block">
                <QRCodeSVG 
                  value={verificationUrl} 
                  size={180} 
                  level="H"
                  includeMargin={false}
                />
              </div>
            <div className="space-y-3">
              <button 
                onClick={downloadQR}
                className="w-full btn-primary flex items-center justify-center space-x-2 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Code</span>
              </button>
              <button 
                onClick={copyLink}
                className="w-full btn-secondary flex items-center justify-center space-x-2 text-sm"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="card bg-blue-500/5 border-blue-500/20 text-center py-4">
            <div className="flex items-center justify-center space-x-2 text-blue-400 font-bold mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span>OFFICIAL VERIFIED</span>
            </div>
            <p className="text-xs text-slate-400">Authenticity confirmed by DocuVerify</p>
          </div>
        </motion.div>

        {/* Right Side: Document Details */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:w-2/3 space-y-6"
        >
          <div className="card space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {isExpired ? 'Expired' : 'Valid Document'}
                </span>
                <h1 className="text-3xl font-bold pt-2">{doc.title}</h1>
              </div>
              <a 
                href={doc.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary p-3"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Document Owner</p>
                <div className="flex items-center space-x-2 text-slate-200">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{doc.profiles?.name || 'Anonymous'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Issued Date</p>
                <div className="flex items-center space-x-2 text-slate-200">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{format(new Date(doc.created_at), 'PPP')}</span>
                </div>
              </div>
              {doc.expiry_date && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Expiry Date</p>
                  <div className="flex items-center space-x-2 text-slate-200">
                    <Calendar className="w-4 h-4 text-red-400" />
                    <span className={`font-medium ${isExpired ? 'text-red-400' : ''}`}>{format(new Date(doc.expiry_date), 'PPP')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Description</p>
              <p className="text-slate-300 leading-relaxed italic">
                {doc.description || 'No description provided for this document.'}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Document ID: <span className="font-mono">{doc.id}</span>
              </p>
            </div>
          </div>

          {/* Document Preview (if image) */}
          {doc.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
            <div className="card p-2 overflow-hidden">
              <img 
                src={doc.file_url} 
                alt="Document Preview" 
                className="w-full rounded-lg"
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Verify;
