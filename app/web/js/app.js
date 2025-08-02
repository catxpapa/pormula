/**
 * 喵咒·AI Spellbook 主应用
 * 功能：AI提示词公式组合工具
 * 作者：懒猫微服开发团队
 */

import { MiniDB } from "@lazycatcloud/minidb";

/**
 * 调试配置
 * 设置为 true 启用调试输出，false 关闭调试
 */
const DEBUG_MODE = true;

/**
 * 调试日志输出函数
 * @param {string} step - 当前步骤描述
 * @param {any} data - 相关数据（可选）
 */
function debugLog(step, data = null) {
  if (DEBUG_MODE) {
    console.log(`[AI Spellbook Debug] ${step}`, data || "");
  }
}

/**
 * 应用主类
 * 管理整个应用的状态和交互逻辑
 */
class AISpellbookApp {
  /**
   * 构造函数
   * 初始化应用实例和基础配置
   */
  constructor() {
    debugLog("应用初始化开始");

    // MiniDB 数据库实例
    this.db = new MiniDB();

    // 数据集合
    this.collections = {
      formulas: this.db.getCollection("formulas"),
      models: this.db.getCollection("models"),
      snippets: this.db.getCollection("snippets"),
      tags: this.db.getCollection("tags"),
      settings: this.db.getCollection("settings"),
    };

    // 应用状态
    this.state = {
      currentFormula: null, // 当前选中的公式
      currentTag: null, // 当前选中的标签
      selectedSnippets: new Map(), // 已选择的片段 Map<tagId, snippet>
      currentMode: "compose", // 当前模式: compose/manual/edit
      isInitialized: false, // 是否已初始化
      isMobile: window.innerWidth <= 768, // 是否移动端
    };

    // DOM 元素缓存
    this.elements = {};

    debugLog("应用实例创建完成", this.state);
  }

  /**
   * 应用启动入口
   * 执行初始化流程
   */
  async init() {
    try {
      debugLog("开始应用初始化流程");

      // 缓存DOM元素
      this.cacheElements();

      // 绑定事件监听器
      this.bindEvents();

      // 从后端加载初始数据
      await this.loadInitialData();

      // 渲染界面
      await this.renderInterface();

      // 设置移动端适配
      this.setupMobileAdaptation();

      this.state.isInitialized = true;
      debugLog("应用初始化完成");

      if (DEBUG_MODE) {
            await this.validateDataIntegrity();
            await this.showDevToolsMenu()
        }

        

    } catch (error) {
      console.error("应用初始化失败:", error);
      this.showError("应用初始化失败，请刷新页面重试");
    }
  }

  /**
   * 缓存常用DOM元素
   * 提高性能，避免重复查询
   */
  cacheElements() {
    debugLog("开始缓存DOM元素");

    const elementIds = [
      "app-container",
      "sidebar-container",
      "sidebar-toggle",
      "sidebar-content",
      "model-filter-dropdown",
      "formula-search-input",
      "search-btn",
      "formula-list-container",
      "main-content",
      "prompt-composer",
      "tab-compose",
      "tab-manual",
      "btn-edit-formula",
      "formula-display-area",
      "btn-copy",
      "btn-submit",
      "status-text",
      "snippet-panel",
      "current-tag-name",
      "btn-add-snippet",
      "snippet-list-container",
      "modal-overlay",
      "add-snippet-modal",
      "modal-close-btn",
      "add-snippet-form",
      "snippet-tags-input",
      "snippet-items-container",
      "btn-add-snippet-item",
      "btn-cancel-snippet",
      "btn-save-snippet",
    ];

    elementIds.forEach((id) => {
      this.elements[id] = document.getElementById(id);
      if (!this.elements[id]) {
        console.warn(`DOM元素未找到: ${id}`);
      }
    });

    debugLog("DOM元素缓存完成", Object.keys(this.elements));
  }

  /**
   * 绑定事件监听器
   * 设置用户交互响应
   */
  bindEvents() {
    debugLog("开始绑定事件监听器");

    // 侧边栏切换 (移动端)
    this.elements["sidebar-toggle"]?.addEventListener("click", () => {
      debugLog("侧边栏切换点击");
      this.toggleSidebar();
    });

    // 模型过滤器
    this.elements["model-filter-dropdown"]?.addEventListener("change", (e) => {
      debugLog("模型过滤器变更", e.target.value);
      this.filterFormulasByModel(e.target.value);
    });

    // 公式搜索
    this.elements["formula-search-input"]?.addEventListener("input", (e) => {
      debugLog("公式搜索输入", e.target.value);
      this.searchFormulas(e.target.value);
    });

    this.elements["search-btn"]?.addEventListener("click", () => {
      debugLog("搜索按钮点击");
      const query = this.elements["formula-search-input"].value;
      this.searchFormulas(query);
    });

    // 模式切换
    this.elements["tab-compose"]?.addEventListener("click", () => {
      debugLog("切换到组合模式");
      this.switchMode("compose");
    });

    this.elements["tab-manual"]?.addEventListener("click", () => {
      debugLog("切换到手动模式");
      this.switchMode("manual");
    });

    this.elements["btn-edit-formula"]?.addEventListener("click", () => {
      debugLog("切换到编辑公式模式");
      this.switchMode("edit");
    });

    // 操作按钮
    this.elements["btn-copy"]?.addEventListener("click", () => {
      debugLog("复制按钮点击");
      this.copyPrompt();
    });

    this.elements["btn-submit"]?.addEventListener("click", () => {
      debugLog("提交按钮点击");
      this.submitPrompt();
    });

    // 添加片段
    this.elements["btn-add-snippet"]?.addEventListener("click", () => {
      debugLog("添加片段按钮点击");
      this.showAddSnippetModal();
    });

    // 模态框事件
    this.elements["modal-close-btn"]?.addEventListener("click", () => {
      debugLog("模态框关闭按钮点击");
      this.hideModal();
    });

    this.elements["btn-cancel-snippet"]?.addEventListener("click", () => {
      debugLog("取消添加片段");
      this.hideModal();
    });

    this.elements["btn-save-snippet"]?.addEventListener("click", () => {
      debugLog("保存片段按钮点击");
      this.saveNewSnippets();
    });

    this.elements["btn-add-snippet-item"]?.addEventListener("click", () => {
      debugLog("添加更多片段项");
      this.addSnippetItemForm();
    });

    // 窗口大小变化
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // 点击模态框外部关闭
    this.elements["modal-overlay"]?.addEventListener("click", (e) => {
      if (e.target === this.elements["modal-overlay"]) {
        debugLog("点击模态框外部关闭");
        this.hideModal();
      }
    });

    debugLog("事件监听器绑定完成");

    if (DEBUG_MODE) {
    // 创建临时调试按钮
    const debugBtn = document.createElement('button');
    debugBtn.textContent = '调试数据';
    debugBtn.style.position = 'fixed';
    debugBtn.style.top = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '9999';
    debugBtn.onclick = () => this.validateDataIntegrity();
    document.body.appendChild(debugBtn);
}

  }

  /**
   * 从后端加载初始数据
   * 获取公式、模型、片段、标签等基础数据
   */
 /**
 * 加载初始数据（优化版 - 使用业务ID去重）
 */
async loadInitialData() {
    try {
        debugLog('开始加载初始数据');
        
        // 首先检查是否已初始化
        const existingSettings = await this.collections.settings.findOne({ 
            settingKey: 'app_settings' 
        });
        
        // 如果已有设置数据，检查版本号决定是否需要更新
        if (existingSettings) {
            debugLog('发现现有设置数据，检查版本');
            let currentSettings;
            try {
                currentSettings = JSON.parse(existingSettings.settingValue);
            } catch (e) {
                currentSettings = {};
            }
            
            // 获取初始数据
            const response = await fetch('/api/init-data');
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '加载初始数据失败');
            }
            
            const initData = result.data;
            
            // 版本检查 - 只有新版本才更新数据
            if (initData.version && (!currentSettings.version || 
                initData.version > currentSettings.version)) {
                debugLog(`发现新版本数据 ${initData.version}，执行更新`);
                await this.updateInitialData(initData);
            } else {
                debugLog('无需更新初始数据，使用现有数据');
            }
        } else {
            // 首次初始化，执行完整导入
            debugLog('首次初始化，导入所有初始数据');
            const response = await fetch('/api/init-data');
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '加载初始数据失败');
            }
            
            const initData = result.data;
            await this.importInitialData(initData);
        }
    } catch (error) {
        console.error('加载初始数据失败:', error);
        throw error;
    }
}

/**
 * 导入初始数据（首次初始化）
 */
async importInitialData(initData) {
    try {
        // 导入模型数据（使用modelId作为业务ID）
        if (initData.models && initData.models.length > 0) {
            for (const model of initData.models) {
                // 检查是否已存在
                const existingModel = await this.collections.models.findOne({ 
                    modelId: model.modelId 
                });
                
                if (!existingModel) {
                    await this.collections.models.upsert(model);
                    debugLog(`添加模型: ${model.name}`);
                }
            }
            debugLog('模型数据导入完成', initData.models.length);
        }
        
        // 导入标签数据（使用tagId作为业务ID）
        if (initData.tags && initData.tags.length > 0) {
            for (const tag of initData.tags) {
                const existingTag = await this.collections.tags.findOne({ 
                    tagId: tag.tagId 
                });
                
                if (!existingTag) {
                    await this.collections.tags.upsert(tag);
                    debugLog(`添加标签: ${tag.displayName}`);
                }
            }
            debugLog('标签数据导入完成', initData.tags.length);
        }
        
        // 导入片段数据（使用snippetId作为业务ID）
        if (initData.snippets && initData.snippets.length > 0) {
            for (const snippet of initData.snippets) {
                const existingSnippet = await this.collections.snippets.findOne({ 
                    snippetId: snippet.snippetId 
                });
                
                if (!existingSnippet) {
                    await this.collections.snippets.upsert(snippet);
                    debugLog(`添加片段: ${snippet.shortName}`);
                }
            }
            debugLog('片段数据导入完成', initData.snippets.length);
        }
        
        // 导入公式数据（使用formulaId作为业务ID）
        if (initData.formulas && initData.formulas.length > 0) {
            for (const formula of initData.formulas) {
                const existingFormula = await this.collections.formulas.findOne({ 
                    formulaId: formula.formulaId 
                });
                
                if (!existingFormula) {
                    await this.collections.formulas.upsert(formula);
                    debugLog(`添加公式: ${formula.title}`);
                }
            }
            debugLog('公式数据导入完成', initData.formulas.length);
        }
        
        // 保存设置及初始化标记
        await this.collections.settings.upsert([{
            settingKey: 'app_settings',
            settingValue: JSON.stringify({
                ...initData.settings,
                initialized: true,
                initDate: new Date().toISOString()
            }),
            updatedAt: new Date().toISOString()
        }]);
        debugLog('设置数据及初始化标记保存完成');
        
    } catch (error) {
        console.error('导入初始数据失败:', error);
        throw error;
    }
}
/**
 * 初始化开发工具
 */
initDevTools() {
    if (DEBUG_MODE) {
        debugLog('初始化开发工具');
        
        // 创建开发工具按钮
        const devToolsBtn = document.createElement('button');
        devToolsBtn.textContent = '🛠️ 开发工具';
        devToolsBtn.style.position = 'fixed';
        devToolsBtn.style.bottom = '10px';
        devToolsBtn.style.right = '10px';
        devToolsBtn.style.zIndex = '9999';
        devToolsBtn.style.padding = '8px 15px';
        devToolsBtn.style.background = '#00aabb';
        devToolsBtn.style.color = 'white';
        devToolsBtn.style.border = 'none';
        devToolsBtn.style.borderRadius = '4px';
        devToolsBtn.style.cursor = 'pointer';
        
        devToolsBtn.onclick = () => this.showDevToolsMenu();
        document.body.appendChild(devToolsBtn);
    }
}

/**
 * 显示开发工具菜单
 */
showDevToolsMenu() {
    // 创建菜单容器
    const menuContainer = document.createElement('div');
    menuContainer.style.position = 'fixed';
    menuContainer.style.bottom = '50px';
    menuContainer.style.right = '10px';
    menuContainer.style.zIndex = '10000';
    menuContainer.style.background = '#2a2a2a';
    menuContainer.style.padding = '10px';
    menuContainer.style.borderRadius = '4px';
    menuContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    
    // 添加菜单项
    const menuItems = [
        { text: '重置初始数据', action: () => this.resetInitialData() },
        { text: '清理重复数据', action: () => this.cleanupDuplicates() },
        { text: '导出当前数据', action: () => this.exportCurrentData() },
        { text: '验证数据完整性', action: () => this.validateDataIntegrity() },
        { text: '关闭', action: () => menuContainer.remove() }
    ];
    
    menuItems.forEach(item => {
        const button = document.createElement('button');
        button.textContent = item.text;
        button.style.display = 'block';
        button.style.width = '100%';
        button.style.padding = '8px 15px';
        button.style.margin = '5px 0';
        button.style.background = item.text === '关闭' ? '#555' : '#00aabb';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        
        button.onclick = item.action;
        menuContainer.appendChild(button);
    });
    
    document.body.appendChild(menuContainer);
}

/**
 * 重置初始数据
 */
async resetInitialData() {
    if (confirm('确定要重置为初始数据吗？这将清除所有现有数据！')) {
        try {
            debugLog('开始重置初始数据');
            
            // 先清理所有集合
            await this.cleanupCollections();
            
            // 删除初始化标记
            const initFlag = await this.collections.settings.findOne({ 
                settingKey: 'init_completed' 
            });
            
            if (initFlag) {
                await this.collections.settings.remove(initFlag._id);
            }
            
            // 设置强制更新标志
            localStorage.setItem('force_init_update', 'true');
            
            // 刷新页面重新初始化
            alert('数据已重置，即将刷新页面');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('重置初始数据失败:', error);
            alert('重置失败: ' + error.message);
        }
    }
}

/**
 * 清理重复数据
 */
async cleanupDuplicates() {
    if (confirm('确定要清理重复数据吗？')) {
        try {
            debugLog('开始清理重复数据');
            
            // 使用业务ID去重
            await this.deduplicateCollection('models', 'modelId');
            await this.deduplicateCollection('tags', 'tagId');
            await this.deduplicateCollection('snippets', 'snippetId');
            await this.deduplicateCollection('formulas', 'formulaId');
            
            alert('重复数据清理完成，即将刷新页面');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('清理重复数据失败:', error);
            alert('清理失败: ' + error.message);
        }
    }
}

/**
 * 对指定集合进行去重
 * @param {string} collectionName - 集合名称
 * @param {string} businessIdField - 业务ID字段名
 */
async deduplicateCollection(collectionName, businessIdField) {
    debugLog(`开始对 ${collectionName} 集合进行去重`);
    
    // 获取所有文档
    const allDocs = await this.collections[collectionName].find({}).fetch();
    debugLog(`${collectionName} 集合共有 ${allDocs.length} 条记录`);
    
    // 按业务ID分组
    const groupedById = {};
    allDocs.forEach(doc => {
        if (!doc[businessIdField]) {
            debugLog(`警告: 记录缺少业务ID字段 ${businessIdField}`, doc);
            return;
        }
        
        if (!groupedById[doc[businessIdField]]) {
            groupedById[doc[businessIdField]] = [];
        }
        
        groupedById[doc[businessIdField]].push(doc);
    });
    
    // 统计并删除重复项
    let removedCount = 0;
    
    for (const [id, docs] of Object.entries(groupedById)) {
        if (docs.length > 1) {
            // 保留最新的一条记录
            const sortedDocs = docs.sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
                const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
                return dateB - dateA; // 降序，最新的在前
            });
            
            // 删除重复项
            for (let i = 1; i < sortedDocs.length; i++) {
                await this.collections[collectionName].remove(sortedDocs[i]._id);
                removedCount++;
            }
        }
    }
    
    debugLog(`${collectionName} 集合去重完成，删除了 ${removedCount} 条重复记录`);
}

/**
 * 更新初始数据（增量更新）
 */
async updateInitialData(initData) {
    // 这里可以实现更复杂的增量更新逻辑
    // 比如只更新新增的项目，或者根据时间戳更新变更的项目
    debugLog('执行增量更新');
    
    // 更新设置
    if (initData.settings) {
        const existingSettings = await this.collections.settings.findOne({ 
            settingKey: 'app_settings' 
        });
        
        if (existingSettings) {
            let currentSettings = {};
            try {
                currentSettings = JSON.parse(existingSettings.settingValue);
            } catch (e) {}
            
            // 合并设置，保留已有设置，更新新设置
            await this.collections.settings.upsert([{
                settingKey: 'app_settings',
                settingValue: JSON.stringify({
                    ...currentSettings,
                    ...initData.settings,
                    lastUpdated: new Date().toISOString()
                }),
                updatedAt: new Date().toISOString()
            }]);
        }
    }
    
    debugLog('初始数据更新完成');
}


  /**
   * 渲染界面
   * 根据数据渲染各个组件
   */
  async renderInterface() {
    try {
      debugLog("开始渲染界面");

      // 渲染模型过滤器
      await this.renderModelFilter();

      // 渲染公式列表
      await this.renderFormulaList();

      // 更新状态显示
      this.updateStatusDisplay("就绪");

      debugLog("界面渲染完成");
    } catch (error) {
      console.error("界面渲染失败:", error);
      this.showError("界面渲染失败");
    }
  }

  /**
   * 渲染模型过滤器下拉菜单
   * 显示所有可用的模型选项
   */
  async renderModelFilter() {
    try {
      debugLog("开始渲染模型过滤器");

      const models = await this.collections.models
        .find(
          {},
          {
            sort: ["sortOrder", "name"],
          }
        )
        .fetch();

      const dropdown = this.elements["model-filter-dropdown"];
      if (!dropdown) return;

      // 清空现有选项（保留"所有模型"）
      dropdown.innerHTML = '<option value="">所有模型</option>';

      // 添加模型选项
      models.forEach((model) => {
        if (model.isActive) {
          const option = document.createElement("option");
          option.value = model.modelId;
          option.textContent = `${model.name} ${model.version}`;
          dropdown.appendChild(option);
        }
      });

      debugLog("模型过滤器渲染完成", models.length);
    } catch (error) {
      console.error("渲染模型过滤器失败:", error);
    }
  }

  /**
   * 渲染公式列表
   * @param {string} modelFilter - 模型过滤条件
   * @param {string} searchQuery - 搜索关键词
   */
  async renderFormulaList(modelFilter = "", searchQuery = "") {
    try {
      debugLog("开始渲染公式列表", { modelFilter, searchQuery });

      let query = {};

      // 应用模型过滤
      if (modelFilter) {
        query.modelIds = { $in: [modelFilter] };
      }

      // 获取公式数据
      let formulas = await this.collections.formulas
        .find(query, {
          sort: ["isTop", "updatedAt"],
        })
        .fetch();

      // 应用搜索过滤
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        formulas = formulas.filter(
          (formula) =>
            formula.title.toLowerCase().includes(searchLower) ||
            formula.content.toLowerCase().includes(searchLower) ||
            (formula.description &&
              formula.description.toLowerCase().includes(searchLower))
        );
      }

      const container = this.elements["formula-list-container"];
      if (!container) return;

      // 清空容器
      container.innerHTML = "";

      if (formulas.length === 0) {
        container.innerHTML = '<div class="empty-state">未找到匹配的公式</div>';
        debugLog("公式列表为空");
        return;
      }

      // 渲染公式项
      formulas.forEach((formula) => {
        const formulaElement = this.createFormulaElement(formula);
        container.appendChild(formulaElement);
      });

      debugLog("公式列表渲染完成", formulas.length);
    } catch (error) {
      console.error("渲染公式列表失败:", error);
    }
  }

  /**
   * 创建公式列表项元素
   * @param {Object} formula - 公式数据对象
   * @returns {HTMLElement} 公式元素
   */
  createFormulaElement(formula) {
    debugLog("创建公式元素", formula.formulaId);

    const element = document.createElement("div");
    element.className = "formula-item";
    element.dataset.formulaId = formula.formulaId;

    // 置顶标记
    const topBadge = formula.isTop ? '<span class="badge-top">置顶</span>' : "";

    // 模型标签
    const modelBadges = formula.modelIds
      ? formula.modelIds
          .map((id) => `<span class="badge-model">${id}</span>`)
          .join("")
      : "";

    element.innerHTML = `
            <div class="formula-title">${formula.title} ${topBadge}</div>
            <div class="formula-meta">
                <div class="formula-models">${modelBadges}</div>
                <div class="formula-description">${
                  formula.description || ""
                }</div>
                <div class="formula-author">${formula.author || ""}</div>
            </div>
        `;

    // 绑定点击事件
    element.addEventListener("click", () => {
      debugLog("公式项点击", formula.formulaId);
      this.selectFormula(formula);
    });

    return element;
  }

  /**
   * 选择公式
   * @param {Object} formula - 选中的公式对象
   */
  async selectFormula(formula) {
    try {
      debugLog("选择公式", formula);

      // 更新状态
      this.state.currentFormula = formula;
      this.state.selectedSnippets.clear();

      // 更新UI选中状态
      document.querySelectorAll(".formula-item").forEach((item) => {
        item.classList.remove("formula-active");
      });

      const selectedElement = document.querySelector(
        `[data-formula-id="${formula.formulaId}"]`
      );
      if (selectedElement) {
        selectedElement.classList.add("formula-active");
      }

      // 渲染公式显示区
      await this.renderFormulaDisplay();

      // 清空片段面板
      this.clearSnippetPanel();

      // 启用复制按钮
      this.elements["btn-copy"].disabled = false;

      // 更新状态
      this.updateStatusDisplay("公式已选择");

      debugLog("公式选择完成");
    } catch (error) {
      console.error("选择公式失败:", error);
      this.showError("选择公式失败");
    }
  }

  /**
   * 渲染公式显示区
   * 根据当前模式显示不同的内容
   */
  async renderFormulaDisplay() {
    try {
      debugLog("开始渲染公式显示区", this.state.currentMode);

      const displayArea = this.elements["formula-display-area"];
      if (!displayArea || !this.state.currentFormula) return;

      switch (this.state.currentMode) {
        case "compose":
          await this.renderComposeMode();
          break;
        case "manual":
          await this.renderManualMode();
          break;
        case "edit":
          await this.renderEditMode();
          break;
      }

      debugLog("公式显示区渲染完成");
    } catch (error) {
      console.error("渲染公式显示区失败:", error);
    }
  }

  /**
   * 渲染组合模式
   * 将公式中的标签转换为可点击按钮
   */
  async renderComposeMode() {
    debugLog("渲染组合模式");

    const formula = this.state.currentFormula;
    const displayArea = this.elements["formula-display-area"];

    // 解析公式中的标签
    const parsedContent = await this.parseFormulaContent(formula.content);

    displayArea.innerHTML = "";

    parsedContent.forEach((part) => {
      if (part.type === "text") {
        // 普通文本
        const textSpan = document.createElement("span");
        textSpan.className = "formula-text";
        textSpan.textContent = part.content;
        displayArea.appendChild(textSpan);
      } else if (part.type === "tag") {
        // 标签按钮
        const tagButton = this.createTagButton(part);
        displayArea.appendChild(tagButton);
      }
    });
  }

  /**
   * 解析公式内容
   * @param {string} content - 公式原始内容
   * @returns {Array} 解析后的内容数组
   */
  async parseFormulaContent(content) {
    debugLog("解析公式内容", content);

    const parts = [];
    const tagRegex = /#\{([^}]+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      // 添加标签前的文本
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.substring(lastIndex, match.index),
        });
      }

      // 查找对应的标签
      const tagSlug = match[1];
      const tag = await this.collections.tags.findOne({ slug: tagSlug });

      parts.push({
        type: "tag",
        slug: tagSlug,
        displayName: tag ? tag.displayName : tagSlug,
        tag: tag,
      });

      lastIndex = tagRegex.lastIndex;
    }

    // 添加最后的文本
    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex),
      });
    }

    debugLog("公式内容解析完成", parts);
    return parts;
  }

  /**
   * 创建标签按钮
   * @param {Object} tagPart - 标签部分数据
   * @returns {HTMLElement} 标签按钮元素
   */
  createTagButton(tagPart) {
    debugLog("创建标签按钮", tagPart);

    const button = document.createElement("button");
    button.className = "tag-button";
    button.dataset.tagSlug = tagPart.slug;

    // 检查是否已选择片段
    const selectedSnippet = this.state.selectedSnippets.get(tagPart.slug);
    if (selectedSnippet) {
      button.textContent = selectedSnippet.shortName;
      button.classList.add("tag-selected");
    } else {
      button.textContent = `#${tagPart.displayName}`;
      button.classList.add("tag-placeholder");
    }

    // 绑定点击事件
    button.addEventListener("click", () => {
      debugLog("标签按钮点击", tagPart.slug);
      this.selectTag(tagPart);
    });

    return button;
  }

  /**
   * 选择标签
   * @param {Object} tagPart - 标签数据
   */
  async selectTag(tagPart) {
    try {
      debugLog("选择标签", tagPart);

      this.state.currentTag = tagPart;

      // 更新片段面板标题
      this.elements[
        "current-tag-name"
      ].textContent = `${tagPart.displayName} 片段`;

      // 启用添加片段按钮
      this.elements["btn-add-snippet"].disabled = false;

      // 渲染片段列表
      await this.renderSnippetList(tagPart.tag);

      debugLog("标签选择完成");
    } catch (error) {
      console.error("选择标签失败:", error);
      this.showError("选择标签失败");
    }
  }

/**
 * 渲染片段列表
 * @param {Object} tag - 标签对象
 */
async renderSnippetList(tag) {
    try {
        debugLog('开始渲染片段列表', tag);
        
        // 详细标签信息调试
        debugLog('标签详细信息', {
            tagId: tag.tagId,
            slug: tag.slug,
            _id: tag._id
        });
        
        // 构建复合查询条件 - 关键修复
        const query = {
            $or: [
                { tagIds: { $elemMatch: { $eq: tag.tagId } } },  // 使用 $elemMatch 精确匹配数组元素
                { tagIds: { $elemMatch: { $eq: tag.slug } } },   // 尝试匹配slug
                { tagIds: { $elemMatch: { $eq: tag._id } } }     // 尝试匹配_id
            ]
        };
        
        debugLog('片段查询条件', query);
        
        // 执行查询
        const snippets = await this.collections.snippets.find(query, {
            sort: ['isTop', 'updatedAt']
        }).fetch();
        
        debugLog('片段查询结果', {
            count: snippets.length,
            snippets: snippets
        });
        
        // 仅用于调试 - 获取所有片段
        const allSnippets = await this.collections.snippets.find({}).fetch();
        debugLog('数据库中所有片段总数', allSnippets.length);
        
        // 特别检查与当前标签匹配的片段
        const manualCheck = allSnippets.filter(s => 
            Array.isArray(s.tagIds) && s.tagIds.some(id => 
                id === tag.tagId || id === tag.slug || id === tag._id
            )
        );
        debugLog('手动过滤匹配的片段', {
            count: manualCheck.length,
            matchedSnippets: manualCheck
        });
        
        // 使用手动过滤的结果作为备用
        const finalSnippets = snippets.length > 0 ? snippets : manualCheck;
        
        const container = this.elements['snippet-list-container'];
        if (!container) return;
        
        // 更新当前标签显示
        if (this.elements['current-tag-name']) {
            this.elements['current-tag-name'].textContent = tag.displayName;
        }
        
        // 启用添加片段按钮
        if (this.elements['btn-add-snippet']) {
            this.elements['btn-add-snippet'].disabled = false;
        }
        
        // 清空容器
        container.innerHTML = '';
        
        if (finalSnippets.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无片段，点击上方按钮添加</div>';
            debugLog('片段列表为空');
            return;
        }
        
        // 渲染片段卡片
        finalSnippets.forEach(snippet => {
            const snippetElement = this.createSnippetElement(snippet);
            container.appendChild(snippetElement);
        });
        
        debugLog('片段列表渲染完成', finalSnippets.length);
        
    } catch (error) {
        console.error('渲染片段列表失败:', error);
        debugLog('片段列表渲染错误', error);
        this.showError('加载片段列表失败');
    }
}

  /**
   * 创建片段卡片元素
   * @param {Object} snippet - 片段数据对象
   * @returns {HTMLElement} 片段元素
   */
  createSnippetElement(snippet) {
    debugLog("创建片段元素", snippet.snippetId);

    const element = document.createElement("div");
    element.className = "snippet-card";
    element.dataset.snippetId = snippet.snippetId;

    // 置顶标记
    const topBadge = snippet.isTop ? '<span class="badge-top">置顶</span>' : "";

    element.innerHTML = `
            <div class="snippet-title">${snippet.shortName} ${topBadge}</div>
            <div class="snippet-content">${snippet.content}</div>
        `;

    // 绑定点击事件
    element.addEventListener("click", () => {
      debugLog("片段卡片点击", snippet.snippetId);
      this.selectSnippet(snippet);
    });

    return element;
  }

  /**
   * 选择片段
   * @param {Object} snippet - 选中的片段对象
   */
  selectSnippet(snippet) {
    try {
      debugLog("选择片段", snippet);

      if (!this.state.currentTag) return;

      // 保存选择的片段
      this.state.selectedSnippets.set(this.state.currentTag.slug, snippet);

      // 更新标签按钮显示
      const tagButton = document.querySelector(
        `[data-tag-slug="${this.state.currentTag.slug}"]`
      );
      if (tagButton) {
        tagButton.textContent = snippet.shortName;
        tagButton.classList.remove("tag-placeholder");
        tagButton.classList.add("tag-selected");
      }

      // 更新片段卡片选中状态
      document.querySelectorAll(".snippet-card").forEach((card) => {
        card.classList.remove("snippet-selected");
      });

      const selectedCard = document.querySelector(
        `[data-snippet-id="${snippet.snippetId}"]`
      );
      if (selectedCard) {
        selectedCard.classList.add("snippet-selected");
      }

      // 更新状态
      this.updateStatusDisplay("片段已选择");

      debugLog("片段选择完成");
    } catch (error) {
      console.error("选择片段失败:", error);
      this.showError("选择片段失败");
    }
  }

  /**
   * 切换模式
   * @param {string} mode - 目标模式 (compose/manual/edit)
   */
  async switchMode(mode) {
    try {
      debugLog("切换模式", mode);

      this.state.currentMode = mode;

      // 更新标签页状态
      document.querySelectorAll(".tab-button").forEach((tab) => {
        tab.classList.remove("state-active");
      });

      if (mode === "compose") {
        this.elements["tab-compose"].classList.add("state-active");
      } else if (mode === "manual") {
        this.elements["tab-manual"].classList.add("state-active");
      }

      // 重新渲染公式显示区
      if (this.state.currentFormula) {
        await this.renderFormulaDisplay();
      }

      debugLog("模式切换完成");
    } catch (error) {
      console.error("切换模式失败:", error);
      this.showError("切换模式失败");
    }
  }

  /**
   * 复制提示词到剪贴板
   */
  async copyPrompt() {
    try {
      debugLog("开始复制提示词");

      const prompt = this.generateFinalPrompt();

      if (!prompt) {
        this.showError("没有可复制的内容");
        return;
      }

      // 检查未完成的标签
      const incompleteTags = this.getIncompleteTags();
      if (incompleteTags.length > 0) {
        this.showWarning(
          `提示：还有 ${incompleteTags.length} 个标签未选择片段`
        );
      }

      // 复制到剪贴板
      await navigator.clipboard.writeText(prompt);

      this.showSuccess("提示词已复制到剪贴板");
      this.updateStatusDisplay("已复制");

      debugLog("提示词复制完成", prompt);
    } catch (error) {
      console.error("复制提示词失败:", error);
      this.showError("复制失败，请手动选择文本复制");
    }
  }

  /**
   * 生成最终提示词
   * @returns {string} 完整的提示词文本
   */
  generateFinalPrompt() {
    debugLog("生成最终提示词");

    if (!this.state.currentFormula) {
      return "";
    }

    let prompt = this.state.currentFormula.content;

    // 替换标签为选中的片段内容
    this.state.selectedSnippets.forEach((snippet, tagSlug) => {
      const tagPattern = new RegExp(`#\\{${tagSlug}\\}`, "g");
      prompt = prompt.replace(tagPattern, snippet.content);
    });

    debugLog("最终提示词生成完成", prompt);
    return prompt;
  }

  /**
   * 获取未完成的标签列表
   * @returns {Array} 未选择片段的标签列表
   */
  getIncompleteTags() {
    if (!this.state.currentFormula) return [];

    const tagRegex = /#\{([^}]+)\}/g;
    const allTags = [];
    let match;

    while (
      (match = tagRegex.exec(this.state.currentFormula.content)) !== null
    ) {
      allTags.push(match[1]);
    }

    const incompleteTags = allTags.filter(
      (tag) => !this.state.selectedSnippets.has(tag)
    );

    debugLog("未完成标签检查", { allTags, incompleteTags });
    return incompleteTags;
  }

  /**
   * 清空片段面板
   */
  clearSnippetPanel() {
    debugLog("清空片段面板");

    this.elements["current-tag-name"].textContent = "选择标签查看片段";
    this.elements["btn-add-snippet"].disabled = true;
    this.elements["snippet-list-container"].innerHTML = "";
    this.state.currentTag = null;
  }

  /**
   * 显示添加片段模态框
   */
  showAddSnippetModal() {
    debugLog("显示添加片段模态框");

    if (!this.state.currentTag) {
      this.showError("请先选择一个标签");
      return;
    }

    // 重置表单
    this.resetAddSnippetForm();

    // 设置当前标签
    const tagsInput = this.elements["snippet-tags-input"];
    if (tagsInput && this.state.currentTag.tag) {
      tagsInput.value = `#{${this.state.currentTag.displayName}|${this.state.currentTag.slug}}`;
    }

    // 显示模态框
    this.elements["modal-overlay"].classList.remove("hidden");

    debugLog("添加片段模态框已显示");
  }

  /**
   * 隐藏模态框
   */
  hideModal() {
    debugLog("隐藏模态框");

    this.elements["modal-overlay"].classList.add("hidden");
    this.resetAddSnippetForm();
  }

  /**
   * 重置添加片段表单
   */
  resetAddSnippetForm() {
    debugLog("重置添加片段表单");

    const form = this.elements["add-snippet-form"];
    if (form) {
      form.reset();
    }

    // 重置片段项容器
    const container = this.elements["snippet-items-container"];
    if (container) {
      container.innerHTML = `
                <div class="snippet-item-form">
                    <input type="text" class="snippet-short-name form-input" placeholder="短名称">
                    <textarea class="snippet-content form-textarea" placeholder="正文内容" rows="2"></textarea>
                    <button type="button" class="btn-remove-snippet btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      // 绑定删除按钮事件
      this.bindSnippetItemEvents(container);
    }
  }

  /**
   * 添加片段项表单
   */
  addSnippetItemForm() {
    debugLog("添加片段项表单");

    const container = this.elements["snippet-items-container"];
    if (!container) return;

    const itemForm = document.createElement("div");
    itemForm.className = "snippet-item-form";
    itemForm.innerHTML = `
            <input type="text" class="snippet-short-name form-input" placeholder="短名称">
            <textarea class="snippet-content form-textarea" placeholder="正文内容" rows="2"></textarea>
            <button type="button" class="btn-remove-snippet btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        `;

    container.appendChild(itemForm);

    // 绑定事件
    this.bindSnippetItemEvents(itemForm);

    debugLog("片段项表单已添加");
  }

  /**
   * 绑定片段项事件
   * @param {HTMLElement} container - 容器元素
   */
  bindSnippetItemEvents(container) {
    const removeButtons = container.querySelectorAll(".btn-remove-snippet");
    removeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        debugLog("删除片段项");
        const itemForm = e.target.closest(".snippet-item-form");
        if (itemForm && container.children.length > 1) {
          itemForm.remove();
        }
      });
    });
  }
  /**
   * 保存新片段到数据库
   * @param {Array} snippetItems - 片段项数组
   * @param {Array} processedTags - 处理后的标签数组
   */
/**
 * 保存新片段到数据库
 */
async saveSnippetsToDatabase(snippetItems, processedTags) {
    try {
        debugLog('开始保存片段到数据库', { snippetItems, processedTags });
        
        const savedSnippets = [];
        
        for (const item of snippetItems) {
            // 生成片段ID
            const snippetId = `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // 收集所有标签ID - 确保统一格式
            const tagIds = [];
            
            processedTags.forEach(tag => {
                // 统一使用tagId作为关联标识
                if (tag.tagId) tagIds.push(tag.tagId);
            });
            
            const snippetData = {
                snippetId: snippetId,
                shortName: item.shortName || item.content,
                content: item.content,
                tagIds: tagIds,  // 只使用tagId，确保格式一致
                isTop: false,
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            debugLog('准备保存片段', snippetData);
            
            // 保存到MiniDB
            await this.collections.snippets.upsert(snippetData);
            savedSnippets.push(snippetData);
            
            debugLog('片段保存成功', snippetData);
        }
        
        return savedSnippets;
        
    } catch (error) {
        console.error('保存片段失败:', error);
        debugLog('片段保存错误', error);
        throw error;
    }
}

  /**
   * 保存新片段
   */
  async saveNewSnippets() {
    try {
      debugLog("开始保存新片段");

      // 解析标签输入
      const tagsInput = this.elements["snippet-tags-input"].value.trim();
      const tags = this.parseTagsInput(tagsInput);

      if (tags.length === 0) {
        this.showError("请输入至少一个标签");
        return;
      }

      // 收集片段数据
      const snippetItems = this.collectSnippetItems();

      if (snippetItems.length === 0) {
        this.showError("请添加至少一个片段");
        return;
      }

      // 处理标签（创建或查找）
      const processedTags = await this.processTagsForSnippets(tags);

      // 创建片段记录
      const newSnippets = snippetItems.map((item) => ({
        snippetId: `snippet-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        shortName: item.shortName || item.content,
        content: item.content,
        tagIds: processedTags.map((tag) => tag.tagId),
        isTop: false,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));

      // 保存到数据库
      await this.collections.snippets.upsert(newSnippets);

      // 刷新当前标签的片段列表
      if (this.state.currentTag && this.state.currentTag.tag) {
        await this.renderSnippetList(this.state.currentTag.tag);
      }

      // 关闭模态框
      this.hideModal();

      this.showSuccess(`成功添加 ${newSnippets.length} 个片段`);

      debugLog("新片段保存完成", newSnippets);
    } catch (error) {
      console.error("保存新片段失败:", error);
      this.showError("保存片段失败");
    }
  }

  /**
   * 解析标签输入
   * @param {string} input - 标签输入字符串
   * @returns {Array} 解析后的标签数组
   */
  parseTagsInput(input) {
    debugLog("解析标签输入", input);

    const tags = [];
    const tagRegex = /#\{([^|]+)\|([^}]+)\}|(\S+)/g;
    let match;

    while ((match = tagRegex.exec(input)) !== null) {
      if (match[1] && match[2]) {
        // #{短名称|标签名} 格式
        tags.push({
          displayName: match[1].trim(),
          slug: match[2].trim(),
        });
      } else if (match[3]) {
        // 简单格式
        const tagName = match[3].trim();
        tags.push({
          displayName: tagName,
          slug: tagName,
        });
      }
    }

    debugLog("标签解析完成", tags);
    return tags;
  }

  /**
   * 收集片段项数据
   * @returns {Array} 片段项数组
   */
  collectSnippetItems() {
    debugLog("收集片段项数据");

    const items = [];
    const itemForms =
      this.elements["snippet-items-container"].querySelectorAll(
        ".snippet-item-form"
      );

    itemForms.forEach((form) => {
      const shortName = form.querySelector(".snippet-short-name").value.trim();
      const content = form.querySelector(".snippet-content").value.trim();

      if (content) {
        items.push({
          shortName: shortName || content,
          content: content,
        });
      }
    });

    debugLog("片段项收集完成", items);
    return items;
  }

  /**
   * 处理标签（创建或查找）
   * @param {Array} tags - 标签数组
   * @returns {Array} 处理后的标签对象数组
   */
  async processTagsForSnippets(tags) {
    debugLog("处理标签", tags);

    const processedTags = [];

    for (const tag of tags) {
      // 查找现有标签
      let existingTag = await this.collections.tags.findOne({ slug: tag.slug });

      if (!existingTag) {
        // 创建新标签
        const newTag = {
          tagId: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          slug: tag.slug,
          displayName: tag.displayName,
          isMultiSelect: false,
          sortOrder: 999,
          isTop: false,
          parentId: null,
          createdAt: new Date().toISOString(),
        };

        await this.collections.tags.upsert([newTag]);
        existingTag = newTag;

        debugLog("创建新标签", newTag);
      }

      processedTags.push(existingTag);
    }

    debugLog("标签处理完成", processedTags);
    return processedTags;
  }

  /**
   * 模型过滤
   * @param {string} modelId - 模型ID
   */
  async filterFormulasByModel(modelId) {
    debugLog("按模型过滤公式", modelId);

    const searchQuery = this.elements["formula-search-input"].value;
    await this.renderFormulaList(modelId, searchQuery);
  }

  /**
   * 搜索公式
   * @param {string} query - 搜索关键词
   */
  async searchFormulas(query) {
    debugLog("搜索公式", query);

    const modelFilter = this.elements["model-filter-dropdown"].value;
    await this.renderFormulaList(modelFilter, query);
  }

  /**
   * 切换侧边栏（移动端）
   */
  toggleSidebar() {
    debugLog("切换侧边栏");

    const sidebar = this.elements["sidebar-container"];
    if (sidebar) {
      sidebar.classList.toggle("sidebar-expanded");
    }
  }

  /**
   * 设置移动端适配
   */
  setupMobileAdaptation() {
    debugLog("设置移动端适配");

    const container = this.elements["app-container"];
    if (this.state.isMobile) {
      container.classList.add("mobile");
    } else {
      container.classList.remove("mobile");
    }
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    const wasMobile = this.state.isMobile;
    this.state.isMobile = window.innerWidth <= 768;

    if (wasMobile !== this.state.isMobile) {
      debugLog("设备类型变化", this.state.isMobile ? "移动端" : "桌面端");
      this.setupMobileAdaptation();
    }
  }

  /**
   * 更新状态显示
   * @param {string} status - 状态文本
   */
  updateStatusDisplay(status) {
    debugLog("更新状态显示", status);

    if (this.elements["status-text"]) {
      this.elements["status-text"].textContent = status;
    }
  }

  /**
   * 显示成功消息
   * @param {string} message - 消息内容
   */
  showSuccess(message) {
    debugLog("显示成功消息", message);
    // TODO: 实现非模态提示组件
    console.log("✅ " + message);
  }

  /**
   * 显示警告消息
   * @param {string} message - 消息内容
   */
  showWarning(message) {
    debugLog("显示警告消息", message);
    // TODO: 实现非模态提示组件
    console.log("⚠️ " + message);
  }

  /**
   * 显示错误消息
   * @param {string} message - 消息内容
   */
  showError(message) {
    debugLog("显示错误消息", message);
    // TODO: 实现非模态提示组件
    console.error("❌ " + message);
  }

  /**
   * 提交提示词（预留功能）
   */
  submitPrompt() {
    debugLog("提交提示词（预留功能）");
    this.showWarning("提交功能暂未实现");
  }

  /**
   * 渲染手动模式（预留）
   */
  async renderManualMode() {
    debugLog("渲染手动模式（预留）");
    const displayArea = this.elements["formula-display-area"];
    displayArea.innerHTML =
      '<div class="placeholder-text">手动模式开发中...</div>';
  }

  /**
   * 渲染编辑模式（预留）
   */
  async renderEditMode() {
    debugLog("渲染编辑模式（预留）");
    const displayArea = this.elements["formula-display-area"];
    displayArea.innerHTML =
      '<div class="placeholder-text">编辑模式开发中...</div>';
  }

  /**
   * 验证数据完整性（调试用）
   */
  async validateDataIntegrity() {
    try {
      debugLog("开始验证数据完整性");

      // 检查所有集合的数据
      const formulas = await this.collections.formulas.find({}).fetch();
      const models = await this.collections.models.find({}).fetch();
      const snippets = await this.collections.snippets.find({}).fetch();
      const tags = await this.collections.tags.find({}).fetch();

      debugLog("数据统计", {
        formulas: formulas.length,
        models: models.length,
        snippets: snippets.length,
        tags: tags.length,
      });

      // 检查片段和标签的关联关系
      const tagMap = new Map();
      tags.forEach((tag) => {
        tagMap.set(tag.tagId, tag);
        tagMap.set(tag.slug, tag);
        tagMap.set(tag._id, tag);
      });

      debugLog("标签映射表", Array.from(tagMap.keys()));

      // 检查每个片段的标签关联
      snippets.forEach((snippet) => {
        debugLog("片段标签关联检查", {
          snippetId: snippet.snippetId,
          shortName: snippet.shortName,
          tagIds: snippet.tagIds,
          validTags: snippet.tagIds.filter((tagId) => tagMap.has(tagId)),
        });
      });

      // 特别检查 character 标签的片段
      const characterSnippets = snippets.filter((snippet) =>
        snippet.tagIds.some(
          (tagId) =>
            tagId === "character" || tagMap.get(tagId)?.slug === "character"
        )
      );

      debugLog("character 标签关联的片段", characterSnippets);
    } catch (error) {
      console.error("数据验证失败:", error);
    }
  }
}

/**
 * 应用入口点
 * 页面加载完成后初始化应用
 */
document.addEventListener("DOMContentLoaded", async () => {
  debugLog("页面加载完成，开始初始化应用");

  try {
    const app = new AISpellbookApp();
    await app.init();

    // 将应用实例挂载到全局，便于调试
    window.AISpellbook = app;

    debugLog("应用启动成功");
  } catch (error) {
    console.error("应用启动失败:", error);
    document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #dc3545;">
                <h2>应用启动失败</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">重新加载</button>
            </div>
        `;
  }
});
