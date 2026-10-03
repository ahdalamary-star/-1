import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Standard vCard generator to open native "Add to Contacts" on iOS and Android.
 */
export const openDeviceAddContact = (name = '', phone = '') => {
  const cleanPhone = (phone || '').replace(/[^\d+]/g, '');
  const cleanName = (name || '').trim() || 'جهة اتصال جديدة';
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${cleanName}`,
    `TEL;TYPE=CELL:${cleanPhone}`,
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Initial sample device contacts matching the exact mockup in Screen 3.
 */
const DEFAULT_DEVICE_CONTACTS = [
  { id: 'dc-1', name: 'أحمد محمد', phone: '05 1234 5678', type: 'client' },
  { id: 'dc-2', name: 'خالد العتيبي', phone: '05 5555 1234', type: 'freelancer' },
  { id: 'dc-3', name: 'صلاح الدين', phone: '05 9876 5432', type: 'freelancer' },
  { id: 'dc-4', name: 'محمد أحمد', phone: '05 1234 5678', type: 'client' },
  { id: 'dc-5', name: 'عبدالله السبيعي', phone: '05 4444 7788', type: 'client' },
  { id: 'dc-6', name: 'فهد القحطاني', phone: '05 3333 9900', type: 'freelancer' }
];

/**
 * ContactField component rendered in BookingFormModal, Edit, and Quick Booking
 * (Screens 1, 4, 9, 10, 11, 12)
 */
export const ContactField = ({
  label,
  roleType = 'client',
  value = '',
  phone = '',
  placeholder = 'اختر الشخص',
  onClear,
  onRequestPicker,
  style = {}
}) => {
  const hasContact = Boolean(value && value.trim());

  if (hasContact) {
    // Screen 4, 9, 10, 12: Contact is selected
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--text-muted)', margin: 0 }}>
            {label}
          </label>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-main)',
            border: '1.5px solid #6366f1',
            boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.2), 0 2px 8px rgba(99, 102, 241, 0.08)',
            transition: 'all 0.2s ease',
            gap: '12px'
          }}
        >
          {/* Right: Contact Avatar & Info */}
          <div
            onClick={() => onRequestPicker && onRequestPicker(roleType, 'pick')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer', overflow: 'hidden' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                flexShrink: 0
              }}
            >
              <Icons.User size={20} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '0.94rem',
                  fontWeight: 900,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {value}
              </span>
              {phone ? (
                <span
                  className="en-digits"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#818cf8',
                    direction: 'ltr',
                    textAlign: 'right'
                  }}
                >
                  {phone}
                </span>
              ) : (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>بدون رقم هاتف</span>
              )}
            </div>
          </div>

          {/* Left: Clear button (X) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onClear) onClear();
            }}
            title="إزالة جهة الاتصال"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <Icons.X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Screen 1 & 11: Empty field with contact icon & "+ إضافة إلى جهات الاتصال"
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--text-muted)', margin: 0 }}>
        {label}
      </label>

      {/* Input row with integrated contact icon */}
      <div
        onClick={() => onRequestPicker && onRequestPicker(roleType, 'pick')}
        style={{
          height: '44px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#6366f1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          {placeholder}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onRequestPicker) onRequestPicker(roleType, 'pick');
          }}
          title="اختيار من جهات الاتصال"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#6366f1';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
            e.currentTarget.style.color = '#818cf8';
          }}
        >
          <Icons.User size={16} />
        </button>
      </div>

      {/* Screen 11: Button "+ إضافة إلى جهات الاتصال" */}
      <button
        type="button"
        onClick={() => onRequestPicker && onRequestPicker(roleType, 'add')}
        style={{
          width: '100%',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: 'rgba(99, 102, 241, 0.06)',
          border: '1px dashed rgba(99, 102, 241, 0.4)',
          color: '#818cf8',
          fontSize: '0.8rem',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '2px',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.14)';
          e.currentTarget.style.borderColor = '#6366f1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.06)';
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
        }}
      >
        <Icons.Plus size={15} />
        <span>إضافة إلى جهات الاتصال</span>
      </button>
    </div>
  );
};

/**
 * Full Device Contact Picker Modal & Workflow Component
 * Implements all 12 screens from the official UX specification.
 */
export const DeviceContactPicker = ({
  isOpen = false,
  targetRole = 'client', // 'client' | 'freelancer'
  initialAction = 'pick', // 'pick' | 'add'
  onClose,
  onSelectContact
}) => {
  const { allContacts = [], clients = [], freelancers = [], addContact } = useApp();

  // Modal Step: 'permission' | 'denied' | 'picker' | 'action_sheet' | 'add' | 'success'
  const [step, setStep] = useState('picker');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSelected, setLastSelected] = useState(null);

  // New Contact Form state
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Device-cached contacts in LocalStorage
  const [localContacts, setLocalContacts] = useState(() => {
    try {
      const saved = localStorage.getItem('lensflow_device_contacts');
      return saved ? JSON.parse(saved) : DEFAULT_DEVICE_CONTACTS;
    } catch {
      return DEFAULT_DEVICE_CONTACTS;
    }
  });

  // Handle open / action changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialAction === 'add') {
      setStep('add');
      setNewContactName('');
      setNewContactPhone('');
      return;
    }

    const permission = localStorage.getItem('lensflow_contacts_permission');
    if (permission === 'denied') {
      setStep('denied');
    } else if (permission === 'granted') {
      // Try native picker if supported
      tryNativePicker();
    } else {
      // First time: Ask permission (Screen 2)
      setStep('permission');
    }
  }, [isOpen, initialAction]);

  // Attempt standard W3C Contact Picker API (Screen 3 Native)
  const tryNativePicker = async () => {
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = await navigator.contacts.getProperties();
        const supportedProps = ['name', 'tel'].filter(p => props.includes(p));
        if (supportedProps.length > 0) {
          const results = await navigator.contacts.select(supportedProps, { multiple: false });
          if (results && results.length > 0) {
            const c = results[0];
            const name = (c.name && c.name[0]) || '';
            const phone = (c.tel && c.tel[0]) || '';
            if (name || phone) {
              handleChooseContact({ name, phone, type: targetRole });
              return;
            }
          }
        }
      } catch (err) {
        console.log('Native contact picker skipped or dismissed:', err);
      }
    }
    // Fallback to high-fidelity Device Contacts UI (Screen 3)
    setStep('picker');
  };

  // Combine all contacts
  const mergedContactsList = useMemo(() => {
    const list = [...localContacts];
    const seenPhones = new Set(list.map(c => (c.phone || '').replace(/[^\d]/g, '')));

    // Merge AppContext contacts
    const appList = [
      ...(allContacts || []),
      ...(clients || []).map(c => ({ ...c, type: 'client' })),
      ...(freelancers || []).map(f => ({ ...f, type: 'freelancer' }))
    ];

    for (const c of appList) {
      const clean = (c.phone || '').replace(/[^\d]/g, '');
      if (clean && !seenPhones.has(clean)) {
        seenPhones.add(clean);
        list.push({
          id: c.id || `app-${Math.random()}`,
          name: c.name || 'بدون اسم',
          phone: c.phone || '',
          type: c.type || (targetRole === 'freelancer' ? 'freelancer' : 'client')
        });
      }
    }

    return list;
  }, [localContacts, allContacts, clients, freelancers, targetRole]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mergedContactsList;
    const digitsOnly = q.replace(/[^\d]/g, '');

    return mergedContactsList.filter(c => {
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const cDigits = (c.phone || '').replace(/[^\d]/g, '');
      const matchPhone = digitsOnly ? cDigits.includes(digitsOnly) : (c.phone && c.phone.includes(q));
      return matchName || matchPhone;
    });
  }, [mergedContactsList, searchQuery]);

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    const groups = {};
    for (const c of filteredContacts) {
      const char = (c.name || 'أ').trim().charAt(0).toUpperCase();
      if (!groups[char]) groups[char] = [];
      groups[char].push(c);
    }
    return groups;
  }, [filteredContacts]);

  // Permission Granted
  const handleGrantPermission = () => {
    try {
      localStorage.setItem('lensflow_contacts_permission', 'granted');
    } catch {}
    tryNativePicker();
  };

  // Permission Denied
  const handleDenyPermission = () => {
    try {
      localStorage.setItem('lensflow_contacts_permission', 'denied');
    } catch {}
    setStep('denied');
  };

  // Reset permission to try again
  const handleResetPermission = () => {
    try {
      localStorage.removeItem('lensflow_contacts_permission');
    } catch {}
    setStep('permission');
  };

  // Choose a contact (Screen 8)
  const handleChooseContact = (contact) => {
    setLastSelected(contact);
    setStep('success');
  };

  // Final confirmation from Screen 8
  const handleConfirmSuccess = () => {
    if (lastSelected && onSelectContact) {
      onSelectContact(lastSelected.name, lastSelected.phone, lastSelected);
    }
    if (onClose) onClose();
  };

  // Save new contact
  const handleSaveNewContact = (e) => {
    if (e) e.preventDefault();
    const name = newContactName.trim();
    const phone = newContactPhone.trim();
    if (!name && !phone) {
      alert('يرجى إدخال اسم جهة الاتصال أو رقم الهاتف!');
      return;
    }

    const newContact = {
      id: `dc-${Date.now()}`,
      name: name || phone,
      phone: phone || '',
      type: targetRole
    };

    // Save to local device list
    const updated = [newContact, ...localContacts];
    setLocalContacts(updated);
    try {
      localStorage.setItem('lensflow_device_contacts', JSON.stringify(updated));
    } catch {}

    // Also register in AppContext contacts if available
    if (addContact) {
      try {
        addContact({
          name: newContact.name,
          phone: newContact.phone,
          role: targetRole === 'freelancer' ? 'مصور / فريلانسر' : 'عميل',
          type: targetRole
        });
      } catch {}
    }

    handleChooseContact(newContact);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        direction: 'rtl',
        fontFamily: 'Cairo, sans-serif'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card, #1e293b)',
          borderRadius: '24px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* ──────── SCREEN 2: طلب إذن الوصول إلى جهات الاتصال ──────── */}
        {step === 'permission' && (
          <div style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <Icons.User size={34} color="#818cf8" />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 950, margin: '0 0 10px 0', color: 'var(--text-main, #fff)', lineHeight: 1.4 }}>
              هل تريد السماح لـ LensFlow بالوصول إلى جهات الاتصال؟
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', margin: '0 0 26px 0', lineHeight: 1.6 }}>
              يستخدم التطبيق جهات الاتصال في جهازك لاختيار العميل أو المصور بسهولة.
            </p>

            <button
              type="button"
              onClick={handleGrantPermission}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.94rem',
                fontWeight: 900,
                cursor: 'pointer',
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; }}
            >
              السماح بالوصول
            </button>

            <button
              type="button"
              onClick={handleDenyPermission}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              ليس الآن
            </button>
          </div>
        )}

        {/* ──────── SCREEN 7: في حالة رفض الصلاحية ──────── */}
        {step === 'denied' && (
          <div style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <Icons.Lock size={32} color="#818cf8" />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 950, margin: '0 0 10px 0', color: 'var(--text-main, #fff)', lineHeight: 1.4 }}>
              لم يتم السماح بالوصول إلى جهات الاتصال
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              يمكنك السماح بالوصول من إعدادات الجهاز ثم المحاولة مرة أخرى.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button
                type="button"
                onClick={handleResetPermission}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                إعادة المحاولة والموافقة
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  color: 'var(--text-main, #fff)',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                حسناً
              </button>
            </div>
          </div>
        )}

        {/* ──────── SCREEN 3 & 6: واجهة جهات الاتصال في الهاتف ──────── */}
        {step === 'picker' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '560px', maxHeight: '80vh' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                إلغاء
              </button>

              <h4 style={{ fontSize: '1.02rem', fontWeight: 950, margin: 0, color: 'var(--text-main, #fff)' }}>
                جهات الاتصال
              </h4>

              <button
                type="button"
                onClick={() => setStep('action_sheet')}
                title="خيارات إضافية وواتساب"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  color: 'var(--text-main, #fff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Icons.Plus size={16} />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-main, #0f172a)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  padding: '0 12px',
                  height: '40px'
                }}
              >
                <Icons.Search size={16} color="var(--text-muted, #94a3b8)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="بحث"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: '0 8px',
                    fontSize: '0.86rem',
                    color: 'var(--text-main, #fff)',
                    fontFamily: 'Cairo, sans-serif'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <Icons.X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Contacts List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
              {filteredContacts.length === 0 ? (
                /* SCREEN 6: إذا لم يكن الشخص موجوداً */
                <div style={{ textAlign: 'center', padding: '36px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <Icons.Search size={24} />
                  </div>

                  <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                    لم يتم العثور على أي نتائج
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setNewContactName(searchQuery);
                        setStep('add');
                      }}
                      style={{
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        border: '1.5px solid #6366f1',
                        color: '#818cf8',
                        fontSize: '0.86rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Icons.User size={16} />
                      <span>إضافة إلى جهات الاتصال</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.open('https://wa.me/', '_blank');
                        setStep('add');
                      }}
                      style={{
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(37, 211, 102, 0.1)',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        color: '#25D366',
                        fontSize: '0.86rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Icons.MessageSquare size={16} />
                      <span>إضافة من واتساب</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                /* Contact list items grouped */
                Object.keys(groupedContacts).map((char) => (
                  <div key={char} style={{ marginBottom: '14px' }}>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 900,
                        color: '#818cf8',
                        padding: '4px 8px',
                        marginBottom: '4px'
                      }}
                    >
                      {char}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {groupedContacts[char].map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleChooseContact(c)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--bg-main, #0f172a)',
                            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-main, #0f172a)';
                            e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.05))';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                color: 'var(--text-main, #fff)',
                                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))'
                              }}
                            >
                              {c.name ? c.name.trim().charAt(0) : '👤'}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #fff)' }}>
                                {c.name}
                              </span>
                              {c.phone && (
                                <span className="en-digits" style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', direction: 'ltr', textAlign: 'right' }}>
                                  {c.phone}
                                </span>
                              )}
                            </div>
                          </div>

                          <Icons.ChevronLeft size={16} color="var(--text-muted, #94a3b8)" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions footer */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-card, #1e293b)'
              }}
            >
              <button
                type="button"
                onClick={() => setStep('action_sheet')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#25D366',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Icons.MessageSquare size={16} />
                <span>إضافة من واتساب</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('add')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818cf8',
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Icons.UserPlus size={16} />
                <span>+ إضافة جهة اتصال</span>
              </button>
            </div>
          </div>
        )}

        {/* ──────── SCREEN 5: إضافة من واتساب أو جهات الاتصال (Action Sheet) ──────── */}
        {step === 'action_sheet' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {/* Option 1: WhatsApp */}
              <div
                onClick={() => {
                  window.open('https://wa.me/', '_blank');
                  setStep('add');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(37, 211, 102, 0.08)',
                  border: '1px solid rgba(37, 211, 102, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.08)'; }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  <Icons.MessageSquare size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 900, margin: '0 0 2px 0', color: 'var(--text-main, #fff)' }}>
                    إضافة من واتساب
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
                    افتح واتساب لإضافة جهة اتصال
                  </p>
                </div>
              </div>

              {/* Option 2: Device Contacts */}
              <div
                onClick={() => {
                  setStep('picker');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'; }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  <Icons.User size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 900, margin: '0 0 2px 0', color: 'var(--text-main, #fff)' }}>
                    إضافة من جهات الاتصال
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
                    افتح جهات الاتصال في جهازك.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('picker')}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              إلغاء
            </button>
          </div>
        )}

        {/* ──────── SCREEN 6 & 11: إضافة جهة اتصال جديدة ──────── */}
        {step === 'add' && (
          <form onSubmit={handleSaveNewContact} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1.02rem', fontWeight: 950, margin: 0, color: 'var(--text-main, #fff)' }}>
                إضافة جهة اتصال جديدة
              </h4>
              <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: '50px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 800 }}>
                {targetRole === 'freelancer' ? 'مصور / فريلانسر' : 'عميل'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted, #94a3b8)' }}>
                الاسم: *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="مثال: محمد العتيبي"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                  backgroundColor: 'var(--bg-main, #0f172a)',
                  color: 'var(--text-main, #fff)',
                  padding: '0 12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'Cairo, sans-serif'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted, #94a3b8)' }}>
                رقم الهاتف / الجوال: *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: 05xxxxxxxx"
                className="en-digits"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                  backgroundColor: 'var(--bg-main, #0f172a)',
                  color: 'var(--text-main, #fff)',
                  padding: '0 12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  textAlign: 'left',
                  direction: 'ltr'
                }}
              />
            </div>

            {/* Official vCard export option to open phone's native address book */}
            <div
              onClick={() => openDeviceAddContact(newContactName, newContactPhone)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px dashed rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 800
              }}
            >
              <Icons.Smartphone size={16} />
              <span>تنزيل كبطاقة اتصال (.vcf) لفتح تطبيق جهات الاتصال في هاتفك مباشرة</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setStep('picker')}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  color: 'var(--text-main, #fff)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                رجوع
              </button>

              <button
                type="submit"
                style={{
                  flex: 2,
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
                }}
              >
                حفظ واختيار ✓
              </button>
            </div>
          </form>
        )}

        {/* ──────── SCREEN 8: بعد اختيار جهة اتصال جديدة (تم الحفظ بنجاح) ──────── */}
        {step === 'success' && lastSelected && (
          <div style={{ padding: '36px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Green Checkmark */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Icons.Check size={36} color="#ffffff" strokeWidth={3} />
            </div>

            <h3 style={{ fontSize: '1.18rem', fontWeight: 950, margin: '0 0 20px 0', color: 'var(--text-main, #fff)' }}>
              {targetRole === 'freelancer' ? 'تم إضافة المصور بنجاح' : 'تم إضافة العميل بنجاح'}
            </h3>

            {/* Selected Card preview */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '16px',
                backgroundColor: 'var(--bg-main, #0f172a)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-main, #fff)'
                  }}
                >
                  <Icons.User size={22} />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.98rem', fontWeight: 950, color: 'var(--text-main, #fff)' }}>
                    {lastSelected.name}
                  </div>
                  {lastSelected.phone && (
                    <div className="en-digits" style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', direction: 'ltr', textAlign: 'right' }}>
                      {lastSelected.phone}
                    </div>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#6366f1',
                  color: '#ffffff'
                }}
              >
                {targetRole === 'freelancer' ? 'مصور' : 'عميل'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmSuccess}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.94rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; }}
            >
              تم
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceContactPicker;
