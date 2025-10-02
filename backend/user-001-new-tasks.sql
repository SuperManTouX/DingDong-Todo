-- 为user-001的todolist-001添加30个新任务，包含5个置顶任务
-- 增加嵌套层级，depth最高为2
-- 时间范围为最近一周（从执行日期回溯7天）

-- 设置置顶任务ID列表（5个，只设置顶级任务为置顶）
SET @pinned_tasks := 'task-101,task-104,task-107,task-110,task-113';

-- 插入30个新任务（包含嵌套结构）
INSERT INTO task (id, title, text, completed, priority, datetime_local, deadline, parent_id, depth, list_id, group_id, user_id, is_pinned, pinned_at, created_at, updated_at)
VALUES
  -- ====== 第一组任务树（React学习项目） ======
  -- 顶级任务 - 置顶
  ('task-101', 'React高级开发实战项目', '使用React 18开发一个完整的企业级应用，包含复杂状态管理和性能优化', false, 3, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 15) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  -- 二级任务1 - 置顶（父任务置顶）
  ('task-102', '项目架构设计', '设计项目的文件结构、组件层级和数据流', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 5) DAY), 'task-101', 1, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  -- 三级任务1 - 置顶（父任务置顶）
  ('task-103', '组件库选型与配置', '评估Ant Design、Material UI等组件库并完成配置', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 3) DAY), 'task-102', 2, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) DAY)),
  
  -- ====== 第二组任务树（TypeScript学习） ======
  -- 顶级任务 - 置顶
  ('task-104', 'TypeScript高级特性学习', '深入学习TypeScript的泛型、类型守卫、装饰器等高级特性', false, 3, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 12) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 4) DAY)),
  -- 二级任务2 - 置顶（父任务置顶）
  ('task-105', '泛型编程实践', '完成10道泛型编程练习，掌握泛型在实际项目中的应用', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 6) DAY), 'task-104', 1, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  -- 三级任务2 - 置顶（父任务置顶）
  ('task-106', '编写可复用的泛型工具类型', '实现常用的泛型工具类型如DeepReadonly、Partial等', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 4) DAY), 'task-105', 2, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) DAY)),
  
  -- ====== 第三组任务树（性能优化） ======
  -- 顶级任务 - 置顶
  ('task-107', '前端性能优化专题', '系统学习和实践前端性能优化技术，提升应用加载速度和运行效率', false, 3, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 14) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  -- 二级任务3 - 置顶（父任务置顶）
  ('task-108', '资源加载优化', '研究并实现代码分割、懒加载和预加载策略', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 7) DAY), 'task-107', 1, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 4) DAY)),
  -- 三级任务3 - 置顶（父任务置顶）
  ('task-109', '实现Webpack Bundle分析与优化', '使用webpack-bundle-analyzer分析并优化打包结果', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 5) DAY), 'task-108', 2, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  
  -- ====== 第四组任务树（测试学习） ======
  -- 顶级任务 - 置顶
  ('task-110', '前端测试技术学习', '学习Jest、React Testing Library等测试工具，编写高质量测试用例', false, 3, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 13) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 4) DAY)),
  -- 二级任务4 - 置顶（父任务置顶）
  ('task-111', '单元测试实践', '为现有组件编写单元测试，确保覆盖率达到80%以上', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 8) DAY), 'task-110', 1, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  -- 三级任务4 - 置顶（父任务置顶）
  ('task-112', '配置测试环境与CI集成', '配置Jest测试环境并集成到CI/CD流程中', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 6) DAY), 'task-111', 2, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) DAY)),
  
  -- ====== 第五组任务树（架构设计） ======
  -- 顶级任务 - 置顶
  ('task-113', '微前端架构研究', '深入研究微前端架构模式，评估在项目中的应用可行性', false, 3, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 16) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  -- 二级任务5 - 置顶（父任务置顶）
  ('task-114', 'Module Federation实践', '使用Webpack Module Federation实现简单的微前端Demo', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 9) DAY), 'task-113', 1, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 4) DAY)),
  -- 三级任务5 - 置顶（父任务置顶）
  ('task-115', '微前端状态管理方案', '研究微前端架构下的状态管理解决方案', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 7) DAY), 'task-114', 2, 'todolist-001', 'group-001', 'user-001', true, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  
  -- ====== 第六组任务树（CSS高级技术） ======
  -- 顶级任务
  ('task-116', 'CSS高级布局与动画学习', '掌握Grid、Flexbox高级用法和CSS动画技巧', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 10) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  -- 二级任务6
  ('task-117', '复杂网格布局实现', '使用CSS Grid实现3个复杂的响应式布局案例', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 6) DAY), 'task-116', 1, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) DAY)),
  -- 三级任务6
  ('task-118', 'CSS动画性能优化', '学习GPU加速和动画性能调优技巧', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 4) DAY), 'task-117', 2, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  
  -- ====== 第七组任务树（API设计） ======
  -- 顶级任务
  ('task-119', 'RESTful API设计规范学习', '深入理解RESTful API设计原则和最佳实践', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 8) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 4) DAY)),
  -- 二级任务7
  ('task-120', 'API文档工具调研', '评估Swagger、Postman等API文档工具', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 5) DAY), 'task-119', 1, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  -- 三级任务7
  ('task-121', '编写项目API文档', '为现有项目编写完整的API文档', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 7) DAY), 'task-120', 2, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) DAY)),
  
  -- ====== 第八组任务树（安全学习） ======
  -- 顶级任务
  ('task-122', '前端安全知识学习', '学习XSS、CSRF、CSP等前端安全防护技术', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 9) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  -- 二级任务8
  ('task-123', 'XSS攻击与防御实践', '学习XSS攻击原理并实现防御措施', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 6) DAY), 'task-122', 1, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) DAY)),
  -- 三级任务8
  ('task-124', '实现内容安全策略(CSP)', '为项目配置适当的内容安全策略', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 4) DAY), 'task-123', 2, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  
  -- ====== 第九组任务树（Node.js学习） ======
  -- 顶级任务
  ('task-125', 'Node.js后端开发入门', '学习Node.js基础和Express框架使用', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 11) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 4) DAY)),
  -- 二级任务9
  ('task-126', 'Express中间件开发', '学习和开发Express中间件', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 7) DAY), 'task-125', 1, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  -- 三级任务9
  ('task-127', '数据库连接与操作', '学习Node.js连接MongoDB和MySQL数据库', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 5) DAY), 'task-126', 2, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) DAY)),
  
  -- ====== 第十组任务树（项目管理） ======
  -- 顶级任务
  ('task-128', '前端项目管理实践', '学习敏捷开发和前端项目管理方法', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 8) DAY), NULL, 0, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)),
  -- 二级任务10
  ('task-129', 'Sprint计划制定', '学习如何制定有效的Sprint计划和任务分解', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 6) DAY), 'task-128', 1, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) DAY)),
  -- 三级任务10
  ('task-130', '团队协作工具使用', '学习使用Jira、Trello等项目管理工具', false, 2, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 10 + 4) DAY), 'task-129', 2, 'todolist-001', 'group-001', 'user-001', false, NULL, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY));

-- 为部分任务添加标签关联
INSERT INTO task_tag (task_id, tag_id, created_at)
VALUES
  -- 为置顶任务添加标签
  ('task-101', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-101', 'tag-002', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-104', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-104', 'tag-005', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-107', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-107', 'tag-004', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-110', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-110', 'tag-003', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-113', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-113', 'tag-002', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  
  -- 为二级任务添加标签
  ('task-102', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-102', 'tag-009', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-105', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-105', 'tag-005', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-108', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-108', 'tag-010', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-111', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-111', 'tag-003', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-114', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-114', 'tag-002', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  
  -- 为三级任务添加标签
  ('task-103', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-103', 'tag-002', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-106', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-106', 'tag-005', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-109', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-109', 'tag-010', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-112', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-112', 'tag-003', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-115', 'tag-001', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)),
  ('task-115', 'tag-002', DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY));