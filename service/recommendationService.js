import vectorService from './vectorService';
import Product from '../model/Product';
import Op from 'sequelize';


class RecommendationService {
  
  // Create product embedding and store in vector database
  async createProductEmbedding(product) {
    try {
      // Create embedding based on product features
      const embeddingData = {
        name: product.name,
        description: product.description,
        category: product.category,
        features: product.features
      };
      
      const embedding = vectorService.generateMockEmbedding(embeddingData);
      
      const metadata = {
        productId: product.id,
        category: product.category,
        price: parseFloat(product.price),
        name: product.name
      };
      
      await vectorService.storeVector(product.id, embedding, metadata);
      return { success: true, productId: product.id };
    } catch (error) {
      console.error('Error creating product embedding:', error);
      throw error;
    }
  }

  // Create user preference embedding
  async createUserEmbedding(userId) {
    try {
      // Get user's transaction history
      const transactions = await Transaction.findAll({
        where: { userId, status: 'completed' },
        include: [Product],
        limit: 50,
        order: [['createdAt', 'DESC']]
      });

      if (transactions.length === 0) {
        return { success: false, message: 'No transaction history found' };
      }

      // Aggregate user preferences based on purchase history
      const preferences = {
        categories: {},
        avgPrice: 0,
        totalSpent: 0
      };

      let totalAmount = 0;
      transactions.forEach(transaction => {
        const category = transaction.Product.category;
        preferences.categories[category] = (preferences.categories[category] || 0) + 1;
        totalAmount += parseFloat(transaction.amount);
      });

      preferences.avgPrice = totalAmount / transactions.length;
      preferences.totalSpent = totalAmount;

      const embedding = vectorService.generateMockEmbedding(preferences);
      
      const metadata = {
        userId: userId,
        transactionCount: transactions.length,
        avgPrice: preferences.avgPrice,
        totalSpent: preferences.totalSpent,
        topCategories: Object.keys(preferences.categories)
      };

      await vectorService.storeVector(`user_${userId}`, embedding, metadata);
      return { success: true, userId };
    } catch (error) {
      console.error('Error creating user embedding:', error);
      throw error;
    }
  }

  // Get product recommendations for a user
  async getProductRecommendations(userId, limit = 10) {
    try {
      // First ensure user embedding exists
      await this.createUserEmbedding(userId);
      
      // Get user's embedding
      const userEmbedding = vectorService.generateMockEmbedding({ userId });
      
      // Find similar products
      const filter = {
        productId: { $exists: true }
      };
      
      const similarVectors = await vectorService.getSimilarVectors(
        userEmbedding, 
        limit + 5, // Get a few extra to filter out already purchased
        filter
      );

      // Get user's purchase history to exclude already bought items
      const purchasedProducts = await Transaction.findAll({
        where: { userId, status: 'completed' },
        attributes: ['productId']
      });
      
      const purchasedIds = purchasedProducts.map(t => t.productId);
      
      // Filter out already purchased products
      const recommendedIds = similarVectors
        .filter(match => !purchasedIds.includes(match.metadata.productId))
        .slice(0, limit)
        .map(match => match.metadata.productId);

      // Fetch full product details
      const recommendations = await Product.findAll({
        where: {
          id: { [Op.in]: recommendedIds },
          isActive: true
        }
      });

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // Get similar products
  async getSimilarProducts(productId, limit = 5) {
    try {
      const product = await Product.findByPk(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Ensure product embedding exists
      await this.createProductEmbedding(product);
      
      const productEmbedding = vectorService.generateMockEmbedding({
        name: product.name,
        category: product.category,
        features: product.features
      });

      const filter = {
        productId: { $exists: true },
        productId: { $ne: productId } // Exclude the current product
      };

      const similarVectors = await vectorService.getSimilarVectors(
        productEmbedding,
        limit,
        filter
      );

      const similarIds = similarVectors.map(match => match.metadata.productId);
      
      const similarProducts = await Product.findAll({
        where: {
          id: { [Op.in]: similarIds },
          isActive: true
        }
      });

      return similarProducts;
    } catch (error) {
      console.error('Error getting similar products:', error);
      throw error;
    }
  }
}

module.exports = new RecommendationService();
