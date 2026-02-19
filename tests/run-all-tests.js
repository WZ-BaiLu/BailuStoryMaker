const { execSync } = require('child_process');
const path = require('path');

const testDir = path.join(__dirname, 'managers');
const testFiles = [
    'NotificationManager.test.js',
    'ThemeManager.test.js',
    'ModalManager.test.js',
    'ViewManager.test.js',
    'EventManager.test.js',
    'ExportImportManager.test.js',
    'UIRenderer.test.js'
];

console.log('=== 运行所有测试 ===\n');

const results = [];

testFiles.forEach(file => {
    const fullPath = path.join(testDir, file);
    const fileName = file.replace('.test.js', '');
    
    try {
        const output = execSync(`npx jest "${fullPath}" --no-coverage 2>&1`, {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8'
        });

        // 解析结果
        const match = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/);
        if (match) {
            const passed = parseInt(match[1]);
            const failed = parseInt(match[2]);
            const total = passed + failed;
            const status = failed === 0 ? '✅' : '⚠️';
            
            results.push({ fileName, passed, failed, total, status });
            console.log(`${status} ${fileName}: ${passed}/${total} passed`);
        }
    } catch (error) {
        console.log(`❌ ${fileName}: 运行出错`);
        results.push({ fileName, passed: 0, failed: 0, total: 0, status: '❌' });
    }
});

console.log('\n=== 汇总 ===');
let totalPassed = 0;
let totalFailed = 0;
let totalTests = 0;

results.forEach(r => {
    totalPassed += r.passed;
    totalFailed += r.failed;
    totalTests += r.total;
});

console.log(`总计: ${totalPassed}/${totalTests} 通过 (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
console.log(`失败: ${totalFailed}`);
console.log(`\n✅ 完成测试`);
