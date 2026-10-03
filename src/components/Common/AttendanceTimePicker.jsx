import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { generateAttendanceTimeOptions } from '../../utils/helpers';

export const AttendanceTimePicker = ({
  value = '',
  onChange = () => {},
  placeholder = 'اختر وقت الحضور ⏰',
  size = 'md',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = generateAttendanceTimeOptions();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger Button that mimics standard input field */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="form-control"
        style={{
          height: size === 'sm' ? '36px' : '40px',
          borderRadius: size === 'sm' ? '8px' : '10px',
          fontSize: size === 'sm' ? '0.8rem' : '0.86rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          textAlign: 'right',
          cursor: 'pointer',
          padding: '0 12px',
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: value ? 'var(--text-main)' : 'var(--text-muted)',
          boxShadow: 'none',
          outline: 'none',
          direction: 'rtl'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Clock
            size={size === 'sm' ? 14 : 16}
            style={{ color: value ? 'var(--primary-color)' : 'var(--text-muted)' }}
          />
          <span style={{ fontWeight: value ? 800 : 500 }}>
            {value || placeholder}
          </span>
        </div>
        <Icons.ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Custom Modal / Dropdown Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '82vh',
              animation: 'fadeInScale 0.15s ease-out'
            }}
          >
            {/* Header with Title: ⏰ اختر وقت الحضور ✓ */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.15rem' }}>⏰</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '0.98rem',
                    fontWeight: 950,
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  اختر وقت الحضور ✓
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
                title="إغلاق"
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Scrollable list of 18 hourly options */}
            <div
              style={{
                padding: '12px 14px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flex: 1
              }}
            >
              {/* Option to clear time selection if already selected */}
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px dashed rgba(239, 68, 68, 0.4)',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    color: '#ef4444',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}
                >
                  ✕ إلغاء تحديد الوقت (بدون وقت محدد)
                </button>
              )}

              {options.map((timeOption) => {
                const isSelected = value === timeOption;
                return (
                  <button
                    key={timeOption}
                    type="button"
                    onClick={() => {
                      onChange(timeOption);
                      setIsOpen(false);
                    }}
                    style={{
                      height: '46px',
                      borderRadius: '12px',
                      border: isSelected
                        ? '1.5px solid var(--primary-color)'
                        : '1px solid var(--border-color)',
                      backgroundColor: isSelected
                        ? 'var(--primary-color)'
                        : 'var(--bg-main)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      padding: '0 16px',
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 900 : 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      outline: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icons.Clock
                        size={15}
                        style={{
                          opacity: isSelected ? 1 : 0.6,
                          color: isSelected ? '#ffffff' : 'var(--primary-color)'
                        }}
                      />
                      <span>{timeOption}</span>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icons.Check size={14} color="#ffffff" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
