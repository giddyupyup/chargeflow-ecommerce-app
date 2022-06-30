const AWS = require('aws-sdk');
const { ObjectId } = require('mongodb');
const client = require('../db');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response/error');
const { successResponse } = require('../utils/response/success');

/**
 * Checkout single product
 * @param {ApiGateWay} event ApiGateWay Event
 * @returns Lambda Api Gateway Response
 */

exports.handler = async (event) => {
  try {
    const { user, productId, quantity } = JSON.parse(event.body);

    const orderedQuantity = quantity || 1;

    if (!productId || !user) {
      throw new Error('Please provide a productId and user');
    }

    const { name, email } = user;

    if (!name || !email) {
      throw new Error('Please provide a name and email for user');
    }

    const dbClient = await client.connect();

    const db = dbClient.db('chargeflow');
    const productCollection = db.collection('products');
    const orderCollection = db.collection('orders');
    const product = await productCollection.findOne({
      _id: ObjectId(productId),
    });

    if (!product) {
      await dbClient.close();
      throw new Error('Ordered product does not exists');
    }

    const { countOnHand } = product;

    if (orderedQuantity > countOnHand) {
      await dbClient.close();
      throw new Error('Ordered product have insufficient quantity');
    }

    await productCollection.updateOne(
      {
        _id: ObjectId(productId),
      },
      {
        $set: { countOnHand: countOnHand - orderedQuantity },
      },
    );

    const updatedProduct = await productCollection.findOne({
      _id: ObjectId(productId),
    });

    const order = await orderCollection.insertOne({
      user: {
        name,
        email,
      },
      productId,
      quantity: orderedQuantity,
    });

    await dbClient.close();

    const sqs = new AWS.SQS({
      region: process.env.REGION,
    });

    const queueUrl = process.env.CHARGEFLOW_ECOMMERCE_SQS_QUEUE_URL;

    await sqs
      .sendMessage({
        MessageBody: JSON.stringify({
          orderId: order.insertedId,
        }),
        QueueUrl: queueUrl,
      })
      .promise();

    logger.info('Successful Execution of service');

    return successResponse({
      statusCode: 201,
      data: {
        product: updatedProduct,
        order: {
          orderId: order.insertedId,
          created: true,
        },
      },
    });
  } catch (error) {
    logger.error(error);
    return errorResponse(error);
  }
};
