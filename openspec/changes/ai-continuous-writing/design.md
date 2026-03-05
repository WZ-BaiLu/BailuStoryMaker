# Design: AI Continuous Writing Feature

## Context

### Current State

当前BailuStory项目已经具备了基础的AI写作能力：

1. **AIManager** (`js/managers/AIManager.js`)
   - 管理AI配置和AI服务调用
   - 提供AI聊天面板界面
   - 集成了AIElementTools和ParagraphAnalyzer

2. **AIService** (`js/services/AIService.js`)
   - 统一的AI服务接口，支持多个AI提供商（OpenAI、Anthropic、DeepSeek等）
   - 提供聊天补全接口（chat方法）
   - 使用适配器模式支持多提供商

3. **ParagraphAnalyzer** (`js/modules/ParagraphAnalyzer.js`)
   - 分析段落内容，提取故事元素、事件、状态变化
   - 支持缓存分析结果
   - 集成AI工具（addEvent、updateElementLocation等）

4. **UIRenderer** (`js/managers/UIRenderer.js`)
   - 负责UI渲染
   - 管理视图切换和更新

5. **NotificationManager** (`js/managers/NotificationManager.js`)
   - 提供通知功能

### Constraints

- **无外部依赖**: 项目使用纯Vanilla JavaScript，无框架
- **客户端存储**: 使用localStorage保存配置
- **同步流程**: 连续写作需要按顺序执行，每段生成后等待用户中断或超时
- **性能考虑**: 连续调用AI服务可能较慢，需要提供进度反馈
- **用户体验**: 等待期间用户可以中断，需要清晰的UI反馈

### Stakeholders

- **作家用户**: 需要高效的连续创作工具
- **AI服务提供商**: 需要遵守API调用限制（如果有）

## Goals / Non-Goals

### Goals

1. 提供连续写作功能，允许用户一次性指定多个段落的生成数量
2. 基于当前选中段落或最新段落自动构建上下文
3. 每段生成后自动调用ParagraphAnalyzer进行分析并应用结果
4. 提供可中断的等待机制，默认5秒，可配置（1-30秒）
5. 等待界面显示实时进度和倒计时
6. 全部完成后发送网页通知
7. 集成到现有AI工具栏，提供直观的用户界面

### Non-Goals

- 不提供AI生成内容的自动审查或过滤
- 不实现段落数量的智能推荐（用户手动指定）
- 不支持并行段落生成（保证顺序一致性）
- 不实现跨章节的连续写作（仅在当前章节内）

## Decisions

### 1. 架构设计：独立的ContinuousWritingManager

**Decision**: 创建一个新的`ContinuousWritingManager`类来管理连续写作流程。

**Rationale**:
- **职责分离**: 连续写作涉及多个步骤协调（生成、等待、分析、更新），独立管理器能更好地封装这些逻辑
- **可测试性**: 独立类易于单元测试
- **复用性**: 未来可能在其他场景复用连续任务协调逻辑
- **不污染现有类**: AIManager已经很复杂（1800+行），避免继续膨胀

**Alternatives Considered**:
- **A. 在AIManager中添加连续写作方法**: 会导致AIManager过于庞大，违反单一职责原则
- **B. 在AIService中添加连续写作方法**: AIService只负责单次调用，不应包含流程协调逻辑
- **C. 在AIElementTools中添加连续写作方法**: AIElementTools专注于工具定义和调用，不应包含UI和流程逻辑

### 2. 等待机制：Promise + setTimeout

**Decision**: 使用Promise和setTimeout实现可中断的等待机制。

**Rationale**:
- **简洁性**: 利用Promise的可取消特性，代码简洁清晰
- **兼容性**: 完全基于标准JavaScript，无额外依赖
- **可中断**: 通过AbortController或标志位实现中断

**Implementation Pattern**:
```javascript
async waitForInterruptibleDelay(ms) {
    return new Promise((resolve, reject) => {
        let timeout;
        const onAbort = () => {
            clearTimeout(timeout);
            reject(new Error('Interrupted'));
        };
        timeout = setTimeout(() => {
            this.abortController.signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        this.abortController.signal.addEventListener('abort', onAbort);
    });
}
```

**Alternatives Considered**:
- **A. 使用setInterval**: 需要手动清理，代码更复杂
- **B. 使用第三方库**: 引入外部依赖违反项目原则

### 3. 上下文构建：基于当前选中或最新段落

**Decision**: 优先使用用户选中的段落作为上下文起点，如果未选中则使用最新段落。

**Rationale**:
- **符合用户意图**: 选中段落表示用户想基于该点继续创作
- **向后兼容**: 未选中时使用最新段落，对现有用户无影响
- **简单直观**: 易于理解和实现

**Implementation**:
```javascript
getStartingParagraph() {
    const selectedParagraphId = this.state.selectedParagraphId;
    if (selectedParagraphId) {
        return this.story.paragraphs.find(p => p.id === selectedParagraphId);
    }
    return this.story.paragraphs[this.story.paragraphs.length - 1];
}
```

**Alternatives Considered**:
- **A. 总是使用最新段落**: 不灵活，无法从特定点继续创作
- **B. 要求用户必须选中段落**: 增加用户操作负担

### 4. 段落分析集成：同步调用

**Decision**: 每段生成后立即同步调用ParagraphAnalyzer进行分析。

**Rationale**:
- **即时反馈**: 用户能立即看到分析结果
- **数据一致性**: 避免段落和分析结果不同步
- **简化流程**: 不需要管理异步分析队列

**Implementation**:
```javascript
for (let i = 0; i < count; i++) {
    // 1. 生成段落
    const paragraph = await this.generateParagraph(context);

    // 2. 分析段落
    const analysis = await this.analyzeParagraph(paragraph, context);

    // 3. 应用分析结果
    this.applyAnalysis(analysis);

    // 4. 更新UI
    this.updateUI();

    // 5. 等待（可中断）
    await this.waitForInterruptibleDelay(waitTime);
}
```

**Alternatives Considered**:
- **A. 批量分析后再应用**: 用户体验差，无法及时看到结果
- **B. 异步分析**: 增加复杂度，需要处理并发和错误

### 5. UI设计：模态对话框 + 叠加层

**Decision**: 使用两个独立的UI组件：
1. **输入对话框**: 模态对话框，用于输入段落数量和开始连续写作
2. **等待叠加层**: 半透明叠加层，显示进度和倒计时

**Rationale**:
- **清晰的交互流程**: 输入和等待是两个不同阶段，分离更清晰
- **防止误操作**: 模态对话框可以阻止用户在输入期间操作主界面
- **实时反馈**: 叠加层可以实时显示进度，不影响主内容查看

**UI Structure**:
```html
<!-- Input Dialog -->
<div class="modal continuous-writing-input-modal">
    <div class="modal-content">
        <h3>连续写作</h3>
        <label>段落数量：<input type="number" min="1" max="20" value="5"></label>
        <div class="modal-actions">
            <button id="start-btn">开始</button>
            <button id="cancel-btn">取消</button>
        </div>
    </div>
</div>

<!-- Wait Overlay -->
<div class="continuous-writing-overlay">
    <div class="progress-panel">
        <div class="progress-info">进度：3/10 段落</div>
        <div class="countdown-info">等待：4 秒</div>
        <button id="interrupt-btn">中断</button>
    </div>
</div>
```

**Alternatives Considered**:
- **A. 单个模态对话框**: 在等待期间无法看到主内容，体验差
- **B. 内联工具栏**: UI空间有限，不适合显示详细进度

### 6. 设置存储：localStorage

**Decision**: 使用localStorage保存连续写作等待时间配置。

**Rationale**:
- **现有方案**: 项目已使用localStorage保存其他设置（如主题）
- **无需后端**: 客户端存储足够，简单高效
- **持久化**: 用户设置在浏览器关闭后仍保留

**Storage Key**:
```
continuous-writing.wait-time = 5
```

**Alternatives Considered**:
- **A. 存储在story JSON文件中**: 配置是用户偏好，不应与特定故事绑定
- **B. 使用IndexedDB**: 过度设计，localStorage足够

### 7. 错误处理：优雅降级

**Decision**: 在每个关键步骤添加错误处理，失败时提供清晰的错误信息并允许用户选择继续或中止。

**Rationale**:
- **容错性**: AI服务可能不稳定，不应因一次失败导致整个流程崩溃
- **用户体验**: 提供选项让用户决定是继续还是中止

**Error Handling Strategy**:
```javascript
try {
    const paragraph = await this.generateParagraph(context);
} catch (error) {
    const shouldContinue = await this.promptUser(
        '生成失败，是否继续？',
        ['继续', '中止']
    );
    if (!shouldContinue) {
        this.abort();
        return;
    }
}
```

**Alternatives Considered**:
- **A. 遇到错误立即中止**: 过于严格，可能浪费用户时间
- **B. 自动重试固定次数**: 可能浪费时间，用户应自主决定

## Risks / Trade-offs

### Risk 1: 连续调用AI服务可能导致API限流

**Mitigation**:
- 在UI中添加警告提示，告知用户可能的限流风险
- 实现自动重试机制（指数退避）
- 提供手动调整等待时间的选项，用户可以通过增加等待时间来降低请求频率

### Risk 2: 生成的内容可能不连贯

**Mitigation**:
- 确保每段生成时都包含足够的前文上下文
- 提供用户审查和编辑机制
- 在等待期间让用户有机会中断并调整

### Risk 3: 用户可能在等待期间感到不耐烦

**Mitigation**:
- 提供可配置的等待时间（1-30秒）
- 清晰的进度显示和倒计时
- 允许用户立即中断
- 优化等待时间默认值（通过用户反馈调整）

### Risk 4: ParagraphAnalyzer调用失败导致状态不一致

**Mitigation**:
- 分析失败时保存原始段落，但不应用分析结果
- 提供手动触发分析的选项
- 在UI中明确标记未分析的段落

### Risk 5: UI渲染性能问题（连续更新段落列表）

**Mitigation**:
- 使用增量更新，只渲染新增的段落
- 实现虚拟滚动（如果段落数量很大）
- 添加"显示/隐藏分析结果"选项

### Trade-off: 同步分析 vs 异步分析

**Decision**: 使用同步分析

**Trade-off**:
- **优势**: 数据一致性好，用户体验清晰
- **劣势**: 连续写作总时间变长（每段都需要等待分析）

**Mitigation**: 提供可跳过分析的选项（高级设置）

## Migration Plan

### Deployment Steps

1. **创建ContinuousWritingManager类**
   - 文件路径: `js/managers/ContinuousWritingManager.js`
   - 在index.html中添加脚本引用

2. **扩展AIManager**
   - 初始化ContinuousWritingManager
   - 添加连续写作按钮事件绑定
   - 暴露开始/中断连续写作的公开方法

3. **扩展UIRenderer**
   - 添加输入对话框渲染方法
   - 添加等待叠加层渲染方法
   - 添加进度更新方法

4. **扩展SettingsManager**
   - 添加连续写作等待时间配置项
   - 在设置UI中添加配置控件

5. **CSS样式**
   - 添加连续写作相关样式（模态框、叠加层、进度面板）

6. **测试**
   - 单元测试：ContinuousWritingManager流程控制
   - 集成测试：完整连续写作流程
   - UI测试：等待界面和中断功能

### Rollback Strategy

- 如果发现严重问题，可以：
  1. 从index.html中移除ContinuousWritingManager.js引用
  2. 在AIManager中移除连续写作相关代码
  3. 在UIRenderer中移除连续写作UI渲染方法
  4. 回滚CSS样式更改
- 由于是纯新增功能，不影响现有功能，回滚安全

## Open Questions

1. **等待时间默认值**: 是否5秒是最合适的默认值？需要用户反馈验证
2. **最大段落数量**: 20段是否合适？是否需要更宽松的限制？
3. **跳过分析选项**: 是否需要在高级设置中提供跳过分析的选项？
4. **跨章节支持**: 未来是否需要支持跨章节的连续写作？

**Resolution Strategy**:
- 问题1-2: 通过用户反馈和A/B测试验证
- 问题3: 根据用户需求决定（可以在V2中添加）
- 问题4: 作为未来扩展功能，不在本次实现范围内
