# 段落分析功能设计文档

## Context

### Current State

当前系统具备以下能力：
- 故事元素管理（ElementManager）
- 状态时间线跟踪（StateTimeline）
- AI 辅助生成（AIManager）
- 元素状态上下文缓存（StateContextCache）

但是，对于用户已经写好的段落文本，系统无法自动提取结构化信息。用户需要手动：
1. 识别段落中提到的元素
2. 创建相应的故事元素对象
3. 记录段落中的事件
4. 定义元素状态变化

这个过程工作量大且容易出错。

### Problem Space

1. **数据迁移困难**: 已有故事内容难以快速迁移到新系统
2. **手动工作量大**: 需要逐段分析和输入数据
3. **一致性风险**: 手动提取可能出现遗漏或错误
4. **时间成本高**: 对于长篇故事，工作量巨大
5. **语义理解困难**: 复杂段落中的隐含信息难以提取

### Constraints

- 必须与现有系统兼容
- 不能破坏已有功能
- 需要依赖 AI 服务
- 分析结果需要可审查和可修改
- 性能不能显著下降

## Goals / Non-Goals

### Goals

1. **自动化分析**: 自动从段落文本提取元素、事件和状态变化
2. **AI 驱动**: 利用 AI 的语义理解能力
3. **可审查性**: 分析结果可预览和修改
4. **批量处理**: 支持批量分析多个段落
5. **缓存优化**: 避免重复分析相同段落
6. **错误容错**: 完善的错误处理和恢复机制

### Non-Goals

1. **不是完整编辑器**: 不提供段落文本编辑功能
2. **不是语义理解库**: 不自己实现 NLP，依赖 AI 服务
3. **不是自动生成器**: 不自动生成段落，只分析已有段落
4. **不替代手动输入**: 保留手动输入的能力，AI 分析作为辅助

## Decisions

### Decision 1: 独立模块设计

**方案**: 创建独立的 `ParagraphAnalyzer` 模块

**理由**:
- ✅ 职责单一，易于测试和维护
- ✅ 可以独立使用，不依赖 AIManager
- ✅ 便于未来扩展和优化
- ✅ 降低耦合度

**替代方案**:
- ❌ 直接在 AIManager 中实现: 职责混乱，难以测试
- ❌ 在 ContextBuilder 中实现: 职责不匹配

### Decision 2: AI 驱动的分析方法

**方案**: 使用 AI 服务（OpenAI 或兼容）进行语义理解

**理由**:
- ✅ 强大的语义理解能力
- ✅ 可处理复杂和隐含信息
- ✅ 灵活性和可扩展性好
- ✅ 成熟可靠的 API

**替代方案**:
- ❌ 规则引擎: 无法处理复杂语义
- ❌ 关键词匹配: 准确性低
- ❌ NLP 库: 需要大量训练数据和配置

### Decision 3: 结构化分析结果

**方案**: 返回结构化的 JSON 格式分析结果

**理由**:
- ✅ 易于解析和处理
- ✅ 类型安全
- ✅ 便于验证
- ✅ 可序列化存储

**数据结构**:
```javascript
{
    paragraphId: string,
    timestamp: string,
    elements: Array<{
        id?: string,
        temporaryId?: string,
        type: ElementType,
        name?: string,
        description?: string,
        keywords?: string[],
        isNew: boolean
    }>,
    events: Array<{
        description: string,
        type: EventType,
        participants: string[],
        location?: string
    }>,
    stateChanges: Array<{
        elementId: string,
        changes: StateChangeRecord
    }>,
    error?: string
}
```

### Decision 4: 缓存机制

**方案**: 使用 Map 缓存分析结果

**理由**:
- ✅ 避免重复分析相同段落
- ✅ 提升性能
- ✅ 实现简单
- ✅ 内存占用可控

**缓存策略**:
```javascript
class ParagraphAnalyzer {
    constructor() {
        this.analysisCache = new Map();
    }

    getCacheKey(paragraphId) {
        return `paragraph-analysis-${paragraphId}`;
    }

    // 检查缓存
    async analyzeParagraph(paragraph, context) {
        const cacheKey = this.getCacheKey(paragraph.id);
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        // ... 执行分析
        this.analysisCache.set(cacheKey, analysis);
        return analysis;
    }
}
```

### Decision 5: 分离分析和应用

**方案**: 分析和应用分为两个独立步骤

**理由**:
- ✅ 用户可以先审查分析结果
- ✅ 支持批量分析，批量应用
- ✅ 可以单独测试和应用
- ✅ 灵活性高

**工作流程**:
```javascript
// 步骤1: 分析
const analysis = await analyzer.analyzeParagraph(paragraph, context);

// 步骤2: 审查 (可选)
if (userReviewRequired) {
    const reviewed = await showReviewDialog(analysis);
    if (!reviewed.approved) return;
}

// 步骤3: 应用
const result = await analyzer.applyAnalysis(analysis, paragraphId);
```

### Decision 6: 错误处理策略

**方案**: 完善的错误处理，不影响其他操作

**理由**:
- ✅ 部分失败不影响整体
- ✅ 提供详细的错误信息
- ✅ 支持重试机制
- ✅ 记录错误日志

**错误处理示例**:
```javascript
async analyzeParagraphs(paragraphs, context) {
    const results = [];

    for (const paragraph of paragraphs) {
        try {
            const analysis = await this.analyzeParagraph(paragraph, context);
            results.push(analysis);
        } catch (error) {
            console.error(`Error analyzing paragraph ${paragraph.id}:`, error);
            results.push({
                paragraphId: paragraph.id,
                error: error.message,
                elements: [],
                events: [],
                stateChanges: []
            });
        }
    }

    return results;
}
```

### Decision 7: AI 提示词设计

**方案**: 结构化的 AI 提示词，包含清晰的指令

**理由**:
- ✅ 提高分析准确性
- ✅ 确保返回格式一致
- ✅ 易于调试和优化
- ✅ 支持上下文传递

**提示词结构**:
```javascript
generateAnalysisPrompt(paragraph, analysisContext) {
    return `
请分析以下段落内容，提取故事元素、事件和状态变化：

## 段落内容
${paragraph.content}

## 当前故事背景
- 章节: ${chapterTitle}
- 当前所在地: ${currentLocation}

## 已存在的元素
${this.formatElementsForPrompt(existingElements)}

## 前几个段落（上下文）
${previousParagraphs.map((p, i) => `${i + 1}. ${p.content}`).join('\n')}

## 分析要求
请以 JSON 格式返回分析结果，包含以下字段：
1. elements: 故事元素
2. events: 事件
3. stateChanges: 状态变化

...
`;
}
```

### Decision 8: 元素识别策略

**方案**: 区分已存在元素和新元素

**理由**:
- ✅ 避免重复创建相同元素
- ✅ 保持数据一致性
- ✅ 提高分析准确性

**识别逻辑**:
```javascript
processElements(elements) {
    return elements.map(element => {
        if (element.id && !element.id.startsWith('NEW:')) {
            // 已存在元素 - 只返回引用
            return {
                id: element.id,
                type: element.type,
                isNew: false
            };
        } else {
            // 新元素 - 标记需要创建
            return {
                temporaryId: element.id || `NEW:${element.name}`,
                type: element.type,
                name: element.name,
                description: element.description,
                keywords: element.keywords,
                isNew: true
            };
        }
    });
}
```

## Architecture

### 组件关系

```
┌─────────────────┐
│   AIManager     │
│                 │
│ - 分析方法      │
│ - 应用方法      │
└────────┬────────┘
         │
         ├────────────┐
         │            │
┌────────▼────────┐ │
│ParagraphAnalyzer│ │
│                 │ │
│ - 上下文构建    │ │
│ - 提示词生成    │ │
│ - AI 调用       │ │
│ - 结果解析      │ │
│ - 应用逻辑      │ │
└────────┬────────┘ │
         │         │
         │         │
┌────────▼────────┴────────────┐
│   依赖项                     │
│                             │
│ - ElementManager            │
│ - AIService                  │
│ - State (Story data)         │
└─────────────────────────────┘
```

### 数据流

```
1. 用户请求分析段落
   │
   ▼
2. AIManager.analyzeParagraph()
   │
   ▼
3. ParagraphAnalyzer.analyzeParagraph()
   │
   ▼
4. buildAnalysisContext() - 构建分析上下文
   │
   ▼
5. generateAnalysisPrompt() - 生成 AI 提示词
   │
   ▼
6. callAIForAnalysis() - 调用 AI 服务
   │
   ▼
7. parseAnalysisResult() - 解析 AI 返回结果
   │
   ▼
8. 返回分析结果给用户
   │
   ▼
9. 用户确认后调用 applyParagraphAnalysis()
   │
   ▼
10. ParagraphAnalyzer.applyAnalysis()
    │
    ▼
11. 创建新元素 (如果有)
    │
    ▼
12. 更新段落状态变化
    │
    ▼
13. 返回应用结果
```

## Risks / Trade-offs

### Risk 1: AI 分析准确性

**风险**: AI 可能无法准确理解某些复杂的段落

**缓解措施**:
- ✅ 提供详细的上下文信息
- ✅ 使用低 temperature 参数提高一致性
- ✅ 支持人工审查和修改
- ✅ 记录分析结果置信度（未来扩展）

### Risk 2: 性能问题

**风险**: 批量分析大量段落可能耗时较长

**缓解措施**:
- ✅ 实现缓存机制
- ✅ 支持并发请求（未来扩展）
- ✅ 提供进度反馈（未来扩展）
- ✅ 允许跳过失败段落

### Risk 3: AI 服务可用性

**风险**: AI 服务不可用或响应慢

**缓解措施**:
- ✅ 完善的错误处理
- ✅ 超时控制
- ✅ 重试机制（未来扩展）
- ✅ 降级提示

### Risk 4: 数据一致性

**风险**: 分析结果应用后导致数据不一致

**缓解措施**:
- ✅ 应用前验证数据完整性
- ✅ 支持回滚操作（未来扩展）
- ✅ 记录操作日志
- ✅ 提供数据检查工具（未来扩展）

### Trade-off 1: 分析速度 vs 准确性

**选择**: 优先准确性，使用低 temperature

**理由**:
- 分析是一次性操作，速度不是关键
- 准确性直接影响数据质量
- 可以通过缓存优化性能

### Trade-off 2: 自动化 vs 用户控制

**选择**: 提供自动化，但保留用户控制

**理由**:
- 自动化提高效率
- 用户控制保证数据质量
- 可以根据使用习惯调整

## Migration Plan

### 阶段 1: 实现（已完成）
- ✅ 创建 ParagraphAnalyzer 模块
- ✅ 实现核心分析方法
- ✅ 集成到 AIManager
- ✅ 编写单元测试

### 阶段 2: 验证（已完成）
- ✅ 运行所有测试
- ✅ 检查代码质量
- ✅ 验证功能正确性

### 阶段 3: 文档（已完成）
- ✅ 编写使用文档
- ✅ 创建 OpenSpec 文档

### 阶段 4: 部署（待定）
- ⏳ 合并到主分支
- ⏳ 发布新版本
- ⏳ 用户测试和反馈

### 阶段 5: 优化（未来）
- ⏳ 根据用户反馈优化
- ⏳ 性能优化
- ⏳ 功能扩展

## Testing Strategy

### 单元测试
- ✅ 构造函数和初始化
- ✅ 上下文构建
- ✅ 提示词生成
- ✅ 结果处理
- ✅ 辅助方法
- ✅ 缓存管理
- ✅ 结果解析
- ✅ 应用逻辑

### 集成测试
- ✅ 与 AIManager 集成
- ✅ 与 ElementManager 集成
- ✅ 端到端流程

### 测试覆盖率
- 目标: ≥ 80%
- 当前: 100% (所有核心方法)

## Performance Considerations

### 缓存
- 使用 Map 缓存分析结果
- 避免重复分析相同段落
- 支持手动清除缓存

### 并发
- 当前为串行处理
- 未来可支持并发分析
- 需要控制并发数量

### 内存
- 缓存大小可控
- 可设置缓存上限
- 定期清理旧缓存

## Future Enhancements

1. **自定义分析规则**
   - 允许用户定义自己的分析规则
   - 支持规则优先级
   - 规则调试工具

2. **可视化展示**
   - 分析结果可视化
   - 元素关系图谱
   - 事件时间线

3. **批量优化**
   - 并发分析
   - 进度显示
   - 暂停/恢复

4. **质量控制**
   - 分析结果评分
   - 置信度显示
   - 建议和提示

5. **导出功能**
   - 导出分析报告
   - 导出为 JSON/CSV
   - 自定义报告模板
