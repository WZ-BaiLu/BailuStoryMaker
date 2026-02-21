## 1. 基础设施准备

- [x] 1.1 创建时间线样式文件 `css/timeline.css`
- [x] 1.2 在 `index.html` 中添加时间线面板 DOM 结构容器
- [x] 1.3 添加时间线相关的国际化文本到 `locales/*.json`

## 2. AI 工具实现

- [x] 2.1 在 `AIManager.js` 中实现 `registerTool` 方法
- [x] 2.2 实现字符状态更新工具 `updateCharacterState` 处理函数
- [x] 2.3 实现道具状态更新工具 `updateItemState` 处理函数
- [x] 2.4 添加工具参数验证逻辑（验证 characterId、itemId、paragraphId）
- [x] 2.5 添加工具调用成功/失败的通知显示

## 3. UIRenderer 时间线渲染

- [x] 3.1 在 `UIRenderer.js` 中添加 `renderTimelinePanel` 方法
- [x] 3.2 实现 `renderTimelineNodes` 方法，根据段落数据渲染时间线节点
- [x] 3.3 实现 `renderTimelineNode` 方法，渲染单个时间线节点
- [x] 3.4 实现 `renderTimelineControls` 方法，渲染折叠/展开和筛选控件
- [x] 3.5 实现时间线主题适配（深色/浅色主题样式切换）

## 4. 时间线交互功能

- [x] 4.1 实现 `scrollToParagraph` 方法，点击节点滚动到对应段落
- [x] 4.2 实现 `highlightTimelineNode` 方法，高亮当前活跃节点
- [x] 4.3 实现 `updateActiveNodeOnScroll` 方法，滚动时更新活跃节点
- [x] 4.4 实现时间线面板展开/折叠交互
- [x] 4.5 实现筛选功能切换（全部/角色/道具）

## 5. 事件绑定

- [x] 5.1 在 `EventManager.js` 中绑定时间线节点点击事件
- [x] 5.2 绑定折叠/展开按钮点击事件
- [x] 5.3 绑定筛选按钮点击事件
- [x] 5.4 绑定段落编辑器滚动事件（用于更新活跃节点）

## 6. 状态持久化

- [x] 6.1 实现 `loadTimelineState` 方法，从 localStorage 加载时间线状态
- [x] 6.2 实现 `saveTimelineState` 方法，保存时间线状态到 localStorage
- [x] 6.3 在章节加载时恢复时间线面板状态
- [x] 6.4 在状态变更时自动保存时间线状态

## 7. 集成与测试

- [x] 7.1 在 `App.js` 中集成时间线渲染调用
- [x] 7.2 在段落更新时触发时间线刷新
- [x] 7.3 在章节切换时重新渲染时间线
- [x] 7.4 测试时间线面板显示/隐藏功能
- [x] 7.5 测试节点点击跳转功能
- [x] 7.6 测试筛选功能切换
- [x] 7.7 测试状态持久化功能
- [x] 7.8 测试 AI 工具调用和状态更新

## 8. 单元测试

- [x] 8.1 为 AIManager 的 `updateCharacterState` 方法编写单元测试
- [x] 8.2 为 AIManager 的 `updateItemState` 方法编写单元测试
- [x] 8.3 为 UIRenderer 的时间线渲染方法编写单元测试
- [x] 8.4 为工具参数验证逻辑编写单元测试

