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
const DEBUG_MODE = false;

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

        this.updateEditFormulaButtonState();

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
      "action-bar",
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
            
            this.showSuccess('欢迎回来，应用正在初始化...');
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
            this.showSuccess('首次打开应用，正在初始化数据，请稍候...');
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
        query.modelIds = { $eq: [modelFilter] };
        // query.$or=[{modelIds :{ $elemMatch: { $eq: modelFilter}}}];
        
        // query.modelIds = { $like: `[${modelFilter}]` };
      }
      console.log('过滤模形请求',query);
      // 获取公式数据
      let formulas = await this.collections.formulas
        .find(query, {
          sort: [["isTop","desc"], ["updatedAt","desc"]],
        })
        .fetch();

        console.log(formulas);

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
    const icon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scroll-text-icon lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>';
    // 置顶标记
    const topBadge = formula.isTop ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-icon lucide-pin"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>' : "";

    // 模型标签
    const modelBadges = formula.modelIds
      ? formula.modelIds
          .map((id) => `<span class="badge-model">${id}</span>`)
          .join("")
      : "";

    element.innerHTML = `
           
            <div class="formula-title"> <b class="color-icon">${icon}</b>${formula.title} ${topBadge}</div>
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
/**
 * 选择公式
 * @param {Object} formula - 公式对象
 */
selectFormula(formula) {
    try {
        debugLog('选择公式', formula);
        
        this.state.currentFormula = formula;
        
        // 渲染公式显示区
        this.renderFormulaDisplay(this.state.currentMode);
        
        // 清空片段面板
        this.clearSnippetPanel();
        
        // 清空已选择的片段
        this.state.selectedSnippets = new Map();
        
        // 更新状态显示
        this.updateStatusDisplay('公式已选择');
        
        // 更新修改公式按钮状态
        this.updateEditFormulaButtonState();
        
        debugLog('公式选择完成');
        
    } catch (error) {
        console.error('选择公式失败:', error);
        debugLog('公式选择错误', error);
        this.showError('加载公式失败');
    }
}
/**
 * 渲染公式显示区
 * @param {string} mode - 当前模式: compose/manual/edit
 */
renderFormulaDisplay(mode) {
    try {
        debugLog('开始渲染公式显示区', mode);
        
        const displayArea = this.elements['formula-display-area'];

        displayArea.classList.remove('edit');
        displayArea.classList.remove('manual');
        displayArea.classList.remove('compose');
        
        displayArea.classList.add(mode);

        if (!displayArea) return;
        
        // 清空显示区
        displayArea.innerHTML = '';
        
        // 如果没有选中的公式，显示提示信息
        if (!this.state.currentFormula && mode != 'edit') {
            displayArea.innerHTML = '<p class="placeholder-text">1.请从选择一个公式开始</p>';
            return;
        }
        console.log(mode)
        // 根据模式渲染不同内容
        if (mode === 'compose') {
            this.renderComposeMode();
        } else if (mode === 'manual') {
            this.renderManualMode();
        } else if (mode === 'edit') {
            this.renderEditMode();
        }else{
             this.renderComposeMode();
        }
        
        debugLog('公式显示区渲染完成');
        
    } catch (error) {
        console.error('渲染公式显示区失败:', error);
        debugLog('公式显示区渲染错误', error);
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
 * 处理标签按钮点击事件
 * 负责协调标签选择和片段显示流程
 * @param {Object} tagInfo - 标签信息对象
 */
async handleTagButtonClick(tagInfo) {
    try {
        debugLog('标签按钮点击', tagInfo.slug);
        
        // 检查是否为标签对象，如果是直接传递
        if (tagInfo.tag) {
            await this.selectTag(tagInfo);
        } else {
            // 构建完整的标签对象并传递
            const tag = await this.collections.tags.findOne({ 
                $or: [
                    { tagId: tagInfo.slug },
                    { slug: tagInfo.slug }
                ]
            });
            
            if (tag) {
                await this.selectTag({
                    type: 'tag',
                    slug: tag.slug || tag.tagId,
                    displayName: tag.displayName,
                    tag: tag
                });
            } else {
                this.showError(`未找到标签: ${tagInfo.slug}`);
            }
        }
    } catch (error) {
        console.error('处理标签按钮点击失败:', error);
        debugLog('标签按钮点击错误', error);
        this.showError('加载标签内容失败');
    }
}

/**
 * 创建片段卡片元素
 * @param {Object} snippet - 片段对象
 * @returns {HTMLElement} 片段卡片元素
 */
createSnippetElement(snippet) {
    try {
        const snippetCard = document.createElement('div');
        snippetCard.className = 'snippet-card';
        snippetCard.setAttribute('data-id', snippet.snippetId);
        
        // 创建片段标题
        const titleElement = document.createElement('div');
        titleElement.className = 'snippet-title';
        titleElement.textContent = snippet.shortName;
        
        // 创建片段内容
        const contentElement = document.createElement('div');
        contentElement.className = 'snippet-content';
        contentElement.textContent = snippet.content;
        
        //添加图标
        const iconContainer = document.createElement('b');
        iconContainer.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-puzzle-icon lucide-puzzle"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/></svg>';

        iconContainer.classList.add('color-icon');
        snippetCard.appendChild(iconContainer)

        // 添加到卡片
        snippetCard.appendChild(titleElement);
        snippetCard.appendChild(contentElement);
        
        // 添加点击事件 - 选中片段时更新标签按钮
        snippetCard.addEventListener('click', () => {
            if (this.state.currentTag) {
                this.handleSnippetSelect(snippet, this.state.currentTag.slug);
            }
        });
        
        return snippetCard;
        
    } catch (error) {
        console.error('创建片段卡片失败:', error);
        debugLog('片段卡片创建错误', error);
        
        // 创建一个错误状态的卡片
        const errorCard = document.createElement('div');
        errorCard.className = 'snippet-card state-error';
        errorCard.textContent = '片段加载失败';
        return errorCard;
    }
}


/**
 * 处理片段选择
 * @param {Object} snippet - 片段对象
 * @param {string} tagSlug - 标签标识符
 */
handleSnippetSelect(snippet, tagSlug) {
    try {
        debugLog('选择片段', { snippet, tagSlug });
        
        // 存储已选择的片段
        this.state.selectedSnippets.set(tagSlug, snippet);
        
        // 更新标签按钮显示
        this.updateTagButtonDisplay(tagSlug, snippet);
        
        // 【新增】重新渲染整个公式显示区，确保UI立即更新
        // this.renderFormulaDisplay(this.state.currentMode);
       
        // 更新状态显示
        this.updateStatusDisplay('已选择片段');
        
        // 启用复制按钮
        if (this.elements['btn-copy']) {
            this.elements['btn-copy'].disabled = false;
        }
        
        debugLog('片段选择完成');
        
    } catch (error) {
        console.error('选择片段失败:', error);
        debugLog('片段选择错误', error);
        this.showError('选择片段失败');
    }
}


/**
 * 更新标签按钮显示
 * 根据选中的片段更新对应标签按钮的显示内容
 * @param {string} tagSlug - 标签标识符
 * @param {Object} snippet - 片段对象
 */
updateTagButtonDisplay(tagSlug, snippet) {
    try {
        // 找到对应的标签按钮
        const tagButton = document.querySelector(`.tag-button[data-tag="${tagSlug}"]`);
        if (!tagButton){
            debugLog('未在渲染区找到标签！')
            return;
        } else{
            console.log(tagButton)
        }
        
        // 清空按钮内容
        tagButton.innerHTML = '';
        
        // 创建短标题元素
        const shortTitleSpan = document.createElement('span');
        shortTitleSpan.className = 'tag-snippet-title';
        shortTitleSpan.textContent = snippet.shortName;
        
        // 创建正文元素
        const contentSpan = document.createElement('span');
        contentSpan.className = 'tag-snippet-content';
        contentSpan.textContent = snippet.content;
        
        // 添加到按钮
        tagButton.appendChild(shortTitleSpan);
        tagButton.appendChild(contentSpan);
        
        // 添加选中状态样式
        tagButton.classList.add('state-selected');
        tagButton.classList.remove('tag-placeholder');

        // 【新增】重新渲染整个公式显示区，确保UI立即更新
        // this.renderFormulaDisplay(this.state.currentMode);

    } catch (error) {
        console.error('更新标签按钮显示失败:', error);
        debugLog('标签按钮更新错误', error);
    }
}
/**
 * 创建标签按钮
 * @param {Object} tagInfo - 标签信息对象
 * @returns {HTMLElement} 标签按钮元素
 */
createTagButton(tagInfo) {
    try {
        debugLog('创建标签按钮', tagInfo);
        
        const tagButton = document.createElement('button');
        tagButton.className = 'tag-button';
        tagButton.setAttribute('data-tag', tagInfo.slug);
        
        // 检查是否已选择该标签的片段
        const selectedSnippet = this.state.selectedSnippets.get(tagInfo.slug);
        
        if (selectedSnippet) {
            // 已选择片段，显示片段的短标题和正文
            const shortTitleSpan = document.createElement('span');
            shortTitleSpan.className = 'tag-snippet-title';
            shortTitleSpan.textContent = selectedSnippet.shortName;
            
            const contentSpan = document.createElement('span');
            contentSpan.className = 'tag-snippet-content';
            contentSpan.textContent = selectedSnippet.content;
            
            tagButton.appendChild(shortTitleSpan);
            tagButton.appendChild(contentSpan);
            tagButton.classList.add('state-selected');
        } else {
            // 未选择片段，显示标签名
            tagButton.textContent = `#${tagInfo.displayName}`;
            tagButton.classList.add('tag-placeholder');
        }
        
        // 添加点击事件
        tagButton.addEventListener('click', () => {
            this.handleTagButtonClick(tagInfo);
        });
        
        return tagButton;
        
    } catch (error) {
        console.error('创建标签按钮失败:', error);
        debugLog('标签按钮创建错误', error);
        
        // 创建一个错误状态的按钮
        const errorButton = document.createElement('button');
        errorButton.className = 'tag-button state-error';
        errorButton.textContent = `#${tagInfo.displayName || '未知标签'}`;
        return errorButton;
    }
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
//   createSnippetElement(snippet) {
//     debugLog("创建片段元素", snippet.snippetId);

//     const element = document.createElement("div");
//     element.className = "snippet-card";
//     element.dataset.snippetId = snippet.snippetId;

//     // 置顶标记
//     const topBadge = snippet.isTop ? '<span class="badge-top">置顶</span>' : "";

//     element.innerHTML = `
//             <div class="snippet-title">${snippet.shortName} ${topBadge}</div>
//             <div class="snippet-content">${snippet.content}</div>
//         `;

//     // 绑定点击事件
//     element.addEventListener("click", () => {
//       debugLog("片段卡片点击", snippet.snippetId);
//       this.selectSnippet(snippet);
//     });

//     return element;
//   }

  /**
   * 选择片段
   * @param {Object} snippet - 选中的片段对象
   */
//   selectSnippet(snippet) {
//     try {
//       debugLog("选择片段", snippet);

//       if (!this.state.currentTag) return;

//       // 保存选择的片段
//       this.state.selectedSnippets.set(this.state.currentTag.slug, snippet);

//       // 更新标签按钮显示
//       const tagButton = document.querySelector(
//         `[data-tag-slug="${this.state.currentTag.slug}"]`
//       );
//       if (tagButton) {
//         tagButton.textContent = snippet.shortName;
//         tagButton.classList.remove("tag-placeholder");
//         tagButton.classList.add("tag-selected");
//       }

//       // 更新片段卡片选中状态
//       document.querySelectorAll(".snippet-card").forEach((card) => {
//         card.classList.remove("snippet-selected");
//       });

//       const selectedCard = document.querySelector(
//         `[data-snippet-id="${snippet.snippetId}"]`
//       );
//       if (selectedCard) {
//         selectedCard.classList.add("snippet-selected");
//       }

//       // 更新状态
//       this.updateStatusDisplay("片段已选择");

//       debugLog("片段选择完成");
//     } catch (error) {
//       console.error("选择片段失败:", error);
//       this.showError("选择片段失败");
//     }
//   }

/**
 * 切换应用模式
 * @param {string} mode - 目标模式: compose/manual/edit
 */
switchMode(mode) {
    try {
        debugLog(`切换到${mode}模式`);
        
        if (mode === this.state.currentMode) {
            debugLog('已经处于该模式，无需切换');
            return;
        }
        
        // 更新当前模式
        this.state.currentMode = mode;
        
        // 更新导航标签状态
        const tabCompose = this.elements['tab-compose'];
        const tabManual = this.elements['tab-manual'];
        const btnEditFormula = this.elements['btn-edit-formula'];
        
        if (tabCompose) tabCompose.classList.remove('state-active');
        if (tabManual) tabManual.classList.remove('state-active');
        if (btnEditFormula) btnEditFormula.classList.remove('state-active');
        
        if (mode === 'edit' && btnEditFormula) {
            btnEditFormula.classList.add('state-active');

        } else if (mode === 'manual' && tabManual) {
            tabManual.classList.add('state-active');
        }else{
            tabCompose.classList.add('state-active');
        }
        



        // 编辑模式特殊处理
        if (mode === 'edit') {
            // if (btnEditFormula) btnEditFormula.style.display = 'none';
            // 在编辑模式中隐藏复制和提交按钮
            // if (this.elements['btn-copy']) this.elements['btn-copy'].style.display = 'none';
            // if (this.elements['btn-submit']) this.elements['btn-submit'].style.display = 'none';
            if (this.elements['action-bar']) this.elements['action-bar'].style.display = 'none';
            // if (this.elements['form-action-bar']) this.elements['form-action-bar'].style.display = 'flex';
            
            // 显示保存和取消按钮 (如果这些元素存在)
            // if (this.elements['btn-save-formula']) this.elements['btn-save-formula'].style.display = 'inline-block';
            // if (this.elements['btn-cancel-edit']) this.elements['btn-cancel-edit'].style.display = 'inline-block';
        } else {
            // if (btnEditFormula) btnEditFormula.style.display = 'inline-block';
            // 在非编辑模式中显示复制按钮
            // if (this.elements['btn-copy']) this.elements['btn-copy'].style.display = 'inline-block';
            // if (this.elements['btn-submit']) this.elements['btn-submit'].style.display = 'inline-block';
            if (this.elements['action-bar']) this.elements['action-bar'].style.display = 'flex';
            // if (this.elements['form-action-bar']) this.elements['form-action-bar'].style.display = 'none';
            
            // 隐藏保存和取消按钮 (如果这些元素存在)
            // if (this.elements['btn-save-formula']) this.elements['btn-save-formula'].style.display = 'none';
            // if (this.elements['btn-cancel-edit']) this.elements['btn-cancel-edit'].style.display = 'none';
        }
        
        // 渲染公式显示区
        this.renderFormulaDisplay(mode);
        
    } catch (error) {
        console.error('切换模式失败:', error);
        debugLog('模式切换错误', error);
    }
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息内容
 */
showError(message) {
    console.error(message);
    
    // 如果有状态文本元素，更新状态
    if (this.elements['status-text']) {
        this.elements['status-text'].textContent = message;
        this.elements['status-text'].style.color = '#dc3545';
        
        // 3秒后恢复
        setTimeout(() => {
            this.elements['status-text'].textContent = '就绪';
            this.elements['status-text'].style.color = '';
        }, 3000);
    }
    
    // 非模态提示
    const errorToast = document.createElement('div');
    errorToast.className = 'toast-message error';
    errorToast.textContent = message;
    
    document.body.appendChild(errorToast);
    
    // 3秒后移除
    setTimeout(() => {
        errorToast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(errorToast);
        }, 300);
    }, 3000);
}

/**
 * 显示成功消息
 * @param {string} message - 成功消息内容
 */
showSuccess(message) {
    // 如果有状态文本元素，更新状态
    if (this.elements['status-text']) {
        this.elements['status-text'].textContent = message;
        this.elements['status-text'].style.color = '#28a745';
        
        // 3秒后恢复
        setTimeout(() => {
            this.elements['status-text'].textContent = '就绪';
            this.elements['status-text'].style.color = '';
        }, 3000);
    }
    
    // 非模态提示
    const successToast = document.createElement('div');
    successToast.className = 'toast-message success';
    successToast.textContent = message;
    
    document.body.appendChild(successToast);
    
    // 3秒后移除
    setTimeout(() => {
        successToast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(successToast);
        }, 300);
    }, 3000);
    
    // 控制台输出
    console.log('✅ ' + message);
}

  /**
   * 复制提示词到剪贴板
   */
/**
 * 复制提示词到剪贴板
 */
copyPrompt() {
    try {
        debugLog('复制按钮点击');
        
        let promptText = '';
        
        // 根据当前模式获取提示词内容
        if (this.state.currentMode === 'manual') {
            // 从手动编辑的文本区域获取最新内容
            const textArea = document.querySelector('.formula-manual-textarea');
            if (textArea) {
                promptText = textArea.value;
            } else {
                promptText = this.state.manualEditContent || this.getComposedPrompt();
            }
        } else {
            // 组合模式或其他模式，使用合成的提示词
            promptText = this.getComposedPrompt();
        }
        
        if (!promptText) {
            this.showWarning('没有可复制的内容');
            return;
        }
        
        // 复制到剪贴板
        navigator.clipboard.writeText(promptText)
            .then(() => {
                this.showSuccess('提示词已复制到剪贴板');
                debugLog('提示词复制成功', promptText);
            })
            .catch(error => {
                console.error('复制到剪贴板失败:', error);
                this.showError('复制失败，请手动复制');
            });
        
    } catch (error) {
        console.error('复制提示词失败:', error);
        debugLog('提示词复制错误', error);
        this.showError('复制提示词时发生错误');
    }
}
  /**
   * 生成最终提示词
   * @returns {string} 完整的提示词文本
   */
//   generateFinalPrompt() {
//     debugLog("生成最终提示词");

//     if (!this.state.currentFormula) {
//       return "";
//     }

//     let prompt = this.state.currentFormula.content;

//     // 替换标签为选中的片段内容
//     this.state.selectedSnippets.forEach((snippet, tagSlug) => {
//       const tagPattern = new RegExp(`#\\{${tagSlug}\\}`, "g");
//       prompt = prompt.replace(tagPattern, snippet.content);
//     });

//     debugLog("最终提示词生成完成", prompt);
//     return prompt;
//   }

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
    // this.elements["btn-add-snippet"].disabled = true;
    this.elements["snippet-list-container"].innerHTML = "";
    this.state.currentTag = null;
  }

  /**
   * 显示添加片段模态框
   */
  showAddSnippetModal() {
    debugLog("显示添加片段模态框");

    // if (!this.state.currentTag) {
    //   this.showError("请先选择一个标签");
    //   return;
    // }

    // 重置表单
    this.resetAddSnippetForm();

    // 设置当前标签
    if (this.state.currentTag) {
        const tagsInput = this.elements["snippet-tags-input"];
        if (tagsInput && this.state.currentTag.tag) {
            tagsInput.value = `#{${this.state.currentTag.displayName}|${this.state.currentTag.slug}}`;
        }
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
                    <input type="text" class="snippet-short-name form-input" placeholder="短名称(仅供记忆，不会在提示中加入)">
                    <textarea class="snippet-content form-textarea" placeholder="正文内容(将插入在提示中当前标签位置的文字)" rows="2"></textarea>
                    <button type="button" class="btn-remove-snippet btn-danger">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
            <input type="text" class="snippet-short-name form-input" placeholder="短名称(仅供记忆，不会在提示中加入)">
            <textarea class="snippet-content form-textarea" placeholder="正文内容(将插入在提示中当前标签位置的文字)" rows="2"></textarea>
            <button type="button" class="btn-remove-snippet btn-danger">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
// async saveSnippetsToDatabase(snippetItems, processedTags) {
//     try {
//         debugLog('开始保存片段到数据库', { snippetItems, processedTags });
        
//         const savedSnippets = [];
        
//         for (const item of snippetItems) {
//             // 生成片段ID
//             const snippetId = `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
//             // 收集所有标签ID - 确保统一格式
//             const tagIds = [];
            
//             processedTags.forEach(tag => {
//                 // 统一使用tagId作为关联标识
//                 if (tag.tagId) tagIds.push(tag.tagId);
//             });
            
//             const snippetData = {
//                 snippetId: snippetId,
//                 shortName: item.shortName || item.content,
//                 content: item.content,
//                 tagIds: tagIds,  // 只使用tagId，确保格式一致
//                 isTop: false,
//                 updatedAt: new Date().toISOString(),
//                 createdAt: new Date().toISOString()
//             };
            
//             debugLog('准备保存片段', snippetData);
            
//             // 保存到MiniDB
//             await this.collections.snippets.upsert(snippetData);
//             savedSnippets.push(snippetData);
            
//             debugLog('片段保存成功', snippetData);
//         }
        
//         return savedSnippets;
        
//     } catch (error) {
//         console.error('保存片段失败:', error);
//         debugLog('片段保存错误', error);
//         throw error;
//     }
// }

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
   * 显示警告消息
   * @param {string} message - 消息内容
   */
  showWarning(message) {
    debugLog("显示警告消息", message);
    // TODO: 实现非模态提示组件
    console.log("⚠️ " + message);
  }


  /**
   * 提交提示词（预留功能）
   */
  async submitPrompt() {
 
        let promptText = '';
        
        // 根据当前模式获取提示词内容
        if (this.state.currentMode === 'manual') {
            // 从手动编辑的文本区域获取最新内容
            const textArea = document.querySelector('.formula-manual-textarea');
            if (textArea) {
                promptText = textArea.value;
            } else {
                promptText = this.state.manualEditContent || this.getComposedPrompt();
            }
        } else {
            // 组合模式或其他模式，使用合成的提示词
            promptText = this.getComposedPrompt();
        }
        
fetch('/api/catimg/prompt', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
        prompt: promptText
    })
})
.then(response => response.json())
.then(data => {
    console.log('✅ 提交成功:', data);
    // 同时打开新窗口

       // 根据不同原因显示不同的提示
            // if (data.reason === 'app_not_installed') {
            //     console.log('🏪 跳转到应用商店安装catimg');
            // } else if (data.reason === 'prompt_saved') {
                console.log('✅ 提示语已保存，跳转到catimg');
            // }else{
            //   return false;
            // }
            
            // 延迟跳转，让用户看到提示信息
            setTimeout(() => {
                window.open(data.redirect_url, '_blank');
            }, 500);
    // window.open('https://catimg.kagee.heiyu.space/', '_blank');
})
.catch(error => {
    console.error('❌ 提交失败:', error);
});
    
    
  }

 /**
 * 渲染手动修改模式
 * 显示合成后的完整提示词，并允许用户手动编辑
 */
renderManualMode() {
    try {
        debugLog('渲染手动修改模式');
        
        const displayArea = this.elements['formula-display-area'];
        if (!displayArea || !this.state.currentFormula) return;
        
        // 创建可编辑的文本区域
        const textArea = document.createElement('textarea');
        textArea.className = 'formula-manual-textarea';
        textArea.placeholder = '在此编辑提示词...';
        
        // 获取合成后的提示词
        const fullPrompt = this.getComposedPrompt();
        textArea.value = fullPrompt;
        
        // 添加事件监听器，当内容变化时更新
        textArea.addEventListener('input', (e) => {
            this.state.manualEditContent = e.target.value;
        });
        
        displayArea.appendChild(textArea);
        
        // 保存初始内容到状态
        this.state.manualEditContent = fullPrompt;
        
        debugLog('手动修改模式渲染完成');
        
    } catch (error) {
        console.error('渲染手动修改模式失败:', error);
        debugLog('手动修改模式渲染错误', error);
    }
}
/**
 * 获取合成后的完整提示词
 * 将公式中的标签替换为已选择的片段内容
 * @returns {string} 合成后的提示词
 */
getComposedPrompt() {
    try {
        if (!this.state.currentFormula) return '';
        
        // 获取公式内容
        let formula = this.state.currentFormula.content;
        
        // 解析标签并替换为已选择的片段内容
        const tagPattern = /#{([^}]+)}/g;
        const matches = [...formula.matchAll(tagPattern)];
        
        for (const match of matches) {
            const fullTag = match[0]; // #{tag}
            const tagName = match[1]; // tag
            
            // 查找该标签是否已选择片段
            const snippet = this.state.selectedSnippets.get(tagName);
            
            if (snippet) {
                // 替换为片段内容
                formula = formula.replace(fullTag, snippet.content);
            }else{
              formula = formula.replace(fullTag,` random ${tagName} `)
            }
        }
        
        return formula;
        
    } catch (error) {
        console.error('获取合成提示词失败:', error);
        debugLog('提示词合成错误', error);
        return this.state.currentFormula ? this.state.currentFormula.content : '';
    }
}
/**
 * 更新修改公式按钮状态
 * 根据是否有选中的公式调整按钮文本
 */
updateEditFormulaButtonState() {
    try {
        const editButton = this.elements['btn-edit-formula'];
        if (!editButton) return;
        
        // if (this.state.currentFormula) {
        //     // 有选中的公式，显示"修改公式"
        //     editButton.textContent = '<i data-lucide="dna"></i>克隆公式';
        // } else {
        //     // 没有选中的公式，显示"新建公式"
        //     editButton.textContent = '<i data-lucide="plus"></i>新建公式';
        // }
    } catch (error) {
        console.error('更新编辑按钮状态失败:', error);
        debugLog('编辑按钮状态更新错误', error);
    }
}
 /* 渲染编辑公式模式
 * 允许用户编辑公式原文，包含标签的原始形式
 */
renderEditMode() {
    try {
        debugLog('渲染编辑公式模式');
        
        const displayArea = this.elements['formula-display-area'];
        if (!displayArea) return;
        
        // 创建编辑表单容器
        const editContainer = document.createElement('div');
        editContainer.className = 'formula-edit-container';
        
        // 创建公式标题输入
        const titleLabel = document.createElement('label');
        titleLabel.textContent = '公式名称:';
        titleLabel.className = 'form-label';
        
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'formula-title-input form-input';
        titleInput.value = this.state.currentFormula ? this.state.currentFormula.title : '';
        titleInput.id = 'formula-edit-title';
        titleInput.placeholder = '输入公式名称';
        titleInput.required = true;
        
        // 创建公式内容文本区域
        const contentLabel = document.createElement('label');
        contentLabel.textContent = '公式内容:';
        contentLabel.className = 'form-label';
        
        const contentTextarea = document.createElement('textarea');
        contentTextarea.className = 'formula-content-textarea form-textarea';
        contentTextarea.id = 'formula-edit-content';
        contentTextarea.rows = 5;
        contentTextarea.placeholder = '使用 #{标签名} 添加标签，例如: Create a #{character} in #{style} style';
        
        // 设置公式内容
        if (this.state.currentFormula) {
            contentTextarea.value = this.formatFormulaForEditing(this.state.currentFormula.content);
        } else {
            contentTextarea.value = '';
        }
        
        // 创建描述输入
        const descLabel = document.createElement('label');
        descLabel.textContent = '描述 (可选):';
        descLabel.className = 'form-label';
        
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = 'formula-desc-input form-input';
        descInput.value = this.state.currentFormula ? (this.state.currentFormula.description || '') : '';
        descInput.id = 'formula-edit-desc';
        descInput.placeholder = '输入公式描述';
        
        // 创建作者输入
        const authorLabel = document.createElement('label');
        authorLabel.textContent = '作者 (可选):';
        authorLabel.className = 'form-label';
        
        const authorInput = document.createElement('input');
        authorInput.type = 'text';
        authorInput.className = 'formula-author-input form-input';
        authorInput.value = this.state.currentFormula ? (this.state.currentFormula.author || '') : '';
        authorInput.id = 'formula-edit-author';
        authorInput.placeholder = '输入作者信息';
        
        // 创建模型选择
        const modelLabel = document.createElement('label');
        modelLabel.textContent = '适用模型:';
        modelLabel.className = 'form-label';
        
        const modelSelect = document.createElement('select');
        modelSelect.className = 'formula-model-select form-select';
        modelSelect.id = 'formula-edit-model';
        modelSelect.multiple = true;
        
        // 加载模型选项
        this.loadModelOptions(modelSelect);
        
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'formula-edit-buttons';
        
        // 创建保存按钮
        const saveButton = document.createElement('button');
        saveButton.className = 'btn-primary';
        saveButton.textContent = '保存';
        saveButton.id = 'btn-save-formula';
        
        // 创建取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn-secondary';
        cancelButton.textContent = '取消';
        cancelButton.id = 'btn-cancel-edit';
        
        // 添加按钮事件
        saveButton.addEventListener('click', () => this.saveEditedFormula());
        cancelButton.addEventListener('click', () => this.cancelFormulaEdit());
        

        const modelLine=document.createElement('div');
        modelLine.classList.add('form-line')
        modelLine.appendChild(modelLabel);
        modelLine.appendChild(modelSelect);

        const titleLine=document.createElement('div');
        titleLine.classList.add('form-line')
        titleLine.appendChild(titleLabel);
        titleLine.appendChild(titleInput);

        const contentLine=document.createElement('div');
        contentLine.classList.add('form-line')
        contentLine.appendChild(contentLabel);
        contentLine.appendChild(contentTextarea);

        
        const descAndAuthorLine=document.createElement('div');
        descAndAuthorLine.classList.add('form-line')
        descAndAuthorLine.appendChild(descLabel);
        descAndAuthorLine.appendChild(descInput);
        descAndAuthorLine.appendChild(authorLabel);
        descAndAuthorLine.appendChild(authorInput);

        
        const actionBar=document.createElement('div');
        actionBar.classList.add('form-action-bar');
        // actionBar.setAttribute('id','form-action-bar');
        actionBar.appendChild(cancelButton);
        actionBar.appendChild(saveButton);


        // 将所有元素添加到表单
        

        const leftPart=document.createElement('div');
        leftPart.classList.add('left-part');
        const rightPart=document.createElement('div');
        rightPart.classList.add('right-part');
        rightPart.appendChild(modelLine);

        leftPart.appendChild(titleLine);
        leftPart.appendChild(contentLine);
        leftPart.appendChild(descAndAuthorLine);

        const formBox=document.createElement('div');
        formBox.classList.add('form-box');
        formBox.appendChild(leftPart);
        formBox.appendChild(rightPart);

        editContainer.appendChild(formBox);
        editContainer.appendChild(actionBar);
        
        
        // 将表单添加到显示区
        displayArea.appendChild(editContainer);
        
        // 如果有已选中的公式，选中之前设置的模型
        if (this.state.currentFormula && this.state.currentFormula.modelIds && modelSelect.options.length > 0) {
            for (let i = 0; i < modelSelect.options.length; i++) {
                if (this.state.currentFormula.modelIds.includes(modelSelect.options[i].value)) {
                    modelSelect.options[i].selected = true;
                }
            }
        }
        
        // 设置标题输入框焦点
        titleInput.focus();
        
        debugLog('编辑公式模式渲染完成');
        
    } catch (error) {
        console.error('渲染编辑公式模式失败:', error);
        debugLog('编辑公式模式渲染错误', error);
    }
}
/**
 * 加载模型选项到选择框
 * @param {HTMLSelectElement} selectElement - 模型选择框元素
 */
async loadModelOptions(selectElement) {
    try {
        // 获取所有模型
        const models = await this.collections.models.find({}, { 
            sort: ['sortOrder', 'name'] 
        }).fetch();
        
        // 清空现有选项
        selectElement.innerHTML = '';
        
        // 添加模型选项
        models.forEach(model => {
            if (model.isActive) {
                const option = document.createElement('option');
                option.value = model.modelId;
                option.textContent = `${model.name} ${model.version}`;
                selectElement.appendChild(option);
            }
        });
        
    } catch (error) {
        console.error('加载模型选项失败:', error);
        debugLog('模型选项加载错误', error);
    }
}

/**
 * 将公式内容格式化为编辑模式显示
 * 确保标签以 #{标签名} 格式显示
 * @param {string} content - 原始公式内容
 * @returns {string} 格式化后的公式内容
 */
formatFormulaForEditing(content) {
    try {
        // 检查是否已经是编辑格式 (包含 #{tag})
        if (content.includes('#{') && content.includes('}')) {
            return content;
        }
        
        // 将 #tag 格式转换为 #{tag} 格式
        return content.replace(/#(\w+)/g, '#{$1}');
        
    } catch (error) {
        console.error('格式化公式内容失败:', error);
        debugLog('公式格式化错误', error);
        return content;
    }
}

/**
 * 保存编辑后的公式
 */
/**
 * 保存编辑后的公式
 */
async saveEditedFormula() {
    try {
        debugLog('开始保存编辑后的公式');
        
        // 获取表单数据
        const titleInput = document.getElementById('formula-edit-title');
        const contentTextarea = document.getElementById('formula-edit-content');
        const descInput = document.getElementById('formula-edit-desc');
        const authorInput = document.getElementById('formula-edit-author');
        const modelSelect = document.getElementById('formula-edit-model');
        
        if (!titleInput || !contentTextarea) {
            this.showError('表单元素不存在');
            return;
        }
        
        const title = titleInput.value.trim();
        const content = contentTextarea.value.trim();
        
        // 表单验证
        if (!title) {
            this.showError('公式名称不能为空');
            titleInput.focus();
            return;
        }
        
        if (!content) {
            this.showError('公式内容不能为空');
            contentTextarea.focus();
            return;
        }
        
        // 获取选中的模型ID
        const selectedModelIds = [];
        if (modelSelect) {
            for (let i = 0; i < modelSelect.options.length; i++) {
                if (modelSelect.options[i].selected) {
                    selectedModelIds.push(modelSelect.options[i].value);
                }
            }
        }
        
        // 检查是否存在同名公式
        const existingFormula = await this.collections.formulas.findOne({
            title: title,
            formulaId: { $ne: this.state.currentFormula ? this.state.currentFormula.formulaId : null }
        });
        
        let formulaId;
        let createdAt;
        
        if (existingFormula) {
            // 存在同名公式，询问用户是否覆盖
            if (!confirm(`已存在名为"${title}"的公式，是否覆盖？选择"确定"覆盖，选择"取消"修改名称。`)) {
                // 用户选择不覆盖，焦点返回到名称输入框
                titleInput.focus();
                return;
            }
            
            // 用户选择覆盖，使用原公式ID并记录原创建时间
            formulaId = existingFormula.formulaId;
            createdAt = existingFormula.createdAt;
            
            // *** 关键修改：先删除原记录 ***
            debugLog('删除原有公式记录', existingFormula);
            await this.collections.formulas.remove(existingFormula._id);
        } else {
            // 新公式或更新当前公式
            formulaId = this.state.currentFormula 
                ? this.state.currentFormula.formulaId 
                : `formula-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            createdAt = this.state.currentFormula 
                ? this.state.currentFormula.createdAt 
                : new Date().toISOString();
        }
        
        // 如果是更新当前公式，也需要先删除原记录
        if (this.state.currentFormula && !existingFormula) {
            const currentFormulaRecord = await this.collections.formulas.findOne({
                formulaId: this.state.currentFormula.formulaId
            });
            
            if (currentFormulaRecord) {
                debugLog('删除当前公式记录', currentFormulaRecord);
                await this.collections.formulas.remove(currentFormulaRecord._id);
            }
        }
        
        // 准备保存的数据
        const formulaData = {
            formulaId: formulaId,
            title: title,
            content: content,
            description: descInput ? descInput.value.trim() : '',
            author: authorInput ? authorInput.value.trim() : '',
            modelIds: selectedModelIds,
            isTop: this.state.currentFormula ? (this.state.currentFormula.isTop || false) : false,
            updatedAt: new Date().toISOString(),
            createdAt: createdAt
        };
        
        // 保存到数据库
        await this.collections.formulas.upsert(formulaData);
        
        // 更新当前公式
        this.state.currentFormula = formulaData;
        
        // 切换回组合模式
        this.switchMode('compose');
        
        // 刷新公式列表
        await this.renderFormulaList(
            this.elements['model-filter-dropdown'] ? this.elements['model-filter-dropdown'].value : '',
            this.elements['formula-search-input'] ? this.elements['formula-search-input'].value : ''
        );
        
        // 显示成功消息
        this.showSuccess('公式保存成功');
        
        debugLog('公式保存完成', formulaData);
        
    } catch (error) {
        console.error('保存公式失败:', error);
        debugLog('公式保存错误', error);
        this.showError('保存公式失败: ' + error.message);
    }
}
/**
 * 取消公式编辑
 */
cancelFormulaEdit() {
    debugLog('取消公式编辑');
    
    // 检查是否有未保存的更改
    const contentTextarea = document.getElementById('formula-edit-content');
    const titleInput = document.getElementById('formula-edit-title');
    
    if (contentTextarea && titleInput) {
        const hasContentChanges = contentTextarea.value.trim() !== this.formatFormulaForEditing(this.state.currentFormula.content);
        const hasTitleChanges = titleInput.value.trim() !== this.state.currentFormula.title;
        
        if (hasContentChanges || hasTitleChanges) {
            // 确认是否放弃更改
            if (!confirm('您有未保存的更改，确定要放弃吗？')) {
                return;
            }
        }
    }
    
    // 切换回组合模式
    this.switchMode('compose');
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
