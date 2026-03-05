# Spec: Batch Paragraph Analysis

## ADDED Requirements

### Requirement: Analyze each generated paragraph automatically
The system SHALL automatically analyze each paragraph generated during continuous writing.

#### Scenario: Analyze first paragraph
- **WHEN** system generates first paragraph in continuous writing
- **THEN** system calls ParagraphAnalyzer.analyzeParagraph()
- **AND** system passes the newly generated paragraph
- **AND** system passes context including starting paragraph and preceding paragraphs
- **AND** system waits for analysis to complete

#### Scenario: Analyze each subsequent paragraph
- **WHEN** system generates paragraph N (where N > 1)
- **THEN** system calls ParagraphAnalyzer.analyzeParagraph()
- **AND** system passes paragraph N
- **AND** system passes context including paragraphs 1 to N-1
- **AND** system waits for analysis to complete before proceeding

#### Scenario: Analysis execution order
- **WHEN** system generates multiple paragraphs
- **THEN** analyses are performed sequentially (not in parallel)
- **AND** paragraph 1 analysis completes before paragraph 2 analysis
- **AND** system waits for each analysis before generating next paragraph

### Requirement: Apply analysis results to story data
The system SHALL apply the analysis results to the story data after each analysis completes.

#### Scenario: Apply character updates
- **WHEN** paragraph analysis includes character state changes
- **THEN** system updates character attributes in story data
- **AND** system records changes in state timeline
- **AND** system triggers UI refresh to display updated character states

#### Scenario: Apply element updates
- **WHEN** paragraph analysis includes element location changes
- **THEN** system updates element locations in story data
- **AND** system records changes in state timeline
- **AND** system triggers UI refresh to display updated element locations

#### Scenario: Apply event additions
- **WHEN** paragraph analysis includes new events
- **THEN** system adds events to story data
- **AND** system associates events with the generated paragraph
- **AND** system triggers UI refresh to display new events

#### Scenario: Apply all analysis types
- **WHEN** paragraph analysis includes multiple types of changes
- **THEN** system applies all character, element, and event changes
- **AND** system updates state timeline with all changes
- **AND** system triggers single UI refresh after all changes are applied

### Requirement: Display analysis results in UI
The system SHALL display the analysis results to the user after each paragraph is analyzed.

#### Scenario: Display character state changes
- **WHEN** paragraph analysis includes character state changes
- **THEN** system displays character change indicators on the paragraph
- **AND** system shows tooltip with details on hover
- **AND** indicator shows affected character names

#### Scenario: Display event markers
- **WHEN** paragraph analysis includes events
- **THEN** system displays event markers on the paragraph
- **AND** marker indicates event type (e.g., battle, conversation, discovery)
- **AND** system shows event summary in tooltip on hover

#### Scenario: Display element location changes
- **WHEN** paragraph analysis includes element location changes
- **THEN** system displays element change indicators
- **AND** indicator shows element name and new location
- **AND** system highlights affected element in element list

#### Scenario: Real-time UI updates
- **WHEN** analysis completes and results are applied
- **THEN** system updates paragraph display immediately
- **AND** system updates character panel if visible
- **AND** system updates element panel if visible
- **AND** system updates event timeline if visible

### Requirement: Handle analysis errors gracefully
The system SHALL handle analysis errors without stopping continuous writing.

#### Scenario: ParagraphAnalyzer throws error
- **WHEN** ParagraphAnalyzer.analyzeParagraph() throws an error
- **THEN** system logs the error to console
- **AND** system displays warning toast to user
- **AND** system does NOT apply analysis results
- **AND** system marks paragraph as "未分析" (not analyzed)
- **AND** system continues with next paragraph generation

#### Scenario: Analysis returns invalid data
- **WHEN** paragraph analysis returns malformed or invalid data
- **THEN** system validates the analysis result
- **AND** system displays warning toast indicating analysis failed
- **AND** system does NOT apply invalid results
- **AND** system continues with next paragraph generation

#### Scenario: Analysis timeout
- **WHEN** ParagraphAnalyzer.analyzeParagraph() exceeds timeout period
- **THEN** system cancels the analysis request
- **AND** system displays warning toast
- **AND** system continues with next paragraph generation
- **AND** system allows manual retry of analysis later

### Requirement: Analysis result caching
The system SHALL utilize ParagraphAnalyzer's built-in caching mechanism for efficiency.

#### Scenario: Use cached analysis
- **WHEN** system requests analysis for a paragraph
- **AND** analysis result exists in cache
- **THEN** system uses cached result immediately
- **AND** system does NOT make AI service call
- **AND** system reduces processing time

#### Scenario: Cache miss triggers new analysis
- **WHEN** system requests analysis for a paragraph
- **AND** analysis result does NOT exist in cache
- **THEN** system performs full analysis via ParagraphAnalyzer
- **AND** system stores result in cache for future use

#### Scenario: Cache invalidation
- **WHEN** paragraph content is modified
- **THEN** system invalidates cached analysis for that paragraph
- **AND** system re-analyzes on next request

### Requirement: Provide option to skip analysis
The system SHALL allow users to skip paragraph analysis during continuous writing.

#### Scenario: Skip analysis option in settings
- **WHEN** user opens settings
- **THEN** system displays "连续写作时跳过段落分析" option
- **AND** option is disabled by default
- **AND** option is saved to localStorage

#### Scenario: Continuous writing with analysis skipped
- **WHEN** user starts continuous writing
- **AND** "skip analysis" option is enabled
- **THEN** system does NOT call ParagraphAnalyzer
- **AND** system generates paragraphs without analysis
- **AND** system marks all paragraphs as "未分析"

#### Scenario: Continuous writing with analysis enabled
- **WHEN** user starts continuous writing
- **AND** "skip analysis" option is disabled
- **THEN** system calls ParagraphAnalyzer for each paragraph
- **AND** system applies analysis results normally

### Requirement: Batch analysis summary
The system SHALL provide a summary of analysis results after continuous writing completes.

#### Scenario: Analysis completion summary
- **WHEN** continuous writing completes successfully
- **AND** analysis was performed for all paragraphs
- **THEN** system sends notification with analysis summary
- **AND** summary includes:
  - Total paragraphs analyzed
  - Number of character state changes
  - Number of events detected
  - Number of element location changes

#### Scenario: Partial analysis summary
- **WHEN** continuous writing completes
- **AND** some paragraphs were not analyzed due to errors
- **THEN** notification summary indicates partial analysis
- **AND** summary shows number of successful analyses
- **AND** summary shows number of failed analyses

#### Scenario: Analysis skipped summary
- **WHEN** continuous writing completes
- **AND** analysis was skipped for all paragraphs
- **THEN** notification indicates "段落分析已跳过"
- **AND** system provides option to analyze all paragraphs manually

### Requirement: Manual retry of failed analyses
The system SHALL allow users to manually retry failed paragraph analyses.

#### Scenario: Manual analysis retry
- **WHEN** user views paragraph marked as "分析失败"
- **THEN** system displays "重新分析" button
- **WHEN** user clicks "重新分析"
- **THEN** system calls ParagraphAnalyzer for that paragraph
- **AND** system applies results if successful
- **AND** system updates paragraph status

#### Scenario: Batch retry all failed analyses
- **WHEN** continuous writing session has multiple failed analyses
- **THEN** system displays "重新分析所有失败段落" option in completion notification
- **WHEN** user clicks the option
- **THEN** system iterates through all failed paragraphs
- **AND** system retries analysis for each
- **AND** system updates UI after each successful analysis

### Requirement: Analysis progress indicator
The system SHALL display progress indicator during paragraph analysis.

#### Scenario: Display analysis status
- **WHEN** system is analyzing a paragraph
- **THEN** paragraph shows "分析中..." indicator
- **AND** indicator is displayed next to paragraph content

#### Scenario: Analysis completion indicator
- **WHEN** paragraph analysis completes successfully
- **THEN** "分析中..." indicator is replaced with "已分析" indicator
- **AND** indicator shows number of changes detected (e.g., "已分析 (3 changes)")

#### Scenario: Analysis failure indicator
- **WHEN** paragraph analysis fails
- **THEN** paragraph shows "分析失败" indicator
- **AND** indicator is styled differently (e.g., red color)
- **AND** indicator allows retry on click

### Requirement: Integrate with existing ParagraphAnalyzer
The system SHALL integrate seamlessly with existing ParagraphAnalyzer without modifications.

#### Scenario: Use existing ParagraphAnalyzer API
- **WHEN** system analyzes a paragraph
- **THEN** system calls ParagraphAnalyzer.analyzeParagraph(paragraph, context)
- **AND** system does NOT require changes to ParagraphAnalyzer
- **AND** system respects existing caching mechanism

#### Scenario: Use ParagraphAnalyzer analysis result format
- **WHEN** system receives analysis result from ParagraphAnalyzer
- **THEN** system uses the result format as returned by ParagraphAnalyzer
- **AND** system expects standard structure (characters, elements, events arrays)
- **AND** system adapts to any ParagraphAnalyzer result format changes

#### Scenario: Update story using existing methods
- **WHEN** system applies analysis results
- **THEN** system uses existing story update methods
- **AND** system does NOT duplicate update logic
- **AND** system maintains data consistency with manual analysis flows
