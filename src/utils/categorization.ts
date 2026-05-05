export type DocCategory = 
  | 'Aadhar Card' 
  | 'PAN Card' 
  | 'Driving License' 
  | 'Ration Card' 
  | 'Voter ID' 
  | 'Passport' 
  | 'Marksheet' 
  | 'Certificate' 
  | 'Other';

export const categorizeFile = (fileName: string, _mimeType: string): DocCategory => {
  const name = fileName.toLowerCase();
  
  if (name.includes('aadhar')) return 'Aadhar Card';
  if (name.includes('pan')) return 'PAN Card';
  if (name.includes('dl') || name.includes('driving') || name.includes('license')) return 'Driving License';
  if (name.includes('ration')) return 'Ration Card';
  if (name.includes('voter')) return 'Voter ID';
  if (name.includes('passport')) return 'Passport';
  if (name.includes('marksheet') || name.includes('result') || name.includes('scorecard')) return 'Marksheet';
  if (name.includes('certificate')) return 'Certificate';
  
  return 'Other';
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Aadhar Card': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'PAN Card': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'Driving License': return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'Ration Card': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'Voter ID': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'Passport': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    case 'Marksheet': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'Certificate': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};
