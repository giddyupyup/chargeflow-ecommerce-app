const AWS = require('aws-sdk');
const { ObjectId } = require('mongodb');
const client = require('../db');
const logger = require('../utils/logger');

const senderEmailAddress = process.env.SES_IDENTITY_ADDRESS;

exports.handler = async (event) => {
  const sqsRecords = event.Records.map((record) => JSON.parse(record.body));

  try {
    const dbClient = await client.connect();
    const db = dbClient.db('chargeflow');
    const collection = db.collection('orders');

    const ses = new AWS.SES({
      region: process.env.REGION,
    });

    const orders = await Promise.all(
      sqsRecords.map(async (sqsOrder) => {
        const { orderId } = sqsOrder;

        const [order] = await collection
          .aggregate([
            {
              $match: {
                _id: ObjectId(orderId),
              },
            },
            {
              $set: {
                productId: { $toObjectId: '$productId' },
              },
            },
            {
              $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product',
              },
            },
            {
              $set: {
                product: { $arrayElemAt: ['$product', 0] },
              },
            },
          ])
          .toArray();

        const {
          user: { name: userName, email },
          quantity,
          product: { name: productName },
        } = order;

        const params = {
          Destination: {
            ToAddresses: [email],
          },
          Message: {
            Body: {
              Html: {
                Charset: 'UTF-8',
                Data: `Thanks for ordering ${userName}. You ordered ${productName} for quantity of ${quantity}`,
              },
              Text: {
                Charset: 'UTF-8',
                Data: `Thanks for ordering ${userName}. You ordered ${productName} for quantity of ${quantity}`,
              },
            },
            Subject: {
              Charset: 'UTF-8',
              Data: 'Order Received',
            },
          },
          Source: senderEmailAddress,
          ReplyToAddresses: [senderEmailAddress],
        };

        await ses.sendEmail(params).promise();

        logger.info('Order');

        logger.info(order);

        return order;
      }),
    );

    return {
      message: 'Email Sent Successfully',
      orders,
    };
  } catch (error) {
    throw error;
  }
};
