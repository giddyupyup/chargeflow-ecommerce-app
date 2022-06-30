# chargeflow-ecommerce-app

A simple serverless application with 3 microservice using AWS SAM Template

## Pre-requisite

- Configure AWS Credentials
- Install AWS Cli and AWS SAM Cli

---

# Overview

This serverless application consist of 3 microservice that triggered with ApiGateway and SQS

## Sample APIGateway Endpoint

    https://x3h5dguqu4.execute-api.ap-southeast-1.amazonaws.com/Dev

#

# GetProducts

A serverless service that returns all products triggered by ApiGateway

### EventSource

    ApiGateway
        Method: GET
        Endpoint: /products

### Sample Api Request

    curl --location --request GET http://localhost:3000/products

#

# GetProduct

A serverless service that returns single product triggered by ApiGateway

### EventSource

    ApiGateway
        Method: GET
        Endpoint: /products/{id}
        Params: {id} //product objectId

### Sample Api Request

    curl --location --request GET http://localhost:3000/products/62bd2a137ffe67f66e244396

#

# Checkout

A serverless service that checkout user with a single product triggered by ApiGateway and send an SQS Message

### EventSource

    ApiGateway
        Method: POST
        Endpoint: /checkout
        Body: {
            user: {
                name: string,
                email: string,
            },
            quantity: number,
            propertyId: ObjectId(property)
        }

### Sample Api Request

    curl --location --request POST 'https://localhost:3000/checkout' \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "user": {
            "name": "Gideon Arces",
            "email": "gideon.arces@gmail.com"
        },
        "productId": "62bd2a137ffe67f66e244396",
        "quantity": 2
    }'

#

# OrderEmailSender

A serverless service receives an SQS Message from checkout and send an email

### EventSource

    SQS
        ChargeFlowECommerceSqsQueue
            MessageBody: { orderId: ObjectId(order)}

### Sample SQS Message

    aws sqs send-message \
    --queue-url https://sqs.ap-southeast-1.amazonaws.com/339293616549/chargeflow-ecommerce-app-ChargeFlowECommerceSqsQueue-VOuZdHeG5OkM \
    --message-body '{"orderId":"62bd59834b9c4881c7d03c42"}'

---

## Build and Deploy

    sam build
    sam deploy --build

## Testing

    npm install
    npm test
