const { ObjectId } = require('mongodb');
const client = require('../db');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response/error');
const { successResponse } = require('../utils/response/success');

/**
 * Get a single product
 * @param {ApiGateWay} event ApiGateWay event
 * @returns Lambda Api Gateway Response
 */

exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;

    const dbClient = await client.connect();

    const db = dbClient.db('chargeflow');

    const product = await db
      .collection('products')
      .findOne({ _id: ObjectId(id) });

    await dbClient.close();

    if (!product) {
      throw new Error('Product does not exists');
    }

    logger.info('Successful Execution of service');

    return successResponse({ statusCode: 200, data: product });
  } catch (error) {
    logger.error(error);
    return errorResponse(error);
  }
};
