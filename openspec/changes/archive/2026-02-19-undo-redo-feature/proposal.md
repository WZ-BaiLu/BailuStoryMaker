# Proposal: Undo/Redo Feature

## Summary
Add undo and redo functionality to allow users to revert and reapply state changes in the AI novel writing tool.

## Background
Users may accidentally make changes they want to reverse, or need to compare previous versions of their work. An undo/redo system provides a safety net and improves the user experience by allowing easy recovery from mistakes.

This feature will:
- Track all state changes (chapters, characters, items, settings)
- Allow users to undo recent changes
- Allow users to redo undone changes
- Maintain a history stack with configurable size limit

## Goals
1. **State History Tracking** - Record all modifications to the story state
2. **Undo Functionality** - Revert to previous state
3. **Redo Functionality** - Reapply previously undone changes
4. **Keyboard Shortcuts** - Ctrl/Cmd+Z for undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z for redo
5. **Visual Indicators** - Show when undo/redo is available
6. **History Limit** - Configure maximum history size to prevent memory issues

## Non-goals
- Branching/merge of different history paths
- Time-travel to any point in history (only linear undo/redo)
- Persistent history across sessions (resets on reload)

## Success Criteria
- Users can undo the last 50+ state changes
- Users can redo all undone changes until new actions are taken
- Keyboard shortcuts work consistently
- Visual feedback shows when undo/redo is available
- History size is limited to prevent memory overflow

## Implementation Approach
- Use a command pattern to store state snapshots
- Maintain two stacks: undo stack and redo stack
- On each state change, push to undo stack and clear redo stack
- On undo, pop from undo stack, push current state to redo stack
- On redo, pop from redo stack, push current state to undo stack
- Limit stack size to prevent memory issues
