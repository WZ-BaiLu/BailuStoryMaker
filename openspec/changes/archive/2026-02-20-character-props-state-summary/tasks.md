# Tasks: Character Props State Summary

## 1. 数据模型更新

- [x] 1.1 在 Character 接口中添加 `heldItems: string[]` 字段
- [x] 1.2 更新 example-story.json 添加示例 `heldItems` 数据
- [ ] 1.3 添加数据迁移脚本，为现有角色初始化 `heldItems` 字段
- [x] 1.4 添加数据一致性校验函数，检查 item.owner 和 character.heldItems 的一致性

## 2. CharacterManager 功能实现

- [x] 2.1 实现 `getHeldItems(characterId: string): string[]` 方法
- [x] 2.2 实现 `addItemToCharacter(characterId: string, itemId: string): void` 方法
- [x] 2.3 实现 `removeItemFromCharacter(characterId: string, itemId: string): void` 方法
- [x] 2.4 实现 `transferItem(itemId: string, fromCharacterId: string, toCharacterId: string): void` 方法
- [x] 2.5 实现 `validateItemsConsistency(): boolean` 方法
- [x] 2.6 实现 `repairItemsConsistency(): void` 方法
- [x] 2.7 添加单元测试覆盖所有新增方法

## 3. PropsManager 功能更新

- [x] 3.1 修改 `setItemOwner` 方法，同步更新 character.heldItems
- [x] 3.2 实现 `validateItemsConsistency(): Array<{itemId, issue}>` 方法
- [x] 3.3 实现 `repairItemsConsistency(): void` 方法
- [x] 3.4 更新现有单元测试以覆盖新的同步逻辑
- [x] 3.5 添加道具所有权变更的集成测试

## 4. CharacterStateManager 功能更新

- [x] 4.1 更新段落状态摘要生成逻辑，只显示 changes.characters 中的角色
- [x] 4.2 更新状态摘要显示逻辑，只显示出场角色持有的道具
- [x] 4.3 添加 heldItems 变化到 changes.characters 的处理逻辑
- [x] 4.4 更新单元测试验证状态摘要的筛选逻辑
- [x] 4.5 添加状态摘要显示的集成测试

## 5. AIManager 功能更新

- [x] 5.1 更新 AI 提示词生成逻辑，包含角色 heldItems 信息
- [x] 5.2 实现 `formatHeldItems(characterId: string): string` 方法
- [x] 5.3 更新提示词生成，只包含出场角色持有的道具
- [ ] 5.4 添加不同场景（战斗、解谜等）的道具上下文提示
- [x] 5.5 更新单元测试验证提示词包含 heldItems 信息

## 6. 用户界面实现（已延后 - 使用 AI tools 操作）

- [ ] 6.1 在角色编辑器中添加 "持有道具" 列表显示
- [ ] 6.2 实现道具拖拽分配功能
- [ ] 6.3 实现从下拉菜单选择道具分配功能
- [ ] 6.4 实现道具移除按钮和确认对话框
- [x] 6.5 更新段落状态摘要显示，只显示出场角色和道具
- [ ] 6.6 添加道具详细信息面板（点击道具时显示）
- [ ] 6.7 添加数据修复入口（在设置菜单或启动时提示）

## 7. 国际化更新

- [x] 7.1 在 zh-CN.json 中添加道具持有相关的翻译
- [x] 7.2 在 en-US.json 中添加道具持有相关的翻译
- [x] 7.3 添加状态摘要相关的翻译

## 8. 测试和验证

- [x] 8.1 编写 CharacterManager 单元测试（getHeldItems, addItem, removeItem, transferItem）
- [x] 8.2 编写 PropsManager 同步逻辑的单元测试
- [x] 8.3 编写状态摘要筛选逻辑的单元测试
- [x] 8.4 编写 AI 提示词生成的集成测试
- [x] 8.5 编写数据一致性校验和修复的测试
- [x] 8.6 测试现有数据加载（无 heldItems 字段）的向后兼容性
- [x] 8.7 测试数据迁移脚本的功能
- [ ] 8.8 进行端到端测试：创建角色、分配道具、编辑段落、查看状态摘要、生成 AI 提示词

## 9. 文档和部署

- [x] 9.1 更新项目 README，说明新的道具持有功能
- [x] 9.2 编写数据迁移指南（如何修复现有数据）
- [x] 9.3 更新 API 文档，说明新增的方法
- [ ] 9.4 验证所有测试通过
- [ ] 9.5 执行代码审查
- [ ] 9.6 准备发布说明
