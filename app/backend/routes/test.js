const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = '/lzcapp/var/data';
const TEST_DATA_DIR = path.join(DATA_DIR, 'test');

// 创建测试数据
router.post('/create-test-data', async (req, res) => {
  try {
    await fs.ensureDir(TEST_DATA_DIR);
    
    // 创建测试数据
    const testData = {
      formulas: [
        {
          _id: 'test-formula-1',
          title: '测试公式1',
          content: '创作一幅关于 #{画面主题} 的图片，风格为 #{审美风格}',
          description: '这是一个测试公式',
          author: '测试用户',
          models: ['test-model-1'],
          isPinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      models: [
        {
          _id: 'test-model-1',
          name: '测试模型',
          slug: 'test-model',
          version: '1.0',
          category: '测试',
          sortOrder: 1,
          isPinned: false
        }
      ],
      snippets: [
        {
          _id: 'test-snippet-1',
          title: '美女',
          content: 'beautiful woman',
          tags: ['test-tag-1'],
          isPinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      tags: [
        {
          _id: 'test-tag-1',
          slug: '画面主题',
          name: '画面主题',
          isMultiSelect: false,
          sortOrder: 1,
          isPinned: false
        }
      ],
      settings: {
        testMode: true,
        testTimestamp: new Date().toISOString()
      }
    };

    // 保存测试数据文件
    await fs.writeJson(path.join(TEST_DATA_DIR, 'test-data.json'), testData, { spaces: 2 });
    
    res.json({
      success: true,
      message: '测试数据创建成功',
      data: testData,
      testDir: TEST_DATA_DIR
    });
  } catch (error) {
    console.error('创建测试数据失败:', error);
    res.status(500).json({
      success: false,
      message: '创建测试数据失败',
      error: error.message
    });
  }
});

// 文件存取测试
router.post('/file-test', async (req, res) => {
  try {
    const testFile = path.join(TEST_DATA_DIR, 'file-test.txt');
    const testContent = `文件测试内容\n创建时间: ${new Date().toISOString()}\n测试ID: ${Math.random().toString(36).substr(2, 9)}`;
    
    // 写入测试文件
    await fs.writeFile(testFile, testContent, 'utf8');
    
    // 读取测试文件
    const readContent = await fs.readFile(testFile, 'utf8');
    
    // 验证文件内容
    const isValid = readContent === testContent;
    
    res.json({
      success: true,
      message: '文件存取测试完成',
      data: {
        filePath: testFile,
        writeSuccess: true,
        readSuccess: true,
        contentMatch: isValid,
        content: readContent
      }
    });
  } catch (error) {
    console.error('文件存取测试失败:', error);
    res.status(500).json({
      success: false,
      message: '文件存取测试失败',
      error: error.message
    });
  }
});

// MiniDB连接测试
router.get('/minidb-test', async (req, res) => {
  try {
    // 这里模拟MiniDB连接测试
    // 实际应用中，MiniDB是前端调用的，后端只提供数据接口
    res.json({
      success: true,
      message: 'MiniDB连接测试完成（后端模拟）',
      data: {
        connectionStatus: 'ok',
        testTime: new Date().toISOString(),
        note: 'MiniDB实际在前端调用，此为后端模拟测试'
      }
    });
  } catch (error) {
    console.error('MiniDB连接测试失败:', error);
    res.status(500).json({
      success: false,
      message: 'MiniDB连接测试失败',
      error: error.message
    });
  }
});

// 清理测试数据
router.delete('/cleanup', async (req, res) => {
  try {
    // 删除测试目录及其所有内容
    if (await fs.pathExists(TEST_DATA_DIR)) {
      await fs.remove(TEST_DATA_DIR);
    }
    
    // 清理其他可能的测试文件
    const testFiles = [
      path.join(DATA_DIR, 'test-formulas.json'),
      path.join(DATA_DIR, 'test-models.json'),
      path.join(DATA_DIR, 'test-snippets.json'),
      path.join(DATA_DIR, 'test-tags.json'),
      path.join(DATA_DIR, 'test-settings.json')
    ];
    
    for (const file of testFiles) {
      if (await fs.pathExists(file)) {
        await fs.remove(file);
      }
    }
    
    res.json({
      success: true,
      message: '测试数据清理完成',
      cleanedItems: [TEST_DATA_DIR, ...testFiles]
    });
  } catch (error) {
    console.error('清理测试数据失败:', error);
    res.status(500).json({
      success: false,
      message: '清理测试数据失败',
      error: error.message
    });
  }
});

// 获取测试状态
router.get('/status', async (req, res) => {
  try {
    const testDirExists = await fs.pathExists(TEST_DATA_DIR);
    const testDataFile = path.join(TEST_DATA_DIR, 'test-data.json');
    const testDataExists = await fs.pathExists(testDataFile);
    
    let testData = null;
    if (testDataExists) {
      testData = await fs.readJson(testDataFile);
    }
    
    res.json({
      success: true,
      message: '测试状态获取成功',
      data: {
        testDirExists,
        testDataExists,
        testDir: TEST_DATA_DIR,
        testData: testData
      }
    });
  } catch (error) {
    console.error('获取测试状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取测试状态失败',
      error: error.message
    });
  }
});

module.exports = router;