# Proposal: AI Continuous Writing Feature

## Why

当前AI写作功能每次只能生成一个段落，用户需要进行多次点击和操作才能完成连续的内容创作。这种方式效率较低，特别是当用户需要创作较长段落序列时。现在增加连续写作功能可以让用户一次性指定创作数量，系统自动循环执行，大幅提升创作效率。同时提供可中断的等待机制，在保证自动化的同时给予用户控制权。

## What Changes

### 新增功能

1. **连续写作输入界面**
   - 添加段落数量输入框（默认值为1，最小值为1，最大值为20）
   - 在AI工具栏添加"连续写作"按钮
   - 显示当前连续写作进度

2. **连续写作执行流程**
   - 根据用户指定的段落数量循环执行创作
   - 每次创作基于当前选中的段落（如未选中则使用最新段落）总结上下文
   - 段落生成后自动调用ParagraphAnalyzer进行状态分析
   - 分析结果自动应用到故事数据中
   - 实时更新UI显示新生成的段落

3. **可中断等待机制**
   - 每段生成后进入等待期（默认5秒）
   - 等待时间可在设置中配置（范围：1-30秒）
   - 等待界面显示：
     - 当前进度（例如：3/10 段落）
     - 剩余等待时间倒计时
     - "中断"按钮用于立即停止连续写作
   - 用户点击中断按钮或等待时间结束后继续下一段落

4. **完成通知**
   - 连续写作全部完成后发送网页通知
   - 通知内容包括：
     - 完成状态
     - 生成的段落数量
     - 总耗时
   - 支持Telegram Bot通知（可选功能）：
     - 用户可配置Bot Token和Chat ID
     - 通知推送至用户Telegram账号
     - 适合长时间连续写作，用户无需一直盯着电脑

5. **设置项扩展**
   - 在设置中添加"连续写作等待时间"配置项
   - 配置项保存到localStorage
   - 提供滑块控件进行直观调整
   - 新增Telegram Bot通知配置：
     - 启用/禁用Telegram通知开关
     - Bot Token输入框（从@BotFather获取）
     - Chat ID输入框（从@userinfobot获取）
     - 发送测试消息按钮，用于验证配置

### 修改内容

- **AIElementTools.js**: 添加连续写作UI组件和控制逻辑
- **AIManager.js**: 添加连续写作协调器和执行流程
- **UIRenderer.js**: 添加等待进度界面的渲染
- **Settings模块**: 扩展配置项，添加连续写作等待时间和Telegram配置
- **NotificationManager**: 扩展现有通知系统，添加Telegram Bot通知支持

### UI布局调整

- AI工具栏新增"连续写作"按钮
- 点击后弹出对话框，包含：
  - 段落数量输入框
  - "开始"和"取消"按钮
- 等待界面覆盖在主编辑区域，半透明背景
- 实时在段落列表下方显示当前生成状态

## Capabilities

### New Capabilities

- `continuous-writing`: 连续写作流程管理能力，包括批量段落生成、上下文聚合、自动分析集成
- `writing-interrupt`: 可中断的等待机制，支持倒计时显示、用户中断控制、可配置等待时间
- `batch-paragraph-analysis`: 批量段落分析能力，集成ParagraphAnalyzer进行状态识别和自动应用
- `telegram-notification`: Telegram Bot通知能力，支持将应用通知推送到用户Telegram账号

### Modified Capabilities

(无现有规格需要修改，本功能为纯新增功能)

## Impact

### 影响的代码模块

- **js/managers/AIElementTools.js**
  - 新增连续写作按钮和输入对话框
  - 状态：需要扩展，添加UI组件和事件处理

- **js/managers/AIManager.js**
  - 新增ContinuousWritingCoordinator类
  - 新增连续写作主流程控制方法
  - 状态：需要扩展，添加协调逻辑

- **js/managers/UIRenderer.js**
  - 新增等待进度界面渲染方法
  - 新增实时状态更新方法
  - 状态：需要扩展，添加UI渲染

- **js/managers/SettingsManager.js**（如不存在则创建）
  - 新增连续写作配置项管理（等待时间、跳过分析）
  - 新增Telegram配置项管理（启用开关、Bot Token、Chat ID）
  - 状态：需要扩展或新建

- **js/managers/NotificationManager.js**
  - 新增Telegram Bot通知发送方法
  - 扩展现有showSuccess/showError方法，支持Telegram推送
  - 新增配置管理方法（读取/保存Telegram配置）
  - 新增测试消息发送方法
  - 状态：需要扩展

- **js/modules/ParagraphAnalyzer.js**
  - 现有模块，无需修改
  - 仅调用其现有API进行分析

### 新增文件

- **js/managers/ContinuousWritingManager.js**: 连续写作管理器，负责协调整个连续写作流程

### 依赖系统

- **AIService.js**: 现有AI生成服务，调用现有generateParagraph方法
- **ParagraphAnalyzer.js**: 现有段落分析器，调用现有analyze方法
- **NotificationManager**: 现有通知系统，调用现有showNotification方法并扩展Telegram支持
- **Telegram Bot API**: Telegram官方API，用于发送消息推送
  - 端点：`https://api.telegram.org/bot{TOKEN}/sendMessage`
  - 无需后端，纯前端HTTP请求
- **localStorage**: 浏览器存储，用于保存设置和Telegram配置

### API变更

无API破坏性变更，纯新增功能。现有所有公开API保持兼容。

### 数据模型变更

无数据模型变更，仅使用现有paragraph和analysis数据结构。

### 性能影响

- 连续写作会连续调用AI服务，需要考虑请求限流
- 每次生成后的分析会增加少量处理时间
- 建议在UI中添加"正在生成..."的加载状态，避免用户重复操作

### 用户体验

- **正面**: 减少重复操作，提升创作效率
- **正面**: Telegram通知让用户可以离开电脑，在其他地方接收完成提醒
- **中性**: 等待期间可中断，保证控制权
- **潜在风险**: 连续生成可能产生不连贯内容，需要用户在生成后手动审查和编辑
- **Telegram优势**:
  - 适合长时间连续写作场景（如设定20段，等待时间30秒，可能需要10分钟以上）
  - 用户可以在手机上实时接收完成通知
  - 推送及时可靠，无需一直盯着浏览器

### Telegram Bot技术细节

**配置获取步骤**（用户侧，约5分钟）：
1. 在Telegram中找到 **@BotFather**，发送 `/newbot` 创建新bot，获得Bot Token
2. 在Telegram中找到 **@userinfobot**，发送任意消息，获得Chat ID
3. 在BailuStory设置中填入Bot Token和Chat ID，启用Telegram通知

**技术实现**（开发侧）：
- 使用Telegram Bot API的 `sendMessage` 端点
- 纯HTTP POST请求，无需后端服务器
- 消息格式支持HTML，可根据通知类型添加emoji（✅❌⚠️）
- 配置存储在localStorage，保护用户隐私
- 发送失败时自动降级到网页通知

**限制**：
- 需要能访问 `api.telegram.org`（国内可能需要代理）
- 单条消息最大4096字符（对通知足够）
- API频率限制：每分钟30条（连续写作场景远低于此限制）

### 测试需求

- 单元测试：ContinuousWritingManager的流程控制
- 集成测试：连续写作完整流程
- UI测试：等待界面的显示和中断功能
- 边界测试：最大段落数量（20段）、最小等待时间（1秒）
- Telegram通知测试：
  - 测试消息发送成功
  - 测试配置缺失时的处理
  - 测试网络失败时的降级
  - 测试测试消息发送功能
