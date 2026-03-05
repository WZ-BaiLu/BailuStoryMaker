## Why

当前 AI 辅助功能的代码分散在多个模块中,存在功能重复和逻辑不统一的问题。主要问题包括:

1. **消息构建逻辑重复**: `AIService.js` 的 `addContextToMessages` 和 `AIManager.js` 的 `buildAIMessages` 存在重复功能
2. **请求预览不一致**: 现有功能缺乏统一的预览机制,用户无法在发送前确认请求内容
3. **上下文生成混乱**: 上下文信息(元素状态、章节内容)的生成逻辑分散,缺乏统一管理
4. **缺乏统一的特征**: 请求参数不一致,预览和实际发送的参数可能不同

这些问题导致代码维护困难,容易出错,用户体验不佳。

## What Changes

- **统一消息构建**: 创建统一的消息构建器,整合 `AIService.addContextToMessages` 和 `AIManager.buildAIMessages`
- **统一请求预览**: 为所有 AI 请求提供预览功能,确保预览和实际发送的参数完全一致
- **统一上下文管理**: 创建统一的上下文生成器,确保基于当前段落状态生成准确的元素和状态信息
- **分离生成和分析功能**: 将段落生成和段落分析功能明确分离,各自使用独立的工具和提示词

## Capabilities

### New Capabilities

- `unified-ai-messaging`: 统一的消息构建和上下文管理能力
- `ai-request-preview`: AI 请求预览功能
- `paragraph-generation`: 段落生成功能(独立的提示词和消息结构)
- `paragraph-analysis`: 段落分析功能(独立的提示词和工具调用)

### Modified Capabilities

- 无(这是全新的重构,不修改现有规格要求)

## Impact

**受影响的代码文件**:
- `js/services/AIService.js` - 移除 `addContextToMessages` 方法
- `js/managers/AIManager.js` - 简化 `buildAIMessages`,添加统一预览方法
- `js/managers/ParagraphGenerator.js` - 使用新的消息构建器
- `js/modules/ParagraphAnalyzer.js` - 使用新的消息构建器
- `js/managers/AIPreviewManager.js` - 集成到统一预览流程

**新增组件**:
- `js/modules/AIMessageBuilder.js` - 统一消息构建器
- `js/modules/AIRequestManager.js` - 统一请求管理器

**API 变化**:
- 所有 AI 调用将经过统一的预览流程
- 消息结构标准化,确保预览和实际发送完全一致

**用户体验改进**:
- 所有 AI 请求都有预览步骤
- 用户可以查看和确认请求参数(上下文、提示词、工具配置)
- 减少误操作,提高 AI 生成质量
