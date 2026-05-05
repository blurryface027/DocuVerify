export type DocCategory = 'Government ID' | 'Academic' | 'Certificate' | 'Screenshot' | 'Other';

export const categorizeFile = (fileName: string, mimeType: string): DocCategory => {
  const name = fileName.toLowerCase();
  
  // Government ID
  if (
    name.includes('aadhar') || 
    name.includes('pan') || 
    name.includes('gov') || 
    name.includes('passport') || 
    name.includes('voter') || 
    name.includes('license')
  ) {
    return 'Government ID';
  }
  
  // Academic
  if (
    name.includes('result') || 
    name.includes('marksheet') || 
    name.includes('degree') || 
    name.includes('diploma') || 
    name.includes('school') || 
    name.includes('college')
  ) {
    return 'Academic';
  }
  
  // Certificate
  if (
    name.includes('certificate') || 
    name.includes('award') || 
    name.includes('achievement')
  ) {
    return 'Certificate';
  }
  
  // Screenshot / Image
  if (mimeType.startsWith('image/') && !mimeType.includes('pdf')) {
    // If it's a generic image name like IMG_... or Screenshot...
    if (name.includes('screenshot') || name.startsWith('img_') || name.startsWith('pasted')) {
      return 'Screenshot';
    }
    // For images, if they didn't match the above, we still check if they are generic
    return 'Screenshot';
  }
  
  return 'Other';
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Government ID': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'Academic': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'Certificate': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'Screenshot': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};
