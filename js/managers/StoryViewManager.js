/**
 * StoryViewManager - 故事视角管理器
 * 管理故事视角，根据所在地判断元素是否在场
 */

class StoryViewManager {
  constructor(elementManager, stateTimeline) {
    this.elementManager = elementManager;
    this.stateTimeline = stateTimeline;

    // 当前视角位置
    this.currentViewLocation = null;

    // 在场元素缓存
    this.presentElements = new Set();
  }

  /**
   * 设置当前视角位置
   * @param {string} locationId - 地点元素 ID
   */
  setViewLocation(locationId) {
    // 验证地点是否存在
    const location = this.elementManager.getElement(locationId);
    if (!location || location.type !== 'location') {
      throw new Error(`Invalid view location: ${locationId}`);
    }

    this.currentViewLocation = locationId;

    // 更新在场元素
    this._updatePresentElements();
  }

  /**
   * 获取当前视角位置
   * @returns {string|null} 当前视角位置 ID
   */
  getViewLocation() {
    return this.currentViewLocation;
  }

  /**
   * 更新在场元素列表
   * @private
   */
  _updatePresentElements() {
    this.presentElements.clear();

    if (!this.currentViewLocation) {
      return;
    }

    // 添加视图位置本身到在场元素
    this.presentElements.add(this.currentViewLocation);

    // 获取在当前地点的所有元素
    const elementsAtLocation = this.elementManager.getElementsAtLocation(
      this.currentViewLocation
    );

    // 添加到场元素集合
    elementsAtLocation.forEach(element => {
      this.presentElements.add(element.id);

      // 如果是地点，递归添加该地点内的元素
      if (element.type === 'location') {
        this._addNestedLocationElements(element.id);
      }
    });
  }

  /**
   * 递归添加嵌套地点的元素
   * @private
   */
  _addNestedLocationElements(locationId) {
    const nestedElements = this.elementManager.getElementsAtLocation(locationId);

    nestedElements.forEach(element => {
      this.presentElements.add(element.id);

      if (element.type === 'location') {
        this._addNestedLocationElements(element.id);
      }
    });
  }

  /**
   * 判断元素是否在场
   * @param {string} elementId - 元素 ID
   * @returns {boolean} 是否在场
   */
  isElementPresent(elementId) {
    return this.presentElements.has(elementId);
  }

  /**
   * 获取所有在场元素
   * @returns {Array} 在场元素列表
   */
  getPresentElements() {
    return Array.from(this.presentElements).map(id =>
      this.elementManager.getElement(id)
    ).filter(e => e !== undefined);
  }

  /**
   * 获取在场人物
   * @returns {Array} 在场人物列表
   */
  getPresentCharacters() {
    return this.getPresentElements().filter(e => e.type === 'character');
  }

  /**
   * 获取在场道具
   * @returns {Array} 在场道具列表
   */
  getPresentItems() {
    return this.getPresentElements().filter(e => e.type === 'item');
  }

  /**
   * 获取在场地点
   * @returns {Array} 在场地点列表
   */
  getPresentLocations() {
    return this.getPresentElements().filter(e => e.type === 'location');
  }

  /**
   * 获取指定段落时的在场元素
   * @param {string} paragraphId - 段落 ID
   * @param {string} locationId - 地点 ID
   * @returns {Array} 在场元素列表
   */
  getPresentElementsAt(paragraphId, locationId) {
    // 获取在该地点的所有元素
    const elementsAtLocation = this.elementManager.listElements().filter(element => {
      const state = this.stateTimeline.getElementStateAt(paragraphId, element.id);
      return state.location === locationId;
    });

    // 递归添加嵌套地点的元素
    const presentIds = new Set(elementsAtLocation.map(e => e.id));

    elementsAtLocation.filter(e => e.type === 'location').forEach(location => {
      this._addNestedLocationElementsAt(paragraphId, location.id, presentIds);
    });

    return Array.from(presentIds).map(id =>
      this.elementManager.getElement(id)
    ).filter(e => e !== undefined);
  }

  /**
   * 递归添加嵌套地点的元素（指定段落）
   * @private
   */
  _addNestedLocationElementsAt(paragraphId, locationId, presentIds) {
    const nestedElements = this.elementManager.listElements().filter(element => {
      const state = this.stateTimeline.getElementStateAt(paragraphId, element.id);
      return state.location === locationId;
    });

    nestedElements.forEach(element => {
      presentIds.add(element.id);

      if (element.type === 'location') {
        this._addNestedLocationElementsAt(paragraphId, element.id, presentIds);
      }
    });
  }

  /**
   * 切换视角到指定人物所在地点
   * @param {string} characterId - 人物 ID
   */
  switchViewToCharacter(characterId) {
    const character = this.elementManager.getElement(characterId);

    if (!character) {
      throw new Error(`Character not found: ${characterId}`);
    }

    if (!character.location) {
      throw new Error(`Character "${character.name}" has no location`);
    }

    this.setViewLocation(character.location);
  }

  /**
   * 切换视角到指定地点
   * @param {string} locationId - 地点 ID
   */
  switchViewToLocation(locationId) {
    this.setViewLocation(locationId);
  }

  /**
   * 检查两个地点是否相连（可通过嵌套关系）
   * @param {string} locationId1 - 地点 1 ID
   * @param {string} locationId2 - 地点 2 ID
   * @returns {boolean} 是否相连
   */
  areLocationsConnected(locationId1, locationId2) {
    // 简化版：检查是否是同一个地点或嵌套关系
    const location1 = this.elementManager.getElement(locationId1);
    const location2 = this.elementManager.getElement(locationId2);

    if (!location1 || !location2) {
      return false;
    }

    if (locationId1 === locationId2) {
      return true;
    }

    // 检查嵌套关系
    const state1 = location1.location === locationId2;
    const state2 = location2.location === locationId1;

    return state1 || state2;
  }

  /**
   * 获取可切换的视角选项
   * @returns {Array} 视角选项列表
   */
  getAvailableViewOptions() {
    const options = [];
    const locations = this.elementManager.listElements('location');

    locations.forEach(location => {
      const elementsAtLocation = this.elementManager.getElementsAtLocation(location.id);
      const characters = elementsAtLocation.filter(e => e.type === 'character');

      options.push({
        type: 'location',
        id: location.id,
        name: location.name,
        characterCount: characters.length
      });

      // 添加人物视角选项
      characters.forEach(character => {
        options.push({
          type: 'character',
          id: character.id,
          name: character.name,
          locationId: location.id,
          locationName: location.name
        });
      });
    });

    return options;
  }

  /**
   * 清除当前视角
   */
  clearView() {
    this.currentViewLocation = null;
    this.presentElements.clear();
  }

  /**
   * 刷新在场元素（当元素位置变更时调用）
   */
  refreshPresentElements() {
    this._updatePresentElements();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StoryViewManager;
}
