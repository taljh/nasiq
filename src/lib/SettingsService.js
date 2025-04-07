import { supabase } from './supabaseClient.js';

export class SettingsService {
  // الحصول على إعدادات المستخدم
  async getUserSettings() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 هو رمز الخطأ عندما لا توجد نتائج
        throw error;
      }
      
      // إذا لم تكن هناك إعدادات، قم بإنشاء إعدادات افتراضية
      if (!data) {
        const defaultSettings = {
          user_id: userData.user.id,
          project_name: 'مشروعي',
          target_category: 'يومية',
          monthly_products: 100,
          default_profit_rate: 50
        };
        
        const { data: newSettings, error: insertError } = await supabase
          .from('settings')
          .insert([defaultSettings])
          .select();
        
        if (insertError) throw insertError;
        
        return { success: true, data: newSettings[0] };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('خطأ في الحصول على إعدادات المستخدم:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحديث إعدادات المستخدم
  async updateSettings(settingsData) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      // التحقق من وجود إعدادات للمستخدم
      const { data: existingSettings, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      const updates = {
        ...settingsData,
        updated_at: new Date()
      };
      
      // إذا كانت الإعدادات موجودة، قم بتحديثها
      if (existingSettings) {
        const { data, error } = await supabase
          .from('settings')
          .update(updates)
          .eq('id', existingSettings.id)
          .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
      } 
      // إذا لم تكن الإعدادات موجودة، قم بإنشائها
      else {
        const newSettings = {
          user_id: userData.user.id,
          ...updates
        };
        
        const { data, error } = await supabase
          .from('settings')
          .insert([newSettings])
          .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
      }
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error.message);
      return { success: false, error: error.message };
    }
  }

  // الحصول على التكاليف الثابتة للمستخدم
  async getFixedCosts() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('fixed_costs')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('خطأ في الحصول على التكاليف الثابتة:', error.message);
      return { success: false, error: error.message };
    }
  }

  // إضافة تكلفة ثابتة جديدة
  async addFixedCost(name, amount) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const fixedCost = {
        user_id: userData.user.id,
        name,
        amount,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('fixed_costs')
        .insert([fixedCost])
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('خطأ في إضافة تكلفة ثابتة:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحديث تكلفة ثابتة
  async updateFixedCost(id, name, amount) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const updates = {
        name,
        amount,
        updated_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('fixed_costs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userData.user.id)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('خطأ في تحديث التكلفة الثابتة:', error.message);
      return { success: false, error: error.message };
    }
  }

  // حذف تكلفة ثابتة
  async deleteFixedCost(id) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { error } = await supabase
        .from('fixed_costs')
        .delete()
        .eq('id', id)
        .eq('user_id', userData.user.id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في حذف التكلفة الثابتة:', error.message);
      return { success: false, error: error.message };
    }
  }
}
