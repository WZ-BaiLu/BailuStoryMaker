# State Tracking Specification

## Purpose
提供元素状态时间线跟踪功能,记录所有元素的状态变化,支持实时查询任意时刻的状态。

## ADDED Requirements

### Requirement: StateTimeline data structure
The system SHALL provide StateTimeline to index and query element state changes across all paragraphs.

#### Scenario: Initialize StateTimeline
- **WHEN** StateTimeline is created
- **THEN** system initializes changesByParagraph as empty Map
- **AND** system links to story.elements array

#### Scenario: Record element change in timeline
- **WHEN** an element state changes in a paragraph
- **THEN** system adds change to changesByParagraph Map
- **AND** keys by paragraphId
- **AND** value is array of ElementChange records

#### Scenario: Query all changes for paragraph
- **WHEN** calling getParagraphChanges(paragraphId)
- **THEN** system returns array of ElementChange
- **AND** includes all elements changed in that paragraph
- **AND** returns empty array if no changes

### Requirement: Get element state at specific paragraph
The system SHALL support querying element state at any paragraph by applying historical changes.

#### Scenario: Calculate state from history
- **WHEN** calling getStateAt(paragraphId, elementId)
- **THEN** system retrieves element.stateHistory
- **AND** filters changes where paragraphId is before or equal to target
- **AND** sorts changes chronologically
- **AND** applies changes in order to base state
- **AND** returns calculated state

#### Scenario: State with no history
- **WHEN** querying state for element with no history before paragraph
- **THEN** system returns initial/default state
- **AND** location is null
- **AND** description is empty object
- **AND** owner is null

#### Scenario: State with partial history
- **WHEN** querying state for element with partial changes
- **THEN** system applies only fields present in history
- **AND** unset fields remain at default values

#### Scenario: State with overwritten fields
- **WHEN** multiple changes affect same field
- **THEN** system applies most recent change
- **AND** earlier changes are overwritten

### Requirement: Get current story context
The system SHALL provide complete story context at any paragraph including all present elements and their states.

#### Scenario: Calculate current context
- **WHEN** calling getCurrentContext(paragraphId)
- **THEN** system retrieves all elements
- **AND** calculates state for each element at that paragraph
- **AND** filters elements based on presence rules
- **AND** returns StoryContext object

#### Scenario: Context includes present elements
- **WHEN** generating context for paragraph
- **THEN** system includes elements where isElementPresent() is true
- **AND** includes all base settings
- **AND** includes elements at current view location
- **AND** includes recalled forgotten elements

#### Scenario: Context excludes absent elements
- **WHEN** generating context for paragraph
- **THEN** system excludes elements where isElementPresent() is false
- **AND** excludes elements at different locations
- **AND** excludes forgotten elements without recall events

#### Scenario: Context includes element states
- **WHEN** generating context for paragraph
- **THEN** system includes current state for each present element
- **AND** includes location, description, owner, status
- **AND** includes keywords

### Requirement: Time travel state query (时光回溯)
The system SHALL support read-only historical state queries for any moment in story time.

#### Scenario: Query element state at historical moment
- **WHEN** calling getStateAt(paragraphId, elementId)
- **THEN** system retrieves element.stateHistory
- **AND** filters changes before or at target paragraph
- **AND** applies changes chronologically
- **AND** returns state at that moment
- **AND** does NOT modify any data (read-only)

#### Scenario: Query element state trajectory
- **WHEN** calling getElementStateTrajectory(elementId)
- **THEN** system retrieves all state changes
- **AND** calculates state at each paragraph
- **AND** returns array of {paragraphId, state} pairs
- **AND** ordered chronologically

#### Scenario: Query full story context at historical moment
- **WHEN** calling getCurrentContext(paragraphId)
- **THEN** system calculates context at that paragraph
- **AND** includes all present elements with their states
- **AND** includes view location at that moment
- **AND** returns complete snapshot

#### Scenario: Query state change history
- **WHEN** calling getElementStateHistory(elementId)
- **THEN** system returns element.stateHistory array
- **AND** includes all StateChange records
- **AND** ordered by timestamp

#### Scenario: Time travel query does not modify data
- **WHEN** calling any time travel query method
- **THEN** system does NOT modify element stateHistory
- **AND** does NOT modify StateTimeline index
- **AND** does NOT modify any paragraph data
- **AND** query is purely read-only

### Requirement: Narrative-type aware state query
The system SHALL support state queries that respect narrative type (linear, flashback, flashforward, parallel).

#### Scenario: Query state for flashback paragraph
- **WHEN** calling getNarrativeContext(paragraphId) for flashback type
- **THEN** system identifies narrative type from storyTimestamp
- **AND** uses referenceParagraphId as anchor
- **AND** applies timeOffset to anchor time
- **AND** returns context from historical moment

#### Scenario: Query state for flashforward paragraph
- **WHEN** calling getNarrativeContext(paragraphId) for flashforward type
- **THEN** system identifies narrative type from storyTimestamp
- **AND** uses referenceParagraphId as anchor
- **AND** applies positive timeOffset to anchor time
- **AND** returns context from future moment

#### Scenario: Query state for parallel narrative
- **WHEN** calling getNarrativeContext(paragraphId) for parallel type
- **THEN** system uses absoluteTime to determine story moment
- **AND** returns context from that story moment
- **AND** may include elements from different chapters

#### Scenario: Query state for linear narrative (default)
- **WHEN** calling getNarrativeContext(paragraphId) for linear type or no type specified
- **THEN** system uses paragraph order as time reference
- **AND** returns context from current moment
- **AND** same as getCurrentContext() behavior

### Requirement: Story timestamp indexing
The system SHALL index paragraphs by story timestamp to support non-linear narrative queries.

#### Scenario: Index paragraph by story timestamp
- **WHEN** paragraph is created or updated
- **THEN** system extracts storyTimestamp
- **AND** indexes by chapterId and sequence
- **AND** stores absoluteTime and relativeTime if present
- **AND** stores narrativeType and referenceParagraphId if present

#### Scenario: Find paragraph by story time
- **WHEN** calling findParagraphByTime(storyTime)
- **THEN** system searches for matching storyTimestamp
- **AND** returns paragraph with matching absoluteTime
- **OR** returns paragraph with matching referenceParagraphId and timeOffset

#### Scenario: Apply time offset from anchor
- **WHEN** applying timeOffset to anchor paragraph
- **THEN** system calculates effective time based on offset
- **AND** positive offset moves forward in story time
- **AND** negative offset moves backward in story time
- **AND** returns paragraph at effective time

#### Scenario: Calculate current context
- **WHEN** calling getCurrentContext(paragraphId)
- **THEN** system retrieves all elements
- **AND** calculates state for each element at that paragraph
- **AND** filters elements based on presence rules
- **AND** returns StoryContext object

#### Scenario: Context includes present elements
- **WHEN** generating context for paragraph
- **THEN** system includes elements where isElementPresent() is true
- **AND** includes all base settings
- **AND** includes elements at current view location
- **AND** includes recalled forgotten elements

#### Scenario: Context excludes absent elements
- **WHEN** generating context for paragraph
- **THEN** system excludes elements where isElementPresent() is false
- **AND** excludes elements at different locations
- **AND** excludes forgotten elements without recall events

#### Scenario: Context includes element states
- **WHEN** generating context for paragraph
- **THEN** system includes current state for each present element
- **AND** includes location, description, owner, status
- **AND** includes keywords

### Requirement: Mixed state management strategy
The system SHALL use mixed strategy combining element-level history and global timeline for optimal performance.

#### Scenario: Element-level state history
- **WHEN** element state changes
- **THEN** system records change in element.stateHistory array
- **AND** only records changed fields (not entire state)
- **AND** includes paragraphId and timestamp

#### Scenario: Global timeline indexing
- **WHEN** element state changes
- **THEN** system indexes change in StateTimeline.changesByParagraph
- **AND** enables fast query of "all changes in paragraph"

#### Scenario: Query optimization
- **WHEN** querying single element state
- **THEN** system uses element.stateHistory (O(n) where n = history length)
- **WHEN** querying all elements in paragraph
- **THEN** system uses StateTimeline.changesByParagraph (O(1) + O(m) where m = changed elements)

## API

```javascript
class StateTimeline {
  constructor(elements: StoryElement[]);

  // Indexing
  indexChanges(paragraphId: string, changes: ElementChange[]): void;
  indexParagraphTimestamp(paragraphId: string, timestamp: StoryTimestamp): void;

  // Query single element
  getStateAt(paragraphId: string, elementId: string): ElementState;
  getStateAtStoryTime(storyTime: StoryTimestamp, elementId: string): ElementState;

  // Query all elements in paragraph
  getParagraphChanges(paragraphId: string): ElementChange[];

  // Get complete context
  getCurrentContext(paragraphId: string): StoryContext;
  getNarrativeContext(paragraphId: string): NarrativeContext;

  // Time travel queries
  getElementStateTrajectory(elementId: string): Array<{
    paragraphId: string;
    state: ElementState;
  }>;
  getElementStateHistory(elementId: string): StateChange[];

  // Story timestamp queries
  findParagraphByTime(storyTime: StoryTimestamp): Paragraph;
  applyTimeOffset(anchorParagraph: Paragraph, storyTime: StoryTimestamp): StoryTimestamp;
}

interface StoryTimestamp {
  chapterId: string;
  sequence: number;
  absoluteTime?: string;
  relativeTime?: string;
  narrativeType?: 'linear'|'flashback'|'flashforward'|'parallel';
  referenceParagraphId?: string;
  timeOffset?: number;
}

interface Paragraph {
  id: string;
  content: string;
  changes: ElementChange[];
  createdAt: string;
  storyTimestamp: StoryTimestamp;
}

interface ElementChange {
  elementId: string;
  type: ElementType;
  stateChanges: {
    location?: string;
    description?: Record<string, any>;
    owner?: string;
    status?: string;
    keywords?: string[];
  };
}

interface ElementState {
  elementId: string;
  location: string;
  description: Record<string, any>;
  owner: string | null;
  status: string | null;
  keywords: string[];
}

interface StoryContext {
  paragraphId: string;
  viewLocation: string;
  presentElements: Array<{
    element: StoryElement;
    state: ElementState;
  }>;
}

interface NarrativeContext extends StoryContext {
  narrativeType: 'linear'|'flashback'|'flashforward'|'parallel';
  referenceParagraphId?: string;
  timeOffset?: number;
}
```

## Dependencies
- `element-management`: StoryElement data model
- `story-view-management`: View location for presence filtering
