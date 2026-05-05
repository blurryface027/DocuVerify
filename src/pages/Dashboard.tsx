import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Document } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Plus, 
  Eye, 
  Calendar, 
  QrCode as QrIcon, 
  Trash2, 
  ExternalLink,
  CreditCard,
  IdCard,
  Car,
  UserCheck,
  Globe,
  GraduationCap,
  Award,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

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

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, scans: 0 });

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, profile]);

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('documents')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });

      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
      
      setStats({
        total: data?.length || 0,
        scans: 0
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            Welcome, {profile?.name || 'User'}!
          </h1>
          <p className="text-slate-400 mt-1">Manage your digital vault and verification keys.</p>
        </motion.div>
        <Link to="/upload" className="btn-primary flex items-center space-x-2 !px-6 !py-3 !rounded-xl shadow-lg shadow-blue-600/20">
          <Plus className="w-5 h-5" />
          <span>Add Document</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-blue-500/5 border-blue-500/20 !p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Stored Files</p>
              <p className="text-4xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-400">
              <FileText className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-indigo-500/5 border-indigo-500/20 !p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Verified Scans</p>
              <p className="text-4xl font-bold mt-2">{stats.scans}</p>
            </div>
            <div className="bg-indigo-500/20 p-4 rounded-2xl text-indigo-400">
              <Eye className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Documents List */}
      <div className="space-y-12">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Your Documents</h2>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-64 animate-pulse bg-slate-900/50 rounded-2xl" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 card border-dashed border-slate-800 bg-slate-900/20"
          >
            <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-xl font-medium text-slate-300">No documents found</p>
            <p className="text-slate-500 mt-2">Upload your first document to get started.</p>
            <Link to="/upload" className="mt-8 inline-flex btn-secondary">
              Go to Upload
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-16">
            {Object.entries(
              documents.reduce((acc, doc) => {
                const category = doc.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(doc);
                return acc;
              }, {} as Record<string, Document[]>)
            ).map(([category, docs], idx) => (
              <div key={category} className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className={`px-4 py-2 rounded-xl border border-slate-700/50 flex items-center space-x-3 ${categoryColors[category] || categoryColors['Other']}`}>
                    {React.createElement(categoryIcons[category] || FileText, { className: "w-5 h-5" })}
                    <span className="text-sm font-bold uppercase tracking-widest">{category}</span>
                    <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                    <span className="text-sm font-medium opacity-70">{docs.length}</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {docs.map((doc, docIdx) => {
                    const Icon = categoryIcons[category] || FileText;
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (idx * 0.1) + (docIdx * 0.05) }}
                        className="card flex flex-col justify-between group !p-0 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all border-slate-800/50"
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl ${categoryColors[category] || categoryColors['Other']}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex space-x-1">
                              <button 
                                onClick={() => deleteDocument(doc.id, doc.file_path)}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl font-bold truncate group-hover:text-blue-400 transition-colors">{doc.title}</h3>
                            {profile?.role === 'admin' && (
                              <p className="text-xs text-blue-400 font-bold uppercase tracking-tighter mt-1">Owner: {doc.profiles?.name || 'Unknown'}</p>
                            )}
                            <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">{doc.description || 'No description provided.'}</p>
                          </div>

                          {doc.document_number && (
                            <div className="flex items-center space-x-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                              <Hash className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-mono text-slate-300">{doc.document_number}</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-950/50 p-6 border-t border-slate-800 space-y-4">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center space-x-2 text-slate-500">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                            </div>
                            {doc.expiry_date && (
                              <div className="flex items-center space-x-2 text-orange-400/80">
                                <Calendar className="w-4 h-4" />
                                <span>Exp: {format(new Date(doc.expiry_date), 'MMM d, yy')}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-3">
                            <Link 
                              to={`/verify/${doc.id}`}
                              className="flex-1 btn-secondary !bg-slate-800 hover:!bg-blue-600 text-sm py-2.5 flex items-center justify-center space-x-2 !rounded-xl transition-all"
                            >
                              <QrIcon className="w-4 h-4" />
                              <span>Verify Access</span>
                            </Link>
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2.5 btn-secondary !bg-slate-800 hover:!bg-slate-700 !rounded-xl transition-all"
                              title="Open Original"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
