const AWSMock = require('aws-sdk-mock');
const { restore, stub } = require('sinon');
const { expect, use } = require('chai');
const client = require('../db');
const { handler } = require('../handlers/checkout');
const { errorResponse } = require('../utils/response/error');
const { successResponse } = require('../utils/response/success');

describe('checkout', () => {
  beforeEach(() => {
    process.env.REGION = 'test-region';

    process.env.CHARGEFLOW_ECOMMERCE_SQS_QUEUE_URL = 'https://sqs.foo.com';

    stub(client, 'connect').resolves({
      db: stub().returns({
        collection: stub()
          .onFirstCall()
          .returns({
            findOne: stub()
              .onFirstCall()
              .resolves({
                _id: '62bd2a137ffe67f66e244396',
                name: 'Bose Flex',
                description: 'Bose Flex Bluetooth Speaker',
                price: 199.99,
                countOnHand: 98,
                isOnStock: true,
              })
              .onSecondCall()
              .resolves({
                _id: '62bd2a137ffe67f66e244396',
                name: 'Bose Flex',
                description: 'Bose Flex Bluetooth Speaker',
                price: 199.99,
                countOnHand: 96,
                isOnStock: true,
              }),
            updateOne: stub().resolves(),
          })
          .onSecondCall()
          .returns({
            insertOne: stub().resolves({
              insertedId: 'foo-order-id-created',
            }),
          }),
      }),
      close: stub().resolves(),
    });

    AWSMock.mock('SQS', 'createQueue');
  });

  afterEach(() => {
    delete process.env.REGION;

    delete process.env.CHARGEFLOW_ECOMMERCE_SQS_QUEUE_URL;

    AWSMock.restore('SQS');

    restore();
  });

  it('should return error response when user object is missing', async () => {
    const response = await handler({
      body: JSON.stringify({
        productId: '62bd2a137ffe67f66e244396',
        quantity: 2,
      }),
    });

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });

  it('should return error response when productId is missing', async () => {
    const response = await handler({
      body: JSON.stringify({ user: {}, quantity: 2 }),
    });

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });

  it('should return error response when user name is missing', async () => {
    const response = await handler({
      body: JSON.stringify({
        user: {},
        productId: '62bd2a137ffe67f66e244396',
        quantity: 2,
      }),
    });

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });

  it('should return error response when user email is missing', async () => {
    const response = await handler({
      body: JSON.stringify({
        user: { name: 'foo-user' },
        productId: '62bd2a137ffe67f66e244396',
        quantity: 2,
      }),
    });

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });

  it('should return error response when user email is missing', async () => {
    restore();

    stub(client, 'connect').rejects(
      new Error('Error connecting with database'),
    );

    const response = await handler({
      body: JSON.stringify({
        user: { name: 'foo-user', email: 'foo-email' },
        productId: '62bd2a137ffe67f66e244396',
        quantity: 2,
      }),
    });

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });

  it('should return error response when product query fail', async () => {
    restore();

    stub(client, 'connect').resolves({
      db: stub().returns({
        collection: stub().returns({
          findOne: stub().rejects(),
        }),
      }),
      close: stub().resolves(),
    });

    const response = await handler({
      body: JSON.stringify({
        user: { name: 'foo-user', email: 'foo-email' },
        productId: '62bd2a137ffe67f66e244396',
        quantity: 2,
      }),
    });

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });

  it('should return error response when product order is not found', async () => {
    restore();

    stub(client, 'connect').resolves({
      db: stub().returns({
        collection: stub().returns({
          findOne: stub().resolves(null),
        }),
      }),
      close: stub().resolves(),
    });

    const response = await handler({
      body: JSON.stringify({
        user: { name: 'foo-user', email: 'foo-email' },
        productId: '62bd2a137ffe67f66e244396',
        quantity: 2,
      }),
    });

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });

  it('should return error response when product countOnHand is less than ordered quantity', async () => {
    restore();

    stub(client, 'connect').resolves({
      db: stub().returns({
        collection: stub().returns({
          findOne: stub().resolves({
            _id: '62bd2a137ffe67f66e244396',
            name: 'Bose Flex',
            description: 'Bose Flex Bluetooth Speaker',
            price: 199.99,
            countOnHand: 98,
            isOnStock: true,
          }),
        }),
      }),
      close: stub().resolves(),
    });

    const response = await handler({
      body: JSON.stringify({
        user: { name: 'foo-user', email: 'foo-email' },
        productId: '62bd2a137ffe67f66e244396',
        quantity: 100,
      }),
    });

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });

  it('should return error when sqs sendMessage fails', async () => {
    AWSMock.mock('SQS', 'sendMessage', () => {
      throw new Error();
    });

    const response = await handler({
      body: JSON.stringify({
        user: { name: 'foo-user', email: 'foo-email' },
        productId: '62bd2a137ffe67f66e244396',
        quantity: 2,
      }),
    });

    expect(response).to.be.eql(errorResponse({}));
  });

  it('should return success response when checkout succeed', async () => {
    AWSMock.mock('SQS', 'sendMessage', (params, callback) => {
      callback(null, {
        MD5OfMessageBody: '5b792970792ac60da66329aa58e99054',
        MessageId: '4097a3a4-30bb-7300-4516-420af64063e2',
      });
    });

    const response = await handler({
      body: JSON.stringify({
        user: { name: 'foo-user', email: 'foo-email' },
        productId: '62bd2a137ffe67f66e244396',
        quantity: 2,
      }),
    });

    expect(response).to.be.eql(
      successResponse({
        statusCode: 201,
        data: {
          product: {
            _id: '62bd2a137ffe67f66e244396',
            name: 'Bose Flex',
            description: 'Bose Flex Bluetooth Speaker',
            price: 199.99,
            countOnHand: 96,
            isOnStock: true,
          },
          order: {
            orderId: 'foo-order-id-created',
            created: true,
          },
        },
      }),
    );
  });
});
