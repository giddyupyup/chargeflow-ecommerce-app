const AWSMock = require('aws-sdk-mock');
const { use, expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { restore, stub } = require('sinon');
const client = require('../db');
const { handler } = require('../handlers/orderEmailSender');

use(chaiAsPromised);

const sqsEvent = {
  Records: [
    {
      body: '{"orderId":"62bd59834b9c4881c7d03c42"}',
    },
  ],
};

describe('orderEmailSender', () => {
  beforeEach(() => {
    process.env.SES_IDENTITY_ADDRESS = 'sample@email.com';

    AWSMock.mock('SES', 'sendEmail');

    stub(client, 'connect').resolves({
      db: stub().returns({
        collection: stub().returns({
          aggregate: stub().returns({
            toArray: stub().resolves([
              {
                _id: '62bd59834b9c4881c7d03c42',
                user: {
                  name: 'Gideon Arces',
                  email: 'email@email.com',
                },
                quantity: 2,
                product: {
                  _id: '62bd2a137ffe67f66e244396',
                  name: 'Bose Flex',
                  description: 'Bose Flex Bluetooth Speaker',
                  price: 199.99,
                  countOnHand: 98,
                  isOnStock: true,
                },
              },
            ]),
          }),
        }),
      }),
      close: stub().resolves(),
    });
  });
  afterEach(() => {
    delete process.env.SES_IDENTITY_ADDRESS;

    AWSMock.restore();

    restore();
  });
  it('should throw when failing on connecting db', async () => {
    restore();

    stub(client, 'connect').rejects(
      new Error('Error connecting with database'),
    );

    await expect(handler(sqsEvent)).to.be.rejectedWith(
      'Error connecting with database',
    );
  });

  it('should throw error when sending email fails', async () => {
    AWSMock.remock('SES', 'sendEmail', () => {
      throw new Error('Error in sending email');
    });

    await expect(handler(sqsEvent)).to.be.rejectedWith(
      'Error in sending email',
    );
  });

  it('should return success response with orders', async () => {
    const response = await handler(sqsEvent);

    expect(response).to.be.eql({
      message: 'Email Sent Successfully',
      orders: [
        {
          _id: '62bd59834b9c4881c7d03c42',
          user: {
            name: 'Gideon Arces',
            email: 'email@email.com',
          },
          quantity: 2,
          product: {
            _id: '62bd2a137ffe67f66e244396',
            name: 'Bose Flex',
            description: 'Bose Flex Bluetooth Speaker',
            price: 199.99,
            countOnHand: 98,
            isOnStock: true,
          },
        },
      ],
    });
  });
});
