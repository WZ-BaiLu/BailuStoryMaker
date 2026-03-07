# 重构文件测试计划

## 概述

本文档定义了重构文件的测试策略和验证清单，确保在替换原文件之前，所有功能正常工作。

## 测试优先级

| 优先级 | 文件 | 风险级别 | 测试顺序 |
|--------|------|----------|---------|
| 高 | UIErrorHandler.js, ModalFormSubmitter.js | 低 | 1 |
| 高 | AIElementTools.js | 中 | 2 |
| 高 | UIRenderer.js | 高 | 3 |
| 高 | AIManager.js | 高 | 4 |
| 中 | state.js | 高 | 5 |
| 中 | ParagraphAnalyzer.js | 中 | 6 |

## 任务 6a: 测试 UIErrorHandler 和 ModalFormSubmitter

### 测试目标
- 验证错误处理工具模块的功能正确性
- 确保跨浏览器兼容性

### 测试用例

#### UIErrorHandler 测试

1. **基本功能测试**
   - [ ] `safeExecute` 正确捕获异步错误
   - [ ] `safeExecuteSync` 正确捕获同步错误
   - [ ] 错误消息正确显示给用户
   - [ ] 错误正确记录到控制台

2. **通知测试**
   - [ ] `silent: true` 时不显示用户通知
   - [ ] `silent: false` 时显示用户通知
   - [ ] 自定义消息正确显示
   - [ ] 默认消息正确显示

3. **日志测试**
   - [ ] 错误记录包含上下文信息
   - [ ] 错误堆栈正确保存
   - [ ] 时间戳正确记录

#### ModalFormSubmitter 测试

1. **表单提交测试**
   - [ ] 表单验证正确执行
   - [ ] 提交成功时显示成功消息
   - [ ] 提交失败时显示错误消息
   - [ ] 加载状态正确显示和隐藏

2. **表单重置测试**
   - [ ] 表单在成功提交后正确重置
   - [ ] 表单在失败提交后保留数据

3. **事件处理测试**
   - [ ] 点击事件正确绑定
   - [ ] 表单提交事件正确触发
   - [ ] 取消事件正确处理

### 验证步骤

1. 创建测试 HTML 页面
2. 手动测试所有功能
3. 检查浏览器控制台错误
4. 验证用户通知正确显示

---

## 任务 6b: 测试并替换 AIElementTools.js

### 测试目标
- 验证所有 AI 元素工具功能
- 确保重构后的函数行为一致

### 测试用例

1. **元素添加测试**
   - [ ] `addElement` 正确创建新元素
   - [ ] 元素类型正确设置
   - [ ] 元元数据正确保存
   - [ ] 错误正确处理（无效类型）

2. **元素位置更新测试**
   - [ ] `updateElementLocation` 正确更新位置
   - [ ] 位置变化正确记录到时间线
   - [ ] 错误正确处理（无效元素 ID）

3. **元素描述更新测试**
   - [ ] `updateElementDescription` 正确更新描述
   - [ ] 描述历史正确记录
   - [ ] 错误正确处理（空描述）

4. **段落时间戳测试**
   - [ ] `updateParagraphTimestamp` 正确更新时间戳
   - [ ] 时间偏移正确计算
   - [ ] 时间线一致性保持

5. **上下文信息测试**
   - [ ] `getContextInfo` 正确返回当前上下文
   - [ ] 嵌套深度减少不影响功能
   - [ ] 性能无显著退化

### 替换步骤

1. **备份原文件**
   ```bash
   cp js/managers/AIElementTools.js js/managers/AIElementTools.js.backup
   ```

2. **替换文件**
   ```bash
   cp js/managers/AIElementTools.refactored.js js/managers/AIElementTools.js
   ```

3. **验证测试**
   - 运行应用
   - 测试所有 AI 元素工具功能
   - 检查控制台错误

4. **回滚计划**
   如果测试失败：
   ```bash
   cp js/managers/AIElementTools.js.backup js/managers/AIElementTools.js
   ```

---

## 任务 6c: 测试并替换 UIRenderer.js

### 测试目标
- 验证所有 UI 渲染功能
- 确保新的模块正常工作

### 测试用例

1. **章节渲染测试**
   - [ ] 章节列表正确显示
   - [ ] 章节选择正确高亮
   - [ ] 章节删除正确处理
   - [ ] 空状态正确显示

2. **段落渲染测试**
   - [ ] 段落列表正确显示
   - [ ] 段落内容正确截断（预览）
   - [ ] 段落编辑正确打开
   - [ ] 段落删除正确处理

3. **元素列表渲染测试**
   - [ ] 所有元素正确显示
   - [ ] 元素类型正确标记
   - [ ] 元素筛选正确工作
   - [ ] 空状态正确显示

4. **角色编辑器测试**
   - [ ] 角色属性正确渲染
   - [ ] 角色技能正确渲染
   - [ ] 状态字段正确渲染
   - [ ] 表单提交正确处理

5. **道具编辑器测试**
   - [ ] 道具属性正确渲染
   - [ ] 属性列表正确渲染
   - [ ] 状态字段正确渲染
   - [ ] 表单提交正确处理

6. **变更编辑器测试（ChangeEditor）**
   - [ ] 角色变更模态框正确显示
   - [ ] 角色变更正确保存
   - [ ] 角色变更正确删除
   - [ ] 新增角色变更正确工作

7. **时间线渲染测试**
   - [ ] 时间线正确展开/折叠
   - [ ] 时间线状态正确保存
   - [ ] 变更项目正确显示
   - [ ] 变更编辑正确触发

8. **错误处理测试**
   - [ ] 渲染错误正确捕获
   - [ ] 错误通知正确显示
   - [ ] 应用不崩溃

### 替换步骤

1. **备份原文件**
   ```bash
   cp js/managers/UIRenderer.js js/managers/UIRenderer.js.backup
   ```

2. **更新 index.html 引用**
   - 添加 `ChangeEditor.js` 引用
   - 添加 `ElementListRenderer.js` 引用
   - 添加 `UIErrorHandler.js` 引用

3. **替换文件**
   ```bash
   cp js/managers/UIRenderer.refactored.js js/managers/UIRenderer.js
   ```

4. **验证测试**
   - 刷新应用
   - 测试所有 UI 功能
   - 检查所有视图和编辑器
   - 验证错误处理

5. **回滚计划**
   如果测试失败：
   ```bash
   cp js/managers/UIRenderer.js.backup js/managers/UIRenderer.js
   # 恢复 index.html 引用
   ```

---

## 任务 6d: 测试并替换 AIManager.js

### 测试目标
- 验证所有 AI 功能
- 确保事件和状态管理正常工作

### 测试用例

1. **初始化测试**
   - [ ] AIManager 正确初始化
   - [ ] 事件管理器正确创建
   - [ ] 状态管理器正确创建
   - [ ] DOM 元素正确缓存

2. **消息发送测试**
   - [ ] 用户消息正确显示
   - [ ] AI 响应正确显示
   - [ ] 聊天历史正确保存
   - [ ] 输入计数器正确更新

3. **工具注册测试**
   - [ ] 所有 AI 工具正确注册
   - [ ] 工具参数正确验证
   - [ ] 工具执行正确处理

4. **事件绑定测试**
   - [ ] 发送按钮事件正确绑定
   - [ ] 输入字段事件正确绑定
   - [ ] 设置按钮事件正确绑定
   - [ ] 折叠按钮事件正确绑定

5. **状态管理测试**
   - [ ] 角色状态更新正确工作
   - [ ] 道具状态更新正确工作
   - [ ] 变更正确记录到段落
   - [ ] 错误正确处理

6. **面板控制测试**
   - [ ] 面板展开/折叠正确工作
   - [ ] 面板状态正确保存
   - [ ] 响应式布局正确调整
   - [ ] 标签切换正确工作

7. **配置管理测试**
   - [ ] 配置模态框正确打开
   - [ ] 配置变更正确应用
   - [ ] 警告徽章正确显示

### 替换步骤

1. **备份原文件**
   ```bash
   cp js/managers/AIManager.js js/managers/AIManager.js.backup
   ```

2. **更新 index.html 引用**
   - 添加 `AIEventManager.js` 引用
   - 添加 `AIStateManager.js` 引用
   - 添加 `UIErrorHandler.js` 引用

3. **替换文件**
   ```bash
   cp js/managers/AIManager.refactored.js js/managers/AIManager.js
   ```

4. **验证测试**
   - 刷新应用
   - 测试所有 AI 功能
   - 发送测试消息
   - 测试所有工具
   - 验证事件和状态管理

5. **回滚计划**
   如果测试失败：
   ```bash
   cp js/managers/AIManager.js.backup js/managers/AIManager.js
   # 恢复 index.html 引用
   ```

---

## 任务 6e: 测试并替换 state.js

### 测试目标
- 验证所有状态管理功能
- 确保状态转换正确工作

### 测试用例

1. **故事管理测试**
   - [ ] 新故事正确创建
   - [ ] 故事正确加载
   - [ ] 故事正确保存
   - [ ] 故事数据正确导出

2. **章节管理测试**
   - [ ] 章节正确添加
   - [ ] 章节正确更新
   - [ ] 章节正确删除
   - [ ] 章节正确重新排序

3. **段落管理测试**
   - [ ] 段落正确添加
   - [ ] 段落正确更新
   - [ ] 段落正确删除
   - [ ] 段落正确重新排序
   - [ ] 段落选择正确工作

4. **角色管理测试**
   - [ ] 角色正确添加
   - [ ] 角色正确更新
   - [ ] 角色正确删除
   - [ ] 角色选择正确工作

5. **道具管理测试**
   - [ ] 道具正确添加
   - [ ] 道具正确更新
   - [ ] 道具正确删除
   - [ ] 道具选择正确工作

6. **元素管理测试**
   - [ ] 元素正确添加
   - [ ] 元素正确更新
   - [ ] 元素正确删除
   - [ ] 元素选择正确工作

7. **历史记录测试**
   - [ ] 状态变更正确记录
   - [ ] 撤销功能正确工作
   - [ ] 历史限制正确应用

8. **持久化测试**
   - [ ] 状态正确保存到 localStorage
   - [ ] 状态正确从 localStorage 加载
   - [ ] 数据完整性保持
   - [ ] 错误正确处理

9. **事件系统测试**
   - [ ] 监听器正确注册
   - [ ] 事件正确触发
   - [ ] 监听器正确移除
   - [ ] 错误正确处理

### 替换步骤

1. **备份原文件**
   ```bash
   cp js/state.js js/state.js.backup
   ```

2. **更新 index.html 引用**
   - 添加 `state/paragraphState.js` 引用
   - 添加 `state/characterState.js` 引用
   - 添加 `state/itemState.js` 引用

3. **替换文件**
   ```bash
   cp js/state/AppState.refactored.js js/state.js
   ```

4. **验证测试**
   - 刷新应用
   - 测试所有状态管理功能
   - 验证数据持久化
   - 测试撤销/重做
   - 验证事件系统

5. **回滚计划**
   如果测试失败：
   ```bash
   cp js/state.js.backup js/state.js
   # 恢复 index.html 引用
   ```

---

## 任务 6f: 测试并替换 ParagraphAnalyzer.js

### 测试目标
- 验证所有段落分析功能
- 确保缓存和工具执行正常工作

### 测试用例

1. **基本分析测试**
   - [ ] 单段落正确分析
   - [ ] 多段落正确批量分析
   - [ ] 分析结果正确返回
   - [ ] 错误正确处理

2. **缓存管理测试**
   - [ ] 分析结果正确缓存
   - [ ] 缓存命中正确工作
   - [ ] 缓存失效正确处理
   - [ ] 缓存正确持久化

3. **工具执行测试**
   - [ ] `listElements` 工具正确执行
   - [ ] `getContextInfo` 工具正确执行
   - [ ] `addElement` 工具正确执行
   - [ ] `updateElementLocation` 工具正确执行
   - [ ] `updateElementDescription` 工具正确执行
   - [ ] `updateParagraphTimestamp` 工具正确执行

4. **结果解析测试**
   - [ ] 元素正确提取
   - [ ] 事件正确提取
   - [ ] 状态变化正确提取
   - [ ] 元数据正确附加

5. **上下文构建测试**
   - [ ] 分析上下文正确构建
   - [ ] 前文正确包含
   - [ ] 章节信息正确包含
   - [ ] 元素信息正确包含

6. **AI 通信测试**
   - [ ] AI 请求正确发送
   - [ ] AI 响应正确解析
   - [ ] 工具调用正确传递
   - [ ] 错误正确处理

### 替换步骤

1. **备份原文件**
   ```bash
   cp js/modules/ParagraphAnalyzer.js js/modules/ParagraphAnalyzer.js.backup
   ```

2. **替换文件**
   ```bash
   cp js/modules/ParagraphAnalyzer.refactored.js js/modules/ParagraphAnalyzer.js
   ```

3. **验证测试**
   - 刷新应用
   - 测试段落分析功能
   - 验证缓存工作
   - 测试所有工具
   - 检查分析结果

4. **回滚计划**
   如果测试失败：
   ```bash
   cp js/modules/ParagraphAnalyzer.js.backup js/modules/ParagraphAnalyzer.js
   ```

---

## 整体验收标准

### 功能验收

- [ ] 所有现有功能正常工作
- [ ] 没有控制台错误
- [ ] 没有视觉缺陷
- [ ] 性能无明显退化

### 代码质量验收

- [ ] 代码通过 linter 检查
- [ ] 所有测试用例通过
- [ ] 代码覆盖率 ≥ 80%
- [ ] 文档更新完整

### 用户体验验收

- [ ] 用户工作流不受影响
- [ ] 错误消息清晰有用
- [ ] 加载状态清晰可见
- [ ] 响应时间可接受

## 回滚计划

如果任何测试失败，按以下步骤回滚：

1. 停止替换过程
2. 使用备份文件恢复
3. 恢复 index.html 中的脚本引用
4. 记录失败原因
5. 分析并修复问题
6. 重新测试

## 下一步

完成所有测试后：

1. [ ] 创建完整的测试报告
2. [ ] 更新 REFACTORING_PROGRESS.md
3. [ ] 提交测试结果
4. [ ] 标记重构任务为已完成
5. [ ] 更新 openspec 任务状态
