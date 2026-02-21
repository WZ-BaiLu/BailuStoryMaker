## MODIFIED Requirements

### Requirement: AAR-13: Error Display in Chat
AI 请求失败时在聊天区域显示错误消息
- 网络错误：显示 "网络连接失败，请检查网络"
- API 错误：显示具体错误消息和可操作的建议
- 可重试的错误显示"重试"按钮
- **工具调用错误**：当 AI 工具参数验证失败时，显示具体错误信息（如 "角色 ID 不存在"、"道具 ID 无效"）

### Requirement: AI Assistant Tool Registration
系统应支持为 AI 助手注册和使用工具函数。

#### Scenario: Register character state update tool
- **WHEN** system initializes AIManager
- **THEN** `updateCharacterState` tool is registered with the AI service
- **AND** tool is available for AI to invoke during conversations

#### Scenario: Register item state update tool
- **WHEN** system initializes AIManager
- **THEN** `updateItemState` tool is registered with the AI service
- **AND** tool is available for AI to invoke during conversations

#### Scenario: AI invokes character state tool
- **WHEN** AI decides to update character state based on story content
- **THEN** AI invokes `updateCharacterState` tool with appropriate parameters
- **AND** system processes the tool call and updates the state

#### Scenario: AI invokes item state tool
- **WHEN** AI decides to update item state based on story content
- **THEN** AI invokes `updateItemState` tool with appropriate parameters
- **AND** system processes the tool call and updates the state

## API

```javascript
class AIManager {
    // ... existing methods ...

    // NEW: Tool registration
    registerTool(name: string, parameters: object, handler: function): void;

    // NEW: Character state update handler
    updateCharacterState(characterId: string, changes: object, paragraphId: string): Promise<object>;

    // NEW: Item state update handler
    updateItemState(itemId: string, action: string, characterId: string, location: string, paragraphId: string): Promise<object>;
}
```

## Data Models

```typescript
// NEW: Character state change model
interface CharacterStateChange {
    characterId: string;
    changes: {
        attributes?: Record<string, string>;  // e.g., { "health": "+10" }
        emotionalState?: string;            // e.g., "happy", "sad"
    };
    paragraphId: string;
}

// NEW: Item state change model
interface ItemStateChange {
    itemId: string;
    action: 'acquire' | 'lose' | 'transfer' | 'modify';
    characterId?: string;
    location?: string;
    paragraphId: string;
}

// NEW: Tool parameter model
interface ToolParameters {
    characterId: string;
    changes?: object;
    itemId?: string;
    action?: string;
    location?: string;
    paragraphId?: string;
}
```
