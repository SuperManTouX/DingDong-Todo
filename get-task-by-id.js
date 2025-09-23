const http = require('http');

// 从之前的响应中获取任务ID，这里假设任务ID格式为'task-timestamp'
// 在实际环境中，您可能需要从数据库或前一次请求的响应中动态获取
const taskId = 'task-001';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/todos/${taskId}`,
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应状态码:', res.statusCode);
    try {
      console.log('完整响应数据:');
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log('原始响应:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.end();