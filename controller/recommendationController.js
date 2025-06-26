const recommendationService = require('../services/recommendationService');

class RecommendationController {
  
  async getUserRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;

      const recommendations = await recommendationService.getProductRecommendations(
        userId, 
        parseInt(limit)
      );

      res.json({
        userId,
        recommendations,
        count: recommendations.length
      });
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSimilarProducts(req, res) {
    try {
      const { productId } = req.params;
      const { limit = 5 } = req.query;

      const similarProducts = await recommendationService.getSimilarProducts(
        productId,
        parseInt(limit)
      );

      res.json({
        productId,
        similarProducts,
        count: similarProducts.length
      });
    } catch (error) {
      console.error('Error getting similar products:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUserEmbedding(req, res) {
    try {
      const { userId } = req.params;
      
      const result = await recommendationService.createUserEmbedding(userId);
      
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json({ message: 'User embedding updated successfully', userId });
    } catch (error) {
      console.error('Error updating user embedding:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new RecommendationController();