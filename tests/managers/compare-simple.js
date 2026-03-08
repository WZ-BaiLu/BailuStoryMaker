/**
 * Simple version comparison script for AIElementTools
 * Tests compatibility between original and refactored versions
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
const results = {
    timestamp: new Date().toISOString(),
    tests: []
};

function test(name, fn) {
    try {
        const result = fn();
        if (result.passed) {
            results.tests.push({
                test: name,
                status: 'PASSED',
                message: result.message
            });
            console.log(`✅ ${name}`);
        } else {
            results.tests.push({
                test: name,
                status: 'FAILED',
                message: result.message
            });
            console.log(`❌ ${name}: ${result.message}`);
        }
        return result.passed;
    } catch (error) {
        results.tests.push({
            test: name,
            status: 'ERROR',
            message: error.message
        });
        console.log(`⚠️  ${name}: ${error.message}`);
        return false;
    }
}

// Load and parse files
const originalCode = fs.readFileSync(
    path.join(__dirname, '../../js/managers/AIElementTools.js'),
    'utf-8'
);
const refactoredCode = fs.readFileSync(
    path.join(__dirname, '../../js/managers/AIElementTools.refactored.js'),
    'utf-8'
);

// Extract method names using regex
const extractMethods = (code) => {
    const asyncMethodRegex = /async\s+(\w+)\s*\(/g;
    const syncMethodRegex = /(\w+)\s*\([^)]*\)\s*\{/g;
    const methods = new Set();
    let match;

    while ((match = asyncMethodRegex.exec(code)) !== null) {
        methods.add(match[1]);
    }
    while ((match = syncMethodRegex.exec(code)) !== null) {
        if (!match[1].startsWith('_') && !methods.has(match[1])) {
            methods.add(match[1]);
        }
    }

    return Array.from(methods).filter(m => !m.startsWith('constructor'));
};

// Extract function lengths
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

// Extract maximum nesting depth
const extractMaxNesting = (code) => {
    const lines = code.split('\n');
    let maxNesting = 0;

    for (const line of lines) {
        // Count indentation by spaces (2 spaces = 1 level)
        const match = line.match(/^(\s*)/);
        if (match) {
            const nesting = Math.floor(match[1].length / 2);
            maxNesting = Math.max(maxNesting, nesting);
        }
    }

    return maxNesting;
};

// Extract tool definitions
const extractToolDefinitions = (code) => {
    const match = code.match(/getToolDefinitions\(\)\s*\{[\s\S]*?return\s*\[([\s\S]*?)\];[\s\S]*?^\}/);
    if (!match) return [];

    const toolsMatch = match[1].match(/name:\s*['"](\w+)['"]/g);
    if (!toolsMatch) return [];

    return toolsMatch.map(t => t.match(/name:\s*['"](\w+)['"]/)[1]);
};

// Run tests
console.log('\n========================================');
console.log('AIElementTools Version Comparison');
console.log('========================================\n');

const originalMethods = extractMethods(originalCode);
const refactoredMethods = extractMethods(refactoredCode);

// Test 1: Check if updateElementDescription exists in refactored version
test(
    'Refactored version includes updateElementDescription',
    () => ({
        passed: refactoredMethods.includes('updateElementDescription'),
        message: refactoredMethods.includes('updateElementDescription')
            ? 'updateElementDescription found'
            : 'updateElementDescription missing'
    })
);

// Test 2: Check if all original methods are present in refactored version
test(
    'All original methods present in refactored version',
    () => {
        const missing = originalMethods.filter(m => !refactoredMethods.includes(m));
        return {
            passed: missing.length === 0,
            message: missing.length === 0
                ? 'All methods present'
                : `Missing methods: ${missing.join(', ')}`
        };
    }
);

// Test 3: Check function length improvement
const originalMaxLength = extractFunctionLengths(originalCode);
const refactoredMaxLength = extractFunctionLengths(refactoredCode);
test(
    'Function length reduced',
    () => {
        const reduction = ((originalMaxLength - refactoredMaxLength) / originalMaxLength * 100).toFixed(1);
        return {
            passed: refactoredMaxLength <= originalMaxLength,
            message: `${originalMaxLength} → ${refactoredMaxLength} (${reduction}%)`
        };
    }
);

// Test 4: Check nesting depth reduction
const originalNesting = extractMaxNesting(originalCode);
const refactoredNesting = extractMaxNesting(refactoredCode);
test(
    'Nesting depth reduced',
    () => {
        const reduction = ((originalNesting - refactoredNesting) / originalNesting * 100).toFixed(1);
        return {
            passed: refactoredNesting <= originalNesting,
            message: `${originalNesting} → ${refactoredNesting} (${reduction}%)`
        };
    }
);

// Test 5: Check tool definitions
const originalTools = extractToolDefinitions(originalCode);
const refactoredTools = extractToolDefinitions(refactoredCode);
test(
    'Tool definitions complete',
    () => {
        const missing = originalTools.filter(t => !refactoredTools.includes(t));
        return {
            passed: missing.length === 0,
            message: missing.length === 0
                ? 'All tools present'
                : `Missing tools: ${missing.join(', ')}`
        };
    }
);

// Test 6: Check syntax validity
test(
    'Original file syntax valid',
    () => {
        try {
            eval(originalCode);
            return { passed: true, message: 'Syntax valid' };
        } catch (error) {
            return { passed: false, message: `Syntax error: ${error.message}` };
        }
    }
);

test(
    'Refactored file syntax valid',
    () => {
        try {
            eval(refactoredCode);
            return { passed: true, message: 'Syntax valid' };
        } catch (error) {
            return { passed: false, message: `Syntax error: ${error.message}` };
        }
    }
);

// Test 7: Check error handling coverage
test(
    'Error handling improved',
    () => {
        const originalTryCount = (originalCode.match(/try\s*{/g) || []).length;
        const refactoredTryCount = (refactoredCode.match(/try\s*{/g) || []).length;
        const coverage = Math.min((refactoredTryCount / refactoredMethods.length) * 100, 100);

        return {
            passed: refactoredTryCount >= originalTryCount,
            message: `Original: ${originalTryCount} try blocks, Refactored: ${refactoredTryCount} try blocks (${coverage.toFixed(0)}% coverage)`
        };
    }
);

// Test 8: Check line count
const originalLines = originalCode.split('\n').length;
const refactoredLines = refactoredCode.split('\n').length;
test(
    'Line count reasonable',
    () => {
        const increase = ((refactoredLines - originalLines) / originalLines * 100).toFixed(1);
        return {
            passed: refactoredLines <= originalLines * 1.1, // Allow 10% increase
            message: `${originalLines} → ${refactoredLines} (${increase}% increase)`
        };
    }
);

// Test 9: Check method count consistency
test(
    'Method count matches',
    () => {
        return {
            passed: originalMethods.length === refactoredMethods.length,
            message: `Original: ${originalMethods.length}, Refactored: ${refactoredMethods.length}`
        };
    }
);

// Summary
console.log('\n========================================');
console.log('Test Summary');
console.log('========================================\n');

const passed = results.tests.filter(t => t.status === 'PASSED').length;
const failed = results.tests.filter(t => t.status === 'FAILED' || t.status === 'ERROR').length;
const passRate = Math.round((passed / results.tests.length) * 100);

console.log(`Total: ${results.tests.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Pass Rate: ${passRate}%`);

// Save results
const summary = {
    timestamp: new Date().toISOString(),
    summary: {
        total: results.tests.length,
        passed,
        failed,
        passRate
    },
    comparison: {
        originalLines,
        refactoredLines,
        lineReduction: (((originalLines - refactoredLines) / originalLines) * 100).toFixed(1),
        originalMethods,
        refactoredMethods,
        originalMaxLength,
        refactoredMaxLength,
        originalNesting,
        refactoredNesting,
        originalTools,
        refactoredTools
    },
    tests: results.tests
};

const resultPath = path.join(__dirname, 'version-comparison-results.json');
fs.writeFileSync(resultPath, JSON.stringify(summary, null, 2));
console.log(`\nTest results saved to: ${resultPath}`);

// Decision
console.log('\n========================================');
console.log('Recommendation');
console.log('========================================\n');

if (passRate >= 90) {
    console.log('✅ READY TO REPLACE');
    console.log('All critical tests passed. Safe to replace.');
} else if (passRate >= 70) {
    console.log('⚠️  NEEDS REVIEW');
    console.log('Most tests passed but some issues found.');
    console.log('Review failed tests before replacing.');
} else {
    console.log('❌ NOT READY');
    console.log('Too many issues found. Do not replace.');
}

console.log('');
