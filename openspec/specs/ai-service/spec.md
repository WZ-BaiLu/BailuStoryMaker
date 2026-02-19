# AI Service Specification

## Purpose
处理与 AI 提供商的通信，使用适配器模式支持多个提供商（OpenAI、Anthropic、DeepSeek、Grok、Custom）。

## Requirements

### AIS-1: Support Multiple AI Providers
- 使用适配器模式支持多个提供商
- 支持的提供商：OpenAI, Anthropic, DeepSeek, Grok, Custom
- 通过统一接口调用不同提供商

### AIS-2: Send Chat Completion Request
- 发送聊天完成请求到配置的 AI 提供商
- 包含用户消息、对话历史和上下文
- 支持自定义参数（temperature、maxTokens）

### AIS-3: Handle AI Response
- 解析成功的响应并提取内容
- 返回标准化的响应格式
- 处理错误响应并返回错误信息

### AIS-4: Validate AI Configuration
- 发送请求前验证配置
- 验证 API 密钥、端点格式、参数范围

### AIS-5: Test Connection
- 提供测试连接方法
- 发送简单测试请求验证配置

### AIS-6: Request Timeout
- 请求超时时间：30 秒
- 超时后取消请求并返回超时错误

### AIS-7: Error Handling
- 处理 401 未授权错误（API 密钥无效）
- 处理 429 速率限制错误
- 处理 5xx 服务器错误
- 处理网络错误

### AIS-8: Build Request for Providers
- OpenAI: 使用 chat completions 格式，Authorization: Bearer {apiKey}
- Anthropic: 使用 messages 格式，x-api-key: {apiKey}
- DeepSeek: 使用 OpenAI 兼容格式，限制 max_tokens 为 8192
- Grok: 使用 OpenAI 兼容格式
- Custom: 使用 OpenAI 兼容格式

### AIS-9: Parse Provider Responses
- OpenAI: 提取 response.choices[0].message.content
- Anthropic: 提取 response.content[0].text
- DeepSeek/Grok/Custom: 提取 response.choices[0].message.content

### AIS-10: Message History Management
- 在请求中包含最近的对话历史
- 根据配置限制消息数量（默认 20）
- 添加系统消息提供上下文

### AIS-11: Provider-Specific Configuration Validation
- OpenAI/Anthropic/DeepSeek/Grok: 验证 API 密钥和模型名称
- Custom: 验证 API 密钥、端点 URL 和模型名称

## API

```javascript
class AIService {
    constructor();
    chat(config: object, messages: Array, context?: object): Promise<object>;
    testConnection(config: object): Promise<object>;
    validateConfig(config: object): { valid: boolean, errors: string[] };
    getAdapter(provider: string): object;
    setTimeout(timeout: number): void;
    getTimeout(): number;
}

class OpenAIAdapter {
    getDefaultEndpoint(): string;
    buildRequest(config: object, messages: Array): object;
    parseResponse(response: Response): Promise<object>;
}

class AnthropicAdapter {
    getDefaultEndpoint(): string;
    buildRequest(config: object, messages: Array): object;
    parseResponse(response: Response): Promise<object>;
}

class DeepSeekAdapter {
    getDefaultEndpoint(): string;
    buildRequest(config: object, messages: Array): object;
    parseResponse(response: Response): Promise<object>;
}

class GrokAdapter {
    getDefaultEndpoint(): string;
    buildRequest(config: object, messages: Array): object;
    parseResponse(response: Response): Promise<object>;
}

class CustomAdapter {
    getDefaultEndpoint(): string; // throws error
    buildRequest(config: object, messages: Array): object;
    parseResponse(response: Response): Promise<object>;
}
```

## Data Models

```typescript
type Provider = 'openai' | 'anthropic' | 'deepseek' | 'grok' | 'custom';

interface ChatRequest {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
}

interface ChatResponse {
    content: string;
    usage?: object;
}

interface ErrorResponse {
    type: string;
    message: string;
    status?: number;
    retryable?: boolean;
}

interface ServiceResponse {
    success: boolean;
    data?: ChatResponse;
    error?: ErrorResponse;
}
```

## Dependencies
- `fetch`: HTTP 请求
- `AbortController`: 请求超时控制

## Error Types
- `timeout`: 请求超时
- `network_error`: 网络连接失败
- `config_error`: 配置错误
- `provider_error`: 提供商不支持
- `unknown_error`: 未知错误
