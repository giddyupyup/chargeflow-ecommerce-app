const client = require('../db');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response/error');
const { successResponse } = require('../utils/response/success');

/**
 * Get all products
 * @returns Lambda Api Gateway Response
 */
exports.handler = async () => {
  try {
    const dbClient = await client.connect();

    const db = dbClient.db('chargeflow');

    const products = await db
      .collection('products')
      .find({
        isOnStock: true,
      })
      .toArray();

    await dbClient.close();

    logger.info('Successful Execution of service');

    return successResponse({ statusCode: 200, data: products });
  } catch (error) {
    logger.error(error);
    return errorResponse(error);
  }
};
