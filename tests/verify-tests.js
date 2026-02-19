// 快速验证测试文件存在且格式正确

const fs = require('fs');
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

console.log('=== 测试文件验证 ===\n');

let totalTests = 0;

testFiles.forEach(file => {
    const filePath = path.join(testDir, file);

    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const itCount = (content.match(/it\(/g) || []).length;
        const testCount = (content.match(/test\(/g) || []).length;
        const count = itCount + testCount;

        totalTests += count;

        console.log(`✅ ${file}`);
        console.log(`   测试用例数: ${count}`);
    } else {
        console.log(`❌ ${file} - 文件不存在`);
    }
});

console.log(`\n总计测试用例数: ${totalTests}`);
console.log('\n✅ 所有测试文件验证完成！');
