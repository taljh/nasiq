# دليل المطور لنظام "نَسيق" لتسعير العبايات

## نظرة عامة على البنية التقنية

نظام "نَسيق" هو تطبيق ويب يستخدم التقنيات التالية:

- **الواجهة الأمامية**: HTML5, CSS3, JavaScript (ES6+)
- **قاعدة البيانات**: Supabase (PostgreSQL)
- **المصادقة**: نظام مصادقة Supabase
- **استضافة الكود**: GitHub
- **استضافة التطبيق**: يمكن استضافته على أي منصة تدعم مواقع الويب الثابتة

## هيكل المشروع

```
nasiq/
├── src/
│   ├── index.html          # الصفحة الرئيسية للتطبيق
│   ├── styles.css          # أنماط CSS
│   ├── index.js            # نقطة الدخول الرئيسية للتطبيق
│   ├── assets/             # الصور والأصول
│   └── lib/                # المكتبات والخدمات
│       ├── supabaseClient.js    # إعداد اتصال Supabase
│       ├── AuthService.js       # خدمة المصادقة
│       ├── ProductService.js    # خدمة إدارة المنتجات
│       ├── SettingsService.js   # خدمة إدارة الإعدادات
│       └── AppController.js     # وحدة التحكم الرئيسية
├── package.json            # تبعيات المشروع
└── .gitignore              # ملفات مستثناة من Git
```

## قاعدة البيانات

### هيكل الجداول

#### جدول المستخدمين (users)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف الفريد (المفتاح الأساسي) |
| email | VARCHAR | البريد الإلكتروني (فريد) |
| password | VARCHAR | كلمة المرور (مشفرة) |
| name | VARCHAR | اسم المستخدم |
| created_at | TIMESTAMP | تاريخ الإنشاء |

#### جدول إعدادات المشروع (settings)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف الفريد (المفتاح الأساسي) |
| user_id | UUID | معرف المستخدم (مفتاح خارجي) |
| project_name | VARCHAR | اسم المشروع |
| target_category | VARCHAR | الفئة المستهدفة الافتراضية |
| monthly_products | INTEGER | عدد المنتجات الشهرية |
| default_profit_rate | DECIMAL | نسبة الربح الافتراضية |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ التحديث |

#### جدول التكاليف الثابتة (fixed_costs)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف الفريد (المفتاح الأساسي) |
| user_id | UUID | معرف المستخدم (مفتاح خارجي) |
| name | VARCHAR | اسم التكلفة |
| amount | DECIMAL | قيمة التكلفة |
| frequency | VARCHAR | تكرار التكلفة (شهري، سنوي، إلخ) |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ التحديث |

#### جدول المنتجات (products)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف الفريد (المفتاح الأساسي) |
| user_id | UUID | معرف المستخدم (مفتاح خارجي) |
| name | VARCHAR | اسم المنتج |
| code | VARCHAR | رمز المنتج |
| target_category | VARCHAR | الفئة المستهدفة |
| main_fabric_cost | DECIMAL | تكلفة القماش الأساسي |
| has_secondary_fabric | BOOLEAN | هل يوجد قماش ثانوي |
| secondary_fabric_cost | DECIMAL | تكلفة القماش الثانوي |
| has_scarf | BOOLEAN | هل يوجد طرحة |
| scarf_main_fabric_cost | DECIMAL | تكلفة قماش الطرحة الأساسي |
| has_scarf_secondary_fabric | BOOLEAN | هل يوجد قماش ثانوي للطرحة |
| scarf_secondary_fabric_cost | DECIMAL | تكلفة قماش الطرحة الثانوي |
| sewing_cost | DECIMAL | تكلفة الخياطة |
| packaging_cost | DECIMAL | تكلفة التغليف |
| shipping_cost | DECIMAL | تكلفة الشحن |
| additional_expenses_rate | DECIMAL | نسبة المصاريف الإضافية |
| profit_rate | DECIMAL | نسبة الربح |
| total_cost | DECIMAL | التكلفة الإجمالية |
| final_price | DECIMAL | السعر النهائي |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ التحديث |

### سياسات الأمان (Row Level Security)

تم تفعيل سياسات الأمان على مستوى الصفوف (RLS) لجميع الجداول، بحيث يمكن للمستخدم الوصول فقط إلى بياناته الخاصة.

## واجهة برمجة التطبيقات (API)

### المصادقة

```javascript
// تسجيل مستخدم جديد
async function signUp(email, password, name) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });
}

// تسجيل الدخول
async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
}

// تسجيل الخروج
async function signOut() {
  return await supabase.auth.signOut();
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
  return supabase.auth.getUser();
}
```

### إدارة المنتجات

```javascript
// إضافة منتج جديد
async function addProduct(productData) {
  return await supabase
    .from('products')
    .insert([productData]);
}

// الحصول على جميع منتجات المستخدم
async function getProducts() {
  return await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
}

// الحصول على منتج محدد
async function getProduct(id) {
  return await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
}

// تحديث منتج
async function updateProduct(id, productData) {
  return await supabase
    .from('products')
    .update(productData)
    .eq('id', id);
}

// حذف منتج
async function deleteProduct(id) {
  return await supabase
    .from('products')
    .delete()
    .eq('id', id);
}
```

### إدارة الإعدادات

```javascript
// الحصول على إعدادات المستخدم
async function getSettings() {
  return await supabase
    .from('settings')
    .select('*')
    .single();
}

// تحديث إعدادات المستخدم
async function updateSettings(settingsData) {
  return await supabase
    .from('settings')
    .upsert(settingsData);
}

// إضافة تكلفة ثابتة
async function addFixedCost(costData) {
  return await supabase
    .from('fixed_costs')
    .insert([costData]);
}

// الحصول على التكاليف الثابتة
async function getFixedCosts() {
  return await supabase
    .from('fixed_costs')
    .select('*');
}
```

## تشغيل المشروع محلياً

1. استنساخ المستودع:
```bash
git clone https://github.com/taljh/nasiq.git
cd nasiq
```

2. تثبيت التبعيات:
```bash
npm install
```

3. تشغيل خادم التطوير:
```bash
npm start
```

4. فتح المتصفح على العنوان: `http://localhost:3000`

## نشر المشروع

### نشر على GitHub Pages

1. تحديث ملف `package.json` لإضافة:
```json
"homepage": "https://taljh.github.io/nasiq",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

2. تثبيت حزمة gh-pages:
```bash
npm install --save-dev gh-pages
```

3. نشر التطبيق:
```bash
npm run deploy
```

### نشر على Netlify

1. إنشاء حساب على Netlify
2. ربط حساب Netlify بحساب GitHub
3. اختيار مستودع `nasiq`
4. تكوين إعدادات النشر:
   - Build command: `npm run build`
   - Publish directory: `build`
5. النقر على "Deploy site"

## تخصيص المشروع

### تغيير معلومات الاتصال بـ Supabase

قم بتحديث ملف `src/lib/supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### تغيير الألوان والمظهر

قم بتحديث ملف `src/styles.css` لتغيير الألوان والمظهر العام للتطبيق.

### إضافة ميزات جديدة

1. إضافة خدمة جديدة في مجلد `src/lib/`
2. تحديث وحدة التحكم الرئيسية `AppController.js` لاستخدام الخدمة الجديدة
3. تحديث واجهة المستخدم في `index.html` و `index.js`

## استكشاف الأخطاء وإصلاحها

### مشاكل المصادقة

- تأكد من تكوين المصادقة بشكل صحيح في لوحة تحكم Supabase
- تحقق من تفعيل خيار "Email Auth" في إعدادات المصادقة

### مشاكل قاعدة البيانات

- تأكد من وجود جميع الجداول المطلوبة
- تحقق من تفعيل سياسات الأمان (RLS) بشكل صحيح
- تأكد من استخدام مفتاح API العام (anon key) وليس مفتاح الخدمة (service key)

### مشاكل واجهة المستخدم

- افتح وحدة تحكم المتصفح (F12) للتحقق من وجود أخطاء JavaScript
- تأكد من توافق المتصفح مع ميزات ES6+
- جرب تشغيل التطبيق في وضع التصفح الخاص للتحقق من مشاكل ذاكرة التخزين المؤقت

## الخطوات المستقبلية

### تحسينات مقترحة

1. إضافة دعم للصور للمنتجات
2. إضافة تقارير وتحليلات متقدمة
3. دعم تصدير البيانات بتنسيقات متعددة (Excel, PDF)
4. إضافة نظام إشعارات للمستخدمين
5. تطوير تطبيق جوال باستخدام React Native

### توسيع نطاق المشروع

1. إضافة نظام إدارة المخزون
2. إضافة نظام إدارة الطلبات
3. إضافة نظام إدارة العملاء
4. إضافة بوابات دفع
5. إضافة متجر إلكتروني متكامل

---

تم تطوير هذا الدليل بواسطة مانوس، المساعد الشخصي لطلال.
