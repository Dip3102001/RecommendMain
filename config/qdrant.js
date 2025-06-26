const { QdrantClient } = require("qdrant-client");
require("dotenv").config();

import {QdrantClient} from 'qdrant-client';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const getCollection = async (collectionName = process.env.QDRANT_COLLECTION_NAME) => {
  try {
    const collectionInfo = await qdrant.getCollection(collectionName);
    return collectionInfo;
  } catch (error) {
    console.error("Error connecting to Qdrant:", error);
    throw error;
  }
};

module.exports = { qdrant, getCollection };