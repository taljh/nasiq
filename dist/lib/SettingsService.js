// SettingsService.js - Handles project settings with Supabase
import { supabase } from './supabaseClient';

class SettingsService {
  constructor() {
    this.settings = null;
    this.fixedCosts = [];
    this.listeners = [];
  }

  // Load settings for a user
  async loadSettings(userId) {
    if (!userId) {
      console.error('User ID is required to load settings');
      return null;
    }

    try {
      // Get project settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('project_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine for new users
        throw settingsError;
      }

      // Get fixed costs
      const { data: costsData, error: costsError } = await supabase
        .from('fixed_costs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (costsError) {
        throw costsError;
      }

      // If no settings exist, create default settings
      if (!settingsData) {
        const defaultSettings = {
          user_id: userId,
          project_name: 'نَسيق',
          target_category: 'راقية',
          monthly_products: 100,
          default_profit_rate: 50
        };

        const { data: newSettings, error: createError } = await supabase
          .from('project_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        this.settings = newSettings;
      } else {
        this.settings = settingsData;
      }

      // If no fixed costs exist, create default ones
      if (costsData.length === 0) {
        const defaultCosts = [
          { user_id: userId, name: 'إيجار المشغل', monthly_cost: 0 },
          { user_id: userId, name: 'رواتب الموظفين', monthly_cost: 0 },
          { user_id: userId, name: 'اشتراك الموقع الإلكتروني', monthly_cost: 0 },
          { user_id: userId, name: 'مصاريف إدارية', monthly_cost: 0 },
          { user_id: userId, name: 'مصاريف تسويقية ثابتة', monthly_cost: 0 }
        ];

        const { data: newCosts, error: createCostsError } = await supabase
          .from('fixed_costs')
          .insert(defaultCosts)
          .select();

        if (createCostsError) {
          throw createCostsError;
        }

        this.fixedCosts = newCosts;
      } else {
        this.fixedCosts = costsData;
      }

      this.notifyListeners();
      return { settings: this.settings, fixedCosts: this.fixedCosts };
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  // Save project settings
  async saveSettings(settings) {
    if (!settings.user_id) {
      console.error('User ID is required to save settings');
      return { success: false, error: 'User ID is required' };
    }

    try {
      const { data, error } = await supabase
        .from('project_settings')
        .upsert(settings)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.settings = data;
      this.notifyListeners();
      return { success: true, settings: data };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.' 
      };
    }
  }

  // Save fixed costs
  async saveFixedCosts(costs) {
    if (!costs || !costs.length) {
      return { success: false, error: 'No costs provided' };
    }

    try {
      // Delete existing costs
      const { error: deleteError } = await supabase
        .from('fixed_costs')
        .delete()
        .eq('user_id', costs[0].user_id);

      if (deleteError) {
        throw deleteError;
      }

      // Insert new costs
      const { data, error } = await supabase
        .from('fixed_costs')
        .insert(costs)
        .select();

      if (error) {
        throw error;
      }

      this.fixedCosts = data;
      this.notifyListeners();
      return { success: true, fixedCosts: data };
    } catch (error) {
      console.error('Error saving fixed costs:', error);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ أثناء حفظ التكاليف الثابتة. يرجى المحاولة مرة أخرى.' 
      };
    }
  }

  // Get settings
  getSettings() {
    return this.settings;
  }

  // Get fixed costs
  getFixedCosts() {
    return this.fixedCosts;
  }

  // Calculate total fixed cost per product
  calculateFixedCostPerProduct() {
    if (!this.settings || !this.fixedCosts.length) {
      return 0;
    }

    const totalMonthlyCost = this.fixedCosts.reduce((sum, cost) => sum + parseFloat(cost.monthly_cost || 0), 0);
    return this.settings.monthly_products > 0 ? totalMonthlyCost / this.settings.monthly_products : 0;
  }

  // Add settings change listener
  addListener(listener) {
    this.listeners.push(listener);
    // Call immediately with current settings if available
    if (this.settings) {
      listener({ settings: this.settings, fixedCosts: this.fixedCosts });
    }
  }

  // Remove settings change listener
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Notify all listeners of settings changes
  notifyListeners() {
    this.listeners.forEach(listener => listener({ settings: this.settings, fixedCosts: this.fixedCosts }));
  }
}

// Create and export settings service instance
const settingsService = new SettingsService();
export default settingsService;
