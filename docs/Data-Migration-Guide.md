# 数据迁移指南

## 概述

本指南帮助您将现有的 BailuStory 故事数据迁移到支持角色持有道具功能的新版本。

## 迁移前的准备

### 1. 备份数据

在执行任何迁移之前，请务必备份您的数据：

```javascript
// 方法 1: 导出整个故事
appState.exportStory();

// 方法 2: 手动备份 localStorage
const currentStory = localStorage.getItem('bailustory_current');
// 复制并保存到安全的位置
```

### 2. 检查当前数据格式

打开浏览器的开发者工具控制台，执行以下代码：

```javascript
// 检查故事结构
const story = appState.currentStory;

// 检查角色是否有 heldItems 字段
const needsMigration = story.characters.some(char => !char.heldItems);
console.log('需要迁移:', needsMigration);

// 检查数据一致性
const validation = appState.validateItemsConsistency();
console.log('数据一致性:', validation.isConsistent);
console.log('问题列表:', validation.issues);
```

## 自动迁移

### 启动应用时的自动初始化

系统会在加载故事时自动处理旧数据：

```javascript
// 在 AppState 中自动执行
if (!character.heldItems) {
    character.heldItems = [];  // 初始化为空数组
}
```

### 检测数据不一致

应用启动时或加载故事时，系统会自动检测数据不一致：

- 道具的 `owner` 指向不存在的角色
- 道具的 `owner` 指向角色，但角色 `heldItems` 中不包含该道具
- 角色 `heldItems` 包含道具，但道具 `owner` 指向其他角色

## 手动迁移步骤

### 步骤 1: 验证数据一致性

```javascript
const result = appState.validateItemsConsistency();

if (!result.isConsistent) {
    console.log('发现以下数据不一致问题:');
    result.issues.forEach(issue => {
        console.log(`- [${issue.itemId}] ${issue.issue}`);
    });
}
```

### 步骤 2: 修复数据一致性

```javascript
// 自动修复所有数据不一致
appState.repairItemsConsistency();

// 修复会自动保存数据
console.log('数据修复完成');
```

### 步骤 3: 验证修复结果

```javascript
// 再次检查数据一致性
const result = appState.validateItemsConsistency();

if (result.isConsistent) {
    console.log('✓ 数据一致性检查通过');
} else {
    console.log('✗ 仍有数据不一致问题:');
    result.issues.forEach(issue => {
        console.log(`- [${issue.itemId}] ${issue.issue}`);
    });
}
```

### 步骤 4: 检查角色持有列表

```javascript
// 查看每个角色的持有道具
appState.currentStory.characters.forEach(char => {
    console.log(`角色: ${char.name}`);
    console.log(`  持有道具数量: ${char.heldItems.length}`);

    if (char.heldItems.length > 0) {
        char.heldItems.forEach(itemId => {
            const item = appState.currentStory.items.find(i => i.id === itemId);
            if (item) {
                console.log(`  - ${item.name} [${item.type}]`);
            } else {
                console.log(`  - [无效道具] ${itemId}`);
            }
        });
    }
});
```

## 高级迁移场景

### 场景 1: 所有角色的 heldItems 都是空的

这种情况通常发生在首次升级到新版本。

```javascript
// 基于道具的 owner 重建 heldItems
appState.repairItemsConsistency();
```

### 场景 2: 某些角色的 heldItems 为空，但有道具的 owner 指向该角色

```javascript
// 运行数据修复
appState.repairItemsConsistency();
```

### 场景 3: 道具的 owner 指向不存在的角色

```javascript
// 运行数据修复，会自动将 owner 设置为 null
appState.repairItemsConsistency();

// 检查哪些道具现在没有所有者
const orphanedItems = appState.currentStory.items.filter(
    item => !item.owner
);

console.log('无所有者的道具:', orphanedItems.map(i => i.name));
```

### 场景 4: 大量数据不一致

如果数据问题较多，建议使用批量修复：

```javascript
function batchRepair() {
    const result = appState.validateItemsConsistency();

    if (!result.isConsistent) {
        console.log(`发现 ${result.issues.length} 个问题`);
        console.log('开始修复...');

        appState.repairItemsConsistency();

        const afterRepair = appState.validateItemsConsistency();
        if (afterRepair.isConsistent) {
            console.log('✓ 所有问题已修复');
        } else {
            console.log('✗ 仍有问题需要手动处理:');
            afterRepair.issues.forEach(issue => {
                console.log(`  - ${issue.issue}`);
            });
        }
    } else {
        console.log('✓ 数据一致性，无需修复');
    }
}

// 执行批量修复
batchRepair();
```

## 自定义迁移脚本

### 为所有角色初始化 heldItems

```javascript
function initializeHeldItems() {
    let count = 0;
    appState.currentStory.characters.forEach(char => {
        if (!char.heldItems) {
            char.heldItems = [];
            count++;
        }
    });
    console.log(`已为 ${count} 个角色初始化 heldItems`);
    appState.saveToLocalStorage();
}
```

### 基于 owner 重建所有 heldItems

```javascript
function rebuildHeldItemsFromOwner() {
    // 清空所有角色的 heldItems
    appState.currentStory.characters.forEach(char => {
        char.heldItems = [];
    });

    // 基于 owner 重建
    appState.currentStory.items.forEach(item => {
        if (item.owner) {
            const character = appState.currentStory.characters.find(
                c => c.id === item.owner
            );
            if (character) {
                if (!character.heldItems) {
                    character.heldItems = [];
                }
                character.heldItems.push(item.id);
            } else {
                // owner 指向不存在的角色，重置 owner
                console.warn(`道具 ${item.name} 的 owner ${item.owner} 不存在，重置为 null`);
                item.owner = null;
            }
        }
    });

    appState.saveToLocalStorage();
    console.log('heldItems 重建完成');
}
```

### 清理无效的 heldItems 引用

```javascript
function cleanInvalidHeldItems() {
    let cleaned = 0;

    appState.currentStory.characters.forEach(char => {
        if (!char.heldItems) return;

        const validItems = char.heldItems.filter(itemId => {
            const item = appState.currentStory.items.find(i => i.id === itemId);
            return item !== undefined;
        });

        const removed = char.heldItems.length - validItems.length;
        cleaned += removed;

        char.heldItems = validItems;
    });

    appState.saveToLocalStorage();
    console.log(`已清理 ${cleaned} 个无效的道具引用`);
}
```

## 迁移验证清单

完成迁移后，请验证以下项目：

- [ ] 所有角色都有 `heldItems` 字段（可以是空数组）
- [ ] `validateItemsConsistency()` 返回 `isConsistent: true`
- [ ] 每个道具的 `owner` 指向正确的角色或为 `null`
- [ ] 角色的 `heldItems` 只包含实际存在的道具
- [ ] 没有道具的 `owner` 指向不存在的角色
- [ ] 数据已保存到 localStorage
- [ ] 重新加载应用后数据仍然一致

## 故障排除

### 问题 1: 修复后仍有数据不一致

**原因**: 可能存在循环引用或复杂的数据关系

**解决方案**:
```javascript
// 1. 检查具体问题
const result = appState.validateItemsConsistency();
result.issues.forEach(issue => console.log(issue));

// 2. 手动修复特定问题
// 例如，手动设置道具的 owner
const item = appState.currentStory.items.find(i => i.id === 'problematic-item-id');
item.owner = 'correct-character-id';

// 3. 再次运行自动修复
appState.repairItemsConsistency();
```

### 问题 2: 道具丢失

**原因**: 在修复过程中，如果道具的 `owner` 指向不存在的角色，`owner` 会被设置为 `null`

**解决方案**:
```javascript
// 查找无所有者的道具
const orphanedItems = appState.currentStory.items.filter(item => !item.owner);

console.log('无所有者的道具:', orphanedItems);

// 重新分配给正确的角色
const correctCharacter = appState.currentStory.characters.find(c => c.id === 'correct-id');
orphanedItems.forEach(item => {
    appState.addItemToCharacter(correctCharacter.id, item.id);
});
```

### 问题 3: 角色持有重复道具

**原因**: `heldItems` 数组中可能有重复的道具 ID

**解决方案**:
```javascript
appState.currentStory.characters.forEach(char => {
    if (char.heldItems) {
        // 使用 Set 去重
        char.heldItems = [...new Set(char.heldItems)];
    }
});
appState.saveToLocalStorage();
```

## 最佳实践

### 1. 定期检查数据一致性

```javascript
// 每次启动应用时检查
function startupDataCheck() {
    const result = appState.validateItemsConsistency();

    if (!result.isConsistent) {
        console.warn('检测到数据不一致，建议修复');
        console.log('问题数量:', result.issues.length);

        // 询问用户是否自动修复
        if (confirm('发现数据不一致问题，是否自动修复？')) {
            appState.repairItemsConsistency();
            console.log('✓ 数据已修复');
        }
    }
}

startupDataCheck();
```

### 2. 数据备份策略

```javascript
// 每次修改重要数据前备份
function safeRepair() {
    // 备份当前数据
    const backup = JSON.stringify(appState.currentStory);
    localStorage.setItem('bailustory_backup_' + Date.now(), backup);

    // 尝试修复
    try {
        appState.repairItemsConsistency();

        // 验证修复结果
        const result = appState.validateItemsConsistency();
        if (!result.isConsistent) {
            throw new Error('修复后仍有问题');
        }

        console.log('✓ 数据修复成功');
    } catch (error) {
        console.error('修复失败:', error);
        // 恢复备份（可选）
        alert('修复失败，数据已备份');
    }
}
```

### 3. 增量迁移

对于大型故事，建议增量迁移：

```javascript
function incrementalMigration() {
    // 每次只处理一部分角色
    const batchSize = 10;
    let processed = 0;

    for (let i = 0; i < appState.currentStory.characters.length; i += batchSize) {
        const batch = appState.currentStory.characters.slice(i, i + batchSize);

        batch.forEach(char => {
            if (!char.heldItems) {
                char.heldItems = [];
                processed++;
            }
        });

        // 每处理一批就保存一次
        appState.saveToLocalStorage();
        console.log(`已处理 ${Math.min(i + batchSize, appState.currentStory.characters.length)} / ${appState.currentStory.characters.length} 个角色`);
    }

    console.log(`✓ 迁移完成，共处理 ${processed} 个角色`);
}
```

## 联系支持

如果在迁移过程中遇到问题：

1. 查看浏览器控制台的错误日志
2. 检查数据验证结果
3. 参考本指南的故障排除部分
4. 在项目 GitHub issues 页面提交问题（附带详细的错误信息和数据示例）

## 附录: 完整迁移示例

```javascript
/**
 * 完整的迁移脚本示例
 */
function fullMigration() {
    console.log('开始数据迁移...');

    // 1. 备份数据
    const backup = JSON.stringify(appState.currentStory);
    const backupKey = 'bailustory_migration_backup_' + Date.now();
    localStorage.setItem(backupKey, backup);
    console.log('✓ 数据已备份:', backupKey);

    // 2. 检查初始状态
    const initialValidation = appState.validateItemsConsistency();
    console.log('初始一致性:', initialValidation.isConsistent);
    if (!initialValidation.isConsistent) {
        console.log('初始问题数量:', initialValidation.issues.length);
    }

    // 3. 初始化 heldItems
    let initialized = 0;
    appState.currentStory.characters.forEach(char => {
        if (!char.heldItems) {
            char.heldItems = [];
            initialized++;
        }
    });
    console.log('✓ 已为', initialized, '个角色初始化 heldItems');

    // 4. 修复数据一致性
    appState.repairItemsConsistency();
    console.log('✓ 数据一致性修复完成');

    // 5. 清理无效引用
    let cleaned = 0;
    appState.currentStory.characters.forEach(char => {
        if (!char.heldItems) return;

        const validItems = char.heldItems.filter(itemId => {
            const item = appState.currentStory.items.find(i => i.id === itemId);
            return item !== undefined;
        });

        const removed = char.heldItems.length - validItems.length;
        cleaned += removed;

        char.heldItems = validItems;
    });
    console.log('✓ 已清理', cleaned, '个无效引用');

    // 6. 去重
    let deduped = 0;
    appState.currentStory.characters.forEach(char => {
        if (char.heldItems && char.heldItems.length > 0) {
            const uniqueItems = [...new Set(char.heldItems)];
            const removed = char.heldItems.length - uniqueItems.length;
            deduped += removed;
            char.heldItems = uniqueItems;
        }
    });
    console.log('✓ 已去重', deduped, '个重复引用');

    // 7. 保存数据
    appState.saveToLocalStorage();
    console.log('✓ 数据已保存');

    // 8. 验证最终状态
    const finalValidation = appState.validateItemsConsistency();
    console.log('最终一致性:', finalValidation.isConsistent);

    if (finalValidation.isConsistent) {
        console.log('✓ 迁移成功！所有数据已迁移并验证');
    } else {
        console.log('✗ 迁移完成但仍有问题:');
        finalValidation.issues.forEach(issue => {
            console.log('  -', issue.issue);
        });
        console.log('建议手动处理剩余问题');
    }

    return {
        success: finalValidation.isConsistent,
        initialized,
        cleaned,
        deduped,
        backupKey
    };
}

// 执行完整迁移
const migrationResult = fullMigration();
console.log('迁移结果:', migrationResult);
```
