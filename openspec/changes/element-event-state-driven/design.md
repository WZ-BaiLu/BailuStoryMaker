# Element/Event/State Driven Architecture Design

## Context

### Current State
当前系统采用分散的数据模型:
- **角色** (`characters[]`): 独立管理属性、能力、`heldItems` 数组
- **道具** (`items[]`): 独立管理属性、`owner` 字段
- **设定** (`settings[]`): 独立的地点/世界观设定
- **段落** (`paragraphs[]`): 包含 `changes.characters[]` 和 `changes.items[]` 数组记录变化

### Problem Space
1. **数据分散**: 角色、道具、设定缺乏统一抽象,难以统一查询和管理
2. **状态跟踪不完整**:
   - 无法追溯元素在任意时刻的历史状态
   - "被遗忘"、"在场"等状态概念无法系统化
   - 状态变化缺乏时间线记录
3. **AI 上下文不精确**:
   - 无法根据故事视角动态筛选在场元素
   - 无法智能处理"被遗忘"元素的特殊逻辑
   - 缺少关键字驱动的元素筛选机制
4. **数据冗余**:
   - `character.heldItems` 和 `item.owner` 存储重复信息
   - 容易出现数据不一致

### Constraints
- 必须保持与现有 UI 的兼容性
- 需要支持数据迁移(现有故事数据)
- 性能不能下降(状态查询需快速响应)
- 需要向后兼容现有的 API 接口

## Goals / Non-Goals

### Goals
1. **统一数据模型**: 所有故事元素继承 `StoryElement`,提供统一的 CRUD 接口
2. **完整状态时间线**: 记录所有元素的状态变化,支持查询任意时刻的状态
3. **智能场景感知**: 基于故事视角和关键字自动筛选相关元素
4. **AI 工具集成**: 提供标准化的 AI tools,支持元素和状态管理
5. **性能优化**: 章节级缓存 + 混合状态管理,平衡性能和内存

### Non-Goals
1. **不是时光回溯编辑器**: 不支持修改历史段落(只读历史状态)
2. **不改变 UI 布局**: 不修改现有的编辑器布局(只扩展显示内容)
3. **不引入新依赖**: 不引入新的第三方库(纯 JS 实现)
4. **不改变章节结构**: 不修改章节和段落的树形结构

## Decisions

### Decision 1: 统一 StoryElement 基类

**方案**: 创建 `StoryElement` 基类,所有元素类型(Character/Item/Location/Memory/Base)继承

**理由**:
- ✅ 统一的 CRUD 接口,简化代码维护
- ✅ 统一的关键字和状态历史机制
- ✅ 易于扩展新的元素类型
- ✅ 类型安全(TypeScript 支持时可加强)

**替代方案**:
- ❌ **方案 A**: 保持分散的数据模型,添加接口层
  - 问题: 代码重复,难以维护
- ❌ **方案 B**: 完全扁平化(所有元素使用相同字段)
  - 问题: 失去类型特异性,数据验证困难

**数据结构**:
```javascript
class StoryElement {
  id: string;              // 格式: <type>-<name>-<sequence>
  type: ElementType;        // 'character'|'item'|'location'|'memory'|'base'
  name: string;
  description: string;
  keywords: string[];       // AI 查询用关键字
  location: string;         // 当前所在地的 elementId
  stateHistory: StateChange[];  // 状态变化历史

  // 类型特定字段(由子类定义)
}
```

### Decision 2: 混合状态管理策略

**方案**:
- **Element 中**: 记录关键状态变化点(`stateHistory` 数组)
- **StateTimeline**: 全局时间线索引,支持快速查询

**理由**:
- ✅ 平衡性能和内存(不存储完整快照)
- ✅ 灵活查询(支持"某时刻某元素的状态")
- ✅ 易于调试(可追溯变化历史)

**替代方案**:
- ❌ **方案 A**: 只在 Element 中存储 `stateHistory`
  - 问题: 无法查询"所有元素在某时刻的状态"
- ❌ **方案 B**: 只存储全局快照
  - 问题: 内存占用大,数据冗余

**数据结构**:
```javascript
// Element 中的状态历史
interface StateChange {
  paragraphId: string;
  timestamp: string;
  changes: {
    location?: string;        // 所在地变化
    description?: Record<string, any>;  // 描述变化(如 {"剑术":"等级1"})
    owner?: string;           // 拥有者变化(仅 item/character)
    status?: string;          // 状态变化(如 "破损","被遗忘")
    keywords?: string[];      // 关键字变化
  };
}

// 全局时间线索引
class StateTimeline {
  // 索引: paragraphId -> 变化的元素列表
  changesByParagraph: Map<string, ElementChange[]>;

  // 方法
  getStateAt(paragraphId: string, elementId: string): ElementState;
  getCurrentContext(paragraphId: string): StoryContext;
}
```

### Decision 3: 故事视角管理器 (StoryViewManager)

**方案**: 独立的 `StoryViewManager` 管理当前所在地,控制"在场"元素筛选

**理由**:
- ✅ 职责单一(只管视角,不管理元素数据)
- ✅ 支持视角切换通知
- ✅ 易于扩展(如多视角故事)

**"在场"判断逻辑**:
```javascript
isElementPresent(elementId: string, paragraphId: string): boolean {
  const element = getElement(elementId);
  const currentView = storyViewManager.getCurrentLocation();

  // 规则 1: 基础设定永远在场
  if (element.type === 'base') return true;

  // 规则 2: 元素所在地与视角所在地相同(或在其子区域)
  if (element.location === currentView) return true;

  // 规则 3: 被遗忘的物品仅当有"追忆"事件时在场
  if (element.keywords.includes('被遗忘')) {
    return hasRecallEvent(paragraphId, elementId);
  }

  // 规则 4: 记忆类型根据场景判断(有触发事件的段落在场)
  if (element.type === 'memory') {
    return hasTriggerEvent(paragraphId, elementId);
  }

  return false;
}
```

### Decision 4: 关键字管理策略

**方案**: 每个 Element 独立维护 `keywords` 数组,关键字包含:
- 类型关键字: "基础设定"、"人物"、"道具"、"地点"、"记忆"
- 状态关键字: "被遗忘"、"破损"、"在场"、"离场"
- 时间顺序关键字: 故事时间节点(如"第一章"、"初遇")

**理由**:
- ✅ 灵活支持复杂的筛选逻辑
- ✅ 关键字独立维护,不依赖全局状态
- ✅ 易于扩展(添加新的关键字类型)

**关键字使用场景**:
```javascript
// AI 上下文构建时筛选元素
getRelevantElements(paragraphId: string): StoryElement[] {
  const currentView = storyViewManager.getCurrentLocation();

  return allElements.filter(element => {
    // 基础设定永远包含
    if (element.keywords.includes('基础设定')) return true;

    // 被遗忘元素仅在有追忆事件时包含
    if (element.keywords.includes('被遗忘')) {
      return hasRecallEvent(paragraphId, element.id);
    }

    // 其他元素根据所在地判断
    return element.location === currentView;
  });
}
```

### Decision 5: AI Tools 调用时机

**方案**: 在"确认插入"时调用 AI tools,而非"预览生成"时

**理由**:
- ✅ 用户可以先检查 AI 生成的段落和状态变化,再决定是否应用
- ✅ 避免预览时修改真实数据
- ✅ 支持"拒绝"和"修改"操作

**工作流程**:
```javascript
// 1. AI 生成段落(不调用 tools,返回 JSON 格式建议)
const suggestion = await ai.generateParagraph({
  context: getCurrentStoryContext(paragraphId),
  elementChanges: [...]  // 建议的状态变化
});

// 2. 用户预览
ui.showPreview({
  content: suggestion.content,
  elementChanges: suggestion.elementChanges
});

// 3. 用户确认后调用 tools
if (user.confirm()) {
  // 插入段落
  state.addParagraph(chapterId, suggestion.content);

  // 应用状态变化(调用 AI tools)
  await applyElementChanges(suggestion.elementChanges);
}
```

### Decision 6: 章节级缓存策略

**方案**:
- 以章节为单位缓存 `StoryContext`
- 当段落增删改时,仅刷新当前章节的缓存
- 跨章节查询时实时计算

**理由**:
- ✅ 性能提升显著(避免重复计算)
- ✅ 缓存粒度合理(章节通常 < 100 段落)
- ✅ 实现简单(段落级缓存太频繁,全局缓存太粗)

**缓存实现**:
```javascript
class StateContextCache {
  // 缓存: chapterId -> StoryContext
  cache: Map<string, StoryContext>;

  // 获取(带缓存)
  getContext(chapterId: string): StoryContext {
    if (this.cache.has(chapterId)) {
      return this.cache.get(chapterId);
    }

    const context = this.calculateContext(chapterId);
    this.cache.set(chapterId, context);
    return context;
  }

  // 刷新缓存
  invalidate(chapterId: string): void {
    this.cache.delete(chapterId);
  }

  // 计算上下文(实时计算)
  calculateContext(chapterId: string): StoryContext {
    // 纯规则驱动,不使用 AI
    // ...
  }
}
```

### Decision 7: 段落时间线索引

**方案**: 为段落添加 `storyTimestamp` 字段,支持倒序、插叙、多线叙事等非线性结构

**理由**:
- ✅ 明确故事内时间点(而非仅仅段落顺序)
- ✅ 支持倒序叙事(先讲结果,再讲原因)
- ✅ 支持插叙(在当前时间点插入过去/未来的片段)
- ✅ 支持多线叙事(不同角色的并行故事线)
- ✅ 状态查询考虑叙事类型,确保时间点理解正确

**数据结构**:
```javascript
interface StoryTimestamp {
  chapterId: string;           // 所属章节
  sequence: number;             // 章节内顺序
  absoluteTime?: string;       // 绝对时间点(如"第3天早上")
  relativeTime?: string;       // 相对时间点(如"3年后")
  narrativeType?: 'linear'|'flashback'|'flashforward'|'parallel';
  referenceParagraphId?: string;  // 参考/锚点段落ID(用于插叙)
  timeOffset?: number;         // 相对锚点的时间偏移(正数=未来,负数=过去)
}

interface Paragraph {
  id: string;
  content: string;
  changes: ElementChange[];
  createdAt: string;           // 作者创作时间(元数据)
  storyTimestamp: StoryTimestamp;  // 故事内时间(新增)
}
```

**示例场景**:
```javascript
// 第一章: 顺序叙事
paragraph1 = {
  storyTimestamp: {
    chapterId: 'chapter-1',
    sequence: 1,
    absoluteTime: '第1天早上',
    narrativeType: 'linear'
  }
}

// 第二章: 倒序叙事(先讲结果)
paragraph2 = {
  storyTimestamp: {
    chapterId: 'chapter-2',
    sequence: 1,
    absoluteTime: '第10天晚上',
    narrativeType: 'linear'
  }
}

// 第二章: 插叙(回到过去)
paragraph3 = {
  storyTimestamp: {
    chapterId: 'chapter-2',
    sequence: 2,
    absoluteTime: '第5天中午',
    narrativeType: 'flashback',
    referenceParagraphId: 'paragraph-2-1',
    timeOffset: -5  // 倒推5天
  }
}

// 第三章: 多线并行
paragraph4 = {
  storyTimestamp: {
    chapterId: 'chapter-3',
    sequence: 1,
    absoluteTime: '第1天晚上',
    narrativeType: 'parallel'
  }
}
```

**状态查询逻辑**:
```javascript
class StateTimeline {
  // 获取某时间点的状态(支持插叙)
  getStateAtStoryTime(storyTime: StoryTimestamp, elementId: string): ElementState {
    // 1. 找到锚点段落(如果存在)
    const anchorParagraph = this.findParagraphByTime(storyTime);
    
    // 2. 应用时间偏移
    const effectiveTime = this.applyTimeOffset(anchorParagraph, storyTime);
    
    // 3. 查询该时间点的状态
    return this.getStateAt(effectiveTime.paragraphId, elementId);
  }
  
  // 获取当前叙事上下文(考虑插叙)
  getNarrativeContext(paragraphId: string): NarrativeContext {
    const paragraph = this.getParagraph(paragraphId);
    
    if (paragraph.storyTimestamp.narrativeType === 'flashback') {
      // 插叙: 使用过去的状态
      return this.getStateAtStoryTime(paragraph.storyTimestamp);
    } else if (paragraph.storyTimestamp.narrativeType === 'flashforward') {
      // 预叙: 使用未来的状态
      return this.getStateAtStoryTime(paragraph.storyTimestamp);
    } else {
      // 顺序/并行叙事: 使用当前时间点
      return this.getCurrentContext(paragraphId);
    }
  }
}
```

### Decision 8: 时光回溯功能

**方案**: 提供只读的历史状态查询功能,支持查看任意时刻的故事状态

**理由**:
- ✅ 辅助创作决策(如"第5章时主角有什么武器?")
- ✅ 调试工具(排查状态不一致问题)
- ✅ 一致性检查(发现逻辑矛盾)
- ✅ AI 生成需要(插叙/回忆片段需要历史上下文)
- ✅ 实现成本低(已有完整的状态历史,只需添加查询方法)

**功能定义**:

**时光回溯** = **只读查询历史状态** (不是修改历史段落)

**使用场景**:
1. **创作决策**: "在第5章时,主角手里有什么武器?"
2. **状态追踪**: "这把剑在第3章时是谁的?"
3. **调试验证**: "为什么这个角色在第10章会突然出现在这里?"
4. **一致性检查**: "第8章说主角没有剑,但第10章又用了剑?"
5. **AI 上下文**: 生成插叙段落时,需要知道"那个时间点"的状态

**API 设计**:
```javascript
class StateTimeline {
  // 查询某段落时刻的元素状态
  getElementStateAt(paragraphId: string, elementId: string): ElementState;
  
  // 查询某段落时刻的完整故事上下文
  getCurrentContext(paragraphId: string): StoryContext;
  
  // 查询元素的状态变化历史
  getElementStateHistory(elementId: string): StateChange[];
  
  // 查询在某时刻哪些元素发生了变化
  getParagraphChanges(paragraphId: string): ElementChange[];
  
  // 查询元素的完整状态轨迹(所有段落的状态)
  getElementStateTrajectory(elementId: string): Array<{
    paragraphId: string;
    state: ElementState;
  }>;
}

class ElementManager {
  // 查询元素在某个时间点的状态
  getElementStateAtTime(paragraphId: string): ElementState;
  
  // 查询元素的状态变化历史
  getStateHistory(): StateChange[];
}
```

**使用示例**:
```javascript
// 场景1: 创作时查询历史
const equipment = stateTimeline.getElementStateAt('paragraph-5-20', 'character-hero');
// Output: { location: 'chapter-5', owner: 'character-hero', status: null }

// 场景2: 调试状态变化
const swordHistory = elementManager.getElement('item-sword').stateHistory;
const brokenChange = swordHistory.find(change => change.changes.status === '破损');
console.log(`剑在 ${brokenChange.paragraphId} 破损`);

// 场景3: 查询完整状态
const context = stateTimeline.getCurrentContext('paragraph-5-20');
console.log(context.presentElements);

// 场景4: 查询状态轨迹
const trajectory = stateTimeline.getElementStateTrajectory('item-sword');
// Output: [
//   { paragraphId: 'p1', state: { owner: null, location: null } },
//   { paragraphId: 'p5', state: { owner: 'hero', location: 'hero' } },
//   { paragraphId: 'p10', state: { owner: 'villain', location: 'villain' } }
// ]
```

### Decision 9: 数据模型迁移策略

**方案**: 不保留旧数据结构,直接迁移到新模型

**理由**:
- ✅ 避免双重维护两套数据结构
- ✅ 一次性迁移,长期维护成本低
- ✅ 新模型更清晰,减少混淆

**迁移步骤**:
```javascript
function migrateStory(oldStory: StoryData): NewStoryData {
  const newStory = {
    ...oldStory,
    // 移除旧字段
    characters: undefined,
    items: undefined,
    settings: undefined,

    // 添加新字段
    elements: [],

    // 保留其他字段
    chapters: oldStory.chapters
  };

  // 迁移角色 -> Element
  oldStory.characters.forEach(char => {
    newStory.elements.push({
      type: 'character',
      id: char.id,
      name: char.name,
      description: char.description,
      keywords: ['人物', char.name],
      location: null,
      stateHistory: char.heldItems.map(itemId => ({
        paragraphId: null,
        timestamp: new Date().toISOString(),
        changes: {
          owner: char.id
        }
      }))
    });
  });

  // 迁移道具 -> Element
  oldStory.items.forEach(item => {
    newStory.elements.push({
      type: 'item',
      id: item.id,
      name: item.name,
      description: item.description,
      keywords: ['道具', item.name],
      location: item.owner || null,
      stateHistory: []
    });
  });

  // 迁移设定 -> Element
  oldStory.settings.forEach(setting => {
    newStory.elements.push({
      type: setting.type === 'location' ? 'location' : 'base',
      id: setting.id,
      name: setting.name,
      description: setting.description,
      keywords: [setting.type === 'location' ? '地点' : '基础设定'],
      location: null,
      stateHistory: []
    });
  });

  return newStory;
}
```

## Risks / Trade-offs

### Risk 1: 状态历史数据量增长

**风险**: 随着故事增长,`stateHistory` 数组可能变得很大,影响性能

**缓解措施**:
- ✅ 压缩状态变化(只记录变化的字段)
- ✅ 定期清理冗余历史(保留最近 N 条关键变化)
- ✅ 使用 StateTimeline 索引加速查询

### Risk 2: 数据迁移失败

**风险**: 迁移过程中数据丢失或损坏

**缓解措施**:
- ✅ 迁移前自动备份原始数据
- ✅ 迁移后验证数据完整性
- ✅ 提供回滚机制(保留原始数据副本)

### Risk 3: "在场"判断逻辑复杂

**风险**: 多种规则组合可能导致边界情况难以处理

**缓解措施**:
- ✅ 单元测试覆盖所有规则组合
- ✅ 提供可视化工具显示"当前在场元素列表"
- ✅ 日志记录判断过程,便于调试

### Risk 4: AI Tools 调用失败

**风险**: AI 返回的状态变化无效,导致数据不一致

**缓解措施**:
- ✅ 严格的参数验证
- ✅ 事务性更新(失败时回滚)
- ✅ 用户确认机制(预览后再应用)

### Risk 5: 缓存一致性

**风险**: 缓存与实际数据不一致

**缓解措施**:
- ✅ 数据变化时自动刷新缓存
- ✅ 提供强制刷新 API
- ✅ 定期验证缓存有效性

### Risk 6: 非线性叙事的复杂性

**风险**: 倒序、插叙、多线叙事等结构增加状态查询复杂度

**缓解措施**:
- ✅ 明确 storyTimestamp 字段,支持时间点定位
- ✅ StateTimeline 提供叙事类型感知的查询方法
- ✅ 可视化工具显示段落时间线,帮助作者理解结构

### Risk 7: 时光回溯查询性能

**风险**: 频繁的历史状态查询可能影响性能

**缓解措施**:
- ✅ 使用 StateTimeline 索引加速查询
- ✅ 缓存常见时间点的状态
- ✅ 提供查询范围限制(如只查询最近 N 个段落)

## Migration Plan

### 阶段 1: 数据模型重构 (Days 1-2)

**Day 1: 创建 StoryElement 基类**
- [ ] 创建 `js/models/StoryElement.js`
- [ ] 实现子类(Character/Item/Location/Memory/Base)
- [ ] 添加 StoryTimestamp 接口
- [ ] 编写单元测试

**Day 2: 重构 state.js**
- [ ] 为 Paragraph 添加 storyTimestamp 字段
- [ ] 移除 `characters[]`, `items[]`, `settings[]`
- [ ] 添加 `elements[]` 数组
- [ ] 重构 CRUD 方法适配新模型
- [ ] 保持 API 向后兼容

### 阶段 2: 核心功能实现 (Days 3-5)

**Day 3: StateTimeline 和 StoryViewManager**
- [ ] 创建 `js/managers/StateTimeline.js`
- [ ] 创建 `js/managers/StoryViewManager.js`
- [ ] 实现"在场"判断逻辑
- [ ] 实现时光回溯查询方法
- [ ] 实现叙事类型感知的上下文查询
- [ ] 编写单元测试

**Day 4: StateContextCache 和 ContextBuilder**
- [ ] 创建 `js/managers/StateContextCache.js`
- [ ] 更新 `ContextBuilder.js` 集成新组件
- [ ] 实现纯规则驱动的上下文计算
- [ ] 支持非线性叙事的上下文构建
- [ ] 编写单元测试

**Day 5: 段落时间线索引**
- [ ] 实现 StoryTimestamp 索引
- [ ] 实现时间偏移计算
- [ ] 实现叙事类型识别
- [ ] 编写单元测试

### 阶段 3: AI Tools 集成 (Days 6-7)

**Day 6: AI Tools 实现**
- [ ] 实现 `addElement` tool
- [ ] 实现 `updateElementLocation` tool
- [ ] 实现 `updateElementDescription` tool
- [ ] 编写单元测试

**Day 7: AIManager 集成**
- [ ] 注册新 tools
- [ ] 更新 prompt 构建逻辑(使用 StateContext)
- [ ] 实现"预览-确认"流程
- [ ] 集成测试

### 阶段 4: 数据迁移和测试 (Days 8-10)

**Day 8: 数据迁移**
- [ ] 创建 `js/utils/migration.js`
- [ ] 实现迁移逻辑
- [ ] 迁移 storyTimestamp(为现有段落设置默认值)
- [ ] 编写迁移测试

**Day 9: 时光回溯功能测试**
- [ ] 测试历史状态查询
- [ ] 测试状态轨迹追踪
- [ ] 测试非线性叙事上下文
- [ ] 性能测试(大量历史数据)

**Day 10: 集成测试和验证**
- [ ] 端到端测试
- [ ] 性能测试
- [ ] 用户验收测试

### Rollback Strategy

如果新系统出现严重问题:
1. 保留原始数据结构(`characters[]`, `items[]`, `settings[]`)
2. 提供开关回退到旧系统
3. 回退到迁移前的状态(自动备份)

## Open Questions

### Q1: "被遗忘"物品的追忆事件如何表示?

**问题**: 当用户想要"追忆"被遗忘物品时,是否需要特殊的事件类型?

**选项**:
- A. **需要**: 新增 `RecallEvent` 事件类型
- B. **不需要**: 临时添加"在场"关键字

**建议**: 推荐 A,因为:
- 语义清晰
- 易于追踪"谁在追忆"
- 支持多个追忆事件

### Q2: 多视角故事如何处理?

**问题**: 如果故事中有多个视角(如"第一章:主角视角","第二章:反派视角"),如何支持?

**选项**:
- A. **不支持**: 只支持单一视角(当前方案)
- B. **支持**: 允许 `StoryViewManager` 记录每个段落的视角

**建议**: 暂不支持,未来可以扩展(因为当前需求不明确)

### Q3: 状态历史是否需要压缩?

**问题**: 随着故事增长,`stateHistory` 数组可能很大,是否需要压缩?

**选项**:
- A. **需要**: 只保留关键状态变化(如破损、丢弃)
- B. **不需要**: 保留所有历史(方便调试)

**建议**: 推荐 B,因为:
- 存储成本低(每个变化 < 1KB)
- 调试价值高
- 未来可以按需压缩(软逻辑)

### Q4: 段落时间线是否需要可视化工具?

**问题**: 是否需要提供可视化工具显示段落时间线,帮助作者理解倒序/插叙结构?

**选项**:
- A. **需要**: 开发时间线可视化组件
- B. **不需要**: 仅通过文本显示 storyTimestamp

**建议**: 暂不需要,因为:
- 可以先通过文本形式显示
- 未来根据用户反馈决定是否开发可视化
- 优先保证核心功能完整

### Q5: 时光回溯查询是否需要权限控制?

**问题**: 时光回溯功能是否需要访问控制(如只允许作者查看)?

**选项**:
- A. **需要**: 添加权限控制逻辑
- B. **不需要**: 任何用户都可以查看

**建议**: 暂不需要,因为:
- 当前是单用户应用
- 时光回溯是只读功能,无安全风险
- 未来如果有协作功能再考虑
