import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { formatBookingNumber } from '../../utils/helpers';
import { AttendanceTimePicker } from '../Common/AttendanceTimePicker';
import { isContactPickerSupported, pickDeviceContact, openDeviceAddContact, openOfficialWhatsApp } from '../../utils/deviceContacts';
import { DeviceContactsFallbackModal } from '../Common/DeviceContactsFallbackModal';

export const BookingFormModal = () => {
  const {
    isBookingFormOpen,
    setIsBookingFormOpen,
    selectedDateForBooking,
    editingBooking,
    setEditingBooking,
    addBooking,
    updateBooking,
    clients = [],
    freelancers = [],
    companies = [],
    team = [],
    setSelectedBooking,
    setIsBookingDetailOpen
  } = useApp();

  const isEditMode = Boolean(editingBooking);

  // 1. فريلانسر (الافتراضي)، 2. عميل، 3. شركة
  const [bookingType, setBookingType] = useState('freelancer'); // 'freelancer' | 'client' | 'company'

  // بيانات العميل والمصور المباشرة
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientContactId, setClientContactId] = useState(null);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  const [photographerName, setPhotographerName] = useState('');
  const [photographerPhone, setPhotographerPhone] = useState('');
  const [photographerContactId, setPhotographerContactId] = useState(null);
  const [showPhotographerSuggestions, setShowPhotographerSuggestions] = useState(false);

  // حالة الصلاحيات والنافذة البديلة لجهات الاتصال
  const [permissionError, setPermissionError] = useState('');
  const [fallbackModalState, setFallbackModalState] = useState({ isOpen: false, targetType: 'client' });

  const clientDropdownRef = useRef(null);
  const photographerDropdownRef = useRef(null);

  // وظيفة جلب جهة الاتصال من الجهاز مباشرة أو فتح البديل
  const handlePickContact = async (targetType) => {
    setPermissionError('');
    if (isContactPickerSupported()) {
      const res = await pickDeviceContact();
      if (res.success && res.contact) {
        if (targetType === 'client') {
          setClientName(res.contact.name);
          if (res.contact.phone) setClientPhone(res.contact.phone);
          setClientContactId(res.contact.contactId);
        } else {
          setPhotographerName(res.contact.name);
          if (res.contact.phone) setPhotographerPhone(res.contact.phone);
          setPhotographerContactId(res.contact.contactId);
        }
      } else if (res.permissionDenied) {
        setPermissionError(res.error || 'لم يتم السماح بالوصول إلى جهات الاتصال. يمكنك السماح بالوصول من إعدادات الجهاز ثم المحاولة مرة أخرى.');
      } else if (!res.cancelled) {
        setFallbackModalState({ isOpen: true, targetType });
      }
    } else {
      setFallbackModalState({ isOpen: true, targetType });
    }
  };

  const handleFallbackContactSelected = (contact) => {
    if (fallbackModalState.targetType === 'client') {
      setClientName(contact.name);
      if (contact.phone) setClientPhone(contact.phone);
      setClientContactId(contact.contactId || null);
    } else {
      setPhotographerName(contact.name);
      if (contact.phone) setPhotographerPhone(contact.phone);
      setPhotographerContactId(contact.contactId || null);
    }
  };

  const [bookingDate, setBookingDate] = useState('');
  const [category, setCategory] = useState('زفاف');
  const [customCategory, setCustomCategory] = useState('');
  const [coveragePeriod, setCoveragePeriod] = useState('صباحًا');
  const [isAllDay, setIsAllDay] = useState(false);
  const [attendanceTime, setAttendanceTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [status, setStatus] = useState('مؤكد');
  const [notes, setNotes] = useState('');
  
  const [savedBooking, setSavedBooking] = useState(null);

  // البيانات المالية
  const [totalPrice, setTotalPrice] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('غير مسدد');
  const [partnershipPercentage, setPartnershipPercentage] = useState('');

  // بيانات الفريلانسر
  const [freelancerMode, setFreelancerMode] = useState('scattered'); // 'scattered' | 'consecutive'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [workingDaysCount, setWorkingDaysCount] = useState(1);
  const [scatteredDates, setScatteredDates] = useState(['']);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // إغلاق قوائم الاقتراحات عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) {
        setShowClientSuggestions(false);
      }
      if (photographerDropdownRef.current && !photographerDropdownRef.current.contains(e.target)) {
        setShowPhotographerSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    'زفاف',
    'زواج',
    'مؤتمر',
    'فعالية',
    'جلسة تصوير',
    'جلسة تصوير بورتريه',
    'تغطية إعلامية',
    'تصوير منتجات',
    'تصوير أطعمة',
    'تصوير عقارات',
    'تصوير مناسبات',
    'تصوير تجاري',
    'تصوير محتوى',
    'تصوير إعلاني',
    'فيديو',
    'بث مباشر',
    'تصوير وبث مباشر',
    'أخرى'
  ];

  // تصفية اقتراحات العملاء
  const filteredClients = (clients || []).filter(c => {
    const q = clientName.toLowerCase().trim();
    if (!q) return true;
    return (c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q));
  }).slice(0, 6);

  // تصفية اقتراحات المصورين من الفريلانسرز وفريق العمل
  const availablePhotographers = [
    ...(freelancers || []),
    ...(team || []).map(t => ({ id: t.id, name: t.name, phone: t.phone || '', role: t.role || 'مصور' }))
  ];
  const filteredPhotographers = availablePhotographers.filter((p, idx, self) => {
    const q = photographerName.toLowerCase().trim();
    const match = !q || (p.name && p.name.toLowerCase().includes(q)) || (p.phone && p.phone.includes(q));
    const firstIdx = self.findIndex(s => s.name === p.name);
    return match && firstIdx === idx;
  }).slice(0, 6);

  // تعبئة البيانات عند فتح النموذج أو التعديل
  useEffect(() => {
    if (isBookingFormOpen) {
      if (editingBooking) {
        const b = editingBooking;
        const bType = b.bookingType || (b.freelancerName ? 'freelancer' : (b.clientName ? 'client' : 'company'));
        setBookingType(bType);
        
        const cName = b.clientName || (bType === 'client' ? (b.title?.split(' - ')[1] || b.title || '') : '');
        const cPhone = b.clientPhone || b.contactPhone || b.phone || '';
        setClientName(cName);
        setClientPhone(cPhone);
        setClientContactId(b.clientContactId || null);

        const pName = b.freelancerName || b.assignedPhotographer || (bType === 'freelancer' ? (b.title?.split(' - ')[1] || b.title || '') : '');
        const pPhone = b.freelancerPhone || '';
        setPhotographerName(pName);
        setPhotographerPhone(pPhone);
        setPhotographerContactId(b.photographerContactId || null);
        
        const dateVal = b.date || b.startDate || '';
        setBookingDate(dateVal);
        
        const cat = b.category || b.coverageType || 'زفاف';
        if (categories.includes(cat)) {
          setCategory(cat);
          setCustomCategory('');
        } else {
          setCategory('أخرى');
          setCustomCategory(cat);
        }
        
        setIsAllDay(Boolean(b.isAllDay));
        const period = (b.startTime?.includes('مساء') || b.endTime?.includes('مساء')) ? 'مساءً' : 'صباحًا';
        setCoveragePeriod(period);
        setAttendanceTime(b.attendanceTime || '');
        setLocation(b.hallName || b.location || '');
        setLocationUrl(b.locationUrl || b.googleMapsUrl || '');
        setStatus(b.status || 'مؤكد');
        setNotes(b.notes || '');
        
        setTotalPrice(b.totalPrice !== undefined && b.totalPrice !== null ? String(b.totalPrice) : '');
        setInvoiceNumber(b.invoiceNumber || '');
        setInvoiceStatus(b.paymentStatus || 'غير مسدد');
        setPartnershipPercentage(b.partnershipPercentage !== undefined && b.partnershipPercentage !== null ? String(b.partnershipPercentage) : '');
        
        setDailyRate(b.dailyRate !== undefined && b.dailyRate !== null ? String(b.dailyRate) : '');
        setWorkingDaysCount(b.workingDaysCount || 1);
        setFreelancerMode(b.freelancerMode || 'scattered');
        setStartDate(b.startDate || dateVal);
        setEndDate(b.endDate || dateVal);
        setScatteredDates(b.bookingDates && b.bookingDates.length > 0 ? b.bookingDates : [dateVal]);
        
        setSavedBooking(null);
      } else {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        const hour = today.getHours();
        setCoveragePeriod(hour < 12 ? 'صباحًا' : 'مساءً');
        setIsAllDay(false);
        setAttendanceTime('');
        setBookingDate(selectedDateForBooking || todayStr);
        setCategory('زفاف');
        setCustomCategory('');
        setLocation('');
        setLocationUrl('');
        setStatus('مؤكد');
        setNotes('');
        setSavedBooking(null);

        setClientName('');
        setClientPhone('');
        setClientContactId(null);
        setPhotographerName('');
        setPhotographerPhone('');
        setPhotographerContactId(null);
        setPermissionError('');

        setTotalPrice('');
        setInvoiceNumber('');
        setInvoiceStatus('غير مسدد');
        setPartnershipPercentage('');

        setBookingType('freelancer');
        setFreelancerMode('scattered');
        setStartDate(selectedDateForBooking || todayStr);
        setEndDate(selectedDateForBooking || todayStr);
        setDailyRate('');
        setWorkingDaysCount(1);
        setScatteredDates([selectedDateForBooking || todayStr]);
      }
    }
  }, [isBookingFormOpen, selectedDateForBooking, editingBooking]);

  // حساب أيام العمل المتتالية
  useEffect(() => {
    if (bookingType === 'freelancer' && freelancerMode === 'consecutive') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setWorkingDaysCount(diffDays > 0 ? diffDays : 1);
      } else {
        setWorkingDaysCount(1);
      }
    }
  }, [startDate, endDate, bookingType, freelancerMode]);

  // حساب أيام العمل المتفرقة
  useEffect(() => {
    if (bookingType === 'freelancer' && freelancerMode === 'scattered') {
      const validDates = scatteredDates.filter(d => d);
      setWorkingDaysCount(validDates.length > 0 ? validDates.length : 1);
    }
  }, [scatteredDates, bookingType, freelancerMode]);

  if (!isBookingFormOpen) return null;

  const handleSave = () => {
    const name = clientName.trim() || photographerName.trim();
    if (!name) {
      alert('يرجى كتابة اسم العميل أو اسم المصور لإتمام الحجز');
      return;
    }

    const finalCategory = category === 'أخرى' && customCategory.trim()
      ? customCategory.trim()
      : category;

    const bookingTitle = `${finalCategory} - ${name}`;

    const bookingData = {
      ...(editingBooking || {}),
      bookingType,
      title: bookingTitle,
      category: finalCategory,
      coverageType: finalCategory,
      startTime: isAllDay ? 'طوال اليوم' : coveragePeriod,
      endTime: isAllDay ? 'طوال اليوم' : coveragePeriod,
      isAllDay,
      attendanceTime: attendanceTime || '',
      location: location.trim(),
      hallName: location.trim(),
      locationUrl: locationUrl.trim() ? (locationUrl.trim().startsWith('http') ? locationUrl.trim() : `https://${locationUrl.trim()}`) : '',
      googleMapsUrl: locationUrl.trim() ? (locationUrl.trim().startsWith('http') ? locationUrl.trim() : `https://${locationUrl.trim()}`) : '',
      status: status || 'مؤكد',
      notes: notes || '',
      deposit: editingBooking ? editingBooking.deposit : null,
      paidAmount: editingBooking ? (editingBooking.paidAmount || 0) : 0,
      teamMemberIds: editingBooking ? (editingBooking.teamMemberIds || []) : [],
      equipmentIds: editingBooking ? (editingBooking.equipmentIds || []) : []
    };

    bookingData.clientName = clientName.trim();
    bookingData.clientPhone = clientPhone.trim();
    bookingData.clientContactId = clientContactId || editingBooking?.clientContactId || null;

    bookingData.freelancerName = photographerName.trim();
    bookingData.freelancerPhone = photographerPhone.trim();
    bookingData.assignedPhotographer = photographerName.trim();
    bookingData.photographerContactId = photographerContactId || editingBooking?.photographerContactId || null;

    bookingData.contactPhone = clientPhone || photographerPhone || '';
    bookingData.phone = clientPhone || photographerPhone || '';
    bookingData.contactName = name;

    // البيانات المالية
    if (bookingType === 'client') {
      bookingData.date = bookingDate;
      bookingData.startDate = bookingDate;
      bookingData.endDate = bookingDate;
      bookingData.totalPrice = totalPrice !== '' ? Number(totalPrice) : null;
      bookingData.invoiceNumber = invoiceNumber || '';
    } else if (bookingType === 'company') {
      bookingData.date = bookingDate;
      bookingData.startDate = bookingDate;
      bookingData.endDate = bookingDate;
      bookingData.totalPrice = totalPrice !== '' ? Number(totalPrice) : null;
      bookingData.invoiceNumber = invoiceNumber || '';
      bookingData.paymentStatus = invoiceStatus || 'غير مسدد';
    } else if (bookingType === 'freelancer') {
      bookingData.dailyRate = dailyRate !== '' ? Number(dailyRate) : null;
      bookingData.workingDaysCount = workingDaysCount;
      bookingData.freelancerMode = freelancerMode;

      const dates = [];
      if (freelancerMode === 'consecutive') {
        if (startDate && endDate) {
          let curr = new Date(startDate);
          const end = new Date(endDate);
          while (curr <= end) {
            dates.push(curr.toISOString().substring(0, 10));
            curr.setDate(curr.getDate() + 1);
          }
        } else {
          dates.push(bookingDate);
        }
      } else {
        scatteredDates.filter(d => d).forEach(d => dates.push(d));
        if (dates.length === 0) dates.push(bookingDate);
      }

      bookingData.bookingDates = dates;
      bookingData.date = dates[0] || bookingDate;
      bookingData.startDate = dates[0] || bookingDate;
      bookingData.endDate = dates[dates.length - 1] || bookingDate;
      bookingData.totalPrice = dailyRate !== '' ? Number(dailyRate) : null;
    }

    const paidAmount = isEditMode && editingBooking.paidAmount ? Number(editingBooking.paidAmount) : 0;
    bookingData.paidAmount = paidAmount;
    if (bookingData.totalPrice !== undefined && bookingData.totalPrice !== null) {
      bookingData.remainingAmount = bookingData.totalPrice - paidAmount;
    }

    if (isEditMode) {
      if (updateBooking) {
        const updated = updateBooking(editingBooking.id, bookingData);
        setSavedBooking(updated || { ...editingBooking, ...bookingData });
      }
    } else {
      if (addBooking) {
        const created = addBooking(bookingData);
        setSavedBooking(created);
      }
    }
  };

  const calculatedTotalDue = (Number(dailyRate) || 0) * workingDaysCount;

  // شاشة نجاح الحفظ
  if (savedBooking) {
    return (
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
        <div className="modal-content" style={{ width: '90%', maxWidth: '380px', backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Icons.CheckCircle2 size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
              {isEditMode ? 'تم حفظ التعديلات بنجاح ✓' : 'تم إنشاء الحجز بنجاح ✓'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              رقم الحجز المرجعي: <strong>{formatBookingNumber(savedBooking.bookingNumber)}</strong>
            </p>
            <p style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
              {savedBooking.title}
            </p>
            {bookingType === 'freelancer' && (
              <p style={{ fontSize: '0.76rem', color: 'var(--status-success)', fontWeight: 800, marginTop: '4px' }}>
                جدولة {workingDaysCount} يوم عمل بإجمالي مستحق: {calculatedTotalDue.toLocaleString('en-US')} ريال.
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={() => {
                setSelectedBooking(savedBooking);
                setIsBookingDetailOpen(true);
                setIsBookingFormOpen(false);
                setSavedBooking(null);
                if (setEditingBooking) setEditingBooking(null);
              }}
              className="btn btn-primary"
              style={{ flex: 1, height: '40px', fontWeight: 900, fontSize: '0.82rem' }}
            >
              <span>فتح الحجز 👁️</span>
            </button>
            <button
              onClick={() => {
                setIsBookingFormOpen(false);
                setSavedBooking(null);
                if (setEditingBooking) setEditingBooking(null);
              }}
              className="btn btn-secondary"
              style={{ flex: 1, height: '40px', fontWeight: 900, fontSize: '0.82rem' }}
            >
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getThemeColor = () => {
    switch (bookingType) {
      case 'freelancer': return 'var(--status-success)';
      case 'company': return 'var(--status-warning)';
      default: return 'var(--primary-color)';
    }
  };

  return (
    <div className="modal-overlay" onClick={() => { setIsBookingFormOpen(false); if (setEditingBooking) setEditingBooking(null); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div
        className="modal-content animate-drawer"
        onClick={e => e.stopPropagation()}
        style={isMobile ? {
          width: '100%',
          maxWidth: '100%',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid var(--border-color)',
          borderBottom: 'none',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.2)',
          padding: '20px 20px 16px 20px',
          overflow: 'hidden',
          direction: 'rtl',
          textAlign: 'right'
        } : {
          maxWidth: '500px',
          width: '90%',
          backgroundColor: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          direction: 'rtl',
          textAlign: 'right'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Zap size={18} style={{ color: getThemeColor() }} />
            <span>{isEditMode ? '✏️ تعديل بيانات الحجز' : '+ حجز سريع للخضوع للجدولة'}</span>
          </h3>
          <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => { setIsBookingFormOpen(false); if (setEditingBooking) setEditingBooking(null); }}>
            <Icons.X size={18} />
          </button>
        </div>

        {/* Form Body Scrollable Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '4px', paddingRight: '4px', marginBottom: '8px', direction: 'rtl', textAlign: 'right' }}>

          {/* 1. Entity type tab selector: 1. فريلانسر، 2. عميل، 3. شركة */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>تصنيف الحجز والتعامل:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', backgroundColor: 'var(--bg-main)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setBookingType('freelancer')}
                style={{
                  padding: '8px 4px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: bookingType === 'freelancer' ? 'var(--status-success)' : 'transparent',
                  color: bookingType === 'freelancer' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                👤 فريلانسر
              </button>
              <button
                type="button"
                onClick={() => setBookingType('client')}
                style={{
                  padding: '8px 4px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: bookingType === 'client' ? 'var(--primary-color)' : 'transparent',
                  color: bookingType === 'client' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                📷 عميل
              </button>
              <button
                type="button"
                onClick={() => setBookingType('company')}
                style={{
                  padding: '8px 4px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: bookingType === 'company' ? 'var(--status-warning)' : 'transparent',
                  color: bookingType === 'company' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                🏢 شركة
              </button>
            </div>
          </div>

          {/* تنبيه الصلاحيات إن وجد */}
          {permissionError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                lineHeight: 1.4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{permissionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setPermissionError('')}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px 4px' }}
              >
                <Icons.X size={14} />
              </button>
            </div>
          )}

          {/* 2. الحقل 1: العميل */}
          <div ref={clientDropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--text-muted)', margin: 0 }}>
                {bookingType === 'company' ? 'اسم الشركة / العميل *' : 'اسم العميل *'}
              </label>
              {clientContactId && (
                <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Icons.Check size={11} /> متصل بالهاتف
                </span>
              )}
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                placeholder={bookingType === 'company' ? 'اختر أو اكتب اسم الشركة...' : 'اختر أو اكتب اسم العميل...'}
                value={clientName}
                onChange={e => {
                  setClientName(e.target.value);
                  setShowClientSuggestions(true);
                }}
                onFocus={() => setShowClientSuggestions(true)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', direction: 'rtl', textAlign: 'right', unicodeBidi: 'plaintext', paddingLeft: '44px' }}
              />
              <button
                type="button"
                onClick={() => handlePickContact('client')}
                title="اختيار من جهات اتصال الهاتف 👤"
                style={{
                  position: 'absolute',
                  left: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '8px',
                  color: '#818cf8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icons.User size={16} />
              </button>
            </div>

            {showClientSuggestions && (
              <div style={{
                position: 'absolute',
                top: '72px',
                right: 0,
                left: 0,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                zIndex: 100,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {filteredClients.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClientName(c.name);
                      if (c.phone) setClientPhone(c.phone);
                      setClientContactId(c.id || null);
                      setShowClientSuggestions(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontWeight: 800 }}>{c.name}</span>
                    {c.phone && <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', direction: 'ltr' }}>{c.phone}</span>}
                  </div>
                ))}
                <div
                  onClick={() => {
                    setShowClientSuggestions(false);
                    openDeviceAddContact(clientName, clientPhone);
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.76rem',
                    color: 'var(--primary-color)',
                    fontWeight: 800,
                    backgroundColor: 'rgba(99, 102, 241, 0.05)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'}
                >
                  <Icons.UserPlus size={13} />
                  <span>إضافة جهة اتصال في الهاتف</span>
                </div>
              </div>
            )}

            <input
              type="text"
              className="form-control en-digits"
              placeholder="رقم جوال العميل (اختياري)"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              style={{ height: '36px', borderRadius: '8px', fontSize: '0.82rem', textAlign: 'left', direction: 'ltr', marginTop: '2px' }}
            />

            {(clientName.trim() || clientPhone.trim()) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => openDeviceAddContact(clientName, clientPhone)}
                  title="حفظ العميل في جهات اتصال الهاتف"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10b981',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Icons.UserPlus size={12} />
                  <span>+ إضافة إلى جهات الاتصال</span>
                </button>
                <button
                  type="button"
                  onClick={() => openOfficialWhatsApp(clientPhone, clientName)}
                  title="فتح واتساب الرسمي"
                  style={{
                    backgroundColor: 'rgba(37, 211, 102, 0.1)',
                    border: '1px solid rgba(37, 211, 102, 0.25)',
                    color: '#25d366',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Icons.MessageSquare size={12} />
                  <span>إضافة من واتساب</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. الحقل 2: المصور */}
          <div ref={photographerDropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--text-muted)', margin: 0 }}>
                المصور / الفريلانسر:
              </label>
              {photographerContactId && (
                <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Icons.Check size={11} /> متصل بالهاتف
                </span>
              )}
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                placeholder="اختر أو اكتب اسم المصور..."
                value={photographerName}
                onChange={e => {
                  setPhotographerName(e.target.value);
                  setShowPhotographerSuggestions(true);
                }}
                onFocus={() => setShowPhotographerSuggestions(true)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', direction: 'rtl', textAlign: 'right', unicodeBidi: 'plaintext', paddingLeft: '44px' }}
              />
              <button
                type="button"
                onClick={() => handlePickContact('photographer')}
                title="اختيار من جهات اتصال الهاتف 👤"
                style={{
                  position: 'absolute',
                  left: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '8px',
                  color: '#818cf8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icons.User size={16} />
              </button>
            </div>

            {showPhotographerSuggestions && (
              <div style={{
                position: 'absolute',
                top: '72px',
                right: 0,
                left: 0,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                zIndex: 100,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {filteredPhotographers.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    onClick={() => {
                      setPhotographerName(p.name);
                      if (p.phone) setPhotographerPhone(p.phone);
                      setPhotographerContactId(p.id || null);
                      setShowPhotographerSuggestions(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontWeight: 800 }}>{p.name}</span>
                    {p.phone && <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', direction: 'ltr' }}>{p.phone}</span>}
                  </div>
                ))}
                <div
                  onClick={() => {
                    setShowPhotographerSuggestions(false);
                    openDeviceAddContact(photographerName, photographerPhone);
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.76rem',
                    color: 'var(--primary-color)',
                    fontWeight: 800,
                    backgroundColor: 'rgba(99, 102, 241, 0.05)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'}
                >
                  <Icons.UserPlus size={13} />
                  <span>إضافة جهة اتصال في الهاتف</span>
                </div>
              </div>
            )}

            <input
              type="text"
              className="form-control en-digits"
              placeholder="رقم جوال المصور (اختياري)"
              value={photographerPhone}
              onChange={e => setPhotographerPhone(e.target.value)}
              style={{ height: '36px', borderRadius: '8px', fontSize: '0.82rem', textAlign: 'left', direction: 'ltr', marginTop: '2px' }}
            />

            {(photographerName.trim() || photographerPhone.trim()) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => openDeviceAddContact(photographerName, photographerPhone)}
                  title="حفظ المصور في جهات اتصال الهاتف"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10b981',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Icons.UserPlus size={12} />
                  <span>+ إضافة إلى جهات الاتصال</span>
                </button>
                <button
                  type="button"
                  onClick={() => openOfficialWhatsApp(photographerPhone, photographerName)}
                  title="فتح واتساب الرسمي"
                  style={{
                    backgroundColor: 'rgba(37, 211, 102, 0.1)',
                    border: '1px solid rgba(37, 211, 102, 0.25)',
                    color: '#25d366',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Icons.MessageSquare size={12} />
                  <span>إضافة من واتساب</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. الحقل 3: نوع الحجز */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>نوع الحجز:</label>
            <select
              className="form-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', padding: '0 10px', direction: 'rtl', textAlign: 'right', unicodeBidi: 'plaintext' }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {category === 'أخرى' && (
              <input
                type="text"
                className="form-control"
                placeholder="اكتب نوع الحجز المخصص..."
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                style={{ height: '38px', borderRadius: '8px', fontSize: '0.82rem', marginTop: '4px', direction: 'rtl', textAlign: 'right', unicodeBidi: 'plaintext' }}
              />
            )}
          </div>

          {/* 5. تاريخ التغطية / الحجز (يظهر لغير الفريلانسر المجدول) */}
          {bookingType !== 'freelancer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>تاريخ التغطية / الحجز:</label>
              <input
                type="date"
                className="form-control"
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'right' }}
              />
            </div>
          )}

          {/* 6. توقيت التغطية */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', margin: 0 }}>توقيت التغطية:</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-main)', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={e => setIsAllDay(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--primary-color)' }}
                />
                <span>طوال اليوم (مهمة ممتدة) 📅</span>
              </label>
            </div>

            {!isAllDay && (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setCoveragePeriod('صباحًا')}
                  className={`btn ${coveragePeriod === 'صباحًا' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  ☀️ صباحًا
                </button>
                <button
                  type="button"
                  onClick={() => setCoveragePeriod('مساءً')}
                  className={`btn ${coveragePeriod === 'مساءً' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  🌙 مساءً
                </button>
              </div>
            )}
          </div>

          {/* 7. وقت الحضور (اختياري) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>وقت الحضور (اختياري):</label>
            <AttendanceTimePicker
              value={attendanceTime}
              onChange={setAttendanceTime}
              placeholder="اختر وقت الحضور ⏰ (من 7:00 ص إلى 12:00 ص)"
            />
          </div>

          {/* 8. اسم القاعة & رابط موقع القاعة */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>اسم القاعة:</label>
              <input
                type="text"
                className="form-control"
                placeholder="اسم القاعة (اختياري)"
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', direction: 'rtl', textAlign: 'right', unicodeBidi: 'plaintext' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>رابط موقع القاعة:</label>
              <input
                type="url"
                className="form-control en-digits"
                placeholder="رابط موقع القاعة (اختياري)"
                value={locationUrl}
                onChange={e => setLocationUrl(e.target.value)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', textAlign: 'left', direction: 'ltr' }}
              />
            </div>
          </div>

          {/* 9. حالة الحجز */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>حالة الحجز:</label>
            <select
              className="form-control"
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', padding: '0 8px', direction: 'rtl', textAlign: 'right', unicodeBidi: 'plaintext' }}
            >
              <option value="مؤكد">مؤكد</option>
              <option value="بانتظار التأكيد">بانتظار التأكيد</option>
              <option value="جاري التنفيذ">جاري التنفيذ</option>
              <option value="مكتمل">مكتمل</option>
              <option value="ملغي">ملغي</option>
            </select>
          </div>

          {/* 10. التفاصيل المالية والجدولة */}
          
          {/* A. حقول الفريلانسر */}
          {bookingType === 'freelancer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>نوع جدولة العمل للفريلانسر:</label>
                <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setFreelancerMode('scattered')}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: freelancerMode === 'scattered' ? 'var(--status-success)' : 'transparent',
                      color: freelancerMode === 'scattered' ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    📅 أيام متفرقة
                  </button>
                  <button
                    type="button"
                    onClick={() => setFreelancerMode('consecutive')}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: freelancerMode === 'consecutive' ? 'var(--status-success)' : 'transparent',
                      color: freelancerMode === 'consecutive' ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    📆 أيام متتالية
                  </button>
                </div>
              </div>

              {/* سعر اليوم */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  سعر اليوم:
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <input
                    type="text"
                    className="form-control en-digits"
                    placeholder="0 (اختياري)"
                    value={dailyRate}
                    onChange={e => setDailyRate(e.target.value.replace(/[^0-9.]/g, ''))}
                    style={{ 
                      height: '40px', 
                      borderTopRightRadius: '10px', 
                      borderBottomRightRadius: '10px',
                      borderTopLeftRadius: '0px', 
                      borderBottomLeftRadius: '0px', 
                      fontSize: '0.86rem', 
                      textAlign: 'left', 
                      direction: 'ltr',
                      flex: 1,
                      borderLeft: 'none'
                    }}
                  />
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)', 
                    borderTopLeftRadius: '10px', 
                    borderBottomLeftRadius: '10px', 
                    borderTopRightRadius: '0px', 
                    borderBottomRightRadius: '0px', 
                    padding: '0 12px', 
                    fontSize: '0.76rem', 
                    color: 'var(--text-muted)', 
                    fontWeight: 900,
                    userSelect: 'none'
                  }}>
                    ريال / يوم
                  </span>
                </div>
              </div>

              {/* تواريخ الأيام المتتالية */}
              {freelancerMode === 'consecutive' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>تاريخ البداية:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'right' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>تاريخ النهاية:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'right' }}
                    />
                  </div>
                </div>
              )}

              {/* تواريخ الأيام المتفرقة */}
              {freelancerMode === 'scattered' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)' }}>تواريخ أيام العمل المتفرقة:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', paddingRight: '2px' }}>
                    {scatteredDates.map((dateVal, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="date"
                          className="form-control"
                          value={dateVal}
                          onChange={e => {
                            const newDates = [...scatteredDates];
                            newDates[idx] = e.target.value;
                            setScatteredDates(newDates);
                          }}
                          style={{ height: '36px', borderRadius: '8px', fontSize: '0.82rem', flex: 1, textAlign: 'right' }}
                        />
                        {scatteredDates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setScatteredDates(scatteredDates.filter((_, i) => i !== idx))}
                            className="btn btn-icon btn-secondary"
                            style={{ width: '36px', height: '36px', padding: 0, color: 'var(--status-danger)' }}
                          >
                            <Icons.Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setScatteredDates([...scatteredDates, ''])}
                    className="btn btn-secondary btn-sm"
                    style={{ height: '30px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', borderStyle: 'dashed' }}
                  >
                    <Icons.Plus size={14} />
                    <span>إضافة تاريخ عمل آخر</span>
                  </button>
                </div>
              )}

              {/* ملخص المستحقات */}
              <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>إجمالي عدد الأيام:</span>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>{workingDaysCount} يوم عمل</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>إجمالي المستحق (ريال سعودي):</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--status-success)' }} className="en-digits">
                    {calculatedTotalDue.toLocaleString('en-US')} ريال
                  </strong>
                </div>
              </div>

            </div>
          )}

          {/* B. حقول العميل */}
          {bookingType === 'client' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  السعر / قيمة الفاتورة:
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <input
                    type="text"
                    className="form-control en-digits"
                    placeholder="0 (اختياري)"
                    value={totalPrice}
                    onChange={e => setTotalPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                    style={{ 
                      height: '40px', 
                      borderTopRightRadius: '10px', 
                      borderBottomRightRadius: '10px',
                      borderTopLeftRadius: '0px', 
                      borderBottomLeftRadius: '0px', 
                      fontSize: '0.86rem', 
                      textAlign: 'left', 
                      direction: 'ltr',
                      flex: 1,
                      borderLeft: 'none'
                    }}
                  />
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)', 
                    borderTopLeftRadius: '10px', 
                    borderBottomLeftRadius: '10px', 
                    borderTopRightRadius: '0px', 
                    borderBottomRightRadius: '0px', 
                    padding: '0 12px', 
                    fontSize: '0.76rem', 
                    color: 'var(--text-muted)', 
                    fontWeight: 900,
                    userSelect: 'none'
                  }}>
                    ريال سعودي
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  رقم الفاتورة:
                </label>
                <input
                  type="text"
                  className="form-control en-digits"
                  placeholder="INV-xxxx"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'left', direction: 'ltr' }}
                />
              </div>
            </div>
          )}

          {/* C. حقول الشركة */}
          {bookingType === 'company' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    قيمة الاتفاق المالي:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      className="form-control en-digits"
                      placeholder="0 (اختياري)"
                      value={totalPrice}
                      onChange={e => setTotalPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                      style={{ 
                        height: '40px', 
                        borderTopRightRadius: '10px', 
                        borderBottomRightRadius: '10px',
                        borderTopLeftRadius: '0px', 
                        borderBottomLeftRadius: '0px', 
                        fontSize: '0.86rem', 
                        textAlign: 'left', 
                        direction: 'ltr',
                        flex: 1,
                        borderLeft: 'none'
                      }}
                    />
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      backgroundColor: 'var(--bg-main)', 
                      border: '1px solid var(--border-color)', 
                      borderTopLeftRadius: '10px', 
                      borderBottomLeftRadius: '10px', 
                      borderTopRightRadius: '0px', 
                      borderBottomRightRadius: '0px', 
                      padding: '0 12px', 
                      fontSize: '0.76rem', 
                      color: 'var(--text-muted)', 
                      fontWeight: 900,
                      userSelect: 'none'
                    }}>
                      ريال سعودي
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>رقم الفاتورة:</label>
                  <input
                    type="text"
                    className="form-control en-digits"
                    placeholder="INV-xxxx"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'left', direction: 'ltr' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>حالة الفاتورة:</label>
                <select
                  className="form-control"
                  value={invoiceStatus}
                  onChange={e => setInvoiceStatus(e.target.value)}
                  style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', padding: '0 10px', direction: 'rtl', textAlign: 'right', unicodeBidi: 'plaintext' }}
                >
                  <option value="غير مسدد">❌ غير مسددة</option>
                  <option value="جزئي">🟡 مدفوعة جزئيًا</option>
                  <option value="مسدد">✅ مدفوعة بالكامل</option>
                </select>
              </div>
            </div>
          )}

          {/* 11. ملاحظات أو تعليمات خاصة */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ملاحظات أو تعليمات خاصة:</label>
            <textarea
              className="form-control"
              placeholder="أي تعليمات أو تفاصيل إضافية حول التغطية..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              style={{ borderRadius: '10px', fontSize: '0.84rem', resize: 'vertical', direction: 'rtl', textAlign: 'right', unicodeBidi: 'plaintext' }}
            />
          </div>

        </div>

        {/* 12. Footer Save Button */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', backgroundColor: 'var(--bg-card)', width: '100%' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!clientName.trim() && !photographerName.trim()}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '10px',
              fontSize: '0.94rem',
              fontWeight: 950,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: (clientName.trim() || photographerName.trim()) ? 'pointer' : 'not-allowed',
              opacity: (clientName.trim() || photographerName.trim()) ? 1 : 0.6,
              backgroundColor: getThemeColor(),
              borderColor: getThemeColor()
            }}
          >
            <Icons.Save size={18} />
            <span>{isEditMode ? 'حفظ التعديلات 💾' : 'حفظ وتأكيد الحجز 💾'}</span>
          </button>
        </div>

        {/* Device Contacts Fallback Modal for iPhone / Safari / Desktop */}
        <DeviceContactsFallbackModal
          isOpen={fallbackModalState.isOpen}
          targetType={fallbackModalState.targetType}
          initialName={fallbackModalState.targetType === 'client' ? clientName : photographerName}
          initialPhone={fallbackModalState.targetType === 'client' ? clientPhone : photographerPhone}
          onClose={() => setFallbackModalState({ isOpen: false, targetType: 'client' })}
          onSelectContact={handleFallbackContactSelected}
          systemContacts={fallbackModalState.targetType === 'client' ? clients : availablePhotographers}
        />

      </div>
    </div>
  );
};

export default BookingFormModal;
