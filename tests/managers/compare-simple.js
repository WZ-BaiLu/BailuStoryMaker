/**
 * AIElementTools 版本对比测试 - 简化版
 */

const fs = require('fs');
const path = require('path');

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
    console.log(`  ${passed ? '✅' : '❌'} ${testId}: ${message}`);
}

console.log('\n========================================');
console.log('AIElementTools 版本对比测试');
console.log('========================================\n');

// 读取文件
const originalCode = fs.readFileSync(
    path.join(__dirname, '../../js/managers/AIElementTools.js'),
    'utf-8'
);

const refactoredCode = fs.readFileSync(
    path.join(__dirname, '../../js/managers/AIElementTools.refactored.js'),
    'utf-8'
);

console.log('📋 文件对比\n');

// 测试 1: 文件大小
const originalLines = originalCode.split('\n').length;
const refactoredLines = refactoredCode.split('\n').length;
const lineReduction = ((originalLines - refactoredLines) / originalLines * 100).toFixed(1);
recordResult('1.1', refactoredLines <= originalLines, 
    `行数: ${originalLines} → ${refactoredLines} (-${lineReduction}%)`);

// 测试 2: 类结构
const hasOriginalClass = /class AIElementTools/.test(originalCode);
const hasRefactoredClass = /class AIElementTools/.test(refactoredCode);
recordResult('1.2', hasOriginalClass && hasRefactoredClass, '类结构一致');

// 测试 3: 公共方法
const extractAsyncMethods = (code) => {
    const methods = [];
    const regex = /async\s+(\w+)\s*\(/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        methods.push(match[1]);
    }
    return methods;
};

const originalMethods = extractAsyncMethods(originalCode);
const refactoredMethods = extractAsyncMethods(refactoredCode);
recordResult('1.3', originalMethods.every(m => refactoredMethods.includes(m)),
    `公共方法: ${originalMethods.length} 个`);

// 测试 4: 私有方法
const extractPrivateMethods = (code) => {
    const methods = [];
    const regex = /_([a-zA-Z]+)\s*\(/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        methods.push(match[1]);
    }
    return [...new Set(methods)];
};

const originalPrivateMethods = extractPrivateMethods(originalCode);
const refactoredPrivateMethods = extractPrivateMethods(refactoredCode);
recordResult('1.4', refactoredPrivateMethods.length >= originalPrivateMethods.length,
    `私有方法: ${originalPrivateMethods.length} → ${refactoredPrivateMethods.length}`);

console.log('\n📋 代码质量\n');

// 测试 5: 最大函数长度
const extractFunctionLengths = (code) => {
    const lengths = [];
    const regex = /(\w+)\s*\([^)]*\)\s*{/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        const funcStart = match.index;
        let braceLevel = 1;
        let bracePos = funcStart + match[0].length;

        while (braceLevel > 0 && bracePos < code.length) {
            if (code[bracePos] === '{') {
                braceLevel++;
            } else if (code[bracePos] === '}') {
                braceLevel--;
            }
            bracePos++;
        }

        const funcCode = code.substring(funcStart, bracePos);
        lengths.push(funcCode.split('\n').length);
    }

    return lengths.length > 0 ? Math.max(...lengths) : 0;
};

const originalMaxLength = extractFunctionLengths(originalCode);
const refactoredMaxLength = extractFunctionLengths(refactoredCode);
recordResult('2.1', refactoredMaxLength < originalMaxLength,
    `最大函数长度: ${originalMaxLength} → ${refactoredMaxLength} 行`);

// 测试 6: 嵌套深度
const estimateMaxNesting = (code) => {
    const lines = code.split('\n');
    let maxNesting = 0;
    
    lines.forEach(line => {
        const spaces = line.search(/\S|$/);
        if (spaces !== -1) {
            const nesting = Math.floor(spaces / 2);
            maxNesting = Math.max(maxNesting, nesting);
        }
    });
    
    return maxNesting;
};

const originalNesting = estimateMaxNesting(originalCode);
const refactoredNesting = estimateMaxNesting(refactoredCode);
recordResult('2.2', refactoredNesting < originalNesting,
    `最大嵌套深度: ${originalNesting} → ${refactoredNesting}`);

// 测试 7: 错误处理
const countTryCatch = (code) => {
    const tryMatches = code.match(/try\s*{/g) || [];
    const asyncMatches = code.match(/async\s+\w+\s*\(/g) || [];
    return asyncMatches.length > 0 ? (tryMatches.length / asyncMatches.length) : 0;
};

const originalErrorHandling = countTryCatch(originalCode);
const refactoredErrorHandling = countTryCatch(refactoredCode);
recordResult('2.3', refactoredErrorHandling >= originalErrorHandling,
    `错误处理覆盖率: ${(originalErrorHandling * 100).toFixed(0)}% → ${(refactoredErrorHandling * 100).toFixed(0)}%`);

console.log('\n📋 语法验证\n');

// 测试 8: 语法检查
try {
    new Function(refactoredCode);
    recordResult('3.1', true, '重构版本语法正确');
} catch (error) {
    recordResult('3.1', false, `语法错误: ${error.message}`);
}

try {
    new Function(originalCode);
    recordResult('3.2', true, '原版本语法正确');
} catch (error) {
    recordResult('3.2', false, `语法错误: ${error.message}`);
}

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
    testStats.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  ❌ ${t.testId}: ${t.message}`);
    });
    console.log();
}

const results = {
    timestamp: new Date().toISOString(),
    summary: {
        total: testStats.total,
        passed: testStats.passed,
        failed: testStats.failed,
        passRate: passRate
    },
    comparison: {
        originalLines,
        refactoredLines,
        lineReduction,
        originalMethods,
        refactoredMethods,
        originalMaxLength,
        refactoredMaxLength,
        originalNesting,
        refactoredNesting
    }
};

fs.writeFileSync(
    path.join(__dirname, 'version-comparison-results.json'),
    JSON.stringify(results, null, 2)
);
console.log('测试结果已保存到: tests/managers/version-comparison-results.json\n');

process.exit(testStats.failed > 0 ? 1 : 0);
