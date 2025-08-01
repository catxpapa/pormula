const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('/lzcapp/var/uploads'));

// 路由配置
const apiRoutes = require('./routes/api');
const testRoutes = require('./routes/test');

app.use('/api', apiRoutes);
app.use('/api/test', testRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'aispellbook-backend',
    version: '1.0.0'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '未知错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.originalUrl
  });
});

// 启动服务器
app.listen(PORT, '127.0.0.1', () => {
  console.log(`喵咒·AI Spellbook 后端服务启动成功`);
  console.log(`服务地址: http://127.0.0.1:${PORT}`);
  console.log(`工作目录: ${process.cwd()}`);
  console.log(`数据目录: /lzcapp/var/data`);
  console.log(`上传目录: /lzcapp/var/uploads`);
});