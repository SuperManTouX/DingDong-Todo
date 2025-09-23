const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/todos',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应状态码:', res.statusCode);
    console.log('完整响应数据:');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.end();