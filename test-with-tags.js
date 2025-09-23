const http = require('http');

// 创建一个包含标签的任务数据
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const taskData = JSON.stringify({
  id: 'task-test-tags',
  title: '测试任务带标签',
  completed: false,
  priority: 2,
  datetimeLocal: formatDate(new Date()),
  deadline: formatDate(new Date(Date.now() + 86400000)),
  parentId: null,
  depth: 0,
  tags: ['tag-001', 'tag-002'], // 标签ID数组
  listId: 'list-001',
  groupId: 'group-001',
  userId: 'user-001'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/todos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(taskData)
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
    console.log('响应体:', JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
});

// 发送请求体
req.write(taskData);
req.end();