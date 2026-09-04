const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'LifeGift API Documentation',
    description: 'Danh sách chi tiết các endpoint API trong hệ thống',
  },
  host: 'localhost:8080',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
// Trỏ tới file chứa cấu hình app Express của bạn
const routesFiles = ['./src/app.ts']; 

swaggerAutogen(outputFile, routesFiles, doc);