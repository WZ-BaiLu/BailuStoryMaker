# 快速开始测试

## 概述

本项目已配置完整的单元测试环境，使用 Jest 测试框架。

## 已完成的测试

- ✅ NotificationManager.test.js (20+ 测试用例)
- ✅ ThemeManager.test.js (15+ 测试用例)
- ✅ ModalManager.test.js (12+ 测试用例)

## 运行测试

### 方法 1: 使用 npm 脚本（推荐）

```bash
# 运行所有测试
npm test

# 生成覆盖率报告
npm run test:coverage

# 监视模式（开发时使用）
npm run test:watch
```

### 方法 2: 使用快速测试脚本

```bash
node tests/run-tests.js
```

### 方法 3: 直接使用 Jest

```bash
# 运行所有测试
npx jest

# 运行特定测试文件
npx jest tests/managers/NotificationManager.test.js

# 查看详细输出
npx jest --verbose
```

## 查看覆盖率报告

运行 `npm run test:coverage` 后，打开以下文件查看详细报告：

```
coverage/lcov-report/index.html
```

## 测试结构

```
tests/
├── setup.js                    # 全局测试设置（Mock localStorage 和 DOM）
├── README.md                   # 测试文档
├── run-tests.js                # 快速测试运行脚本
├── managers/                   # 管理器测试
│   ├── NotificationManager.test.js  ✅ 完成
│   ├── ThemeManager.test.js          ✅ 完成
│   └── ModalManager.test.js          ✅ 完成
└── test-utils.js               # 测试工具
```

## 测试说明

### NotificationManager 测试
- 测试 Toast 通知的创建和显示
- 测试不同类型的通知（success, error, warning）
- 测试自动消失逻辑（使用 fake timers）
- 测试边界情况（空消息、超长消息、特殊字符）

### ThemeManager 测试
- 测试主题加载和切换
- 测试 localStorage 交互
- 测试多次切换的正确性
- 测试与其他 body 类的兼容性

### ModalManager 测试
- 测试模态框的显示和隐藏
- 测试表单提交处理
- 测试表单验证（空输入）
- 测试与外部依赖的交互

## 常见问题

### Q: 测试失败怎么办？
A: 查看错误信息，检查：
1. DOM Mock 是否正确
2. localStorage 是否正确清理
3. 测试断言是否合理

### Q: 覆盖率不达标怎么办？
A: 运行 `npm run test:coverage` 查看详细报告，找出未覆盖的代码行，添加相应测试。

### Q: 如何调试测试？
A: 使用 Jest 的调试功能：
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 下一步

1. 完成剩余管理器的测试：
   - ViewManager
   - EventManager
   - ExportImportManager
   - UIRenderer

2. 添加工具函数测试

3. 添加模块测试

4. 集成到 CI/CD 流程

## 测试覆盖率目标

| 类型 | 当前目标 | 预期 |
|------|---------|------|
| 语句 | 70% | 80%+ |
| 分支 | 60% | 75%+ |
| 函数 | 70% | 80%+ |
| 行数 | 70% | 80%+ |

## 相关文档

- [完整测试文档](./tests/README.md)
- [测试实施总结](./TESTING_SUMMARY.md)
- [测试规范规则](./.codebuddy/rules/mandatory-unit-testing.mdc)
