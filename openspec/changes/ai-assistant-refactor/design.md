## Context

### 当前状态

当前 AI 辅助功能的代码架构存在以下问题:

**代码分散与重复**:
- `AIService.addContextToMessages` (line 102-144) - 处理上下文添加到消息
- `AIManager.buildAIMessages` (line 1142-1173) - 构建 AI 消息数组
- `AIManager.buildContextMessages` (line 1180-1205) - 构建上下文消息
- `AIManager.formatElementStateSummary` (line 1397-1423) - 格式化元素状态摘要
- `ParagraphGenerator.generateParagraphContent` (line 77-90) - 使用 `AIPrompts.getParagraphMessages`
- `ParagraphAnalyzer.generateAnalysisPrompt` (line 163-274) - 独立的提示词生成逻辑
- `ParagraphStateSummary.formatAsText` (line 280-332) - 格式化状态为文本 (功能与 `formatElementStateSummary` 重复)

**消息结构不一致**:
- 不同模块使用不同的消息格式
- 上下文信息的组织方式不统一
- 预览和实际发送的参数可能不同

**预览功能不完整**:
- `AIManager.previewCreationRequest` (line 1570-1616) - 仅用于创作请求预览
- `ParagraphGenerator.previewGenerationRequest` (line 127-144) - 段落生成预览
- 缺乏统一的预览验证机制

### 约束条件

1. **性能**: 不能引入显著的性能开销
2. **可测试性**: 新组件必须易于单元测试
3. **可维护性**: 代码结构清晰,职责分明
4. **用户体验**: 不能增加用户操作复杂度

### 利益相关者

- **开发者**: 需要易于维护和扩展的代码
- **用户**: 需要准确的 AI 生成结果和清晰的预览信息
- **测试人员**: 需要可测试的组件

## Goals / Non-Goals

### Goals

1. **统一消息构建**: 创建单一的消息构建器,消除重复代码
2. **统一预览流程**: 所有 AI 请求都经过相同的预览验证流程
3. **标准化消息结构**: 预览和实际发送使用完全相同的参数
4. **分离关注点**: 段落生成和段落分析使用独立的提示词和工具
5. **提高可维护性**: 代码结构清晰,职责分明

### Non-Goals

- **不改变 AI 提供商适配器**: `AIService` 的适配器模式保持不变，AIService 仍负责底层通信
- **不改变现有工具定义**: `AIElementTools` 的工具定义保持不变
- **不修改现有 UI**: 不改变用户界面布局和交互流程
- **不引入新的 AI 功能**: 仅重构现有功能,不添加新特性
- **不改变 AIManager 和 AIService 的分层**: AIManager 负责业务逻辑，AIService 负责底层通信

## Decisions

### D1: 消息构建器职责分离

**决策**: 创建两个独立的构建器 - `AIMessageBuilder` 和 `AIPromptBuilder`

**理由**:
- `AIMessageBuilder` 负责构建 API 消息数组 (role + content 结构)
- `AIPromptBuilder` 负责生成提示词内容 (system, assistant, user 内容)
- 分离关注点,便于测试和维护

**替代方案**:
- 单一构建器: 会导致职责不清,难以测试
- 仅合并现有方法: 无法解决根本问题,治标不治本

### D2: 统一预览对象格式

**决策**: 预览和实际发送使用相同的 `AIRequest` 对象结构

```javascript
interface AIRequest {
    type: 'paragraph-generation' | 'paragraph-analysis';
    config: {
        model: string;
        temperature: number;
        maxTokens: number;
    };
    messages: Array<{role: string, content: string}>;
    tools?: Array<object>;
    context: {
        chapterTitle: string;
        chapterContent: string;        // 截至选中段落的章节内容（不是全章）
        elementStateSummary: string;   // 截至选中段落的元素状态（不是全部）
        selectedParagraphId?: string;
    };
}
```

**理由**:
- 确保预览和实际发送的参数完全一致
- 便于序列化、反序列化和验证
- 支持预览的持久化和恢复

**替代方案**:
- 使用不同的格式: 容易出现预览和实际不一致的问题
- 仅预览部分字段: 用户无法了解完整请求内容

### D3: 上下文生成器集中管理

**决策**: 创建 `AIContextBuilder` 统一管理上下文生成逻辑

**理由**:
- 当前上下文生成逻辑分散在多个方法中
- 需要基于当前段落状态生成准确的元素和状态信息
- 集中管理便于优化和调试
- context 对象作为中间数据结构，便于测试和维护

**数据流设计**:
```
AIContextBuilder.buildContext() → context 对象（中间数据）
    ↓
AIMessageBuilder.buildMessages() → 消息数组（LLM API 格式）
    ↓
发送给 LLM
```

**替代方案**:
- 保留分散的上下文生成: 难以维护,容易出现不一致
- 仅合并现有方法: 无法解决上下文不准确的问题
- 直接生成消息: 缺少中间数据层，难以测试和调试

### D4: 段落生成和分析分离

**决策**: 创建独立的提示词模板和消息结构

**段落生成**:
```javascript
{
    system: "生成基础提示词",
    assistant: "(截止所选段落)当前出场的元素和状态",
    assistant: "(截止所选段落)已有的文本",
    user: "用户输入"
}
```

**段落分析**:
```javascript
{
    system: "分析基础提示词",
    assistant: "检查段落里出现新元素，则添加到元素列表中",
    assistant: "段落里出现已有元素的状态改变",
    user: "用户输入"
}
```

**理由**:
- 两个功能有不同的目标和输出
- 独立的提示词模板便于优化和调整
- 符合单一职责原则

**替代方案**:
- 共用提示词模板: 难以满足不同场景的需求
- 动态生成提示词: 增加复杂性,难以测试

### D5: 新组件的集成策略

**决策**: 直接替换,清理所有重复和冗余代码

**理由**:
- 不需要向后兼容,可以简化实现
- 避免新旧代码混存导致的维护负担
- 直接使用新组件,代码更清晰

**实现顺序**:
1. 创建新组件 (`AIMessageBuilder`, `AIPromptBuilder`, `AIContextBuilder`)
2. 直接修改 `ParagraphGenerator` 使用新组件
3. 直接修改 `ParagraphAnalyzer` 使用新组件
4. 直接修改 `AIManager` 集成预览功能
5. 移除所有重复代码 (`AIService.addContextToMessages`, `AIManager.buildAIMessages`, `AIManager.buildContextMessages`)

**替代方案**:
- 一次性重构: 风险高,难以回滚
- 渐进式迁移: 不需要,因为没有向后兼容要求

### D6: 配置管理

**决策**: 提示词模板和上下文范围可配置,支持自定义

**理由**:
- 不同用户可能需要不同的提示词风格
- 便于 A/B 测试和优化
- 支持多语言适配
- 不同场景可能需要不同范围的上下文文本

**配置项**:

1. **提示词模板配置**
   - `systemPrompt.paragraphGeneration`: 段落生成的系统提示词
   - `systemPrompt.paragraphAnalysis`: 段落分析的系统提示词
   - 支持用户自定义覆盖

2. **上下文范围配置**
   - `contextParagraphRange`: 引入前面有修改元素状态的段落数量
   - `0`: 从章节开始到当前段落（默认值，包含所有文本）
   - `1`: 从前面第 1 条有修改元素状态的段落开始
   - `2`: 从前面第 2 条有修改元素状态的段落开始
   - `x`: 从前面第 x 条有修改元素状态的段落开始

**实现方式**:
- 配置存储在 `ConfigManager` 中
- 默认值内置在代码中
- 用户可以通过 UI 或配置文件自定义
- `AIContextBuilder` 从配置中读取 `contextParagraphRange`

## Risks / Trade-offs

### 风险 1: 重构导致功能回归

**风险**: 重构可能引入 bug,导致现有功能失效

**缓解措施**:
- 完善单元测试覆盖新组件
- 修改代码前先编写测试
- 每修改一个组件都进行充分测试
- 保持测试覆盖率在 80% 以上

### 风险 2: 性能下降

**风险**: 新增抽象层可能导致性能下降

**缓解措施**:
- 避免不必要的对象创建和复制
- 使用缓存优化重复计算
- 性能测试,确保没有显著下降
- 必要时进行性能优化

### 风险 3: 预览功能增加用户操作负担

**风险**: 强制预览可能增加用户操作步骤

**缓解措施**:
- 提供"记住选择"选项,减少重复操作
- 快捷键支持,提高操作效率
- 默认行为可配置
- 预览界面简洁明了,易于理解

### 风险 4: 上下文生成不准确

**风险**: 基于当前段落状态的上下文生成可能不准确

**缓解措施**:
- 充分的单元测试和集成测试
- 边界条件测试
- 用户反馈机制,收集问题并及时修复
- 文档说明,帮助用户理解上下文生成逻辑

### 权衡 1: 代码复杂度 vs 可维护性

**权衡**: 新增抽象层增加代码复杂度,但提高可维护性

**决策**: 选择可维护性,因为长期来看收益更大

### 权衡 2: 预览详细程度 vs 用户体验

**权衡**: 详细预览提供更多信息,但可能影响用户体验

**决策**: 提供分层预览,默认显示关键信息,可展开查看详细内容,记录用户偏好可以设置不预览

## Migration Plan

### 阶段 1: 创建新组件 (1-2 天)

#### 1. 创建 `js/modules/AIMessageBuilder.js`

**职责**: 将提示词内容构建为符合 LLM API 要求的消息数组格式

**说明**: `AIMessageBuilder` 接收 `AIRequest` 对象（包含 context 中间数据），将其转换为符合 LLM API 要求的消息数组格式。context 对象中的字段会被拆分成多个 assistant 消息。

**方法说明**:

- **`buildMessages(request)`**
  - **用途**: 根据 `AIRequest` 对象构建完整的消息数组
  - **输入**: `AIRequest` 对象，包含 type、config、context、tools 等字段
    - context: 中间数据结构（不直接发送给 LLM）
  - **输出**: `Array<{role: string, content: string}>` 格式的消息数组（直接发送给 LLM）
  - **处理流程**:
    1. 根据请求类型 (paragraph-generation/paragraph-analysis) 选择对应的提示词模板
    2. 调用 `AIPromptBuilder` 生成提示词内容
    3. 将 context 对象中的字段转换为 assistant 消息:
       - `context.chapterTitle` → assistant: "Chapter Title: xxx"
       - `context.chapterContent` → assistant: "以下是当前章节已写的内容..."
       - `context.elementStateSummary` → assistant: "当前在场元素状态：..."
    4. 将提示词内容转换为标准消息格式 (system/assistant/user)
    5. 添加工具定义 (如果存在)
  - **使用场景**: 段落生成、段落分析、自定义 AI 请求

- **`validateMessages(messages)`**
  - **用途**: 验证消息数组的格式和内容是否符合要求
  - **输入**: 消息数组
  - **输出**: `{valid: boolean, errors: string[]}`
  - **验证内容**:
    - 消息数组不为空
    - 每条消息有 role 和 content 字段
    - role 值合法 (system/user/assistant)
    - content 不为空
    - 第一条消息是 system (可选规则)
  - **使用场景**: 预览验证、发送前检查、单元测试

#### 2. 创建 `js/modules/AIPromptBuilder.js`

**职责**: 根据不同的 AI 任务类型生成提示词内容

**方法说明**:

- **`buildParagraphPrompt(userPrompt, context)`**
  - **用途**: 生成段落生成的提示词内容
  - **输入**:
    - `userPrompt`: string - 用户的生成指令
    - `context`: object - 上下文对象
      - `chapterTitle`: 当前章节标题
      - `chapterContent`: 截至选中段落的章节内容 (不是全章内容)
      - `elementStateSummary`: 截至选中段落的元素状态摘要 (不是全部元素)
      - `selectedParagraphId`: 选中的段落 ID
      - `precedingText`: 选中段落之前的文本和选中段落内容
  - **输出**: `{system: string, assistants: string[], user: string}` 格式的提示词对象
  - **生成的消息结构**:
    1. system: 生成基础提示词 (可配置)
    2. assistant[0]: (截止所选段落) 当前出场的元素和状态
    3. assistant[1]: (截止所选段落) 已有的文本
    4. user: 用户输入
  - **使用场景**: 段落生成功能

- **`buildAnalysisPrompt(paragraph, context)`**
  - **用途**: 生成段落分析的提示词内容
  - **输入**:
    - `paragraph`: object - 待分析的段落对象
    - `context`: object - 上下文对象 (内容同上，基于选中段落生成)
  - **输出**: `{system: string, assistants: string[], user: string}` 格式的提示词对象
  - **生成的消息结构**:
    1. system: 分析基础提示词 (可配置)
    2. assistant[0]: 当前故事里已经记录的全部元素
    3. assistant[1]: (截止所选段落) 当前出场的元素和状态
    4. user: 用户输入
  - **使用场景**: 段落分析功能

- **`getSystemPrompt(type)`** - 辅助方法
  - **用途**: 获取指定类型的系统提示词模板
  - **输入**: `type` - 'paragraph-generation' | 'paragraph-analysis'
  - **输出**: string - 系统提示词内容
  - **特点**: 支持配置覆盖，默认使用内置模板

- **`setTemplate(type, template)`** - 辅助方法
  - **用途**: 自定义指定类型的提示词模板
  - **输入**: `type`, `template`
  - **使用场景**: 用户自定义提示词、A/B 测试

#### 3. 创建 `js/modules/AIContextBuilder.js`

**职责**: 生成 AI 请求所需的上下文信息，确保基于当前段落状态的准确性

**说明**: `buildContext` 返回的 context 对象是一个**中间数据结构**，不会直接发送给 LLM，而是由 `AIMessageBuilder` 将其转换为符合 LLM API 要求的消息数组格式。

**方法说明**:

- **`buildContext(selectedParagraphId, options = {})`**
  - **用途**: 构建完整的上下文对象（基于选中段落）
  - **输入**:
    - `selectedParagraphId`: string - 选中的段落 ID (可选)
    - `options`: object - 可选配置
      - `includePreviousParagraphsWithChanges`: number - 引入前面有修改元素状态的段落数量
  - **输出**: 上下文对象（中间数据结构）
    ```javascript
    {
        chapterTitle: string,        // 当前章节标题
        chapterContent: string,      // 截至选中段落的章节内容（不是全章）
        elementStateSummary: string, // 截至选中段落的元素状态（不是全部）
        selectedParagraphId?: string,// 选中的段落 ID
        precedingText: string,       // 选中段落之前的文本（可配置范围）
        totalParagraphs: number      // 段落总数
    }
    ```
  - **数据流**: context 对象 → `AIMessageBuilder.buildMessages()` → 消息数组 → 发送给 LLM
  - **处理流程**:
    1. 从 DataManager 获取当前章节信息
    2. **获取截至选中段落的元素状态**（不是全部元素）
    3. 调用 `buildElementStateSummary` 生成元素状态摘要（基于选中段落）
    4. 调用 `getPrecedingText(paragraphId, includePreviousParagraphsWithChanges)` 获取文本上下文
    5. 组装完整的上下文对象
  - **使用场景**: 段落生成、段落分析、请求预览
  - **配置项**: `includePreviousParagraphsWithChanges` 从 AI 配置中读取，默认为 0

- **`buildElementStateSummary(elements)`**
  - **用途**: 生成元素状态摘要，避免故事后期元素和状态错误地出现在前面
  - **输入**: `elements` - 截至选中段落的元素数组（不是全部元素）
  - **输出**: string - 格式化的元素状态摘要
  - **输出格式示例**:
    ```
    元素状态摘要:
    - 张三: 出现 3 次，状态: 在客栈中，武功水平: 中等
    - 李四: 出现 2 次，状态: 在山上修炼
    - 宝剑: 出现 1 次，位置: 藏于山洞
    ```
  - **关键特性**:
    - 只包含截止当前段落的元素
    - 按元素类型分组
    - 显示出现次数和当前状态
    - 确保时间线正确，避免后期元素提前出现
  - **使用场景**: 上下文生成、提示词构建
  - **现有重复功能**: 该方法将统一以下现有功能
    - `AIManager.formatElementStateSummary` (line 1397-1423) - 功能相同，将被删除
    - `ParagraphStateSummary.formatAsText` (line 280-332) - 功能相似但更详细，将被简化或删除

- **`getPrecedingText(paragraphId, includePreviousParagraphsWithChanges = 0)`** - 辅助方法
  - **用途**: 获取指定段落之前的文本内容（可配置范围）
  - **输入**:
    - `paragraphId`: string - 选中段落的 ID
    - `includePreviousParagraphsWithChanges`: number - 引入前面有修改元素状态的段落数量
      - `0`: 从章节开始到当前段落都要（默认值，包含所有文本）
      - `x`: 从前面第 x 条有修改元素状态的段落开始到当前段落
  - **输出**: string - 拼接的文本内容
  - **处理逻辑**:
    1. 找到章节中所有有修改元素状态的段落（通过 `paragraph.changes.elements` 判断）
    2. 如果 `includePreviousParagraphsWithChanges === 0`:
       - 从章节第一个段落开始，到当前段落结束
    3. 如果 `includePreviousParagraphsWithChanges > 0`:
       - 从当前段落向前查找第 x 条有修改元素状态的段落
       - 如果不足 x 条，则从章节第一个段落开始
       - 从找到的段落开始，到当前段落结束
    4. 拼接所有段落的 content 字段
  - **示例**:
    - 章节: [P1, P2✓, P3, P4✓, P5, P6✓] (✓表示有元素状态修改)
    - 当前段落: P6
    - `includePreviousParagraphsWithChanges = 0`: P1 + P2 + P3 + P4 + P5 + P6
    - `includePreviousParagraphsWithChanges = 1`: P4 + P5 + P6
    - `includePreviousParagraphsWithChanges = 2`: P2 + P3 + P4 + P5 + P6
  - **使用场景**: 提供已有文本上下文
  - **配置项**: 在 AI 配置中添加 `contextParagraphRange` 字段

#### 4. 创建单元测试

- **`AIMessageBuilder.test.js`**
  - 测试 `buildMessages` 方法
  - 测试段落生成和段落分析的不同消息结构
  - 测试 `validateMessages` 方法的各种验证场景

- **`AIPromptBuilder.test.js`**
  - 测试 `buildParagraphPrompt` 方法
  - 测试 `buildAnalysisPrompt` 方法
  - 测试模板自定义功能

- **`AIContextBuilder.test.js`**
  - 测试 `buildContext` 方法
  - 测试 `buildElementStateSummary` 方法的准确性
  - 测试元素状态的时间线正确性
  - 测试 `getPrecedingText` 方法
    - 测试 `includePreviousParagraphsWithChanges = 0`（从章节开始）
    - 测试 `includePreviousParagraphsWithChanges = 1`（从第 1 条有修改的段落）
    - 测试 `includePreviousParagraphsWithChanges = 2`（从第 2 条有修改的段落）
    - 测试边界情况（不足 x 条有修改的段落）
    - 测试没有元素状态修改的情况

#### 5. 创建 `js/modules/RequestCacheManager.js`

**职责**: 管理 AI 请求预览和结果的缓存，防止用户误操作导致数据丢失

**与现有 `StateContextCache` 的区别**:

- **StateContextCache** (`js/managers/StateContextCache.js`):
  - 缓存内容: 状态上下文（story context）
  - 目的: 优化性能，避免重复计算
  - TTL: 5 分钟
  - 存储: 纯内存（Map）
  - 使用场景: `AIManager.buildContext()` 调用 `stateContextCache.getContext()`

- **RequestCacheManager** (新组件):
  - 缓存内容: AI 请求预览对象和返回结果
  - 目的: 防止用户误操作导致数据丢失
  - TTL: 10 分钟（预览）+ 30 分钟（结果）
  - 存储: 内存 + localStorage（持久化）
  - 使用场景: `AIManager.previewRequest()` 和 `sendMessage()` 后保存

**两个组件互补，不重复**: StateContextCache 缓存状态上下文供 AI 上下文生成使用，RequestCacheManager 缓存预览和结果供用户误操作恢复使用。

**方法说明**:

- **`savePreview(requestId, aiRequest, ttl = 10 * 60 * 1000)`**
  - **用途**: 保存预览对象到缓存
  - **输入**:
    - `requestId`: string - 请求唯一标识
    - `aiRequest`: `AIRequest` - 预览对象
    - `ttl`: number - 缓存生存时间（毫秒），默认 10 分钟
  - **输出**: void
  - **实现**:
    - 同时保存到内存（快速访问）和 localStorage（持久化）
    - 设置过期时间

- **`getPreview(requestId)`**
  - **用途**: 从缓存获取预览对象
  - **输入**: `requestId`
  - **输出**: `AIRequest | null`
  - **实现**:
    - 优先从内存获取
    - 内存不存在则从 localStorage 获取
    - 检查是否过期，过期则返回 null

- **`saveResult(requestId, result, ttl = 30 * 60 * 1000)`**
  - **用途**: 保存 AI 返回结果到缓存
  - **输入**:
    - `requestId`: string - 请求唯一标识
    - `result`: object - AI 返回结果
    - `ttl`: number - 缓存生存时间（毫秒），默认 30 分钟
  - **输出**: void
  - **实现**:
    - 保存到 localStorage（持久化）
    - 设置过期时间

- **`getResult(requestId)`**
  - **用途**: 从缓存获取 AI 返回结果
  - **输入**: `requestId`
  - **输出**: `object | null`
  - **实现**:
    - 从 localStorage 获取
    - 检查是否过期，过期则返回 null

- **`clearPreview(requestId)`**
  - **用途**: 清除指定预览的缓存
  - **输入**: `requestId`
  - **输出**: void

- **`clearResult(requestId)`**
  - **用途**: 清除指定结果的缓存
  - **输入**: `requestId`
  - **输出**: void

- **`clearExpired()`** - 辅助方法
  - **用途**: 清理所有过期的缓存
  - **输入**: 无
  - **输出**: void
  - **调用时机**: 应用启动时、定期清理

- **`generateRequestId()`** - 辅助方法
  - **用途**: 生成唯一的请求 ID
  - **输入**: 无
  - **输出**: string - 格式: `req_${timestamp}_${random}`
  - **使用场景**: 每次创建预览时调用

#### 6. 创建单元测试

- **`RequestCacheManager.test.js`**
  - 测试保存和获取预览
  - 测试保存和获取结果
  - 测试过期机制
  - 测试内存和 localStorage 同步
  - 测试清理过期缓存

### 阶段 2: 集成到 ParagraphGenerator (1 天)

1. 修改 `ParagraphGenerator.generateParagraphContent`
   - 使用新的 `AIMessageBuilder` 和 `AIPromptBuilder`
   - 直接替换旧实现

2. 测试段落生成功能
   - 功能测试
   - 预览测试
   - 边界条件测试

### 阶段 3: 集成到 ParagraphAnalyzer (1 天)

1. 修改 `ParagraphAnalyzer.generateAnalysisPrompt`
   - 使用新的 `AIPromptBuilder`
   - 直接替换旧实现

2. 测试段落分析功能
   - 功能测试
   - 工具调用测试
   - 边界条件测试

### 阶段 4: 集成到 AIManager (1-2 天)

#### 1. 添加 `AIManager.previewRequest` 方法

**用途**: 生成 AI 请求的预览对象，用户确认后再发送

**方法说明**:

- **`previewRequest(type, options)`**
  - **输入参数**:
    - `type`: 'paragraph-generation' | 'paragraph-analysis' - 请求类型
    - `options`: object - 请求配置
      - `userPrompt`: string - 用户提示词
      - `config`: object - 模型配置 (model, temperature, maxTokens)
      - `paragraph`: object - 段落对象 (仅 analysis 类型需要)
  - **输出**: `AIRequest` 对象
    ```javascript
    {
        type: string,
        config: {model, temperature, maxTokens},
        messages: Array<{role, content}>,
        tools?: Array<object>,
        context: {
            chapterTitle,
            chapterContent,       // 截至选中段落的章节内容（不是全章）
            elementStateSummary,  // 截至选中段落的元素状态（不是全部）
        }
    }
    ```
  - **处理流程**:
    1. 调用 `AIContextBuilder.buildContext()` 生成上下文
    2. 调用 `AIMessageBuilder.buildMessages()` 构建消息数组
    3. 组装完整的 `AIRequest` 对象
    4. 返回预览对象
  - **使用场景**: 用户点击"预览"按钮时调用
  - **缓存**: 生成预览后，立即调用 `requestCacheManager.savePreview(requestId, aiRequest)` 保存到缓存

#### 2. 修改 `AIManager.sendMessage` 方法

**用途**: 发送 AI 请求，统一使用新组件构建消息

**架构说明**:

**AIManager vs AIService 的职责划分**:

- **AIManager** (业务层):
  - 负责业务逻辑和用户交互
  - 构建 AI 请求（调用新的构建组件）
  - 管理预览流程
  - 处理返回结果（段落生成、元素更新等）
  - 协调各个 Manager (ParagraphGenerator, ParagraphAnalyzer 等)

- **AIService** (服务层):
  - 负责与 AI 提供商的底层通信
  - 使用适配器模式支持多个提供商 (OpenAI, Anthropic, DeepSeek 等)
  - 处理网络请求、超时、重试
  - 格式化 API 请求和响应
  - **不应该包含业务逻辑**

**分层原因**:
1. **关注点分离**: 业务逻辑 vs 技术实现
2. **可测试性**: AIService 可以独立测试，不依赖业务逻辑
3. **可扩展性**: 新增 AI 提供商只需修改 AIService，不影响 AIManager
4. **可维护性**: 职责清晰，代码更易理解

**修改内容**:

- **预览流程**:
  1. 调用 `previewRequest()` 生成预览对象
  2. 显示预览界面给用户确认
  3. 用户确认后，使用预览对象发送请求

- **发送流程**:
  1. 从预览对象中提取 messages 和 tools
  2. 调用 `AIService.chat()` 发送请求（仅负责底层通信）
  3. 处理返回结果（业务层逻辑）
  4. **缓存结果**: 调用 `requestCacheManager.saveResult(requestId, result)` 保存到缓存
  5. 清除预览缓存（可选，保留一段时间以供查看）

- **直接发送模式** (可选):
  - 如果用户选择"记住选择，不再预览"，可以跳过预览步骤
  - 直接使用相同的构建流程发送请求

- **恢复机制** (防止误操作损失):
  - 用户误操作关闭预览/结果后，可以从缓存中恢复
  - UI 提供"重新打开预览"或"恢复结果"按钮
  - 调用 `requestCacheManager.getPreview(requestId)` 或 `requestCacheManager.getResult(requestId)`
  - 显示最近 5 个请求的列表，用户可以点击恢复

#### 3. 测试预览功能

- **UI 测试**:
  - 测试预览界面的正确显示
  - 测试用户确认和取消操作
  - 测试"记住选择"功能

- **集成测试**:
  - 测试预览到发送的完整流程
  - 测试不同请求类型的预览
  - 测试边界条件 (空输入、无效段落等)

### 阶段 5: 清理和优化 (1 天)

#### 1. 移除重复代码

**删除 `AIService.addContextToMessages` 方法**
- **位置**: `js/services/AIService.js` line 102-144
- **原因**:
  - 功能已被 `AIContextBuilder.buildContext()` + `AIMessageBuilder.buildMessages()` 替代
  - **更重要的是**: 这个方法在服务层 (AIService) 处理业务逻辑，违反了分层架构原则
  - AIService 应该只负责底层通信，不应该处理上下文添加等业务逻辑
- **影响**: 需要检查是否有其他地方调用此方法
- **架构改进**: 删除后，AIService.chat() 将只接收已经构建好的 messages，职责更清晰

**删除 `AIManager.buildAIMessages` 方法**
- **位置**: `js/managers/AIManager.js` line 1142-1173
- **原因**: 功能已被 `AIMessageBuilder.buildMessages()` 替代
- **影响**: 需要检查是否有其他地方调用此方法

**删除 `AIManager.buildContextMessages` 方法**
- **位置**: `js/managers/AIManager.js` line 1180-1205
- **原因**: 功能已被 `AIMessageBuilder` 和 `AIContextBuilder` 替代
- **影响**: 需要检查是否有其他地方调用此方法

**删除 `AIManager.formatElementStateSummary` 方法**
- **位置**: `js/managers/AIManager.js` line 1397-1423
- **原因**: 功能已被 `AIContextBuilder.buildElementStateSummary()` 替代
- **影响**: 需要更新 `AIManager.buildContext()` 中的调用 (line 1349, 1382)

**删除或简化 `ParagraphStateSummary.formatAsText` 方法**
- **位置**: `js/modules/ParagraphStateSummary.js` line 280-332
- **原因**: 功能与 `AIContextBuilder.buildElementStateSummary()` 重复，但更详细
- **决策**:
  - 如果 `formatAsText` 仅用于 AI 上下文 → 删除
  - 如果 `formatAsText` 用于 UI 显示 → 保留，重命名为 `formatForUI()`
- **影响**: 需要检查调用位置

#### 2. 清理未使用的代码

**检查 `AIPreviewManager.js`**
- **位置**: `js/managers/AIPreviewManager.js`
- **操作**: 分析现有功能，如果已被新组件完全替代则删除
- **决策标准**:
  - 如果预览功能已完全由 `AIManager.previewRequest` 实现 → 删除
  - 如果有独特功能 → 保留并标记为待迁移

**检查 `PromptGenerator.js`**
- **位置**: `js/modules/PromptGenerator.js`
- **操作**: 分析现有功能，如果已被 `AIPromptBuilder` 替代则删除
- **决策标准**:
  - 如果提示词生成功能已完全由 `AIPromptBuilder` 实现 → 删除
  - 如果有独特功能 → 保留并标记为待迁移

#### 3. 代码审查和优化

- 检查所有导入引用，确保没有未使用的导入
- 检查导出接口，确保公共 API 清晰
- 性能分析，确保新组件没有引入性能问题
- 代码风格检查，确保符合项目规范

#### 4. 文档更新

- 更新 README 或相关文档
- 记录新组件的用法和 API
- 添加迁移说明 (如果有外部依赖)

## Open Questions

1. **提示词模板管理**: 提示词模板应该存储在哪里?
   - 决策: 代码中硬编码默认模板,支持配置覆盖
   - 理由: 简单实现,同时保留灵活性

2. **预览默认行为**: 是否默认开启预览?
   - 决策: 总是显示预览
   - 理由: 确保用户了解将要发送的内容,减少误操作

3. **缓存策略**: 如何缓存预览和结果?
   - **状态上下文 (StateContextCache)**: 缓存状态上下文
     - 现有组件: `js/managers/StateContextCache.js`
     - 目的: 优化性能，避免重复计算
     - TTL: 5 分钟
     - 存储: 纯内存（Map）
     - 继续使用，不改变
   - **AI 上下文 (context)**: 不缓存，每次重新生成
     - 理由: 确保上下文基于最新状态，避免数据不一致
     - 使用 StateContextCache 缓存的状态上下文作为基础
   - **预览对象 (AIRequest)**: 缓存，避免误操作损失
     - 缓存预览的 messages、tools、context
     - 用户误操作关闭预览后，可以重新打开查看
     - 缓存时间: 5-10 分钟（可配置）
     - 缓存位置: 内存 + localStorage（持久化）
   - **AI 返回结果**: 缓存，避免误操作损失
     - 缓存 AI 生成的段落、分析结果等
     - 用户误操作关闭后，可以恢复
     - 缓存时间: 30 分钟 - 1 小时（可配置）
     - 缓存位置: localStorage
   - **实现方式**:
     - 创建新组件 `RequestCacheManager`（与 StateContextCache 不重复）
     - 使用 `requestId` 唯一标识每个请求
     - 提供 `savePreview(requestId, aiRequest)` 和 `getPreview(requestId)` 方法
     - 提供 `saveResult(requestId, result)` 和 `getResult(requestId)` 方法

4. **测试覆盖范围**: 需要多高的测试覆盖率?
   - 目标: 核心组件 80%, 辅助组件 60%
