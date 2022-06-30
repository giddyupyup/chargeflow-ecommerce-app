const { expect } = require('chai');
const { restore, stub } = require('sinon');
const client = require('../db');
const { handler } = require('../handlers/getProducts');
const { errorResponse } = require('../utils/response/error');
const { successResponse } = require('../utils/response/success');

describe('getProducts', () => {
  afterEach(() => {
    restore();
  });
  it('should return a success response when requesting products', async () => {
    stub(client, 'connect').resolves({
      db: stub().returns({
        collection: stub().returns({
          find: stub().returns({
            toArray: stub().resolves([
              {
                _id: '62bd2a137ffe67f66e244396',
                name: 'Bose Flex',
                description: 'Bose Flex Bluetooth Speaker',
                price: 199.99,
                countOnHand: 98,
                isOnStock: true,
              },
              {
                _id: '62bd2a137ffe67f66e244397',
                name: 'Apple AirPods',
                description: 'Apple AirPods Bluetooth Earphones',
                price: 129.99,
                countOnHand: 100,
                isOnStock: true,
              },
            ]),
          }),
        }),
      }),
      close: stub().resolves(),
    });

    const response = await handler();

    expect(response).to.be.eql(
      successResponse({
        statusCode: 200,
        data: [
          {
            _id: '62bd2a137ffe67f66e244396',
            name: 'Bose Flex',
            description: 'Bose Flex Bluetooth Speaker',
            price: 199.99,
            countOnHand: 98,
            isOnStock: true,
          },
          {
            _id: '62bd2a137ffe67f66e244397',
            name: 'Apple AirPods',
            description: 'Apple AirPods Bluetooth Earphones',
            price: 129.99,
            countOnHand: 100,
            isOnStock: true,
          },
        ],
      }),
    );
  });

  it('should return error response when failing on connecting db', async () => {
    stub(client, 'connect').rejects(
      new Error('Error connecting with database'),
    );

    const response = await handler();

    expect(response).to.be.eql(errorResponse({ level: 'error' }));
  });
});
