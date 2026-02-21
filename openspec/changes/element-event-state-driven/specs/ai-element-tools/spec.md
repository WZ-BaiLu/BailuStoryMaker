# AI Element Tools Specification

## Purpose
提供 AI 辅助元素和状态管理功能,包括添加新元素、修改元素位置、修改元素描述等 AI tools,支持"预览-确认"插入流程。

## ADDED Requirements

### Requirement: addElement AI tool
The system SHALL provide addElement tool for AI to create new story elements.

#### Scenario: AI invokes addElement for character
- **WHEN** AI calls addElement tool with type="character" and character data
- **THEN** system validates required fields (name, description)
- **AND** system generates unique ID using format "character-<name>-<sequence>"
- **AND** system adds default keywords ["人物", name]
- **AND** system adds element to story.elements
- **AND** system returns created element with ID

#### Scenario: AI invokes addElement for item
- **WHEN** AI calls addElement tool with type="item" and item data
- **THEN** system validates required fields (name, description)
- **AND** system generates unique ID using format "item-<name>-<sequence>"
- **AND** system adds default keywords ["道具", name]
- **AND** system adds element to story.elements
- **AND** system returns created element with ID

#### Scenario: AI invokes addElement for location
- **WHEN** AI calls addElement tool with type="location" and location data
- **THEN** system validates required fields (name, description)
- **AND** system generates unique ID using format "location-<name>-<sequence>"
- **AND** system adds default keywords ["地点", name]
- **AND** system adds element to story.elements
- **AND** system returns created element with ID

#### Scenario: AI invokes addElement for memory
- **WHEN** AI calls addElement tool with type="memory" and memory data
- **THEN** system validates required fields (name, description)
- **AND** system generates unique ID using format "memory-<name>-<sequence>"
- **AND** system adds default keywords ["记忆"]
- **AND** system adds element to story.elements
- **AND** system returns created element with ID

#### Scenario: AI invokes addElement with keywords
- **WHEN** AI calls addElement tool with custom keywords
- **THEN** system adds custom keywords to element
- **AND** system merges with default keywords (no duplicates)
- **AND** system validates keywords are strings

#### Scenario: AI invokes addElement validation error
- **WHEN** AI calls addElement tool missing required field
- **THEN** system returns error with message
- **AND** does NOT create element
- **AND** does NOT modify story.elements

#### Scenario: AI invokes addElement for existing element
- **WHEN** AI calls addElement tool with name that already exists
- **THEN** system returns error "Element already exists"
- **AND** does NOT create duplicate element

### Requirement: updateElementLocation AI tool
The system SHALL provide updateElementLocation tool for AI to change element's location.

#### Scenario: AI updates element location to location
- **WHEN** AI calls updateElementLocation with elementId and locationElementId
- **THEN** system validates both elements exist
- **THEN** system validates target is type 'location'
- **AND** system updates element.location to locationElementId
- **AND** system records state change in element.stateHistory
- **AND** system returns success

#### Scenario: AI updates element location to null
- **WHEN** AI calls updateElementLocation with elementId and location=null
- **THEN** system sets element.location to null
- **AND** system records state change
- **AND** system returns success

#### Scenario: AI updates item location (transfer)
- **WHEN** AI calls updateElementLocation for item to character
- **THEN** system sets item.location to characterId
- **AND** system records state change with owner field
- **AND** system represents item ownership

#### Scenario: AI updates element location validation error
- **WHEN** AI calls updateElementLocation with invalid elementId
- **THEN** system returns error "Element not found"
- **AND** does NOT modify element
- **WHEN** AI calls updateElementLocation with invalid locationId
- **THEN** system returns error "Location not found"

#### Scenario: AI updates element location not a location
- **WHEN** AI calls updateElementLocation with target not type 'location'
- **THEN** system returns error "Target is not a location"
- **AND** does NOT modify element

### Requirement: updateElementDescription AI tool
The system SHALL provide updateElementDescription tool for AI to change element's description.

#### Scenario: AI updates element description field
- **WHEN** AI calls updateElementDescription with elementId and description field
- **THEN** system validates element exists
- **AND** system updates element.description field
- **AND** system records state change in stateHistory
- **AND** system returns success

#### Scenario: AI updates element state description (attributes)
- **WHEN** AI calls updateElementDescription with elementId and state description object
- **THEN** system validates element exists
- **AND** system updates element.stateDescription with new values
- **AND** system records state change in stateHistory
- **AND** system returns success

#### Scenario: AI updates element keywords
- **WHEN** AI calls updateElementDescription with elementId and keywords array
- **THEN** system validates element exists
- **AND** system validates keywords are strings
- **AND** system replaces element.keywords with new array
- **AND** system records state change in stateHistory
- **AND** system returns success

#### Scenario: AI adds status keyword
- **WHEN** AI calls updateElementDescription with status="破损"
- **THEN** system adds "破损" to element.keywords
- **AND** system records state change
- **AND** system returns success

#### Scenario: AI adds forgotten keyword
- **WHEN** AI calls updateElementDescription with status="被遗忘"
- **THEN** system adds "被遗忘" to element.keywords
- **AND** system records state change
- **AND** system returns success

#### Scenario: AI updates element description validation error
- **WHEN** AI calls updateElementDescription with invalid elementId
- **THEN** system returns error "Element not found"
- **AND** does NOT modify element

#### Scenario: AI updates with invalid keywords
- **WHEN** AI calls updateElementDescription with non-string keyword
- **THEN** system returns error "Invalid keyword"
- **AND** does NOT modify element

### Requirement: Preview-confirm workflow
The system SHALL support "preview-then-confirm" workflow for AI tool invocations.

#### Scenario: AI generates paragraph with element changes (preview)
- **WHEN** AI generates paragraph content
- **THEN** system does NOT call AI tools
- **AND** system returns JSON with suggested element changes
- **AND** system displays preview to user
- **AND** NO actual data changes occur

#### Scenario: User confirms and applies changes
- **WHEN** user confirms previewed changes
- **THEN** system inserts paragraph into story
- **AND** system calls AI tools to apply element changes
- **AND** system records state changes in element.stateHistory
- **AND** system updates StateTimeline
- **AND** system invalidates StateContextCache

#### Scenario: User rejects changes
- **WHEN** user rejects previewed changes
- **THEN** system discards suggested content
- **AND** system does NOT call AI tools
- **AND** system does NOT modify any data

#### Scenario: User modifies suggested changes
- **WHEN** user modifies previewed changes
- **THEN** system applies modified changes
- **AND** system calls AI tools with modified parameters
- **AND** system records modified state changes

#### Scenario: Preview shows element changes
- **WHEN** displaying preview
- **THEN** system shows paragraph content
- **AND** system lists new elements to be added
- **AND** system lists element location changes
- **AND** system lists element description changes
- **AND** system shows before/after values for changes

### Requirement: AI tool error handling
The system SHALL handle AI tool invocation errors gracefully.

#### Scenario: Tool validation failure
- **WHEN** AI tool parameter validation fails
- **THEN** system returns error message to AI
- **AND** AI can retry with corrected parameters
- **AND** no data changes occur

#### Scenario: Tool execution error
- **WHEN** AI tool execution throws exception
- **THEN** system catches exception
- **AND** returns error message to AI
- **AND** logs error for debugging
- **AND** system remains in consistent state

#### Scenario: Tool timeout
- **WHEN** AI tool execution exceeds timeout (default: 10s)
- **THEN** system aborts tool execution
- **AND** returns timeout error to AI
- **AND** system rolls back partial changes if any

## API

```javascript
// AI Tools
interface AddElementParams {
  type: 'character'|'item'|'location'|'memory'|'base';
  name: string;
  description: string;
  keywords?: string[];
  // Type-specific fields...
}

interface UpdateElementLocationParams {
  elementId: string;
  location: string | null;  // location elementId or null
}

interface UpdateElementDescriptionParams {
  elementId: string;
  description?: string;
  stateDescription?: Record<string, any>;
  keywords?: string[];
  status?: string;  // "破损", "被遗忘", etc.
}

// AI Tool Handlers
class AIElementTools {
  addElement(params: AddElementParams): Promise<StoryElement>;
  updateElementLocation(params: UpdateElementLocationParams): Promise<void>;
  updateElementDescription(params: UpdateElementDescriptionParams): Promise<void>;
}

// Preview Workflow
interface ParagraphSuggestion {
  content: string;
  elementChanges: Array<{
    tool: string;
    params: any;
    description: string;
  }>;
  storyTimestamp?: StoryTimestamp;  // AI 可建议的时间线索认
}

class AIPreviewManager {
  generateParagraph(context: StoryContext): Promise<ParagraphSuggestion>;
  showPreview(suggestion: ParagraphSuggestion): Promise<boolean>;  // true if confirmed
  applyChanges(suggestion: ParagraphSuggestion): Promise<void>;
}
```

### Requirement: updateParagraphTimestamp AI tool
The system SHALL provide updateParagraphTimestamp tool for AI to modify paragraph's story timestamp in narrative scenarios like flashback, flashforward, or parallel narratives.

#### Scenario: AI sets paragraph as flashback
- **WHEN** AI calls updateParagraphTimestamp with paragraphId, narrativeType="flashback", referenceParagraphId
- **THEN** system validates paragraph exists
- **AND** system validates reference paragraph exists
- **AND** system sets storyTimestamp.narrativeType to "flashback"
- **AND** system sets storyTimestamp.referenceParagraphId to referenceParagraphId
- **AND** system sets storyTimestamp.timeOffset (calculated from reference)
- **AND** system returns success with updated timestamp

#### Scenario: AI sets paragraph as flashforward
- **WHEN** AI calls updateParagraphTimestamp with paragraphId, narrativeType="flashforward", referenceParagraphId
- **THEN** system validates paragraph exists
- **AND** system validates reference paragraph exists
- **AND** system sets storyTimestamp.narrativeType to "flashforward"
- **AND** system sets storyTimestamp.referenceParagraphId to referenceParagraphId
- **AND** system sets storyTimestamp.timeOffset (positive value)
- **AND** system returns success with updated timestamp

#### Scenario: AI sets paragraph as parallel narrative
- **WHEN** AI calls updateParagraphTimestamp with paragraphId, narrativeType="parallel", referenceParagraphId
- **THEN** system validates paragraph exists
- **AND** system validates reference paragraph exists
- **AND** system sets storyTimestamp.narrativeType to "parallel"
- **AND** system sets storyTimestamp.referenceParagraphId to referenceParagraphId
- **AND** system sets storyTimestamp.timeOffset to 0
- **AND** system returns success with updated timestamp

#### Scenario: AI updates paragraph with absolute time
- **WHEN** AI calls updateParagraphTimestamp with paragraphId, absoluteTime (e.g., "2023-06-15")
- **THEN** system validates paragraph exists
- **AND** system sets storyTimestamp.absoluteTime to provided value
- **AND** system keeps narrativeType if previously set
- **AND** system returns success with updated timestamp

#### Scenario: AI updates paragraph with relative time
- **WHEN** AI calls updateParagraphTimestamp with paragraphId, relativeTime (e.g., "三天前")
- **THEN** system validates paragraph exists
- **AND** system sets storyTimestamp.relativeTime to provided value
- **AND** system updates StateTimeline index
- **AND** system returns success with updated timestamp

#### Scenario: AI updates paragraph timestamp validation error
- **WHEN** AI calls updateParagraphTimestamp with invalid paragraphId
- **THEN** system returns error "Paragraph not found"
- **AND** does NOT modify paragraph
- **WHEN** AI calls updateParagraphTimestamp with invalid referenceParagraphId
- **THEN** system returns error "Reference paragraph not found"
- **WHEN** AI calls updateParagraphTimestamp with invalid narrativeType
- **THEN** system returns error "Invalid narrative type"
- **AND** does NOT modify paragraph

#### Scenario: AI removes narrative type (reset to linear)
- **WHEN** AI calls updateParagraphTimestamp with paragraphId, narrativeType="linear"
- **THEN** system validates paragraph exists
- **AND** system sets storyTimestamp.narrativeType to "linear"
- **AND** system clears storyTimestamp.referenceParagraphId
- **AND** system clears storyTimestamp.timeOffset
- **AND** system returns success with updated timestamp

#### Scenario: AI calculates time offset automatically
- **WHEN** AI calls updateParagraphTimestamp with narrativeType but no explicit timeOffset
- **THEN** system calculates offset based on reference paragraph's position
- **AND** for flashback: negative offset (before reference)
- **AND** for flashforward: positive offset (after reference)
- **AND** for parallel: zero offset
- **AND** system sets calculated offset to storyTimestamp.timeOffset
- **AND** system returns success with calculated offset

### Requirement: Paragraph timestamp in AI preview
The system SHALL allow AI to suggest story timestamp in paragraph preview.

#### Scenario: AI suggests flashback paragraph
- **WHEN** AI generates paragraph suggestion for flashback scenario
- **THEN** AI includes storyTimestamp in ParagraphSuggestion
- **AND** storyTimestamp.narrativeType = "flashback"
- **AND** storyTimestamp.referenceParagraphId points to main timeline
- **AND** system displays timestamp in preview UI
- **AND** user can review and adjust before confirming

#### Scenario: User confirms paragraph with suggested timestamp
- **WHEN** user confirms paragraph suggestion with storyTimestamp
- **THEN** system calls updateParagraphTimestamp tool automatically
- **AND** system applies suggested timestamp to paragraph
- **AND** system updates StateTimeline index
- **AND** system invalidates affected StateContextCache

#### Scenario: User modifies suggested timestamp
- **WHEN** user modifies storyTimestamp in preview (e.g., changes narrative type)
- **THEN** system applies modified timestamp on confirmation
- **AND** system updates StateTimeline index accordingly
- **AND** system returns success with applied timestamp

```javascript
interface UpdateParagraphTimestampParams {
  paragraphId: string;
  narrativeType?: 'linear'|'flashback'|'flashforward'|'parallel';
  referenceParagraphId?: string;  // for flashback/flashforward/parallel
  timeOffset?: number;  // optional, calculated automatically if not provided
  absoluteTime?: string;  // e.g., "2023-06-15"
  relativeTime?: string;  // e.g., "三天前", "晚上8点"
}

interface AIElementTools {
  addElement(params: AddElementParams): Promise<StoryElement>;
  updateElementLocation(params: UpdateElementLocationParams): Promise<void>;
  updateElementDescription(params: UpdateElementDescriptionParams): Promise<void>;
  updateParagraphTimestamp(params: UpdateParagraphTimestampParams): Promise<StoryTimestamp>;
}
```

## Dependencies
- `element-management`: StoryElement CRUD operations
- `state-tracking`: StateTimeline updates
- `story-view-management`: View location validation
- `state-context`: Context generation for AI
- `ai-assistant`: AI service integration
