// server.js - 后端主服务器文件
// 提供API接口、处理业务逻辑和数据库交互
// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// 数据存储路径
const DATA_DIR = "/lzcapp/var/data";
const CACHE_DIR = "/lzcapp/cache";
const UPLOADS_DIR = "/lzcapp/var/uploads";
const username = process.env.LAZYCAT_APP_DEPLOY_UID || "admin";

console.log('username:',username,process.env)
// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 确保数据目录存在
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log("数据目录初始化完成");
  } catch (error) {
    console.error("创建目录失败:", error);
  }
}
// 检查页面是否为未安装状态
async function checkIfAppInstalled(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            timeout: 5000, // 5秒超时
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LazyCAT-App-Checker/1.0)'
            }
        });
        
        if (response.ok) {
            const html = await response.text();
            
            // 检查是否包含未安装的特征
            const isNotInstalled = html.includes('<title>无法打开</title>') || 
                                 html.includes('应用未安装, 请前往应用商店安装') ||
                                 html.includes('state_forbidden.svg');
            // console.log('isNotInstalled',isNotInstalled,html)
            return !isNotInstalled; // 返回是否已安装
        }
        
        return false; // 请求失败认为未安装
        
    } catch (error) {
        // console.log('检查应用安装状态失败:', error.message);
        return false; // 网络错误等情况认为未安装
    }
}

app.post('/api/catimg/prompt', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // if (!prompt?.trim()) {
        //     return res.status(400).json({
        //         success: false,
        //         message: '请提供有效的提示语'
        //     });
        // }
        
        const catimgUrl = 'https://catimg.kagee.heiyu.space/';
        const storeUrl = 'lzc://appstore?path=detail/cloud.lazycat.aipod.catimg';
        
        // 先检查catimg是否已安装
        // console.log('🔍 检查catimg应用安装状态...');
        const isInstalled = await checkIfAppInstalled(catimgUrl);
        
        if (!isInstalled) {
            console.log('❌ catimg应用未安装，跳转到应用商店');
            return res.json({
                success: true,
                message: 'catimg应用未安装，正在跳转到应用商店...',
                redirect_url: storeUrl,
                reason: 'app_not_installed'
            });
        }
        
        // 应用已安装，保存提示语文件
        // console.log('✅ catimg应用已安装，保存提示语');
        const username = process.env.LAZYCAT_APP_DEPLOY_UID || 'default';
        const filePath = `/lzcapp/run/mnt/home/${username}/.catimg_prompt.json`;
        
        await fs.writeFile(filePath, JSON.stringify({
            prompt: prompt.trim(),
            timestamp: Date.now()
        }), 'utf8');
        
        res.json({
            success: true,
            message: '提示语已保存，正在跳转到catimg...',
            redirect_url: catimgUrl,
            reason: 'prompt_saved'
        });
        
    } catch (error) {
        console.error('处理catimg提示语失败:', error);
        res.status(500).json({
            success: false,
            message: '处理失败',
            error: error.message
        });
    }
});
// 健康检查接口
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "AI Spellbook Backend",
    version: "1.0.0",
  });
});

// 获取初始化数据
app.get("/api/init-data", async (req, res) => {
  try {
    const initDataPath = path.join(DATA_DIR, "init.json");
    const data = await fs.readFile(initDataPath, "utf8");
    const initData = JSON.parse(data);

    res.json({
      success: true,
      data: initData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("读取初始化数据失败:", error);
    res.status(500).json({
      success: false,
      error: "读取初始化数据失败",
      message: error.message,
    });
  }
});

// 保存数据到JSON文件
app.post("/api/save-data", async (req, res) => {
  try {
    const { filename, data } = req.body;

    if (!filename || !data) {
      return res.status(400).json({
        success: false,
        error: "缺少必要参数：filename 和 data",
      });
    }

    const filePath = path.join(DATA_DIR, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

    res.json({
      success: true,
      message: `数据已保存到 ${filename}.json`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("保存数据失败:", error);
    res.status(500).json({
      success: false,
      error: "保存数据失败",
      message: error.message,
    });
  }
});

// 读取JSON文件数据
app.get("/api/load-data/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(DATA_DIR, `${filename}.json`);

    const data = await fs.readFile(filePath, "utf8");
    const jsonData = JSON.parse(data);

    res.json({
      success: true,
      data: jsonData,
      filename: filename,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      res.status(404).json({
        success: false,
        error: "文件不存在",
        filename: req.params.filename,
      });
    } else {
      console.error("读取数据失败:", error);
      res.status(500).json({
        success: false,
        error: "读取数据失败",
        message: error.message,
      });
    }
  }
});

// 获取设置
app.get("/api/settings", async (req, res) => {
  try {
    const settingsPath = path.join(DATA_DIR, "settings.json");

    try {
      const data = await fs.readFile(settingsPath, "utf8");
      const settings = JSON.parse(data);
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      // 如果设置文件不存在，返回默认设置
      if (error.code === "ENOENT") {
        const defaultSettings = {
          theme: "dark",
          language: "zh-CN",
          autoSave: true,
          maxSnippets: 500,
          createdAt: new Date().toISOString(),
        };

        // 创建默认设置文件
        await fs.writeFile(
          settingsPath,
          JSON.stringify(defaultSettings, null, 2)
        );

        res.json({
          success: true,
          data: defaultSettings,
          isDefault: true,
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("获取设置失败:", error);
    res.status(500).json({
      success: false,
      error: "获取设置失败",
      message: error.message,
    });
  }
});

// 保存设置
app.post("/api/settings", async (req, res) => {
  try {
    const settings = req.body;
    settings.updatedAt = new Date().toISOString();

    const settingsPath = path.join(DATA_DIR, "settings.json");
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    res.json({
      success: true,
      message: "设置已保存",
      data: settings,
    });
  } catch (error) {
    console.error("保存设置失败:", error);
    res.status(500).json({
      success: false,
      error: "保存设置失败",
      message: error.message,
    });
  }
});

// 文件存储测试接口
app.post("/api/test/file-write", async (req, res) => {
  try {
    const { content, filename } = req.body;
    const testFile = path.join(CACHE_DIR, `test_${filename || "file"}.txt`);

    await fs.writeFile(testFile, content || "Test content");

    res.json({
      success: true,
      message: "文件写入成功",
      path: testFile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "文件写入失败",
      message: error.message,
    });
  }
});

// 文件读取测试接口
app.get("/api/test/file-read/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const testFile = path.join(CACHE_DIR, `test_${filename}.txt`);

    const content = await fs.readFile(testFile, "utf8");

    res.json({
      success: true,
      content: content,
      path: testFile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "文件读取失败",
      message: error.message,
    });
  }
});

// 清理测试数据
app.delete("/api/test/cleanup", async (req, res) => {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const testFiles = files.filter((file) => file.startsWith("test_"));

    for (const file of testFiles) {
      await fs.unlink(path.join(CACHE_DIR, file));
    }

    res.json({
      success: true,
      message: `已清理 ${testFiles.length} 个测试文件`,
      cleanedFiles: testFiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "清理测试数据失败",
      message: error.message,
    });
  }
});

// 默认路由 - 返回主页--devshell临时
// app.get('/', (req, res) => {
//     // console.log(req)
//     res.sendFile(path.join(__dirname, '../web/index.html'));
// });
// app.get('/css/style.css', (req, res) => {
//     // console.log(req)
//     res.sendFile(path.join(__dirname, '../web/css/style.css'));
// });
// // app.get('/js/app.js', (req, res) => {
// //     // console.log(req)
// //     res.sendFile(path.join(__dirname, '../web/js/app.js'));
// // });
// app.get('/logo.png', (req, res) => {
//     // console.log(req)
//     res.sendFile(path.join(__dirname, '../web/logo.png'));
// });

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error("服务器错误:", error);
  res.status(500).json({
    success: false,
    error: "服务器内部错误",
    message: error.message,
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "接口不存在",
    path: req.path,
  });
});

// 启动服务器
async function startServer() {
  await ensureDirectories();

  app.listen(PORT, () => {
    console.log(`AI Spellbook Backend 服务启动成功`);
    console.log(`端口: ${PORT}`);
    console.log(`数据目录: ${DATA_DIR}`);
    console.log(`缓存目录: ${CACHE_DIR}`);
    console.log(`上传目录: ${UPLOADS_DIR}`);
  });
}

startServer().catch(console.error);
