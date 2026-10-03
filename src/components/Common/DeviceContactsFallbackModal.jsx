import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import { openDeviceAddContact, openOfficialWhatsApp, parseVCardFile } from '../../utils/deviceContacts';

export const DeviceContactsFallbackModal = ({
  isOpen,
  onClose,
  targetType = 'client', // 'client' | 'photographer'
  initialName = '',
  initialPhone = '',
  onSelectContact,
  systemContacts = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newContactName, setNewContactName] = useState(initialName || '');
  const [newContactPhone, setNewContactPhone] = useState(initialPhone || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const titleText = targetType === 'photographer' ? 'جهات اتصال المصور' : 'جهات اتصال العميل';
  const roleName = targetType === 'photographer' ? 'المصور' : 'العميل';

  // Filter system contacts
  const filteredContacts = (systemContacts || []).filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q));
  }).slice(0, 8);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await parseVCardFile(file);
    if (res.success) {
      onSelectContact({
        name: res.name,
        phone: res.phone,
        contactId: res.contactId
      });
      onClose();
    } else {
      alert('تعذر قراءة ملف جهة الاتصال. يرجى التأكد من اختيار ملف vCard (.vcf) صالح.');
    }
  };

  const handleCreateInPhone = () => {
    const name = newContactName.trim() || initialName.trim() || `جهة اتصال جديدة`;
    const phone = newContactPhone.trim() || initialPhone.trim();
    openDeviceAddContact(name, phone);
    if (name && onSelectContact) {
      onSelectContact({
        name,
        phone,
        contactId: `device-new-${Date.now()}`
      });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        direction: 'rtl',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icons.User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                {titleText}
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                خيارات الوصول لجهات اتصال الجهاز
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* iOS / Safari device info note */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.76rem',
              color: 'var(--text-main)',
              lineHeight: 1.5,
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}
          >
            <Icons.Info size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>ملاحظة للأجهزة غير المدعومة تلقائياً (مثل iPhone / Safari):</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                المتصفح لا يتيح الوصول المباشر لدفتر العناوين. يمكنك استيراد بطاقة جهة الاتصال (.vcf) أو إضافتها بضغطة زر إلى هاتفك.
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* File Upload (vCard) */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".vcf,text/vcard"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px 8px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Icons.FileSpreadsheet size={20} color="#818cf8" />
              <span>استيراد بطاقة (.vcf)</span>
            </button>

            {/* Official WhatsApp */}
            <button
              type="button"
              onClick={() => {
                openOfficialWhatsApp(initialPhone, initialName);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px 8px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Icons.MessageSquare size={20} color="#25d366" />
              <span>إضافة من واتساب</span>
            </button>
          </div>

          {/* Add New Contact to Phone Section */}
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)' }}>
                إضافة جهة اتصال جديدة في الهاتف
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-color)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {showAddForm ? 'إخفاء' : 'إدخال بيانات'}
              </button>
            </div>

            {showAddForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`اسم ${roleName}...`}
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  style={{ height: '34px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="form-control en-digits"
                  placeholder="رقم الهاتف (مثال: 05xxxxxxxx)"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  style={{ height: '34px', fontSize: '0.8rem', direction: 'ltr', textAlign: 'left' }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateInPhone}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <Icons.UserPlus size={15} />
              <span>+ إضافة وحفظ في جهات اتصال الهاتف</span>
            </button>
          </div>

          {/* Search in Saved Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              أو اختر من السجلات السابقة في النظام:
            </span>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ height: '36px', fontSize: '0.82rem', paddingRight: '32px' }}
              />
              <Icons.Search
                size={14}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
            </div>

            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '4px'
              }}
            >
              {filteredContacts.length > 0 ? (
                filteredContacts.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    onClick={() => {
                      onSelectContact({
                        name: c.name,
                        phone: c.phone || '',
                        contactId: c.id || `contact-${idx}`
                      });
                      onClose();
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{c.name}</span>
                    {c.phone && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', direction: 'ltr' }}>
                        {c.phone}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  لا توجد نتائج مطابقة
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem', padding: '6px 16px' }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
