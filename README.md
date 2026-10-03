# 🎬 منظومة العهد للإنتاج والتصوير والاستوديوهات (Al-Ahad System)

<div align="center">

![منظومة العهد](/public/og-image.svg)

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.18-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-4338ca?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)]()

**منصة سحابية ذكية وشاملة لإدارة عمليات الإنتاج الفني، استوديوهات التصوير، الفرق الميدانية، والعملاء.**

</div>

---

## 🌟 نظرة عامة (Overview)

**منظومة العهد** هي حل تقني متقدم صُمم خصيصاً لتلبية احتياجات استوديوهات الإنتاج الإعلامي والفوتوغرافي وصناع المحتوى. تجمع المنصة بين إدارة تدفق العمل اليومي (Workflows)، تنظيم المواعيد والحجوزات، متابعة المصورين في الميدان، وإصدار العقود والماليات، بالإضافة إلى مساعد ذكي **LensFlow AI** لتقديم توصيات وأتمتة العمليات.

---

## 🚀 الميزات الرئيسية (Key Features)

### 1. 📊 لوحة التحكم والإحصائيات (Operations Dashboard)
- رؤية شاملة للمشاريع النشطة، إحصائيات الإيرادات، والحجوزات اليومية.
- مؤشرات أداء تفاعلية مدعومة بمخططات بيانية حديثة (`Recharts`).
- سجل تدقيق العمليات (Audit Logs) لتوثيق وتتبع كافة الأنشطة.

### 2. 📅 إدارة الحجوزات والتقويم والموقع (Smart Bookings & Calendar)
- تقويم تفاعلي وجدول زمني لكافة جلسات التصوير والمشاريع.
- نظام خرائط تفاعلي (`Leaflet`) لمتابعة مواقع التصوير والفعاليات ميدانياً.
- فلاتر متقدمة حسب الحالة (مؤكد، قيد الانتظار، منجز، ملغي).

### 3. 📸 بوابة المصورين وطواقم الميدان (Photographer Portal)
- واجهة مخصصة للمصورين والفنيين لاستعراض المهام الموكلة إليهم.
- إمكانية تحديث حالة العمليات، رفع المخرجات، وتسجيل الحضور الميداني.

### 4. 💼 بوابة العملاء (Client Portal)
- مساحة مخصصة للعميل للاطلاع على تفاصيل الحجز، تسليم المسودات والصور، والتعميد الإلكتروني.

### 5. 💰 العقود والماليات (Financials & Contracts)
- إدارة عروض الأسعار، الفواتير، ومتابعة الدفعات والمستحقات.
- مستودع رقمي للعقود والاتفاقيات لضمان حقوق كافة الأطراف.
- قائمة حصر المعدات (Equipment Manifest) لحفظ العهد وإدارة الأجهزة.

### 6. 🤖 مساعد الذكاء الاصطناعي (LensFlow AI)
- مساعد ذكي مدمج يساعد في تنسيق المواعيد، تقديم تحليلات تشغيلية، وتسهيل إدارة المهام.

### 7. 📱 تطبيق ويب تقدمي (PWA & Mobile Ready)
- قابل للتثبيت مباشرة كتطبيق هاتف ذكي على أجهزة iPhone و Android والحاسوب المكتبي بدون الحاجة لمتجر تطبيقات.
- دعم العمل دون اتصال (Offline-first) بفضل Service Worker المتطور.
- بطاقات معاينة ذكية وجذابة لشبكات التواصل الاجتماعي (WhatsApp, X, Facebook, LinkedIn).

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **الواجهة الأمامية:** React 18, Vite 6, Tailwind/CSS Custom Modules
- **الأيقونات والتأثيرات:** Lucide React, Canvas Confetti
- **المخططات والخرائط:** Recharts, Leaflet
- **قاعدة البيانات والسحابة:** Google Firebase (Firestore, Auth, Storage, FCM Notifications)
- **الخدمات الخلفية:** Netlify Serverless Functions & Scheduled Tasks

---

## 💻 التشغيل والتطوير المحلي (Getting Started)

### المتطلبات الأساسية:
- [Node.js](https://nodejs.org/) (الإصدار 18 أو أحدث)
- npm أو pnpm أو bun

### خطوات التثبيت:

1. **استنساخ المستودع:**
```bash
git clone https://github.com/ahdalamary-star/-1.git
cd -1
```

2. **تثبيت الاعتماديات:**
```bash
npm install
```

3. **تشغيل بيئة التطوير:**
```bash
npm run dev
```
سيكون التطبيق متاحاً على: `http://localhost:5173`

4. **بناء النسخة الإنتاجية:**
```bash
npm run build
```

5. **معاينة النسخة الإنتاجية:**
```bash
npm run preview
```

---

## 🌐 خيارات النشر السحابي (Deployment)

المشروع مُعد مسبقاً للعمل مع منصات النشر السحابية الكبرى مع دعم الـ SPA Routing:

### 1. Netlify
- يتضمن المشروع ملف `netlify.toml` مع إعدادات إعادة التوجيه التلقائي للمسارات.
- يمكن الربط المباشر مع مستودع GitHub للنشر التلقائي فور كل Push.

### 2. Vercel
- تم تضمين ملف `vercel.json` لإعادة توجيه كافة المسارات لـ `index.html`.
- يتم الاستيراد عبر حساب Vercel بضغطة زر واحدة.

### 3. Firebase Hosting
- مُهيأ بملفات `firebase.json` و `.firebaserc`.
- للنشر المباشر:
```bash
npx firebase-tools deploy --only hosting
```

---

## 📱 بطاقات السوشيال ميديا وتطبيقات الويب (Social & PWA)

تم تزويد المنظومة بما يلي:
- **Open Graph Meta Tags:** لعرض شعار المنظومة وعنوانها ووصفها عند مشاركة الرابط عبر WhatsApp وTelegram وLinkedIn وFacebook.
- **Twitter Cards:** لمعاينة عريضة واحترافية على منصة X.
- **Web App Manifest:** لتوفير اختصارات سريعة (Shortcuts) وتجربة تطبيق جوال أصيل (Native Feel).

---

<div align="center">

صُممت وطُوّرت بعناية لخدمة صناع المحتوى واستوديوهات الإنتاج الفني 🌟  
**للتواصل والدعم الفني:** `ahdalamary@gamil.com`

</div>
