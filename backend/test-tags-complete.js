const http = require('http');

// 测试标签功能的完整流程
async function testTagsComplete() {
  console.log('开始测试标签功能...');
  
  // 1. 创建一个带标签的新任务
  const newTaskId = `task-test-${Date.now()}`;
  const taskData = {
    id: newTaskId,
    title: '测试任务带标签',
    completed: false,
    priority: 2,
    datetimeLocal: new Date().toISOString(),
    deadline: '2025-09-30',
    listId: 'list-001',
    groupId: 'group-001',
    userId: 'user-001',
    tags: ['tag-test-001', 'tag-test-002']
  };
  
  console.log('1. 创建带标签的任务:', newTaskId);
  const createResult = await sendRequest('POST', '/todos', taskData);
  if (createResult.statusCode !== 201) {
    console.error('创建任务失败:', createResult.statusCode, createResult.body);
    return;
  }
  
  console.log('创建任务成功，返回的标签:', createResult.body.tags);
  
  // 2. 查询刚刚创建的任务
  console.log('2. 查询刚刚创建的任务');
  const getResult = await sendRequest('GET', `/todos/${newTaskId}`);
  if (getResult.statusCode !== 200) {
    console.error('查询任务失败:', getResult.statusCode, getResult.body);
    return;
  }
  
  console.log('查询任务成功，返回的标签:', getResult.body.tags);
  
  // 3. 验证标签是否正确
  const expectedTags = ['tag-test-001', 'tag-test-002'];
  const actualTags = getResult.body.tags || [];
  
  if (JSON.stringify(actualTags.sort()) === JSON.stringify(expectedTags.sort())) {
    console.log('✅ 标签功能测试成功！查询返回了正确的标签信息。');
  } else {
    console.error('❌ 标签功能测试失败！返回的标签与预期不符。');
    console.error('预期:', expectedTags);
    console.error('实际:', actualTags);
  }
}

// 发送HTTP请求的辅助函数
function sendRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, body: parsedBody, headers: res.headers });
        } catch (e) {
          reject(new Error(`解析响应体失败: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 运行测试
testTagsComplete().catch(console.error);