# 段落分析功能使用说明

## 概述

段落分析功能允许你根据已有的段落文本自动生成故事元素、事件和状态修改。这利用 AI 来理解段落内容，提取结构化信息，并将其应用到故事中。

## 核心功能

1. **段落分析**: 分析段落内容，提取元素、事件和状态变化
2. **批量分析**: 一次性分析多个段落
3. **智能推断**: 基于上下文理解段落语义
4. **自动应用**: 将分析结果自动应用到故事数据中
5. **地点识别**: 智能识别和追踪故事中的地点信息（详见 [LOCATION_RECOGNITION_GUIDE.md](LOCATION_RECOGNITION_GUIDE.md)）

## 使用方法

### 1. 基本使用

```javascript
// 在 AIManager 中已经集成了段落分析功能

// 分析单个段落
const paragraph = {
    id: 'paragraph-1',
    content: '李明走进房间，看到了桌上的宝剑。他拿起宝剑，发现它很锋利。'
};

const context = {
    chapterId: 'chapter-1'
};

const result = await aiManager.analyzeParagraph(paragraph, context);

if (result.success) {
    console.log('分析结果:', result.data);

    // 分析结果包含:
    // - elements: 段落中提到的或新增的元素
    // - events: 段落中发生的事件
    // - stateChanges: 元素状态变化
}
```

### 2. 应用分析结果

```javascript
// 将分析结果应用到故事
const applicationResult = await aiManager.applyParagraphAnalysis(
    result.data,
    paragraph.id
);

if (applicationResult.success) {
    console.log('已创建新元素:', applicationResult.data.createdElements);
    console.log('已更新元素状态:', applicationResult.data.updatedElements);
}
```

### 3. 批量分析

```javascript
// 分析整个章节的段落
const chapter = story.chapters.find(c => c.id === 'chapter-1');
const paragraphs = chapter.paragraphs;

const batchResult = await aiManager.analyzeParagraphs(
    paragraphs,
    { chapterId: 'chapter-1' }
);

if (batchResult.success) {
    for (const analysis of batchResult.data) {
        if (!analysis.error) {
            await aiManager.applyParagraphAnalysis(analysis, analysis.paragraphId);
        }
    }
}
```

## 分析结果结构

```javascript
{
    paragraphId: 'paragraph-1',
    timestamp: '2024-01-01T00:00:00.000Z',

    // 元素列表
    elements: [
        {
            id: 'character-1',
            type: 'character',
            isNew: false  // 已存在的元素
        },
        {
            temporaryId: 'NEW:item',
            type: 'item',
            name: '宝剑',
            description: '一把锋利的剑',
            keywords: ['道具', '宝剑'],
            isNew: true  // 新元素，需要创建
        }
    ],

    // 事件列表
    events: [
        {
            description: '李明拿起宝剑',
            type: 'action',
            participants: ['character-1'],
            location: 'room-1'
        }
    ],

    // 状态变化
    stateChanges: [
        {
            elementId: 'character-1',
            changes: {
                location: 'room-1'
            }
        },
        {
            elementId: 'item-1',
            changes: {
                owner: 'character-1',
                location: 'character-1'
            }
        }
    ]
}
```

## 元素类型

- **character**: 人物
- **item**: 道具
- **location**: 地点
- **memory**: 记忆
- **base**: 基础设定

## 事件类型

- **action**: 动作
- **dialogue**: 对话
- **discovery**: 发现
- **conflict**: 冲突
- **emotional**: 情感
- **state_change**: 状态变化

## 状态变化类型

- **location**: 所在地变化
- **description**: 描述变化
- **owner**: 拥有者变化
- **status**: 状态变化（如 "破损", "被遗忘"）
- **keywords**: 关键字变化

## 高级用法

### 1. 自定义分析提示词

如果需要自定义分析逻辑，可以修改 `ParagraphAnalyzer.js` 中的 `generateAnalysisPrompt` 方法：

```javascript
generateAnalysisPrompt(paragraph, analysisContext) {
    // 自定义提示词内容
    let prompt = `自定义分析提示词...`;

    return prompt;
}
```

### 2. 缓存管理

```javascript
// 清除所有缓存
aiManager.paragraphAnalyzer.clearCache();

// 清除特定段落的缓存
aiManager.paragraphAnalyzer.invalidateCache('paragraph-1');
```

### 3. 与其他功能集成

```javascript
// 结合 StateContextCache 获取更准确的上下文
const stateContext = await stateContextCache.getContext(chapterId);
const analysis = await aiManager.analyzeParagraph(paragraph, {
    chapterId: chapterId,
    stateContext: stateContext
});
```

## 注意事项

1. **AI 依赖**: 此功能需要配置 AI 服务（OpenAI 或兼容服务）
2. **性能考虑**: 批量分析大量段落可能会耗时较长
3. **准确性**: AI 分析结果可能需要人工审查，特别是对于复杂的段落
4. **缓存机制**: 相同段落的分析结果会被缓存，修改段落后记得清除缓存

## 错误处理

```javascript
try {
    const result = await aiManager.analyzeParagraph(paragraph, context);

    if (!result.success) {
        console.error('分析失败:', result.error);
        // 处理错误...
    }
} catch (error) {
    console.error('调用失败:', error);
}
```

## 示例场景

### 场景 1: 分析战斗段落

```
段落: "李明挥剑砍向敌人，剑刃在空气中划出一道寒光。敌人闪避不及，被击中肩膀。"

AI 分析结果:
- events: [
    {
      description: "李明攻击敌人",
      type: "action",
      participants: ["character-1", "character-2"]
    }
  ]
- stateChanges: [
    {
      elementId: "character-2",
      changes: {
        description: { "health": "-10", "status": "受伤" }
      }
    }
  ]
```

### 场景 2: 发现新道具

```
段落: "他打开箱子，发现里面有一把古老的钥匙，上面刻着奇怪的符文。"

AI 分析结果:
- elements: [
    {
      temporaryId: "NEW:item",
      type: "item",
      name: "古老的钥匙",
      description: "一把刻着奇怪符文的钥匙",
      keywords: ["道具", "钥匙", "古老"],
      isNew: true
    }
  ]
- events: [
    {
      description: "发现古老的钥匙",
      type: "discovery",
      participants: ["character-1"]
    }
  ]
```

### 场景 3: 对话场景

```
段落: ""你真的要离开吗？"李明问道。王强点了点头，"是的，我必须去。""

AI 分析结果:
- events: [
    {
      description: "李明询问王强",
      type: "dialogue",
      participants: ["character-1", "character-2"]
    },
    {
      description: "王强确认离开",
      type: "dialogue",
      participants: ["character-2"]
    }
  ]
- stateChanges: [
    {
      elementId: "character-2",
      changes: {
        description: { "status": "准备离开" }
      }
    }
  ]
```

## 相关文件

- `js/modules/ParagraphAnalyzer.js`: 段落分析核心模块
- `js/managers/AIManager.js`: AI 管理器（包含分析方法）
- `tests/modules/ParagraphAnalyzer.test.js`: 单元测试

## 技术实现

段落分析功能使用了以下技术：

1. **AI 服务**: 使用 OpenAI API 或兼容服务进行文本分析
2. **元素管理**: 集成 ElementManager 进行元素操作
3. **状态跟踪**: 支持 StateTimeline 的状态变化记录
4. **缓存优化**: 使用 Map 缓存分析结果，提高性能
5. **错误处理**: 完善的错误处理和重试机制
6. **地点识别**: 使用 LocationRecognizer 进行智能地点提取和识别
7. **AI 工具**: 通过 AIElementTools 提供上下文查询和元素操作

## 地点识别

段落分析现在包含强大的地点识别功能，能够：

- 自动识别段落中的地点信息
- 区分移动起点、终点和当前地点
- 智能匹配已存在的地点，避免重复创建
- 支持武侠小说特有的地名和建筑

### 地点识别示例

```javascript
const paragraph = {
    id: 'paragraph-1',
    content: '张无忌来到光明顶，看到远处的山峰。'
};

const result = await aiManager.paragraphAnalyzer.analyzeParagraph(paragraph, context);

// AI 会自动：
// 1. 识别到 "光明顶" 是当前地点
// 2. 检查 "光明顶" 是否已存在
// 3. 如果不存在，创建地点元素
// 4. 更新张无忌的位置到光明顶
```

### 支持的地点描述模式

- **移动动作**: "来到"、"走进"、"进入"、"登上" 等
- **位置介词**: "在...里"、"在...上"、"位于" 等
- **环境描述**: "山峰"、"大殿"、"洞窟"、"庭院" 等
- **地名**: 武当山、少林寺、光明顶等

详见 [LOCATION_RECOGNITION_GUIDE.md](LOCATION_RECOGNITION_GUIDE.md) 获取更多详情。

## 未来扩展

- [ ] 支持自定义分析规则
- [ ] 添加可视化分析结果展示
- [ ] 支持批量分析进度提示
- [ ] 添加分析结果编辑功能
- [ ] 支持导出分析报告
