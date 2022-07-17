const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, prettyPrint } = format;

const appFormat = format((info) => ({
  ...info,
  app: 'chargeflow-ecommerce-app',
  appName: 'chargeflow-ecommerce-app',
  level: info.level.toUpperCase(),
}));

module.exports = createLogger({
  silent: process.env.NODE_ENV === 'test',
  format: combine(appFormat(), timestamp(), json(), prettyPrint()),
  transports: [
    new transports.Console({
      format: combine(
        format((info) => ({
          ...info,
          level: info.level.toUpperCase(),
        }))(),
        timestamp(),
        json(),
        prettyPrint(),
      ),
    }),
  ],
});
