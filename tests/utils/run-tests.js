/**
 * Node.js 测试运行器
 * 用于在命令行中运行 UIErrorHandler 和 ModalFormSubmitter 的测试
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

// 记录测试结果
function recordResult(testId, passed, message) {
    testStats.total++;
    if (passed) {
        testStats.passed++;
    } else {
        testStats.failed++;
    }
    testStats.tests.push({ testId, passed, message });
}

// 读取并执行 UIErrorHandler
const uiErrorHandlerCode = fs.readFileSync(
    path.join(__dirname, '../../js/utils/UIErrorHandler.js'),
    'utf-8'
);

// 移除 export 部分
const uiErrorHandlerClean = uiErrorHandlerCode.replace(
    /\/\/ Export for testing[\s\S]*$/,
    ''
);

// 在模块作用域中执行
const uiErrorHandlerModule = { exports: {} };
const uiErrorHandlerWrapper = new Function('module', 'exports', uiErrorHandlerClean);
uiErrorHandlerWrapper(uiErrorHandlerModule, uiErrorHandlerModule.exports);

const UIErrorHandler = uiErrorHandlerModule.exports.UIErrorHandler;

// 读取并执行 ModalFormSubmitter
const modalFormSubmitterCode = fs.readFileSync(
    path.join(__dirname, '../../js/utils/ModalFormSubmitter.js'),
    'utf-8'
);

// 移除 export 部分
const modalFormSubmitterClean = modalFormSubmitterCode.replace(
    /\/\/ Export for testing[\s\S]*$/,
    ''
);

// 在模块作用域中执行
const modalFormSubmitterModule = { exports: {} };
const modalFormSubmitterWrapper = new Function('module', 'exports', modalFormSubmitterClean);
modalFormSubmitterWrapper(modalFormSubmitterModule, modalFormSubmitterModule.exports);

const ModalFormSubmitter = modalFormSubmitterModule.exports.ModalFormSubmitter;

console.log('\n========================================');
console.log('开始运行测试...');
console.log('========================================\n');

// UIErrorHandler 测试
console.log('📋 UIErrorHandler 测试\n');

async function testUIErrorHandler() {
    // 测试 1.1: 成功执行异步函数
    const fn1 = async () => 'success';
    const result1 = await UIErrorHandler.safeExecute(fn1);
    const passed1 = result1.success === true && result1.data === 'success';
    recordResult('1.1', passed1, '成功执行异步函数');
    console.log(`  ${passed1 ? '✅' : '❌'} 1.1 成功执行异步函数`);

    // 测试 1.2: 捕获异步错误
    const fn2 = async () => { throw new Error('Async error'); };
    const result2 = await UIErrorHandler.safeExecute(fn2, { operation: 'TestOperation' });
    const passed2 = result2.success === false && 
                   result2.error === 'Async error' &&
                   result2.context.operation === 'TestOperation';
    recordResult('1.2', passed2, '捕获异步错误');
    console.log(`  ${passed2 ? '✅' : '❌'} 1.2 捕获异步错误`);

    // 测试 1.3: 不提供上下文
    const fn3 = async () => { throw new Error('No context error'); };
    const result3 = await UIErrorHandler.safeExecute(fn3);
    const passed3 = result3.success === false && 
                   result3.error === 'No context error' &&
                   result3.context !== undefined;
    recordResult('1.3', passed3, '不提供上下文');
    console.log(`  ${passed3 ? '✅' : '❌'} 1.3 不提供上下文`);

    // 测试 2.1: 成功执行同步函数
    const fn4 = () => 'sync success';
    const result4 = UIErrorHandler.safeExecuteSync(fn4);
    const passed4 = result4.success === true && result4.data === 'sync success';
    recordResult('2.1', passed4, '成功执行同步函数');
    console.log(`  ${passed4 ? '✅' : '❌'} 2.1 成功执行同步函数`);

    // 测试 2.2: 捕获同步错误
    const fn5 = () => { throw new Error('Sync error'); };
    const result5 = UIErrorHandler.safeExecuteSync(fn5, { operation: 'TestSync' });
    const passed5 = result5.success === false && 
                   result5.error === 'Sync error' &&
                   result5.context.operation === 'TestSync';
    recordResult('2.2', passed5, '捕获同步错误');
    console.log(`  ${passed5 ? '✅' : '❌'} 2.2 捕获同步错误`);

    // 测试 3.1: 使用通知管理器
    let called = false;
    let msg = '';
    const mockNotificationManager = {
        showError: (message) => { called = true; msg = message; }
    };
    UIErrorHandler.showError('Test error', mockNotificationManager);
    const passed6 = called && msg === 'Test error';
    recordResult('3.1', passed6, '使用通知管理器');
    console.log(`  ${passed6 ? '✅' : '❌'} 3.1 使用通知管理器`);

    // 测试 3.2: 无通知管理器
    UIErrorHandler.showError('Test error', null);
    const passed7 = true; // 只要不抛出异常就算通过
    recordResult('3.2', passed7, '无通知管理器');
    console.log(`  ${passed7 ? '✅' : '❌'} 3.2 无通知管理器`);
}

// ModalFormSubmitter 测试
function createMockForm(data) {
    return {
        get: function(key) {
            return data[key];
        }
    };
}

function testModalFormSubmitter() {
    console.log('\n📋 ModalFormSubmitter 测试\n');

    // 测试 4.1: 验证通过
    const form1 = createMockForm({
        name: 'Test Name',
        email: 'test@example.com'
    });
    const rules1 = {
        name: { required: true, label: 'Name' },
        email: { required: true, label: 'Email' }
    };
    const result1 = ModalFormSubmitter.validateForm(form1, rules1);
    const passed1 = result1.valid === true && Object.keys(result1.errors).length === 0;
    recordResult('4.1', passed1, '验证通过');
    console.log(`  ${passed1 ? '✅' : '❌'} 4.1 验证通过`);

    // 测试 4.2: 必填字段为空
    const form2 = createMockForm({
        name: '',
        email: 'test@example.com'
    });
    const result2 = ModalFormSubmitter.validateForm(form2, rules1);
    const passed2 = result2.valid === false && result2.errors.name === 'Name is required';
    recordResult('4.2', passed2, '必填字段为空');
    console.log(`  ${passed2 ? '✅' : '❌'} 4.2 必填字段为空`);

    // 测试 4.3: 字段太短
    const form3 = createMockForm({ password: '123' });
    const rules3 = { password: { minLength: 6, label: 'Password' } };
    const result3 = ModalFormSubmitter.validateForm(form3, rules3);
    const passed3 = result3.valid === false && 
                   result3.errors.password === 'Password must be at least 6 characters';
    recordResult('4.3', passed3, '字段太短');
    console.log(`  ${passed3 ? '✅' : '❌'} 4.3 字段太短`);

    // 测试 4.4: 字段太长
    const form4 = createMockForm({ name: 'This is a very long name' });
    const rules4 = { name: { maxLength: 10, label: 'Name' } };
    const result4 = ModalFormSubmitter.validateForm(form4, rules4);
    const passed4 = result4.valid === false && 
                   result4.errors.name === 'Name must be at most 10 characters';
    recordResult('4.4', passed4, '字段太长');
    console.log(`  ${passed4 ? '✅' : '❌'} 4.4 字段太长`);

    // 测试 4.5: 正则表达式验证
    const form5 = createMockForm({ email: 'invalid-email' });
    const rules5 = {
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            label: 'Email'
        }
    };
    const result5 = ModalFormSubmitter.validateForm(form5, rules5);
    const passed5 = result5.valid === false && 
                   result5.errors.email === 'Email has invalid format';
    recordResult('4.5', passed5, '正则表达式验证');
    console.log(`  ${passed5 ? '✅' : '❌'} 4.5 正则表达式验证`);

    // 测试 4.6: 多字段验证
    const form6 = createMockForm({
        name: '',
        email: 'invalid',
        age: '15'
    });
    const rules6 = {
        name: { required: true, label: 'Name' },
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'Email' },
        age: { minLength: 18, label: 'Age' }
    };
    const result6 = ModalFormSubmitter.validateForm(form6, rules6);
    const passed6 = result6.valid === false && 
                   Object.keys(result6.errors).length === 3 &&
                   result6.errors.name === 'Name is required' &&
                   result6.errors.email === 'Email has invalid format';
    recordResult('4.6', passed6, '多字段验证');
    console.log(`  ${passed6 ? '✅' : '❌'} 4.6 多字段验证`);
}

// 边界测试
async function testBoundary() {
    console.log('\n📋 边界测试\n');

    // 测试 5.1: 空函数处理
    const fn1 = async () => {};
    const result1 = await UIErrorHandler.safeExecute(fn1);
    const passed1 = result1.success === true && result1.data === undefined;
    recordResult('5.1', passed1, '空函数处理');
    console.log(`  ${passed1 ? '✅' : '❌'} 5.1 空函数处理`);

    // 测试 5.2: null 参数处理
    const result2 = await UIErrorHandler.safeExecute(null);
    const passed2 = result2.success === false;
    recordResult('5.2', passed2, 'null 参数处理');
    console.log(`  ${passed2 ? '✅' : '❌'} 5.2 null 参数处理`);

    // 测试 5.3: 空验证规则
    const form3 = createMockForm({});
    const result3 = ModalFormSubmitter.validateForm(form3, {});
    const passed3 = result3.valid === true && Object.keys(result3.errors).length === 0;
    recordResult('5.3', passed3, '空验证规则');
    console.log(`  ${passed3 ? '✅' : '❌'} 5.3 空验证规则`);
}

// 运行所有测试
async function runAllTests() {
    try {
        await testUIErrorHandler();
        testModalFormSubmitter();
        await testBoundary();

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

        // 打印失败的测试
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
            tests: testStats.tests
        };

        fs.writeFileSync(
            path.join(__dirname, 'test-results.json'),
            JSON.stringify(results, null, 2)
        );
        console.log('测试结果已保存到: tests/utils/test-results.json\n');

        // 退出码
        process.exit(testStats.failed > 0 ? 1 : 0);
    } catch (error) {
        console.error('\n❌ 测试运行出错:', error);
        process.exit(1);
    }
}

// 运行测试
runAllTests();
