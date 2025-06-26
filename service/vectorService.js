const { getCollection } = require('../config/qdrant');
const { QdrantClient } = require('@qdrant/js-client-rest');

class VectorService {
  constructor() {
    this.client = null;
    this.collectionName = null;
    this.initializeClient();
  }

  async initializeClient() {
    try {
      const { qdrant } = await getCollection();
      this.client = qdrant;
      this.collectionName = process.env.QDRANT_COLLECTION_NAME;
    } catch (error) {
      console.error('Failed to initialize Qdrant client:', error);
    }
  }

  async ensureClient() {
    if (!this.client) {
      await this.initializeClient();
    }
    return this.client;
  }

  // Store vector embedding for a product/user
  async storeVector(id, vector, metadata = {}) {
    try {
      const client = await this.ensureClient();
      
      const points = [{
        id: id,
        vector: vector,
        payload: metadata
      }];

      await client.upsert(this.collectionName, {
        wait: true,
        points: points
      });
      
      return { success: true, id };
    } catch (error) {
      console.error('Error storing vector:', error);
      throw new Error('Failed to store vector');
    }
  }

  // Query similar vectors for recommendations
  async getSimilarVectors(vector, topK = 10, filter = null) {
    try {
      const client = await this.ensureClient();
      
      const searchParams = {
        vector: vector,
        limit: topK,
        with_payload: true,
        with_vector: false,
      };

      if (filter) {
        searchParams.filter = filter;
      }

      const searchResponse = await client.search(this.collectionName, searchParams);
      return searchResponse;
    } catch (error) {
      console.error('Error querying similar vectors:', error);
      throw new Error('Failed to query similar vectors');
    }
  }

  // Update vector (same as store in Qdrant)
  async updateVector(id, vector, metadata = {}) {
    try {
      return await this.storeVector(id, vector, metadata);
    } catch (error) {
      console.error('Error updating vector:', error);
      throw new Error('Failed to update vector');
    }
  }

  // Delete vector
  async deleteVector(id) {
    try {
      const client = await this.ensureClient();
      await client.delete(this.collectionName, {
        wait: true,
        points: [id]
      });
      return { success: true, id };
    } catch (error) {
      console.error('Error deleting vector:', error);
      throw new Error('Failed to delete vector');
    }
  }

  // Generate mock embedding (same as before)
  generateMockEmbedding(data) {
    const embedding = [];
    const dimension = 1536; // Common dimension for OpenAI embeddings
    
    for (let i = 0; i < dimension; i++) {
      embedding.push(Math.random() * 2 - 1); // Random values between -1 and 1
    }
    
    return embedding;
  }

  // Additional Qdrant-specific methods
  async createCollectionIfNotExists(dimension = 1536) {
    try {
      const client = await this.ensureClient();
      
      const collectionInfo = await client.getCollection(this.collectionName);
      return collectionInfo;
    } catch (error) {
      if (error.status === 404) {
        console.log('Collection does not exist, creating...');
        return await client.createCollection(this.collectionName, {
          vectors: {
            size: dimension,
            distance: 'Cosine', // Can be 'Cosine', 'Euclid', or 'Dot'
          }
        });
      }
      throw error;
    }
  }
}

module.exports = VectorService;