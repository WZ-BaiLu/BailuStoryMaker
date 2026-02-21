# State Context Specification

## Purpose
提供故事状态上下文计算功能,实时计算并缓存当前章节的故事状态,供 AI 生成使用。

## ADDED Requirements

### Requirement: StateContextCache initialization
The system SHALL initialize chapter-level cache for story contexts.

#### Scenario: Initialize empty cache
- **WHEN** StateContextCache is created
- **THEN** system initializes cache as Map<string, StoryContext>
- **AND** system links to StateTimeline for context calculation

### Requirement: Context calculation with caching
The system SHALL calculate story context on-demand and cache by chapter.

#### Scenario: Calculate context first time
- **WHEN** calling getContext(chapterId) for first time
- **THEN** system checks cache - not found
- **AND** system calls calculateContext(chapterId)
- **AND** system stores result in cache
- **AND** system returns calculated context

#### Scenario: Return cached context
- **WHEN** calling getContext(chapterId) after initial calculation
- **THEN** system checks cache - found
- **AND** system returns cached context
- **AND** does not recalculate

#### Scenario: Cache hit performance
- **WHEN** retrieving cached context
- **THEN** system returns in O(1) time
- **AND** no state calculation occurs

### Requirement: Context calculation logic (pure rules)
The system SHALL calculate story context using pure rules without AI.

#### Scenario: Calculate context for chapter
- **WHEN** calling calculateContext(chapterId)
- **THEN** system retrieves chapter by ID
- **AND** system gets all paragraphs in chapter
- **AND** system gets current view location from StoryViewManager
- **AND** system gets present elements for each paragraph
- **AND** system builds context object

#### Scenario: Context includes chapter info
- **WHEN** calculating context
- **THEN** system includes chapter.id, chapter.title, chapter.order
- **AND** system includes first and last paragraph IDs

#### Scenario: Context includes view location
- **WHEN** calculating context
- **THEN** system includes current view location
- **AND** system includes location element details (name, description)

#### Scenario: Context includes present elements
- **WHEN** calculating context
- **THEN** system includes all present elements for each paragraph
- **AND** includes element details (name, type, description)
- **AND** includes element state at that paragraph (location, owner, status, description)

#### Scenario: Context includes element relationships
- **WHEN** calculating context
- **THEN** system includes ownership relationships (character -> item)
- **AND** includes location relationships (element -> location)
- **AND** includes recall relationships (forgotten element -> recall event)

#### Scenario: Context excludes absent elements
- **WHEN** calculating context
- **THEN** system excludes elements not present in any paragraph
- **AND** excludes forgotten elements without recall events
- **AND** excludes elements at different locations

### Requirement: Cache invalidation
The system SHALL invalidate cache when relevant data changes.

#### Scenario: Invalidate on paragraph change
- **WHEN** paragraph is added, updated, or deleted in chapter
- **THEN** system calls invalidate(chapterId)
- **AND** system removes chapter from cache

#### Scenario: Invalidate on element change
- **WHEN** element is added, updated, or deleted
- **THEN** system identifies affected chapters
- **AND** system invalidates cache for each affected chapter

#### Scenario: Invalidate on view change
- **WHEN** story view location changes
- **THEN** system invalidates cache for all chapters
- **AND** forces recalculation with new view location

#### Scenario: Manual cache clear
- **WHEN** calling clearCache()
- **THEN** system clears all cached contexts
- **AND** next getContext() triggers recalculation

### Requirement: Context for AI generation
The system SHALL provide formatted context optimized for AI prompt generation.

#### Scenario: Format context as text
- **WHEN** calling formatContextForAI(context)
- **THEN** system converts context to structured text
- **AND** includes chapter title and current location
- **AND** lists present characters with their states
- **AND** lists present items with their owners
- **AND** includes relevant locations
- **AND** includes active memories
- **AND** excludes absent elements

#### Scenario: Format with element details
- **WHEN** formatting context
- **THEN** system includes element.name, element.description
- **AND** includes element.state.description (attributes, skills, etc.)
- **AND** includes element.status (if not null)

#### Scenario: Format for minimal context
- **WHEN** calling formatMinimalContext(context, options)
- **THEN** system limits output based on options
- **AND** options.maxCharacters: limits to N characters
- **AND** options.includeTypes: filters by element types
- **AND** system prioritizes most relevant elements

#### Scenario: Format for specific paragraph
- **WHEN** calling formatParagraphContext(paragraphId)
- **THEN** system calculates context up to that paragraph
- **AND** includes elements present in that paragraph
- **AND** excludes elements that appear only after

### Requirement: Performance optimization
The system SHALL optimize context calculation for large chapters.

#### Scenario: Lazy calculation
- **WHEN** chapter has many paragraphs (> 100)
- **THEN** system calculates context incrementally
- **AND** caches intermediate results

#### Scenario: Memory-efficient context
- **WHEN** storing cached contexts
- **THEN** system uses compact data structures
- **AND** stores references to elements (not copies)

#### Scenario: Cache size limit
- **WHEN** cache exceeds limit (default: 10 chapters)
- **THEN** system evicts least recently used entry
- **AND** preserves frequently accessed chapters

## API

```javascript
class StateContextCache {
  constructor(timeline: StateTimeline, viewManager: StoryViewManager);

  // Cache operations
  getContext(chapterId: string): StoryContext;
  calculateContext(chapterId: string): StoryContext;
  invalidate(chapterId: string): void;
  invalidateElement(elementId: string): void;
  clearCache(): void;

  // AI formatting
  formatContextForAI(context: StoryContext): string;
  formatMinimalContext(context: StoryContext, options: FormatOptions): string;
  formatParagraphContext(paragraphId: string): string;
}

interface StoryContext {
  chapter: {
    id: string;
    title: string;
    order: number;
    firstParagraphId: string;
    lastParagraphId: string;
  };
  viewLocation: string;
  locationElement?: StoryElement;
  paragraphs: Array<{
    paragraphId: string;
    order: number;
    presentElements: Array<{
      element: StoryElement;
      state: ElementState;
    }>;
  }>;
}

interface FormatOptions {
  maxCharacters?: number;
  includeTypes?: ElementType[];
  includeStateDescriptions?: boolean;
  includeElementDescriptions?: boolean;
}
```

## Dependencies
- `state-tracking`: StateTimeline for context calculation
- `story-view-management`: StoryViewManager for presence filtering
- `element-management`: StoryElement data model
