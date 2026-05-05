import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { categorizeFile, type DocCategory } from '../utils/categorization';
import { 
  Upload as UploadIcon, 
  FileIcon, 
  X, 
  Loader2, 
  Calendar, 
  Camera, 
  CreditCard, 
  IdCard,
  Car,
  Globe,
  UserCheck,
  GraduationCap, 
  Award, 
  Scan,
  CheckCircle2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';

const categoryConfig: Record<string, { icon: any, color: string, field: string, placeholder: string }> = {
  'Aadhar Card': { icon: CreditCard, color: 'text-blue-400', field: 'Aadhar Number', placeholder: 'xxxx xxxx xxxx' },
  'PAN Card': { icon: IdCard, color: 'text-orange-400', field: 'PAN Number', placeholder: 'ABCDE1234F' },
  'Driving License': { icon: Car, color: 'text-green-400', field: 'DL Number', placeholder: 'SS-RR-YYYYNNNNNNN' },
  'Ration Card': { icon: ShoppingBag, color: 'text-emerald-400', field: 'Ration Card No', placeholder: 'Enter Ration Card Number' },
  'Voter ID': { icon: UserCheck, color: 'text-purple-400', field: 'Voter ID No', placeholder: 'ABC1234567' },
  'Passport': { icon: Globe, color: 'text-cyan-400', field: 'Passport Number', placeholder: 'A1234567' },
  'Marksheet': { icon: GraduationCap, color: 'text-yellow-400', field: 'Roll Number', placeholder: 'Roll No / Enrollment No' },
  'Certificate': { icon: Award, color: 'text-pink-400', field: 'Certificate ID', placeholder: 'Certificate No' },
  'Other': { icon: FileIcon, color: 'text-slate-400', field: 'Document Number', placeholder: 'ID Number (if any)' },
};

const Upload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Other' as DocCategory,
    description: '',
    expiryDate: '',
    documentNumber: ''
  });

  const selectedCategory = categoryConfig[formData.category] || categoryConfig['Other'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    let selectedFile: File | null = null;
    if (e instanceof File) {
      selectedFile = e;
    } else if (e.target.files) {
      selectedFile = e.target.files[0] || null;
    }

    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      
      const detectedCategory = categorizeFile(selectedFile.name, selectedFile.type);
      
      if (!formData.title) {
        const fileName = selectedFile.name.split('.')[0];
        setFormData(prev => ({ 
          ...prev, 
          title: fileName,
          category: detectedCategory
        }));
      } else {
        setFormData(prev => ({ ...prev, category: detectedCategory }));
      }

      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
          processOCR(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPreview(imageSrc);
      setIsCameraOpen(false);
      
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "captured-doc.jpg", { type: "image/jpeg" });
          setFile(file);
          const detectedCategory = categorizeFile(file.name, file.type);
          if (!formData.title) {
            setFormData(prev => ({ 
              ...prev, 
              title: 'Captured Document',
              category: detectedCategory
            }));
          } else {
            setFormData(prev => ({ ...prev, category: detectedCategory }));
          }
          processOCR(imageSrc);
        });
    }
  }, [webcamRef, formData.title]);

  const processOCR = async (image: string) => {
    setIsProcessing(true);
    const toastId = toast.loading('Extracting details from document...');
    try {
      const { data: { text } } = await Tesseract.recognize(image, 'eng');
      
      let foundNumber = '';
      const aadharMatch = text.match(/\d{4}\s\d{4}\s\d{4}/);
      const panMatch = text.match(/[A-Z]{5}\d{4}[A-Z]{1}/);
      
      if (aadharMatch) foundNumber = aadharMatch[0];
      else if (panMatch) foundNumber = panMatch[0];
      
      if (foundNumber) {
        setFormData(prev => ({ ...prev, documentNumber: foundNumber }));
        toast.success('Details fetched automatically!', { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Could not extract details automatically', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            category: formData.category,
            description: formData.description,
            document_number: formData.documentNumber,
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
    <div className="max-w-5xl mx-auto pt-8 pb-16 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 ring-1 ring-blue-500/20">
              <UploadIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Add New Document
              </h1>
              <p className="text-slate-400">Securely digitize and manage your official documents.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload & Preview */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card !p-2 overflow-hidden">
              <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-slate-950 group">
                <AnimatePresence mode="wait">
                  {isCameraOpen ? (
                    <motion.div 
                      key="camera"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10"
                    >
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        videoConstraints={{ facingMode: "environment" }}
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 px-4">
                        <button 
                          type="button"
                          onClick={() => setIsCameraOpen(false)}
                          className="btn-secondary !rounded-full p-3 shadow-lg"
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <button 
                          type="button"
                          onClick={capture}
                          className="bg-white hover:bg-slate-200 text-slate-950 p-4 rounded-full shadow-lg transition-transform active:scale-90"
                        >
                          <Camera className="w-8 h-8" />
                        </button>
                      </div>
                    </motion.div>
                  ) : preview ? (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0"
                    >
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <button 
                          type="button"
                          onClick={() => { setFile(null); setPreview(null); }}
                          className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-all transform hover:scale-110"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsCameraOpen(true)}
                          className="p-3 bg-blue-500/80 hover:bg-blue-500 rounded-full text-white transition-all transform hover:scale-110"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                      {isProcessing && (
                        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                          <Scan className="w-12 h-12 animate-pulse mb-2" />
                          <span className="text-sm font-medium">Scanning for details...</span>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="upload-options"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 p-4 flex flex-col space-y-4"
                    >
                      <label className="flex-1 flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl group">
                        <div className="p-4 rounded-full bg-slate-950 mb-3 group-hover:scale-110 transition-transform">
                          <UploadIcon className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-200">Upload Document</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">PDF, JPG, PNG (Max 5MB)</p>
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                      </label>

                      <div className="flex items-center space-x-4">
                        <div className="h-px flex-1 bg-slate-800" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">OR</span>
                        <div className="h-px flex-1 bg-slate-800" />
                      </div>

                      <button 
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="py-6 flex flex-col items-center justify-center bg-blue-600/5 hover:bg-blue-600/10 transition-all border border-blue-500/20 hover:border-blue-500/40 rounded-2xl group"
                      >
                        <Camera className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold text-blue-400">Scan via Camera</p>
                        <p className="text-[10px] text-blue-500/50 mt-1 uppercase tracking-widest">Instant Auto-fill</p>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {preview && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-xs text-slate-400">
                  <p className="text-blue-400 font-semibold mb-1">Image Loaded</p>
                  <p>Our system has scanned the document. Please verify the auto-filled details below.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Form Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-300 flex items-center space-x-2">
                  <span>1. Select Document Category</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                  {Object.keys(categoryConfig).map(catName => {
                    const cat = categoryConfig[catName];
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: catName as DocCategory })}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center space-y-3 relative group ${
                          formData.category === catName 
                          ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/50' 
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <cat.icon className={`w-6 h-6 ${formData.category === catName ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                        <span className={`text-[10px] font-bold text-center uppercase tracking-wider ${formData.category === catName ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>
                          {catName}
                        </span>
                        {formData.category === catName && (
                          <div className="absolute top-2 right-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Document Title</label>
                  <div className="relative">
                    <FileIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. My Aadhar Card"
                      className="input-field w-full pl-11"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                    <span>{selectedCategory.field}</span>
                    {formData.documentNumber && (
                      <span className="text-[10px] text-emerald-500 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Auto-fetched</span>
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <selectedCategory.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder={selectedCategory.placeholder}
                      className={`input-field w-full pl-11 ${formData.documentNumber ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Expiry Date (If applicable)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="date"
                      className="input-field w-full pl-11"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Additional Notes</label>
                  <input
                    type="text"
                    placeholder="Optional description..."
                    className="input-field w-full"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !file}
                  className={`btn-primary w-full py-4 flex items-center justify-center space-x-3 !rounded-2xl transition-all ${(!file || loading) ? 'opacity-50 cursor-not-allowed grayscale' : 'shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)]'}`}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <UploadIcon className="w-6 h-6" />
                      <span className="text-lg">Finalize & Upload</span>
                    </>
                  )}
                </button>
                {!file && (
                  <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center space-x-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>Please upload or capture a document to continue</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Upload;
