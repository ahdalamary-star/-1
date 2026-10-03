/**
 * LensFlow Device Contacts Integration Utility
 * Supports W3C Contact Picker API (Chrome on Android, Edge, Samsung Internet)
 * with graceful, native-feeling fallbacks for iOS (Safari), desktop, and offline usage.
 */

/**
 * Checks if the W3C Contact Picker API is supported in the current environment.
 */
export const isContactPickerSupported = () => {
  return Boolean(
    typeof window !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window
  );
};

/**
 * Opens native device contact picker (supported on Android Chrome 80+, etc.).
 * Returns { success, contact: { name, phone, contactId }, permissionDenied, error }
 */
export const pickDeviceContact = async () => {
  if (!isContactPickerSupported()) {
    return { success: false, supported: false };
  }

  try {
    const props = ['name', 'tel'];
    const contacts = await navigator.contacts.select(props, { multiple: false });

    if (contacts && contacts.length > 0) {
      const c = contacts[0];
      const name = Array.isArray(c.name) ? c.name[0] : (c.name || '');
      const rawTel = Array.isArray(c.tel) ? c.tel[0] : (c.tel || '');
      // Format / clean phone number
      const phone = (rawTel || '').trim();
      const contactId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      return {
        success: true,
        supported: true,
        contact: {
          name: (name || '').trim(),
          phone,
          contactId
        }
      };
    }

    return { success: false, supported: true, cancelled: true };
  } catch (error) {
    // If the user denied permission or the feature is blocked by OS/browser
    if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
      return {
        success: false,
        supported: true,
        permissionDenied: true,
        error: 'لم يتم السماح بالوصول إلى جهات الاتصال. يمكنك السماح بالوصول من إعدادات الجهاز ثم المحاولة مرة أخرى.'
      };
    }

    // User dismissed/aborted the picker
    if (error.name === 'AbortError') {
      return { success: false, supported: true, cancelled: true };
    }

    return {
      success: false,
      supported: true,
      error: error.message || 'تعذر الوصول إلى جهات الاتصال'
    };
  }
};

/**
 * Generates and downloads a vCard (v3.0) file.
 * This natively triggers the OS "Add to Contacts" interface on iOS (Safari/iPhone),
 * Android, and Desktop operating systems.
 */
export const openDeviceAddContact = (name = '', phone = '') => {
  const cleanName = (name || '').trim() || 'جهة اتصال جديدة';
  const cleanPhone = (phone || '').replace(/[^\d+]/g, '');

  const vcardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${cleanName}`,
    `N:;${cleanName};;;`,
    cleanPhone ? `TEL;TYPE=CELL:${cleanPhone}` : '',
    'END:VCARD'
  ].filter(Boolean);

  const vcardString = vcardLines.join('\r\n');
  const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanName}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Opens official WhatsApp chat or link.
 */
export const openOfficialWhatsApp = (phone = '', name = '') => {
  const cleanPhone = (phone || '').replace(/[^\d]/g, '');
  const greeting = name ? `مرحباً ${name}` : '';
  const encodedText = greeting ? encodeURIComponent(greeting) : '';

  let url = 'https://wa.me/';
  if (cleanPhone) {
    // If local Saudi number starting with 05, format with country code 966
    let formatted = cleanPhone;
    if (formatted.startsWith('05')) {
      formatted = '966' + formatted.substring(1);
    } else if (formatted.startsWith('5') && formatted.length === 9) {
      formatted = '966' + formatted;
    }
    url = `https://wa.me/${formatted}${encodedText ? `?text=${encodedText}` : ''}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Parses a vCard (.vcf) file selected by the user.
 */
export const parseVCardFile = async (file) => {
  try {
    const text = await file.text();
    let name = '';
    let phone = '';

    const lines = text.split(/\r\n|\r|\n/);
    for (const line of lines) {
      if (!name && (line.startsWith('FN:') || line.startsWith('FN;'))) {
        name = line.substring(line.indexOf(':') + 1).trim();
      } else if (!phone && (line.startsWith('TEL:') || line.startsWith('TEL;'))) {
        phone = line.substring(line.indexOf(':') + 1).trim();
      }
    }

    return {
      success: Boolean(name || phone),
      name,
      phone,
      contactId: `vcard-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
  } catch (err) {
    console.error('Failed to parse vCard file:', err);
    return { success: false, error: err.message };
  }
};
