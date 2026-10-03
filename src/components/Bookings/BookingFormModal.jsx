import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { formatBookingNumber, parseTime12hTo24h, parse24hToParts, generateAttendanceTimeOptions } from '../../utils/helpers';
import { AttendanceTimePicker } from '../Common/AttendanceTimePicker';
import { ContactField, DeviceContactPicker } from '../Contacts/DeviceContactPicker';

export const BookingFormModal = () => {
  const {
    isBookingFormOpen,
    setIsBookingFormOpen,
    selectedDateForBooking,
    editingBooking,
    setEditingBooking,
    addBooking,
    updateBooking,
    clients,
    freelancers,
    companies,
    contacts,
    allContacts,
    addContact,
    setSelectedBooking,
    setIsBookingDetailOpen,
    setActiveTab
  } = useApp();

  const isEditMode = Boolean(editingBooking);

  // 1. فريلانسر (الافتراضي)، 2. عميل، 3. شركة
  const [bookingType, setBookingType] = useState('freelancer'); // 'freelancer' | 'client' | 'company' | 'partnership'

  // Dedicated Device Contacts states for Client and Photographer (Screens 1-12)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const [photographerName, setPhotographerName] = useState('');
  const [photographerPhone, setPhotographerPhone] = useState('');
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);

  const [contactPickerState, setContactPickerState] = useState({
    isOpen: false,
    roleType: 'client',
    action: 'pick'
  });

  const handleRequestPicker = (roleType, action = 'pick') => {
    setContactPickerState({
      isOpen: true,
      roleType,
      action
    });
  };

  const handleContactSelected = (name, phone, contact) => {
    if (contactPickerState.roleType === 'freelancer') {
      setPhotographerName(name);
      setPhotographerPhone(phone);
      setSelectedPhotographer(contact);
    } else {
      setClientName(name);
      setClientPhone(phone);
      setSelectedClient(contact);
    }
  };

  const handleClearClient = () => {
    setClientName('');
    setClientPhone('');
    setSelectedClient(null);
  };

  const handleClearPhotographer = () => {
    setPhotographerName('');
    setPhotographerPhone('');
    setSelectedPhotographer(null);
  };

  const [bookingDate, setBookingDate] = useState('');
  const [category, setCategory] = useState('زفاف');
  const [customCategory, setCustomCategory] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [coveragePeriod, setCoveragePeriod] = useState('صباحًا');
  const [isAllDay, setIsAllDay] = useState(false);
  const [attendanceTime, setAttendanceTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [status, setStatus] = useState('مؤكد');
  const [notes, setNotes] = useState('');
  
  const [savedBooking, setSavedBooking] = useState(null);

  // States for Financials
  const [totalPrice, setTotalPrice] = useState(''); // Client price / Company price / Partnership price
  const [invoiceNumber, setInvoiceNumber] = useState(''); // Client / Company invoice
  const [invoiceStatus, setInvoiceStatus] = useState('غير مسدد'); // Company invoice status
  const [partnershipPercentage, setPartnershipPercentage] = useState(''); // Partnership percentage

  // States for Freelancer
  const [freelancerMode, setFreelancerMode] = useState('scattered'); // 'scattered' | 'consecutive'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [workingDaysCount, setWorkingDaysCount] = useState(1);
  const [scatteredDates, setScatteredDates] = useState(['']); // array of scattered dates

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // Initialize form defaults when opened or when editingBooking changes
  useEffect(() => {
    if (isBookingFormOpen) {
      // 1. Check if returning from Contacts with an in-progress draft
      if (window.bookingDraft) {
        const d = window.bookingDraft;
        setBookingType(d.bookingType || 'freelancer');
        setCategory(d.category || 'زفاف');
        setCustomCategory(d.customCategory || '');
        setBookingDate(d.bookingDate || '');
        setCoveragePeriod(d.coveragePeriod || 'صباحًا');
        setIsAllDay(Boolean(d.isAllDay));
        setAttendanceTime(d.attendanceTime || '');
        setLocation(d.location || '');
        setLocationUrl(d.locationUrl || '');
        setStatus(d.status || 'مؤكد');
        setNotes(d.notes || '');
        setTotalPrice(d.totalPrice || '');
        setInvoiceNumber(d.invoiceNumber || '');
        setInvoiceStatus(d.invoiceStatus || 'غير مسدد');
        setPartnershipPercentage(d.partnershipPercentage || '');
        setFreelancerMode(d.freelancerMode || 'scattered');
        setStartDate(d.startDate || '');
        setEndDate(d.endDate || '');
        setDailyRate(d.dailyRate || '');
        setWorkingDaysCount(d.workingDaysCount || 1);
        setScatteredDates(d.scatteredDates || ['']);
        setClientName(d.clientName || '');
        setClientPhone(d.clientPhone || '');
        setPhotographerName(d.photographerName || '');
        setPhotographerPhone(d.photographerPhone || '');
        if (d.editingBooking) {
          setEditingBooking(d.editingBooking);
        }

        window.bookingDraft = null;
        window.returnToBooking = null;
        return;
      }

      if (editingBooking) {
        // Edit mode prefill
        const b = editingBooking;
        const bType = b.bookingType || (b.freelancerName ? 'freelancer' : (b.clientName ? 'client' : 'company'));
        setBookingType(bType);
        
        const cName = b.clientName || (bType === 'client' ? (b.title?.split(' - ')[1] || b.title || '') : '');
        const cPhone = b.clientPhone || (bType === 'client' ? (b.contactPhone || b.phone || '') : '');
        setClientName(cName);
        setClientPhone(cPhone);

        const pName = b.freelancerName || b.assignedPhotographer || (bType === 'freelancer' ? (b.title?.split(' - ')[1] || b.title || '') : '');
        const pPhone = b.freelancerPhone || (bType === 'freelancer' ? (b.contactPhone || b.phone || '') : '');
        setPhotographerName(pName);
        setPhotographerPhone(pPhone);
        
        const dateVal = b.date || b.startDate || '';
        setBookingDate(dateVal);
        
        const cat = b.category || b.coverageType || 'زفاف';
        if (categories.includes(cat)) {
          setCategory(cat);
          setCustomCategory('');
        } else if (cat === 'تصوير مناسبة') {
          setCategory('تصوير مناسبات');
          setCustomCategory('');
        } else if (cat === 'عقار') {
          setCategory('تصوير عقارات');
          setCustomCategory('');
        } else if (cat === 'منتجات') {
          setCategory('تصوير منتجات');
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
        // Add new booking mode (Default: Freelancer tab)
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

        // Reset Contacts
        setClientName('');
        setClientPhone('');
        setSelectedClient(null);
        setPhotographerName('');
        setPhotographerPhone('');
        setSelectedPhotographer(null);

        // Financials reset
        setTotalPrice('');
        setInvoiceNumber('');
        setInvoiceStatus('غير مسدد');
        setPartnershipPercentage('');

        // Freelancer reset
        setBookingType('freelancer');
        setFreelancerMode('scattered');
        setStartDate(selectedDateForBooking || todayStr);
        setEndDate(selectedDateForBooking || todayStr);
        setDailyRate('');
        setWorkingDaysCount(1);
        setScatteredDates([selectedDateForBooking || todayStr]);

        // Support Cooperation Log prefilled redirect
        if (window.prefilledEntity) {
          const ent = window.prefilledEntity;
          if (ent.type === 'freelancer') {
            setPhotographerName(ent.name || '');
            setPhotographerPhone(ent.phone || '');
            setSelectedPhotographer(ent);
          } else {
            setClientName(ent.name || '');
            setClientPhone(ent.phone || '');
            setSelectedClient(ent);
          }
          if (ent.type && ['freelancer', 'client', 'company'].includes(ent.type)) {
            setBookingType(ent.type);
          }
          window.prefilledEntity = null; // consume it
        }
      }
    }
  }, [isBookingFormOpen, selectedDateForBooking, editingBooking]);

  // Auto calculate consecutive days
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

  // Auto calculate scattered days
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
      alert('يرجى اختيار العميل أو المصور لإتمام الحجز');
      return;
    }

    const finalCategory = category === 'أخرى' && customCategory.trim()
      ? customCategory.trim()
      : category;

    // Auto title generation
    const bookingTitle = `${finalCategory} - ${name}`;

    // Construct primary record
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

    // Populate entity metadata with both Client & Photographer
    bookingData.clientName = clientName.trim();
    bookingData.clientPhone = clientPhone.trim();
    bookingData.clientId = selectedClient?.id || null;

    bookingData.freelancerName = photographerName.trim();
    bookingData.freelancerPhone = photographerPhone.trim();
    bookingData.freelancerId = selectedPhotographer?.id || null;
    bookingData.assignedPhotographer = bookingData.freelancerName;

    bookingData.contactPhone = clientPhone || photographerPhone || '';
    bookingData.phone = clientPhone || photographerPhone || '';
    bookingData.contactName = name;

    // Ensure new contact is added to the unified contacts directory as single source of truth
    if (clientPhone && clientName && addContact) {
      const existing = (allContacts || []).find(c => 
        (c.phone && c.phone.replace(/[^\d+]/g, '') === clientPhone.replace(/[^\d+]/g, '')) ||
        (c.name && c.name.trim().toLowerCase() === clientName.trim().toLowerCase())
      );
      if (!existing) {
        addContact({
          name: clientName,
          phone: clientPhone,
          role: bookingType === 'company' ? 'شركة شريكة' : 'عميل',
          type: bookingType === 'company' ? 'company' : 'client'
        });
      }
    }

    if (photographerPhone && photographerName && addContact) {
      const existing = (allContacts || []).find(c => 
        (c.phone && c.phone.replace(/[^\d+]/g, '') === photographerPhone.replace(/[^\d+]/g, '')) ||
        (c.name && c.name.trim().toLowerCase() === photographerName.trim().toLowerCase())
      );
      if (!existing) {
        addContact({
          name: photographerName,
          phone: photographerPhone,
          role: 'مصور / فريلانسر',
          type: 'freelancer'
        });
      }
    }

    // Populate Financial fields depending on bookingType
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
      
    } else if (bookingType === 'partnership') {
      bookingData.date = bookingDate;
      bookingData.startDate = bookingDate;
      bookingData.endDate = bookingDate;
      bookingData.totalPrice = totalPrice !== '' ? Number(totalPrice) : null;
      bookingData.partnershipPercentage = partnershipPercentage !== '' ? Number(partnershipPercentage) : null;
      
    } else if (bookingType === 'freelancer') {
      bookingData.dailyRate = dailyRate !== '' ? Number(dailyRate) : null;
      bookingData.workingDaysCount = workingDaysCount;
      bookingData.freelancerMode = freelancerMode;

      // Handle consecutive vs scattered dates
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
        // Scattered dates
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

  // Render Success view screen
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
      case 'partnership': return 'var(--status-info)';
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

          {/* 2. الحقل 1: العميل (مع أيقونة 👤 وزر «+ إضافة إلى جهات الاتصال» مرة واحدة فقط) */}
          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <ContactField
              label={bookingType === 'company' ? 'اسم الشركة / العميل:' : 'العميل:'}
              roleType="client"
              value={clientName}
              phone={clientPhone}
              placeholder="اختر العميل"
              onClear={handleClearClient}
              onRequestPicker={(role, action) => handleRequestPicker(role, action)}
            />
          </div>

          {/* 3. الحقل 2: المصور (مع أيقونة 👤 وزر «+ إضافة إلى جهات الاتصال» مرة واحدة فقط) */}
          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <ContactField
              label="المصور:"
              roleType="freelancer"
              value={photographerName}
              phone={photographerPhone}
              placeholder="اختر المصور"
              onClear={handleClearPhotographer}
              onRequestPicker={(role, action) => handleRequestPicker(role, action)}
            />
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
              
              {/* اختيار نوع الجدولة: أيام متفرقة أو متتالية */}
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

              {/* إدخال سعر اليوم */}
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

              {/* بطاقة ملخص المستحقات */}
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

        {/* 12. Footer Save Button fixed at the bottom */}
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

        {/* Device Contact Picker Modal System (Screens 2, 3, 5, 6, 7, 8) */}
        <DeviceContactPicker
          isOpen={contactPickerState.isOpen}
          targetRole={contactPickerState.roleType}
          initialAction={contactPickerState.action}
          onClose={() => setContactPickerState(prev => ({ ...prev, isOpen: false }))}
          onSelectContact={handleContactSelected}
        />
      </div>
    </div>
  );
};

export default BookingFormModal;
