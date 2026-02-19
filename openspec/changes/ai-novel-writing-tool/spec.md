# Spec: AI Novel Writing Tool

## Technology Stack

### Frontend
- **Language**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Vanilla JavaScript (no framework for simplicity)
- **Styling**: CSS with Flexbox/Grid
- **Icons**: Unicode or SVG icons
- **Local Storage**: JSON file system via File API

### No External Dependencies
- Pure browser-native implementation
- No build tools required
- Runs directly in browser or simple static server

## Data Models

### Story Data Structure
```json
{
  "metadata": {
    "id": "unique-story-id",
    "title": "Story Title",
    "createdAt": "2026-02-19T00:00:00Z",
    "updatedAt": "2026-02-19T00:00:00Z",
    "author": ""
  },
  "settings": {
    "theme": "light|dark",
    "autoSave": true,
    "autoSaveInterval": 300
  },
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Chapter 1",
      "order": 1,
      "content": "",
      "createdAt": "2026-02-19T00:00:00Z",
      "updatedAt": "2026-02-19T00:00:00Z"
    }
  ],
  "characters": [
    {
      "id": "char-1",
      "name": "Character Name",
      "description": "",
      "attributes": {
        "base": {},
        "current": {}
      },
      "abilities": [
        {
          "name": "Ability Name",
          "description": "",
          "level": 1,
          "acquiredAt": "chapter-1",
          "evolutionHistory": []
        }
      ],
      "notes": ""
    }
  ],
  "items": [
    {
      "id": "item-1",
      "name": "Item Name",
      "description": "",
      "type": "weapon|armor|tool|quest|other",
      "properties": {
        "base": {},
        "current": {}
      },
      "owner": "char-1|location-id|null",
      "changeHistory": [
        {
          "chapter": "chapter-1",
          "changes": "Description of changes",
          "timestamp": "2026-02-19T00:00:00Z"
        }
      ]
    }
  ],
  "settings": [
    {
      "id": "setting-1",
      "name": "Setting Name",
      "type": "world|region|location",
      "parentId": "parent-setting-id|null",
      "description": "",
      "details": {}
    }
  ],
  "timeline": [
    {
      "chapter": "chapter-1",
      "events": [
        {
          "type": "character-change|item-change|plot-event",
          "description": "",
          "timestamp": "2026-02-19T00:00:00Z"
        }
      ]
    }
  ]
}
```

## Component Architecture

### State Management

```javascript
class AppState {
  constructor() {
    this.currentStory = null;
    this.stories = [];
    this.selectedChapter = null;
    this.selectedCharacter = null;
    this.selectedItem = null;
    this.selectedSetting = null;
    this.promptContext = {
      characters: [],
      items: [],
      setting: null,
      recentEvents: []
    };
  }
  
  loadStory(storyId) { }
  saveStory() { }
  createStory(title) { }
  deleteStory(storyId) { }
}
```

### Core Modules

#### 1. FileManager Module
```javascript
class FileManager {
  static saveAsJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  
  static loadFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.validateStoryData(data);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }
  
  static validateStoryData(data) {
    // Schema validation
  }
}
```

#### 2. ContextBuilder Module
```javascript
class ContextBuilder {
  constructor(story) {
    this.story = story;
  }
  
  buildContext(chapterId) {
    const context = {
      chapter: this.getChapter(chapterId),
      characters: this.getRelevantCharacters(chapterId),
      items: this.getRelevantItems(chapterId),
      setting: this.getCurrentSetting(chapterId),
      recentEvents: this.getRecentEvents(chapterId)
    };
    return context;
  }
  
  getRelevantCharacters(chapterId) {
    // Return characters active in or before this chapter
  }
  
  getRelevantItems(chapterId) {
    // Return items relevant to this chapter
  }
  
  getRecentEvents(chapterId, limit = 10) {
    // Return recent events, prioritizing current chapter
  }
}
```

#### 3. MemoryManager Module
```javascript
class MemoryManager {
  constructor(story) {
    this.story = story;
    this.maxTokens = 2000;
  }
  
  summarizeChapter(chapter) {
    // Generate concise summary of chapter
  }
  
  summarizeCharacterState(character) {
    // Generate character state summary
  }
  
  compressContext(context) {
    // Optimize context for token usage
    // - Use summaries for old chapters
    // - Full detail for recent chapters
    // - Prioritize active elements
  }
  
  estimateTokens(text) {
    // Estimate token count
  }
}
```

#### 4. PromptGenerator Module
```javascript
class PromptGenerator {
  constructor(templates) {
    this.templates = templates;
  }
  
  generatePrompt(context, templateName = 'default') {
    const template = this.templates[templateName];
    return template
      .replace('{{chapterSummary}}', context.chapter.summary)
      .replace('{{characters}}', this.formatCharacters(context.characters))
      .replace('{{items}}', this.formatItems(context.items))
      .replace('{{setting}}', this.formatSetting(context.setting))
      .replace('{{recentEvents}}', this.formatEvents(context.recentEvents));
  }
  
  formatCharacters(characters) {
    return characters.map(c => 
      `${c.name}: ${c.attributes.current}`
    ).join('\n');
  }
  
  formatItems(items) {
    return items.map(i => 
      `${i.name}: ${i.properties.current}`
    ).join('\n');
  }
}
```

### UI Components Structure

#### Main Layout
```
App
├── Sidebar
│   ├── Navigation Menu
│   ├── Story List
│   └── Action Buttons
├── Main Content
│   ├── Story View
│   │   ├── Chapter List
│   │   └── Chapter Editor
│   ├── Character View
│   │   ├── Character List
│   │   └── Character Editor
│   ├── Item View
│   │   ├── Item List
│   │   └── Item Editor
│   ├── Setting View
│   │   ├── Setting List
│   │   └── Setting Editor
│   └── Prompt View
│       ├── Context Preview
│       ├── Prompt Template Selector
│       ├── Generated Prompt
│       └── Copy/Save Actions
└── Header
    ├── Story Title
    ├── Save/Load Actions
    └── Settings
```

## File Structure

```
BailuStory/
├── index.html                 # Main entry point
├── css/
│   ├── main.css               # Main stylesheet
│   ├── components.css         # Component styles
│   └── themes.css             # Theme definitions
├── js/
│   ├── app.js                 # Application entry
│   ├── state.js               # State management
│   ├── modules/
│   │   ├── FileManager.js     # File I/O
│   │   ├── ContextBuilder.js  # Context aggregation
│   │   ├── MemoryManager.js   # Memory optimization
│   │   └── PromptGenerator.js # Prompt generation
│   ├── components/
│   │   ├── Sidebar.js
│   │   ├── StoryView.js
│   │   ├── CharacterView.js
│   │   ├── ItemView.js
│   │   ├── SettingView.js
│   │   └── PromptView.js
│   └── utils/
│       ├── validators.js      # Data validation
│       ├── formatters.js      # Data formatting
│       └── constants.js       # Constants
└── templates/
    └── prompts.json           # Prompt templates
```

## Key Features Implementation

### 1. Story Progress Tracking
- Each chapter stores chronological order
- Timeline events track major changes
- Chapter summaries for context building

### 2. Character Attribute Evolution
- Base attributes (initial state)
- Current attributes (evolved state)
- Evolution history with chapter references
- Ability acquisition timeline

### 3. Item Change Tracking
- Item properties (base/current)
- Ownership tracking
- Change history with timestamps
- Location/possession changes

### 4. Memory Optimization
- Chapter summarization
- Event prioritization by recency
- Selective context loading
- Token estimation and limiting

### 5. Prompt Generation
- Template-based prompts
- Dynamic context insertion
- Scene-specific customization
- Copy to clipboard functionality

## Security Considerations

- All data stored locally (client-side only)
- No server communication
- User controls all data (JSON export/import)
- Input validation for all user inputs

## Browser Compatibility

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Required APIs: File API, Local Storage API
- Graceful degradation for older browsers

## Performance Considerations

- Lazy loading of story data
- Debounced auto-save
- Efficient DOM updates
- Minimal re-renders

## Future Extensions (Out of Scope)

- Cloud synchronization
- Multi-user collaboration
- Publishing tools
- AI text generation integration
- Plugin system
