import confetti from 'canvas-confetti';

export const toEnglishDigits = (str) => {
  if (str === null || str === undefined) return '';
  return str.toString()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
};

export const sanitizeObjectToEnglishDigits = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return toEnglishDigits(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectToEnglishDigits(item));
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date || obj instanceof RegExp || (obj.constructor && obj.constructor.name !== 'Object')) {
      return obj;
    }
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitizeObjectToEnglishDigits(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

export const formatCurrency = (amount, currency = 'ريال') => {
  if (amount === undefined || amount === null || amount === '') return 'السعر غير محدد';
  const formatted = new Intl.NumberFormat('ar-SA-u-nu-latn').format(amount);
  return `${formatted} ريال`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return toEnglishDigits(dateString);
  }
};

export const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Simple cheerful arpeggio sound effect
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + index * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (err) {
    // Audio playback not supported or user gesture needed — fail silently
  }
};

export const triggerCelebration = () => {
  // Sound
  playSuccessSound();

  // Burst 1: Main colorful explosion
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
  });

  // Burst 2: Side stars after 150ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#3b82f6', '#10b981', '#f59e0b']
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#8b5cf6', '#ec4899', '#f59e0b']
    });
  }, 150);
};

export const formatBookingNumber = (bookingNumber) => {
  if (!bookingNumber) return '';
  const match = bookingNumber.toString().match(/\d+$/);
  if (match) {
    return parseInt(match[0], 10).toString();
  }
  const digitsOnly = bookingNumber.toString().replace(/[^0-9]/g, '');
  if (digitsOnly) {
    return parseInt(digitsOnly, 10).toString();
  }
  return bookingNumber.toString();
};

export const formatTime12h = (time24) => {
  if (!time24) return '';
  const timeStr = String(time24);
  if (timeStr === 'صباحًا' || timeStr === 'مساءً') return timeStr;
  if (timeStr.includes('ص') || timeStr.includes('م') || timeStr.includes('AM') || timeStr.includes('PM')) {
    let result = timeStr;
    if (result.includes('AM')) result = result.replace('AM', 'ص');
    if (result.includes('PM')) result = result.replace('PM', 'م');
    return result;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = String(parts[1]).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

export const parseTime12hTo24h = (hourOrString, minutes, ampm) => {
  if (!hourOrString) return '12:00';
  
  // If called with multiple arguments (e.g. hour, minutes, ampm)
  if (minutes !== undefined && ampm !== undefined) {
    let hour = parseInt(hourOrString, 10);
    const min = String(minutes).padStart(2, '0');
    const isPM = ampm === 'م' || ampm === 'PM' || String(ampm).includes('مساء');
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${min}`;
  }
  
  // If called with a single string (e.g. "4:00 م" or "16:00" or "12:00 صباحًا")
  const timeStr = String(hourOrString).trim();
  
  // If it's already purely 24h e.g. "14:30" or "09:00"
  if (!timeStr.includes('ص') && !timeStr.includes('م') && !timeStr.includes('AM') && !timeStr.includes('PM') && !timeStr.includes('صباح') && !timeStr.includes('مساء')) {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return `${String(isNaN(h) ? 0 : h).padStart(2, '0')}:${String(isNaN(m) ? 0 : m).padStart(2, '0')}`;
    }
    return timeStr;
  }

  // Extract digits for hours and minutes cleanly using regex
  const match = timeStr.match(/(\d+)(?::(\d+))?/);
  if (!match) return '12:00';

  let hours = parseInt(match[1], 10);
  const mins = match[2] ? match[2].padStart(2, '0') : '00';
  
  // In Arabic: "مساءً" or "م" or "PM" means PM. "صباحًا" or "ص" or "AM" means AM.
  const isPM = timeStr.includes('مساء') || timeStr.includes('PM') || (timeStr.includes('م') && !timeStr.includes('صباح'));
  
  if (isPM && hours < 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${mins}`;
};

export const parse24hToParts = (time24) => {
  if (!time24) return { hours: '12', minutes: '00', ampm: 'ص' };
  const timeStr = String(time24).trim();
  
  const is12hFormat = timeStr.includes('ص') || timeStr.includes('م') || timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('صباح') || timeStr.includes('مساء');
  
  if (is12hFormat) {
    const match = timeStr.match(/(\d+)(?::(\d+))?/);
    if (!match) return { hours: '12', minutes: '00', ampm: 'ص' };
    const rawHours = parseInt(match[1], 10);
    const mins = match[2] ? match[2].padStart(2, '0') : '00';
    const isPM = timeStr.includes('مساء') || timeStr.includes('PM') || (timeStr.includes('م') && !timeStr.includes('صباح'));
    let hours = rawHours % 12;
    hours = hours ? hours : 12;
    return {
      hours: String(hours),
      minutes: mins,
      ampm: isPM ? 'م' : 'ص'
    };
  }
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return { hours: '12', minutes: '00', ampm: 'ص' };
  let rawHours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const isPM = rawHours >= 12;
  let hours = rawHours % 12;
  hours = hours ? hours : 12;
  return {
    hours: String(hours),
    minutes: String(isNaN(minutes) ? 0 : minutes).padStart(2, '0'),
    ampm: isPM ? 'م' : 'ص'
  };
};

export const formatDateTime12h = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  try {
    const date = new Date(dateTimeStr);
    const formattedDate = date.toISOString().substring(0, 10);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHour = hours % 12 || 12;
    return `${formattedDate} ${displayHour}:${minutes} ${ampm}`;
  } catch (e) {
    return dateTimeStr;
  }
};

export const getPeriodFromTime = (startTime) => {
  if (startTime === 'صباحًا' || startTime === 'مساءً') return startTime;
  if (!startTime) return 'صباحًا';
  const parts = startTime.split(':');
  if (parts.length < 2) return 'صباحًا';
  const hour = parseInt(parts[0], 10);
  return hour < 12 ? 'صباحًا' : 'مساءً';
};

export const generateAttendanceTimeOptions = () => [
  '7:00 صباحًا',
  '8:00 صباحًا',
  '9:00 صباحًا',
  '10:00 صباحًا',
  '11:00 صباحًا',
  '12:00 مساءً',
  '1:00 مساءً',
  '2:00 مساءً',
  '3:00 مساءً',
  '4:00 مساءً',
  '5:00 مساءً',
  '6:00 مساءً',
  '7:00 مساءً',
  '8:00 مساءً',
  '9:00 مساءً',
  '10:00 مساءً',
  '11:00 مساءً',
  '12:00 صباحًا'
];

export const getSessionId = () => {
  if (typeof window === 'undefined') return 'sess_server';
  try {
    let sessId = sessionStorage.getItem('star_media_session_id');
    if (!sessId) {
      sessId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('star_media_session_id', sessId);
    }
    return sessId;
  } catch (e) {
    return 'sess_fallback';
  }
};

export const getDeviceId = () => {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let devId = localStorage.getItem('star_media_device_id');
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('star_media_device_id', devId);
    }
    return devId;
  } catch (e) {
    return 'dev_default_session';
  }
};

export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      id: 'server_env',
      deviceName: 'خادم النظام',
      os: 'Server OS',
      browser: 'Node.js',
      type: 'كمبيوتر',
      userAgent: 'Node.js Server'
    };
  }

  const ua = navigator.userAgent || '';

  // 1. Device Type & Friendly Name
  let type = 'كمبيوتر';
  let deviceName = 'Windows PC';

  if (/iPhone/i.test(ua)) {
    type = 'هاتف';
    deviceName = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    type = 'جهاز لوحي';
    deviceName = 'iPad';
  } else if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua)) {
      type = 'هاتف';
      deviceName = 'هاتف Android';
    } else {
      type = 'جهاز لوحي';
      deviceName = 'جهاز لوحي Android';
    }
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    type = 'كمبيوتر';
    deviceName = 'MacBook';
  } else if (/Windows/i.test(ua)) {
    type = 'كمبيوتر';
    deviceName = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    type = 'كمبيوتر';
    deviceName = 'Linux PC';
  }

  // 2. OS Detection
  let os = 'Windows 11';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/iPhone OS\s([0-9_]+)/i.test(ua)) {
    const v = ua.match(/iPhone OS\s([0-9_]+)/i);
    os = v ? `iOS ${v[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/iPad.*OS\s([0-9_]+)/i.test(ua)) {
    const v = ua.match(/OS\s([0-9_]+)/i);
    os = v ? `iPadOS ${v[1].replace(/_/g, '.')}` : 'iPadOS';
  } else if (/Mac OS X\s([0-9_]+)/i.test(ua)) {
    const v = ua.match(/Mac OS X\s([0-9_]+)/i);
    os = v ? `macOS ${v[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/Android\s([0-9\.]+)/i.test(ua)) {
    const v = ua.match(/Android\s([0-9\.]+)/i);
    os = v ? `Android ${v[1]}` : 'Android';
  } else if (/Linux/i.test(ua)) os = 'Linux';

  // 3. Browser Detection
  let browser = 'Chrome';
  if (/Edg\/([0-9\.]+)/i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome\/([0-9\.]+)/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox\/([0-9\.]+)/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari\/([0-9\.]+)/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/OPR\/([0-9\.]+)/i.test(ua)) {
    browser = 'Opera';
  }

  return {
    id: getDeviceId(),
    sessionId: getSessionId(),
    deviceName,
    os,
    browser,
    type,
    screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
    language: navigator.language || 'ar-SA',
    userAgent: ua
  };
};

export const formatArabicDateTime = (dateInput) => {
  if (!dateInput) return 'غير محدد';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year}، ${hours}:${minutes} ${ampm}`;
};

export const formatArabicRelativeTime = (dateInput) => {
  if (!dateInput) return 'الآن';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'الآن';

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return 'الآن';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 2) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return 'منذ ساعة';
  if (diffHours === 2) return 'منذ ساعتين';
  if (diffHours < 24) return `منذ ${diffHours} ساعات`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'منذ يوم';
  if (diffDays === 2) return 'منذ يومين';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;

  return formatArabicDateTime(dateInput);
};

