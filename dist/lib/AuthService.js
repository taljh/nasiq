// AuthService.js - Handles user authentication with Supabase
import { supabase } from './supabaseClient';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.initSession();
  }

  // Initialize from Supabase session
  async initSession() {
    const { data, error } = await supabase.auth.getSession();
    
    if (data?.session) {
      this.currentUser = data.session.user;
      this.notifyListeners();
    }
    
    // Set up auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.currentUser = session.user;
        this.notifyListeners();
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.notifyListeners();
      }
    });
  }

  // Register a new user
  async register(name, email, password) {
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
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.' 
      };
    }
  }

  // Login a user
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'بريد إلكتروني أو كلمة مرور غير صحيحة.' 
      };
    }
  }

  // Login as guest
  async loginAsGuest() {
    try {
      // Generate a random email for the guest
      const guestEmail = `guest_${Math.random().toString(36).substring(2, 15)}@nasiq.app`;
      const guestPassword = Math.random().toString(36).substring(2, 15);
      
      // Create a new guest account
      const { data, error } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
        options: {
          data: {
            name: 'زائر',
            isGuest: true
          }
        }
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Guest login error:', error);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ أثناء تسجيل الدخول كزائر. يرجى المحاولة مرة أخرى.' 
      };
    }
  }

  // Logout the current user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      this.currentUser = null;
      this.notifyListeners();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.' 
      };
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.currentUser;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Add auth state change listener
  addAuthListener(listener) {
    this.authListeners.push(listener);
    // Call immediately with current state
    listener(this.currentUser);
  }

  // Remove auth state change listener
  removeAuthListener(listener) {
    this.authListeners = this.authListeners.filter(l => l !== listener);
  }

  // Notify all listeners of auth state change
  notifyListeners() {
    this.authListeners.forEach(listener => listener(this.currentUser));
  }
}

// Create and export auth service instance
const authService = new AuthService();
export default authService;
