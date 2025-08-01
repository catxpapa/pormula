const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 数据文件路径
const DATA_DIR = '/lzcapp/var/data';
const UPLOADS_DIR = '/lzcapp/var/uploads';

// 确保目录存在
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(UPLOADS_DIR);

// 获取初始化数据
router.get('/init-data', async (req, res) => {
  try {
    const initDataPath = path.join(DATA_DIR, 'init-data.json');
    
    if (await fs.pathExists(initDataPath)) {
      const data = await fs.readJson(initDataPath);
      res.json({
        success: true,
        data: data,
        message: '初始化数据获取成功'
      });
    } else {
      // 返回默认空数据结构
      const defaultData = {
        formulas: [],
        models: [],
        snippets: [],
        tags: [],
        settings: {}
      };
      res.json({
        success: true,
        data: defaultData,
        message: '返回默认数据结构'
      });
    }
  } catch (error) {
    console.error('获取初始化数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取初始化数据失败',
      error: error.message
    });
  }
});

// 保存数据到JSON文件
router.post('/save-data', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: type 和 data'
      });
    }

    const filePath = path.join(DATA_DIR, `${type}.json`);
    await fs.writeJson(filePath, data, { spaces: 2 });

    res.json({
      success: true,
      message: `${type} 数据保存成功`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('保存数据失败:', error);
    res.status(500).json({
      success: false,
      message: '保存数据失败',
      error: error.message
    });
  }
});

// 读取数据文件
router.get('/load-data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const filePath = path.join(DATA_DIR, `${type}.json`);
    
    if (await fs.pathExists(filePath)) {
      const data = await fs.readJson(filePath);
      res.json({
        success: true,
        data: data,
        message: `${type} 数据读取成功`
      });
    } else {
      res.json({
        success: true,
        data: null,
        message: `${type} 数据文件不存在`
      });
    }
  } catch (error) {
    console.error('读取数据失败:', error);
    res.status(500).json({
      success: false,
      message: '读取数据失败',
      error: error.message
    });
  }
});

// 获取设置
router.get('/settings', async (req, res) => {
  try {
    const settingsPath = path.join(DATA_DIR, 'settings.json');
    
    if (await fs.pathExists(settingsPath)) {
      const settings = await fs.readJson(settingsPath);
      res.json({
        success: true,
        data: settings,
        message: '设置获取成功'
      });
    } else {
      // 返回默认设置
      const defaultSettings = {
        theme: 'dark',
        language: 'zh-CN',
        autoSave: true,
        maxSnippets: 1000,
        maxFormulas: 500
      };
      res.json({
        success: true,
        data: defaultSettings,
        message: '返回默认设置'
      });
    }
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败',
      error: error.message
    });
  }
});

// 更新设置
router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    const settingsPath = path.join(DATA_DIR, 'settings.json');
    
    await fs.writeJson(settingsPath, settings, { spaces: 2 });
    
    res.json({
      success: true,
      message: '设置更新成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新设置失败',
      error: error.message
    });
  }
});

// 文件上传接口
router.post('/upload', async (req, res) => {
  try {
    // 这里可以集成multer进行文件上传处理
    res.json({
      success: true,
      message: '文件上传功能预留',
      uploadDir: UPLOADS_DIR
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 获取系统信息
router.get('/system-info', async (req, res) => {
  try {
    const info = {
      dataDir: DATA_DIR,
      uploadsDir: UPLOADS_DIR,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: info,
      message: '系统信息获取成功'
    });
  } catch (error) {
    console.error('获取系统信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统信息失败',
      error: error.message
    });
  }
});

module.exports = router;