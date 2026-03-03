# 地点识别增强功能 - 实现总结（重构版）

## 更新日期
2026-03-04

## 目标
加强段落分析功能，特别是当前地点的确定能力，使其能够更准确地识别和追踪故事中的地点信息。

## 设计原则

采用**工具优先**的设计理念，让 LLM 通过工具调用来完成分析，而不是硬编码规则：

1. **查询工具**：先使用 `listElements` 查询已存在的元素
2. **创建工具**：根据查询结果决定是否需要创建新元素
3. **设置工具**：使用 `updateElementLocation` 设置元素位置关系

这种设计的优势：
- **灵活性**：LLM 自行判断，不依赖预设规则
- **可扩展**：易于添加新的元素类型和属性
- **准确性**：基于实际数据查询，避免重复和错误
- **简洁性**：代码更简单，维护更容易

## 实现的功能

### 1. 新增 AI 工具：listElements (AIElementTools.js)

#### 功能：
查询指定类型的已存在元素，返回元素的详细信息。

#### 参数：
- `types`: 元素类型数组，如 `["locations", "characters"]`
  - 支持的类型：`characters`, `locations`, `items`, `memories`, `bases`

#### 返回结果：
```json
{
  "success": true,
  "data": {
    "elements": [
      {
        "id": "location-1",
        "type": "location",
        "name": "光明顶",
        "description": "明教总坛所在地"
      }
    ],
    "byType": {
      "locations": ["光明顶", "武当山"],
      "characters": ["张无忌", "赵敏"]
    },
    "total": 4
  }
}
```

#### 使用场景：
AI 在分析段落前，先查询已存在的元素，避免重复创建：
1. 查询所有地点，判断段落中的地点是否存在
2. 查询所有人物，判断段落中的人物是否存在
3. 根据查询结果决定是否需要创建新元素

### 2. 改进的 AI 提示词 (ParagraphAnalyzer.js)

#### 新的分析流程：

**第一步：识别段落中的元素**
- 识别段落中提到的人物、地点、道具、记忆、设定等元素
- 特别注意地点信息（当前场景发生的地方）

**第二步：使用工具查询已存在的元素**
- 使用 `listElements` 工具查询特定类型的元素
- 查询类型：characters, locations, items, memories, bases
- 根据查询结果判断哪些元素已存在，哪些需要创建

**第三步：创建新元素（如果需要）**
- 使用 `addElement` 工具创建段落中提到但不存在的新元素
- 元素类型：character（人物）、location（地点）、item（道具）、memory（记忆）、base（设定）

**第四步：设置元素位置**
- 使用 `updateElementLocation` 工具设置元素的位置
- 如果段落提到某人在某个地点，使用该工具设置关系

#### 关键要求：

1. **必须按顺序调用工具**：
   - 先调用 `listElements` 查询已存在的元素
   - 根据查询结果调用 `addElement` 创建新元素
   - 最后调用 `updateElementLocation` 设置位置

2. **所有工具调用必须在同一个响应中完成**：
   - 不要等待工具返回后再调用下一个
   - 一次性列出所有需要的工具调用

3. **避免重复创建元素**：
   - 通过 `listElements` 查询结果检查元素是否已存在
   - 已存在的元素直接使用，不要再创建

4. **`updateElementLocation` 支持使用名称**：
   - 可以使用元素名称而不是 ID
   - 系统会自动查找对应的元素

#### 示例工作流：

**示例 1：分析"张无忌来到光明顶"**（地点已存在）

```
工具调用顺序：
1. listElements(types: ["locations"])  
   返回：{ "locations": ["光明顶"] }

2. updateElementLocation(elementId: "张无忌", location: "光明顶")
```

**示例 2：分析"张无忌来到一座山"**（地点不存在）

```
工具调用顺序：
1. listElements(types: ["locations"])  
   返回：{ "locations": [] }

2. addElement(type: "location", name: "一座山", description: "地点", keywords: [])

3. updateElementLocation(elementId: "张无忌", location: "一座山")
```

**示例 3：分析"赵敏在大殿里看到周芷若"**（人物已存在，地点不存在）

```
工具调用顺序：
1. listElements(types: ["characters", "locations"])  
   返回：{ "characters": ["赵敏", "周芷若"], "locations": [] }

2. addElement(type: "location", name: "大殿", description: "建筑", keywords: ["大殿"])

3. updateElementLocation(elementId: "赵敏", location: "大殿")

4. updateElementLocation(elementId: "周芷若", location: "大殿")
```

**示例 4：分析"段誉来到峨眉山"**（人物和地点都不存在）

```
工具调用顺序：
1. listElements(types: ["characters", "locations"])  
   返回：{ "characters": [], "locations": [] }

2. addElement(type: "character", name: "段誉", description: "小说人物", keywords: [])

3. addElement(type: "location", name: "峨眉山", description: "峨眉山脉", keywords: ["山峰", "武林门派"])

4. updateElementLocation(elementId: "段誉", location: "峨眉山")
```

### 3. 保留的工具：getContextInfo (AIElementTools.js)

#### 功能：
查询当前上下文信息，包括：
- `currentLocation`: 当前所在地
- `locations`: 所有已存在的地点列表
- `elementsAtLocation`: 当前地点的元素（包含 id, name, type）
- `totalLocations`: 地点总数

#### 使用场景：
AI 可以在分析段落前先查询当前上下文，了解：
1. 当前在哪里
2. 已有哪些地点可以使用
3. 当前地点有哪些元素在场

这帮助 AI 做出更智能的地点决策。

### 4. 改进的提示词结构

新的提示词更简洁、更直接：

**System Message:**
- 清晰的分析流程（四步）
- 关键要求（按顺序调用、同一响应、避免重复）
- 详细的示例

**Assistant Message:**
- 当前故事背景（章节）
- 分析提示（使用工具）
- 已存在的元素（仅供参考，建议使用 `listElements` 查询）
- 前几个段落（上下文）

## 代码变更

### 修改的文件：

1. **js/modules/ParagraphAnalyzer.js**
   - 重写 AI 提示词（system 和 assistant message）
   - 移除 LocationRecognizer 集成
   - 简化 `getCurrentLocation` 方法
   - 更新工具映射（添加 `listElements`）
   - 添加 `listElements` 工具处理

2. **js/managers/AIElementTools.js**
   - 新增 `listElements` 工具
   - 更新工具定义（将 `listElements` 放在第一位）
   - 改进 `updateElementLocation` 描述（支持名称）

### 保留的文件（可选）：

1. **js/modules/LocationRecognizer.js** - 保留供其他用途使用
2. **tests/modules/LocationRecognizer.test.js** - 保留测试用例

如果未来需要更精确的地点提取规则，可以继续使用 LocationRecognizer。

## 优势对比

### 之前的方案（硬编码规则）

**优点：**
- 可预测性强
- 不依赖 AI 能力

**缺点：**
- 规则死板，难以覆盖所有场景
- 维护成本高（需要不断更新规则）
- 无法适应不同类型的小说
- 过度设计，代码复杂

### 现在的方案（工具优先）

**优点：**
- **灵活**：LLM 自行判断和决策
- **简单**：代码更简洁，易于维护
- **准确**：基于实际数据查询，避免重复
- **可扩展**：易于添加新功能
- **通用**：适用于各种类型的小说

**缺点：**
- 依赖 AI 能力
- 需要良好的提示词设计

## 使用示例

### 基本使用（自动集成）

```javascript
const paragraph = {
    id: 'paragraph-1',
    content: '张无忌来到光明顶，看到远处的山峰。'
};

const context = {
    chapterId: 'chapter-1'
};

const result = await aiManager.paragraphAnalyzer.analyzeParagraph(paragraph, context);

// AI 会自动：
// 1. 调用 listElements(types: ["locations"]) 查询地点
// 2. 如果光明顶不存在，调用 addElement 创建
// 3. 调用 updateElementLocation 设置张无忌的位置
```

### 查看工具调用

```javascript
// AI 工具调用会在控制台输出
// [ParagraphAnalyzer] Elements listed: { ... }
// [ParagraphAnalyzer] Tool executed: addElement { ... }
// [ParagraphAnalyzer] Tool executed: updateElementLocation { ... }
```

## 文档更新

1. **LOCATION_RECOGNITION_GUIDE.md** - 需要更新以反映新的工具优先设计
2. **USAGE_PARAGRAPH_ANALYSIS.md** - 需要更新示例
3. **本文档** - 新创建

## 未来扩展

基于工具优先的设计，可以轻松添加新功能：

1. **元素关系工具**：`setElementRelationship` - 设置元素之间的关系
2. **元素搜索工具**：`searchElements` - 按关键词搜索元素
3. **元素历史工具**：`getElementHistory` - 查询元素的历史变化
4. **批量操作工具**：`batchUpdate` - 批量更新多个元素
5. **地点层级工具**：`setLocationHierarchy` - 设置地点的层级关系

## 测试建议

1. **测试地点存在的情况**：确保 AI 正确识别已存在地点
2. **测试地点不存在的情况**：确保 AI 正确创建新地点
3. **测试多地点的情况**：确保 AI 正确处理多个地点
4. **测试人物和地点都不存在的情况**：确保 AI 正确创建所有元素
5. **测试工具调用顺序**：确保 AI 按正确顺序调用工具

## 总结

本次重构采用了**工具优先**的设计理念，让 LLM 通过工具调用来完成地点识别和元素管理，相比之前的硬编码规则方案：

1. **更简洁**：移除了复杂的 LocationRecognizer 集成
2. **更灵活**：LLM 自行判断，不依赖预设规则
3. **更准确**：基于实际数据查询，避免重复创建
4. **更易维护**：代码简单，易于扩展

核心改进：
- ✅ 新增 `listElements` 工具，让 AI 查询已存在元素
- ✅ 重写 AI 提示词，明确工具调用流程
- ✅ 改进示例，展示正确的工具使用方式
- ✅ 简化代码，移除不必要的规则

这种设计更符合 LLM 的使用方式，让 AI 通过工具来获取信息和执行操作，而不是预先定义所有规则。
