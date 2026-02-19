## Why

随着AI技术在开发者工具中的普及，用户期望在故事编辑器中获得AI辅助功能来提升创作效率。当前编辑器缺乏AI集成功能，无法为用户提供智能写作建议、内容生成、故事优化等现代编辑器必备的AI能力。在章节编辑界面集成AI助手，可以为用户提供实时的创作辅助，改善用户体验并提升创作效率。

## What Changes

- 在章节编辑界面右侧新增AI助手面板
- 添加AI服务配置管理功能（API Key、端点配置等）
- 实现与AI服务的HTTP通信接口
- 添加AI对话历史记录和会话管理
- 提供快捷的AI操作按钮（续写、优化、总结等）
- 支持AI生成内容插入到编辑器
- 添加AI响应的加载状态和错误处理
- 实现AI配置的持久化存储

## Capabilities

### New Capabilities
- `ai-assistant`: AI助手界面交互功能，包括聊天对话、快捷操作、响应展示等UI交互
- `ai-service`: AI服务集成功能，包括API调用、请求构建、响应处理、错误处理等后端逻辑
- `ai-config`: AI配置管理功能，包括API配置、模型选择、参数设置等配置项

### Modified Capabilities
- `view-management`: 扩展现有视图管理能力，支持AI面板的显示/隐藏和持久化

## Impact

**新增代码文件：**
- `js/managers/AIManager.js` - AI助手核心管理器
- `js/services/AIService.js` - AI服务通信类
- `js/managers/AIConfigManager.js` - AI配置管理器
- `css/ai-assistant.css` - AI助手面板样式
- `tests/managers/AIManager.test.js` - AIManager单元测试
- `tests/services/AIService.test.js` - AIService单元测试

**修改代码文件：**
- `index.html` - 添加AI助手面板HTML结构
- `js/app.js` - 注册AI管理器和相关事件
- `js/managers/ViewManager.js` - 扩展视图管理支持AI面板
- `css/style.css` - 整合AI助手样式

**依赖项：**
- 无新增外部依赖（使用浏览器原生fetch API）
- 需要用户提供AI服务的API Key（如OpenAI、Anthropic等）

**数据存储：**
- localStorage存储AI配置和对话历史
- 新增配置项：`ai.apiKey`, `ai.model`, `ai.endpoint`, `ai.history`

**API集成：**
- 支持OpenAI兼容的API接口
- 支持自定义端点配置
