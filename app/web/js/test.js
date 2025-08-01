import { miniDBService } from './minidb.js';

/**
 * 测试页面管理类
 */
class TestPageManager {
  constructor() {
    this.testResults = new Map();
    this.init();
  }

  /**
   * 初始化测试页面
   */
  init() {
    this.bindEventListeners();
    this.updateTestStatus('测试页面已加载，等待开始测试...');
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 系统信息测试
    document.getElementById('test-system-info')?.addEventListener('click', () => {
      this.testSystemInfo();
    });

    document.getElementById('test-health-check')?.addEventListener('click', () => {
      this.testHealthCheck();
    });

    // 文件存取测试
    document.getElementById('test-file-write')?.addEventListener('click', () => {
      this.testFileWrite();
    });

    document.getElementById('test-file-read')?.addEventListener('click', () => {
      this.testFileRead();
    });

    document.getElementById('test-file-operations')?.addEventListener('click', () => {
      this.testFileOperations();
    });

    // MiniDB测试
    document.getElementById('test-minidb-connection')?.addEventListener('click', () => {
      this.testMiniDBConnection();
    });

    document.getElementById('test-minidb-crud')?.addEventListener('click', () => {
      this.testMiniDBCRUD();
    });

    document.getElementById('test-minidb-query')?.addEventListener('click', () => {
      this.testMiniDBQuery();
    });

    // 数据初始化测试
    document.getElementById('test-init-data')?.addEventListener('click', () => {
      this.testInitData();
    });

    document.getElementById('test-load-to-minidb')?.addEventListener('click', () => {
      this.testLoadToMiniDB();
    });

    document.getElementById('test-data-validation')?.addEventListener('click', () => {
      this.testDataValidation();
    });

    // 设置测试
    document.getElementById('test-settings-read')?.addEventListener('click', () => {
      this.testSettingsRead();
    });

    document.getElementById('test-settings-write')?.addEventListener('click', () => {
      this.testSettingsWrite();
    });

    document.getElementById('test-settings-update')?.addEventListener('click', () => {
      this.testSettingsUpdate();
    });

    // 综合测试
    document.getElementById('test-all')?.addEventListener('click', () => {
      this.runAllTests();
    });

    document.getElementById('create-test-data')?.addEventListener('click', () => {
      this.createTestData();
    });

    document.getElementById('cleanup-test-data')?.addEventListener('click', () => {
      this.cleanupTestData();
    });
  }

  /**
   * 系统信息测试
   */
  async testSystemInfo() {
    this.logTest('system-info', '开始系统信息测试...');
    
    try {
      const response = await fetch('/api/system-info');
      const result = await response.json();
      
      if (result.success) {
        this.logTest('system-info', '✅ 系统信息获取成功', 'success');
        this.logTest('system-info', JSON.stringify(result.data, null, 2), 'info');
        this.testResults.set('system-info', true);
      } else {
        this.logTest('system-info', `❌ 系统信息获取失败: ${result.message}`, 'error');
        this.testResults.set('system-info', false);
      }
    } catch (error) {
      this.logTest('system-info', `❌ 系统信息测试异常: ${error.message}`, 'error');
      this.testResults.set('system-info', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 健康检查测试
   */
  async testHealthCheck() {
    this.logTest('system-info', '开始健康检查测试...');
    
    try {
      const response = await fetch('/api/health');
      const result = await response.json();
      
      if (result.status === 'ok') {
        this.logTest('system-info', '✅ 健康检查通过', 'success');
        this.logTest('system-info', `服务状态: ${result.status}, 时间: ${result.timestamp}`, 'info');
        this.testResults.set('health-check', true);
      } else {
        this.logTest('system-info', `❌ 健康检查失败: ${result.status}`, 'error');
        this.testResults.set('health-check', false);
      }
    } catch (error) {
      this.logTest('system-info', `❌ 健康检查异常: ${error.message}`, 'error');
      this.testResults.set('health-check', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 文件写入测试
   */
  async testFileWrite() {
    this.logTest('file-test', '开始文件写入测试...');
    
    try {
      const response = await fetch('/api/test/file-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operation: 'write' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.logTest('file-test', '✅ 文件写入测试成功', 'success');
        this.logTest('file-test', JSON.stringify(result.data, null, 2), 'info');
        this.testResults.set('file-write', true);
      } else {
        this.logTest('file-test', `❌ 文件写入测试失败: ${result.message}`, 'error');
        this.testResults.set('file-write', false);
      }
    } catch (error) {
      this.logTest('file-test', `❌ 文件写入测试异常: ${error.message}`, 'error');
      this.testResults.set('file-write', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 文件读取测试
   */
  async testFileRead() {
    this.logTest('file-test', '开始文件读取测试...');
    
    try {
      const response = await fetch('/api/load-data/test-file');
      const result = await response.json();
      
      if (result.success) {
        this.logTest('file-test', '✅ 文件读取测试成功', 'success');
        this.logTest('file-test', `读取到数据: ${result.data ? '有数据' : '无数据'}`, 'info');
        this.testResults.set('file-read', true);
      } else {
        this.logTest('file-test', `❌ 文件读取测试失败: ${result.message}`, 'error');
        this.testResults.set('file-read', false);
      }
    } catch (error) {
      this.logTest('file-test', `❌ 文件读取测试异常: ${error.message}`, 'error');
      this.testResults.set('file-read', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 完整文件操作测试
   */
  async testFileOperations() {
    this.logTest('file-test', '开始完整文件操作测试...');
    
    try {
      const response = await fetch('/api/test/file-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.data.contentMatch) {
        this.logTest('file-test', '✅ 完整文件操作测试成功', 'success');
        this.logTest('file-test', `文件路径: ${result.data.filePath}`, 'info');
        this.logTest('file-test', `写入成功: ${result.data.writeSuccess}`, 'info');
        this.logTest('file-test', `读取成功: ${result.data.readSuccess}`, 'info');
        this.logTest('file-test', `内容匹配: ${result.data.contentMatch}`, 'info');
        this.testResults.set('file-operations', true);
      } else {
        this.logTest('file-test', `❌ 完整文件操作测试失败: ${result.message}`, 'error');
        this.testResults.set('file-operations', false);
      }
    } catch (error) {
      this.logTest('file-test', `❌ 完整文件操作测试异常: ${error.message}`, 'error');
      this.testResults.set('file-operations', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * MiniDB连接测试
   */
  async testMiniDBConnection() {
    this.logTest('minidb-test', '开始MiniDB连接测试...');
    
    try {
      const result = await miniDBService.testConnection();
      
      if (result.success) {
        this.logTest('minidb-test', '✅ MiniDB连接测试成功', 'success');
        this.logTest('minidb-test', result.message, 'info');
        this.testResults.set('minidb-connection', true);
      } else {
        this.logTest('minidb-test', `❌ MiniDB连接测试失败: ${result.message}`, 'error');
        this.testResults.set('minidb-connection', false);
      }
    } catch (error) {
      this.logTest('minidb-test', `❌ MiniDB连接测试异常: ${error.message}`, 'error');
      this.testResults.set('minidb-connection', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * MiniDB CRUD测试
   */
  async testMiniDBCRUD() {
    this.logTest('minidb-test', '开始MiniDB CRUD测试...');
    
    try {
      const result = await miniDBService.runCRUDTest();
      
      if (result.success) {
        this.logTest('minidb-test', '✅ MiniDB CRUD测试成功', 'success');
        result.results.forEach(testResult => {
          const status = testResult.success ? '✅' : '❌';
          this.logTest('minidb-test', `${status} ${testResult.operation}: ${testResult.message}`, 
                      testResult.success ? 'success' : 'error');
        });
        this.testResults.set('minidb-crud', true);
      } else {
        this.logTest('minidb-test', `❌ MiniDB CRUD测试失败: ${result.message}`, 'error');
        this.testResults.set('minidb-crud', false);
      }
    } catch (error) {
      this.logTest('minidb-test', `❌ MiniDB CRUD测试异常: ${error.message}`, 'error');
      this.testResults.set('minidb-crud', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * MiniDB查询测试
   */
  async testMiniDBQuery() {
    this.logTest('minidb-test', '开始MiniDB查询功能测试...');
    
    try {
      const result = await miniDBService.runQueryTest();
      
      if (result.success) {
        this.logTest('minidb-test', '✅ MiniDB查询功能测试成功', 'success');
        result.results.forEach(testResult => {
          const status = testResult.success ? '✅' : '❌';
          this.logTest('minidb-test', `${status} ${testResult.test}: ${testResult.message}`, 
                      testResult.success ? 'success' : 'error');
        });
        this.testResults.set('minidb-query', true);
      } else {
        this.logTest('minidb-test', `❌ MiniDB查询功能测试失败: ${result.message}`, 'error');
        this.testResults.set('minidb-query', false);
      }
    } catch (error) {
      this.logTest('minidb-test', `❌ MiniDB查询功能测试异常: ${error.message}`, 'error');
      this.testResults.set('minidb-query', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 初始化数据测试
   */
  async testInitData() {
    this.logTest('init-data', '开始初始化数据测试...');
    
    try {
      const response = await fetch('/api/init-data');
      const result = await response.json();
      
      if (result.success) {
        this.logTest('init-data', '✅ 初始化数据获取成功', 'success');
        const data = result.data;
        this.logTest('init-data', `公式数量: ${data.formulas?.length || 0}`, 'info');
        this.logTest('init-data', `模型数量: ${data.models?.length || 0}`, 'info');
        this.logTest('init-data', `片段数量: ${data.snippets?.length || 0}`, 'info');
        this.logTest('init-data', `标签数量: ${data.tags?.length || 0}`, 'info');
        this.testResults.set('init-data', true);
      } else {
        this.logTest('init-data', `❌ 初始化数据获取失败: ${result.message}`, 'error');
        this.testResults.set('init-data', false);
      }
    } catch (error) {
      this.logTest('init-data', `❌ 初始化数据测试异常: ${error.message}`, 'error');
      this.testResults.set('init-data', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 加载到MiniDB测试
   */
  async testLoadToMiniDB() {
    this.logTest('init-data', '开始加载数据到MiniDB测试...');
    
    try {
      // 先获取初始化数据
      const response = await fetch('/api/init-data');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('获取初始化数据失败');
      }
      
      // 加载到MiniDB
      const loadResult = await miniDBService.initializeData(result.data);
      
      if (loadResult.success) {
        this.logTest('init-data', '✅ 数据加载到MiniDB成功', 'success');
        this.logTest('init-data', loadResult.message, 'info');
        this.testResults.set('load-to-minidb', true);
      } else {
        this.logTest('init-data', `❌ 数据加载到MiniDB失败: ${loadResult.message}`, 'error');
        this.testResults.set('load-to-minidb', false);
      }
    } catch (error) {
      this.logTest('init-data', `❌ 加载到MiniDB测试异常: ${error.message}`, 'error');
      this.testResults.set('load-to-minidb', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 数据验证测试
   */
  async testDataValidation() {
    this.logTest('init-data', '开始数据验证测试...');
    
    try {
      // 从MiniDB读取数据进行验证
      const formulas = await miniDBService.find('formulas');
      const models = await miniDBService.find('models');
      const snippets = await miniDBService.find('snippets');
      const tags = await miniDBService.find('tags');
      
      let validationPassed = true;
      const validationResults = [];
      
      // 验证数据结构
      if (Array.isArray(formulas) && formulas.length > 0) {
        validationResults.push('✅ 公式数据结构正确');
      } else {
        validationResults.push('❌ 公式数据结构错误');
        validationPassed = false;
      }
      
      if (Array.isArray(models) && models.length > 0) {
        validationResults.push('✅ 模型数据结构正确');
      } else {
        validationResults.push('❌ 模型数据结构错误');
        validationPassed = false;
      }
      
      if (Array.isArray(snippets) && snippets.length > 0) {
        validationResults.push('✅ 片段数据结构正确');
      } else {
        validationResults.push('❌ 片段数据结构错误');
        validationPassed = false;
      }
      
      if (Array.isArray(tags) && tags.length > 0) {
        validationResults.push('✅ 标签数据结构正确');
      } else {
        validationResults.push('❌ 标签数据结构错误');
        validationPassed = false;
      }
      
      // 验证数据关联
      const formulaWithTags = formulas.find(f => f.content.includes('#{'));
      if (formulaWithTags) {
        validationResults.push('✅ 公式包含标签引用');
      } else {
        validationResults.push('❌ 公式缺少标签引用');
        validationPassed = false;
      }
      
      const snippetWithTags = snippets.find(s => s.tags && s.tags.length > 0);
      if (snippetWithTags) {
        validationResults.push('✅ 片段包含标签关联');
      } else {
        validationResults.push('❌ 片段缺少标签关联');
        validationPassed = false;
      }
      
      // 输出验证结果
      validationResults.forEach(result => {
        const isSuccess = result.startsWith('✅');
        this.logTest('init-data', result, isSuccess ? 'success' : 'error');
      });
      
      if (validationPassed) {
        this.logTest('init-data', '✅ 数据验证测试通过', 'success');
      } else {
        this.logTest('init-data', '❌ 数据验证测试失败', 'error');
      }
      
      this.testResults.set('data-validation', validationPassed);
    } catch (error) {
      this.logTest('init-data', `❌ 数据验证测试异常: ${error.message}`, 'error');
      this.testResults.set('data-validation', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 设置读取测试
   */
  async testSettingsRead() {
    this.logTest('settings-test', '开始设置读取测试...');
    
    try {
      const response = await fetch('/api/settings');
      const result = await response.json();
      
      if (result.success) {
        this.logTest('settings-test', '✅ 设置读取测试成功', 'success');
        this.logTest('settings-test', JSON.stringify(result.data, null, 2), 'info');
        this.testResults.set('settings-read', true);
      } else {
        this.logTest('settings-test', `❌ 设置读取测试失败: ${result.message}`, 'error');
        this.testResults.set('settings-read', false);
      }
    } catch (error) {
      this.logTest('settings-test', `❌ 设置读取测试异常: ${error.message}`, 'error');
      this.testResults.set('settings-read', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 设置写入测试
   */
  async testSettingsWrite() {
    this.logTest('settings-test', '开始设置写入测试...');
    
    try {
      const testSettings = {
        theme: 'dark',
        language: 'zh-CN',
        testMode: true,
        testTimestamp: new Date().toISOString()
      };
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testSettings)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.logTest('settings-test', '✅ 设置写入测试成功', 'success');
        this.logTest('settings-test', result.message, 'info');
        this.testResults.set('settings-write', true);
      } else {
        this.logTest('settings-test', `❌ 设置写入测试失败: ${result.message}`, 'error');
        this.testResults.set('settings-write', false);
      }
    } catch (error) {
      this.logTest('settings-test', `❌ 设置写入测试异常: ${error.message}`, 'error');
      this.testResults.set('settings-write', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 设置更新测试
   */
  async testSettingsUpdate() {
    this.logTest('settings-test', '开始设置更新测试...');
    
    try {
      // 先读取当前设置
      const readResponse = await fetch('/api/settings');
      const readResult = await readResponse.json();
      
      if (!readResult.success) {
        throw new Error('读取当前设置失败');
      }
      
      // 更新设置
      const updatedSettings = {
        ...readResult.data,
        lastTestUpdate: new Date().toISOString(),
        updateTestPassed: true
      };
      
      const updateResponse = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      });
      
      const updateResult = await updateResponse.json();
      
      if (updateResult.success) {
        this.logTest('settings-test', '✅ 设置更新测试成功', 'success');
        this.logTest('settings-test', updateResult.message, 'info');
        this.testResults.set('settings-update', true);
      } else {
        this.logTest('settings-test', `❌ 设置更新测试失败: ${updateResult.message}`, 'error');
        this.testResults.set('settings-update', false);
      }
    } catch (error) {
      this.logTest('settings-test', `❌ 设置更新测试异常: ${error.message}`, 'error');
      this.testResults.set('settings-update', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 创建测试数据
   */
  async createTestData() {
    this.logTest('comprehensive-test', '开始创建测试数据...');
    
    try {
      const response = await fetch('/api/test/create-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.logTest('comprehensive-test', '✅ 测试数据创建成功', 'success');
        this.logTest('comprehensive-test', `测试目录: ${result.testDir}`, 'info');
        this.logTest('comprehensive-test', JSON.stringify(result.data, null, 2), 'info');
        this.testResults.set('create-test-data', true);
      } else {
        this.logTest('comprehensive-test', `❌ 测试数据创建失败: ${result.message}`, 'error');
        this.testResults.set('create-test-data', false);
      }
    } catch (error) {
      this.logTest('comprehensive-test', `❌ 创建测试数据异常: ${error.message}`, 'error');
      this.testResults.set('create-test-data', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 清理测试数据
   */
  async cleanupTestData() {
    this.logTest('comprehensive-test', '开始清理测试数据...');
    
    try {
      const response = await fetch('/api/test/cleanup', {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.logTest('comprehensive-test', '✅ 测试数据清理成功', 'success');
        this.logTest('comprehensive-test', result.message, 'info');
        result.cleanedItems.forEach(item => {
          this.logTest('comprehensive-test', `已清理: ${item}`, 'info');
        });
        this.testResults.set('cleanup-test-data', true);
      } else {
        this.logTest('comprehensive-test', `❌ 测试数据清理失败: ${result.message}`, 'error');
        this.testResults.set('cleanup-test-data', false);
      }
    } catch (error) {
      this.logTest('comprehensive-test', `❌ 清理测试数据异常: ${error.message}`, 'error');
      this.testResults.set('cleanup-test-data', false);
    }
    
    this.updateOverallStatus();
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    this.logTest('comprehensive-test', '开始运行所有测试...');
    this.testResults.clear();
    
    const tests = [
      () => this.testHealthCheck(),
      () => this.testSystemInfo(),
      () => this.testFileOperations(),
      () => this.testMiniDBConnection(),
      () => this.testMiniDBCRUD(),
      () => this.testMiniDBQuery(),
      () => this.testInitData(),
      () => this.testLoadToMiniDB(),
      () => this.testDataValidation(),
      () => this.testSettingsRead(),
      () => this.testSettingsWrite(),
      () => this.testSettingsUpdate()
    ];
    
    for (const test of tests) {
      await test();
      // 在测试之间添加短暂延迟
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const passedTests = Array.from(this.testResults.values()).filter(result => result).length;
    const totalTests = this.testResults.size;
    
    if (passedTests === totalTests) {
      this.logTest('comprehensive-test', `✅ 所有测试通过 (${passedTests}/${totalTests})`, 'success');
    } else {
      this.logTest('comprehensive-test', `❌ 部分测试失败 (${passedTests}/${totalTests})`, 'error');
    }
    
    this.updateOverallStatus();
  }

  /**
   * 记录测试日志
   */
  logTest(section, message, type = 'info') {
    const resultElement = document.getElementById(`${section}-result`);
    if (!resultElement) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `test-${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    resultElement.appendChild(logEntry);
    resultElement.scrollTop = resultElement.scrollHeight;
  }

  /**
   * 更新测试状态
   */
  updateTestStatus(message) {
    const statusElement = document.getElementById('test-status');
    if (statusElement) {
      const timestamp = new Date().toLocaleTimeString();
      statusElement.innerHTML = `<div class="test-info">[${timestamp}] ${message}</div>`;
    }
  }

  /**
   * 更新总体状态
   */
  updateOverallStatus() {
    const passedTests = Array.from(this.testResults.values()).filter(result => result).length;
    const totalTests = this.testResults.size;
    
    if (totalTests === 0) {
      this.updateTestStatus('等待开始测试...');
    } else if (passedTests === totalTests) {
      this.updateTestStatus(`✅ 所有测试通过 (${passedTests}/${totalTests})`);
    } else {
      this.updateTestStatus(`⚠️ 测试进行中或部分失败 (${passedTests}/${totalTests})`);
    }
  }
}

// 初始化测试页面
document.addEventListener('DOMContentLoaded', () => {
  window.testManager = new TestPageManager();
});