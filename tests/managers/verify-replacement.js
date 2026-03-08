/**
 * Verification script for AIElementTools replacement
 * Checks if the replaced file has all required methods
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('AIElementTools Replacement Verification');
console.log('========================================\n');

const filePath = path.join(__dirname, '../../js/managers/AIElementTools.js');
const backupPath = path.join(__dirname, '../../js/managers/AIElementTools.js.backup');
const refactoredPath = path.join(__dirname, '../../js/managers/AIElementTools.refactored.js');

// Read files
const currentCode = fs.readFileSync(filePath, 'utf-8');
const backupCode = fs.readFileSync(backupPath, 'utf-8');
const refactoredCode = fs.readFileSync(refactoredPath, 'utf-8');

console.log('File Comparison:');
console.log(`Current file: ${filePath}`);
console.log(`Backup file: ${backupPath}`);
console.log(`Refactored file: ${refactoredPath}\n`);

// Check if files are different
const currentLines = currentCode.split('\n').length;
const backupLines = backupCode.split('\n').length;
const refactoredLines = refactoredCode.split('\n').length;

console.log('Line Counts:');
console.log(`Backup (original): ${backupLines} lines`);
console.log(`Current (replaced): ${currentLines} lines`);
console.log(`Refactored (source): ${refactoredLines} lines`);
console.log(`Difference: ${currentLines - backupLines} lines (${((currentLines - backupLines) / backupLines * 100).toFixed(1)}%)\n`);

// Check if current matches refactored
if (currentCode === refactoredCode) {
    console.log('✅ Current file matches refactored version\n');
} else {
    console.log('❌ Current file does NOT match refactored version\n');
}

// Extract required methods
const requiredMethods = [
    'addElement',
    'updateElementLocation',
    'updateElementDescription',
    'updateParagraphTimestamp',
    'getContextInfo',
    'listElements'
];

const extractMethods = (code) => {
    const regex = /async\s+(\w+)\s*\(/g;
    const methods = [];
    let match;
    while ((match = regex.exec(code)) !== null) {
        methods.push(match[1]);
    }
    return methods;
};

const currentMethods = extractMethods(currentCode);
const backupMethods = extractMethods(backupCode);

console.log('Required Methods Check:');
let allMethodsPresent = true;

requiredMethods.forEach(method => {
    const inCurrent = currentMethods.includes(method);
    const inBackup = backupMethods.includes(method);

    if (inCurrent && inBackup) {
        console.log(`✅ ${method}: Present in both versions`);
    } else if (inCurrent && !inBackup) {
        console.log(`⚠️  ${method}: Only in current version`);
    } else if (!inCurrent && inBackup) {
        console.log(`❌ ${method}: Missing from current version!`);
        allMethodsPresent = false;
    } else {
        console.log(`❌ ${method}: Missing from both versions!`);
        allMethodsPresent = false;
    }
});

console.log('\n');

// Check updateElementDescription specifically
const updateElementDescRegex = /async\s+updateElementDescription\s*\(/;
const hasUpdateElementDesc = updateElementDescRegex.test(currentCode);
console.log(`updateElementDescription method: ${hasUpdateElementDesc ? '✅ Present' : '❌ Missing'}\n`);

// Check syntax
console.log('Syntax Check:');
try {
    eval(currentCode);
    console.log('✅ Current file syntax is valid\n');
} catch (error) {
    console.log(`❌ Current file syntax error: ${error.message}\n`);
    allMethodsPresent = false;
}

// Summary
console.log('========================================');
console.log('Summary');
console.log('========================================\n');

if (currentCode === refactoredCode && allMethodsPresent && hasUpdateElementDesc) {
    console.log('✅ REPLACEMENT SUCCESSFUL');
    console.log('✅ All required methods present');
    console.log('✅ updateElementDescription added');
    console.log('✅ Syntax is valid');
    console.log('\n✅ READY TO COMMIT');
} else {
    console.log('❌ REPLACEMENT INCOMPLETE');
    if (currentCode !== refactoredCode) {
        console.log('❌ Current file does not match refactored version');
    }
    if (!allMethodsPresent) {
        console.log('❌ Some required methods are missing');
    }
    if (!hasUpdateElementDesc) {
        console.log('❌ updateElementDescription method is missing');
    }
    console.log('\n❌ DO NOT COMMIT');
}

console.log('\n========================================\n');
