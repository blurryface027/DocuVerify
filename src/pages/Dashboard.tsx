import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Document, DocumentGroup } from '../lib/supabase';
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
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  'Government ID': CreditCard,
  'Academic': GraduationCap,
  'Screenshot': Eye,
};

const categoryColors: Record<string, string> = {
  'Aadhar Card': 'text-blue-400 bg-blue-500/10',
  'PAN Card': 'text-orange-400 bg-orange-500/10',
  'Driving License': 'text-green-400 bg-green-500/10',
  'Voter ID': 'text-purple-400 bg-purple-500/10',
  'Passport': 'text-cyan-400 bg-cyan-500/10',
  'Marksheet': 'text-yellow-400 bg-yellow-500/10',
  'Certificate': 'text-emerald-400 bg-emerald-500/10',
  'Government ID': 'text-blue-400 bg-blue-500/10',
  'Academic': 'text-yellow-400 bg-yellow-500/10',
  'Screenshot': 'text-purple-400 bg-purple-500/10',
  'Other': 'text-slate-400 bg-slate-500/10',
};

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<(DocumentGroup & { document_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, scans: 0 });
  const [activeTab, setActiveTab] = useState<'individual' | 'bundles'>('individual');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Individual Documents (not in groups)
      let docQuery = supabase
        .from('documents')
        .select('*, profiles(name)')
        .is('group_id', null)
        .order('created_at', { ascending: false });

      if (profile?.role !== 'admin') {
        docQuery = docQuery.eq('user_id', user?.id);
      }

      const { data: docs, error: docError } = await docQuery;
      if (docError) throw docError;
      setDocuments(docs || []);

      // 2. Fetch Groups
      let groupQuery = supabase
        .from('document_groups')
        .select('*, documents(id)')
        .order('created_at', { ascending: false });

      if (profile?.role !== 'admin') {
        groupQuery = groupQuery.eq('user_id', user?.id);
      }

      const { data: groupData, error: groupError } = await groupQuery;
      if (groupError) throw groupError;
      
      const formattedGroups = (groupData || []).map(g => ({
        ...g,
        document_count: (g.documents as any[]).length
      }));
      setGroups(formattedGroups);
      
      setStats({
        total: (docs?.length || 0) + (groupData?.reduce((acc, g) => acc + (g.documents as any[]).length, 0) || 0),
        scans: 0
      });
    } catch (error: any) {
      console.error('Fetch error:', error);
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
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bundle? All documents inside will be removed.')) return;
    
    try {
      // 1. Get documents to delete files from storage
      const { data: docs } = await supabase.from('documents').select('file_path').eq('group_id', id);
      if (docs && docs.length > 0) {
        await supabase.storage.from('documents').remove(docs.map(d => d.file_path));
      }

      // 2. Delete group (documents will be deleted if ON DELETE CASCADE is set, 
      // but we'll do it manually just in case)
      await supabase.from('documents').delete().eq('group_id', id);
      const { error } = await supabase.from('document_groups').delete().eq('id', id);

      if (error) throw error;
      toast.success('Bundle deleted successfully');
      fetchData();
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
        <div className="flex items-center gap-3">
          <Link to="/bulk-upload" className="btn-secondary !bg-indigo-600/10 hover:!bg-indigo-600/20 !text-indigo-400 !border-indigo-500/20 flex items-center space-x-2 !px-6 !py-3 !rounded-xl">
            <Layers className="w-5 h-5" />
            <span>Bulk Upload</span>
          </Link>
          <Link to="/upload" className="btn-primary flex items-center space-x-2 !px-6 !py-3 !rounded-xl shadow-lg shadow-blue-600/20">
            <Plus className="w-5 h-5" />
            <span>Add Single</span>
          </Link>
        </div>
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
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Active Bundles</p>
              <p className="text-4xl font-bold mt-2">{groups.length}</p>
            </div>
            <div className="bg-indigo-500/20 p-4 rounded-2xl text-indigo-400">
              <Layers className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Selector */}
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-2xl w-fit border border-slate-800">
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'individual' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Single Documents
        </button>
        <button
          onClick={() => setActiveTab('bundles')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'bundles' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Verified Bundles
        </button>
      </div>

      {/* Content List */}
      <div className="space-y-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-64 animate-pulse bg-slate-900/50 rounded-2xl" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'individual' ? (
              <motion.div 
                key="individual"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                {documents.length === 0 ? (
                  <div className="text-center py-24 card border-dashed border-slate-800 bg-slate-900/20">
                    <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500">No individual documents found.</p>
                  </div>
                ) : (
                  <div className="space-y-16">
                    {Object.entries(
                      documents.reduce((acc, doc) => {
                        const category = doc.category || 'Other';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(doc);
                        return acc;
                      }, {} as Record<string, Document[]>)
                    ).map(([category, docs]) => (
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
                          {docs.map((doc) => {
                            const Icon = categoryIcons[category] || FileText;
                            return (
                              <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card flex flex-col justify-between group !p-0 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all border-slate-800/50"
                              >
                                <div className="p-6 space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div className={`p-3 rounded-2xl ${categoryColors[category] || categoryColors['Other']}`}>
                                      <Icon className="w-6 h-6" />
                                    </div>
                                    <button 
                                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold truncate group-hover:text-blue-400 transition-colors">{doc.title}</h3>
                                    <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">{doc.description || 'No description provided.'}</p>
                                  </div>
                                </div>
                                <div className="bg-slate-950/50 p-6 border-t border-slate-800 space-y-4">
                                  <div className="flex items-center justify-between text-xs font-medium">
                                    <div className="flex items-center space-x-2 text-slate-500">
                                      <Calendar className="w-4 h-4" />
                                      <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-3">
                                    <Link to={`/verify/${doc.id}`} className="flex-1 btn-secondary !bg-slate-800 hover:!bg-blue-600 text-sm py-2.5 flex items-center justify-center space-x-2 !rounded-xl transition-all">
                                      <QrIcon className="w-4 h-4" />
                                      <span>Verify</span>
                                    </Link>
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2.5 btn-secondary !bg-slate-800 hover:!bg-slate-700 !rounded-xl transition-all">
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
              </motion.div>
            ) : (
              <motion.div 
                key="bundles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {groups.length === 0 ? (
                  <div className="col-span-full text-center py-24 card border-dashed border-slate-800 bg-slate-900/20">
                    <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500">No verified bundles found.</p>
                  </div>
                ) : (
                  groups.map((group, idx) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="card flex flex-col justify-between group !p-0 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all border-indigo-500/20 border-l-4 border-l-indigo-500"
                    >
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="bg-indigo-500/10 p-4 rounded-2xl text-indigo-400">
                            <Layers className="w-8 h-8" />
                          </div>
                          <button 
                            onClick={() => deleteGroup(group.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold truncate group-hover:text-indigo-400 transition-colors">{group.group_name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                              {group.document_count} Documents
                            </span>
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Verified Bundle</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>Created {format(new Date(group.created_at), 'MMM d')}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </div>

                      <div className="bg-slate-950/50 p-6 border-t border-slate-800">
                        <div className="flex gap-3">
                          <Link to={`/verify/group/${group.id}`} className="flex-1 btn-primary !bg-indigo-600 hover:!bg-indigo-700 text-sm py-3 flex items-center justify-center space-x-2 !rounded-xl shadow-lg shadow-indigo-600/20 transition-all">
                            <QrIcon className="w-5 h-5" />
                            <span>Bundle QR</span>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
