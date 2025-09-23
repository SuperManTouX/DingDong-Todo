const http = require('http');

const postData = JSON.stringify({
  title: '测试任务',
  completed: false,
  priority: 1,
  listId: '1',
  userId: '1'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/todos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  res.on('data', (chunk) => {
    console.log(`响应体: ${chunk}`);
  });
  res.on('end', () => {
    console.log('响应已完成');
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

// 写入数据到请求体
req.write(postData);
req.end();