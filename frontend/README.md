[ ] 1. 完成 / 未完成 过滤栏
添加三个按钮：All / Active / Completed，点谁就只显示对应列表。

[ ] 2. 一键全选 / 取消全选
顶部放 checkbox，逻辑：若已全选则取消全选，否则全部勾选。

[ ] 3. 未完成计数器
在标题旁实时显示 “还剩 3 项未完成”。

[ ] 4. 双击快速编辑
在 TodoItem 上双击文字直接进入编辑模式（现有必须点“编辑”按钮）。

[ ] 5. 拖拽排序
用 @dnd-kit/sortable 或 react-beautiful-dnd 实现上下拖拽调整顺序。

[ ] 6. 本地持久化
每次改动后把 todos 写进 localStorage，刷新页面自动读回。

[ ] 7. 优先级标记
给 Todo 加 priority: 'low' | 'medium' | 'high' 字段，UI 用颜色或图标区分，并可切换优先级。

[ ] 8. 批量删除已完成
底部增加“清除已完成”按钮，一键删掉所有 done === true 的项。