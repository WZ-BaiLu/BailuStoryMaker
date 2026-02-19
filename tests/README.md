# BailuStory 测试文档

## 目录

- [安装依赖](#安装依赖)
- [运行测试](#运行测试)
- [测试覆盖率](#测试覆盖率)
- [编写测试](#编写测试)
- [测试结构](#测试结构)

## 安装依赖

```bash
npm install
```

这将安装以下开发依赖：
- `jest` - 测试框架
- `@babel/core` 和 `@babel/preset-env` - Babel 编译器
- `jest-environment-jsdom` - DOM 环境

## 运行测试

### 运行所有测试

```bash
npm test
```

### 监视模式运行测试

在开发时使用监视模式，文件更改时自动运行测试：

```bash
npm run test:watch
```

### 生成测试覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告将生成在 `coverage/` 目录下。打开 `coverage/lcov-report/index.html` 查看详细报告。

### CI/CD 模式运行

```bash
npm run test:ci
```

## 测试覆盖率

### 目标覆盖率

| 类型 | 全局目标 | managers 目录 |
|------|---------|--------------|
| 语句 (Statements) | 70% | 80% |
| 分支 (Branches) | 60% | 80% |
| 函数 (Functions) | 70% | 80% |
| 行数 (Lines) | 70% | 80% |

### 当前测试状态

- ✅ NotificationManager - 完成
- ✅ ThemeManager - 完成
- ✅ ModalManager - 完成
- ⏳ ViewManager - 待完成
- ⏳ EventManager - 待完成
- ⏳ ExportImportManager - 待完成
- ⏳ UIRenderer - 待完成

## 编写测试

### 测试命名规范

使用 `describe` 和 `it` 来组织测试，测试名称应该描述期望的行为：

```javascript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // 测试代码
    });
  });
});
```

### 测试结构

每个测试文件应包含：

1. **beforeEach** - 设置测试环境
2. **afterEach** - 清理测试环境
3. **单元测试** - 测试单个方法
4. **集成测试** - 测试多个方法的交互
5. **边界测试** - 测试边界条件和异常情况

### Mock 外部依赖

```javascript
// Mock localStorage
localStorage.getItem = jest.fn();
localStorage.setItem = jest.fn();

// Mock DOM 元素
document.body.innerHTML = `
  <div id="test-element"></div>
`;

// Mock 函数
const mockFunction = jest.fn().mockReturnValue('test');
```

### 测试示例

```javascript
describe('ThemeManager', () => {
  let themeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
    localStorage.clear();
    document.body.className = '';
  });

  afterEach(() => {
    // 清理
  });

  describe('toggleTheme', () => {
    it('should add dark class when toggling to dark mode', () => {
      themeManager.toggleTheme();

      expect(document.body.classList.contains('dark')).toBe(true);
    });

    it('should save theme to localStorage', () => {
      themeManager.toggleTheme();

      expect(localStorage.setItem).toHaveBeenCalledWith('bailustory_theme', 'dark');
    });
  });
});
```

## 测试结构

```
tests/
├── setup.js              # 全局测试设置
├── README.md             # 测试文档
├── managers/             # 管理器测试
│   ├── NotificationManager.test.js
│   ├── ThemeManager.test.js
│   ├── ModalManager.test.js
│   ├── ViewManager.test.js
│   ├── EventManager.test.js
│   ├── ExportImportManager.test.js
│   └── UIRenderer.test.js
├── utils/                # 工具函数测试
│   └── validators.test.js
└── modules/              # 模块测试
    └── FileManager.test.js
```

## 测试最佳实践

1. **保持测试独立** - 每个测试应该独立运行，不依赖其他测试
2. **使用 beforeEach/afterEach** - 在每个测试前后设置和清理环境
3. **测试应该快速** - 避免在测试中使用真实的网络请求或文件操作
4. **使用描述性的测试名称** - 测试名称应该清楚说明测试的内容和期望
5. **Mock 外部依赖** - 不要在测试中使用真实的 localStorage、fetch 等
6. **测试边界情况** - 不仅测试正常情况，还要测试异常和边界情况
7. **保持测试简单** - 每个测试只测试一个功能点

## CI/CD 集成

测试将在以下情况下自动运行：
- 每次代码提交
- 每次 Pull Request
- 每次合并到主分支

如果测试失败，构建将被阻止，问题需要修复后才能合并。

## 故障排除

### 测试失败

1. 查看错误信息
2. 检查是否正确 Mock 了外部依赖
3. 确保测试环境正确设置
4. 检查 DOM 元素是否存在

### 覆盖率不达标

1. 运行 `npm run test:coverage` 查看详细报告
2. 找出未覆盖的代码行
3. 为未覆盖的代码添加测试
4. 重点关注核心业务逻辑的覆盖率

### 测试超时

1. 检查是否有异步操作未正确处理
2. 使用 `jest.useFakeTimers()` 来处理定时器
3. 确保所有异步操作都有适当的等待或 mock

## 资源

- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [Jest Mock 函数](https://jestjs.io/docs/mock-functions)
- [Jest 异步测试](https://jestjs.io/docs/asynchronous)
