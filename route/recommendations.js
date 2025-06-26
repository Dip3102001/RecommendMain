const express = require('express');
const recommendationController = require('../controller/recommendationController');

const router = express.Router();

router.get('/users/:userId', recommendationController.getUserRecommendations);
router.get('/products/:productId/similar', recommendationController.getSimilarProducts);
router.post('/users/:userId/update-embedding', recommendationController.updateUserEmbedding);

module.exports = router;