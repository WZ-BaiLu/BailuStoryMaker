/**
 * Paragraph State Summary Module
 *
 * 负责计算和格式化段落位置的角色和道具状态
 * 使用统一的 elements 元素系统
 */

class ParagraphStateSummary {
  /**
   * Create a new ParagraphStateSummary instance
   * @param {Object} story - Story data
   */
  constructor(story) {
    this.story = story;
  }

  /**
   * Update story data
   * @param {Object} story - New story data
   */
  updateStory(story) {
    this.story = story;
  }

  /**
   * 计算段落位置的角色和道具状态
   * @param {string} chapterId - 章节 ID
   * @param {string} paragraphId - 段落 ID
   * @returns {Object} 包含 characterStates、itemStates 和 locationStates 的对象
   */
  calculateStates(chapterId, paragraphId) {
    if (!this.story) {
      return { characterStates: {}, itemStates: {}, locationStates: {} };
    }

    const chapter = this.story.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return { characterStates: {}, itemStates: {}, locationStates: {} };
    }

    const paragraphIndex = chapter.paragraphs.findIndex(p => p.id === paragraphId);
    if (paragraphIndex === -1) {
      return { characterStates: {}, itemStates: {}, locationStates: {} };
    }

    // 收集出现在该段落之前的元素
    const presentCharacterIds = new Set();
    const presentItemIds = new Set();
    const presentLocationIds = new Set();

    for (let i = 0; i <= paragraphIndex; i++) {
      const p = chapter.paragraphs[i];
      this._extractElementIds(p, presentCharacterIds, presentItemIds, presentLocationIds);
    }

    // 初始化状态
    const characterStates = this._initializeCharacterStates(presentCharacterIds);
    const itemStates = this._initializeItemStates(presentItemIds);
    const locationStates = this._initializeLocationStates(presentLocationIds);

    // 应用变更
    for (let i = 0; i <= paragraphIndex; i++) {
      const p = chapter.paragraphs[i];
      this._applyChanges(p, characterStates, itemStates, locationStates);
    }

    return { characterStates, itemStates, locationStates };
  }

  /**
   * 从段落中提取元素 ID
   * @private
   */
  _extractElementIds(paragraph, characterIds, itemIds, locationIds) {
    // 使用统一的 elements 系统
    if (paragraph.changes?.elements) {
      paragraph.changes.elements.forEach(elementChange => {
        const element = this.story.elements?.find(e =>
          e.id === elementChange.elementId ||
          e.name === elementChange.elementName
        );

        if (element) {
          if (element.type === 'character') {
            characterIds.add(element.id);
          } else if (element.type === 'item') {
            itemIds.add(element.id);
          } else if (element.type === 'location') {
            locationIds.add(element.id);
          }
        }
      });
    }
  }

  /**
   * 初始化角色状态
   * @private
   */
  _initializeCharacterStates(characterIds) {
    const states = {};

    // 新系统（优先）
    if (this.story.elements) {
      this.story.elements.forEach(element => {
        if (element.type === 'character' && characterIds.has(element.id)) {
          states[element.id] = {
            id: element.id,
            name: element.name,
            location: element.location,
            description: element.description || '',
            keywords: element.keywords || [],
            stateDescription: element.stateDescription || {},
            emotionalState: 'neutral',
            heldItems: []
          };
        }
      });
    }

    // 旧系统（兼容）
    if (this.story.characters) {
      this.story.characters.forEach(char => {
        if (characterIds.has(char.id) && !states[char.id]) {
          states[char.id] = {
            id: char.id,
            name: char.name,
            location: char.location,
            description: char.description || '',
            keywords: char.keywords || [],
            attributes: { ...char.attributes.current },
            emotionalState: char.emotionalState || 'neutral',
            heldItems: char.heldItems || []
          };
        }
      });
    }

    return states;
  }

  /**
   * 初始化道具状态
   * @private
   */
  _initializeItemStates(itemIds) {
    const states = {};

    // 新系统（优先）
    if (this.story.elements) {
      this.story.elements.forEach(element => {
        if (element.type === 'item' && itemIds.has(element.id)) {
          states[element.id] = {
            id: element.id,
            name: element.name,
            location: element.location,
            description: element.description || '',
            keywords: element.keywords || [],
            stateDescription: element.stateDescription || {},
            action: 'none',
            properties: {},
            owner: null
          };
        }
      });
    }

    // 旧系统（兼容）
    if (this.story.items) {
      this.story.items.forEach(item => {
        if (itemIds.has(item.id) && !states[item.id]) {
          states[item.id] = {
            id: item.id,
            name: item.name,
            location: item.location,
            description: item.description || '',
            keywords: item.keywords || [],
            action: 'none',
            properties: { ...item.properties.current },
            owner: item.owner
          };
        }
      });
    }

    return states;
  }

  /**
   * 初始化地点状态
   * @private
   */
  _initializeLocationStates(locationIds) {
    const states = {};

    // 新系统
    if (this.story.elements) {
      this.story.elements.forEach(element => {
        if (element.type === 'location' && locationIds.has(element.id)) {
          states[element.id] = {
            id: element.id,
            name: element.name,
            location: element.location,
            description: element.description || '',
            keywords: element.keywords || [],
            stateDescription: element.stateDescription || {}
          };
        }
      });
    }

    return states;
  }

  /**
   * 应用段落变更到状态
   * @private
   */
  _applyChanges(paragraph, characterStates, itemStates, locationStates) {
    if (!paragraph.changes) return;

    // 使用统一的 elements 系统应用变更
    paragraph.changes.elements?.forEach(elementChange => {
      const element = this.story.elements?.find(e =>
        e.id === elementChange.elementId ||
        e.name === elementChange.elementName
      );

      if (!element) return;

      if (element.type === 'character' && characterStates[element.id]) {
        if (elementChange.property === 'location') {
          characterStates[element.id].location = elementChange.to || elementChange.changes?.location;
        }
        if (elementChange.property === 'description' && elementChange.changes) {
          Object.assign(characterStates[element.id].stateDescription, elementChange.changes);
        }
        // 支持旧系统的属性变更
        if (elementChange.changes?.attributes) {
          characterStates[element.id].attributes = {
            ...characterStates[element.id].attributes,
            ...elementChange.changes.attributes
          };
        }
        if (elementChange.changes?.emotionalState) {
          characterStates[element.id].emotionalState = elementChange.changes.emotionalState;
        }
      } else if (element.type === 'item' && itemStates[element.id]) {
        if (elementChange.property === 'location') {
          itemStates[element.id].location = elementChange.to || elementChange.changes?.location;
        }
        if (elementChange.property === 'description' && elementChange.changes) {
          Object.assign(itemStates[element.id].stateDescription, elementChange.changes);
        }
        // 支持旧系统的动作和属性变更
        if (elementChange.action) {
          itemStates[element.id].action = elementChange.action;
        }
        if (elementChange.changes?.properties) {
          itemStates[element.id].properties = {
            ...itemStates[element.id].properties,
            ...elementChange.changes.properties
          };
        }
      } else if (element.type === 'location' && locationStates[element.id]) {
        if (elementChange.property === 'description' && elementChange.changes) {
          Object.assign(locationStates[element.id].stateDescription, elementChange.changes);
        }
      }
    });
  }

  /**
   * 格式化状态为可读文本
   * @param {Object} characterStates - 角色状态
   * @param {Object} itemStates - 道具状态
   * @param {Object} locationStates - 地点状态
   * @returns {string} 格式化的状态文本
   */
  formatAsText(characterStates, itemStates, locationStates = {}) {
    let text = '';

    // 角色状态
    text += '## 角色状态\n';
    const chars = Object.values(characterStates);
    if (chars.length === 0) {
      text += '无角色\n';
    } else {
      chars.forEach(char => {
        text += `\n${char.name}\n`;
        if (char.location) text += `  位置: ${char.location}\n`;
        if (char.description) text += `  描述: ${char.description}\n`;
        if (char.keywords && char.keywords.length > 0) {
          text += `  关键词: ${char.keywords.join(', ')}\n`;
        }
      });
    }

    // 道具状态
    text += '\n## 道具状态\n';
    const items = Object.values(itemStates);
    if (items.length === 0) {
      text += '无道具\n';
    } else {
      items.forEach(item => {
        text += `\n${item.name}\n`;
        if (item.location) text += `  位置: ${item.location}\n`;
        if (item.description) text += `  描述: ${item.description}\n`;
        if (item.keywords && item.keywords.length > 0) {
          text += `  关键词: ${item.keywords.join(', ')}\n`;
        }
      });
    }

    // 地点状态
    text += '\n## 地点状态\n';
    const locations = Object.values(locationStates);
    if (locations.length === 0) {
      text += '无地点\n';
    } else {
      locations.forEach(loc => {
        text += `\n${loc.name}\n`;
        if (loc.location) text += `  所在位置: ${loc.location}\n`;
        if (loc.description) text += `  描述: ${loc.description}\n`;
        if (loc.keywords && loc.keywords.length > 0) {
          text += `  关键词: ${loc.keywords.join(', ')}\n`;
        }
      });
    }

    return text;
  }

  /**
   * 格式化状态为 HTML
   * @param {Object} characterStates - 角色状态
   * @param {Object} itemStates - 道具状态
   * @param {Object} locationStates - 地点状态
   * @param {Function} i18n - 国际化函数
   * @param {Function} translateEmotion - 情感翻译函数
   * @param {Function} getItemActionLabel - 道具动作标签函数
   * @returns {string} HTML 字符串
   */
  formatAsHTML(characterStates, itemStates, locationStates = {}, i18n, translateEmotion, getItemActionLabel) {
    return `
      <div class="modal" id="state-summary-modal">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h3>${i18n ? i18n('timeline.stateSummaryTitle') : '状态总结'}</h3>
            <button class="modal-close" onclick="document.getElementById('state-summary-modal').classList.add('hidden')">×</button>
          </div>
          <div class="modal-body">
            ${this._formatCharactersHTML(characterStates, i18n, translateEmotion)}
            ${this._formatItemsHTML(itemStates, i18n, getItemActionLabel)}
            ${this._formatLocationsHTML(locationStates, i18n)}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="document.getElementById('state-summary-modal').classList.add('hidden')">
              ${i18n ? i18n('buttons.confirm') : '确认'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 格式化角色状态为 HTML
   * @private
   */
  _formatCharactersHTML(characterStates, i18n, translateEmotion) {
    const chars = Object.values(characterStates);
    const emptyText = i18n ? i18n('timeline.noCharactersInParagraph') : '无角色';

    let html = `<h4>${i18n ? i18n('timeline.characterStates') : '角色状态'}</h4>`;
    html += '<div class="state-summary-section">';

    if (chars.length === 0) {
      html += `<div class="state-summary-empty">${emptyText}</div>`;
    } else {
      html += chars.map(char => `
        <div class="state-summary-item">
          <div class="state-summary-name">${char.name}</div>
          <div class="state-summary-details">
            ${char.location ? `<div class="state-summary-attr">📍 位置: ${char.location}</div>` : ''}
            ${char.description ? `<div class="state-summary-attr">📝 描述: ${char.description}</div>` : ''}
            ${char.keywords && char.keywords.length > 0 ? `
              <div class="state-summary-attr">🏷️ 关键词: ${char.keywords.join(', ')}</div>
            ` : ''}
            ${char.emotionalState ? `
              <div class="state-summary-emotion">${i18n ? i18n('timeline.emotionalState') : '情感状态'}: ${translateEmotion ? translateEmotion(char.emotionalState) : char.emotionalState}</div>
            ` : ''}
            ${Object.entries(char.attributes || {}).map(([key, value]) => `
              <div class="state-summary-attr">${key}: ${value}</div>
            `).join('')}
            ${Object.entries(char.stateDescription || {}).map(([key, value]) => `
              <div class="state-summary-attr">${key}: ${value}</div>
            `).join('')}
            ${char.heldItems && char.heldItems.length > 0 ? `
              <div class="state-summary-held-items">
                <div class="state-summary-label">${i18n ? i18n('character.heldItems') : '持有物品'}:</div>
                ${char.heldItems.map(itemId => {
                  const item = characterStates[itemId];
                  return item ? `<div class="state-summary-item-name">${item.name}</div>` : '';
                }).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    html += '</div>';
    return html;
  }

  /**
   * 格式化道具状态为 HTML
   * @private
   */
  _formatItemsHTML(itemStates, i18n, getItemActionLabel) {
    const items = Object.values(itemStates);
    const emptyText = i18n ? i18n('timeline.noItemsInParagraph') : '无道具';

    let html = `<h4>${i18n ? i18n('timeline.itemStates') : '道具状态'}</h4>`;
    html += '<div class="state-summary-section">';

    if (items.length === 0) {
      html += `<div class="state-summary-empty">${emptyText}</div>`;
    } else {
      html += items.map(item => {
        const actionLabel = item.action !== 'none' && getItemActionLabel
          ? ` (${getItemActionLabel(item.action)})`
          : '';

        return `
          <div class="state-summary-item">
            <div class="state-summary-name">${item.name}${actionLabel}</div>
            <div class="state-summary-details">
              ${item.location ? `<div class="state-summary-attr">📍 位置: ${item.location}</div>` : ''}
              ${item.description ? `<div class="state-summary-attr">📝 描述: ${item.description}</div>` : ''}
              ${item.keywords && item.keywords.length > 0 ? `
                <div class="state-summary-attr">🏷️ 关键词: ${item.keywords.join(', ')}</div>
              ` : ''}
              ${Object.entries(item.properties || {}).map(([key, value]) => `
                <div class="state-summary-attr">${key}: ${value}</div>
              `).join('')}
              ${Object.entries(item.stateDescription || {}).map(([key, value]) => `
                <div class="state-summary-attr">${key}: ${value}</div>
              `).join('')}
              ${item.owner ? `<div class="state-summary-attr">👤 持有者: ${item.owner}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    html += '</div>';
    return html;
  }

  /**
   * 格式化地点状态为 HTML
   * @private
   */
  _formatLocationsHTML(locationStates, i18n) {
    const locations = Object.values(locationStates);
    const emptyText = i18n ? '无地点' : '无地点';

    let html = `<h4>${i18n ? '地点状态' : '地点状态'}</h4>`;
    html += '<div class="state-summary-section">';

    if (locations.length === 0) {
      html += `<div class="state-summary-empty">${emptyText}</div>`;
    } else {
      html += locations.map(loc => `
        <div class="state-summary-item">
          <div class="state-summary-name">📍 ${loc.name}</div>
          <div class="state-summary-details">
            ${loc.location ? `<div class="state-summary-attr">🗺️ 所在位置: ${loc.location}</div>` : ''}
            ${loc.description ? `<div class="state-summary-attr">📝 描述: ${loc.description}</div>` : ''}
            ${loc.keywords && loc.keywords.length > 0 ? `
              <div class="state-summary-attr">🏷️ 关键词: ${loc.keywords.join(', ')}</div>
            ` : ''}
            ${Object.entries(loc.stateDescription || {}).map(([key, value]) => `
              <div class="state-summary-attr">${key}: ${value}</div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    html += '</div>';
    return html;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParagraphStateSummary;
}
