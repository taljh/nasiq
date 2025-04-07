// AppController.js - Main controller for the Nasiq application
import { supabase } from './supabaseClient';
import authService from './AuthService';
import settingsService from './SettingsService';
import productService from './ProductService';
import dataMigrationService from './DataMigrationService';

class AppController {
  constructor() {
    this.initialized = false;
    this.currentUser = null;
    this.appListeners = [];
    
    // Initialize the app
    this.init();
  }

  // Initialize the application
  async init() {
    if (this.initialized) return;
    
    try {
      // Set up auth state listener
      authService.addAuthListener(this.handleAuthChange.bind(this));
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  // Handle authentication state changes
  async handleAuthChange(user) {
    this.currentUser = user;
    
    if (user) {
      // User is authenticated, load their data
      await this.loadUserData(user.id);
      
      // Check if there's data to migrate from localStorage
      if (dataMigrationService.hasLocalData()) {
        await this.migrateLocalData(user.id);
      }
    }
    
    // Notify app listeners of the auth state change
    this.notifyAppListeners({
      type: 'AUTH_CHANGE',
      user: this.currentUser
    });
  }

  // Load user data from Supabase
  async loadUserData(userId) {
    try {
      // Load settings and fixed costs
      await settingsService.loadSettings(userId);
      
      // Load products
      await productService.loadProducts(userId);
      
      // Notify app listeners that data is loaded
      this.notifyAppListeners({
        type: 'DATA_LOADED',
        userId
      });
      
      return true;
    } catch (error) {
      console.error('Error loading user data:', error);
      return false;
    }
  }

  // Migrate data from localStorage to Supabase
  async migrateLocalData(userId) {
    try {
      // Notify app listeners that migration is starting
      this.notifyAppListeners({
        type: 'MIGRATION_START'
      });
      
      // Perform the migration
      const result = await dataMigrationService.migrateData(userId);
      
      if (result.success) {
        // Clear localStorage after successful migration
        dataMigrationService.clearLocalStorage();
        
        // Notify app listeners that migration is complete
        this.notifyAppListeners({
          type: 'MIGRATION_COMPLETE',
          result
        });
      } else {
        // Notify app listeners that migration failed
        this.notifyAppListeners({
          type: 'MIGRATION_ERROR',
          error: result.error
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error migrating local data:', error);
      
      // Notify app listeners that migration failed
      this.notifyAppListeners({
        type: 'MIGRATION_ERROR',
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Register a new user
  async registerUser(name, email, password) {
    return authService.register(name, email, password);
  }

  // Login a user
  async loginUser(email, password) {
    return authService.login(email, password);
  }

  // Login as guest
  async loginAsGuest() {
    return authService.loginAsGuest();
  }

  // Logout the current user
  async logoutUser() {
    return authService.logout();
  }

  // Save project settings
  async saveSettings(settings) {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول لحفظ الإعدادات'
      };
    }
    
    // Ensure user_id is set
    settings.user_id = this.currentUser.id;
    
    return settingsService.saveSettings(settings);
  }

  // Save fixed costs
  async saveFixedCosts(costs) {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول لحفظ التكاليف الثابتة'
      };
    }
    
    // Ensure user_id is set for each cost
    const costsWithUserId = costs.map(cost => ({
      ...cost,
      user_id: this.currentUser.id
    }));
    
    return settingsService.saveFixedCosts(costsWithUserId);
  }

  // Add a new product
  async addProduct(product) {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول لإضافة منتج'
      };
    }
    
    // Ensure user_id is set
    product.user_id = this.currentUser.id;
    
    return productService.addProduct(product);
  }

  // Update an existing product
  async updateProduct(product) {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول لتحديث منتج'
      };
    }
    
    // Ensure user_id is set
    product.user_id = this.currentUser.id;
    
    return productService.updateProduct(product);
  }

  // Delete a product
  async deleteProduct(productId) {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول لحذف منتج'
      };
    }
    
    return productService.deleteProduct(productId, this.currentUser.id);
  }

  // Import products from JSON
  async importProducts(json) {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول لاستيراد المنتجات'
      };
    }
    
    return productService.importProductsFromJson(json, this.currentUser.id);
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.currentUser;
  }

  // Get current settings
  getSettings() {
    return settingsService.getSettings();
  }

  // Get fixed costs
  getFixedCosts() {
    return settingsService.getFixedCosts();
  }

  // Get all products
  getProducts() {
    return productService.getAllProducts();
  }

  // Get product statistics
  getProductStats() {
    return productService.getProductStats();
  }

  // Add app state change listener
  addAppListener(listener) {
    this.appListeners.push(listener);
  }

  // Remove app state change listener
  removeAppListener(listener) {
    this.appListeners = this.appListeners.filter(l => l !== listener);
  }

  // Notify all app listeners of state changes
  notifyAppListeners(event) {
    this.appListeners.forEach(listener => listener(event));
  }
}

// Create and export app controller instance
const appController = new AppController();
export default appController;
