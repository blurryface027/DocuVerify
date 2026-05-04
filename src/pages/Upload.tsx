import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload as UploadIcon, File, X, Loader2, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Upload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Other',
    description: '',
    expiryDate: ''
  });

  const categories = [
    'Aadhar Card',
    'PAN Card',
    'Driving License',
    'Voter ID',
    'Passport',
    'Marksheet',
    'Certificate',
    'Other'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      
      // Auto-set title if empty
      if (!formData.title) {
        const fileName = selectedFile.name.split('.')[0];
        setFormData(prev => ({ ...prev, title: fileName }));
      }

      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setLoading(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 3. Save metadata to DB
      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            category: formData.category,
            description: formData.description,
            file_url: publicUrl,
            file_path: filePath,
            expiry_date: formData.expiryDate || null
          }
        ]);

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card space-y-8"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
            <UploadIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Upload Document</h1>
            <p className="text-slate-400">Securely store and share your file.</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">File (Image or PDF, max 5MB)</label>
            {!file ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon className="w-10 h-10 text-slate-500 mb-3" />
                  <p className="text-sm text-slate-400">Click to upload or drag and drop</p>
                </div>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} required />
              </label>
            ) : (
              <div className="relative group">
                <div className="flex items-center p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <File className="w-8 h-8 text-blue-400 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {preview && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-700 max-h-48">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Document Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center space-y-2 ${
                        formData.category === cat 
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-center">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Graduation Certificate"
                  className="input-field w-full"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <textarea
                placeholder="Optional description..."
                className="input-field w-full h-24 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Expiry Date (Optional)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  className="input-field w-full pl-10"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="btn-primary w-full py-4 flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Upload Document</span>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Upload;
