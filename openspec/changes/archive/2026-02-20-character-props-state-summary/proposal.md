# Proposal: Character Props State Summary

## Why

当前系统中，角色对象缺少道具持有字段，导致无法直接知道某个角色持有哪些道具。同时，在总结段落状态时，系统显示所有角色和物品的状态，而不是只显示当前段落中出场人物及其持有的物品。这增加了用户的认知负担，降低了信息的可读性。需要通过这次变更改进角色数据模型和状态摘要显示逻辑。

## What Changes

- **角色数据模型扩展**
  - 在 `Character` 对象中添加 `heldItems` 字段（数组），存储角色当前持有的道具 ID 列表
  - 在角色数据管理中添加获取和管理持有道具的方法

- **段落状态摘要逻辑优化**
  - 修改段落状态摘要生成逻辑，只显示当前段落中出现的角色
  - 只显示当前段落中出现的角色所持有的道具
  - 提高状态摘要的可读性和相关性

- **道具分配功能**
  - 提供道具分配/转移的用户界面
  - 更新道具的 `owner` 字段时，同步更新相关角色的 `heldItems` 数组

## Capabilities

### New Capabilities

- `character-held-items`: 角色持有道具管理功能，包括数据模型、API 和用户界面

### Modified Capabilities

- `character-state-tracking`: 需要扩展角色数据结构，增加 `heldItems` 字段的定义和操作
- `props-state-tracking`: 需要修改道具分配逻辑，确保道具所有权变更时同步更新角色的持有列表
- `ai-assistant`: 需要更新 AI 提示词生成逻辑，包含角色持有道具的信息

## Impact

- **数据模型**
  - 角色数据结构增加 `heldItems: string[]` 字段
  - 道具分配时需要同时更新道具的 `owner` 和角色的 `heldItems`

- **API**
  - `CharacterManager`: 增加 `getHeldItems(characterId)`、`addItemToCharacter(characterId, itemId)`、`removeItemFromCharacter(characterId, itemId)` 方法
  - `PropsManager`: 修改道具分配逻辑，触发角色持有列表的更新

- **用户界面**
  - 角色编辑界面增加道具持有列表
  - 段落状态摘要显示优化
  - 提供道具拖拽分配功能（可选）

- **兼容性**
  - 现有故事数据的角色对象需要迁移，默认 `heldItems` 为空数组
  - 道具的 `owner` 字段与角色的 `heldItems` 需要同步，可能需要数据修复脚本
