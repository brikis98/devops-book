const request = require('supertest');
const app = require('./app');                             

describe('Test the app', () => {                          

  test('Get / should return Hello, World!', async () => { 
    const response = await request(app).get('/');         
    expect(response.statusCode).toBe(200);                
    expect(response.text).toBe('Hello, World!');          
  });

  test('Get /name/Bob should return Hello, Bob!', async () => {
    const response = await request(app).get('/name/Bob');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello, Bob!');
  });

  const maliciousUrl = '/name/%3Cscript%3Ealert("hi")%3C%2Fscript%3E';
  const sanitizedHtml = 'Hello, &lt;script&gt;alert(&#34;hi&#34;)&lt;/script&gt;!'

  test('Get /name should sanitize its input', async () => {
    const response = await request(app).get(maliciousUrl);
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe(sanitizedHtml);
  });

});
