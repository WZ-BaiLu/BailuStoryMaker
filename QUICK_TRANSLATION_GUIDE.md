# 添加翻译的快速指南

## ⚡ 快速开始

每当你在代码中添加新的翻译键时，执行以下步骤：

### 1️⃣ 在代码中使用翻译键

```javascript
// ❌ 不要这样做
this.notificationManager.showSuccess('操作成功');

// ✅ 应该这样做
this.notificationManager.showSuccess(i18n.t('messages.success'));
```

### 2️⃣ 记录到 TRANSLATION_KEYS.md

打开 `TRANSLATION_KEYS.md`，在相应部分添加：
- 翻译键名
- 中文含义
- 英文翻译（如果已确定）

### 3️⃣ 运行检查脚本

```bash
# 检查翻译键完整性
npm run check:translations
```

### 4️⃣ 添加缺失的翻译

根据检查脚本的结果，在以下文件中添加翻译：
- `js/modules/I18nManager.js` - 内嵌翻译（必需，支持 file:// 协议）
- `locales/zh-CN.json` - 中文翻译
- `locales/en-US.json` - 英文翻译

### 5️⃣ 验证

```bash
# 再次运行检查
npm run check:translations

# 运行测试
npm test
```

---

## 📋 检查清单

每次添加新功能时，检查以下项目：

- [ ] 所有按钮文本都使用 `i18n.t()`
- [ ] 所有提示消息都使用 `i18n.t()`
- [ ] 所有错误消息都使用 `i18n.t()`
- [ ] 所有成功消息都使用 `i18n.t()`
- [ ] TRANSLATION_KEYS.md 已更新
- [ ] I18nManager.js 已更新（内嵌翻译）
- [ ] locales/zh-CN.json 已更新
- [ ] locales/en-US.json 已更新
- [ ] `npm run check:translations` 通过
- [ ] `npm test` 通过

---

## 🔧 常用翻译键位置

### 按钮文本
- `buttons.newStory`, `buttons.save`, `buttons.cancel` 等

### 提示消息
- `messages.saveSuccess`, `messages.error` 等

### AI 相关
- `ai.title`, `ai.loading`, `ai.error` 等

### 故事相关
- `story.chapters`, `story.title` 等

### 角色相关
- `character.list`, `character.details` 等

---

## 💡 最佳实践

1. **命名规范**
   - 使用点号分隔的键名
   - 例如: `ai.paragraphAnalysis.success`
   - 保持一致性：相同的模块前缀

2. **参数化文本**
   ```javascript
   // ❌ 不推荐
   i18n.t('message').replace('{count}', count)
   
   // ✅ 推荐（如果支持）
   i18n.t('message', { count })
   ```

3. **避免硬编码**
   ```javascript
   // ❌ 不推荐
   console.log('分析中...');
   
   // ✅ 推荐
   console.log(i18n.t('ai.loading'));
   ```

4. **及时更新文档**
   - 每次添加翻译键后立即更新 TRANSLATION_KEYS.md
   - 避免遗忘

---

## 🚨 常见错误

### 错误 1: 忘记添加到所有文件

**问题**: 只添加到 locales/zh-CN.json，忘记其他文件

**解决**: 同时添加到以下三个文件
1. `js/modules/I18nManager.js` (必需！)
2. `locales/zh-CN.json`
3. `locales/en-US.json`

### 错误 2: 键名拼写错误

**问题**: 
```javascript
// 代码中
i18n.t('ai.paragraphAnalysis.success')

// JSON 文件中
"paragraphAnalysis": {
  "succes": "成功"  // 拼写错误
}
```

**解决**: 确保键名完全一致

### 错误 3: 遗漏内嵌翻译

**问题**: 只更新了 locales/*.json，忘记 I18nManager.js

**解决**: 必须在 `I18nManager.js` 的 `loadEmbeddedTranslations()` 方法中添加
- 这对于 file:// 协议（本地打开 HTML）至关重要
- 外部 JSON 在 file:// 协议下无法加载

### 错误 4: 只添加一种语言

**问题**: 只添加了中文，忘记英文

**解决**: 始终同时添加中英文翻译

---

## 📞 需要帮助？

如果遇到翻译问题：
1. 查看 `TRANSLATION_KEYS.md` 了解现有翻译键
2. 运行 `npm run check:translations` 检查一致性
3. 参考现有翻译的命名规范

---

**最后更新**: 2026-02-21
