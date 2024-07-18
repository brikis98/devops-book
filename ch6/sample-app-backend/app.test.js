const request = require('supertest');
const app = require('./app');

describe('Test the app', () => {
  test('Get / should return Hello, World!', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body.text).toBe('backend microservice'); 
  });
});
