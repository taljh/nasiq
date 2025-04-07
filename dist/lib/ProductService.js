// ProductService.js - Handles products with Supabase
import { supabase } from './supabaseClient';

class ProductService {
  constructor() {
    this.products = [];
    this.listeners = [];
  }

  // Load products for a user
  async loadProducts(userId) {
    if (!userId) {
      console.error('User ID is required to load products');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      this.products = data || [];
      this.notifyListeners();
      return this.products;
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  // Get all products
  getAllProducts() {
    return [...this.products];
  }

  // Get product by ID
  getProductById(id) {
    return this.products.find(product => product.id === id);
  }

  // Add new product
  async addProduct(product) {
    if (!product.user_id) {
      console.error('User ID is required to add a product');
      return { success: false, error: 'User ID is required' };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.products.unshift(data);
      this.notifyListeners();
      return { success: true, product: data };
    } catch (error) {
      console.error('Error adding product:', error);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ أثناء إضافة المنتج. يرجى المحاولة مرة أخرى.' 
      };
    }
  }

  // Update existing product
  async updateProduct(updatedProduct) {
    if (!updatedProduct.id || !updatedProduct.user_id) {
      console.error('Product ID and User ID are required to update a product');
      return { success: false, error: 'Product ID and User ID are required' };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', updatedProduct.id)
        .eq('user_id', updatedProduct.user_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const index = this.products.findIndex(p => p.id === updatedProduct.id);
      if (index !== -1) {
        this.products[index] = data;
        this.notifyListeners();
      }

      return { success: true, product: data };
    } catch (error) {
      console.error('Error updating product:', error);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ أثناء تحديث المنتج. يرجى المحاولة مرة أخرى.' 
      };
    }
  }

  // Delete product
  async deleteProduct(id, userId) {
    if (!id || !userId) {
      console.error('Product ID and User ID are required to delete a product');
      return { success: false, error: 'Product ID and User ID are required' };
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const index = this.products.findIndex(p => p.id === id);
      if (index !== -1) {
        const deletedProduct = this.products[index];
        this.products.splice(index, 1);
        this.notifyListeners();
        return { success: true, product: deletedProduct };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { 
        success: false, 
        error: error.message || 'حدث خطأ أثناء حذف المنتج. يرجى المحاولة مرة أخرى.' 
      };
    }
  }

  // Filter products by category
  filterByCategory(category) {
    if (category === 'all') {
      return this.getAllProducts();
    }
    return this.products.filter(product => product.category === category);
  }

  // Search products
  searchProducts(term) {
    if (!term) {
      return this.getAllProducts();
    }
    
    const searchTerm = term.toLowerCase();
    return this.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) || 
      (product.code && product.code.toLowerCase().includes(searchTerm))
    );
  }

  // Sort products
  sortProducts(products, sortBy) {
    const sortedProducts = [...products];
    
    switch (sortBy) {
      case 'name':
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        sortedProducts.sort((a, b) => a.final_price - b.final_price);
        break;
      case 'price-desc':
        sortedProducts.sort((a, b) => b.final_price - a.final_price);
        break;
      case 'profit':
        sortedProducts.sort((a, b) => b.profit_rate - a.profit_rate);
        break;
      case 'date':
        sortedProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        // Default sort by date (newest first)
        sortedProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return sortedProducts;
  }

  // Get product statistics
  getProductStats() {
    if (this.products.length === 0) {
      return {
        totalProducts: 0,
        avgPrice: 0,
        avgProfit: 0,
        categoryCounts: {
          'عبايات فاخرة جداً': 0,
          'راقية': 0,
          'يومية': 0,
          'اقتصادية': 0
        }
      };
    }
    
    let totalPrice = 0;
    let totalProfit = 0;
    const categoryCounts = {
      'عبايات فاخرة جداً': 0,
      'راقية': 0,
      'يومية': 0,
      'اقتصادية': 0
    };
    
    this.products.forEach(product => {
      totalPrice += parseFloat(product.final_price || 0);
      totalProfit += parseFloat(product.profit_rate || 0);
      
      if (categoryCounts.hasOwnProperty(product.category)) {
        categoryCounts[product.category]++;
      }
    });
    
    return {
      totalProducts: this.products.length,
      avgPrice: Math.round(totalPrice / this.products.length),
      avgProfit: Math.round((totalProfit / this.products.length)),
      categoryCounts
    };
  }

  // Export products to JSON
  exportProductsToJson() {
    return JSON.stringify(this.products, null, 2);
  }

  // Import products from JSON
  async importProductsFromJson(json, userId) {
    if (!userId) {
      return { success: false, error: 'User ID is required to import products' };
    }

    try {
      const importedProducts = JSON.parse(json);
      
      if (!Array.isArray(importedProducts)) {
        return { success: false, error: 'Invalid JSON format. Expected an array of products.' };
      }

      // Add user_id to each product
      const productsWithUserId = importedProducts.map(product => ({
        ...product,
        user_id: userId,
        id: undefined // Remove any existing IDs to create new records
      }));

      // Insert products in batches to avoid hitting API limits
      const batchSize = 50;
      let insertedProducts = [];

      for (let i = 0; i < productsWithUserId.length; i += batchSize) {
        const batch = productsWithUserId.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('products')
          .insert(batch)
          .select();

        if (error) {
          throw error;
        }

        insertedProducts = [...insertedProducts, ...(data || [])];
      }

      // Reload products to ensure we have the latest data
      await this.loadProducts(userId);
      
      return { success: true, count: insertedProducts.length };
    } catch (error) {
      console.error('Error importing products:', error);
      return { 
        success: false, 
        error: error.message || 'Invalid JSON format or database error.' 
      };
    }
  }

  // Add product change listener
  addListener(listener) {
    this.listeners.push(listener);
    // Call immediately with current products
    listener(this.products);
  }

  // Remove product change listener
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Notify all listeners of product changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.products));
  }
}

// Create and export product service instance
const productService = new ProductService();
export default productService;
