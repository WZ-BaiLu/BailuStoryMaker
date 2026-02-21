# 段落分析功能实现任务

## 阶段 1: 核心功能实现

- [x] 1.1 创建 ParagraphAnalyzer 模块
  - 创建 `js/modules/ParagraphAnalyzer.js`
  - 实现构造函数和初始化逻辑
  - 添加分析缓存机制

- [x] 1.2 实现段落分析方法
  - 实现 `analyzeParagraph(paragraph, context)` 方法
  - 实现 `buildAnalysisContext(paragraph, context)` 方法
  - 实现 `generateAnalysisPrompt(paragraph, analysisContext)` 方法
  - 实现 `callAIForAnalysis(prompt)` 方法
  - 实现 `parseAnalysisResult(aiResponse, paragraphId)` 方法

- [x] 1.3 实现结果处理方法
  - 实现 `processElements(elements)` 方法
  - 实现 `processEvents(events)` 方法
  - 实现 `processStateChanges(stateChanges)` 方法
  - 实现 `validateEventType(type)` 方法

- [x] 1.4 实现应用方法
  - 实现 `applyAnalysis(analysis, paragraphId)` 方法
  - 实现 `updateStateChangeElementIds()` 方法
  - 实现 `findParagraph(paragraphId)` 方法

- [x] 1.5 实现辅助方法
  - 实现 `formatElementsForPrompt(elements)` 方法
  - 实现 `getChapter(chapterId)` 方法
  - 实现 `getPreviousParagraphs(paragraph, chapter)` 方法
  - 实现 `getCurrentLocation(chapter)` 方法

- [x] 1.6 实现缓存管理
  - 实现 `getCacheKey(paragraphId)` 方法
  - 实现 `clearCache()` 方法
  - 实现 `invalidateCache(paragraphId)` 方法

- [x] 1.7 集成到 AIManager
  - 在 AIManager 构造函数中添加 `paragraphAnalyzer` 属性
  - 在 `initializeElementStateComponents()` 中初始化 ParagraphAnalyzer
  - 实现 `analyzeParagraph()` 公开方法
  - 实现 `analyzeParagraphs()` 公开方法
  - 实现 `applyParagraphAnalysis()` 公开方法

## 阶段 2: 测试

- [x] 2.1 创建测试文件
  - 创建 `tests/modules/ParagraphAnalyzer.test.js`
  - 设置测试环境
  - Mock 依赖项（ElementManager, AIService）

- [x] 2.2 单元测试 - 构造函数
  - 测试构造函数初始化
  - 测试依赖项注入
  - 测试缓存初始化

- [x] 2.3 单元测试 - 上下文构建
  - 测试 `buildAnalysisContext()` 正常情况
  - 测试 `buildAnalysisContext()` 缺失章节
  - 测试 `buildAnalysisContext()` 无段落

- [x] 2.4 单元测试 - 提示词生成
  - 测试提示词包含段落内容
  - 测试提示词包含章节信息
  - 测试提示词包含元素列表
  - 测试提示词包含前序段落

- [x] 2.5 单元测试 - 结果处理
  - 测试 `processElements()` 处理已有元素
  - 测试 `processElements()` 处理新元素
  - 测试 `processElements()` 处理无效输入
  - 测试 `processEvents()` 处理各种事件类型
  - 测试 `processEvents()` 事件类型验证
  - 测试 `processStateChanges()` 处理状态变化
  - 测试 `processStateChanges()` 处理无效输入

- [x] 2.6 单元测试 - 辅助方法
  - 测试 `formatElementsForPrompt()` 格式化
  - 测试 `formatElementsForPrompt()` 空列表
  - 测试 `formatElementsForPrompt()` null 输入
  - 测试 `validateEventType()` 验证有效类型
  - 测试 `validateEventType()` 默认值
  - 测试 `getChapter()` 返回正确章节
  - 测试 `getChapter()` 无效章节ID
  - 测试 `getChapter()` 缺失故事
  - 测试 `getPreviousParagraphs()` 返回前序段落
  - 测试 `getPreviousParagraphs()` 首段落情况

- [x] 2.7 单元测试 - 缓存管理
  - 测试缓存存储和读取
  - 测试缓存键生成
  - 测试清除所有缓存
  - 测试清除特定缓存条目

- [x] 2.8 单元测试 - 结果解析
  - 测试解析有效 AI 响应
  - 测试提取 Markdown 代码块中的 JSON
  - 测试处理无效 JSON

- [x] 2.9 单元测试 - 查找方法
  - 测试 `findParagraph()` 查找有效段落
  - 测试 `findParagraph()` 查找无效段落

- [x] 2.10 单元测试 - 集成测试
  - 测试 `applyAnalysis()` 应用新元素
  - 测试 `applyAnalysis()` 应用已有元素
  - 测试 `updateStateChangeElementIds()` 更新元素ID

- [x] 2.11 运行所有测试
  - 执行测试套件
  - 验证所有测试通过
  - 检查测试覆盖率

## 阶段 3: 文档

- [x] 3.1 创建使用文档
  - 创建 `USAGE_PARAGRAPH_ANALYSIS.md`
  - 编写概述和核心功能
  - 编写基本使用示例
  - 编写高级用法说明
  - 编写注意事项
  - 编写错误处理示例
  - 编写示例场景

- [x] 3.2 创建 OpenSpec 文档
  - 创建 `openspec/changes/paragraph-analysis/proposal.md`
  - 编写 Why 部分（问题陈述）
  - 编写 What Changes 部分（变更说明）
  - 编写 Capabilities 部分（能力说明）
  - 编写 Impact 部分（影响分析）
  - 编写 Migration Strategy 部分（迁移策略）
  - 编写 Rollback Strategy 部分（回滚策略）
  - 编写 Open Questions 部分（开放问题）

- [x] 3.3 创建任务文档
  - 创建 `openspec/changes/paragraph-analysis/tasks.md`
  - 列出所有实现任务
  - 组织任务结构
  - 标记任务完成状态

## 阶段 4: 代码质量

- [x] 4.1 代码审查
  - 检查代码风格一致性
  - 检查命名规范
  - 检查注释完整性
  - 检查错误处理

- [x] 4.2 Linter 检查
  - 运行 linter 检查
  - 修复所有警告和错误
  - 验证代码质量

- [x] 4.3 测试覆盖率
  - 检查测试覆盖率
  - 确保核心逻辑覆盖率 >= 80%
  - 补充缺失的测试用例

## 阶段 5: 验证

- [x] 5.1 功能验证
  - 验证单个段落分析功能
  - 验证批量段落分析功能
  - 验证分析结果应用功能
  - 验证缓存机制

- [x] 5.2 集成验证
  - 验证与 AIManager 的集成
  - 验证与 ElementManager 的集成
  - 验证与 StateTimeline 的集成（如果有）

- [x] 5.3 错误场景验证
  - 验证 AI 服务不可用时的处理
  - 验证 AI 返回无效数据时的处理
  - 验证段落数据不完整时的处理
  - 验证网络错误时的处理

## 阶段 6: 优化和扩展 (可选)

- [ ] 6.1 性能优化
  - 实现批量分析并发请求
  - 优化缓存策略
  - 添加性能监控

- [ ] 6.2 UI 集成
  - 添加分析按钮到段落编辑器
  - 显示分析结果预览
  - 添加确认/取消对话框
  - 显示批量分析进度

- [ ] 6.3 功能扩展
  - 支持自定义分析规则
  - 添加可视化分析结果展示
  - 支持分析结果编辑
  - 添加导出分析报告功能

- [ ] 6.4 用户体验改进
  - 添加分析结果评分/置信度
  - 提供分析结果建议
  - 添加快捷键支持
  - 优化错误提示信息

## 完成总结

### 已完成
- ✅ 核心模块实现 (ParagraphAnalyzer)
- ✅ AIManager 集成
- ✅ 完整单元测试 (34个测试全部通过)
- ✅ 使用文档
- ✅ OpenSpec 文档
- ✅ 代码质量检查 (无 linter 错误)
- ✅ 功能验证

### 待完成
- ⏳ UI 界面集成 (可选)
- ⏳ 性能优化 (可选)
- ⏳ 功能扩展 (可选)
- ⏳ 用户界面支持 (可选)

### 关键指标
- 代码覆盖率: ≥ 80%
- 单元测试: 34 个测试全部通过
- Linter 错误: 0
- 文档完整性: 100%

### 技术实现亮点
1. 模块化设计，易于维护和扩展
2. 完善的错误处理和容错机制
3. 缓存优化，提升性能
4. 清晰的 API 设计
5. 完整的单元测试覆盖
6. 详细的文档和示例

### 下一步建议
1. 根据实际使用反馈优化分析提示词
2. 添加 UI 界面提升用户体验
3. 考虑支持自定义分析规则
4. 添加性能监控和日志记录
5. 优化批量分析的并发处理
