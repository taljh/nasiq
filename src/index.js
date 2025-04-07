import { AppController } from './lib/AppController.js';

// إنشاء وحدة التحكم الرئيسية للتطبيق
const appController = new AppController();

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  // تهيئة التطبيق
  const initResult = await appController.initialize();
  
  if (initResult.success) {
    if (initResult.isAuthenticated) {
      showMainScreen();
      updateUserInfo();
      loadDashboard();
    } else {
      showAuthScreen();
    }
  } else {
    showNotification('حدث خطأ أثناء تهيئة التطبيق', 'error');
  }
  
  // إعداد مستمعي الأحداث
  setupEventListeners();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
  // مستمعي أحداث تسجيل الدخول وإنشاء الحساب
  setupAuthListeners();
  
  // مستمعي أحداث القائمة الجانبية
  setupSidebarListeners();
  
  // مستمعي أحداث نموذج المنتج
  setupProductFormListeners();
  
  // مستمعي أحداث الإعدادات
  setupSettingsListeners();
  
  // مستمعي أحداث النوافذ المنبثقة
  setupModalListeners();
  
  // مستمع حدث تبديل السمة (الوضع الليلي)
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // مستمع حدث تسجيل الخروج
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

// إعداد مستمعي أحداث تسجيل الدخول وإنشاء الحساب
function setupAuthListeners() {
  // تبديل بين نماذج تسجيل الدخول وإنشاء الحساب
  document.getElementById('login-tab').addEventListener('click', () => {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
  });
  
  document.getElementById('register-tab').addEventListener('click', () => {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
  });
  
  // تسجيل الدخول
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
      showNotification('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
      return;
    }
    
    const result = await appController.login(email, password);
    
    if (result.success) {
      showNotification('تم تسجيل الدخول بنجاح', 'success');
      showMainScreen();
      updateUserInfo();
      loadDashboard();
    } else {
      showNotification('فشل تسجيل الدخول: ' + result.error, 'error');
    }
  });
  
  // إنشاء حساب
  document.getElementById('register-btn').addEventListener('click', async () => {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (!name || !email || !password) {
      showNotification('يرجى إدخال جميع البيانات المطلوبة', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification('كلمة المرور وتأكيد كلمة المرور غير متطابقين', 'error');
      return;
    }
    
    const result = await appController.register(email, password, name);
    
    if (result.success) {
      showNotification('تم إنشاء الحساب بنجاح', 'success');
      showMainScreen();
      updateUserInfo();
      loadDashboard();
    } else {
      showNotification('فشل إنشاء الحساب: ' + result.error, 'error');
    }
  });
  
  // الدخول كزائر
  document.getElementById('guest-btn').addEventListener('click', () => {
    showNotification('تم الدخول كزائر. البيانات لن يتم حفظها.', 'warning');
    showMainScreen();
    document.getElementById('display-name').textContent = 'زائر';
  });
}

// إعداد مستمعي أحداث القائمة الجانبية
function setupSidebarListeners() {
  // لوحة التحكم
  document.getElementById('dashboard-link').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveSection('dashboard');
    loadDashboard();
  });
  
  // المنتجات
  document.getElementById('products-link').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveSection('products');
    loadProducts();
  });
  
  // إضافة منتج
  document.getElementById('add-product-link').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveSection('add-product');
    resetProductForm();
  });
  
  // الإعدادات
  document.getElementById('settings-link').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveSection('settings');
    loadSettings();
  });
  
  // المساعدة
  document.getElementById('help-link').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveSection('help');
  });
}

// إعداد مستمعي أحداث نموذج المنتج
function setupProductFormListeners() {
  // إظهار/إخفاء قسم القماش الثانوي
  document.getElementById('has-secondary-fabric').addEventListener('change', (e) => {
    document.getElementById('secondary-fabric-section').style.display = e.target.checked ? 'flex' : 'none';
  });
  
  // إظهار/إخفاء قسم الطرحة
  document.getElementById('has-scarf').addEventListener('change', (e) => {
    document.getElementById('scarf-section').style.display = e.target.checked ? 'block' : 'none';
  });
  
  // إظهار/إخفاء قسم القماش الثانوي للطرحة
  document.getElementById('has-secondary-scarf').addEventListener('change', (e) => {
    document.getElementById('secondary-scarf-section').style.display = e.target.checked ? 'flex' : 'none';
  });
  
  // حساب السعر
  document.getElementById('calculate-btn').addEventListener('click', calculatePrice);
  
  // حفظ المنتج
  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // حساب السعر قبل الحفظ
    calculatePrice();
    
    // جمع بيانات المنتج
    const productData = getProductFormData();
    
    // التحقق من صحة البيانات
    if (!validateProductData(productData)) {
      return;
    }
    
    // حفظ المنتج
    const productId = document.getElementById('product-id').value;
    let result;
    
    if (productId) {
      // تحديث منتج موجود
      result = await appController.updateProduct(productId, productData);
      if (result.success) {
        showNotification('تم تحديث المنتج بنجاح', 'success');
      } else {
        showNotification('فشل تحديث المنتج: ' + result.error, 'error');
        return;
      }
    } else {
      // إضافة منتج جديد
      result = await appController.addProduct(productData);
      if (result.success) {
        showNotification('تم إضافة المنتج بنجاح', 'success');
      } else {
        showNotification('فشل إضافة المنتج: ' + result.error, 'error');
        return;
      }
    }
    
    // العودة إلى قائمة المنتجات
    setActiveSection('products');
    loadProducts();
  });
  
  // إلغاء
  document.getElementById('cancel-btn').addEventListener('click', () => {
    setActiveSection('products');
    loadProducts();
  });
}

// إعداد مستمعي أحداث الإعدادات
function setupSettingsListeners() {
  // حفظ الإعدادات
  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const settingsData = {
      project_name: document.getElementById('project-name').value,
      target_category: document.getElementById('default-category').value,
      monthly_products: parseInt(document.getElementById('monthly-products').value),
      default_profit_rate: parseFloat(document.getElementById('default-profit-rate').value)
    };
    
    const result = await appController.updateSettings(settingsData);
    
    if (result.success) {
      showNotification('تم حفظ الإعدادات بنجاح', 'success');
    } else {
      showNotification('فشل حفظ الإعدادات: ' + result.error, 'error');
    }
  });
  
  // إضافة تكلفة ثابتة
  document.getElementById('add-cost-btn').addEventListener('click', async () => {
    const name = document.getElementById('new-cost-name').value;
    const amount = parseFloat(document.getElementById('new-cost-amount').value);
    
    if (!name || isNaN(amount)) {
      showNotification('يرجى إدخال اسم ومبلغ التكلفة', 'error');
      return;
    }
    
    const result = await appController.addFixedCost(name, amount);
    
    if (result.success) {
      document.getElementById('new-cost-name').value = '';
      document.getElementById('new-cost-amount').value = '';
      showNotification('تم إضافة التكلفة الثابتة بنجاح', 'success');
      loadFixedCosts();
    } else {
      showNotification('فشل إضافة التكلفة الثابتة: ' + result.error, 'error');
    }
  });
  
  // تصدير البيانات
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  // استيراد البيانات
  document.getElementById('import-data-btn').addEventListener('click', importData);
}

// إعداد مستمعي أحداث النوافذ المنبثقة
function setupModalListeners() {
  // إغلاق نافذة تفاصيل المنتج
  document.querySelector('#product-details-modal .close').addEventListener('click', () => {
    document.getElementById('product-details-modal').style.display = 'none';
  });
  
  // تعديل المنتج
  document.getElementById('edit-product-btn').addEventListener('click', () => {
    const productId = document.getElementById('edit-product-btn').dataset.productId;
    editProduct(productId);
    document.getElementById('product-details-modal').style.display = 'none';
  });
  
  // حذف المنتج
  document.getElementById('delete-product-btn').addEventListener('click', () => {
    const productId = document.getElementById('delete-product-btn').dataset.productId;
    document.getElementById('confirm-delete-btn').dataset.productId = productId;
    document.getElementById('product-details-modal').style.display = 'none';
    document.getElementById('confirm-delete-modal').style.display = 'block';
  });
  
  // تأكيد حذف المنتج
  document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    const productId = document.getElementById('confirm-delete-btn').dataset.productId;
    const result = await appController.deleteProduct(productId);
    
    if (result.success) {
      showNotification('تم حذف المنتج بنجاح', 'success');
      loadProducts();
    } else {
      showNotification('فشل حذف المنتج: ' + result.error, 'error');
    }
    
    document.getElementById('confirm-delete-modal').style.display = 'none';
  });
  
  // إلغاء حذف المنتج
  document.getElementById('cancel-delete-btn').addEventListener('click', () => {
    document.getElementById('confirm-delete-modal').style.display = 'none';
  });
  
  // إغلاق النوافذ المنبثقة عند النقر خارجها
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
}

// تبديل السمة (الوضع الليلي)
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  
  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', 'light');
  } else {
    body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    localStorage.setItem('theme', 'dark');
  }
}

// تسجيل الخروج
async function handleLogout() {
  const result = await appController.logout();
  
  if (result.success) {
    showNotification('تم تسجيل الخروج بنجاح', 'success');
    showAuthScreen();
  } else {
    showNotification('فشل تسجيل الخروج: ' + result.error, 'error');
  }
}

// إظهار شاشة تسجيل الدخول
function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('main-screen').style.display = 'none';
}

// إظهار الشاشة الرئيسية
function showMainScreen() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'block';
}

// تحديث معلومات المستخدم
function updateUserInfo() {
  if (appController.currentUser) {
    const userName = appController.currentUser.user_metadata?.name || appController.currentUser.email;
    document.getElementById('display-name').textContent = userName;
  }
}

// تعيين القسم النشط
function setActiveSection(sectionId) {
  // إخفاء جميع الأقسام
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
  });
  
  // إظهار القسم المطلوب
  document.getElementById(`${sectionId}-section`).style.display = 'block';
  
  // تحديث الروابط النشطة في القائمة الجانبية
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.classList.remove('active');
  });
  
  document.getElementById(`${sectionId}-link`).classList.add('active');
}

// تحميل لوحة التحكم
async function loadDashboard() {
  // تحميل المنتجات
  await appController.loadUserProducts();
  
  // تحديث إحصائيات المنتجات
  const stats = appController.getProductsStatistics();
  
  document.getElementById('total-products').textContent = stats.totalProducts;
  document.getElementById('average-price').textContent = `${stats.averagePrice} ريال`;
  document.getElementById('total-revenue').textContent = `${stats.totalRevenue} ريال`;
  
  // إنشاء الرسم البياني للفئات
  createCategoryChart(stats.categoryCounts);
  
  // عرض آخر المنتجات المضافة
  const recentProductsList = document.getElementById('recent-products-list');
  recentProductsList.innerHTML = '';
  
  const recentProducts = appController.products.slice(0, 3);
  
  if (recentProducts.length === 0) {
    recentProductsList.innerHTML = '<p>لا توجد منتجات مضافة بعد.</p>';
  } else {
    recentProducts.forEach(product => {
      recentProductsList.appendChild(createProductCard(product));
    });
  }
}

// إنشاء الرسم البياني للفئات
function createCategoryChart(categoryCounts) {
  const ctx = document.getElementById('category-chart').getContext('2d');
  
  // تحويل البيانات إلى تنسيق مناسب للرسم البياني
  const labels = Object.keys(categoryCounts);
  const data = Object.values(categoryCounts);
  
  // تحديد الألوان
  const colors = [
    'rgba(106, 27, 154, 0.7)',
    'rgba(255, 111, 0, 0.7)',
    'rgba(0, 150, 136, 0.7)',
    'rgba(233, 30, 99, 0.7)'
  ];
  
  // إنشاء الرسم البياني
  if (window.categoryChart) {
    window.categoryChart.destroy();
  }
  
  window.categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              family: 'Tajawal'
            }
          }
        }
      }
    }
  });
}

// تحميل المنتجات
async function loadProducts() {
  // تحميل المنتجات
  await appController.loadUserProducts();
  
  // عرض المنتجات
  const productsList = document.getElementById('products-list');
  productsList.innerHTML = '';
  
  if (appController.products.length === 0) {
    productsList.innerHTML = '<p>لا توجد منتجات مضافة بعد.</p>';
  } else {
    appController.products.forEach(product => {
      productsList.appendChild(createProductCard(product));
    });
  }
  
  // إعداد مستمع حدث البحث
  document.getElementById('search-btn').addEventListener('click', searchProducts);
  document.getElementById('product-search').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      searchProducts();
    }
  });
  
  // إعداد مستمع حدث التصفية
  document.getElementById('category-filter').addEventListener('change', filterProducts);
}

// البحث عن منتجات
async function searchProducts() {
  const query = document.getElementById('product-search').value.trim();
  
  if (!query) {
    loadProducts();
    return;
  }
  
  const result = await appController.searchProducts(query);
  
  if (result.success) {
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = '';
    
    if (result.data.length === 0) {
      productsList.innerHTML = '<p>لا توجد نتائج مطابقة للبحث.</p>';
    } else {
      result.data.forEach(product => {
        productsList.appendChild(createProductCard(product));
      });
    }
  } else {
    showNotification('فشل البحث: ' + result.error, 'error');
  }
}

// تصفية المنتجات حسب الفئة
async function filterProducts() {
  const category = document.getElementById('category-filter').value;
  
  if (category === 'all') {
    loadProducts();
    return;
  }
  
  const result = await appController.filterProductsByCategory(category);
  
  if (result.success) {
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = '';
    
    if (result.data.length === 0) {
      productsList.innerHTML = '<p>لا توجد منتجات في هذه الفئة.</p>';
    } else {
      result.data.forEach(product => {
        productsList.appendChild(createProductCard(product));
      });
    }
  } else {
    showNotification('فشل التصفية: ' + result.error, 'error');
  }
}

// إنشاء بطاقة منتج
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.productId = product.id;
  
  // تحديد فئة المنتج
  let categoryClass = '';
  switch (product.calculated_category) {
    case 'اقتصادية':
      categoryClass = 'economy';
      break;
    case 'يومية':
      categoryClass = 'daily';
      break;
    case 'راقية':
      categoryClass = 'luxury';
      break;
    case 'فاخرة جداً':
      categoryClass = 'premium';
      break;
  }
  
  card.innerHTML = `
    <h3>${product.name}</h3>
    <span class="category ${categoryClass}">${product.calculated_category}</span>
    <div class="price">${product.final_price} ريال</div>
    <div class="cost">التكلفة: ${product.total_cost} ريال</div>
  `;
  
  // إضافة مستمع حدث النقر لعرض تفاصيل المنتج
  card.addEventListener('click', () => {
    showProductDetails(product);
  });
  
  return card;
}

// عرض تفاصيل المنتج
function showProductDetails(product) {
  // تعيين بيانات المنتج في النافذة المنبثقة
  document.getElementById('modal-product-name').textContent = product.name;
  document.getElementById('modal-product-code').textContent = product.code || '-';
  document.getElementById('modal-target-category').textContent = product.target_category;
  document.getElementById('modal-calculated-category').textContent = product.calculated_category;
  
  document.getElementById('modal-main-fabric').textContent = `${product.main_fabric_cost} ريال`;
  
  // القماش الثانوي
  if (product.has_secondary_fabric) {
    document.getElementById('modal-secondary-fabric-row').style.display = 'flex';
    document.getElementById('modal-secondary-fabric').textContent = `${product.secondary_fabric_cost} ريال`;
  } else {
    document.getElementById('modal-secondary-fabric-row').style.display = 'none';
  }
  
  // الطرحة
  if (product.has_scarf) {
    document.getElementById('modal-scarf-group').style.display = 'block';
    document.getElementById('modal-main-scarf').textContent = `${product.main_scarf_cost} ريال`;
    
    if (product.has_secondary_scarf) {
      document.getElementById('modal-secondary-scarf-row').style.display = 'flex';
      document.getElementById('modal-secondary-scarf').textContent = `${product.secondary_scarf_cost} ريال`;
    } else {
      document.getElementById('modal-secondary-scarf-row').style.display = 'none';
    }
  } else {
    document.getElementById('modal-scarf-group').style.display = 'none';
  }
  
  document.getElementById('modal-sewing-cost').textContent = `${product.sewing_cost} ريال`;
  document.getElementById('modal-packaging-cost').textContent = `${product.packaging_cost} ريال`;
  document.getElementById('modal-shipping-cost').textContent = `${product.shipping_cost} ريال`;
  document.getElementById('modal-additional-expenses').textContent = `${product.additional_expenses_rate}%`;
  
  document.getElementById('modal-total-cost').textContent = `${product.total_cost} ريال`;
  document.getElementById('modal-profit-rate').textContent = `${product.profit_rate}%`;
  document.getElementById('modal-final-price').textContent = `${product.final_price} ريال`;
  
  // تعيين معرف المنتج لأزرار التعديل والحذف
  document.getElementById('edit-product-btn').dataset.productId = product.id;
  document.getElementById('delete-product-btn').dataset.productId = product.id;
  
  // عرض النافذة المنبثقة
  document.getElementById('product-details-modal').style.display = 'block';
}

// تعديل منتج
async function editProduct(productId) {
  // البحث عن المنتج
  const product = appController.products.find(p => p.id === productId);
  
  if (!product) {
    showNotification('لم يتم العثور على المنتج', 'error');
    return;
  }
  
  // تعيين بيانات المنتج في النموذج
  document.getElementById('product-form-title').textContent = 'تعديل المنتج';
  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-code').value = product.code || '';
  document.getElementById('target-category').value = product.target_category;
  
  document.getElementById('main-fabric-cost').value = product.main_fabric_cost;
  document.getElementById('has-secondary-fabric').checked = product.has_secondary_fabric;
  document.getElementById('secondary-fabric-section').style.display = product.has_secondary_fabric ? 'flex' : 'none';
  document.getElementById('secondary-fabric-cost').value = product.secondary_fabric_cost || '';
  
  document.getElementById('has-scarf').checked = product.has_scarf;
  document.getElementById('scarf-section').style.display = product.has_scarf ? 'block' : 'none';
  document.getElementById('main-scarf-cost').value = product.main_scarf_cost || '';
  document.getElementById('has-secondary-scarf').checked = product.has_secondary_scarf;
  document.getElementById('secondary-scarf-section').style.display = product.has_secondary_scarf ? 'flex' : 'none';
  document.getElementById('secondary-scarf-cost').value = product.secondary_scarf_cost || '';
  
  document.getElementById('sewing-cost').value = product.sewing_cost;
  document.getElementById('packaging-cost').value = product.packaging_cost;
  document.getElementById('shipping-cost').value = product.shipping_cost;
  document.getElementById('additional-expenses-rate').value = product.additional_expenses_rate;
  document.getElementById('profit-rate').value = product.profit_rate;
  
  // عرض نتائج التسعير
  document.getElementById('total-cost').textContent = `${product.total_cost} ريال`;
  document.getElementById('final-price').textContent = `${product.final_price} ريال`;
  document.getElementById('calculated-category').textContent = product.calculated_category;
  
  // التحقق من تطابق الفئة المحسوبة مع الفئة المستهدفة
  const categoryWarning = document.getElementById('category-warning');
  if (product.calculated_category !== product.target_category) {
    categoryWarning.style.display = 'block';
  } else {
    categoryWarning.style.display = 'none';
  }
  
  // الانتقال إلى قسم إضافة المنتج
  setActiveSection('add-product');
}

// إعادة تعيين نموذج المنتج
function resetProductForm() {
  document.getElementById('product-form-title').textContent = 'إضافة منتج جديد';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  
  document.getElementById('secondary-fabric-section').style.display = 'none';
  document.getElementById('scarf-section').style.display = 'none';
  document.getElementById('secondary-scarf-section').style.display = 'none';
  
  document.getElementById('total-cost').textContent = '0 ريال';
  document.getElementById('final-price').textContent = '0 ريال';
  document.getElementById('calculated-category').textContent = '-';
  
  document.getElementById('category-warning').style.display = 'none';
  
  // تعيين القيم الافتراضية من إعدادات المستخدم
  if (appController.userSettings) {
    document.getElementById('target-category').value = appController.userSettings.target_category;
    document.getElementById('profit-rate').value = appController.userSettings.default_profit_rate;
  }
}

// حساب السعر
function calculatePrice() {
  const productData = getProductFormData();
  
  // حساب التسعير
  const calculatedProduct = appController.calculateProductPricing(productData);
  
  // عرض النتائج
  document.getElementById('total-cost').textContent = `${calculatedProduct.total_cost} ريال`;
  document.getElementById('final-price').textContent = `${calculatedProduct.final_price} ريال`;
  document.getElementById('calculated-category').textContent = calculatedProduct.calculated_category;
  
  // التحقق من تطابق الفئة المحسوبة مع الفئة المستهدفة
  const categoryWarning = document.getElementById('category-warning');
  if (calculatedProduct.calculated_category !== productData.target_category) {
    categoryWarning.style.display = 'block';
  } else {
    categoryWarning.style.display = 'none';
  }
}

// الحصول على بيانات المنتج من النموذج
function getProductFormData() {
  const hasSecondaryFabric = document.getElementById('has-secondary-fabric').checked;
  const hasScarf = document.getElementById('has-scarf').checked;
  const hasSecondaryScarf = document.getElementById('has-secondary-scarf').checked;
  
  return {
    name: document.getElementById('product-name').value,
    code: document.getElementById('product-code').value,
    target_category: document.getElementById('target-category').value,
    
    main_fabric_cost: parseFloat(document.getElementById('main-fabric-cost').value) || 0,
    has_secondary_fabric: hasSecondaryFabric,
    secondary_fabric_cost: hasSecondaryFabric ? parseFloat(document.getElementById('secondary-fabric-cost').value) || 0 : 0,
    
    has_scarf: hasScarf,
    main_scarf_cost: hasScarf ? parseFloat(document.getElementById('main-scarf-cost').value) || 0 : 0,
    has_secondary_scarf: hasScarf && hasSecondaryScarf,
    secondary_scarf_cost: hasScarf && hasSecondaryScarf ? parseFloat(document.getElementById('secondary-scarf-cost').value) || 0 : 0,
    
    sewing_cost: parseFloat(document.getElementById('sewing-cost').value) || 0,
    packaging_cost: parseFloat(document.getElementById('packaging-cost').value) || 0,
    shipping_cost: parseFloat(document.getElementById('shipping-cost').value) || 0,
    additional_expenses_rate: parseFloat(document.getElementById('additional-expenses-rate').value) || 0,
    profit_rate: parseFloat(document.getElementById('profit-rate').value) || 0
  };
}

// التحقق من صحة بيانات المنتج
function validateProductData(productData) {
  if (!productData.name) {
    showNotification('يرجى إدخال اسم المنتج', 'error');
    return false;
  }
  
  if (productData.main_fabric_cost <= 0) {
    showNotification('يرجى إدخال تكلفة صحيحة للقماش الأساسي', 'error');
    return false;
  }
  
  if (productData.has_secondary_fabric && productData.secondary_fabric_cost <= 0) {
    showNotification('يرجى إدخال تكلفة صحيحة للقماش الثانوي', 'error');
    return false;
  }
  
  if (productData.has_scarf && productData.main_scarf_cost <= 0) {
    showNotification('يرجى إدخال تكلفة صحيحة لقماش الطرحة الأساسي', 'error');
    return false;
  }
  
  if (productData.has_secondary_scarf && productData.secondary_scarf_cost <= 0) {
    showNotification('يرجى إدخال تكلفة صحيحة لقماش الطرحة الثانوي', 'error');
    return false;
  }
  
  if (productData.sewing_cost <= 0) {
    showNotification('يرجى إدخال تكلفة صحيحة للخياطة', 'error');
    return false;
  }
  
  if (productData.packaging_cost < 0) {
    showNotification('يرجى إدخال تكلفة صحيحة للتغليف', 'error');
    return false;
  }
  
  if (productData.shipping_cost < 0) {
    showNotification('يرجى إدخال تكلفة صحيحة للشحن', 'error');
    return false;
  }
  
  if (productData.additional_expenses_rate < 0 || productData.additional_expenses_rate > 100) {
    showNotification('يرجى إدخال نسبة صحيحة للمصاريف الإضافية (0-100%)', 'error');
    return false;
  }
  
  if (productData.profit_rate <= 0) {
    showNotification('يرجى إدخال نسبة صحيحة للربح', 'error');
    return false;
  }
  
  return true;
}

// تحميل الإعدادات
async function loadSettings() {
  // تحميل إعدادات المستخدم
  await appController.loadUserSettings();
  
  // تعيين قيم الإعدادات في النموذج
  if (appController.userSettings) {
    document.getElementById('project-name').value = appController.userSettings.project_name;
    document.getElementById('default-category').value = appController.userSettings.target_category;
    document.getElementById('monthly-products').value = appController.userSettings.monthly_products;
    document.getElementById('default-profit-rate').value = appController.userSettings.default_profit_rate;
  }
  
  // تحميل التكاليف الثابتة
  loadFixedCosts();
}

// تحميل التكاليف الثابتة
async function loadFixedCosts() {
  // تحميل التكاليف الثابتة
  await appController.loadFixedCosts();
  
  // عرض التكاليف الثابتة
  const fixedCostsList = document.getElementById('fixed-costs-list');
  fixedCostsList.innerHTML = '';
  
  if (appController.fixedCosts.length === 0) {
    fixedCostsList.innerHTML = '<p>لا توجد تكاليف ثابتة مضافة بعد.</p>';
  } else {
    appController.fixedCosts.forEach(cost => {
      const costItem = document.createElement('div');
      costItem.className = 'fixed-cost-item';
      
      costItem.innerHTML = `
        <div class="cost-info">
          <div class="cost-name">${cost.name}</div>
          <div class="cost-amount">${cost.amount} ريال</div>
        </div>
        <div class="cost-actions">
          <button class="icon-btn edit-cost-btn" data-id="${cost.id}" data-name="${cost.name}" data-amount="${cost.amount}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="icon-btn delete-cost-btn" data-id="${cost.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      fixedCostsList.appendChild(costItem);
    });
    
    // إضافة مستمعي أحداث لأزرار التعديل والحذف
    document.querySelectorAll('.edit-cost-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('new-cost-name').value = btn.dataset.name;
        document.getElementById('new-cost-amount').value = btn.dataset.amount;
        document.getElementById('add-cost-btn').dataset.id = btn.dataset.id;
        document.getElementById('add-cost-btn').innerHTML = '<i class="fas fa-check"></i>';
        document.getElementById('add-cost-btn').dataset.action = 'update';
      });
    });
    
    document.querySelectorAll('.delete-cost-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const costId = btn.dataset.id;
        const result = await appController.deleteFixedCost(costId);
        
        if (result.success) {
          showNotification('تم حذف التكلفة الثابتة بنجاح', 'success');
          loadFixedCosts();
        } else {
          showNotification('فشل حذف التكلفة الثابتة: ' + result.error, 'error');
        }
      });
    });
  }
}

// تصدير البيانات
function exportData() {
  // جمع البيانات
  const data = {
    settings: appController.userSettings,
    fixedCosts: appController.fixedCosts,
    products: appController.products
  };
  
  // تحويل البيانات إلى نص JSON
  const jsonData = JSON.stringify(data, null, 2);
  
  // إنشاء رابط تنزيل
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // إنشاء عنصر رابط وتنزيل الملف
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nasiq_data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  showNotification('تم تصدير البيانات بنجاح', 'success');
}

// استيراد البيانات
function importData() {
  // إنشاء عنصر إدخال ملف
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // استيراد الإعدادات
        if (data.settings) {
          await appController.updateSettings(data.settings);
        }
        
        // استيراد التكاليف الثابتة
        if (data.fixedCosts && Array.isArray(data.fixedCosts)) {
          for (const cost of data.fixedCosts) {
            await appController.addFixedCost(cost.name, cost.amount);
          }
        }
        
        // استيراد المنتجات
        if (data.products && Array.isArray(data.products)) {
          for (const product of data.products) {
            await appController.addProduct(product);
          }
        }
        
        showNotification('تم استيراد البيانات بنجاح', 'success');
        loadSettings();
        loadProducts();
      } catch (error) {
        showNotification('فشل استيراد البيانات: ' + error.message, 'error');
      }
    };
    
    reader.readAsText(file);
  });
  
  input.click();
}

// عرض إشعار
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const notificationIcon = document.getElementById('notification-icon');
  const notificationMessage = document.getElementById('notification-message');
  
  // تعيين نوع الإشعار
  switch (type) {
    case 'success':
      notificationIcon.className = 'fas fa-check-circle';
      break;
    case 'warning':
      notificationIcon.className = 'fas fa-exclamation-circle';
      break;
    case 'error':
      notificationIcon.className = 'fas fa-times-circle';
      break;
  }
  
  // تعيين نص الإشعار
  notificationMessage.textContent = message;
  
  // عرض الإشعار
  notification.style.display = 'block';
  
  // إخفاء الإشعار بعد 3 ثوانٍ
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}
