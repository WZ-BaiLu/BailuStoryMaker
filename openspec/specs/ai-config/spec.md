# AI Configuration Specification

## Purpose
管理 AI 服务配置，包括提供商选择、API 密钥、端点、模型等配置的存储、加载和验证。

## Requirements

### AIC-1: Store AI Configuration
- 配置应存储到 localStorage，键名为 "ai.config"
- API 密钥应使用 Base64 编码后存储，不保存明文
- 配置包含：provider, apiKey, endpoint, model, temperature, maxTokens, historyLimit, panelWidth, panelCollapsed

### AIC-2: Load AI Configuration
- 应用初始化时从 localStorage 加载配置
- 加载时解码 API 密钥
- 无配置时使用默认值并显示警告指示器

### AIC-3: Provider Selection
- 支持的提供商：OpenAI, Anthropic, DeepSeek, Grok, Custom
- 选择提供商时应预填充默认端点和模型
- Custom 提供商需要用户手动输入端点

### AIC-4: API Key Management
- API 密钥输入字段应显示为密码类型
- 提供显示/隐藏 API 密钥的切换按钮
- 保存时验证 API 密钥不能为空

### AIC-5: Endpoint Configuration
- Custom 提供商需要用户提供端点 URL
- 验证端点 URL 格式（HTTP/HTTPS）
- 标准提供商（OpenAI、Anthropic、DeepSeek、Grok）隐藏端点字段并使用默认值

### AIC-6: Model Configuration
- 允许用户配置模型名称
- 验证模型名称不能为空
- 根据提供商提供常见模型建议

### AIC-7: Temperature Configuration
- 温度范围：0.0 - 2.0，默认值 0.7
- 滑块调整时实时显示当前值
- 0.0 表示更确定，2.0 表示更随机

### AIC-8: Max Tokens Configuration
- 最大 token 数：1 - 8000，默认值 2000
- 对于 DeepSeek 提供商限制为 8192
- 只显示建议范围 (1000-32000)，不强制上限

### AIC-9: History Limit Configuration
- 历史记录限制：5 - 100，默认值 20
- 保存时只保留最近的 N 条消息

### AIC-10: Panel State Configuration
- 保存面板宽度（默认 300）和折叠状态（默认 false）
- 加载时恢复保存的状态

### AIC-11: Configuration Validation
- 保存前验证所有必填字段：provider, apiKey, model
- 验证参数范围：temperature (0-2), maxTokens (1-8000), historyLimit (5-100)
- Custom 提供商验证端点 URL 格式

### AIC-12: Test Connection
- 提供测试连接功能，使用表单当前值（未保存）
- 成功显示成功消息，失败显示错误详情

### AIC-13: Reset to Default Configuration
- 提供重置为默认值功能，重置前显示确认对话框
- 默认配置：provider=openai, endpoint=https://api.openai.com/v1/chat/completions, model=gpt-3.5-turbo, temperature=0.7, maxTokens=2000, historyLimit=20, panelWidth=300, panelCollapsed=false

### AIC-14: Clear API Key
- 提供清除 API 密钥功能
- 清除后显示警告提示 API 密钥为必填项

### AIC-15: Configuration Change Notification
- 配置更改时通知相关组件
- 配置有效时移除设置按钮上的警告徽章
- 配置无效时显示警告徽章

## API

```javascript
class AIConfigManager {
    constructor();
    loadConfig(): object;
    saveConfig(config: object): boolean;
    validateConfig(config: object): { valid: boolean, errors: string[] };
    getDefaultConfig(): object;
    encodeApiKey(apiKey: string): string;
    decodeApiKey(encodedKey: string): string;
    getConfig(): object;
    isConfigured(): boolean;
    onChange(callback: function): void;
    offChange(callback: function): void;
    resetToDefaults(): boolean;
    clearApiKey(): boolean;
}
```

## Data Models

```typescript
interface AIConfig {
    provider: 'openai' | 'anthropic' | 'deepseek' | 'grok' | 'custom';
    apiKey: string;
    endpoint?: string;
    model: string;
    temperature: number;
    maxTokens: number;
    historyLimit: number;
    panelWidth: number;
    panelCollapsed: boolean;
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
}
```

## Dependencies
- `localStorage`: 存储配置
- `btoa` / `atob`: Base64 编解码

## Security Considerations
- API 密钥必须编码后存储
- 导出配置时应排除 API 密钥
- 显示 API 密钥时默认隐藏
