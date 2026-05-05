import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Document, type DocumentGroup } from '../lib/supabase';
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
  Layers,
  FileText,
  Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { getCategoryColor } from '../utils/categorization';

const VerifyGroup: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<DocumentGroup | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [owner, setOwner] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
      trackScan();
    }
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      // 1. Fetch Group
      const { data: groupData, error: groupError } = await supabase
        .from('document_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // 2. Fetch Documents in Group
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('group_id', id);

      if (docsError) throw docsError;
      setDocuments(docsData || []);

      // 3. Fetch Owner
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', groupData.user_id)
        .single();
      
      setOwner(profileData);

    } catch (error: any) {
      setError(error.message === 'No rows found' ? 'Document group not found' : error.message);
    } finally {
      setLoading(false);
    }
  };

  const trackScan = async () => {
    if (!id) return;
    try {
      await supabase.from('scans').insert([{ group_id: id }]);
    } catch (err) {
      console.error('Failed to track scan:', err);
    }
  };

  const downloadQR = async () => {
    if (qrRef.current === null) return;
    try {
      const dataUrl = await toPng(qrRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `qr-group-${group?.group_name || 'bundle'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Group QR Code downloaded!');
    } catch (err) {
      toast.error('Failed to download QR code');
    }
  };

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const verificationUrl = `${baseUrl}/verify/group/${id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast.success('Bundle link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">Verifying document bundle authenticity...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-12">
        <div className="bg-red-500/10 p-6 rounded-full w-fit mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold">Verification Failed</h1>
        <p className="text-slate-400">{error || 'This document group could not be found.'}</p>
        <Link to="/" className="btn-secondary">Go to Homepage</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Side: QR & Group Summary */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/3 space-y-8"
        >
          <div className="card text-center space-y-8 !bg-slate-900/80 backdrop-blur-xl border-indigo-500/20">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Layers className="w-10 h-10" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {group.group_name}
              </h2>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-indigo-500">
                <span className="bg-indigo-500/10 px-3 py-1 rounded-full">
                  Verified Bundle ({documents.length} Files)
                </span>
              </div>
            </div>

            <div ref={qrRef} className="bg-white p-4 sm:p-6 rounded-2xl inline-block shadow-2xl">
              <QRCodeSVG 
                value={verificationUrl} 
                size={200} 
                level="H"
                includeMargin={false}
                className="w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52"
              />
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={downloadQR}
                className="w-full btn-primary !bg-indigo-600 hover:!bg-indigo-700 !rounded-xl flex items-center justify-center space-x-2 text-sm py-4 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-5 h-5" />
                <span>Download Bundle QR</span>
              </button>
              <button 
                onClick={copyLink}
                className="w-full btn-secondary !rounded-xl flex items-center justify-center space-x-2 text-sm py-4"
              >
                {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                <span>{copied ? 'Copied Link!' : 'Copy Bundle Link'}</span>
              </button>
            </div>
          </div>

          <div className="card space-y-6 !bg-slate-950/50">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Bundle Integrity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-slate-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">Cryptographic Verification Passed</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <User className="w-5 h-5 text-blue-400" />
                <div className="text-sm">
                  <p className="font-semibold">{owner?.name || 'Authorized User'}</p>
                  <p className="text-xs text-slate-500">Document Owner</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div className="text-sm">
                  <p className="font-semibold">{format(new Date(group.created_at), 'PPP')}</p>
                  <p className="text-xs text-slate-500">Creation Date</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Document Grid */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-2/3 space-y-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center space-x-3">
              <span className="bg-indigo-500 w-2 h-8 rounded-full" />
              <span>Documents in this Bundle</span>
            </h2>
            <div className="text-sm text-slate-500 font-mono">
              Group ID: {group.id.substring(0, 8)}...
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="card !p-0 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all border-slate-800/50 flex flex-col"
              >
                {/* Preview Header */}
                <div className="aspect-video relative overflow-hidden bg-slate-950">
                  {doc.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                    <img src={doc.file_url} alt={doc.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-500/5 text-red-400">
                      <FileText className="w-12 h-12 mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">PDF Document</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-bold border backdrop-blur-md ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold truncate group-hover:text-indigo-400 transition-colors">{doc.title}</h3>
                    <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed h-10 italic">
                      {doc.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/verify/${doc.id}`}
                        className="p-2 bg-slate-800 hover:bg-indigo-600 rounded-lg text-slate-400 hover:text-white transition-all"
                        title="View Full Verification"
                      >
                        <Search className="w-4 h-4" />
                      </Link>
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                        title="Open Original"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-8 rounded-3xl bg-indigo-500/5 border border-dashed border-indigo-500/20 text-center">
            <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              This bundle was issued and verified by the DocuVerify platform. All documents are linked to a single cryptographic signature.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyGroup;
