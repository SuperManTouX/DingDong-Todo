import axios from 'axios';

// 简单测试函数
async function testTodoLists() {
  try {
    console.log('开始测试 /todo-lists 接口...');
    
    // 直接使用axios调用接口
    const response = await axios.get('http://localhost:3000/todo-lists', {
      withCredentials: true // 包含cookies
    });
    
    console.log('接口调用成功!');
    console.log('状态码:', response.status);
    console.log('返回数据:', response.data);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testTodoLists().then(() => {
  console.log('测试完成');
});