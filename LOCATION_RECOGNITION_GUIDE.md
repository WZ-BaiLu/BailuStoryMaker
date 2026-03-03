# 地点识别增强功能使用指南

## 概述

本次更新大幅增强了段落分析的地点识别能力，使 AI 能够更准确地识别和追踪故事中的地点信息。

## 主要改进

### 1. 增强的 AI 提示词

- **优先识别地点**：要求 AI 首先识别当前场景地点
- **详细的地点识别指南**：提供多种地点描述模式的识别方法
- **明确的处理流程**：检查 → 创建 → 更新 的三步流程

### 2. 新增 LocationRecognizer 模块

专用的地点识别工具，提供：
- 智能地点提取
- 置信度评分
- 地点名称标准化
- 相似地点匹配

### 3. 新增 AI 工具：getContextInfo

允许 AI 查询当前上下文，包括：
- 当前所在地
- 所有已存在的地点列表
- 当前地点的元素

### 4. 改进的地点提取算法

- 多模式匹配
- 武侠小说特有地点库
- 关键词识别
- 上下文关联

## 使用方法

### 基本使用

地点识别功能已集成到段落分析中，自动运行：

```javascript
const paragraph = {
    id: 'paragraph-1',
    content: '张无忌来到光明顶，看到了远处的山峰。'
};

const context = {
    chapterId: 'chapter-1'
};

const result = await aiManager.paragraphAnalyzer.analyzeParagraph(paragraph, context);

// AI 会自动：
// 1. 识别到 "光明顶" 是当前地点
// 2. 检查 "光明顶" 是否已存在
// 3. 如果不存在，创建地点元素
// 4. 更新张无忌的位置到光明顶
```

### 单独使用 LocationRecognizer

```javascript
import LocationRecognizer from './modules/LocationRecognizer.js';

const recognizer = new LocationRecognizer();

// 识别地点
const content = '赵敏从武当山来到少林寺，然后在少林寺的大殿里见到了众人。';
const results = recognizer.recognizeLocations(content, {
    maxResults: 10,
    minConfidence: 0.3,
    existingLocations: ['光明顶', '峨眉山']
});

console.log(results);
// [
//   { location: '武当山', confidence: 0.95, source: 'movement', ... },
//   { location: '少林寺', confidence: 0.95, source: 'movement', ... },
//   { location: '大殿', confidence: 0.85, source: 'position', ... }
// ]

// 检查地点是否相似
const isSimilar = recognizer.isSimilarLocation('武当山大殿', '武当山');
// true

// 标准化地点名称
const normalized = recognizer.normalizeLocation('光明顶山上', ['光明顶', '武当山']);
// '光明顶'

// 格式化识别结果
const formatted = recognizer.formatResults(results);
console.log(formatted);
```

## 地点识别模式

### 支持的地点描述模式

#### 1. 移动动作模式
```
"张无忌来到光明顶" → 地点：光明顶
"赵敏走进大殿" → 地点：大殿
"他登上山峰" → 地点：山峰
```

#### 2. 位置介词模式
```
"他在大殿里" → 地点：大殿
"两人位于山顶" → 地点：山顶
"站在桥头" → 地点：桥头
```

#### 3. 环境描述模式
```
"走在山道上" → 地点：山道
"来到洞窟前" → 地点：洞窟
"在竹林边" → 地点：竹林
```

#### 4. 地名/建筑名模式
```
"来到武当山" → 地点：武当山
"进入少林寺" → 地点：少林寺
"登上光明顶" → 地点：光明顶
```

### 武侠小说特有地点

系统内置了武侠小说常见地点库，包括：

**门派地点：**
- 武当山、少林寺、峨眉山、昆仑派、崆峒派
- 华山派、青城派、泰山派、衡山派、嵩山派
- 丐帮、明教、魔教、日月神教、全真教
- 古墓派、桃花岛、白驼山、逍遥派、星宿派

**著名山峰：**
- 光明顶、华山、嵩山、泰山、衡山、恒山
- 武当山、峨眉山、崆峒山、青城山、天台山

**建筑设施：**
- 聚贤庄、绿柳山庄、蝴蝶谷、万安寺、绝情谷
- 大殿、偏殿、厢房、密室、藏经阁

**自然景观：**
- 桃花岛、断肠崖、绝情谷、寒潭、冰火岛
- 灵蛇岛、黑木崖、梅庄、荒岛、密林

## 配置选项

### recognizeLocations 选项

```javascript
recognizer.recognizeLocations(content, {
    maxResults: 5,        // 最大返回结果数
    minConfidence: 0.3,   // 最小置信度阈值
    existingLocations: []  // 已存在的地点列表
});
```

### 置信度计算

置信度基于以下因素：
1. **模式优先级**：移动动作模式得分最高
2. **关键词匹配**：包含明确地点关键词提高得分
3. **武侠地点**：武侠小说常见地点提高得分
4. **名称长度**：2-6字的地点名称更可信

## AI 工具使用

### getContextInfo 工具

```javascript
// AI 可以调用此工具获取上下文
{
    "name": "getContextInfo",
    "arguments": {
        "chapterId": "chapter-1",
        "paragraphId": "paragraph-5"
    }
}

// 返回结果
{
    "success": true,
    "data": {
        "currentLocation": "光明顶",
        "locations": ["武当山", "少林寺", "光明顶", "峨眉山"],
        "elementsAtLocation": [
            { "id": "char-1", "name": "张无忌", "type": "character" },
            { "id": "char-2", "name": "赵敏", "type": "character" }
        ],
        "totalLocations": 4
    }
}
```

## 示例场景

### 场景 1：首次识别地点

**段落内容：**
```
张无忌来到光明顶，看到远处有一座山峰。
```

**AI 处理流程：**
1. 识别到 "光明顶" 是当前地点（移动动作模式）
2. 检查已存在的地点列表，发现 "光明顶" 不存在
3. 调用 `addElement` 创建 "光明顶" 地点
4. 调用 `updateElementLocation` 设置张无忌的位置

**结果：**
- 创建新地点：光明顶
- 更新元素位置：张无忌 → 光明顶

### 场景 2：使用现有地点

**段落内容：**
```
赵敏在大殿里走来走去。
```

**AI 处理流程：**
1. 识别到 "大殿" 是当前地点（位置介词模式）
2. 检查已存在的地点列表，发现 "大殿" 已存在
3. 直接调用 `updateElementLocation` 设置赵敏的位置

**结果：**
- 不创建新地点（使用现有地点）
- 更新元素位置：赵敏 → 大殿

### 场景 3：多个地点

**段落内容：**
```
赵敏从武当山来到少林寺，然后在少林寺的大殿里见到了众人。
```

**AI 处理流程：**
1. 识别到 "武当山"（移动起点）
2. 识别到 "少林寺"（移动终点，当前地点）
3. 识别到 "大殿"（子地点）
4. 检查地点是否存在，创建或使用
5. 更新赵敏的位置

**结果：**
- 可能创建：武当山、少林寺、大殿（取决于是否已存在）
- 更新元素位置：赵敏 → 少林寺（最终位置）

## 最佳实践

### 1. 保持地点一致性

- 使用地点名称标准化功能
- 避免创建相似的不同地点（如 "武当山" 和 "武当山上"）
- 定期检查和合并重复地点

### 2. 提供明确的地名

- 在段落中使用明确的地名而非模糊描述
- 例如："来到光明顶" 比 "来到山上" 更准确

### 3. 利用上下文

- LocationRecognizer 会考虑已存在的地点
- AI 会优先使用现有地点，避免重复创建

### 4. 检查识别结果

```javascript
const results = recognizer.recognizeLocations(content);
console.log(recognizer.formatResults(results));

// 手动审核 AI 的地点识别是否正确
```

## 故障排除

### 问题 1：地点识别不准确

**解决方案：**
- 调整 `minConfidence` 阈值
- 检查段落中的地点描述是否明确
- 手动创建地点并添加到 `existingLocations`

### 问题 2：创建了重复的地点

**解决方案：**
- 使用 `normalizeLocation` 标准化地点名称
- 使用 `isSimilarLocation` 检查相似地点
- 在段落中使用一致的地点名称

### 问题 3：AI 未识别到地点

**解决方案：**
- 使用更明确的地点描述动词
- 提供完整的地名而非简写
- 检查地点是否在武侠地点库中，或手动添加

## 性能考虑

- LocationRecognizer 使用正则表达式匹配，性能良好
- 批量分析时，缓存已识别的地点
- 合理设置 `maxResults` 限制结果数量

## 测试

运行单元测试：

```bash
npm test -- tests/modules/LocationRecognizer.test.js
```

测试覆盖：
- 地点识别
- 置信度计算
- 地点标准化
- 相似地点匹配

## 未来扩展

计划中的功能：
- [ ] 支持地点层级关系（如：武当山 → 大殿）
- [ ] 地点历史追踪
- [ ] 地点可视化地图
- [ ] 自定义地点库
- [ ] 地点搜索和过滤

## 相关文件

- `js/modules/LocationRecognizer.js` - 地点识别核心模块
- `js/modules/ParagraphAnalyzer.js` - 段落分析（已集成地点识别）
- `js/managers/AIElementTools.js` - AI 工具（包含 getContextInfo）
- `tests/modules/LocationRecognizer.test.js` - 单元测试

## 反馈

如有问题或建议，请提交 Issue 或 Pull Request。
