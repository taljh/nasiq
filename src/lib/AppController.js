import { AuthService } from './AuthService.js';
import { ProductService } from './ProductService.js';
import { SettingsService } from './SettingsService.js';

export class AppController {
  constructor() {
    this.authService = new AuthService();
    this.productService = new ProductService();
    this.settingsService = new SettingsService();
    
    this.currentUser = null;
    this.userSettings = null;
    this.fixedCosts = [];
    this.products = [];
    
    // تصنيفات المنتجات
    this.categories = {
      'اقتصادية': { minPrice: 0, maxPrice: 300 },
      'يومية': { minPrice: 301, maxPrice: 600 },
      'راقية': { minPrice: 601, maxPrice: 1000 },
      'فاخرة جداً': { minPrice: 1001, maxPrice: Infinity }
    };
  }

  // تهيئة التطبيق
  async initialize() {
    try {
      // التحقق من وجود مستخدم حالي
      const { success, user } = await this.authService.getCurrentUser();
      
      if (success && user) {
        this.currentUser = user;
        
        // تحميل إعدادات المستخدم
        await this.loadUserSettings();
        
        // تحميل التكاليف الثابتة
        await this.loadFixedCosts();
        
        // تحميل منتجات المستخدم
        await this.loadUserProducts();
        
        return { success: true, isAuthenticated: true };
      }
      
      return { success: true, isAuthenticated: false };
    } catch (error) {
      console.error('خطأ في تهيئة التطبيق:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تسجيل مستخدم جديد
  async register(email, password, name) {
    try {
      const result = await this.authService.register(email, password, name);
      
      if (result.success) {
        this.currentUser = result.data.user;
        
        // إنشاء إعدادات افتراضية للمستخدم
        await this.settingsService.updateSettings({
          project_name: 'مشروعي',
          target_category: 'يومية',
          monthly_products: 100,
          default_profit_rate: 50
        });
        
        // تحميل إعدادات المستخدم
        await this.loadUserSettings();
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في التسجيل:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تسجيل الدخول
  async login(email, password) {
    try {
      const result = await this.authService.login(email, password);
      
      if (result.success) {
        this.currentUser = result.data.user;
        
        // تحميل إعدادات المستخدم
        await this.loadUserSettings();
        
        // تحميل التكاليف الثابتة
        await this.loadFixedCosts();
        
        // تحميل منتجات المستخدم
        await this.loadUserProducts();
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تسجيل الخروج
  async logout() {
    try {
      const result = await this.authService.logout();
      
      if (result.success) {
        this.currentUser = null;
        this.userSettings = null;
        this.fixedCosts = [];
        this.products = [];
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحميل إعدادات المستخدم
  async loadUserSettings() {
    try {
      const result = await this.settingsService.getUserSettings();
      
      if (result.success) {
        this.userSettings = result.data;
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في تحميل إعدادات المستخدم:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحديث إعدادات المستخدم
  async updateSettings(settingsData) {
    try {
      const result = await this.settingsService.updateSettings(settingsData);
      
      if (result.success) {
        this.userSettings = result.data;
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحميل التكاليف الثابتة
  async loadFixedCosts() {
    try {
      const result = await this.settingsService.getFixedCosts();
      
      if (result.success) {
        this.fixedCosts = result.data;
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في تحميل التكاليف الثابتة:', error.message);
      return { success: false, error: error.message };
    }
  }

  // إضافة تكلفة ثابتة
  async addFixedCost(name, amount) {
    try {
      const result = await this.settingsService.addFixedCost(name, amount);
      
      if (result.success) {
        // تحديث قائمة التكاليف الثابتة
        await this.loadFixedCosts();
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في إضافة تكلفة ثابتة:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحديث تكلفة ثابتة
  async updateFixedCost(id, name, amount) {
    try {
      const result = await this.settingsService.updateFixedCost(id, name, amount);
      
      if (result.success) {
        // تحديث قائمة التكاليف الثابتة
        await this.loadFixedCosts();
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في تحديث التكلفة الثابتة:', error.message);
      return { success: false, error: error.message };
    }
  }

  // حذف تكلفة ثابتة
  async deleteFixedCost(id) {
    try {
      const result = await this.settingsService.deleteFixedCost(id);
      
      if (result.success) {
        // تحديث قائمة التكاليف الثابتة
        await this.loadFixedCosts();
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في حذف التكلفة الثابتة:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحميل منتجات المستخدم
  async loadUserProducts() {
    try {
      const result = await this.productService.getUserProducts();
      
      if (result.success) {
        this.products = result.data;
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في تحميل منتجات المستخدم:', error.message);
      return { success: false, error: error.message };
    }
  }

  // إضافة منتج جديد
  async addProduct(productData) {
    try {
      // حساب التكلفة الإجمالية والسعر النهائي
      const calculatedProduct = this.calculateProductPricing(productData);
      
      const result = await this.productService.addProduct(calculatedProduct);
      
      if (result.success) {
        // تحديث قائمة المنتجات
        await this.loadUserProducts();
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في إضافة المنتج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحديث منتج
  async updateProduct(productId, productData) {
    try {
      // حساب التكلفة الإجمالية والسعر النهائي
      const calculatedProduct = this.calculateProductPricing(productData);
      
      const result = await this.productService.updateProduct(productId, calculatedProduct);
      
      if (result.success) {
        // تحديث قائمة المنتجات
        await this.loadUserProducts();
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // حذف منتج
  async deleteProduct(productId) {
    try {
      const result = await this.productService.deleteProduct(productId);
      
      if (result.success) {
        // تحديث قائمة المنتجات
        await this.loadUserProducts();
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // البحث عن منتجات
  async searchProducts(query) {
    try {
      return await this.productService.searchProducts(query);
    } catch (error) {
      console.error('خطأ في البحث عن المنتجات:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تصفية المنتجات حسب الفئة
  async filterProductsByCategory(category) {
    try {
      return await this.productService.filterProductsByCategory(category);
    } catch (error) {
      console.error('خطأ في تصفية المنتجات:', error.message);
      return { success: false, error: error.message };
    }
  }

  // حساب تسعير المنتج
  calculateProductPricing(productData) {
    // حساب تكلفة الأقمشة
    let fabricCost = productData.main_fabric_cost;
    if (productData.has_secondary_fabric) {
      fabricCost += productData.secondary_fabric_cost;
    }
    
    // حساب تكلفة الطرحة
    let scarfCost = 0;
    if (productData.has_scarf) {
      scarfCost += productData.main_scarf_cost;
      if (productData.has_secondary_scarf) {
        scarfCost += productData.secondary_scarf_cost;
      }
    }
    
    // حساب التكاليف المباشرة
    const directCosts = fabricCost + scarfCost + productData.sewing_cost + 
                        productData.packaging_cost + productData.shipping_cost;
    
    // حساب التكاليف الإضافية
    const additionalCosts = directCosts * (productData.additional_expenses_rate / 100);
    
    // حساب التكلفة الإجمالية
    const totalCost = directCosts + additionalCosts;
    
    // حساب السعر النهائي
    const finalPrice = totalCost * (1 + productData.profit_rate / 100);
    
    // تحديد الفئة المحسوبة
    const calculatedCategory = this.determineCategory(finalPrice);
    
    return {
      ...productData,
      total_cost: parseFloat(totalCost.toFixed(2)),
      final_price: parseFloat(finalPrice.toFixed(2)),
      calculated_category: calculatedCategory
    };
  }

  // تحديد فئة المنتج بناءً على السعر
  determineCategory(price) {
    for (const [category, range] of Object.entries(this.categories)) {
      if (price >= range.minPrice && price <= range.maxPrice) {
        return category;
      }
    }
    return 'فاخرة جداً'; // الفئة الافتراضية للأسعار العالية جداً
  }

  // الحصول على إحصائيات المنتجات
  getProductsStatistics() {
    if (!this.products || this.products.length === 0) {
      return {
        totalProducts: 0,
        categoryCounts: {},
        averagePrice: 0,
        totalRevenue: 0
      };
    }
    
    // عدد المنتجات حسب الفئة
    const categoryCounts = {};
    for (const product of this.products) {
      const category = product.calculated_category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
    
    // متوسط السعر
    const totalPrice = this.products.reduce((sum, product) => sum + product.final_price, 0);
    const averagePrice = totalPrice / this.products.length;
    
    // إجمالي الإيرادات المتوقعة
    const totalRevenue = this.products.reduce((sum, product) => {
      const profit = product.final_price - product.total_cost;
      return sum + profit;
    }, 0);
    
    return {
      totalProducts: this.products.length,
      categoryCounts,
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    };
  }
}
