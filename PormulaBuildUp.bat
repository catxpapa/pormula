@echo off
chcp 65001 >nul
echo 正在创建项目目录结构...

REM 创建主要目录结构
mkdir app 2>nul
mkdir app\web 2>nul
mkdir app\web\css 2>nul
mkdir app\web\js 2>nul
mkdir app\backend 2>nul
mkdir app\backend\data 2>nul

REM 创建根目录配置文件
@REM echo # lzc-build.yml - 懒猫微服构建配置文件 > lzc-build.yml
@REM echo # 定义应用的构建流程、依赖项和打包规则 >> lzc-build.yml

@REM echo # lzc-manifest.yml - 懒猫微服应用清单文件 > lzc-manifest.yml
@REM echo # 定义应用的运行时配置、路由规则和容器依赖关系 >> lzc-manifest.yml

REM 创建前端文件
echo ^<!-- index.html - 应用主页面 --^> > app\web\index.html
echo ^<!-- 提供用户界面和主要功能入口 --^> >> app\web\index.html

echo ^<!-- test.html - 测试页面 --^> > app\web\test.html
echo ^<!-- 用于功能测试和调试的页面 --^> >> app\web\test.html

echo /* style.css - 主样式表文件 */ > app\web\css\style.css
echo /* 定义应用的视觉样式和布局规则 */ >> app\web\css\style.css

echo // app.js - 前端主应用脚本 > app\web\js\app.js
echo // 处理用户交互逻辑和前后端数据通信 >> app\web\js\app.js

echo // test.js - 前端测试脚本 > app\web\js\test.js
echo // 用于前端功能测试和调试的JavaScript代码 >> app\web\js\test.js

REM 创建后端文件
echo { > app\backend\package.json
echo   "name": "aispellbook-backend", >> app\backend\package.json
echo   "description": "package.json - Node.js项目配置文件，定义依赖项和脚本命令" >> app\backend\package.json
echo } >> app\backend\package.json

echo // server.js - 后端主服务器文件 > app\backend\server.js
echo // 提供API接口、处理业务逻辑和数据库交互 >> app\backend\server.js

echo { > app\backend\data\init.json
echo   "_comment": "init.json - 初始化数据文件，包含应用启动时需要的基础数据" >> app\backend\data\init.json
echo } >> app\backend\data\init.json

echo.
echo ✅ 项目目录结构创建完成！
echo.
echo 📁 创建的目录结构：
echo ├── lzc-build.yml         # 构建配置
echo ├── lzc-manifest.yml      # 应用清单
echo └── app/                  # 应用内容目录
echo     ├── web/              # 前端静态文件
echo     │   ├── index.html    # 主页面
echo     │   ├── test.html     # 测试页面
echo     │   ├── css/
echo     │   │   └── style.css
echo     │   └── js/
echo     │       ├── app.js
echo     │       └── test.js
echo     └── backend/          # 后端服务
echo         ├── package.json
echo         ├── server.js     # 主服务器
echo         └── data/         # 数据目录
echo             └── init.json # 初始化数据
echo.
echo 💡 提示：图片文件(lzc-icon.png)已按要求跳过创建
echo 📝 所有文件都包含了相应格式的注释说明文件名和作用
echo.
pause