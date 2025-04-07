# دليل المطور لنظام "نَسيق" لتسعير العبايات

## مقدمة

هذا الدليل مخصص للمطورين والمسؤولين عن صيانة وتطوير نظام "نَسيق" لتسعير العبايات. يحتوي على معلومات تقنية مفصلة حول بنية النظام، قاعدة البيانات، واجهة برمجة التطبيقات (API)، وكيفية تخصيص وتوسيع النظام.

## هيكل المشروع

يتكون مشروع "نَسيق" من المكونات الرئيسية التالية:

```
nasiq/
├── src/                  # مصدر الكود
│   ├── index.html        # صفحة HTML الرئيسية
│   ├── styles.css        # أنماط CSS
│   ├── index.js          # الكود الرئيسي للتطبيق
│   ├── assets/           # الموارد (الصور، الأيقونات، إلخ)
│   └── lib/              # مكتبات ووحدات JavaScript
│       ├── supabaseClient.js     # عميل Supabase
│       ├── AuthService.js        # خدمة المصادقة
│       ├── SettingsService.js    # خدمة الإعدادات
│       ├── ProductService.js     # خدمة المنتجات
│       ├── DataMigrationService.js # خدمة نقل البيانات
│       ├── AppController.js      # وحدة التحكم الرئيسية
│       └── database_schema.sql   # مخطط قاعدة البيانات
└── dist/                 # ملفات التوزيع (للنشر)
```

## تكوين Supabase

يستخدم النظام Supabase كخدمة قاعدة بيانات وخدمة مصادقة. فيما يلي تفاصيل التكوين:

### معلومات الاتصال

- **رابط المشروع**: `https://hctkgoxttjxhfuzfjypx.supabase.co`
- **مفتاح API العام**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjdGtnb3h0dGp4aGZ1emZqeXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUyMjUsImV4cCI6MjA1OTYxMTIyNX0.S4zO3mBtGerZzPFghAxnnIT2D_v_EKf9B930GPGQUeQ`

### مخطط قاعدة البيانات

قاعدة البيانات تتكون من الجداول التالية:

#### جدول `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### جدول `settings`

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_name VARCHAR,
  target_category VARCHAR,
  monthly_products INTEGER DEFAULT 100,
  default_profit_rate DECIMAL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### جدول `fixed_costs`

```sql
CREATE TABLE fixed_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### جدول `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  code VARCHAR,
  target_category VARCHAR NOT NULL,
  calculated_category VARCHAR NOT NULL,
  main_fabric_cost DECIMAL NOT NULL,
  has_secondary_fabric BOOLEAN DEFAULT FALSE,
  secondary_fabric_cost DECIMAL DEFAULT 0,
  has_scarf BOOLEAN DEFAULT FALSE,
  main_scarf_cost DECIMAL DEFAULT 0,
  has_secondary_scarf BOOLEAN DEFAULT FALSE,
  secondary_scarf_cost DECIMAL DEFAULT 0,
  sewing_cost DECIMAL NOT NULL,
  packaging_cost DECIMAL NOT NULL,
  shipping_cost DECIMAL NOT NULL,
  additional_expenses_rate DECIMAL NOT NULL,
  profit_rate DECIMAL NOT NULL,
  total_cost DECIMAL NOT NULL,
  final_price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### سياسات الأمان (RLS)

تم تكوين سياسات أمان على مستوى الصف (Row Level Security) لضمان أن كل مستخدم يمكنه الوصول فقط إلى بياناته الخاصة:

#### سياسة `settings`

```sql
CREATE POLICY "Users can only access their own settings"
  ON settings
  FOR ALL
  USING (auth.uid() = user_id);
```

#### سياسة `fixed_costs`

```sql
CREATE POLICY "Users can only access their own fixed costs"
  ON fixed_costs
  FOR ALL
  USING (auth.uid() = user_id);
```

#### سياسة `products`

```sql
CREATE POLICY "Users can only access their own products"
  ON products
  FOR ALL
  USING (auth.uid() = user_id);
```

## خدمات التطبيق

### `supabaseClient.js`

يقوم بإنشاء وتكوين عميل Supabase:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hctkgoxttjxhfuzfjypx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjdGtnb3h0dGp4aGZ1emZqeXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzUyMjUsImV4cCI6MjA1OTYxMTIyNX0.S4zO3mBtGerZzPFghAxnnIT2D_v_EKf9B930GPGQUeQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### `AuthService.js`

يوفر وظائف المصادقة:

- `signUp(email, password, metadata)`: تسجيل مستخدم جديد
- `signIn(email, password)`: تسجيل الدخول
- `signOut()`: تسجيل الخروج
- `getCurrentSession()`: الحصول على جلسة المستخدم الحالية
- `resetPassword(email)`: إعادة تعيين كلمة المرور

### `SettingsService.js`

يدير إعدادات المشروع والتكاليف الثابتة:

- `getSettings(userId)`: الحصول على إعدادات المشروع
- `saveSettings(settings, userId)`: حفظ إعدادات المشروع
- `getFixedCosts(userId)`: الحصول على التكاليف الثابتة
- `saveFixedCosts(costs, userId)`: حفظ التكاليف الثابتة

### `ProductService.js`

يدير المنتجات:

- `getProducts(userId)`: الحصول على جميع المنتجات
- `getProduct(id, userId)`: الحصول على منتج محدد
- `createProduct(product, userId)`: إنشاء منتج جديد
- `updateProduct(product, userId)`: تحديث منتج موجود
- `deleteProduct(id, userId)`: حذف منتج

### `DataMigrationService.js`

يدير عملية نقل البيانات من التخزين المحلي إلى Supabase:

- `migrateLocalDataToSupabase(userId)`: نقل البيانات المحلية إلى Supabase

### `AppController.js`

يربط بين جميع الخدمات ويدير تدفق التطبيق:

- `initialize()`: تهيئة التطبيق
- `loadUserData()`: تحميل بيانات المستخدم
- `loadDashboardData()`: تحميل بيانات لوحة التحكم
- `loadProducts()`: تحميل المنتجات
- `loadSettings()`: تحميل الإعدادات

## واجهة المستخدم

### المكونات الرئيسية

1. **شاشة المصادقة**: تسجيل الدخول وإنشاء الحساب
2. **القائمة الجانبية**: التنقل بين أقسام التطبيق
3. **لوحة التحكم**: عرض الإحصائيات والرسوم البيانية
4. **حاسبة التسعير**: إضافة وتعديل المنتجات
5. **قائمة المنتجات**: عرض وإدارة المنتجات
6. **الإعدادات**: ضبط إعدادات المشروع والتكاليف الثابتة
7. **المساعدة**: دليل الاستخدام والأسئلة الشائعة

### الأحداث والتفاعلات

تم تنفيذ التفاعلات باستخدام أحداث JavaScript القياسية:

- `click`: للأزرار والروابط
- `input`: لحقول الإدخال
- `change`: للقوائم المنسدلة ومربعات الاختيار
- `submit`: لنماذج الإدخال

## النشر والاستضافة

تم نشر التطبيق على الرابط الدائم:
[https://rwifaslk.manus.space](https://rwifaslk.manus.space)

### متطلبات الاستضافة

- استضافة ويب تدعم HTML/CSS/JavaScript
- لا يتطلب خادم خلفي (backend server)، حيث يتم التعامل مع قاعدة البيانات من خلال Supabase API

### خطوات النشر

1. بناء ملفات التوزيع:
   ```
   npm run build
   ```

2. رفع محتويات مجلد `dist` إلى خادم الويب

## تخصيص النظام

### تغيير الألوان والمظهر

يمكن تخصيص ألوان ومظهر التطبيق من خلال تعديل متغيرات CSS في ملف `styles.css`:

```css
:root {
    --primary-color: #8e44ad;
    --secondary-color: #27ae60;
    --dark-color: #2c3e50;
    --light-color: #ecf0f1;
    --danger-color: #e74c3c;
    --warning-color: #f39c12;
    --info-color: #3498db;
    --success-color: #2ecc71;
    
    /* Category Colors */
    --category-luxury: #8e44ad;
    --category-premium: #27ae60;
    --category-daily: #f39c12;
    --category-economy: #7f8c8d;
}
```

### تعديل فئات المنتجات

لتعديل فئات المنتجات وحدود الأسعار، قم بتعديل الدالة `calculateProductPrice()` في ملف `index.js`:

```javascript
// Determine category based on price
let calculatedCategory = '';
if (finalPrice < 200) {
    calculatedCategory = 'اقتصادية';
} else if (finalPrice < 300) {
    calculatedCategory = 'يومية';
} else if (finalPrice < 450) {
    calculatedCategory = 'راقية';
} else {
    calculatedCategory = 'عبايات فاخرة جداً';
}
```

### إضافة حقول جديدة

لإضافة حقول جديدة للمنتجات:

1. تحديث مخطط قاعدة البيانات في Supabase
2. تعديل واجهة المستخدم في `index.html`
3. تحديث الدوال ذات الصلة في `index.js`
4. تحديث خدمة `ProductService.js`

## استكشاف الأخطاء وإصلاحها

### مشاكل المصادقة

إذا واجه المستخدمون مشاكل في تسجيل الدخول:

1. تحقق من صحة مفتاح API في `supabaseClient.js`
2. تأكد من تمكين خدمة المصادقة في لوحة تحكم Supabase
3. تحقق من سجلات الأخطاء في وحدة تحكم المتصفح

### مشاكل البيانات

إذا كانت البيانات لا تظهر أو لا يمكن حفظها:

1. تحقق من سياسات RLS في Supabase
2. تأكد من أن المستخدم مسجل الدخول
3. تحقق من استجابات API في وحدة تحكم المتصفح

## تطوير ميزات جديدة

### إضافة تقارير جديدة

لإضافة تقارير جديدة إلى لوحة التحكم:

1. إضافة عنصر HTML جديد في قسم لوحة التحكم
2. إنشاء دالة جديدة في `index.js` لجلب وعرض البيانات
3. استخدام Chart.js لإنشاء الرسوم البيانية

### دعم اللغات المتعددة

لإضافة دعم للغات متعددة:

1. إنشاء ملفات ترجمة JSON لكل لغة
2. إضافة وظيفة تبديل اللغة في واجهة المستخدم
3. تحديث النصوص ديناميكياً بناءً على اللغة المحددة

## الخطط المستقبلية

### الإصدار 2.0

الميزات المخطط لها للإصدار القادم:

1. **إدارة المخزون**: تتبع المخزون والمواد الخام
2. **إدارة الطلبات**: تسجيل وتتبع طلبات العملاء
3. **تقارير مالية متقدمة**: تحليلات الربحية والتكاليف
4. **دعم العمل الجماعي**: مشاركة البيانات بين أعضاء الفريق
5. **تطبيق للهواتف الذكية**: إصدارات لنظامي iOS وAndroid

## الموارد والمراجع

- [وثائق Supabase](https://supabase.io/docs)
- [وثائق Chart.js](https://www.chartjs.org/docs/latest/)
- [وثائق Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/introduction/)

---

تم إعداد هذا الدليل بواسطة: طلال

آخر تحديث: 7 أبريل 2025
