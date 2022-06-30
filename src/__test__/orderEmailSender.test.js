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
      body: '{"orderId":"62bd2a137ffe67f66e244396"}',
    },
  ],
};

describe('orderEmailSender', () => {
  beforeEach(() => {
    AWSMock.mock('SES', 'sendEmail');
  });
  afterEach(() => {
    AWSMock.restore();

    restore();
  });
  it('should return error response when failing on connecting db', async () => {
    stub(client, 'connect').rejects(
      new Error('Error connecting with database'),
    );

    await expect(handler(sqsEvent)).to.be.rejectedWith(
      'Error connecting with database',
    );
  });
});
