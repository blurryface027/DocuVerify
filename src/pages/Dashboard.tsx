import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Document } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Plus, Eye, Calendar, QrCode as QrIcon, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, scans: 0 });

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('documents')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });

      // If not admin, filter by user_id
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
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      if (storageError) throw storageError;

      // 2. Delete from DB
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.name || 'User'}!</h1>
          <p className="text-slate-400">Manage your documents and verification codes.</p>
        </div>
        <Link to="/upload" className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Upload New Document</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Documents</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="card bg-indigo-500/5 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Scans</p>
              <p className="text-3xl font-bold mt-1">{stats.scans}</p>
            </div>
            <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-500">
              <Eye className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Documents</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-48 animate-pulse bg-slate-900/50" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 card border-dashed border-slate-700">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No documents found. Start by uploading one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold truncate">{doc.title}</h3>
                  {profile?.role === 'admin' && (
                    <p className="text-xs text-blue-400 font-medium mb-1">Owner: {doc.profiles?.name || 'Unknown'}</p>
                  )}
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{doc.description}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                  <div className="flex items-center text-xs text-slate-500 space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      to={`/verify/${doc.id}`}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center space-x-2"
                    >
                      <QrIcon className="w-4 h-4" />
                      <span>View QR</span>
                    </Link>
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 btn-secondary"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
