module.exports.errorResponse = (error) => {
  return {
    statusCode: error?.statusCode || 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(error),
  };
};
