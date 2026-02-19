# Spec: Undo/Redo Feature

## Technology Stack

- **Language**: JavaScript (ES6+)
- **State Management**: Existing AppState class
- **Storage**: In-memory (not persisted)

## Component Architecture

### HistoryManager Class

```javascript
class HistoryManager {
    constructor(maxSize = 50) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = maxSize;
    }

    // Save current state to history
    saveState(state) {
        // Deep copy and push to undo stack
        // Clear redo stack
        // Limit stack size
    }

    // Undo last action
    undo(currentState) {
        // Pop from undo stack
        // Push current state to redo stack
        // Return previous state
    }

    // Redo last undone action
    redo(currentState) {
        // Pop from redo stack
        // Push current state to undo stack
        // Return next state
    }

    // Check if undo is available
    canUndo() {
        return this.undoStack.length > 0;
    }

    // Check if redo is available
    canRedo() {
        return this.redoStack.length > 0;
    }

    // Clear all history
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }

    // Get current history position
    getHistoryInfo() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length
        };
    }
}
```

## Integration with AppState

```javascript
class AppState {
    constructor() {
        // ... existing properties
        this.history = new HistoryManager();
        this.listeners = [];
    }

    // Override existing methods to track history
    updateChapter(chapterId, updates) {
        // Save current state before modification
        this.history.saveState(JSON.parse(JSON.stringify(this.currentStory)));

        // ... existing logic
    }

    undo() {
        if (!this.history.canUndo()) return;

        const previousState = this.history.undo(
            JSON.parse(JSON.stringify(this.currentStory))
        );
        this.currentStory = previousState;
        this.notify('undo', previousState);
    }

    redo() {
        if (!this.history.canRedo()) return;

        const nextState = this.history.redo(
            JSON.parse(JSON.stringify(this.currentStory))
        );
        this.currentStory = nextState;
        this.notify('redo', nextState);
    }
}
```

## File Structure

```
js/
├── state.js (updated with history)
└── utils/
    └── HistoryManager.js (new file)
```

## Key Features Implementation

### 1. State Snapshot
- Deep copy entire story object
- Include timestamp for debugging
- Compact storage by only storing changed portions (optional optimization)

### 2. Keyboard Shortcuts
- Ctrl/Cmd+Z: undo
- Ctrl/Cmd+Y: redo (or Ctrl/Cmd+Shift+Z on Mac)
- Prevent default browser undo behavior in text inputs

### 3. Visual Feedback
- Update undo/redo button states
- Show tooltip with keyboard shortcuts
- Disable buttons when action not available

### 4. History Limits
- Default max size: 50
- Configurable in Constants
- Remove oldest entries when limit reached

## UI Components

### Header Buttons
```html
<button id="undo-btn" class="btn btn-secondary" title="撤销 (Ctrl+Z)" disabled>↶ 撤销</button>
<button id="redo-btn" class="btn btn-secondary" title="重做 (Ctrl+Y)" disabled>↷ 重做</button>
```

## Keyboard Shortcut Handling

```javascript
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd+Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        appState.undo();
    }

    // Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z: Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        appState.redo();
    }
});
```

## Performance Considerations

- Deep copying large story objects may be slow
- Consider only tracking changed chapters/characters instead of full state
- Use stack size limits to prevent memory issues
- Debounce rapid state changes

## Future Extensions (Out of Scope)

- Branching history paths
- Time-travel to any point
- Persistent history across sessions
- History export/import
- Visual history timeline
