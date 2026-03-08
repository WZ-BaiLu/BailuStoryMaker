/**
 * AIElementTools 版本对比测试
 * 比较原版本和重构版本的功能兼容性
 */

const fs = require('fs');
const path = require('path');

// 测试结果统计
const testStats = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

function recordResult(testId, passed, message) {
    testStats.total++;
    if (passed) {
        testStats.passed++;
    } else {
        testStats.failed++;
    }
    testStats.tests.push({ testId, passed, message });
}

// Mock dependencies
const mockElementManager = {
    addElement: (element) => ({
        id: 'test-id',
        toJSON: () => element
    }),
    getElement: (id) => ({
        id: id,
        name: 'Test Element'
    }),
    findElementByName: (name) => ({
        id: 'test-id',
        name: name
    }),
    updateElement: (id, updates) => ({
        ...updates,
        id: id
    }),
    deleteElement: (id) => true,
    getAllElements: () => [],
    getCharacters: () => [],
    getItems: () => [],
    getLocations: () => []
};

const mockStateTimeline = {
    updateElement: (id, updates) => {},
    getTimeline: () => [],
    addEvent: (event) => {}
};

const mockStoryData = {
    characters: [],
    items: [],
    locations: [],
    paragraphs: []
};

console.log('\n========================================');
console.log('AIElementTools 版本对比测试');
console.log('========================================\n');

// 读取原版本文件
const originalCode = fs.readFileSync(
    path.join(__dirname, '../../js/managers/AIElementTools.js'),
    'utf-8'
);

// 读取重构版本文件
const refactoredCode = fs.readFileSync(
    path.join(__dirname, '../../js/managers/AIElementTools.refactored.js'),
    'utf-8'
);

console.log('📋 文件对比\n');

// 测试 1: 文件大小对比
const originalLines = originalCode.split('\n').length;
const refactoredLines = refactoredCode.split('\n').length;
const lineReduction = ((originalLines - refactoredLines) / originalLines * 100).toFixed(1);
const passed1 = refactoredLines < originalLines;
recordResult('1.1', passed1, `行数减少: ${originalLines} → ${refactoredLines} (-${lineReduction}%)`);
console.log(`  ${passed1 ? '✅' : '❌'} 1.1 文件行数: ${originalLines} → ${refactoredLines} (-${lineReduction}%)`);

// 测试 2: 类结构对比
const hasOriginalClass = /class AIElementTools\s*{/.test(originalCode);
const hasRefactoredClass = /class AIElementTools\s*{/.test(refactoredCode);
const passed2 = hasOriginalClass && hasRefactoredClass;
recordResult('1.2', passed2, '类结构保持一致');
console.log(`  ${passed2 ? '✅' : '❌'} 1.2 类结构: ${hasOriginalClass && hasRefactoredClass ? '一致' : '不一致'}`);

// 测试 3: 公共方法对比
const extractMethods = (code) => {
    const methods = [];
    const regex = /async\s+(\w+)\s*\(/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        methods.push(match[1]);
    }
    return methods;
};

const originalMethods = extractMethods(originalCode);
const refactoredMethods = extractMethods(refactoredCode);
const passed3 = originalMethods.every(m => refactoredMethods.includes(m));
recordResult('1.3', passed3, `公共方法: ${originalMethods.join(', ')}`);
console.log(`  ${passed3 ? '✅' : '❌'} 1.3 公共方法: ${passed3 ? '一致' : '不一致'}`);

// 测试 4: 私有方法对比
const extractPrivateMethods = (code) => {
    const methods = [];
    const regex = /_(\w+)\s*\(/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        methods.push(match[1]);
    }
    return [...new Set(methods)]; // 去重
};

const originalPrivateMethods = extractPrivateMethods(originalCode);
const refactoredPrivateMethods = extractPrivateMethods(refactoredCode);
const passed4 = originalPrivateMethods.length <= refactoredPrivateMethods.length;
recordResult('1.4', passed4, `私有方法: ${originalPrivateMethods.length} → ${refactoredPrivateMethods.length}`);
console.log(`  ${passed4 ? '✅' : '❌'} 1.4 私有方法数量: ${originalPrivateMethods.length} → ${refactoredPrivateMethods.length}`);

// 测试 5: 错误处理对比
const hasTryCatch = (code) => {
    const tryCount = (code.match(/try\s*{/g) || []).length;
    const asyncCount = (code.match(/async\s+\w+\s*\(/g) || []).length;
    return tryCount / asyncCount;
};

const originalErrorHandling = hasTryCatch(originalCode);
const refactoredErrorHandling = hasTryCatch(refactoredCode);
const passed5 = refactoredErrorHandling >= originalErrorHandling;
recordResult('1.5', passed5, `错误处理覆盖率: ${(originalErrorHandling * 100).toFixed(0)}% → ${(refactoredErrorHandling * 100).toFixed(0)}%`);
console.log(`  ${passed5 ? '✅' : '❌'} 1.5 错误处理: ${(originalErrorHandling * 100).toFixed(0)}% → ${(refactoredErrorHandling * 100).toFixed(0)}%`);

console.log('\n📋 代码质量对比\n');

// 测试 6: 最大函数长度对比
const extractFunctions = (code) => {
    const functions = [];
    const regex = /(\w+)\s*\(.*\)\s*{/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        const funcStart = match.index;
        const funcEnd = code.indexOf('}', funcStart);
        const funcCode = code.substring(funcStart, funcEnd);
        functions.push({
            name: match[1],
            length: funcCode.split('\n').length
        });
    }
    return functions;
};

const originalFunctions = extractFunctions(originalCode);
const refactoredFunctions = extractFunctions(refactoredCode);

const originalMaxLength = Math.max(...originalFunctions.map(f => f.length));
const refactoredMaxLength = Math.max(...refactoredFunctions.map(f => f.length));
const passed6 = refactoredMaxLength < originalMaxLength;
recordResult('2.1', passed6, `最大函数长度: ${originalMaxLength} → ${refactoredMaxLength} 行`);
console.log(`  ${passed6 ? '✅' : '❌'} 2.1 最大函数长度: ${originalMaxLength} → ${refactoredMaxLength} 行`);

// 测试 7: 平均嵌套深度对比
const estimateNesting = (code) => {
    const lines = code.split('\n');
    let totalIndent = 0;
    let maxIndent = 0;
    
    lines.forEach(line => {
        const indent = line.search(/\S|$/);
        const nesting = Math.floor(indent / 2);
        totalIndent += nesting;
        maxIndent = Math.max(maxIndent, nesting);
    });
    
    return {
        average: Math.round(totalIndent / lines.length),
        max: maxIndent
    };
};

const originalNesting = estimateNesting(originalCode);
const refactoredNesting = estimateNesting(refactoredCode);
const passed7 = refactoredNesting.max < originalNesting.max;
recordResult('2.2', passed7, `最大嵌套深度: ${originalNesting.max} → ${refactoredNesting.max}`);
console.log(`  ${passed7 ? '✅' : '❌'} 2.2 最大嵌套深度: ${originalNesting.max} → ${refactoredNesting.max}`);

// 测试 8: 代码重复对比
const extractCommonPatterns = (code) => {
    const patterns = [
        /try\s*{[\s\S]*?}[\s\S]*?catch[\s\S]*?}/g,
        /if\s*\([^)]+\)\s*{[\s\S]*?}/g,
        /return\s*{[\s\S]*?}/g
    ];
    
    let totalMatches = 0;
    patterns.forEach(pattern => {
        const matches = code.match(pattern) || [];
        totalMatches += matches.length;
    });
    
    return totalMatches;
};

const originalPatterns = extractCommonPatterns(originalCode);
const refactoredPatterns = extractCommonPatterns(refactoredCode);
const patternReduction = ((originalPatterns - refactoredPatterns) / originalPatterns * 100).toFixed(1);
const passed8 = refactoredPatterns < originalPatterns;
recordResult('2.3', passed8, `代码模式重复: ${originalPatterns} → ${refactoredPatterns} (-${patternReduction}%)`);
console.log(`  ${passed8 ? '✅' : '❌'} 2.3 代码重复: ${originalPatterns} → ${refactoredPatterns} (-${patternReduction}%)`);

console.log('\n📋 语法验证\n');

// 测试 9: 重构版本语法验证
try {
    // 尝试解析重构版本（不会真正执行，只检查语法）
    const testEval = new Function(refactoredCode);
    const passed9 = true;
    recordResult('3.1', passed9, '重构版本语法正确');
    console.log(`  ${passed9 ? '✅' : '❌'} 3.1 重构版本语法: 正确`);
} catch (error) {
    const passed9 = false;
    recordResult('3.1', passed9, `语法错误: ${error.message}`);
    console.log(`  ${passed9 ? '✅' : '❌'} 3.1 重构版本语法: 错误 - ${error.message}`);
}

// 测试 10: 原版本语法验证
try {
    const testEval = new Function(originalCode);
    const passed10 = true;
    recordResult('3.2', passed10, '原版本语法正确');
    console.log(`  ${passed10 ? '✅' : '❌'} 3.2 原版本语法: 正确`);
} catch (error) {
    const passed10 = false;
    recordResult('3.2', passed10, `语法错误: ${error.message}`);
    console.log(`  ${passed10 ? '✅' : '❌'} 3.2 原版本语法: 错误 - ${error.message}`);
}

// 打印汇总
console.log('\n========================================');
console.log('测试结果汇总');
console.log('========================================\n');

const passRate = testStats.total > 0 ? 
    Math.round((testStats.passed / testStats.total) * 100) : 0;

console.log(`总计: ${testStats.total}`);
console.log(`✅ 通过: ${testStats.passed}`);
console.log(`❌ 失败: ${testStats.failed}`);
console.log(`通过率: ${passRate}%\n`);

if (testStats.failed > 0) {
    console.log('失败的测试:');
    testStats.tests
        .filter(t => !t.passed)
        .forEach(t => {
            console.log(`  ❌ ${t.testId}: ${t.message}`);
        });
    console.log();
}

// 保存结果到文件
const results = {
    timestamp: new Date().toISOString(),
    summary: {
        total: testStats.total,
        passed: testStats.passed,
        failed: testStats.failed,
        passRate: passRate
    },
    fileComparison: {
        originalLines,
        refactoredLines,
        lineReduction,
        originalMethods: originalMethods,
        refactoredMethods: refactoredMethods,
        originalMaxLength,
        refactoredMaxLength,
        originalNesting,
        refactoredNesting
    },
    tests: testStats.tests
};

fs.writeFileSync(
    path.join(__dirname, 'version-comparison-results.json'),
    JSON.stringify(results, null, 2)
);
console.log('测试结果已保存到: tests/managers/version-comparison-results.json\n');

// 退出码
process.exit(testStats.failed > 0 ? 1 : 0);
