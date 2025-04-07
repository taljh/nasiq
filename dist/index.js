// index.js - Main JavaScript file for Nasiq application

// Import Supabase client and services
import { supabase } from './lib/supabaseClient.js';
import { AuthService } from './lib/AuthService.js';
import { SettingsService } from './lib/SettingsService.js';
import { ProductService } from './lib/ProductService.js';
import { DataMigrationService } from './lib/DataMigrationService.js';
import { AppController } from './lib/AppController.js';

// Initialize services
const authService = new AuthService(supabase);
const settingsService = new SettingsService(supabase);
const productService = new ProductService(supabase);
const dataMigrationService = new DataMigrationService(supabase);
const appController = new AppController(authService, settingsService, productService);

// DOM Elements - Authentication
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const guestLoginBtn = document.getElementById('guestLoginBtn');
const authTabs = document.querySelectorAll('.auth-tab');
const logoutBtn = document.getElementById('logoutBtn');

// DOM Elements - Main App
const mainApp = document.getElementById('mainApp');
const userDisplayName = document.getElementById('userDisplayName');
const userEmail = document.getElementById('userEmail');

// DOM Elements - Dashboard
const totalProducts = document.getElementById('totalProducts');
const avgPrice = document.getElementById('avgPrice');
const avgProfit = document.getElementById('avgProfit');
const categoriesChart = document.getElementById('categoriesChart');

// DOM Elements - Pricing Calculator
const pricingForm = document.getElementById('pricingForm');
const saveProductBtn = document.getElementById('saveProductBtn');
const resetFormBtn = document.getElementById('resetFormBtn');

// DOM Elements - Products List
const productsList = document.getElementById('productsList');
const searchProducts = document.getElementById('searchProducts');
const filterCategory = document.getElementById('filterCategory');
const sortProducts = document.getElementById('sortProducts');
const exportProductsBtn = document.getElementById('exportProductsBtn');
const importProductsBtn = document.getElementById('importProductsBtn');

// DOM Elements - Settings
const projectSettingsForm = document.getElementById('projectSettingsForm');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const fixedCostsTable = document.getElementById('fixedCostsTable');
const addFixedCostBtn = document.getElementById('addFixedCostBtn');
const saveFixedCostsBtn = document.getElementById('saveFixedCostsBtn');

// DOM Elements - Modals
const productDetailModal = new bootstrap.Modal(document.getElementById('productDetailModal'));
const importProductsModal = new bootstrap.Modal(document.getElementById('importProductsModal'));
const confirmImportBtn = document.getElementById('confirmImportBtn');
const productDetailBody = document.getElementById('productDetailBody');
const editProductBtn = document.getElementById('editProductBtn');
const deleteProductBtn = document.getElementById('deleteProductBtn');

// DOM Elements - Notification
const notificationToast = new bootstrap.Toast(document.getElementById('notificationToast'));
const notificationTitle = document.getElementById('notificationTitle');
const notificationBody = document.getElementById('notificationBody');
const notificationTime = document.getElementById('notificationTime');

// Global variables
let currentUser = null;
let currentProductId = null;
let fixedCosts = [];
let categoriesChartInstance = null;

// Initialize the application
async function initializeApp() {
    // Check if user is already logged in
    const session = await authService.getCurrentSession();
    if (session) {
        currentUser = session.user;
        showMainApp();
        loadUserData();
    } else {
        showAuthModal();
    }

    // Initialize event listeners
    initializeEventListeners();
}

// Show authentication modal
function showAuthModal() {
    authModal.style.display = 'flex';
    mainApp.style.display = 'none';
}

// Show main application
function showMainApp() {
    authModal.style.display = 'none';
    mainApp.style.display = 'flex';
    
    // Update user info
    if (currentUser) {
        userDisplayName.textContent = currentUser.user_metadata?.name || 'مستخدم نَسيق';
        userEmail.textContent = currentUser.email || '';
    }
    
    // Load dashboard data
    loadDashboardData();
    
    // Load products
    loadProducts();
    
    // Load settings
    loadSettings();
}

// Load user data
async function loadUserData() {
    try {
        // Check if user has existing data in localStorage
        const hasLocalData = localStorage.getItem('nasiq_products') || localStorage.getItem('nasiq_settings');
        
        if (hasLocalData && currentUser) {
            // Ask user if they want to migrate data
            const shouldMigrate = confirm('تم العثور على بيانات محلية. هل ترغب في نقلها إلى حسابك؟');
            
            if (shouldMigrate) {
                await dataMigrationService.migrateLocalDataToSupabase(currentUser.id);
                showNotification('نجاح', 'تم نقل البيانات بنجاح', 'success');
                
                // Clear local data after migration
                localStorage.removeItem('nasiq_products');
                localStorage.removeItem('nasiq_settings');
                localStorage.removeItem('nasiq_fixed_costs');
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات المستخدم', 'danger');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            
            document.getElementById(`${tabId}Form`).classList.add('active');
        });
    });
    
    // Login button
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showNotification('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور', 'danger');
            return;
        }
        
        try {
            const { user, error } = await authService.signIn(email, password);
            
            if (error) throw error;
            
            currentUser = user;
            showMainApp();
            loadUserData();
            showNotification('نجاح', 'تم تسجيل الدخول بنجاح', 'success');
        } catch (error) {
            console.error('Login error:', error);
            showNotification('خطأ', 'فشل تسجيل الدخول: ' + error.message, 'danger');
        }
    });
    
    // Register button
    registerBtn.addEventListener('click', async () => {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        
        if (!name || !email || !password) {
            showNotification('خطأ', 'يرجى إدخال جميع البيانات المطلوبة', 'danger');
            return;
        }
        
        if (password !== passwordConfirm) {
            showNotification('خطأ', 'كلمات المرور غير متطابقة', 'danger');
            return;
        }
        
        try {
            const { user, error } = await authService.signUp(email, password, { name });
            
            if (error) throw error;
            
            currentUser = user;
            showMainApp();
            showNotification('نجاح', 'تم إنشاء الحساب بنجاح', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('خطأ', 'فشل إنشاء الحساب: ' + error.message, 'danger');
        }
    });
    
    // Guest login button
    guestLoginBtn.addEventListener('click', () => {
        currentUser = null;
        showMainApp();
        showNotification('تنبيه', 'أنت تستخدم التطبيق كزائر. لن يتم حفظ بياناتك بشكل دائم.', 'warning');
    });
    
    // Logout button
    logoutBtn.addEventListener('click', async () => {
        try {
            await authService.signOut();
            currentUser = null;
            showAuthModal();
            showNotification('نجاح', 'تم تسجيل الخروج بنجاح', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('خطأ', 'فشل تسجيل الخروج: ' + error.message, 'danger');
        }
    });
    
    // Save product button
    saveProductBtn.addEventListener('click', saveProduct);
    
    // Reset form button
    resetFormBtn.addEventListener('click', resetPricingForm);
    
    // Export products button
    exportProductsBtn.addEventListener('click', exportProducts);
    
    // Import products button
    importProductsBtn.addEventListener('click', () => {
        importProductsModal.show();
    });
    
    // Confirm import button
    confirmImportBtn.addEventListener('click', importProducts);
    
    // Save settings button
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Add fixed cost button
    addFixedCostBtn.addEventListener('click', addFixedCostRow);
    
    // Save fixed costs button
    saveFixedCostsBtn.addEventListener('click', saveFixedCosts);
    
    // Search, filter, and sort products
    searchProducts.addEventListener('input', filterAndSortProducts);
    filterCategory.addEventListener('change', filterAndSortProducts);
    sortProducts.addEventListener('change', filterAndSortProducts);
    
    // Edit product button
    editProductBtn.addEventListener('click', editProduct);
    
    // Delete product button
    deleteProductBtn.addEventListener('click', deleteProduct);
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const products = await productService.getProducts(currentUser?.id);
        
        // Update stats
        totalProducts.textContent = products.length;
        
        if (products.length > 0) {
            const prices = products.map(p => p.final_price);
            const profits = products.map(p => p.profit_rate);
            
            const avgPriceValue = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const avgProfitValue = profits.reduce((sum, profit) => sum + profit, 0) / profits.length;
            
            avgPrice.textContent = avgPriceValue.toFixed(2) + ' ريال';
            avgProfit.textContent = avgProfitValue.toFixed(2) + '%';
            
            // Update chart
            updateCategoriesChart(products);
        } else {
            avgPrice.textContent = '0 ريال';
            avgProfit.textContent = '0%';
            
            // Create empty chart
            updateCategoriesChart([]);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات لوحة التحكم', 'danger');
    }
}

// Update categories chart
function updateCategoriesChart(products) {
    // Count products by category
    const categoryCounts = {
        'عبايات فاخرة جداً': 0,
        'راقية': 0,
        'يومية': 0,
        'اقتصادية': 0
    };
    
    products.forEach(product => {
        if (categoryCounts.hasOwnProperty(product.calculated_category)) {
            categoryCounts[product.calculated_category]++;
        }
    });
    
    // Prepare chart data
    const data = {
        labels: Object.keys(categoryCounts),
        datasets: [{
            data: Object.values(categoryCounts),
            backgroundColor: [
                '#8e44ad', // Luxury
                '#27ae60', // Premium
                '#f39c12', // Daily
                '#7f8c8d'  // Economy
            ],
            borderWidth: 0
        }]
    };
    
    // Destroy existing chart if it exists
    if (categoriesChartInstance) {
        categoriesChartInstance.destroy();
    }
    
    // Create new chart
    categoriesChartInstance = new Chart(categoriesChart, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
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

// Load products
async function loadProducts() {
    try {
        const products = await productService.getProducts(currentUser?.id);
        
        if (products.length > 0) {
            // Clear no products message
            productsList.innerHTML = '';
            
            // Sort products by date (newest first)
            products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Render products
            products.forEach(product => {
                productsList.appendChild(createProductCard(product));
            });
        } else {
            // Show no products message
            productsList.innerHTML = `
                <div class="no-products-message">
                    <i class="fas fa-box-open"></i>
                    <p>لا توجد منتجات حالياً</p>
                    <button class="btn btn-primary" onclick="document.querySelector('a[href=\\'#pricing\\']').click()">
                        <i class="fas fa-plus"></i> إضافة منتج جديد
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('خطأ', 'حدث خطأ أثناء تحميل المنتجات', 'danger');
    }
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-header">
            <div>
                <h5 class="product-title">${product.name}</h5>
                <div class="product-code">${product.code || 'بدون رمز'}</div>
            </div>
            <div class="product-category category-${getCategoryClass(product.calculated_category)}">
                ${product.calculated_category}
            </div>
        </div>
        <div class="product-body">
            <div class="product-info">
                <div class="info-item">
                    <div class="info-label">إجمالي التكلفة</div>
                    <div class="info-value">${product.total_cost.toFixed(2)} ريال</div>
                </div>
                <div class="info-item">
                    <div class="info-label">نسبة الربح</div>
                    <div class="info-value">${product.profit_rate}%</div>
                </div>
            </div>
        </div>
        <div class="product-footer">
            <div class="product-price">${product.final_price.toFixed(2)} ريال</div>
            <div class="product-actions">
                <button class="btn btn-sm btn-outline-primary view-product-btn" data-id="${product.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add event listener to view button
    card.querySelector('.view-product-btn').addEventListener('click', () => {
        viewProduct(product.id);
    });
    
    return card;
}

// Get category class
function getCategoryClass(category) {
    switch (category) {
        case 'عبايات فاخرة جداً':
            return 'luxury';
        case 'راقية':
            return 'premium';
        case 'يومية':
            return 'daily';
        case 'اقتصادية':
            return 'economy';
        default:
            return 'premium';
    }
}

// View product
async function viewProduct(productId) {
    try {
        const product = await productService.getProduct(productId, currentUser?.id);
        
        if (!product) {
            showNotification('خطأ', 'لم يتم العثور على المنتج', 'danger');
            return;
        }
        
        currentProductId = productId;
        
        // Populate modal
        document.getElementById('productDetailTitle').textContent = product.name;
        
        productDetailBody.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-header">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="detail-group">
                                <label>اسم المنتج</label>
                                <div class="detail-value">${product.name}</div>
                            </div>
                            <div class="detail-group">
                                <label>رمز المنتج</label>
                                <div class="detail-value">${product.code || 'بدون رمز'}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-group">
                                <label>الفئة المستهدفة</label>
                                <div class="detail-value">${product.target_category}</div>
                            </div>
                            <div class="detail-group">
                                <label>الفئة المحسوبة</label>
                                <div class="detail-value">
                                    <span class="product-category category-${getCategoryClass(product.calculated_category)}">
                                        ${product.calculated_category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h4 class="detail-section-title">تكاليف القماش</h4>
                <div class="row">
                    <div class="col-md-6">
                        <div class="detail-group">
                            <label>تكلفة القماش الأساسي</label>
                            <div class="detail-value">${product.main_fabric_cost.toFixed(2)} ريال</div>
                        </div>
                        ${product.has_secondary_fabric ? `
                            <div class="detail-group">
                                <label>تكلفة القماش الثانوي</label>
                                <div class="detail-value">${product.secondary_fabric_cost.toFixed(2)} ريال</div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="col-md-6">
                        ${product.has_scarf ? `
                            <div class="detail-group">
                                <label>تكلفة قماش الطرحة الأساسي</label>
                                <div class="detail-value">${product.main_scarf_cost.toFixed(2)} ريال</div>
                            </div>
                            ${product.has_secondary_scarf ? `
                                <div class="detail-group">
                                    <label>تكلفة قماش الطرحة الثانوي</label>
                                    <div class="detail-value">${product.secondary_scarf_cost.toFixed(2)} ريال</div>
                                </div>
                            ` : ''}
                        ` : ''}
                    </div>
                </div>
                
                <h4 class="detail-section-title">تكاليف الإنتاج</h4>
                <div class="row">
                    <div class="col-md-4">
                        <div class="detail-group">
                            <label>تكلفة الخياطة</label>
                            <div class="detail-value">${product.sewing_cost.toFixed(2)} ريال</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="detail-group">
                            <label>تكلفة التغليف</label>
                            <div class="detail-value">${product.packaging_cost.toFixed(2)} ريال</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="detail-group">
                            <label>تكلفة التوصيل</label>
                            <div class="detail-value">${product.shipping_cost.toFixed(2)} ريال</div>
                        </div>
                    </div>
                </div>
                
                <h4 class="detail-section-title">المصاريف والربحية</h4>
                <div class="row">
                    <div class="col-md-6">
                        <div class="detail-group">
                            <label>نسبة المصاريف الإضافية</label>
                            <div class="detail-value">${product.additional_expenses_rate}%</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="detail-group">
                            <label>نسبة الربح</label>
                            <div class="detail-value">${product.profit_rate}%</div>
                        </div>
                    </div>
                </div>
                
                <h4 class="detail-section-title">النتائج</h4>
                <div class="row">
                    <div class="col-md-6">
                        <div class="detail-group">
                            <label>إجمالي التكلفة</label>
                            <div class="detail-value">${product.total_cost.toFixed(2)} ريال</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="detail-group">
                            <label>السعر النهائي</label>
                            <div class="detail-value final-price">${product.final_price.toFixed(2)} ريال</div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-dates mt-4">
                    <div>تاريخ الإنشاء: ${new Date(product.created_at).toLocaleString('ar-SA')}</div>
                    <div>آخر تحديث: ${new Date(product.updated_at).toLocaleString('ar-SA')}</div>
                </div>
            </div>
        `;
        
        // Show modal
        productDetailModal.show();
    } catch (error) {
        console.error('Error viewing product:', error);
        showNotification('خطأ', 'حدث خطأ أثناء عرض المنتج', 'danger');
    }
}

// Edit product
async function editProduct() {
    try {
        const product = await productService.getProduct(currentProductId, currentUser?.id);
        
        if (!product) {
            showNotification('خطأ', 'لم يتم العثور على المنتج', 'danger');
            return;
        }
        
        // Close modal
        productDetailModal.hide();
        
        // Navigate to pricing calculator
        document.querySelector('a[href="#pricing"]').click();
        
        // Fill form with product data
        document.getElementById('productName').value = product.name;
        document.getElementById('productCode').value = product.code || '';
        document.getElementById('productTargetCategory').value = product.target_category;
        document.getElementById('mainFabricCost').value = product.main_fabric_cost;
        
        document.getElementById('hasSecondaryFabric').checked = product.has_secondary_fabric;
        toggleSecondaryFabric();
        if (product.has_secondary_fabric) {
            document.getElementById('secondaryFabricCost').value = product.secondary_fabric_cost;
        }
        
        document.getElementById('hasScarf').checked = product.has_scarf;
        toggleScarf();
        if (product.has_scarf) {
            document.getElementById('mainScarfCost').value = product.main_scarf_cost;
            
            document.getElementById('hasSecondaryScarf').checked = product.has_secondary_scarf;
            toggleSecondaryScarf();
            if (product.has_secondary_scarf) {
                document.getElementById('secondaryScarfCost').value = product.secondary_scarf_cost;
            }
        }
        
        document.getElementById('sewingCost').value = product.sewing_cost;
        document.getElementById('packagingCost').value = product.packaging_cost;
        document.getElementById('shippingCost').value = product.shipping_cost;
        document.getElementById('additionalExpensesRate').value = product.additional_expenses_rate;
        document.getElementById('profitRate').value = product.profit_rate;
        
        // Calculate price
        calculateProductPrice();
        
        // Update save button text
        saveProductBtn.innerHTML = '<i class="fas fa-save"></i> تحديث المنتج';
        
        showNotification('تنبيه', 'يمكنك الآن تعديل المنتج', 'info');
    } catch (error) {
        console.error('Error editing product:', error);
        showNotification('خطأ', 'حدث خطأ أثناء تعديل المنتج', 'danger');
    }
}

// Delete product
async function deleteProduct() {
    try {
        const confirmed = confirm('هل أنت متأكد من حذف هذا المنتج؟');
        
        if (!confirmed) return;
        
        await productService.deleteProduct(currentProductId, currentUser?.id);
        
        // Close modal
        productDetailModal.hide();
        
        // Reload products
        loadProducts();
        
        // Reload dashboard
        loadDashboardData();
        
        showNotification('نجاح', 'تم حذف المنتج بنجاح', 'success');
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('خطأ', 'حدث خطأ أثناء حذف المنتج', 'danger');
    }
}

// Calculate product price
function calculateProductPrice() {
    // Get form values
    const mainFabricCost = parseFloat(document.getElementById('mainFabricCost').value) || 0;
    
    const hasSecondaryFabric = document.getElementById('hasSecondaryFabric').checked;
    const secondaryFabricCost = hasSecondaryFabric ? (parseFloat(document.getElementById('secondaryFabricCost').value) || 0) : 0;
    
    const hasScarf = document.getElementById('hasScarf').checked;
    const mainScarfCost = hasScarf ? (parseFloat(document.getElementById('mainScarfCost').value) || 0) : 0;
    
    const hasSecondaryScarf = hasScarf && document.getElementById('hasSecondaryScarf').checked;
    const secondaryScarfCost = hasSecondaryScarf ? (parseFloat(document.getElementById('secondaryScarfCost').value) || 0) : 0;
    
    const sewingCost = parseFloat(document.getElementById('sewingCost').value) || 0;
    const packagingCost = parseFloat(document.getElementById('packagingCost').value) || 0;
    const shippingCost = parseFloat(document.getElementById('shippingCost').value) || 0;
    
    const additionalExpensesRate = parseFloat(document.getElementById('additionalExpensesRate').value) || 0;
    const profitRate = parseFloat(document.getElementById('profitRate').value) || 0;
    
    // Calculate costs
    const materialsCost = mainFabricCost + secondaryFabricCost + mainScarfCost + secondaryScarfCost;
    const productionCost = sewingCost + packagingCost + shippingCost;
    const additionalExpenses = (materialsCost + productionCost) * (additionalExpensesRate / 100);
    
    // Get fixed cost per product
    const fixedCostPerProduct = parseFloat(document.getElementById('totalCostPerProduct')?.textContent || 0);
    
    // Calculate total cost
    const totalCost = materialsCost + productionCost + additionalExpenses + fixedCostPerProduct;
    
    // Calculate profit amount
    const profitAmount = totalCost * (profitRate / 100);
    
    // Calculate final price
    const finalPrice = totalCost + profitAmount;
    
    // Update results
    document.getElementById('totalCost').textContent = totalCost.toFixed(2) + ' ريال';
    document.getElementById('finalPrice').textContent = finalPrice.toFixed(2) + ' ريال';
    
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
    
    document.getElementById('calculatedCategory').textContent = calculatedCategory;
    
    // Compare with target category
    const targetCategory = document.getElementById('productTargetCategory').value;
    const categoryAlert = document.getElementById('categoryAlert');
    
    if (calculatedCategory === targetCategory) {
        categoryAlert.className = 'alert alert-success mt-3';
        categoryAlert.innerHTML = '<i class="fas fa-check-circle"></i> الفئة المحسوبة تتطابق مع الفئة المستهدفة';
    } else {
        categoryAlert.className = 'alert alert-warning mt-3';
        categoryAlert.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> الفئة المحسوبة (${calculatedCategory}) لا تتطابق مع الفئة المستهدفة (${targetCategory})
            <div class="mt-2">
                <strong>توصيات:</strong>
                <ul class="mb-0">
                    ${calculatedCategory < targetCategory ? `
                        <li>زيادة تكلفة المواد الخام</li>
                        <li>زيادة نسبة الربح</li>
                    ` : `
                        <li>تقليل تكلفة المواد الخام</li>
                        <li>تقليل نسبة الربح</li>
                    `}
                </ul>
            </div>
        `;
    }
}

// Save product
async function saveProduct() {
    try {
        // Get form values
        const name = document.getElementById('productName').value;
        const code = document.getElementById('productCode').value;
        const targetCategory = document.getElementById('productTargetCategory').value;
        
        if (!name) {
            showNotification('خطأ', 'يرجى إدخال اسم المنتج', 'danger');
            return;
        }
        
        const mainFabricCost = parseFloat(document.getElementById('mainFabricCost').value) || 0;
        
        const hasSecondaryFabric = document.getElementById('hasSecondaryFabric').checked;
        const secondaryFabricCost = hasSecondaryFabric ? (parseFloat(document.getElementById('secondaryFabricCost').value) || 0) : 0;
        
        const hasScarf = document.getElementById('hasScarf').checked;
        const mainScarfCost = hasScarf ? (parseFloat(document.getElementById('mainScarfCost').value) || 0) : 0;
        
        const hasSecondaryScarf = hasScarf && document.getElementById('hasSecondaryScarf').checked;
        const secondaryScarfCost = hasSecondaryScarf ? (parseFloat(document.getElementById('secondaryScarfCost').value) || 0) : 0;
        
        const sewingCost = parseFloat(document.getElementById('sewingCost').value) || 0;
        const packagingCost = parseFloat(document.getElementById('packagingCost').value) || 0;
        const shippingCost = parseFloat(document.getElementById('shippingCost').value) || 0;
        
        const additionalExpensesRate = parseFloat(document.getElementById('additionalExpensesRate').value) || 0;
        const profitRate = parseFloat(document.getElementById('profitRate').value) || 0;
        
        // Calculate costs
        const materialsCost = mainFabricCost + secondaryFabricCost + mainScarfCost + secondaryScarfCost;
        const productionCost = sewingCost + packagingCost + shippingCost;
        const additionalExpenses = (materialsCost + productionCost) * (additionalExpensesRate / 100);
        
        // Get fixed cost per product
        const fixedCostPerProduct = parseFloat(document.getElementById('totalCostPerProduct')?.textContent || 0);
        
        // Calculate total cost
        const totalCost = materialsCost + productionCost + additionalExpenses + fixedCostPerProduct;
        
        // Calculate profit amount
        const profitAmount = totalCost * (profitRate / 100);
        
        // Calculate final price
        const finalPrice = totalCost + profitAmount;
        
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
        
        // Create product object
        const product = {
            id: currentProductId,
            name,
            code,
            target_category: targetCategory,
            calculated_category: calculatedCategory,
            main_fabric_cost: mainFabricCost,
            has_secondary_fabric: hasSecondaryFabric,
            secondary_fabric_cost: secondaryFabricCost,
            has_scarf: hasScarf,
            main_scarf_cost: mainScarfCost,
            has_secondary_scarf: hasSecondaryScarf,
            secondary_scarf_cost: secondaryScarfCost,
            sewing_cost: sewingCost,
            packaging_cost: packagingCost,
            shipping_cost: shippingCost,
            additional_expenses_rate: additionalExpensesRate,
            profit_rate: profitRate,
            total_cost: totalCost,
            final_price: finalPrice,
            user_id: currentUser?.id
        };
        
        // Save product
        if (currentProductId) {
            await productService.updateProduct(product, currentUser?.id);
            showNotification('نجاح', 'تم تحديث المنتج بنجاح', 'success');
        } else {
            await productService.createProduct(product, currentUser?.id);
            showNotification('نجاح', 'تم إضافة المنتج بنجاح', 'success');
        }
        
        // Reset form
        resetPricingForm();
        
        // Reload products
        loadProducts();
        
        // Reload dashboard
        loadDashboardData();
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('خطأ', 'حدث خطأ أثناء حفظ المنتج', 'danger');
    }
}

// Reset pricing form
function resetPricingForm() {
    pricingForm.reset();
    
    // Reset secondary fabric
    document.getElementById('hasSecondaryFabric').checked = false;
    document.getElementById('secondaryFabricGroup').style.display = 'none';
    
    // Reset scarf
    document.getElementById('hasScarf').checked = false;
    document.getElementById('scarfGroup').style.display = 'none';
    document.getElementById('hasSecondaryScarfSwitch').style.display = 'none';
    
    // Reset secondary scarf
    document.getElementById('hasSecondaryScarf').checked = false;
    document.getElementById('secondaryScarfGroup').style.display = 'none';
    
    // Reset results
    document.getElementById('totalCost').textContent = '0.00 ريال';
    document.getElementById('finalPrice').textContent = '0.00 ريال';
    document.getElementById('calculatedCategory').textContent = '-';
    
    // Reset category alert
    const categoryAlert = document.getElementById('categoryAlert');
    categoryAlert.className = 'alert alert-info mt-3';
    categoryAlert.innerHTML = '<i class="fas fa-info-circle"></i> أدخل بيانات المنتج لحساب السعر والفئة';
    
    // Reset save button text
    saveProductBtn.innerHTML = '<i class="fas fa-save"></i> حفظ المنتج';
    
    // Reset current product ID
    currentProductId = null;
}

// Export products
async function exportProducts() {
    try {
        const products = await productService.getProducts(currentUser?.id);
        
        if (products.length === 0) {
            showNotification('تنبيه', 'لا توجد منتجات للتصدير', 'warning');
            return;
        }
        
        // Create JSON string
        const jsonString = JSON.stringify(products, null, 2);
        
        // Create download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'nasiq_products.json';
        link.click();
        
        showNotification('نجاح', 'تم تصدير المنتجات بنجاح', 'success');
    } catch (error) {
        console.error('Error exporting products:', error);
        showNotification('خطأ', 'حدث خطأ أثناء تصدير المنتجات', 'danger');
    }
}

// Import products
async function importProducts() {
    try {
        let productsData = null;
        
        // Check if file is selected
        const importFile = document.getElementById('importFile');
        if (importFile.files.length > 0) {
            const file = importFile.files[0];
            const fileContent = await file.text();
            productsData = JSON.parse(fileContent);
        } else {
            // Check if data is pasted
            const importData = document.getElementById('importData').value;
            if (importData) {
                productsData = JSON.parse(importData);
            }
        }
        
        if (!productsData || !Array.isArray(productsData) || productsData.length === 0) {
            showNotification('خطأ', 'يرجى اختيار ملف صالح أو إدخال بيانات صالحة', 'danger');
            return;
        }
        
        // Import products
        for (const product of productsData) {
            // Set user ID
            product.user_id = currentUser?.id;
            
            // Remove ID to create new product
            delete product.id;
            
            await productService.createProduct(product, currentUser?.id);
        }
        
        // Close modal
        importProductsModal.hide();
        
        // Reset form
        document.getElementById('importFile').value = '';
        document.getElementById('importData').value = '';
        
        // Reload products
        loadProducts();
        
        // Reload dashboard
        loadDashboardData();
        
        showNotification('نجاح', `تم استيراد ${productsData.length} منتج بنجاح`, 'success');
    } catch (error) {
        console.error('Error importing products:', error);
        showNotification('خطأ', 'حدث خطأ أثناء استيراد المنتجات: ' + error.message, 'danger');
    }
}

// Filter and sort products
async function filterAndSortProducts() {
    try {
        const products = await productService.getProducts(currentUser?.id);
        
        if (products.length === 0) {
            return;
        }
        
        const searchTerm = searchProducts.value.toLowerCase();
        const filterValue = filterCategory.value;
        const sortValue = sortProducts.value;
        
        // Filter products
        let filteredProducts = products.filter(product => {
            // Search filter
            const nameMatch = product.name.toLowerCase().includes(searchTerm);
            const codeMatch = product.code?.toLowerCase().includes(searchTerm);
            
            // Category filter
            const categoryMatch = filterValue === 'all' || product.calculated_category === filterValue;
            
            return (nameMatch || codeMatch) && categoryMatch;
        });
        
        // Sort products
        switch (sortValue) {
            case 'name':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price':
                filteredProducts.sort((a, b) => a.final_price - b.final_price);
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => b.final_price - a.final_price);
                break;
            case 'profit':
                filteredProducts.sort((a, b) => b.profit_rate - a.profit_rate);
                break;
            default: // date
                filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }
        
        // Clear products list
        productsList.innerHTML = '';
        
        if (filteredProducts.length > 0) {
            // Render filtered products
            filteredProducts.forEach(product => {
                productsList.appendChild(createProductCard(product));
            });
        } else {
            // Show no products message
            productsList.innerHTML = `
                <div class="no-products-message">
                    <i class="fas fa-search"></i>
                    <p>لا توجد منتجات تطابق معايير البحث</p>
                    <button class="btn btn-outline-secondary" onclick="document.getElementById('searchProducts').value = ''; document.getElementById('filterCategory').value = 'all'; document.getElementById('sortProducts').value = 'date'; filterAndSortProducts();">
                        <i class="fas fa-redo"></i> إعادة تعيين البحث
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error filtering products:', error);
        showNotification('خطأ', 'حدث خطأ أثناء تصفية المنتجات', 'danger');
    }
}

// Load settings
async function loadSettings() {
    try {
        const settings = await settingsService.getSettings(currentUser?.id);
        
        if (settings) {
            document.getElementById('projectName').value = settings.project_name || '';
            document.getElementById('targetCategory').value = settings.target_category || 'راقية';
            document.getElementById('monthlyProducts').value = settings.monthly_products || 100;
            document.getElementById('defaultProfitRate').value = settings.default_profit_rate || 50;
            
            // Update pricing form with default values
            document.getElementById('productTargetCategory').value = settings.target_category || 'راقية';
            document.getElementById('profitRate').value = settings.default_profit_rate || 50;
        }
        
        // Load fixed costs
        const costs = await settingsService.getFixedCosts(currentUser?.id);
        
        if (costs && costs.length > 0) {
            fixedCosts = costs;
            
            // Clear existing rows
            const rows = fixedCostsTable.querySelectorAll('tr:not(.total-row):not(#addFixedCostRow)');
            rows.forEach(row => row.remove());
            
            // Add fixed cost rows
            costs.forEach((cost, index) => {
                addFixedCostRow(cost, index);
            });
            
            // Update totals
            updateFixedCostsTotals();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('خطأ', 'حدث خطأ أثناء تحميل الإعدادات', 'danger');
    }
}

// Save settings
async function saveSettings() {
    try {
        const projectName = document.getElementById('projectName').value;
        const targetCategory = document.getElementById('targetCategory').value;
        const monthlyProducts = parseInt(document.getElementById('monthlyProducts').value) || 100;
        const defaultProfitRate = parseFloat(document.getElementById('defaultProfitRate').value) || 50;
        
        const settings = {
            project_name: projectName,
            target_category: targetCategory,
            monthly_products: monthlyProducts,
            default_profit_rate: defaultProfitRate,
            user_id: currentUser?.id
        };
        
        await settingsService.saveSettings(settings, currentUser?.id);
        
        // Update pricing form with default values
        document.getElementById('productTargetCategory').value = targetCategory;
        document.getElementById('profitRate').value = defaultProfitRate;
        
        showNotification('نجاح', 'تم حفظ الإعدادات بنجاح', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('خطأ', 'حدث خطأ أثناء حفظ الإعدادات', 'danger');
    }
}

// Add fixed cost row
function addFixedCostRow(cost = null, index = null) {
    const addRow = document.getElementById('addFixedCostRow');
    
    const newRow = document.createElement('tr');
    newRow.className = 'fixed-cost-row';
    newRow.innerHTML = `
        <td>
            <input type="text" class="form-control form-control-sm cost-name" value="${cost ? cost.name : ''}" placeholder="اسم البند">
        </td>
        <td>
            <div class="input-group input-group-sm">
                <input type="number" class="form-control form-control-sm cost-amount" value="${cost ? cost.amount : ''}" placeholder="0" min="0" step="0.01" onchange="updateFixedCostsTotals()">
                <span class="input-group-text">ريال</span>
            </div>
        </td>
        <td class="text-center">
            <span class="monthly-products">${document.getElementById('monthlyProducts').value || 100}</span>
        </td>
        <td>
            <div class="d-flex justify-content-between align-items-center">
                <span class="cost-per-product">0.00</span> ريال
                <button type="button" class="btn btn-sm btn-outline-danger remove-cost-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </td>
    `;
    
    // Add event listener to remove button
    newRow.querySelector('.remove-cost-btn').addEventListener('click', function() {
        newRow.remove();
        updateFixedCostsTotals();
    });
    
    // Insert before add row
    fixedCostsTable.querySelector('tbody').insertBefore(newRow, addRow);
    
    // Update totals
    updateFixedCostsTotals();
}

// Update fixed costs totals
function updateFixedCostsTotals() {
    const monthlyProducts = parseInt(document.getElementById('monthlyProducts').value) || 100;
    
    // Update monthly products in all rows
    document.querySelectorAll('.monthly-products').forEach(span => {
        span.textContent = monthlyProducts;
    });
    
    let totalMonthlyCost = 0;
    
    // Calculate cost per product for each row
    document.querySelectorAll('.fixed-cost-row').forEach(row => {
        const amount = parseFloat(row.querySelector('.cost-amount').value) || 0;
        totalMonthlyCost += amount;
        
        const costPerProduct = amount / monthlyProducts;
        row.querySelector('.cost-per-product').textContent = costPerProduct.toFixed(2);
    });
    
    // Update totals
    document.getElementById('totalMonthlyCost').textContent = totalMonthlyCost.toFixed(2);
    
    const totalCostPerProduct = totalMonthlyCost / monthlyProducts;
    document.getElementById('totalCostPerProduct').textContent = totalCostPerProduct.toFixed(2);
    
    // Recalculate product price if form is filled
    if (document.getElementById('mainFabricCost').value) {
        calculateProductPrice();
    }
}

// Save fixed costs
async function saveFixedCosts() {
    try {
        const costs = [];
        
        document.querySelectorAll('.fixed-cost-row').forEach(row => {
            const name = row.querySelector('.cost-name').value;
            const amount = parseFloat(row.querySelector('.cost-amount').value) || 0;
            
            if (name && amount > 0) {
                costs.push({
                    name,
                    amount,
                    user_id: currentUser?.id
                });
            }
        });
        
        await settingsService.saveFixedCosts(costs, currentUser?.id);
        
        fixedCosts = costs;
        
        showNotification('نجاح', 'تم حفظ التكاليف الثابتة بنجاح', 'success');
    } catch (error) {
        console.error('Error saving fixed costs:', error);
        showNotification('خطأ', 'حدث خطأ أثناء حفظ التكاليف الثابتة', 'danger');
    }
}

// Show notification
function showNotification(title, message, type = 'info') {
    notificationTitle.textContent = title;
    notificationBody.textContent = message;
    notificationTime.textContent = new Date().toLocaleTimeString('ar-SA');
    
    // Set notification type
    notificationToast.className = notificationToast.className.replace(/bg-\w+/, '');
    notificationToast.classList.add(`bg-${type}`);
    
    // Show notification
    notificationToast.show();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);
