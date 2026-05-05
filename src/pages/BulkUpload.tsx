import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { categorizeFile, getCategoryColor, type DocCategory } from '../utils/categorization';
import { 
  Upload as UploadIcon, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  Layers,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkFile {
  id: string;
  file: File;
  title: string;
  category: DocCategory;
  description: string;
  preview: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
}

const BulkUpload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<BulkFile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > 10) {
      toast.error('Maximum 10 files allowed per batch');
      return;
    }

    const newFiles: BulkFile[] = acceptedFiles.map(file => {
      const category = categorizeFile(file.name, file.type);
      return {
        id: Math.random().toString(36).substring(7),
        file,
        title: file.name.split('.')[0],
        category,
        description: '',
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 10 - files.length
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileData = (id: string, data: Partial<BulkFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  };

  const handleBulkUpload = async () => {
    if (!user || files.length === 0) return;
    if (!groupName.trim()) {
      toast.error('Please provide a name for this document group');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Create Document Group
      const { data: group, error: groupError } = await supabase
        .from('document_groups')
        .insert([{ 
          user_id: user.id, 
          group_name: groupName 
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Upload Files sequentially
      for (const bulkFile of files) {
        updateFileData(bulkFile.id, { status: 'uploading' });

        const fileExt = bulkFile.file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, bulkFile.file);

        if (uploadError) throw uploadError;

        // Get URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Save to DB
        const { error: dbError } = await supabase
          .from('documents')
          .insert([{
            user_id: user.id,
            group_id: group.id,
            title: bulkFile.title,
            category: bulkFile.category,
            description: bulkFile.description,
            file_url: publicUrl,
            file_path: filePath
          }]);

        if (dbError) throw dbError;
        updateFileData(bulkFile.id, { status: 'completed', progress: 100 });
      }

      toast.success('Batch upload completed!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-8 pb-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-500 ring-1 ring-indigo-500/20">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Bulk Document Upload
              </h1>
              <p className="text-slate-400">Upload up to 10 files in a single verified bundle.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Dropzone & Group Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Bundle Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Identity Documents"
                  className="input-field w-full"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div 
                {...getRootProps()} 
                className={`aspect-square relative rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
                  isDragActive 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                } ${files.length >= 10 || isUploading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="p-4 rounded-full bg-slate-900 mb-4">
                  <UploadIcon className={`w-8 h-8 ${isDragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <p className="text-sm font-bold text-slate-200">
                  {isDragActive ? 'Drop files here' : 'Click or Drag & Drop'}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Images or PDFs (Max 10 files)
                </p>
                <div className="mt-6 px-4 py-1 rounded-full bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-800">
                  {files.length} / 10 Files
                </div>
              </div>

              <button
                onClick={handleBulkUpload}
                disabled={files.length === 0 || isUploading || !groupName}
                className={`btn-primary w-full py-4 flex items-center justify-center space-x-3 !rounded-2xl transition-all ${
                  (files.length === 0 || isUploading || !groupName) 
                  ? 'opacity-50 cursor-not-allowed grayscale' 
                  : 'shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)]'
                }`}
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-lg">Create Verified Bundle</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: File List & Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Files in this batch</h2>
              {files.length > 0 && (
                <button 
                  onClick={() => setFiles([])}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {files.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card py-20 text-center border-dashed border-slate-800 bg-slate-900/10"
                  >
                    <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500">No files selected yet.</p>
                  </motion.div>
                ) : (
                  files.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                      className="card !p-4 group hover:border-indigo-500/50 transition-all bg-slate-900/50"
                    >
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                          {f.file.type === 'application/pdf' ? (
                            <div className="w-full h-full flex items-center justify-center bg-red-500/10 text-red-400">
                              <FileText className="w-8 h-8" />
                            </div>
                          ) : (
                            <img src={f.preview} alt="Preview" className="w-full h-full object-cover" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <input
                                type="text"
                                value={f.title}
                                onChange={(e) => updateFileData(f.id, { title: e.target.value })}
                                className="bg-transparent border-none p-0 text-lg font-bold text-white focus:ring-0 w-full truncate placeholder:text-slate-600"
                                placeholder="Document Title"
                              />
                            </div>
                            <button 
                              onClick={() => removeFile(f.id)}
                              className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 items-center">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getCategoryColor(f.category)}`}>
                              {f.category}
                            </div>
                            
                            <select 
                              value={f.category}
                              onChange={(e) => updateFileData(f.id, { category: e.target.value as DocCategory })}
                              className="bg-slate-800 border border-slate-700 rounded-lg text-[10px] px-2 py-0.5 text-slate-300 focus:outline-none"
                            >
                              <option value="Government ID">Government ID</option>
                              <option value="Academic">Academic</option>
                              <option value="Certificate">Certificate</option>
                              <option value="Screenshot">Screenshot</option>
                              <option value="Other">Other</option>
                            </select>

                            <div className="flex-1" />
                            
                            <p className="text-[10px] text-slate-500 font-mono">
                              {(f.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <textarea
                            placeholder="Optional description..."
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500/50 resize-none h-12"
                            value={f.description}
                            onChange={(e) => updateFileData(f.id, { description: e.target.value })}
                          />

                          {f.status === 'uploading' && (
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1.5 }}
                                className="h-full bg-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkUpload;
