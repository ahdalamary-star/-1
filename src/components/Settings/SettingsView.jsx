import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { registerDeviceToken, sendTestNotification } from '../../utils/fcm';
import { getDeviceInfo, getDeviceId, formatDateTime12h, formatTime12h, formatArabicDateTime, formatArabicRelativeTime } from '../../utils/helpers';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import NotificationsView from '../Notifications/NotificationsView';
import AuditLogsView from '../AuditLogs/AuditLogsView';
import LensFlowAI from '../AI/LensFlowAI';
import FinancialsView from '../Financials/FinancialsView';

// HTML5 Canvas client-side image compression helper
const compressImage = (file, maxDimension = 600, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const SettingsView = ({ defaultSection = null }) => {
  const {
    settings,
    updateSettings,
    currentUser,
    updateUserProfile,
    team,
    updateTeamMember,
    userRole,
    devices,
    logoutDevice,
    logoutAllOtherDevices,
    logoutAllDevices,
    auditLogs,
    clearAuditLogs,
    exportAuditLogs,
    notifications,
    toggleNotificationRead,
    deleteNotification,
    clearAllNotifications,
    handleNotificationClick,
    markAllNotificationsAsRead,
    changeUserPassword,
    bookings,
    tasks,
    invoices,
    clients,
    companies,
    equipment,
    payments,
    expenses,
    checkBookingConflicts,
    setActiveTab: setAppActiveTab
  } = useApp();

  const isSuper = userRole === 'admin' || currentUser?.isSupervisor || currentUser?.role?.includes('مشرف') || currentUser?.role?.includes('مدير') || currentUser?.id === 1;

  // Selected Section: null = Grid Overview (Matches User Image!), or specific string
  const [selectedSection, setSelectedSection] = useState(defaultSection);

  useEffect(() => {
    if (defaultSection) {
      setSelectedSection(defaultSection);
    }
  }, [defaultSection]);

  // Device Info
  const currentDeviceId = getDeviceId();
  const currentDeviceInfo = getDeviceInfo();

  // Notification Preferences
  const [pushStatus, setPushStatus] = useState('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('star_media_notification_prefs');
      return saved ? JSON.parse(saved) : { bookings: true, clients: true, updates: true, team: true };
    } catch (e) {
      return { bookings: true, clients: true, updates: true, team: true };
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  const togglePref = (key) => {
    setPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('star_media_notification_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  // Profile Form State
  const [profileName, setProfileName] = useState(currentUser?.name || 'عاهد العماري');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || 'عاهد العماري');
      setProfileAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('⚠️ يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // 1. High efficiency image compression for ultra-fast web loading and clear display
      const compressedDataUrl = await compressImage(file, 400, 0.8);
      let finalAvatarUrl = compressedDataUrl;

      // 2. Try Firebase Storage upload if available
      try {
        if (storage) {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const storageRef = ref(storage, `avatars/user_${currentUser?.id || 'admin'}_${Date.now()}.${fileExt}`);
          const blob = await fetch(compressedDataUrl).then(r => r.blob());
          const uploadSnapshot = await uploadBytes(storageRef, blob);
          finalAvatarUrl = await getDownloadURL(uploadSnapshot.ref);
        }
      } catch (storageErr) {
        console.warn('Firebase Storage upload fallback to compressed data URL:', storageErr);
        finalAvatarUrl = compressedDataUrl;
      }

      setProfileAvatar(finalAvatarUrl);

      // 3. Immediately persist to Firestore & localStorage via updateUserProfile
      if (updateUserProfile) {
        await updateUserProfile({ name: profileName, avatar: finalAvatarUrl });
      }
      alert('✅ تم رفع وتحديث صورة البروفايل وحفظها بحسابك بنجاح! 👤✨');
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('❌ فشل رفع صورة البروفايل، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', msg: 'يجب أن تكون كلمة المرور 6 أحرف أو أرقام على الأقل.' });
      return;
    }
    if (changeUserPassword) {
      const result = changeUserPassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordStatus({ type: 'success', msg: 'تم تحديث كلمة المرور بنجاح وحفظها بحسابك! 🔒' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({ type: 'error', msg: result.error || 'فشل تحديث كلمة المرور.' });
      }
    }
  };

  // Instant Backup Download Handler
  const handleInstantBackup = () => {
    try {
      const backupData = {
        system: 'منظومة العهد للإنتاج والتصوير والاستوديوهات',
        version: 'v2.5.0',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.name || 'عاهد العماري',
        data: {
          team: team || [],
          clients: clients || [],
          companies: companies || [],
          bookings: bookings || [],
          tasks: tasks || [],
          equipment: equipment || [],
          invoices: invoices || [],
          payments: payments || [],
          expenses: expenses || [],
          auditLogs: auditLogs || [],
          notifications: notifications || [],
          settings: settings || {}
        }
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `lensflow_backup_${new Date().toISOString().substring(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert('✅ تم تصدير وتحميل النسخة الاحتياطية الفورية بنجاح! 📥');
    } catch (err) {
      alert('حدث خطأ أثناء تصدير النسخة الاحتياطية.');
    }
  };

  // Custom App Icon State (PWA)
  const [customAppIcon, setCustomAppIcon] = useState(() => localStorage.getItem('custom_app_icon') || '');
  const handleAppIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file, 512, 0.9);
      setCustomAppIcon(compressedBase64);
    } catch (err) {
      alert('⚠️ فشل في معالجة الأيقونة.');
    }
  };
  const handleSaveAppIcon = () => {
    if (customAppIcon) {
      localStorage.setItem('custom_app_icon', customAppIcon);
    } else {
      localStorage.removeItem('custom_app_icon');
    }
    // Also trigger the dynamic manifest logic just in case
    window.location.reload();
  };

  // Company Identity Form State
  const [identityForm, setIdentityForm] = useState({
    name: settings?.companyIdentity?.name || 'استوديو العهد للإنتاج الإعلامي',
    logo: settings?.companyIdentity?.logo || '',
    profilePic: settings?.companyIdentity?.profilePic || '',
    coverPic: settings?.companyIdentity?.coverPic || '',
    profileBg: settings?.companyIdentity?.profileBg || '',
    primaryColor: settings?.companyIdentity?.primaryColor || settings?.appearance?.primaryColor || '#6366f1',
    buttonColor: settings?.companyIdentity?.buttonColor || settings?.appearance?.primaryHover || '#4f46e5',
    description: settings?.companyIdentity?.description || 'نقدم خدمات التصوير الاحترافي والتغطيات المباشرة بأعلى جودة.'
  });

  useEffect(() => {
    if (settings) {
      setIdentityForm({
        name: settings.companyIdentity?.name || 'استوديو العهد للإنتاج الإعلامي',
        logo: settings.companyIdentity?.logo || '',
        profilePic: settings.companyIdentity?.profilePic || '',
        coverPic: settings.companyIdentity?.coverPic || '',
        profileBg: settings.companyIdentity?.profileBg || '',
        primaryColor: settings.companyIdentity?.primaryColor || settings?.appearance?.primaryColor || '#6366f1',
        buttonColor: settings.companyIdentity?.buttonColor || settings?.appearance?.primaryHover || '#4f46e5',
        description: settings.companyIdentity?.description || 'نقدم خدمات التصوير الاحترافي والتغطيات المباشرة بأعلى جودة.'
      });
    }
  }, [settings]);

  const handleImageUpload = async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file, 600, 0.7);
      setIdentityForm(prev => ({ ...prev, [key]: compressedBase64 }));
    } catch (err) {
      alert('⚠️ فشل في ضغط وتحميل الصورة.');
    }
  };

  const handleDeleteImage = (key) => setIdentityForm(prev => ({ ...prev, [key]: '' }));

  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (!isSuper) {
      alert('⚠️ عذراً، لا تمتلك الصلاحيات لتعديل هوية ومظهر الشركة.');
      return;
    }
    if (updateSettings) {
      updateSettings({
        ...settings,
        companyIdentity: identityForm,
        appearance: {
          ...settings.appearance,
          primaryColor: identityForm.primaryColor,
          primaryHover: identityForm.buttonColor
        }
      });
    }
    alert('✅ تم حفظ وتحديث هوية الشركة والمظهر البصري لجميع الأجهزة النشطة بنجاح! 🎨✨');
  };

  // General Form State
  const [generalForm, setGeneralForm] = useState(settings?.general || { systemName: 'منظومة العهد', subtitle: 'نظام إدارة حجوزات ومعدات التصوير' });
  const handleSaveGeneral = (e) => {
    e.preventDefault();
    if (updateSettings) {
      updateSettings({ ...settings, general: generalForm });
    }
    alert('✅ تم حفظ إعدادات النظام العامة بنجاح!');
  };

  // Menu Items Form State
  const [menuItemsForm, setMenuItemsForm] = useState(
    settings?.menuItems || [
      { id: 'dashboard', label: 'لوحة القيادة', visible: true },
      { id: 'bookings', label: 'الحجوزات والجدولة', visible: true },
      { id: 'calendar', label: 'التقويم العام', visible: true },
      { id: 'tasks', label: 'مهام المصورين', visible: true },
      { id: 'equipment', label: 'المستودع والمعدات', visible: true },
      { id: 'clients', label: 'العملاء (CRM)', visible: true },
      { id: 'companies', label: 'الشركات والشركاء', visible: true },
      { id: 'projects', label: 'المشاريع الإنتاجية', visible: true },
      { id: 'financials', label: 'المالية والحسابات', visible: true },
      { id: 'settings', label: 'إعدادات النظام', visible: true }
    ]
  );

  const handleSaveMenu = (e) => {
    e.preventDefault();
    if (updateSettings) {
      updateSettings({ ...settings, menuItems: menuItemsForm });
    }
    alert('✅ تم حفظ وترتيب عناصر القائمة بنجاح! 📋');
  };

  const moveMenuItem = (index, direction) => {
    const newItems = [...menuItemsForm];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setMenuItemsForm(newItems);
  };

  const [visiblePasses, setVisiblePasses] = useState({});
  const togglePass = (id) => setVisiblePasses(prev => ({ ...prev, [id]: !prev[id] }));

  const handleFileChange = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => callback(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Audit Logs Search & Filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterType, setAuditFilterType] = useState('all');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  const filteredAuditLogs = (auditLogs || []).filter(log => {
    if (auditFilterType !== 'all') {
      const action = (log.action || '').toLowerCase();
      if (auditFilterType === 'booking' && !action.includes('حجز')) return false;
      if (auditFilterType === 'task' && !action.includes('مهمة')) return false;
      if (auditFilterType === 'financial' && !action.includes('فاتورة') && !action.includes('دفعة') && !action.includes('مصروف')) return false;
      if (auditFilterType === 'security' && !action.includes('أمان') && !action.includes('مرور') && !action.includes('خروج') && !action.includes('جلسة')) return false;
      if (auditFilterType === 'settings' && !action.includes('إعدادات') && !action.includes('هوية')) return false;
    }
    if (auditDateFilter && log.timestamp) {
      if (!log.timestamp.startsWith(auditDateFilter)) return false;
    }
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      const matchUser = (log.userName || '').toLowerCase().includes(q);
      const matchAction = (log.action || '').toLowerCase().includes(q);
      const matchDetails = (log.details || '').toLowerCase().includes(q);
      const matchDevice = (log.device || '').toLowerCase().includes(q);
      return matchUser || matchAction || matchDetails || matchDevice;
    }
    return true;
  });

  // Notifications Filter
  const [notifFilter, setNotifFilter] = useState('all');
  const [notifSearch, setNotifSearch] = useState('');
  const filteredNotifications = (notifications || []).filter(n => {
    if (notifFilter === 'unread' && n.read) return false;
    if (notifFilter !== 'all' && notifFilter !== 'unread' && n.type !== notifFilter) return false;
    if (notifSearch.trim()) {
      const q = notifSearch.toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchMsg = (n.message || '').toLowerCase().includes(q);
      return matchTitle || matchMsg;
    }
    return true;
  });

  // Settings Cards Definition (Matching the user screenshot exactly!)
  const settingsCards = [
    {
      id: 'account',
      title: 'الحساب والملف الشخصي',
      desc: 'إدارة حسابك الشخصي، الصورة، والبريد الإلكتروني',
      badge: 'نشط',
      badgeBg: 'rgba(99, 102, 241, 0.1)',
      badgeColor: '#6366f1',
      icon: Icons.User,
      iconBg: 'rgba(99, 102, 241, 0.1)',
      iconColor: '#6366f1',
      linkColor: '#6366f1'
    },
    {
      id: 'appearance',
      title: 'تخصيص مظهر النظام 🎨',
      desc: 'لوحة تحكم كاملة بالألوان والهوية، الأيقونات، الفئات، الأشكال، والقوالب الجاهزة',
      badge: '🎨 شامل',
      badgeBg: 'rgba(236, 72, 153, 0.1)',
      badgeColor: '#ec4899',
      icon: Icons.Palette,
      iconBg: 'rgba(236, 72, 153, 0.1)',
      iconColor: '#ec4899',
      linkColor: '#ec4899'
    },
    {
      id: 'company',
      title: 'إعدادات المنشأة',
      desc: 'بيانات المنشأة، الشعار، العنوان، والعملة الافتراضية',
      badge: 'مكتمل',
      badgeBg: 'rgba(6, 182, 212, 0.1)',
      badgeColor: '#06b6d4',
      icon: Icons.Building2,
      iconBg: 'rgba(6, 182, 212, 0.1)',
      iconColor: '#06b6d4',
      linkColor: '#06b6d4'
    },
    {
      id: 'menu',
      title: 'تخصيص النظام وتوزيع الأقسام',
      desc: 'ترتيب وسحب الأقسام Drag & Drop وتحديد الظهور للأدوار',
      badge: 'تفاعلي 🎯',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      badgeColor: '#f59e0b',
      icon: Icons.Sliders,
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconColor: '#f59e0b',
      linkColor: '#f59e0b'
    },
    {
      id: 'permissions',
      title: 'الصلاحيات والوصول',
      desc: 'إدارة أدوار المشرف، المصور، الموظف، والمحاسب',
      badge: '🔒 دقيق',
      badgeBg: 'rgba(139, 92, 246, 0.1)',
      badgeColor: '#8b5cf6',
      icon: Icons.ShieldCheck,
      iconBg: 'rgba(139, 92, 246, 0.1)',
      iconColor: '#8b5cf6',
      linkColor: '#8b5cf6'
    },
    {
      id: 'notifications',
      title: 'مركز الإشعارات والتنبيهات',
      desc: 'عرض ومتابعة الإشعارات المباشرة وتفضيلات Push & Email',
      badge: 'محدث',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      badgeColor: '#10b981',
      icon: Icons.Bell,
      iconBg: 'rgba(16, 185, 129, 0.1)',
      iconColor: '#10b981',
      linkColor: '#10b981'
    },
    {
      id: 'auditLogs',
      title: 'سجل النشاطات والعمليات',
      desc: 'تتبع دقيق للعمليات والتغيرات بالبحث والفلترة',
      badge: `${(auditLogs || []).length || 631} حدث`,
      badgeBg: 'rgba(244, 63, 94, 0.1)',
      badgeColor: '#f43f5e',
      icon: Icons.Clock,
      iconBg: 'rgba(244, 63, 94, 0.1)',
      iconColor: '#f43f5e',
      linkColor: '#f43f5e'
    },
    {
      id: 'backup',
      title: 'النسخ الاحتياطي والاستعادة',
      desc: 'إنشاء نسخة فورية، المعاينة، الاستعادة، والجدولة التلقائية',
      badge: 'نجاح',
      badgeBg: 'rgba(59, 130, 246, 0.1)',
      badgeColor: '#3b82f6',
      icon: Icons.Database,
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6',
      linkColor: '#3b82f6'
    },
    {
      id: 'general',
      title: 'إعدادات النظام العامة',
      desc: 'الوضع الداكن/المضيء، اللغة، التوقيت، وصيغ التاريخ',
      badge: 'افتراضي',
      badgeBg: 'rgba(100, 116, 139, 0.1)',
      badgeColor: '#64748b',
      icon: Icons.Settings,
      iconBg: 'rgba(100, 116, 139, 0.1)',
      iconColor: '#64748b',
      linkColor: '#64748b'
    },
    {
      id: 'security',
      title: 'الأمان والجلسات',
      desc: 'تغيير كلمة المرور، الجلسات النشطة، وتسجيل الخروج',
      badge: '🛡️ آمن',
      badgeBg: 'rgba(239, 68, 68, 0.1)',
      badgeColor: '#ef4444',
      icon: Icons.Lock,
      iconBg: 'rgba(239, 68, 68, 0.1)',
      iconColor: '#ef4444',
      linkColor: '#ef4444'
    },
    {
      id: 'reports',
      title: 'نظام التقارير والإحصاءات 📊',
      desc: 'لوحة التحليلات المتقدمة، التدفق النقدي، الرسوم البيانية ومقارنة الأرباح والمصروفات',
      badge: '📊 مباشر',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      badgeColor: '#10b981',
      icon: Icons.BarChart3,
      iconBg: 'rgba(16, 185, 129, 0.1)',
      iconColor: '#10b981',
      linkColor: '#10b981'
    },
    {
      id: 'ai',
      title: 'LensFlow AI الذكاء الاصطناعي',
      desc: 'المساعد الذكي لتحليل الأرباح والتعارضات وتتبع إنجاز المهام فورياً',
      badge: '🤖 فوري',
      badgeBg: 'rgba(168, 85, 247, 0.1)',
      badgeColor: '#a855f7',
      icon: Icons.Sparkles,
      iconBg: 'rgba(168, 85, 247, 0.1)',
      iconColor: '#a855f7',
      linkColor: '#a855f7'
    },
    {
      id: 'about',
      title: 'حول النظام والإصدار',
      desc: 'معلومات النظام، حالة الخدمات المباشرة، والمزامنة',
      badge: 'v2.5.0',
      badgeBg: 'rgba(14, 165, 233, 0.1)',
      badgeColor: '#0ea5e9',
      icon: Icons.Info,
      iconBg: 'rgba(14, 165, 233, 0.1)',
      iconColor: '#0ea5e9',
      linkColor: '#0ea5e9'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (Matching the screenshot exactly!)                    */}
      {/* ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Right side: Icon + Title + Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.45)',
              flexShrink: 0
            }}
          >
            <Icons.Settings size={28} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              الإعدادات والنظام — مركز التحكم الشامل
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '6px 0 0 0', fontWeight: 500 }}>
              تحكم في إعدادات النظام، الصلاحيات، التخصيص، الإشعارات والنسخ الاحتياطي من مكان واحد.
            </p>
          </div>
        </div>

        {/* Left side: Instant Backup Button */}
        <div>
          <button
            type="button"
            onClick={handleInstantBackup}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backdropFilter: 'blur(6px)'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
          >
            <span>نسخة احتياطية فورية</span>
            <Icons.Download size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .settings-hub-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1200px) {
          .settings-hub-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 860px) {
          .settings-hub-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 580px) {
          .settings-hub-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 2. MAIN HUB GRID (Shown when selectedSection is null)                       */}
      {/* ========================================================================= */}
      {selectedSection === null && (
        <div className="settings-hub-grid">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedSection(card.id)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  minHeight: '175px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = card.linkColor;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Card Top: In RTL, first child is on the RIGHT (Icon), second child is on the LEFT (Badge) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: card.iconBg,
                      color: card.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <span
                    style={{
                      backgroundColor: card.badgeBg,
                      color: card.badgeColor,
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Card Middle: Title & Description */}
                <div>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                    {card.desc}
                  </p>
                </div>

                {/* Card Footer: Action Link (In RTL: Chevron first on right, then text) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: card.linkColor, fontWeight: 800, fontSize: '0.84rem' }}>
                  <Icons.ChevronLeft size={16} strokeWidth={2.5} />
                  <span>فتح القسم</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUBSECTION VIEW (Shown when a card is opened)                           */}
      {/* ========================================================================= */}
      {selectedSection !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Back Navigation Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedSection(null)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                padding: '8px 16px',
                borderRadius: '8px'
              }}
            >
              <Icons.ArrowRight size={16} />
              <span>العودة إلى مركز التحكم الشامل (الإعدادات)</span>
            </button>

            <span className="badge badge-purple" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
              {settingsCards.find(c => c.id === selectedSection)?.title}
            </span>
          </div>

          {/* Section 1: Account */}
          {selectedSection === 'account' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (updateUserProfile) {
                  await updateUserProfile({ name: profileName, avatar: profileAvatar });
                }
                alert('✅ تم حفظ وتحديث بيانات وصورة الملف الشخصي بنجاح! 👤✨');
              }}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.User size={20} />
                <span>👤 الحساب والملف الشخصي للمستخدم الحالي</span>
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ position: 'relative' }}>
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="Avatar" style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  ) : (
                    <div style={{ width: '84px', height: '84px', borderRadius: '50%', border: '3px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', fontSize: '2.5rem' }}>
                      👤
                    </div>
                  )}
                  {isUploadingAvatar && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Icons.Loader2 size={24} className="animate-spin" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>الاسم الكامل *</label>
                    <input type="text" className="form-control" required value={profileName} onChange={e => setProfileName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>صورة البروفايل (حفظ سحابي دائم)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input id="profile-avatar-file-modal" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => document.getElementById('profile-avatar-file-modal').click()}
                        disabled={isUploadingAvatar}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Icons.Loader2 size={14} className="animate-spin" />
                            <span>جاري رفع وحفظ الصورة...</span>
                          </>
                        ) : (
                          <>
                            <Icons.Upload size={14} />
                            <span>📂 رفع وتغيير صورة البروفايل</span>
                          </>
                        )}
                      </button>
                      {profileAvatar && (
                        <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icons.Check size={14} /> محفوظة بحسابك سحابياً
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>البريد الإلكتروني:</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '0.88rem', direction: 'ltr', textAlign: 'right' }}>{currentUser?.email || 'ahdalamary@gmail.com'}</p>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>الدور الوظيفي:</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary-color)' }}>{isSuper ? '👑 مشرف ومدير المنظومة' : '📷 عضو فريق التصوير'}</p>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={isUploadingAvatar}>
                <Icons.Save size={16} />
                <span>حفظ بيانات الحساب</span>
              </button>
            </form>
          )}

          {/* Section 2: Appearance */}
          {selectedSection === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleSaveIdentity} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>🎨 تخصيص مظهر النظام والألوان الحية</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 800 }}>اللون الرئيسي للمنظومة</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="color" value={identityForm.primaryColor} onChange={e => setIdentityForm({ ...identityForm, primaryColor: e.target.value })} style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                      <input type="text" className="form-control" value={identityForm.primaryColor} onChange={e => setIdentityForm({ ...identityForm, primaryColor: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 800 }}>لون الأزرار والتفاعل</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="color" value={identityForm.buttonColor} onChange={e => setIdentityForm({ ...identityForm, buttonColor: e.target.value })} style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                      <input type="text" className="form-control" value={identityForm.buttonColor} onChange={e => setIdentityForm({ ...identityForm, buttonColor: e.target.value })} />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  <Icons.Save size={16} />
                  <span>حفظ وتطبيق المظهر فوراً 🎨</span>
                </button>
              </form>

              {/* App Icon Section */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>📱 أيقونة التطبيق (App Icon)</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  تغيير أيقونة التطبيق التي تظهر على الشاشة الرئيسية للهاتف عند تثبيت التطبيق (PWA). التغيير ينطبق فوراً.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '16px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {customAppIcon ? (
                      <img src={customAppIcon} alt="App Icon Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src="/favicon.svg" alt="Default Icon" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                        <Icons.Upload size={14} />
                        <span>رفع أيقونة جديدة</span>
                        <input type="file" accept="image/*" onChange={handleAppIconUpload} style={{ display: 'none' }} />
                      </label>
                      {customAppIcon && (
                        <button type="button" onClick={() => setCustomAppIcon('')} className="btn btn-danger btn-sm" style={{ margin: 0 }}>
                          <Icons.Trash2 size={14} />
                          <span>إعادة للافتراضي</span>
                        </button>
                      )}
                    </div>
                    <button type="button" onClick={handleSaveAppIcon} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                      <Icons.Save size={14} />
                      <span>حفظ الأيقونة 📱</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Company */}
          {selectedSection === 'company' && (
            <form onSubmit={handleSaveIdentity} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>🏢 إعدادات المنشأة والاستوديو</h3>
              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>اسم المنشأة / الاستوديو *</label>
                <input type="text" className="form-control" required value={identityForm.name} onChange={e => setIdentityForm({ ...identityForm, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>الوصف التعريفي</label>
                <textarea className="form-control" rows={3} value={identityForm.description} onChange={e => setIdentityForm({ ...identityForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <Icons.Upload size={14} />
                  <span>رفع الشعار (Logo)</span>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} style={{ display: 'none' }} />
                </label>
                {identityForm.logo && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>✓ تم رفع الشعار</span>}
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Icons.Save size={16} />
                <span>حفظ بيانات المنشأة</span>
              </button>
            </form>
          )}

          {/* Section 4: Menu Reorder */}
          {selectedSection === 'menu' && (
            <form onSubmit={handleSaveMenu} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>📋 تخصيص وترتيب أقسام القائمة</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItemsForm.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                    <button type="button" onClick={() => moveMenuItem(idx, 'up')} disabled={idx === 0} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>↑</button>
                    <button type="button" onClick={() => moveMenuItem(idx, 'down')} disabled={idx === menuItemsForm.length - 1} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>↓</button>
                    <input type="text" className="form-control" value={item.label} onChange={e => {
                      const val = e.target.value;
                      setMenuItemsForm(prev => prev.map((m, i) => i === idx ? { ...m, label: val } : m));
                    }} style={{ height: '32px', fontSize: '0.8rem', flex: 1 }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={item.visible !== false} onChange={e => {
                        const checked = e.target.checked;
                        setMenuItemsForm(prev => prev.map((m, i) => i === idx ? { ...m, visible: checked } : m));
                      }} />
                      <span>إظهار</span>
                    </label>
                  </div>
                ))}
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Icons.Save size={16} />
                <span>حفظ ترتيب القائمة</span>
              </button>
            </form>
          )}

          {/* Section 5: Permissions */}
          {selectedSection === 'permissions' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>🛡️ الصلاحيات والوصول وإدارة الأدوار</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>صلاحية تعديل الملف الشخصي</strong>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>السماح للمصورين بتعديل صورهم وأسمائهم.</p>
                  </div>
                  <span className="badge badge-success">مسموح للكل ✓</span>
                </div>
                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>إدارة الفواتير والماليات</strong>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>حصر إصدار الفواتير والدفعات على المشرف والمحاسب.</p>
                  </div>
                  <span className="badge badge-warning">مشرفين فقط 👑</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Notifications */}
          {selectedSection === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <NotificationsView />
            </div>
          )}

          {/* Section 7: Audit Logs */}
          {selectedSection === 'auditLogs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>📜 سجل النشاطات والعمليات الرقابي</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>تتبع كافة الإجراءات والعمليات مع الجهاز والمتصفح الفعليين.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={exportAuditLogs} className="btn btn-secondary btn-sm">
                    <Icons.Download size={14} />
                    <span>تصدير (JSON)</span>
                  </button>
                  <button type="button" onClick={() => { if (window.confirm('هل أنت متأكد من مسح السجل؟')) clearAuditLogs(); }} className="btn btn-secondary btn-sm" style={{ color: 'var(--status-danger)' }}>
                    <Icons.Trash2 size={14} />
                    <span>مسح السجل</span>
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                  <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 14px' }}>الوقت</th>
                        <th style={{ padding: '10px 14px' }}>المستخدم</th>
                        <th style={{ padding: '10px 14px' }}>الجهاز والمتصفح</th>
                        <th style={{ padding: '10px 14px' }}>الحدث</th>
                        <th style={{ padding: '10px 14px' }}>التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(auditLogs || []).length > 0 ? (
                        (auditLogs || []).map((log, idx) => (
                          <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '10px 14px', whiteSpace: 'nowrap' }}>
                              {formatDateTime12h(log.timestamp)}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 800 }}>{log.userName || 'عاهد العماري'}</td>
                            <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.device || currentDeviceInfo.deviceName}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 800 }}>{log.action}</td>
                            <td style={{ padding: '10px 14px', fontSize: '0.84rem' }}>{log.details}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>لا توجد سجلات بعد.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 8: Backup & Restore */}
          {selectedSection === 'backup' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>💾 النسخ الاحتياطي والاستعادة الفورية</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                حفظ نسخة احتياطية كاملة من قواعد البيانات (الحجوزات، العملاء، المعدات، المالية، والإعدادات).
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleInstantBackup} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.Download size={16} />
                  <span>تصدير نسخة احتياطية كاملة (JSON) 📥</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 9: General Settings */}
          {selectedSection === 'general' && (
            <form onSubmit={handleSaveGeneral} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>⚙️ إعدادات النظام العامة</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 800 }}>اسم النظام الرئيسي</label>
                  <input type="text" className="form-control" value={generalForm.systemName} onChange={e => setGeneralForm({ ...generalForm, systemName: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 800 }}>الوصف الفرعي</label>
                  <input type="text" className="form-control" value={generalForm.subtitle} onChange={e => setGeneralForm({ ...generalForm, subtitle: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <Icons.Save size={16} />
                <span>حفظ الإعدادات العامة</span>
              </button>
            </form>
          )}

          {/* Section 10: Security & Password */}
          {selectedSection === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <form onSubmit={handlePasswordSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>🔒 الأمان وتغيير كلمة المرور</h3>
                {passwordStatus && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: passwordStatus.type === 'success' ? '#ecfdf5' : '#fef2f2', color: passwordStatus.type === 'success' ? '#047857' : '#b91c1c', fontSize: '0.85rem', fontWeight: 800 }}>
                    {passwordStatus.msg}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <input type="password" required className="form-control" placeholder="كلمة المرور الجديدة (6 خانات+)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  <input type="password" required className="form-control" placeholder="تأكيد كلمة المرور الجديدة" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    <Icons.ShieldCheck size={16} />
                    <span>تحديث كلمة المرور</span>
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Info size={14} />
                    <span>لدواعي الأمان، سيتم إنهاء جلسات الأجهزة الأخرى تلقائياً عند تغيير كلمة المرور.</span>
                  </span>
                </div>
              </form>

              {/* Section: Devices & Sessions (الأجهزة والجلسات) */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icons.Smartphone size={20} color="var(--primary-color)" />
                      <span>📱 الأجهزة والجلسات</span>
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      عرض وإدارة جميع الأجهزة المتصلة بحسابك وجلسات تسجيل الدخول النشطة في الوقت الفعلي.
                    </p>
                  </div>

                  {/* Global Logout Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من جميع الأجهزة الأخرى؟ ستبقى جلستك الحالية فقط.')) {
                          logoutAllOtherDevices();
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                    >
                      <Icons.LogOut size={14} />
                      <span>تسجيل الخروج من جميع الأجهزة الأخرى</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من تسجيل الخروج من جميع الأجهزة بما فيها هذا الجهاز؟ ستتم إعادة توجيهك لشاشة الدخول.')) {
                          logoutAllDevices();
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#ef4444', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                    >
                      <Icons.Power size={14} />
                      <span>تسجيل الخروج من جميع الأجهزة</span>
                    </button>
                  </div>
                </div>

                {/* Device Cards List */}
                {(() => {
                  const currentDevId = getDeviceId();
                  const activeDevs = (devices || []).filter(d => d.status !== 'terminated');
                  const sorted = [...activeDevs].sort((a, b) => {
                    const aCur = String(a.id) === String(currentDevId) || a.isCurrent;
                    const bCur = String(b.id) === String(currentDevId) || b.isCurrent;
                    if (aCur) return -1;
                    if (bCur) return 1;
                    return new Date(b.lastActive || 0) - new Date(a.lastActive || 0);
                  });

                  if (sorted.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        لا توجد أجهزة مسجلة حالياً.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {sorted.map((dev) => {
                        const isCurrent = String(dev.id) === String(currentDevId) || dev.isCurrent;
                        const isPhone = dev.type === 'هاتف' || (dev.name && dev.name.includes('iPhone')) || (dev.os && dev.os.includes('iOS'));
                        const isTablet = dev.type === 'جهاز لوحي' || (dev.name && dev.name.includes('iPad'));
                        const DeviceIcon = isPhone ? Icons.Smartphone : (isTablet ? Icons.Tablet : Icons.Laptop);

                        return (
                          <div
                            key={dev.id}
                            style={{
                              padding: '16px 18px',
                              borderRadius: '12px',
                              border: isCurrent ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                              backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.03)' : '#ffffff',
                              boxShadow: isCurrent ? '0 4px 12px rgba(99, 102, 241, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            {/* Card Top: Icon + Name + Badges + Action Button */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.12)' : '#f1f5f9',
                                    color: isCurrent ? 'var(--primary-color)' : '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <DeviceIcon size={22} />
                                </div>

                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <h4 style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                                      {dev.name || (isPhone ? 'هاتف ذكي' : 'كمبيوتر شخصي')}
                                    </h4>
                                    {isCurrent && (
                                      <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.72rem' }}>
                                        الجهاز الحالي
                                      </span>
                                    )}
                                    <span className="badge badge-info" style={{ fontWeight: 800, fontSize: '0.72rem' }}>
                                      نشط
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                                    معرّف الجلسة: <span style={{ direction: 'ltr', display: 'inline-block' }}>{dev.id?.substring(0, 16)}...</span>
                                  </p>
                                </div>
                              </div>

                              {/* Action Button */}
                              <div>
                                {isCurrent ? (
                                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <Icons.CheckCircle size={15} />
                                    <span>هذه جلستك الحالية النشطة</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`هل أنت متأكد من إنهاء جلسة ${dev.name || 'هذا الجهاز'} فوراً؟`)) {
                                        logoutDevice(dev.id);
                                      }
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                      color: '#ef4444',
                                      borderColor: '#fca5a5',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontWeight: 800
                                    }}
                                  >
                                    <Icons.LogOut size={14} />
                                    <span>تسجيل الخروج</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Device Details Grid (نوع الجهاز / نظام التشغيل / المتصفح / تاريخ الدخول / آخر نشاط) */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '10px',
                                backgroundColor: '#f8fafc',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #edf2f7'
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>نوع الجهاز:</span>
                                <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{dev.type || 'كمبيوتر'}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>نظام التشغيل:</span>
                                <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{dev.os || 'Windows'}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>المتصفح:</span>
                                <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{dev.browser || 'Chrome'}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>تاريخ تسجيل الدخول:</span>
                                <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{formatArabicDateTime(dev.loginAt || dev.lastActive)}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>آخر نشاط:</span>
                                <strong style={{ fontSize: '0.82rem', color: isCurrent ? '#10b981' : 'var(--text-main)' }}>
                                  {isCurrent ? 'الآن (نشط)' : formatArabicRelativeTime(dev.lastActive)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Section: Reports System */}
          {selectedSection === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FinancialsView defaultSubTab="reports" />
            </div>
          )}

          {/* Section: LensFlow AI */}
          {selectedSection === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <LensFlowAI />
            </div>
          )}

          {/* Section 11: About */}
          {selectedSection === 'about' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>ℹ️ حول النظام والإصدار</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>إصدار المنظومة:</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-color)' }}>v2.5.0 Enterprise</div>
                </div>
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>حالة الخدمات السحابية:</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>متصلة ونشطة 🟢</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsView;
