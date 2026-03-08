/**
 * Version comparison script for ParagraphAnalyzer
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
    path.join(__dirname, '../../js/modules/ParagraphAnalyzer.js'),
    'utf-8'
);
const refactoredCode = fs.readFileSync(
    path.join(__dirname, '../../js/modules/ParagraphAnalyzer.refactored.js'),
    'utf-8'
);

// Extract method names
const extractMethods = (code) => {
    const regex = /(\w+)\s*\([^)]*\)\s*{/g;
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
            const nesting = Math.floor(match[1].length / 4);
            maxNesting = Math.max(maxNesting, nesting);
        }
    }

    return maxNesting;
};

// Run tests
console.log('\n========================================');
console.log('ParagraphAnalyzer Version Comparison');
console.log('========================================\n');

const originalMethods = extractMethods(originalCode);
const refactoredMethods = extractMethods(refactoredCode);

// Test 1: Line count
const originalLines = originalCode.split('\n').length;
const refactoredLines = refactoredCode.split('\n').length;
test(
    'Line count comparison',
    () => {
        const reduction = (((originalLines - refactoredLines) / originalLines) * 100).toFixed(1);
        return {
            passed: refactoredLines <= originalLines * 1.1,
            message: `${originalLines} → ${refactoredLines} (${reduction}%)`
        };
    }
);

// Test 2: Method count
test(
    'Method count comparison',
    () => {
        return {
            passed: Math.abs(originalMethods.length - refactoredMethods.length) <= 10,
            message: `Original: ${originalMethods.length}, Refactored: ${refactoredMethods.length}`
        };
    }
);

// Test 3: Critical methods
const criticalMethods = [
    'analyzeParagraph',
    'extractElements',
    'extractEvents',
    'extractLocations'
];
test(
    'All critical methods present',
    () => {
        const missing = criticalMethods.filter(m => !refactoredMethods.includes(m));
        return {
            passed: missing.length === 0,
            message: missing.length === 0 ? 'All present' : `Missing: ${missing.join(', ')}`
        };
    }
);

// Test 4: Function length
const originalMaxLength = extractFunctionLengths(originalCode);
const refactoredMaxLength = extractFunctionLengths(refactoredCode);
test(
    'Function length reduced',
    () => {
        const reduction = ((originalMaxLength - refactoredMaxLength) / originalMaxLength * 100).toFixed(1);
        return {
            passed: refactoredMaxLength <= originalMaxLength * 1.1,
            message: `${originalMaxLength} → ${refactoredMaxLength} (${reduction}%)`
        };
    }
);

// Test 5: Nesting depth
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

// Test 6: Syntax
test('Original syntax valid', () => {
    try {
        eval(originalCode);
        return { passed: true, message: 'Valid' };
    } catch (error) {
        return { passed: false, message: error.message };
    }
});

test('Refactored syntax valid', () => {
    try {
        eval(refactoredCode);
        return { passed: true, message: 'Valid' };
    } catch (error) {
        return { passed: false, message: error.message };
    }
});

// Summary
const passed = results.tests.filter(t => t.status === 'PASSED').length;
const total = results.tests.length;
const passRate = Math.round((passed / total) * 100);

console.log('\n========================================');
console.log('Summary');
console.log('========================================');
console.log(`Total: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${total - passed}`);
console.log(`Pass Rate: ${passRate}%\n`);

// Decision
if (passRate >= 70) {
    console.log('✅ READY TO REPLACE');
} else {
    console.log('❌ NOT READY');
}

// Save results
const summary = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed: total - passed, passRate },
    comparison: {
        originalLines, refactoredLines,
        originalMethods: originalMethods.length,
        refactoredMethods: refactoredMethods.length,
        originalMaxLength, refactoredMaxLength,
        originalNesting, refactoredNesting
    },
    tests: results.tests
};

fs.writeFileSync(path.join(__dirname, 'paragraph-analyzer-comparison-results.json'), JSON.stringify(summary, null, 2));
console.log(`Results saved to: paragraph-analyzer-comparison-results.json\n`);
