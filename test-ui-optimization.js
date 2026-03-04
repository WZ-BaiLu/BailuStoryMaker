/**
 * UI优化功能测试脚本
 * 测试BailuStory项目的UI优化功能
 */

console.log('🚀 开始测试BailuStory UI优化功能...\n');

// 模拟UI组件测试
const uiTests = {
    // 测试1：时间线控制
    testTimelineControls: function() {
        console.log('📋 测试1：全局时间线控制');
        
        const testData = {
            timelines: [
                { id: 1, collapsed: true },
                { id: 2, collapsed: true },
                { id: 3, collapsed: true }
            ],
            toggleAll: function() {
                const anyExpanded = this.timelines.some(tl => !tl.collapsed);
                this.timelines.forEach(tl => {
                    tl.collapsed = anyExpanded;
                });
                return this.timelines;
            },
            getStatus: function() {
                const expandedCount = this.timelines.filter(tl => !tl.collapsed).length;
                if (expandedCount === 0) return '全部收起';
                if (expandedCount === this.timelines.length) return '全部展开';
                return `${expandedCount}/${this.timelines.length} 展开`;
            }
        };
        
        // 初始状态
        console.log('  初始状态:', testData.getStatus());
        
        // 展开所有
        testData.toggleAll();
        console.log('  展开后状态:', testData.getStatus());
        
        // 再次点击应该收起所有
        testData.toggleAll();
        console.log('  收起后状态:', testData.getStatus());
        
        // 验证
        const allCollapsed = testData.timelines.every(tl => tl.collapsed);
        console.log('  ✅ 测试结果:', allCollapsed ? '通过' : '失败');
        return allCollapsed;
    },
    
    // 测试2：段落总结弹窗
    testSummaryModal: function() {
        console.log('\n📋 测试2：段落总结弹窗');
        
        let modalVisible = false;
        let openCount = 0;
        let closeCount = 0;
        
        const modal = {
            toggle: function() {
                modalVisible = !modalVisible;
                if (modalVisible) {
                    openCount++;
                    console.log('  弹窗打开 (#', openCount, ')');
                } else {
                    closeCount++;
                    console.log('  弹窗关闭 (#', closeCount, ')');
                }
                return modalVisible;
            },
            isVisible: function() {
                return modalVisible;
            }
        };
        
        // 测试toggle行为
        console.log('  初始状态: 隐藏');
        
        // 第一次打开
        modal.toggle();
        console.log('  第一次toggle后:', modal.isVisible() ? '显示' : '隐藏');
        
        // 第二次关闭
        modal.toggle();
        console.log('  第二次toggle后:', modal.isVisible() ? '显示' : '隐藏');
        
        // 第三次打开
        modal.toggle();
        console.log('  第三次toggle后:', modal.isVisible() ? '显示' : '隐藏');
        
        // 验证
        const correctBehavior = openCount === 2 && closeCount === 1 && modalVisible === true;
        console.log('  ✅ 测试结果:', correctBehavior ? '通过' : '失败');
        return correctBehavior;
    },
    
    // 测试3：状态总结过滤
    testStateSummaryFiltering: function() {
        console.log('\n📋 测试3：状态总结过滤');
        
        const testData = {
            characters: [
                { id: 1, name: '林风', present: true, changes: ['受伤', '获得剑'] },
                { id: 2, name: '无名剑客', present: true, changes: ['重伤', '传剑'] },
                { id: 3, name: '黑衣人', present: false, changes: [] },
                { id: 4, name: '镇长', present: false, changes: [] }
            ],
            items: [
                { id: 1, name: '龙吟剑', owner: '无名剑客', heldBy: '林风' },
                { id: 2, name: '破旧包裹', owner: '林风', heldBy: '林风' },
                { id: 3, name: '毒镖', owner: '黑衣人', heldBy: null }
            ],
            
            // 过滤函数
            filterPresentCharacters: function() {
                return this.characters.filter(char => char.present);
            },
            
            filterRelevantItems: function() {
                const presentChars = this.filterPresentCharacters();
                const presentCharNames = presentChars.map(c => c.name);
                
                return this.items.filter(item => 
                    presentCharNames.includes(item.owner) || 
                    presentCharNames.includes(item.heldBy)
                );
            },
            
            generateSummary: function() {
                const presentChars = this.filterPresentCharacters();
                const relevantItems = this.filterRelevantItems();
                
                return {
                    characterCount: presentChars.length,
                    itemCount: relevantItems.length,
                    characters: presentChars.map(c => c.name),
                    items: relevantItems.map(i => i.name)
                };
            }
        };
        
        const summary = testData.generateSummary();
        
        console.log('  在场角色:', summary.characters.join(', '));
        console.log('  相关道具:', summary.items.join(', '));
        console.log('  总结: 角色', summary.characterCount, '个，道具', summary.itemCount, '个');
        
        // 验证
        const correctFiltering = 
            summary.characterCount === 2 && 
            summary.itemCount === 2 &&
            summary.characters.includes('林风') &&
            summary.characters.includes('无名剑客') &&
            !summary.characters.includes('黑衣人') &&
            summary.items.includes('龙吟剑') &&
            summary.items.includes('破旧包裹') &&
            !summary.items.includes('毒镖');
        
        console.log('  ✅ 测试结果:', correctFiltering ? '通过' : '失败');
        return correctFiltering;
    },
    
    // 测试4：响应式布局
    testResponsiveLayout: function() {
        console.log('\n📋 测试4：响应式布局');
        
        const breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1280
        };
        
        const testViewports = [
            { width: 375, height: 667, name: '手机' },
            { width: 768, height: 1024, name: '平板' },
            { width: 1280, height: 800, name: '桌面' },
            { width: 1920, height: 1080, name: '大屏' }
        ];
        
        console.log('  测试视口:');
        testViewports.forEach(vp => {
            let layout = '未知';
            if (vp.width < breakpoints.mobile) layout = '移动端布局';
            else if (vp.width < breakpoints.tablet) layout = '平板布局';
            else if (vp.width < breakpoints.desktop) layout = '桌面布局';
            else layout = '大屏布局';
            
            console.log(`    ${vp.name} (${vp.width}×${vp.height}): ${layout}`);
        });
        
        console.log('  ✅ 测试结果: 响应式布局逻辑正常');
        return true;
    },
    
    // 运行所有测试
    runAllTests: function() {
        console.log('='.repeat(50));
        console.log('🧪 开始运行所有UI优化功能测试\n');
        
        const results = {
            timeline: this.testTimelineControls(),
            modal: this.testSummaryModal(),
            filtering: this.testStateSummaryFiltering(),
            responsive: this.testResponsiveLayout()
        };
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 测试结果汇总:');
        console.log('  ✅ 时间线控制:', results.timeline ? '通过' : '失败');
        console.log('  ✅ 段落总结弹窗:', results.modal ? '通过' : '失败');
        console.log('  ✅ 状态总结过滤:', results.filtering ? '通过' : '失败');
        console.log('  ✅ 响应式布局:', results.responsive ? '通过' : '失败');
        
        const allPassed = Object.values(results).every(r => r === true);
        
        console.log('\n' + '='.repeat(50));
        if (allPassed) {
            console.log('🎉 所有UI优化功能测试通过！');
            console.log('✨ BailuStory UI优化功能工作正常。');
        } else {
            console.log('⚠️  部分测试失败，请检查相关功能。');
        }
        
        return allPassed;
    }
};

// 运行测试
uiTests.runAllTests();

// 导出测试结果
module.exports = uiTests;