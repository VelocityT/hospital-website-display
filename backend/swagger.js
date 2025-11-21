import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/*.js'];

const swagger = swaggerAutogen({ openapi: '3.1.0' });

swagger(outputFile, endpointsFiles);
