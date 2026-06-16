export const MEDICAL_CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '🏥' },
  { id: 'طب عام', label: 'طب عام', icon: '🩺' },
  { id: 'طب أسرة', label: 'طب أسرة', icon: '👨‍👩‍👧' },
  { id: 'أطفال', label: 'أطفال', icon: '👶' },
  { id: 'أسنان', label: 'أسنان', icon: '🦷' },
  { id: 'جلدية', label: 'جلدية', icon: '✨' },
  { id: 'عيون', label: 'عيون', icon: '👁️' },
  { id: 'أنف وأذن وحنجرة', label: 'أنف وأذن وحنجرة', icon: '👂' },
  { id: 'نسائية وتوليد', label: 'نسائية وتوليد', icon: '🤰' },
  { id: 'عظام', label: 'عظام', icon: '🦴' },
  { id: 'قلب', label: 'قلب', icon: '❤️' },
  { id: 'باطنية', label: 'باطنية', icon: '🫀' },
  { id: 'مسالك بولية', label: 'مسالك بولية', icon: '💧' },
  { id: 'نفسية', label: 'نفسية', icon: '🧠' },
  { id: 'أعصاب', label: 'أعصاب', icon: '🧬' },
  { id: 'تغذية', label: 'تغذية', icon: '🥗' },
  { id: 'علاج طبيعي', label: 'علاج طبيعي', icon: '🏃' },
];

export const getCategoryLabel = (id) =>
  MEDICAL_CATEGORIES.find((c) => c.id === id)?.label || id;
