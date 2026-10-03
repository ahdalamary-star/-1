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

  // Default to 'freelancer' first, as requested: 1. ظپط±ظٹظ„ط§ظ†ط³ط±, 2. ط¹ظ…ظٹظ„, 3. ط´ط±ظƒط©
  const [bookingType, setBookingType] = useState('freelancer'); // 'freelancer' | 'client' | 'company' | 'partnership'
  const [entitySearch, setEntitySearch] = useState('');
  const [entityPhone, setEntityPhone] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);

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
      setEntitySearch(name);
      setEntityPhone(phone);
    } else {
      setClientName(name);
      setClientPhone(phone);
      setSelectedClient(contact);
      setEntitySearch(name);
      setEntityPhone(phone);
    }
  };

  const handleClearClient = () => {
    setClientName('');
    setClientPhone('');
    setSelectedClient(null);
    if (bookingType === 'client' || bookingType === 'company') {
      setEntitySearch('');
      setEntityPhone('');
    }
  };

  const handleClearPhotographer = () => {
    setPhotographerName('');
    setPhotographerPhone('');
    setSelectedPhotographer(null);
    if (bookingType === 'freelancer') {
      setEntitySearch('');
      setEntityPhone('');
    }
  };
  const [bookingDate, setBookingDate] = useState('');
  const [category, setCategory] = useState('ط²ظپط§ظپ');
  const [customCategory, setCustomCategory] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [coveragePeriod, setCoveragePeriod] = useState('طµط¨ط§ط­ظ‹ط§');
  const [isAllDay, setIsAllDay] = useState(false);
  const [attendanceTime, setAttendanceTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [status, setStatus] = useState('ظ…ط¤ظƒط¯');
  const [notes, setNotes] = useState('');
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [savedBooking, setSavedBooking] = useState(null);

  // States for Financials
  const [totalPrice, setTotalPrice] = useState(''); // Client price / Company price / Partnership price
  const [invoiceNumber, setInvoiceNumber] = useState(''); // Client / Company invoice
  const [invoiceStatus, setInvoiceStatus] = useState('ط؛ظٹط± ظ…ط³ط¯ط¯'); // Company invoice status
  const [partnershipPercentage, setPartnershipPercentage] = useState(''); // Partnership percentage

  // States for Freelancer
  const [freelancerMode, setFreelancerMode] = useState('scattered'); // 'scattered' | 'consecutive'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [workingDaysCount, setWorkingDaysCount] = useState(1);
  const [scatteredDates, setScatteredDates] = useState(['']); // array of scattered dates

  const dropdownRef = useRef(null);
  const phoneDropdownRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categories = [
    'ط²ظپط§ظپ',
    'ط²ظˆط§ط¬',
    'ظ…ط¤طھظ…ط±',
    'ظپط¹ط§ظ„ظٹط©',
    'ط¬ظ„ط³ط© طھطµظˆظٹط±',
    'ط¬ظ„ط³ط© طھطµظˆظٹط± ط¨ظˆط±طھط±ظٹظ‡',
    'طھط؛ط·ظٹط© ط¥ط¹ظ„ط§ظ…ظٹط©',
    'طھطµظˆظٹط± ظ…ظ†طھط¬ط§طھ',
    'طھطµظˆظٹط± ط£ط·ط¹ظ…ط©',
    'طھطµظˆظٹط± ط¹ظ‚ط§ط±ط§طھ',
    'طھطµظˆظٹط± ظ…ظ†ط§ط³ط¨ط§طھ',
    'طھطµظˆظٹط± طھط¬ط§ط±ظٹ',
    'طھطµظˆظٹط± ظ…ط­طھظˆظ‰',
    'طھطµظˆظٹط± ط¥ط¹ظ„ط§ظ†ظٹ',
    'ظپظٹط¯ظٹظˆ',
    'ط¨ط« ظ…ط¨ط§ط´ط±',
    'طھطµظˆظٹط± ظˆط¨ط« ظ…ط¨ط§ط´ط±',
    'ط£ط®ط±ظ‰'
  ];

  // Initialize form defaults when opened or when editingBooking changes
  useEffect(() => {
    if (isBookingFormOpen) {
      // 1. Check if returning from Contacts with an in-progress draft
      if (window.bookingDraft) {
        const d = window.bookingDraft;
        setBookingType(d.bookingType || 'freelancer');
        setCategory(d.category || 'ط²ظپط§ظپ');
        setCustomCategory(d.customCategory || '');
        setBookingDate(d.bookingDate || '');
        setCoveragePeriod(d.coveragePeriod || 'طµط¨ط§ط­ظ‹ط§');
        setIsAllDay(Boolean(d.isAllDay));
        setAttendanceTime(d.attendanceTime || '');
        setLocation(d.location || '');
        setLocationUrl(d.locationUrl || '');
        setStatus(d.status || 'ظ…ط¤ظƒط¯');
        setNotes(d.notes || '');
        setTotalPrice(d.totalPrice || '');
        setInvoiceNumber(d.invoiceNumber || '');
        setInvoiceStatus(d.invoiceStatus || 'ط؛ظٹط± ظ…ط³ط¯ط¯');
        setPartnershipPercentage(d.partnershipPercentage || '');
        setFreelancerMode(d.freelancerMode || 'scattered');
        setStartDate(d.startDate || '');
        setEndDate(d.endDate || '');
        setDailyRate(d.dailyRate || '');
        setWorkingDaysCount(d.workingDaysCount || 1);
        setScatteredDates(d.scatteredDates || ['']);
        if (d.editingBooking) {
          setEditingBooking(d.editingBooking);
        }

        if (window.prefilledEntity) {
          const ent = window.prefilledEntity;
          if (ent.type && ['freelancer', 'client', 'company'].includes(ent.type)) {
            setBookingType(ent.type);
          }
          setEntitySearch(ent.name || '');
          setEntityPhone(ent.phone || '');
          setSelectedEntity(ent);
          window.prefilledEntity = null;
        } else {
          setEntitySearch(d.entitySearch || '');
          setEntityPhone(d.entityPhone || '');
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

        const name = bType === 'freelancer' ? (pName || cName) : (cName || pName);
        setEntitySearch(name);
        setEntityPhone(bType === 'freelancer' ? (pPhone || cPhone) : (cPhone || pPhone));
        
        const dateVal = b.date || b.startDate || '';
        setBookingDate(dateVal);
        
        const cat = b.category || b.coverageType || 'ط²ظپط§ظپ';
        if (categories.includes(cat)) {
          setCategory(cat);
          setCustomCategory('');
        } else if (cat === 'طھطµظˆظٹط± ظ…ظ†ط§ط³ط¨ط©') {
          setCategory('طھطµظˆظٹط± ظ…ظ†ط§ط³ط¨ط§طھ');
          setCustomCategory('');
        } else if (cat === 'ط¹ظ‚ط§ط±') {
          setCategory('طھطµظˆظٹط± ط¹ظ‚ط§ط±ط§طھ');
          setCustomCategory('');
        } else if (cat === 'ظ…ظ†طھط¬ط§طھ') {
          setCategory('طھطµظˆظٹط± ظ…ظ†طھط¬ط§طھ');
          setCustomCategory('');
        } else {
          setCategory('ط£ط®ط±ظ‰');
          setCustomCategory(cat);
        }
        
        setIsAllDay(Boolean(b.isAllDay));
        const period = (b.startTime?.includes('ظ…ط³ط§ط،') || b.endTime?.includes('ظ…ط³ط§ط،')) ? 'ظ…ط³ط§ط،ظ‹' : 'طµط¨ط§ط­ظ‹ط§';
        setCoveragePeriod(period);
        setAttendanceTime(b.attendanceTime || '');
        setLocation(b.hallName || b.location || '');
        setLocationUrl(b.locationUrl || b.googleMapsUrl || '');
        setStatus(b.status || 'ظ…ط¤ظƒط¯');
        setNotes(b.notes || '');
        
        setTotalPrice(b.totalPrice !== undefined && b.totalPrice !== null ? String(b.totalPrice) : '');
        setInvoiceNumber(b.invoiceNumber || '');
        setInvoiceStatus(b.paymentStatus || 'ط؛ظٹط± ظ…ط³ط¯ط¯');
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
        setCoveragePeriod(hour < 12 ? 'طµط¨ط§ط­ظ‹ط§' : 'ظ…ط³ط§ط،ظ‹');
        setIsAllDay(false);
        setAttendanceTime('');
        setBookingDate(selectedDateForBooking || todayStr);
        setCategory('ط²ظپط§ظپ');
        setCustomCategory('');
        setLocation('');
        setLocationUrl('');
        setStatus('ظ…ط¤ظƒط¯');
        setNotes('');
        setSavedBooking(null);

        // Financials reset
        setTotalPrice('');
        setInvoiceNumber('');
        setInvoiceStatus('ط؛ظٹط± ظ…ط³ط¯ط¯');
        setPartnershipPercentage('');

        // Freelancer reset
        setFreelancerMode('scattered');
        setStartDate(selectedDateForBooking || todayStr);
        setEndDate(selectedDateForBooking || todayStr);
        setDailyRate('');
        setWorkingDaysCount(1);
        setScatteredDates([selectedDateForBooking || todayStr]);

        // Support Cooperation Log prefilled redirect
        if (window.prefilledEntity) {
          const ent = window.prefilledEntity;
          setBookingType(ent.type);
          setEntitySearch(ent.name);
          setEntityPhone(ent.phone || '');
          setSelectedEntity({
            id: ent.id,
            name: ent.name,
            phone: ent.phone,
            email: ent.email,
            monthlyAccount: ent.monthlyAccount
          });
          window.prefilledEntity = null; // consume it
        } else {
          setBookingType('freelancer');
          setEntitySearch('');
          setEntityPhone('');
          setSelectedEntity(null);
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

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(e.target)) {
        setShowPhoneSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!isBookingFormOpen) return null;

  // Navigate directly to dedicated contacts section while preserving current booking draft
  const handleNavigateToContacts = (prefillQuery = '') => {
    window.bookingDraft = {
      bookingType,
      category,
      customCategory,
      bookingDate,
      coveragePeriod,
      isAllDay,
      attendanceTime,
      location,
      locationUrl,
      status,
      notes,
      totalPrice,
      invoiceNumber,
      invoiceStatus,
      partnershipPercentage,
      freelancerMode,
      startDate,
      endDate,
      dailyRate,
      workingDaysCount,
      scatteredDates,
      editingBooking,
      entitySearch,
      entityPhone
    };
    window.pendingContactSearch = prefillQuery || entityPhone || entitySearch;
    window.returnToBooking = true;
    setShowSuggestions(false);
    setShowPhoneSuggestions(false);
    setIsBookingFormOpen(false);
    if (setActiveTab) {
      setActiveTab('clients');
    }
  };

  const handleEntitySearchChange = (val) => {
    setEntitySearch(val);
    setSelectedEntity(null);
    setShowSuggestions(true);
  };

  const handlePhoneChange = (val) => {
    setEntityPhone(val);
    setShowPhoneSuggestions(true);
  };

  // Contacts directory is the single source of truth
  const getUnifiedContactList = () => {
    return allContacts && allContacts.length > 0 ? allContacts : [
      ...(freelancers || []).map(f => ({ ...f, type: 'freelancer' })),
      ...(clients || []).map(c => ({ ...c, type: 'client' })),
      ...(companies || []).map(cp => ({ ...cp, type: 'company' }))
    ];
  };

  // Autocomplete by contact name or phone
  const getSuggestions = () => {
    const q = entitySearch.toLowerCase().trim();
    if (!q) return [];
    
    const list = getUnifiedContactList();
    const digitsOnly = q.replace(/[^\d+]/g, '');

    return list.filter(c => {
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const cDigits = (c.phone || '').replace(/[^\d+]/g, '');
      const matchPhone = digitsOnly ? cDigits.includes(digitsOnly) : (c.phone && c.phone.includes(q));
      return matchName || matchPhone;
    }).slice(0, 6);
  };

  // Autocomplete for phone input by phone or name
  const getPhoneSuggestions = () => {
    const q = entityPhone.toLowerCase().trim();
    if (!q) return [];

    const list = getUnifiedContactList();
    const digitsOnly = q.replace(/[^\d+]/g, '');

    return list.filter(c => {
      const cDigits = (c.phone || '').replace(/[^\d+]/g, '');
      const matchPhone = digitsOnly ? cDigits.includes(digitsOnly) : (c.phone && c.phone.includes(q));
      const matchName = c.name && c.name.toLowerCase().includes(q);
      return matchPhone || matchName;
    }).slice(0, 6);
  };

  const handleSelectEntity = (ent) => {
    setSelectedEntity(ent);
    setEntitySearch(ent.name || '');
    if (ent.phone) {
      setEntityPhone(ent.phone);
    }
    if (ent.type && ['freelancer', 'client', 'company'].includes(ent.type)) {
      setBookingType(ent.type);
    }
    setShowSuggestions(false);
    setShowPhoneSuggestions(false);
  };

  const handleSave = () => {
    const name = clientName.trim() || photographerName.trim() || entitySearch.trim();
    if (!name) {
      alert('يرجى اختيار العميل أو المصور لإتمام الحجز');
      return;
    }

    const finalCategory = category === 'ط£ط®ط±ظ‰' && customCategory.trim()
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
      startTime: isAllDay ? 'ط·ظˆط§ظ„ ط§ظ„ظٹظˆظ…' : coveragePeriod,
      endTime: isAllDay ? 'ط·ظˆط§ظ„ ط§ظ„ظٹظˆظ…' : coveragePeriod,
      isAllDay,
      attendanceTime: attendanceTime || '',
      location: location.trim(),
      hallName: location.trim(),
      locationUrl: locationUrl.trim() ? (locationUrl.trim().startsWith('http') ? locationUrl.trim() : `https://${locationUrl.trim()}`) : '',
      googleMapsUrl: locationUrl.trim() ? (locationUrl.trim().startsWith('http') ? locationUrl.trim() : `https://${locationUrl.trim()}`) : '',
      status: status || 'ظ…ط¤ظƒط¯',
      notes: notes || '',
      deposit: editingBooking ? editingBooking.deposit : null,
      paidAmount: editingBooking ? (editingBooking.paidAmount || 0) : 0,
      teamMemberIds: editingBooking ? (editingBooking.teamMemberIds || []) : [],
      equipmentIds: editingBooking ? (editingBooking.equipmentIds || []) : []
    };

    // Populate entity metadata with both Client & Photographer
    bookingData.clientName = clientName.trim() || (bookingType === 'client' ? name : '');
    bookingData.clientPhone = clientPhone.trim() || (bookingType === 'client' ? (entityPhone || '') : '');
    bookingData.clientId = selectedClient?.id || null;

    bookingData.freelancerName = photographerName.trim() || (bookingType === 'freelancer' ? name : '');
    bookingData.freelancerPhone = photographerPhone.trim() || (bookingType === 'freelancer' ? (entityPhone || '') : '');
    bookingData.freelancerId = selectedPhotographer?.id || null;
    bookingData.assignedPhotographer = bookingData.freelancerName;

    bookingData.contactPhone = clientPhone || photographerPhone || entityPhone || '';
    bookingData.phone = clientPhone || photographerPhone || entityPhone || '';
    bookingData.contactName = name;

    if (selectedEntity) {
      if (bookingType === 'client') {
        bookingData.clientId = selectedEntity.id;
        bookingData.clientName = selectedEntity.name;
        bookingData.clientPhone = entityPhone || selectedEntity.phone || '';
        bookingData.clientEmail = selectedEntity.email || '';
        bookingData.companyName = selectedEntity.companyName || '';
      } else if (bookingType === 'freelancer') {
        bookingData.freelancerId = selectedEntity.id;
        bookingData.freelancerName = selectedEntity.name;
        bookingData.freelancerPhone = entityPhone || selectedEntity.phone || '';
        bookingData.clientPhone = entityPhone || selectedEntity.phone || '';
        bookingData.freelancerEmail = selectedEntity.email || '';
        bookingData.isMonthlyAccount = selectedEntity.monthlyAccount || false;
      } else if (bookingType === 'company' || bookingType === 'partnership') {
        bookingData.companyId = selectedEntity.id;
        bookingData.companyName = selectedEntity.name;
        bookingData.contactPerson = selectedEntity.contactPerson || '';
        bookingData.contactPhone = entityPhone || selectedEntity.phone || '';
        bookingData.clientPhone = entityPhone || selectedEntity.phone || '';
        bookingData.companyEmail = selectedEntity.email || '';
      }
    } else {
      // Custom / Device Contact name & phone creation
      if (bookingType === 'client') {
        bookingData.clientName = name;
        bookingData.clientPhone = entityPhone || '';
      } else if (bookingType === 'freelancer') {
        bookingData.freelancerName = name;
        bookingData.freelancerPhone = entityPhone || '';
        bookingData.clientPhone = entityPhone || '';
        bookingData.isMonthlyAccount = false;
      } else if (bookingType === 'company' || bookingType === 'partnership') {
        bookingData.companyName = name;
        bookingData.contactPhone = entityPhone || '';
        bookingData.clientPhone = entityPhone || '';
      }

      // Ensure new contact is added to the unified contacts directory as single source of truth
      if (entityPhone && name && addContact) {
        const existing = (allContacts || []).find(c => 
          (c.phone && c.phone.replace(/[^\d+]/g, '') === entityPhone.replace(/[^\d+]/g, '')) ||
          (c.name && c.name.trim().toLowerCase() === name.trim().toLowerCase())
        );
        if (!existing) {
          addContact({
            name,
            phone: entityPhone,
            role: bookingType === 'freelancer' ? 'ظ…طµظˆط± / ظپط±ظٹظ„ط§ظ†ط³ط±' : (bookingType === 'company' ? 'ط´ط±ظƒط© ط´ط±ظٹظƒط©' : 'ط¹ظ…ظٹظ„'),
            type: bookingType
          });
        }
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
      bookingData.paymentStatus = invoiceStatus || 'ط؛ظٹط± ظ…ط³ط¯ط¯';
      
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
              {isEditMode ? 'طھظ… ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ط¨ظ†ط¬ط§ط­ âœ“' : 'طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ط­ط¬ط² ط¨ظ†ط¬ط§ط­ âœ“'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              ط±ظ‚ظ… ط§ظ„ط­ط¬ط² ط§ظ„ظ…ط±ط¬ط¹ظٹ: <strong>{formatBookingNumber(savedBooking.bookingNumber)}</strong>
            </p>
            <p style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
              {savedBooking.title}
            </p>
            {bookingType === 'freelancer' && (
              <p style={{ fontSize: '0.76rem', color: 'var(--status-success)', fontWeight: 800, marginTop: '4px' }}>
                ط¬ط¯ظˆظ„ط© {workingDaysCount} ظٹظˆظ… ط¹ظ…ظ„ ط¨ط¥ط¬ظ…ط§ظ„ظٹ ظ…ط³طھط­ظ‚: {calculatedTotalDue.toLocaleString('en-US')} ط±ظٹط§ظ„.
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
              <span>ظپطھط­ ط§ظ„ط­ط¬ط² ًں‘پï¸ڈ</span>
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
              <span>ط¥ط؛ظ„ط§ظ‚</span>
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
          overflow: 'hidden'
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
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Zap size={18} style={{ color: getThemeColor() }} />
            <span>{isEditMode ? 'âœڈï¸ڈ طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط­ط¬ط²' : '+ ط­ط¬ط² ط³ط±ظٹط¹ ظ„ظ„ط®ط¶ظˆط¹ ظ„ظ„ط¬ط¯ظˆظ„ط©'}</span>
          </h3>
          <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => { setIsBookingFormOpen(false); if (setEditingBooking) setEditingBooking(null); }}>
            <Icons.X size={18} />
          </button>
        </div>

        {/* Form Body Scrollable Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '4px', paddingRight: '4px', marginBottom: '8px' }}>

          {/* 1. Entity type tab selector - Requirement 1: Swap Place of Client with Freelancer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>طھطµظ†ظٹظپ ط§ظ„ط­ط¬ط² ظˆط§ظ„طھط¹ط§ظ…ظ„:</label>
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
                ًں‘¤ ظپط±ظٹظ„ط§ظ†ط³ط±
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
                ًں“· ط¹ظ…ظٹظ„
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
                ًںڈ¢ ط´ط±ظƒط©
              </button>
            </div>
          </div>

          {/* 2. Device Contacts: Client & Photographer Fields (Screens 1, 4, 9, 10, 11, 12) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            {/* العميل (Client) */}
            <ContactField
              label={bookingType === 'company' ? 'اسم الشركة / العميل:' : 'العميل:'}
              roleType="client"
              value={clientName}
              phone={clientPhone}
              placeholder="اختر العميل"
              onClear={handleClearClient}
              onRequestPicker={(role, action) => handleRequestPicker(role, action)}
            />

            {/* المصور (Photographer / Freelancer) */}
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

          {/* 3. Date selection (shown for non-freelancer types, or base date) */}
          {bookingType !== 'freelancer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>طھط§ط±ظٹط® ط§ظ„طھط؛ط·ظٹط© / ط§ظ„ط­ط¬ط²:</label>
              <input
                type="date"
                className="form-control"
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'right' }}
              />
            </div>
          )}

          {/* 4. Category / Booking Type dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ظ†ظˆط¹ ط§ظ„ط­ط¬ط²:</label>
            <select
              className="form-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', padding: '0 10px' }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {category === 'ط£ط®ط±ظ‰' && (
              <input
                type="text"
                className="form-control"
                placeholder="ط§ظƒطھط¨ ظ†ظˆط¹ ط§ظ„ط­ط¬ط² ط§ظ„ظ…ط®طµطµ..."
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                style={{ height: '38px', borderRadius: '8px', fontSize: '0.82rem', marginTop: '4px' }}
              />
            )}
          </div>

          {/* Time Picker Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', margin: 0 }}>طھظˆظ‚ظٹطھ ط§ظ„طھط؛ط·ظٹط©:</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-main)', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={e => setIsAllDay(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--primary-color)' }}
                />
                <span>ط·ظˆط§ظ„ ط§ظ„ظٹظˆظ… (ظ…ظ‡ظ…ط© ظ…ظ…طھط¯ط©) ًں“…</span>
              </label>
            </div>

            {!isAllDay && (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setCoveragePeriod('طµط¨ط§ط­ظ‹ط§')}
                  className={`btn ${coveragePeriod === 'طµط¨ط§ط­ظ‹ط§' ? 'btn-primary' : 'btn-secondary'}`}
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
                  âک€ï¸ڈ طµط¨ط§ط­ظ‹ط§
                </button>
                <button
                  type="button"
                  onClick={() => setCoveragePeriod('ظ…ط³ط§ط،ظ‹')}
                  className={`btn ${coveragePeriod === 'ظ…ط³ط§ط،ظ‹' ? 'btn-primary' : 'btn-secondary'}`}
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
                  ًںŒ™ ظ…ط³ط§ط،ظ‹
                </button>
              </div>
            )}
          </div>

          {/* Attendance Time Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ظˆظ‚طھ ط§ظ„ط­ط¶ظˆط± (ط§ط®طھظٹط§ط±ظٹ):</label>
            <AttendanceTimePicker
              value={attendanceTime}
              onChange={setAttendanceTime}
              placeholder="ط§ط®طھط± ظˆظ‚طھ ط§ظ„ط­ط¶ظˆط± âڈ° (ظ…ظ† 7:00 طµ ط¥ظ„ظ‰ 12:00 طµ)"
            />
          </div>

          {/* ط§ط³ظ… ط§ظ„ظ‚ط§ط¹ط© & ط±ط§ط¨ط· ظ…ظˆظ‚ط¹ ط§ظ„ظ‚ط§ط¹ط© */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ط§ط³ظ… ط§ظ„ظ‚ط§ط¹ط©:</label>
              <input
                type="text"
                className="form-control"
                placeholder="ط§ط³ظ… ط§ظ„ظ‚ط§ط¹ط© (ط§ط®طھظٹط§ط±ظٹ)"
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ط±ط§ط¨ط· ظ…ظˆظ‚ط¹ ط§ظ„ظ‚ط§ط¹ط©:</label>
              <input
                type="url"
                className="form-control en-digits"
                placeholder="ط±ط§ط¨ط· ظ…ظˆظ‚ط¹ ط§ظ„ظ‚ط§ط¹ط© (ط§ط®طھظٹط§ط±ظٹ)"
                value={locationUrl}
                onChange={e => setLocationUrl(e.target.value)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', textAlign: 'left', direction: 'ltr' }}
              />
            </div>
          </div>

          {/* Status Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ط­ط§ظ„ط© ط§ظ„ط­ط¬ط²:</label>
            <select
              className="form-control"
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', padding: '0 8px' }}
            >
              <option value="ظ…ط¤ظƒط¯">ظ…ط¤ظƒط¯</option>
              <option value="ط¨ط§ظ†طھط¸ط§ط± ط§ظ„طھط£ظƒظٹط¯">ط¨ط§ظ†طھط¸ط§ط± ط§ظ„طھط£ظƒظٹط¯</option>
              <option value="ط¬ط§ط±ظٹ ط§ظ„طھظ†ظپظٹط°">ط¬ط§ط±ظٹ ط§ظ„طھظ†ظپظٹط°</option>
              <option value="ظ…ظƒطھظ…ظ„">ظ…ظƒطھظ…ظ„</option>
              <option value="ظ…ظ„ط؛ظٹ">ظ…ظ„ط؛ظٹ</option>
            </select>
          </div>

          {/* â”€â”€â”€ DYNAMIC FINANCIAL & SPECIFIC FIELDS â”€â”€â”€ */}
          
          {/* A. FREELANCER FIELDS */}
          {bookingType === 'freelancer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
              
              {/* Mode selection: Scattered vs Consecutive */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ظ†ظˆط¹ ط¬ط¯ظˆظ„ط© ط§ظ„ط¹ظ…ظ„ ظ„ظ„ظپط±ظٹظ„ط§ظ†ط³ط±:</label>
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
                    ًں“† ط£ظٹط§ظ… ظ…طھظپط±ظ‚ط©
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
                    ًں“… ط£ظٹط§ظ… ظ…طھطھط§ظ„ظٹط©
                  </button>
                </div>
              </div>

              {/* Daily Rate Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  ط³ط¹ط± ط§ظ„ظٹظˆظ…:
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <input
                    type="text"
                    className="form-control en-digits"
                    placeholder="0 (ط§ط®طھظٹط§ط±ظٹ)"
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
                    ط±ظٹط§ظ„ / ظٹظˆظ…
                  </span>
                </div>
              </div>

              {/* Consecutive mode dates */}
              {freelancerMode === 'consecutive' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>طھط§ط±ظٹط® ط§ظ„ط¨ط¯ط§ظٹط©:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'right' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>طھط§ط±ظٹط® ط§ظ„ظ†ظ‡ط§ظٹط©:</label>
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

              {/* Scattered mode dates */}
              {freelancerMode === 'scattered' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)' }}>طھظˆط§ط±ظٹط® ط£ظٹط§ظ… ط§ظ„ط¹ظ…ظ„ ط§ظ„ظ…طھظپط±ظ‚ط©:</span>
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
                    <span>ط¥ط¶ط§ظپط© طھط§ط±ظٹط® ط¹ظ…ظ„ ط¢ط®ط±</span>
                  </button>
                </div>
              )}

              {/* Total due summary card */}
              <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ط¥ط¬ظ…ط§ظ„ظٹ ط¹ط¯ط¯ ط§ظ„ط£ظٹط§ظ…:</span>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>{workingDaysCount} ظٹظˆظ… ط¹ظ…ظ„</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط³طھط­ظ‚ (ط±ظٹط§ظ„ ط³ط¹ظˆط¯ظٹ):</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--status-success)' }} className="en-digits">
                    {calculatedTotalDue.toLocaleString('en-US')} ط±ظٹط§ظ„
                  </strong>
                </div>
              </div>

            </div>
          )}

          {/* B. CLIENT FIELDS */}
          {bookingType === 'client' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  ط§ظ„ط³ط¹ط± / ظ‚ظٹظ…ط© ط§ظ„ظپط§طھظˆط±ط©:
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <input
                    type="text"
                    className="form-control en-digits"
                    placeholder="0 (ط§ط®طھظٹط§ط±ظٹ)"
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
                    ط±ظٹط§ظ„ ط³ط¹ظˆط¯ظٹ
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  ط±ظ‚ظ… ط§ظ„ظپط§طھظˆط±ط©:
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

          {/* C. COMPANY FIELDS */}
          {bookingType === 'company' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    ظ‚ظٹظ…ط© ط§ظ„ط§طھظپط§ظ‚ ط§ظ„ظ…ط§ظ„ظٹ:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      className="form-control en-digits"
                      placeholder="0 (ط§ط®طھظٹط§ط±ظٹ)"
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
                      ط±ظٹط§ظ„ ط³ط¹ظˆط¯ظٹ
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ط±ظ‚ظ… ط§ظ„ظپط§طھظˆط±ط©:</label>
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
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ط­ط§ظ„ط© ط§ظ„ظپط§طھظˆط±ط©:</label>
                <select
                  className="form-control"
                  value={invoiceStatus}
                  onChange={e => setInvoiceStatus(e.target.value)}
                  style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', padding: '0 10px' }}
                >
                  <option value="ط؛ظٹط± ظ…ط³ط¯ط¯">â‌Œ ط؛ظٹط± ظ…ط³ط¯ط¯ط©</option>
                  <option value="ط¬ط²ط¦ظٹ">ًںں، ظ…ط¯ظپظˆط¹ط© ط¬ط²ط¦ظٹط§ظ‹</option>
                  <option value="ظ…ط³ط¯ط¯">âœ… ظ…ط¯ظپظˆط¹ط© ط¨ط§ظ„ظƒط§ظ…ظ„</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>ظ…ظ„ط§ط­ط¸ط§طھ ط£ظˆ طھط¹ظ„ظٹظ…ط§طھ ط®ط§طµط©:</label>
            <textarea
              className="form-control"
              placeholder="ط£ظٹ طھط¹ظ„ظٹظ…ط§طھ ط£ظˆ طھظپط§طµظٹظ„ ط¥ط¶ط§ظپظٹط© ط­ظˆظ„ ط§ظ„طھط؛ط·ظٹط©..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              style={{ borderRadius: '10px', fontSize: '0.84rem', resize: 'vertical' }}
            />
          </div>

        </div>

        {/* Footer Save Button fixed at the bottom */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', backgroundColor: 'var(--bg-card)', width: '100%' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!entitySearch.trim() && !clientName.trim() && !photographerName.trim()}
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
              cursor: (entitySearch.trim() || clientName.trim() || photographerName.trim()) ? 'pointer' : 'not-allowed',
              opacity: (entitySearch.trim() || clientName.trim() || photographerName.trim()) ? 1 : 0.6,
              backgroundColor: getThemeColor(),
              borderColor: getThemeColor()
            }}
          >
            <Icons.Save size={18} />
            <span>{isEditMode ? 'ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ًں’¾' : 'ط­ظپط¸ ظˆطھط£ظƒظٹط¯ ط§ظ„ط­ط¬ط² ًں’¾'}</span>
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
