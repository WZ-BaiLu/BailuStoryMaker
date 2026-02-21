# 段落分析功能提案

## Why

当前系统中，用户已经写好的段落文本无法自动转换为结构化的故事元素、事件和状态数据。这导致：

1. **数据孤岛**: 文本内容与结构化数据分离
2. **手动工作量大**: 需要手动提取和输入元素、事件、状态信息
3. **一致性风险**: 手动输入容易出现遗漏或错误
4. **时间成本高**: 对于已经写好的故事内容，需要重新整理才能使用系统的状态跟踪功能

引入段落分析功能，可以：
- 自动从段落文本提取故事元素、事件和状态变化
- 提高数据录入效率和准确性
- 支持已有故事内容的快速迁移
- 利用 AI 智能理解文本语义

## What Changes

### 新增模块

1. **ParagraphAnalyzer 模块** (`js/modules/ParagraphAnalyzer.js`)
   - 分析段落文本，提取元素、事件和状态变化
   - 生成 AI 提示词并调用 AI 服务
   - 解析 AI 返回的分析结果
   - 应用分析结果到故事数据

2. **AIManager 集成**
   - 添加 `analyzeParagraph()` 方法
   - 添加 `analyzeParagraphs()` 批量分析方法
   - 添加 `applyParagraphAnalysis()` 应用方法

3. **测试文件**
   - `tests/modules/ParagraphAnalyzer.test.js` - 完整的单元测试

4. **使用文档**
   - `USAGE_PARAGRAPH_ANALYSIS.md` - 功能使用说明

### API 变更

**新增方法**:
```javascript
// AIManager 新增方法
AIManager.analyzeParagraph(paragraph, context) -> Promise<AnalysisResult>
AIManager.analyzeParagraphs(paragraphs, context) -> Promise<BatchAnalysisResult>
AIManager.applyParagraphAnalysis(analysis, paragraphId) -> Promise<ApplicationResult>

// ParagraphAnalyzer 公开方法
ParagraphAnalyzer.analyzeParagraph(paragraph, context) -> Promise<Object>
ParagraphAnalyzer.analyzeParagraphs(paragraphs, context) -> Promise<Array<Object>>
ParagraphAnalyzer.applyAnalysis(analysis, paragraphId) -> Promise<Object>
```

### 数据结构

**分析结果结构**:
```javascript
{
    paragraphId: string,
    timestamp: string,
    elements: Array<{
        id?: string,           // 已存在元素的 ID
        temporaryId?: string,  // 新元素的临时 ID
        type: ElementType,
        name?: string,
        description?: string,
        keywords?: string[],
        isNew: boolean
    }>,
    events: Array<{
        description: string,
        type: 'action' | 'dialogue' | 'discovery' | 'conflict' | 'emotional' | 'state_change',
        participants: string[],
        location?: string
    }>,
    stateChanges: Array<{
        elementId: string,
        changes: {
            location?: string,
            description?: Record<string, any>,
            owner?: string,
            status?: string,
            keywords?: string[]
        }
    }>,
    error?: string
}
```

## Capabilities

### New Capabilities

- **paragraph-analysis**: 段落分析能力
  - 单段落智能分析
  - 批量段落分析
  - AI 驱动的语义理解
  - 自动元素识别
  - 事件提取
  - 状态变化推断

- **analysis-application**: 分析结果应用
  - 自动创建新元素
  - 自动更新元素状态
  - 批量应用分析结果
  - 错误处理和回滚

## Impact

### 代码影响

- **新增文件**:
  - `js/modules/ParagraphAnalyzer.js` - 段落分析核心模块
  - `tests/modules/ParagraphAnalyzer.test.js` - 单元测试
  - `USAGE_PARAGRAPH_ANALYSIS.md` - 使用文档
  - `openspec/changes/paragraph-analysis/` - OpenSpec 文档

- **修改文件**:
  - `js/managers/AIManager.js` - 集成段落分析功能

### 性能影响

- **分析时间**: 单段落分析通常需要 1-3 秒（取决于 AI 服务响应速度）
- **缓存机制**: 相同段落的分析结果会被缓存，避免重复分析
- **批量分析**: 批量分析时可以使用并发请求（可选优化）

### 用户体验影响

- **效率提升**: 自动化分析，减少手动工作量
- **准确性**: AI 辅助识别，减少遗漏
- **使用门槛**: 需要配置 AI 服务才能使用

## Migration Strategy

### 阶段 1: 核心功能实现 (已完成)
- [x] 创建 ParagraphAnalyzer 模块
- [x] 实现段落分析方法
- [x] 实现 AI 提示词生成
- [x] 实现结果解析和应用
- [x] 集成到 AIManager
- [x] 编写单元测试

### 阶段 2: 集成和优化 (进行中)
- [x] 编写使用文档
- [x] 创建 OpenSpec 文档
- [ ] 添加 UI 界面（可选）
- [ ] 性能优化和缓存增强

### 阶段 3: 扩展功能 (计划中)
- [ ] 添加可视化分析结果展示
- [ ] 支持自定义分析规则
- [ ] 批量分析进度提示
- [ ] 分析结果编辑功能
- [ ] 导出分析报告

## Rollback Strategy

如果出现问题：
1. 移除 AIManager 中的相关方法
2. 删除 ParagraphAnalyzer 模块
3. 不影响其他功能（独立模块）

## Open Questions

### Q1: 是否需要支持自定义分析规则？

**问题**: 用户是否需要定义自己的分析规则，而不是完全依赖 AI？

**选项**:
- A. 支持: 提供规则配置接口
- B. 不支持: 完全依赖 AI

**建议**: 暂不支持，优先验证 AI 效果，再考虑扩展。

### Q2: 分析结果是否需要人工审核？

**问题**: AI 分析的结果是否需要用户确认后再应用？

**选项**:
- A. 需要: 显示分析结果，用户确认后应用
- B. 不需要: 直接应用，有问题再回滚

**建议**: 推荐 A，增加用户控制权，避免错误应用。

### Q3: 如何处理分析失败的段落？

**问题**: 如果 AI 无法准确分析某个段落，如何处理？

**选项**:
- A. 跳过: 记录错误，继续分析其他段落
- B. 重试: 自动重试多次
- C. 提示: 暂停并提示用户

**建议**: 推荐 A+C，跳过失败段落并提示用户，避免阻塞整个流程。
