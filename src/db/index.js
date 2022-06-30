const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

const uri =
  'mongodb+srv://chargeflow:K3YpuIof0EugknDQ@chargeflow.bqxln.mongodb.net/?retryWrites=true&w=majority';

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports.connect = async () => {
  try {
    logger.info('Connecting to mongodb');

    await client.connect();

    logger.info('Successful connection with mongodb');

    return client;
  } catch (error) {
    logger.error('Error in connecting mongodb');
    throw error;
  }
};
