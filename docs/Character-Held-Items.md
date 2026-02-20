# 角色持有道具功能说明

## 概述

BailuStory 现在支持跟踪和管理角色持有的道具。该功能允许您：

- 查看每个角色当前持有的道具列表
- 分配和转移道具给角色
- 在段落状态摘要中查看角色及其持有的道具
- 自动同步道具所有权与角色持有列表

## 功能特性

### 1. 角色数据模型更新

每个角色现在包含一个 `heldItems` 字段，存储该角色持有的道具 ID 列表：

```javascript
{
    id: "char-1234567892",
    name: "张三",
    description: "主角，年轻勇敢的冒险者",
    attributes: {
        base: { "力量": 50 },
        current: { "力量": 55 }
    },
    abilities: [...],
    notes: "正在寻找失落的宝剑",
    heldItems: ["item-1234567893", "item-1234567894"]  // 新增字段
}
```

### 2. 道具管理方法

#### 获取角色持有的道具

```javascript
// 获取角色持有的所有道具 ID
const heldItems = appState.getHeldItems(characterId);
```

#### 添加道具到角色

```javascript
// 将道具分配给角色
appState.addItemToCharacter(characterId, itemId);
```

此方法会：
- 将道具 ID 添加到角色的 `heldItems` 数组
- 更新道具的 `owner` 字段指向该角色
- 如果道具之前由其他角色持有，则自动移除

#### 从角色移出道具

```javascript
// 从角色的持有所列中移出道具
appState.removeItemFromCharacter(characterId, itemId);
```

此方法会：
- 从角色的 `heldItems` 数组中移除道具 ID
- 将道具的 `owner` 字段设置为 `null`

#### 在角色间转移道具

```javascript
// 将道具从一个角色转移到另一个角色
appState.transferItem(itemId, fromCharacterId, toCharacterId);
```

此方法会：
- 从原角色的 `heldItems` 数组中移除道具
- 将道具添加到目标角色的 `heldItems` 数组
- 更新道具的 `owner` 字段

### 3. 数据一致性管理

系统提供了数据一致性校验和修复功能，确保道具的 `owner` 字段与角色的 `heldItems` 数组保持同步。

#### 校验数据一致性

```javascript
// 检查数据一致性
const result = appState.validateItemsConsistency();

// result.isConsistent: true/false
// result.issues: 问题列表
```

系统会检测以下不一致情况：
- 道具的 `owner` 指向不存在的角色
- 道具的 `owner` 指向的角色 `heldItems` 中不包含该道具
- 角色的 `heldItems` 包含某个道具，但道具的 `owner` 指向其他角色

#### 修复数据不一致

```javascript
// 自动修复数据不一致
appState.repairItemsConsistency();
```

修复逻辑：
- 基于道具的 `owner` 字段重建所有角色的 `heldItems` 数组
- 如果道具的 `owner` 指向不存在的角色，则将 `owner` 设置为 `null`

### 4. 状态摘要优化

段落状态摘要现在经过优化，**只显示当前段落中出现的角色及其持有的道具**。

#### 之前的实现问题

- 显示所有角色的状态（即使在段落中未出现）
- 显示所有道具的状态（即使不在当前段落中）
- 信息过载，用户难以关注到当前编辑的内容

#### 新的实现

- 通过段落 `changes.characters` 数组识别出场的角色
- 只显示这些角色的状态和属性
- 只显示这些角色持有的道具
- 如果段落中没有角色或道具，显示相应的提示信息

#### 使用示例

```javascript
// 在段落中添加角色变化
paragraph.changes.characters = [{
    characterId: "char-123",
    changes: {
        attributes: { health: "+10" }
    }
}];

// 状态摘要只显示 char-123 及其持有的道具
```

### 5. AI 提示词增强

AI 助手的提示词生成现在包含角色的持有道具信息。

#### 智能上下文构建

```javascript
// AI 管理器自动在上下文中包含角色 heldItems
const context = aiManager.buildContext();
```

上下文包含：
- 出场的角色信息
- 每个角色持有的道具列表
- 道具的详细属性（名称、类型、属性值）

#### 格式化道具信息

```javascript
// 获取格式化的持有道具字符串
const itemsStr = aiManager.formatHeldItems(characterId);
```

输出示例：
```
  无
```

或

```
  - 古剑 [武器] (攻击力: 100, 耐久度: 95)
  - 盾牌 [护甲] (防御力: 80)
```

### 6. 向后兼容性

系统完全向后兼容旧数据：

- 加载没有 `heldItems` 字段的角色时，自动初始化为空数组
- 旧的故事数据可以正常加载和使用
- 数据迁移工具可帮助修复不一致的数据

## 数据迁移指南

### 检测数据不一致

1. 打开应用
2. 系统会自动检测数据一致性
3. 如果发现问题，会提示您修复数据

### 手动修复数据

```javascript
// 在浏览器控制台中执行
appState.validateItemsConsistency();  // 查看问题
appState.repairItemsConsistency();      // 修复数据
```

### 迁移现有故事

对于没有 `heldItems` 字段的旧故事：

1. 系统会自动初始化 `heldItems` 为空数组
2. 建议运行数据修复功能，基于道具的 `owner` 字段重建 `heldItems`
3. 修复后的数据会自动保存

## 用户界面说明

### 状态摘要视图

1. 点击时间线中的段落节点
2. 选择"总结状态"按钮
3. 系统显示当前段落中的角色和道具
4. 角色卡片中会显示：
   - 角色名称
   - 情绪状态
   - 属性值
   - **持有的道具列表**（新增）

### 道具显示

状态摘要中的道具部分：
- **只显示由出场角色持有的道具**
- 每个道具显示名称和类型
- 如果道具有属性变化，会显示具体变化

### 空状态处理

- 如果段落中没有角色：显示"此段落中无角色"
- 如果角色没有持有道具：不显示道具部分
- 如果没有道具显示：显示"此段落中无道具"

## API 参考

### AppState 方法

| 方法 | 参数 | 返回值 | 描述 |
|------|------|--------|------|
| `getHeldItems(characterId)` | `string` | `string[]` | 获取角色持有的道具 ID 列表 |
| `addItemToCharacter(characterId, itemId)` | `string`, `string` | `void` | 将道具添加到角色 |
| `removeItemFromCharacter(characterId, itemId)` | `string`, `string` | `void` | 从角色移出道具 |
| `transferItem(itemId, fromId, toId)` | `string`, `string`, `string` | `void` | 在角色间转移道具 |
| `validateItemsConsistency()` | - | `{isConsistent: boolean, issues: Array}` | 校验数据一致性 |
| `repairItemsConsistency()` | - | `void` | 修复数据不一致 |

### AIManager 方法

| 方法 | 参数 | 返回值 | 描述 |
|------|------|--------|------|
| `formatHeldItems(characterId)` | `string` | `string` | 格式化角色持有道具信息 |
| `buildContext()` | - | `Object` | 构建 AI 上下文（包含 heldItems） |

## 常见问题

### Q: 为什么道具的 owner 和角色的 heldItems 需要同步？

A: 这是为了优化查询性能和数据完整性：
- `heldItems` 提供快速的 O(1) 查询
- `owner` 字段作为单一数据源
- 两者同步确保数据一致性

### Q: 如何处理数据不一致？

A:
1. 使用 `validateItemsConsistency()` 检查问题
2. 使用 `repairItemsConsistency()` 自动修复
3. 系统会基于 `owner` 字段重建 `heldItems`

### Q: 状态摘要中为什么只显示部分角色和道具？

A: 为了提高信息的可读性和相关性：
- 只显示当前段落中参与的角色
- 只显示这些角色持有的道具
- 减少信息过载，聚焦于当前编辑的内容

### Q: 旧数据如何处理？

A:
- 系统自动初始化 `heldItems` 为空数组
- 提供数据迁移工具重建持有列表
- 完全向后兼容，无需手动修改旧数据

## 技术实现

### 数据模型

```javascript
// Character 接口
interface Character {
    id: string;
    name: string;
    description: string;
    attributes: {
        base: Record<string, number>;
        current: Record<string, number>;
    };
    abilities: Array<Ability>;
    notes: string;
    heldItems: string[];  // 新增字段
}

// Item 接口
interface Item {
    id: string;
    name: string;
    type: string;
    description: string;
    properties: {
        base: Record<string, number>;
        current: Record<string, number>;
    };
    owner: string | null;
    changeHistory: Array<ChangeHistory>;
}
```

### 核心算法

#### 道具添加算法

```
1. 检查道具是否已存在于角色 heldItems
   ├─ 是 → 不做任何操作
   └─ 否 → 继续步骤 2

2. 检查道具是否由其他角色持有
   ├─ 是 → 从原角色的 heldItems 中移除
   └─ 否 → 继续步骤 3

3. 将道具 ID 添加到目标角色的 heldItems
4. 更新道具的 owner 字段
5. 触发通知和保存
```

#### 数据一致性校验算法

```
对于每个道具：
  if (owner 存在 and owner 指向的角色存在):
    if (角色的 heldItems 不包含该道具):
      记录问题: "owner 指向角色，但不在其 heldItems 中"

对于每个角色：
  for (heldItems 中的每个道具):
    if (道具不存在):
      记录问题: "heldItems 包含不存在的道具"
    else if (道具的 owner != 角色 ID):
      记录问题: "道具在 heldItems 中，但 owner 指向其他角色"

返回 { isConsistent: 无问题, issues: 问题列表 }
```

## 更新日志

### Version 1.0.0 (2026-02-20)

**新增功能:**
- 角色数据模型添加 `heldItems` 字段
- 道具管理方法（添加、移除、转移）
- 数据一致性校验和修复功能
- 状态摘要筛选优化（只显示出场角色和道具）
- AI 提示词包含角色持有道具信息
- 向后兼容性支持
- 完整的中英文国际化支持

**改进:**
- 优化状态摘要显示，减少信息过载
- 提高道具查询性能
- 增强数据一致性保证

**文档:**
- 功能使用指南
- API 参考文档
- 数据迁移指南
- 常见问题解答
