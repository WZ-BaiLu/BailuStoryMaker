// History Manager for Undo/Redo functionality

class HistoryManager {
    constructor(maxSize = 50) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = maxSize;
        this.listeners = [];
    }

    // Save state before modification
    pushState(state, description = 'Action') {
        const snapshot = JSON.parse(JSON.stringify(state));
        const historyItem = {
            state: snapshot,
            timestamp: new Date().toISOString(),
            description: description
        };

        this.undoStack.push(historyItem);
        this.redoStack = []; // Clear redo stack on new action

        // Enforce maximum stack size
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }

        this.notify('historyChanged', this.getStatus());
    }

    // Perform undo
    undo(currentState) {
        if (this.undoStack.length === 0) {
            return null;
        }

        const previousStateItem = this.undoStack.pop();
        const currentStateSnapshot = JSON.parse(JSON.stringify(currentState));

        this.redoStack.push({
            state: currentStateSnapshot,
            timestamp: new Date().toISOString(),
            description: previousStateItem.description
        });

        this.notify('historyChanged', this.getStatus());
        this.notify('undoPerformed', previousStateItem);

        return previousStateItem.state;
    }

    // Perform redo
    redo(currentState) {
        if (this.redoStack.length === 0) {
            return null;
        }

        const nextStateItem = this.redoStack.pop();

        // Push current state to undo stack BEFORE changing it
        this.undoStack.push({
            state: currentState,
            timestamp: new Date().toISOString(),
            description: 'Redo operation'
        });

        this.notify('historyChanged', this.getStatus());
        this.notify('redoPerformed', nextStateItem);

        return nextStateItem.state;
    }

    // Check if undo is available
    canUndo() {
        return this.undoStack.length > 0;
    }

    // Check if redo is available
    canRedo() {
        return this.redoStack.length > 0;
    }

    // Get history status
    getStatus() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            lastAction: this.undoStack[this.undoStack.length - 1]?.description || null
        };
    }

    // Clear all history
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.notify('historyChanged', this.getStatus());
    }

    // Get history list for viewer (optional)
    getHistory() {
        return {
            undo: this.undoStack.map((item, index) => ({
                index,
                timestamp: item.timestamp,
                description: item.description
            })),
            redo: this.redoStack.map((item, index) => ({
                index,
                timestamp: item.timestamp,
                description: item.description
            }))
        };
    }

    // Event listeners
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    notify(event, data) {
        this.listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }
}
