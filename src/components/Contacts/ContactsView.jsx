import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';

export const ContactsView = () => {
  const {
    contacts,
    allContacts,
    addContact,
    updateContact,
    deleteContact,
    setIsBookingFormOpen,
    setActiveTab,
    userRole,
    currentUser
  } = useApp();

  const isSuper = userRole === 'admin' || 
                  (currentUser && (
                    currentUser.isSupervisor === true || 
                    currentUser.id === 1 || 
                    (currentUser.role && (currentUser.role.includes('مدير') || currentUser.role.includes('مشرف')))
                  ));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all'); // 'all' | 'freelancer' | 'client' | 'company' | 'contact'
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(() => {
    // If opened with prefilled contact query from booking form
    return Boolean(window.pendingContactSearch);
  });
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState(() => {
    const pending = window.pendingContactSearch || '';
    const isNum = /^[0-9+ ]+$/.test(pending);
    return {
      name: isNum ? '' : pending,
      phone: isNum ? pending : '',
      role: 'مصور / فريلانسر',
      type: 'freelancer',
      email: '',
      notes: ''
    };
  });

  const [savedContactNotice, setSavedContactNotice] = useState(null);

  // Clear pending contact search once consumed
  React.useEffect(() => {
    if (window.pendingContactSearch) {
      window.pendingContactSearch = null;
    }
  }, []);

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      role: 'مصور / فريلانسر',
      type: 'freelancer',
      email: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      phone: contact.phone || '',
      role: contact.role || contact.type || 'جهة اتصال',
      type: contact.type || 'contact',
      email: contact.email || '',
      notes: contact.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('يرجى كتابة اسم جهة الاتصال ورقم الجوال للتواصل!');
      return;
    }

    let saved = null;
    if (editingContact) {
      updateContact(editingContact.id, formData);
      saved = { ...editingContact, ...formData };
    } else {
      saved = addContact(formData);
    }

    setIsModalOpen(false);

    // If user came from booking form, notify and offer direct return
    if (window.bookingDraft || window.returnToBooking) {
      setSavedContactNotice(saved);
    }
  };

  const handleReturnToBookingWithContact = (contact) => {
    window.prefilledEntity = {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      type: contact.type === 'client' ? 'client' : (contact.type === 'company' ? 'company' : 'freelancer')
    };
    window.returnToBooking = null;
    setSavedContactNotice(null);
    if (setActiveTab) setActiveTab('bookings');
    if (setIsBookingFormOpen) setIsBookingFormOpen(true);
  };

  // Filtered contacts list
  const filteredList = useMemo(() => {
    const list = allContacts || [];
    const q = searchQuery.toLowerCase().trim();

    return list.filter(c => {
      // Type filter
      if (selectedTypeFilter !== 'all') {
        if (selectedTypeFilter === 'freelancer' && c.type !== 'freelancer' && !c.role?.includes('مصور')) return false;
        if (selectedTypeFilter === 'client' && c.type !== 'client' && !c.role?.includes('عميل')) return false;
        if (selectedTypeFilter === 'company' && c.type !== 'company' && !c.role?.includes('شركة')) return false;
        if (selectedTypeFilter === 'contact' && c.type !== 'contact' && c.type !== 'general' && c.source !== 'contacts') return false;
      }

      // Search query filter
      if (!q) return true;
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const matchPhone = c.phone && c.phone.includes(q);
      const matchRole = c.role && c.role.toLowerCase().includes(q);
      const matchEmail = c.email && c.email.toLowerCase().includes(q);

      return matchName || matchPhone || matchRole || matchEmail;
    });
  }, [allContacts, searchQuery, selectedTypeFilter]);

  const getTypeBadgeClass = (c) => {
    if (c.type === 'freelancer' || c.role?.includes('مصور')) return 'badge-success';
    if (c.type === 'client' || c.role?.includes('عميل')) return 'badge-info';
    if (c.type === 'company' || c.role?.includes('شركة')) return 'badge-warning';
    return 'badge-purple';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', direction: 'rtl' }}>
      
      {/* Notice to return to booking if newly created */}
      {savedContactNotice && (
        <div
          className="card animate-fade-in"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'var(--status-success)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'var(--status-success)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.CheckCircle2 size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 900, color: 'var(--text-main)' }}>
                تم حفظ جهة الاتصال: <strong>{savedContactNotice.name}</strong> بنجاح!
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                رقم الجوال: <strong dir="ltr">{savedContactNotice.phone}</strong> — يمكنك الآن العودة مباشرة لنموذج الحجز وتعبئة بياناته تلقائياً.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleReturnToBookingWithContact(savedContactNotice)}
            className="btn btn-primary"
            style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}
          >
            <Icons.Calendar size={16} />
            <span>متابعة وتأكيد الحجز بهذه الجهة 📅</span>
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', padding: '18px 20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', borderRadius: '12px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Users size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0, color: 'var(--text-main)' }}>
                جهات الاتصال
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                دليل جهات الاتصال الموحد (المصورين، العملاء، والشركات) ومصدر بيانات الجوال للحجوزات
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {window.bookingDraft && (
            <button
              onClick={() => {
                if (setActiveTab) setActiveTab('bookings');
                if (setIsBookingFormOpen) setIsBookingFormOpen(true);
              }}
              className="btn btn-secondary"
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}
            >
              <Icons.ArrowRight size={16} />
              <span>العودة للحجز</span>
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', height: '40px', borderRadius: '10px' }}
          >
            <Icons.UserPlus size={18} />
            <span>إضافة جهة اتصال جديدة</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Icons.Search size={18} style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="ابحث باسم جهة الاتصال أو رقم الجوال للتواصل..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingRight: '42px', height: '42px', borderRadius: '10px', fontSize: '0.88rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', left: '12px', top: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Icons.X size={18} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'all', label: `الكل (${allContacts?.length || 0})` },
            { id: 'freelancer', label: '📷 مصورين / فريلانسر' },
            { id: 'client', label: '👤 عملاء' },
            { id: 'company', label: '🏢 شركات' },
            { id: 'contact', label: '📇 جهات اتصال مسجلة' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedTypeFilter(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '50px',
                border: '1px solid var(--border-color)',
                backgroundColor: selectedTypeFilter === f.id ? 'var(--primary-color)' : 'var(--bg-main)',
                color: selectedTypeFilter === f.id ? '#ffffff' : 'var(--text-muted)',
                fontWeight: selectedTypeFilter === f.id ? 900 : 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <Icons.UserX size={48} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
            لا توجد جهات اتصال مطابقة للبحث
          </h3>
          <p style={{ fontSize: '0.84rem', margin: 0 }}>
            يمكنك إضافة جهة اتصال جديدة بالضغط على زر "إضافة جهة اتصال جديدة" أعلاه.
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ margin: '16px auto 0 auto', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icons.UserPlus size={16} />
            <span>إضافة جهة الاتصال الآن</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
          {filteredList.map(c => {
            const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
            const targetWa = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone.replace(/^0/, '')}`;

            return (
              <div
                key={c.id || c.phone || c.name}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  gap: '12px',
                  transition: 'box-shadow 0.2s, transform 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--bg-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 900,
                          color: 'var(--primary-color)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {c.name ? c.name.charAt(0) : '👤'}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                          {c.name}
                        </h3>
                        <span className={`badge ${getTypeBadgeClass(c)}`} style={{ fontSize: '0.68rem', marginTop: '3px', display: 'inline-block' }}>
                          {c.role || c.type || 'جهة اتصال'}
                        </span>
                      </div>
                    </div>

                    {c.source === 'contacts' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="تعديل جهة الاتصال"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        >
                          <Icons.Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف جهة الاتصال: ${c.name}؟`)) {
                              deleteContact(c.id);
                            }
                          }}
                          title="حذف جهة الاتصال"
                          style={{ background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '4px' }}
                        >
                          <Icons.Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Phone and Details */}
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-main)', padding: '6px 10px', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>رقم الجوال:</span>
                      {c.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong className="en-digits" dir="ltr" style={{ color: 'var(--primary-color)', fontSize: '0.86rem' }}>
                            {c.phone}
                          </strong>
                          <a
                            href={`https://wa.me/${targetWa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="مراسلة واتساب"
                            style={{ color: '#22c55e', display: 'flex', alignItems: 'center' }}
                          >
                            <Icons.MessageSquare size={14} />
                          </a>
                          <a
                            href={`tel:${c.phone}`}
                            title="اتصال هاتفي"
                            style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}
                          >
                            <Icons.Phone size={14} />
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>بدون رقم</span>
                      )}
                    </div>

                    {c.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                        <Icons.Mail size={12} />
                        <span dir="ltr">{c.email}</span>
                      </div>
                    )}

                    {c.notes && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', padding: '6px 8px', borderRadius: '6px' }}>
                        📝 {c.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action: Create Booking */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleReturnToBookingWithContact(c)}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      borderRadius: '8px'
                    }}
                  >
                    <Icons.CalendarPlus size={14} />
                    <span>إنشاء حجز جديد لهذه الجهة 📅</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Contact */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            direction: 'rtl'
          }}
        >
          <div
            className="modal-content animate-drawer"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.UserPlus size={20} style={{ color: 'var(--primary-color)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950, color: 'var(--text-main)' }}>
                  {editingContact ? 'تعديل بيانات جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
              >
                <Icons.X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  اسم جهة الاتصال: <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="مثال: المصور محمد أو اسم العميل..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ height: '42px', borderRadius: '10px', fontSize: '0.88rem' }}
                />
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  رقم الجوال للتواصل: <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  className="form-control en-digits"
                  placeholder="05xxxxxxxx"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{ height: '42px', borderRadius: '10px', fontSize: '0.88rem', textAlign: 'left', direction: 'ltr' }}
                />
              </div>

              {/* Role / Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  صفة / نوع جهة الاتصال:
                </label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={e => {
                    const t = e.target.value;
                    let r = 'جهة اتصال عامة';
                    if (t === 'freelancer') r = 'مصور / فريلانسر';
                    else if (t === 'client') r = 'عميل';
                    else if (t === 'company') r = 'شركة / وكالة';
                    setFormData({ ...formData, type: t, role: r });
                  }}
                  style={{ height: '42px', borderRadius: '10px', fontSize: '0.86rem', padding: '0 10px' }}
                >
                  <option value="freelancer">📷 مصور / فريلانسر متعاون</option>
                  <option value="client">👤 عميل</option>
                  <option value="company">🏢 شركة / وكالة تصوير</option>
                  <option value="contact">📇 جهة اتصال عامة</option>
                </select>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  البريد الإلكتروني (اختياري):
                </label>
                <input
                  type="email"
                  className="form-control en-digits"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', textAlign: 'left', direction: 'ltr' }}
                />
              </div>

              {/* Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  ملاحظات إضافية (اختياري):
                </label>
                <textarea
                  className="form-control"
                  placeholder="أي معلومات إضافية عن جهة الاتصال..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  style={{ borderRadius: '10px', fontSize: '0.84rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ height: '42px', fontWeight: 800, borderRadius: '10px', minWidth: '90px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: '42px', fontWeight: 900, borderRadius: '10px', minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Icons.Save size={16} />
                  <span>{editingContact ? 'حفظ التعديلات' : 'حفظ جهة الاتصال'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContactsView;
