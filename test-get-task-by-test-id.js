const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/todos/task-test-tags',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    try {
      const jsonData = JSON.parse(data);
      console.log('响应体:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('响应体:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
});

req.end();