# 地点识别功能重构 - 简洁总结

## 核心改进

采用**工具优先**设计，让 LLM 通过工具调用来完成分析，而不是硬编码规则。

## 新增功能

### 1. listElements 工具

**功能**：查询指定类型的已存在元素

**参数**：
- `types`: 元素类型数组，如 `["locations", "characters"]`

**返回**：
```json
{
  "success": true,
  "data": {
    "elements": [...],
    "byType": {
      "locations": ["光明顶", "武当山"],
      "characters": ["张无忌", "赵敏"]
    },
    "total": 4
  }
}
```

### 2. 重构的 AI 提示词

**新的分析流程**：

1. **识别段落中的元素** - 人物、地点、道具等
2. **使用 listElements 查询已存在的元素** - 避免重复创建
3. **创建新元素（如果需要）** - 使用 addElement
4. **设置元素位置** - 使用 updateElementLocation

**示例**：

分析"张无忌来到光明顶"：
```
1. listElements(types: ["locations"])  // 查询地点
2. addElement(type: "location", name: "光明顶", ...)
3. updateElementLocation(elementId: "张无忌", location: "光明顶")
```

## 优势

| 之前（硬编码） | 现在（工具优先） |
|---------------|----------------|
| 规则死板 | LLM 自行判断 |
| 维护成本高 | 代码简单 |
| 覆盖场景有限 | 灵活适应 |
| 过度设计 | 易于扩展 |

## 文件变更

1. **js/modules/ParagraphAnalyzer.js**
   - 重写 AI 提示词
   - 移除 LocationRecognizer 集成
   - 添加 listElements 工具处理

2. **js/managers/AIElementTools.js**
   - 新增 listElements 工具
   - 更新工具定义

## 使用方式

```javascript
const paragraph = {
    id: 'paragraph-1',
    content: '张无忌来到光明顶，看到远处的山峰。'
};

const result = await aiManager.paragraphAnalyzer.analyzeParagraph(paragraph, {
    chapterId: 'chapter-1'
});

// AI 自动：
// 1. 调用 listElements 查询地点
// 2. 根据查询结果创建或使用地点
// 3. 设置角色位置关系
```

## 总结

✅ 新增 `listElements` 工具  
✅ 重写 AI 提示词（工具优先）  
✅ 简化代码（移除硬编码规则）  
✅ 提高灵活性（LLM 自行判断）  
✅ 无 lint 错误
