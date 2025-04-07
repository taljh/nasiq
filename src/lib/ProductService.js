import { supabase } from './supabaseClient.js';

export class ProductService {
  // إضافة منتج جديد
  async addProduct(productData) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const product = {
        ...productData,
        user_id: userData.user.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('خطأ في إضافة المنتج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // الحصول على جميع منتجات المستخدم
  async getUserProducts() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('خطأ في الحصول على منتجات المستخدم:', error.message);
      return { success: false, error: error.message };
    }
  }

  // الحصول على منتج محدد
  async getProduct(productId) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', userData.user.id)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('خطأ في الحصول على المنتج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحديث منتج
  async updateProduct(productId, productData) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const updates = {
        ...productData,
        updated_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('user_id', userData.user.id)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // حذف منتج
  async deleteProduct(productId) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', userData.user.id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // البحث عن منتجات
  async searchProducts(query) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userData.user.id)
        .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('خطأ في البحث عن المنتجات:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تصفية المنتجات حسب الفئة
  async filterProductsByCategory(category) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('target_category', category)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('خطأ في تصفية المنتجات:', error.message);
      return { success: false, error: error.message };
    }
  }
}
