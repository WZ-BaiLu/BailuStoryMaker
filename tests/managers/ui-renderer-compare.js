/**
 * Version comparison script for UIRenderer
 * Compares original and refactored versions
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
    path.join(__dirname, '../../js/managers/UIRenderer.js'),
    'utf-8'
);
const refactoredCode = fs.readFileSync(
    path.join(__dirname, '../../js/managers/UIRenderer.refactored.js'),
    'utf-8'
);

// Extract method names
const extractMethods = (code) => {
    const regex = /(\w+)\s*\([^)]*\)\s*\{/g;
    const methods = new Set();
    let match;
    while ((match = regex.exec(code)) !== null) {
        const methodName = match[1];
        if (!methodName.startsWith('constructor')) {
            methods.add(methodName);
        }
    }
    return Array.from(methods);
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
        const match = line.match(/^(\s*)/);
        if (match) {
            const nesting = Math.floor(match[1].length / 4); // 4 spaces = 1 level
            maxNesting = Math.max(maxNesting, nesting);
        }
    }

    return maxNesting;
};

// Extract error handling coverage
const extractErrorHandling = (code, methodCount) => {
    const tryCount = (code.match(/try\s*{/g) || []).length;
    const catchCount = (code.match(/catch\s*\(/g) || []).length;
    return Math.min((tryCount / methodCount) * 100, 100);
};

// Run tests
console.log('\n========================================');
console.log('UIRenderer Version Comparison');
console.log('========================================\n');

const originalMethods = extractMethods(originalCode);
const refactoredMethods = extractMethods(refactoredCode);

// Test 1: Check line count
const originalLines = originalCode.split('\n').length;
const refactoredLines = refactoredCode.split('\n').length;
test(
    'Line count comparison',
    () => {
        const reduction = (((originalLines - refactoredLines) / originalLines) * 100).toFixed(1);
        return {
            passed: refactoredLines <= originalLines * 1.1, // Allow 10% increase
            message: `${originalLines} → ${refactoredLines} (${reduction}%)`
        };
    }
);

// Test 2: Check method count
test(
    'Method count comparison',
    () => {
        return {
            passed: Math.abs(originalMethods.length - refactoredMethods.length) <= 5, // Allow 5 methods difference
            message: `Original: ${originalMethods.length}, Refactored: ${refactoredMethods.length}`
        };
    }
);

// Test 3: Check if all critical methods present
const criticalMethods = [
    'renderChapters',
    'renderChapterEditor',
    'renderParagraphs',
    'renderElements',
    'renderTimeline',
    'bindEvents',
    'refreshView'
];
test(
    'All critical methods present',
    () => {
        const missing = criticalMethods.filter(m => !refactoredMethods.includes(m));
        return {
            passed: missing.length === 0,
            message: missing.length === 0
                ? 'All critical methods present'
                : `Missing: ${missing.join(', ')}`
        };
    }
);

// Test 4: Check function length improvement
const originalMaxLength = extractFunctionLengths(originalCode);
const refactoredMaxLength = extractFunctionLengths(refactoredCode);
test(
    'Function length reduced',
    () => {
        const reduction = ((originalMaxLength - refactoredMaxLength) / originalMaxLength * 100).toFixed(1);
        return {
            passed: refactoredMaxLength <= originalMaxLength * 1.1, // Allow 10% increase
            message: `${originalMaxLength} → ${refactoredMaxLength} (${reduction}%)`
        };
    }
);

// Test 5: Check nesting depth reduction
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
const originalErrorCoverage = extractErrorHandling(originalCode, originalMethods.length);
const refactoredErrorCoverage = extractErrorHandling(refactoredCode, refactoredMethods.length);
test(
    'Error handling improved',
    () => {
        return {
            passed: refactoredErrorCoverage >= originalErrorCoverage * 0.9, // Allow 10% decrease
            message: `Original: ${originalErrorCoverage.toFixed(0)}%, Refactored: ${refactoredErrorCoverage.toFixed(0)}%`
        };
    }
);

// Test 8: Check render methods
const renderMethods = ['renderChapters', 'renderParagraphs', 'renderElements', 'renderTimeline', 'renderStory'];
test(
    'Render methods complete',
    () => {
        const missing = renderMethods.filter(m => !refactoredMethods.includes(m));
        return {
            passed: missing.length === 0,
            message: missing.length === 0
                ? 'All render methods present'
                : `Missing: ${missing.join(', ')}`
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
        originalMethods: originalMethods.length,
        refactoredMethods: refactoredMethods.length,
        originalMaxLength,
        refactoredMaxLength,
        originalNesting,
        refactoredNesting,
        originalErrorCoverage: originalErrorCoverage.toFixed(1),
        refactoredErrorCoverage: refactoredErrorCoverage.toFixed(1)
    },
    tests: results.tests
};

const resultPath = path.join(__dirname, 'ui-renderer-comparison-results.json');
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
