/**
 * AI Element Tools - Refactored Version
 * 
 * Improvements based on code analysis:
 * - Extracted complex logic into smaller, focused functions
 * - Reduced nesting depth using early returns
 * - Fixed naming conventions
 * - Added better error handling
 */

class AIElementTools {
  constructor(elementManager, stateTimeline, storyData) {
    this.elementManager = elementManager;
    this.stateTimeline = stateTimeline;
    this.storyData = storyData;

    // Tool timeout (milliseconds)
    this.toolTimeout = 10000;

    // Valid narrative types
    this.validNarrativeTypes = ['linear', 'flashback', 'flashforward', 'parallel'];

    // Valid element types
    this.validElementTypes = ['character', 'item', 'location', 'memory', 'base'];

    // Element type mappings
    this.typeMap = {
      'characters': 'character',
      'locations': 'location',
      'items': 'item',
      'memories': 'memory',
      'bases': 'base'
    };
  }

  // ==================== Public Tool Methods ====================

  async addElement(params) {
    try {
      return await this._executeWithTimeout(() => {
        return this._addElement(params);
      });
    } catch (error) {
      return this._handleError('addElement', error);
    }
  }

  async updateElementLocation(params) {
    try {
      return await this._executeWithTimeout(() => {
        return this._updateElementLocation(params);
      });
    } catch (error) {
      return this._handleError('updateElementLocation', error);
    }
  }

  async updateElementDescription(params) {
    try {
      return await this._executeWithTimeout(() => {
        return this._updateElementDescription(params);
      });
    } catch (error) {
      return this._handleError('updateElementDescription', error);
    }
  }

  async updateParagraphTimestamp(params) {
    try {
      return await this._executeWithTimeout(() => {
        return this._updateParagraphTimestamp(params);
      });
    } catch (error) {
      return this._handleError('updateParagraphTimestamp', error);
    }
  }

  async getContextInfo(params) {
    try {
      return await this._executeWithTimeout(() => {
        return this._getContextInfo(params);
      });
    } catch (error) {
      return this._handleError('getContextInfo', error);
    }
  }

  async listElements(params) {
    try {
      return await this._executeWithTimeout(() => {
        return this._listElements(params);
      });
    } catch (error) {
      return this._handleError('listElements', error);
    }
  }

  // ==================== Private Implementation Methods ====================

  /**
   * Add element implementation
   * @private
   */
  _addElement(params) {
    const { type, name, description, keywords } = params;

    this._validateRequiredFields(params, ['type', 'name', 'description']);
    this._validateElementType(type);

    const element = this.elementManager.addElement({
      type,
      name,
      description,
      keywords
    });

    return {
      success: true,
      element: element.toJSON()
    };
  }

  /**
   * Update element location implementation
   * @private
   */
  _updateElementLocation(params) {
    const { elementId, location } = params;
    const element = this._resolveElement(elementId);

    this._validateLocation(location, element);

    element.location = location || null;
    this.elementManager.updateElement(element.id, element);

    return {
      success: true,
      message: `Element ${element.name} location updated to ${location || 'none'}`
    };
  }

  /**
   * Update element description implementation - Refactored
   * @private
   */
  _updateElementDescription(params) {
    const { elementId, description, stateDescription, keywords, status } = params;

    // Validate element exists
    const element = this._resolveElement(elementId);

    // Collect changes
    const changes = {};
    const updates = {};

    if (description !== undefined) {
      updates.description = description;
      changes.description = description;
    }

    if (stateDescription !== undefined) {
      updates.stateDescription = stateDescription;
      changes.stateDescription = stateDescription;
    }

    if (keywords !== undefined) {
      if (!Array.isArray(keywords)) {
        throw new Error('keywords must be an array');
      }
      // Validate all keywords are strings
      const invalidKeywords = keywords.filter(k => typeof k !== 'string');
      if (invalidKeywords.length > 0) {
        throw new Error('All keywords must be strings');
      }
      updates.keywords = keywords;
      changes.keywords = keywords;
    }

    if (status !== undefined) {
      // Add status keyword
      this.elementManager.addKeyword(elementId, status);
      changes.status = status;
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      this.elementManager.updateElement(elementId, updates);
    }

    return {
      success: true,
      message: `Element "${element.name}" description updated`,
      changes
    };
  }

  /**
   * Update paragraph timestamp implementation - Refactored
   * @private
   */
  _updateParagraphTimestamp(params) {
    const { paragraphId, narrativeType, referenceParagraphId, timeOffset, absoluteTime, relativeTime } = params;

    // Validate inputs
    const paragraph = this._findParagraphById(paragraphId);
    if (!paragraph) {
      throw new Error(`Paragraph not found: ${paragraphId}`);
    }

    this._validateNarrativeType(narrativeType);

    if (referenceParagraphId) {
      const referenceParagraph = this._findParagraphById(referenceParagraphId);
      if (!referenceParagraph) {
        throw new Error(`Reference paragraph not found: ${referenceParagraphId}`);
      }
    }

    // Create or get existing timestamp
    const timestamp = this._createOrUpdateTimestamp(paragraph, narrativeType, referenceParagraphId);

    // Apply time updates
    this._applyTimeUpdates(timestamp, narrativeType, referenceParagraphId, timeOffset, absoluteTime, relativeTime);

    // Update paragraph and timeline
    paragraph.storyTimestamp = timestamp.toJSON();
    this.stateTimeline.indexParagraphTimestamp(paragraphId, timestamp);

    return {
      success: true,
      message: `Paragraph timestamp updated to ${timestamp.narrativeType || 'default'}`,
      timestamp: timestamp.toJSON()
    };
  }

  /**
   * Get context info implementation - Refactored with reduced nesting
   * @private
   */
  _getContextInfo(params) {
    const { chapterId, paragraphId } = params || {};

    // Get all locations
    const locations = this.elementManager.listElements('location');
    const locationNames = locations.map(loc => loc.name);

    // Early return if no chapter info provided
    if (!chapterId || !this.storyData.chapters) {
      return {
        success: true,
        data: {
          currentLocation: null,
          locations: locationNames,
          elementsAtLocation: [],
          totalLocations: locations.length
        }
      };
    }

    const chapter = this.storyData.chapters.find(c => c.id === chapterId);
    
    // Early return if no chapter found
    if (!chapter || !chapter.paragraphs) {
      return {
        success: true,
        data: {
          currentLocation: null,
          locations: locationNames,
          elementsAtLocation: [],
          totalLocations: locations.length
        }
      };
    }

    // Search for location changes
    const locationResult = this._findCurrentLocation(chapter, paragraphId);
    
    return {
      success: true,
      data: {
        currentLocation: locationResult.currentLocation,
        locations: locationNames,
        elementsAtLocation: locationResult.elementsAtLocation,
        totalLocations: locations.length
      }
    };
  }

  /**
   * List elements implementation
   * @private
   */
  _listElements(params) {
    const { types } = params || {};

    // Return all elements if no types specified
    if (!types || !Array.isArray(types) || types.length === 0) {
      return this._buildAllElementsResponse();
    }

    return this._buildFilteredElementsResponse(types);
  }

  // ==================== Helper Methods ====================

  /**
   * Validate required fields
   * @private
   */
  _validateRequiredFields(params, requiredFields) {
    const missingFields = requiredFields.filter(field => !params[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validate element type
   * @private
   */
  _validateElementType(type) {
    if (!this.validElementTypes.includes(type)) {
      throw new Error(`Invalid element type: ${type}`);
    }
  }

  /**
   * Validate narrative type
   * @private
   */
  _validateNarrativeType(narrativeType) {
    if (narrativeType && !this.validNarrativeTypes.includes(narrativeType)) {
      throw new Error(`Invalid narrative type: ${narrativeType}`);
    }
  }

  /**
   * Validate location
   * @private
   */
  _validateLocation(location, element) {
    if (location !== null && location !== undefined) {
      const locationElement = this.elementManager.getElement(location);
      if (!locationElement) {
        const locationByName = this.elementManager.findElementByName(location);
        if (!locationByName) {
          throw new Error(`Location not found: ${location}`);
        }
      }
    }
  }

  /**
   * Resolve element by ID or name
   * @private
   */
  _resolveElement(elementId) {
    let element = this.elementManager.getElement(elementId);
    
    if (!element) {
      element = this.elementManager.findElementByName(elementId);
      if (!element) {
        throw new Error(`Element not found: ${elementId}`);
      }
    }
    
    return element;
  }

  /**
   * Create or update timestamp
   * @private
   */
  _createOrUpdateTimestamp(paragraph, narrativeType, referenceParagraphId) {
    if (paragraph.storyTimestamp) {
      return new StoryTimestamp(paragraph.storyTimestamp);
    }

    return new StoryTimestamp({
      chapterId: this._extractChapterId(paragraphId),
      sequence: this._extractSequence(paragraph.id)
    });
  }

  /**
   * Apply time updates to timestamp
   * @private
   */
  _applyTimeUpdates(timestamp, narrativeType, referenceParagraphId, timeOffset, absoluteTime, relativeTime) {
    if (narrativeType) {
      const calculatedOffset = this._calculateTimeOffset(narrativeType, referenceParagraphId, timestamp, timeOffset);
      timestamp.setNarrativeType(narrativeType, referenceParagraphId, calculatedOffset);
    }

    if (absoluteTime !== undefined) {
      timestamp.setAbsoluteTime(absoluteTime);
    }

    if (relativeTime !== undefined) {
      timestamp.setRelativeTime(relativeTime);
    }
  }

  /**
   * Calculate time offset
   * @private
   */
  _calculateTimeOffset(narrativeType, referenceParagraphId, timestamp, providedOffset) {
    // Use provided offset if available
    if (providedOffset !== undefined) {
      return providedOffset;
    }

    // Calculate offset for non-linear narrative types
    if (referenceParagraphId && narrativeType !== 'linear') {
      const referenceParagraph = this._findParagraphById(referenceParagraphId);
      
      if (referenceParagraph && referenceParagraph.storyTimestamp) {
        const refSequence = referenceParagraph.storyTimestamp.sequence;
        const currentSequence = timestamp.sequence;

        const offsetCalculators = {
          'flashback': () => refSequence - currentSequence - 10,
          'flashforward': () => refSequence - currentSequence + 10,
          'parallel': () => 0
        };

        const calculator = offsetCalculators[narrativeType];
        if (calculator) {
          return calculator();
        }
      }
    }

    return undefined;
  }

  /**
   * Find current location in chapter
   * @private
   */
  _findCurrentLocation(chapter, paragraphId) {
    let currentLocation = null;
    let elementsAtLocation = [];

    // Search backwards from end of chapter
    for (let i = chapter.paragraphs.length - 1; i >= 0; i--) {
      const paragraph = chapter.paragraphs[i];

      // Stop at target paragraph if specified
      if (paragraphId && paragraph.id === paragraphId) {
        break;
      }

      // Check for location changes
      const locationChange = this._findLocationChange(paragraph);
      
      if (locationChange) {
        currentLocation = locationChange;
        
        // Get elements at this location
        if (currentLocation) {
          elementsAtLocation = this._getElementsAtLocation(currentLocation);
        }

        // Found location change, stop searching
        break;
      }

      // Stop searching if we found a location
      if (currentLocation) {
        break;
      }
    }

    return { currentLocation, elementsAtLocation };
  }

  /**
   * Find location change in paragraph
   * @private
   */
  _findLocationChange(paragraph) {
    if (!paragraph.changes || !paragraph.changes.elements) {
      return null;
    }

    for (const elementChange of paragraph.changes.elements) {
      if (elementChange.stateChanges?.location) {
        return elementChange.stateChanges.location;
      }
    }

    return null;
  }

  /**
   * Get elements at location
   * @private
   */
  _getElementsAtLocation(location) {
    return this.elementManager.getElementsAtLocation(location)
      .map(el => ({
        id: el.id,
        name: el.name,
        type: el.type
      }));
  }

  /**
   * Build response for all elements
   * @private
   */
  _buildAllElementsResponse() {
    const allElements = this.elementManager.listElements();
    return {
      success: true,
      data: {
        elements: this._formatElements(allElements),
        total: allElements.length
      }
    };
  }

  /**
   * Build response for filtered elements
   * @private
   */
  _buildFilteredElementsResponse(types) {
    const result = {
      success: true,
      data: {
        elements: [],
        byType: {},
        total: 0
      }
    };

    for (const type of types) {
      const internalType = this.typeMap[type];
      
      if (!internalType) {
        console.warn(`[AIElementTools] Unknown element type: ${type}`);
        continue;
      }

      const elements = this.elementManager.listElements(internalType);
      const formattedElements = this._formatElements(elements);

      result.data.elements.push(...formattedElements);
      result.data.byType[type] = formattedElements.map(el => el.name);
    }

    result.data.total = result.data.elements.length;
    return result;
  }

  /**
   * Format elements for response
   * @private
   */
  _formatElements(elements) {
    return elements.map(el => ({
      id: el.id,
      type: el.type,
      name: el.name,
      description: el.description
    }));
  }

  /**
   * Find paragraph by ID
   * @private
   */
  _findParagraphById(paragraphId) {
    if (!this.storyData.chapters) {
      return undefined;
    }

    for (const chapter of this.storyData.chapters) {
      if (chapter.paragraphs) {
        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (paragraph) {
          return paragraph;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract chapter ID from paragraph ID
   * @private
   */
  _extractChapterId(paragraphId) {
    const parts = paragraphId.split('-');
    if (parts.length >= 2) {
      parts.pop(); // Remove sequence number
      return parts.join('-');
    }
    return paragraphId;
  }

  /**
   * Extract sequence number from paragraph ID
   * @private
   */
  _extractSequence(paragraphId) {
    const parts = paragraphId.split('-');
    if (parts.length >= 1) {
      const lastPart = parts[parts.length - 1];
      const sequence = parseInt(lastPart, 10);
      return isNaN(sequence) ? 0 : sequence;
    }
    return 0;
  }

  /**
   * Execute with timeout
   * @private
   */
  _executeWithTimeout(fn) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tool execution timeout'));
      }, this.toolTimeout);

      try {
        const result = fn();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Handle error
   * @private
   */
  _handleError(toolName, error) {
    console.error(`AI tool error [${toolName}]:`, error);

    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }

  // ==================== Tool Definitions ====================

  getToolDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'listElements',
          description: '列出指定类型的元素，用于查询已存在的元素（人物、地点、道具等）',
          parameters: {
            type: 'object',
            properties: {
              types: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['characters', 'locations', 'items', 'memories', 'bases']
                },
                description: '元素类型数组，如 ["locations", "characters"]'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getContextInfo',
          description: '获取当前上下文信息，包括当前地点、所有地点列表、在当前地点的元素等',
          parameters: {
            type: 'object',
            properties: {
              chapterId: {
                type: 'string',
                description: '章节 ID（可选）'
              },
              paragraphId: {
                type: 'string',
                description: '段落 ID（可选）'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'addElement',
          description: '添加新元素到故事中',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['character', 'item', 'location', 'memory', 'base'],
                description: '元素类型'
              },
              name: {
                type: 'string',
                description: '元素名称'
              },
              description: {
                type: 'string',
                description: '元素描述'
              },
              keywords: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '关键词数组（可选）'
              }
            },
            required: ['type', 'name', 'description']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'updateElementLocation',
          description: '更新元素的位置',
          parameters: {
            type: 'object',
            properties: {
              elementId: {
                type: 'string',
                description: '元素 ID 或名称'
              },
              location: {
                type: 'string',
                description: '新位置 ID（设置为 null 移除位置）'
              }
            },
            required: ['elementId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'updateElementDescription',
          description: '更新元素的描述、状态描述、关键词和状态信息',
          parameters: {
            type: 'object',
            properties: {
              elementId: {
                type: 'string',
                description: '元素 ID 或名称'
              },
              description: {
                type: 'string',
                description: '元素描述（可选）'
              },
              stateDescription: {
                type: 'string',
                description: '状态描述对象（可选）'
              },
              keywords: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '关键词数组（可选）'
              },
              status: {
                type: 'string',
                description: '状态关键词，如 "破损"、"被遗忘" 等（可选）'
              }
            },
            required: ['elementId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'updateParagraphTimestamp',
          description: '更新段落的时间戳信息，支持叙事类型、参考段落等',
          parameters: {
            type: 'object',
            properties: {
              paragraphId: {
                type: 'string',
                description: '段落 ID'
              },
              narrativeType: {
                type: 'string',
                enum: ['linear', 'flashback', 'flashforward', 'parallel'],
                description: '叙事类型'
              },
              referenceParagraphId: {
                type: 'string',
                description: '参考段落 ID（用于计算时间偏移）'
              },
              timeOffset: {
                type: 'number',
                description: '时间偏移值（可选）'
              },
              absoluteTime: {
                type: 'string',
                description: '绝对时间（可选）'
              },
              relativeTime: {
                type: 'number',
                description: '相对时间（可选）'
              }
            },
            required: ['paragraphId']
          }
        }
      }
    ];
  }
}
