# 翻译键管理清单

## 🔔 规则

**每次在代码中添加新的翻译键时，必须：**

1. 在此文档中记录
2. 添加到 `js/modules/I18nManager.js` 的内嵌翻译（中文和英文）
3. 添加到 `locales/zh-CN.json`
4. 添加到 `locales/en-US.json`

**禁止添加任何没有对应翻译的文本键！**

---

## 📝 翻译键清单

### 最近的更新 (2026-02)

#### ai.paragraphAnalysis.* (段落分析功能)
- ✅ `ai.paragraphAnalysis.loading` - "AI正在分析段落..."
- ✅ `ai.paragraphAnalysis.success` - "段落分析完成"
- ✅ `ai.paragraphAnalysis.error` - "段落分析失败"
- ✅ `ai.paragraphAnalysis.noStory` - "没有加载的故事"
- ✅ `ai.paragraphAnalysis.noChapter` - "没有选择的章节"
- ✅ `ai.paragraphAnalysis.noParagraph` - "找不到段落"
- ✅ `ai.paragraphAnalysis.emptyContent` - "段落内容为空，无法分析"
- ✅ `ai.paragraphAnalysis.applying` - "正在应用分析结果..."
- ✅ `ai.paragraphAnalysis.applied` - "分析结果已应用"
- ✅ `ai.paragraphAnalysis.applyError` - "应用分析结果失败"
- ✅ `ai.paragraphAnalysis.analyzeButton` - "AI分析段落"
- ✅ `ai.paragraphAnalysis.resultTitle` - "📊 段落分析结果"
- ✅ `ai.paragraphAnalysis.originalText` - "📝 原文"
- ✅ `ai.paragraphAnalysis.elementsFound` - "🎭 发现的元素"
- ✅ `ai.paragraphAnalysis.eventsIdentified` - "⚡ 识别的事件"
- ✅ `ai.paragraphAnalysis.stateChanges` - "🔄 状态变化"
- ✅ `ai.paragraphAnalysis.summary` - "摘要"
- ✅ `ai.paragraphAnalysis.applyButton` - "应用分析结果"
- ✅ `ai.paragraphAnalysis.cancelButton` - "取消"
- ✅ `ai.paragraphAnalysis.elementNew` - "新增"
- ✅ `ai.paragraphAnalysis.elementExisting` - "已存在"

#### story.* (故事视图)
- ✅ `story.viewLocation` - "当前视角位置:"
- ✅ `story.viewLocationAny` - "全知视角"
- ✅ `story.presentElements` - "在场元素: "

#### timeline.* (时间线)
- ✅ `timeline.noCharactersInParagraph` - "此段落中无角色"
- ✅ `timeline.noItemsInParagraph` - "此段落中无道具"

---

## 📅 添加新翻译键的步骤

### Step 1: 在代码中添加翻译键
```javascript
// ❌ 错误：直接使用硬编码文本
this.notificationManager.showSuccess('段落分析完成');

// ✅ 正确：使用翻译键
this.notificationManager.showSuccess(i18n.t('ai.paragraphAnalysis.success'));
```

### Step 2: 更新此文档
在上方清单中添加新的翻译键，标记为 ⏳ 待完成

### Step 3: 添加到 I18nManager.js (内嵌翻译)
```javascript
// 在 zh-CN 部分添加
"ai": {
  "paragraphAnalysis": {
    "newKey": "中文翻译"
  }
}

// 在 en-US 部分添加
"ai": {
  "paragraphAnalysis": {
    "newKey": "English translation"
  }
}
```

### Step 4: 添加到 locales/zh-CN.json
```json
{
  "ai": {
    "paragraphAnalysis": {
      "newKey": "中文翻译"
    }
  }
}
```

### Step 5: 添加到 locales/en-US.json
```json
{
  "ai": {
    "paragraphAnalysis": {
      "newKey": "English translation"
    }
  }
}
```

### Step 6: 验证
```bash
# 检查 JSON 语法
node -c locales/zh-CN.json
node -c locales/en-US.json

# 运行测试
npm test
```

### Step 7: 更新此文档
将 ⏳ 待完成改为 ✅ 已完成

---

## 🔍 检查清单

添加新功能时，检查以下位置是否需要翻译：

- [ ] 按钮文本
- [ ] 提示消息
- [ ] 错误消息
- [ ] 成功消息
- [ ] 警告消息
- [ ] 占位符文本
- [ ] 标题和标签
- [ ] 模态框文本
- [ ] 工具提示
- [ ] 表单标签
- [ ] 状态文本
- [ ] 总结文本
- [ ] 确认对话框

---

## 🚨 常见错误

### 错误 1: 忘记添加翻译
```javascript
// ❌ 错误
notification.showSuccess('操作成功');

// ✅ 正确
notification.showSuccess(i18n.t('messages.success'));
```

### 错误 2: 只添加中文，忘记英文
```javascript
// ❌ 错误
// 只在 zh-CN.json 中添加，忘记 en-US.json

// ✅ 正确
// 同时在 zh-CN.json 和 en-US.json 中添加
```

### 错误 3: 忘记内嵌翻译
```javascript
// ❌ 错误
// 只在 locales/*.json 中添加，忘记 I18nManager.js

// ✅ 正确
// 在 I18nManager.js 的 loadEmbeddedTranslations() 中添加
```

### 错误 4: 翻译键名不一致
```javascript
// ❌ 错误
// zh-CN.json: "ai.success"
// en-US.json: "ai.operationSuccess"

// ✅ 正确
// zh-CN.json: "ai.success"
// en-US.json: "ai.success"
```

---

## 📊 统计

- **总翻译键数**: 约 200+ (需要统计)
- **最近添加**: 25 个 (2026-02 段落分析功能)
- **待添加**: 0

---

## 🔄 自动化建议

### 未来可以添加的自动化检查：

1. **翻译键完整性检查脚本**
   - 检查 zh-CN.json 和 en-US.json 的键是否一致
   - 检查内嵌翻译和外部翻译是否一致

2. **Git Hook**
   - 提交前检查是否有未翻译的键

3. **测试覆盖**
   - 自动测试所有翻译键是否存在

4. **文档同步**
   - 自动从代码中提取翻译键

---

## 📞 联系

如果在添加翻译时遇到问题，请：
1. 查看本文档
2. 查看现有翻译键的命名规范
3. 遵循一致的翻译风格

---

**最后更新**: 2026-02-21
**维护者**: AI Assistant
