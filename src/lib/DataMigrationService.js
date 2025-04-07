// DataMigrationService.js - Handles migration from localStorage to Supabase
import { supabase } from './supabaseClient';
import authService from './AuthService';
import settingsService from './SettingsService';
import productService from './ProductService';

class DataMigrationService {
  constructor() {
    this.migrationStatus = {
      inProgress: false,
      completed: false,
      error: null
    };
  }

  // Check if there's data in localStorage to migrate
  hasLocalData() {
    return !!(
      localStorage.getItem('settings') ||
      localStorage.getItem('products')
    );
  }

  // Migrate data from localStorage to Supabase
  async migrateData(userId) {
    if (!userId) {
      console.error('User ID is required to migrate data');
      return {
        success: false,
        error: 'معرف المستخدم مطلوب لنقل البيانات'
      };
    }

    if (this.migrationStatus.inProgress) {
      return {
        success: false,
        error: 'عملية نقل البيانات قيد التنفيذ بالفعل'
      };
    }

    this.migrationStatus = {
      inProgress: true,
      completed: false,
      error: null
    };

    try {
      // Migrate settings
      const settingsResult = await this.migrateSettings(userId);
      
      // Migrate products
      const productsResult = await this.migrateProducts(userId);

      // Update migration status
      this.migrationStatus = {
        inProgress: false,
        completed: true,
        error: null
      };

      return {
        success: true,
        settings: settingsResult,
        products: productsResult
      };
    } catch (error) {
      console.error('Error during data migration:', error);
      
      this.migrationStatus = {
        inProgress: false,
        completed: false,
        error: error.message || 'حدث خطأ أثناء نقل البيانات'
      };
      
      return {
        success: false,
        error: error.message || 'حدث خطأ أثناء نقل البيانات'
      };
    }
  }

  // Migrate settings from localStorage to Supabase
  async migrateSettings(userId) {
    const localSettings = localStorage.getItem('settings');
    
    if (!localSettings) {
      return { migrated: false, reason: 'No settings found in localStorage' };
    }

    try {
      const parsedSettings = JSON.parse(localSettings);
      
      // Prepare settings object for Supabase
      const settings = {
        user_id: userId,
        project_name: parsedSettings.projectName || 'نَسيق',
        target_category: parsedSettings.targetCategory || 'راقية',
        monthly_products: parsedSettings.monthlyProducts || 100,
        default_profit_rate: parsedSettings.defaultProfitRate || 50
      };

      // Save settings to Supabase
      const result = await settingsService.saveSettings(settings);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Migrate fixed costs if they exist
      if (parsedSettings.fixedCosts && Array.isArray(parsedSettings.fixedCosts)) {
        const fixedCosts = parsedSettings.fixedCosts.map(cost => ({
          user_id: userId,
          name: cost.name,
          monthly_cost: cost.monthlyCost || 0
        }));

        const costsResult = await settingsService.saveFixedCosts(fixedCosts);
        
        if (!costsResult.success) {
          throw new Error(costsResult.error);
        }
      }

      return { migrated: true, settings: result.settings };
    } catch (error) {
      console.error('Error migrating settings:', error);
      throw error;
    }
  }

  // Migrate products from localStorage to Supabase
  async migrateProducts(userId) {
    const localProducts = localStorage.getItem('products');
    
    if (!localProducts) {
      return { migrated: false, reason: 'No products found in localStorage' };
    }

    try {
      const parsedProducts = JSON.parse(localProducts);
      
      if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
        return { migrated: false, reason: 'No valid products found in localStorage' };
      }

      // Prepare products for Supabase
      const products = parsedProducts.map(product => ({
        user_id: userId,
        name: product.name || 'منتج بدون اسم',
        code: product.code || '',
        category: product.category || 'راقية',
        main_fabric_cost: product.mainFabricCost || 0,
        has_secondary_fabric: product.hasSecondaryFabric || false,
        secondary_fabric_cost: product.secondaryFabricCost || 0,
        has_scarf: product.hasScarf || false,
        main_scarf_cost: product.mainScarfCost || 0,
        has_secondary_scarf: product.hasSecondaryScarf || false,
        secondary_scarf_cost: product.secondaryScarfCost || 0,
        sewing_cost: product.sewingCost || 0,
        packaging_cost: product.packagingCost || 0,
        shipping_cost: product.shippingCost || 0,
        additional_expenses_rate: product.additionalExpensesRate || 10,
        profit_rate: product.profitRate || 50,
        total_cost: product.totalCost || 0,
        final_price: product.finalPrice || 0,
        calculated_category: product.calculatedCategory || 'راقية',
        target_category: product.targetCategory || 'راقية'
      }));

      // Insert products in batches to avoid hitting API limits
      const batchSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('products')
          .insert(batch)
          .select();

        if (error) {
          throw error;
        }

        insertedCount += (data || []).length;
      }

      // Reload products to ensure we have the latest data
      await productService.loadProducts(userId);

      return { migrated: true, count: insertedCount };
    } catch (error) {
      console.error('Error migrating products:', error);
      throw error;
    }
  }

  // Clear localStorage after successful migration
  clearLocalStorage() {
    localStorage.removeItem('settings');
    localStorage.removeItem('products');
    localStorage.removeItem('currentUser');
    
    // Clear any other app-related items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('settings_') || key.startsWith('products_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return { success: true };
  }

  // Get migration status
  getMigrationStatus() {
    return { ...this.migrationStatus };
  }
}

// Create and export data migration service instance
const dataMigrationService = new DataMigrationService();
export default dataMigrationService;
