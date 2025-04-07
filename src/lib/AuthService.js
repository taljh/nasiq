import { supabase } from './supabaseClient.js';

export class AuthService {
  // تسجيل مستخدم جديد
  async register(email, password, name) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) throw error;
      
      // إنشاء سجل في جدول المستخدمين
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            { 
              id: data.user.id,
              email: email,
              password: 'encrypted', // لا نخزن كلمة المرور الفعلية
              name: name
            }
          ]);
        
        if (profileError) throw profileError;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('خطأ في التسجيل:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تسجيل الدخول
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تسجيل الخروج
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error.message);
      return { success: false, error: error.message };
    }
  }

  // الحصول على المستخدم الحالي
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('خطأ في الحصول على المستخدم الحالي:', error.message);
      return { success: false, error: error.message };
    }
  }

  // تحديث بيانات المستخدم
  async updateUserProfile(name) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });
      
      if (error) throw error;
      
      // تحديث جدول المستخدمين
      const { error: profileError } = await supabase
        .from('users')
        .update({ name })
        .eq('id', userData.user.id);
      
      if (profileError) throw profileError;
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error.message);
      return { success: false, error: error.message };
    }
  }

  // إعادة تعيين كلمة المرور
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', error.message);
      return { success: false, error: error.message };
    }
  }
}
