import { miniDBService } from './minidb.js';

/**
 * 主应用类
 * 管理整个应用的状态和交互
 */
class AISpellbookApp {
  constructor() {
    this.currentFormula = null;
    this.currentMode = 'compose';
    this.selectedTags = new Map(); // tag -> snippet mapping
    this.formulas = [];
    this.models = [];
    this.snippets = [];
    this.tags = [];
    this.settings = {};
    
    this.init();
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      this.showNotification('正在初始化应用...', 'info');
      
      // 绑定事件监听器
      this.bindEventListeners();
      
      // 加载初始数据
      await this.loadInitialData();
      
      // 渲染界面
      this.renderUI();
      
      this.showNotification('应用初始化完成', 'success');
    } catch (error) {
      console.error('应用初始化失败:', error);
      this.showNotification(`应用初始化失败: ${error.message}`, 'error');
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 测试页面按钮
    const testPageBtn = document.getElementById('test-page-btn');
    if (testPageBtn) {
      testPageBtn.addEventListener('click', () => {
        window.location.href = '/test.html';
      });
    }

    // 侧边栏切换（移动端）
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarContent = document.getElementById('sidebar-content');
    if (sidebarToggle && sidebarContent) {
      sidebarToggle.addEventListener('click', () => {
        sidebarContent.classList.toggle('is-open');
      });
    }

    // 搜索功能
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce((e) => {
        this.filterFormulas(e.target.value);
      }, 300));
    }

    // 模型过滤器
    const modelFilter = document.getElementById('model-filter-dropdown');
    if (modelFilter) {
      modelFilter.addEventListener('change', (e) => {
        this.filterFormulasByModel(e.target.value);
      });
    }

    // 模式切换
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        this.switchMode(mode);
      });
    });

    // 编辑公式按钮
    const editFormulaBtn = document.getElementById('edit-formula-btn');
    if (editFormulaBtn) {
      editFormulaBtn.addEventListener('click', () => {
        this.enterEditMode();
      });
    }

    // 复制和提交按钮
    const copyBtn = document.getElementById('copy-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyFormula();
      });
    }
    
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this.submitFormula();
      });
    }

    // 添加片段按钮
    const addSnippetBtn = document.getElementById('add-snippet-btn');
    if (addSnippetBtn) {
      addSnippetBtn.addEventListener('click', () => {
        this.openAddSnippetModal();
      });
    }

    // 模态框关闭
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.querySelector('.modal-close');
    
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeModal();
        }
      });
    }
    
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // 添加片段项按钮
    const addSnippetItemBtn = document.getElementById('add-snippet-item-btn');
    if (addSnippetItemBtn) {
      addSnippetItemBtn.addEventListener('click', () => {
        this.addSnippetItem();
      });
    }

    // 确认添加片段
    const confirmSnippetBtn = document.getElementById('confirm-snippet-btn');
    if (confirmSnippetBtn) {
      confirmSnippetBtn.addEventListener('click', () => {
        this.confirmAddSnippet();
      });
    }

    // 取消添加片段
    const cancelSnippetBtn = document.getElementById('cancel-snippet-btn');
    if (cancelSnippetBtn) {
      cancelSnippetBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }
  }

  /**
   * 加载初始数据
   */
  async loadInitialData() {
    try {
      // 从后端获取初始数据
      const response = await fetch('/api/init-data');
      const result = await response.json();
      
      if (result.success) {
        const initData = result.data;
        
        // 将数据加载到MiniDB
        await miniDBService.initializeData(initData);
        
        // 从MiniDB读取数据到本地状态
        this.formulas = await miniDBService.find('formulas');
        this.models = await miniDBService.find('models');
        this.snippets = await miniDBService.find('snippets');
        this.tags = await miniDBService.find('tags');
        
        // 处理设置数据
        const settingsArray = await miniDBService.find('settings');
        this.settings = settingsArray.length > 0 ? settingsArray[0] : initData.settings || {};
        
        console.log('初始数据加载完成:', {
          formulas: this.formulas.length,
          models: this.models.length,
          snippets: this.snippets.length,
          tags: this.tags.length
        });
      } else {
        throw new Error(result.message || '获取初始数据失败');
      }
    } catch (error) {
      console.error('加载初始数据失败:', error);
      throw error;
    }
  }

  /**
   * 渲染用户界面
   */
  renderUI() {
    this.renderModelFilter();
    this.renderFormulaList();
    this.renderSnippetArea();
  }

  /**
   * 渲染模型过滤器
   */
  renderModelFilter() {
    const filterDropdown = document.getElementById('model-filter-dropdown');
    if (!filterDropdown) return;

    // 清空现有选项
    filterDropdown.innerHTML = '<option value="">所有模型</option>';

    // 添加模型选项
    this.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model._id;
      option.textContent = `${model.name} ${model.version}`;
      filterDropdown.appendChild(option);
    });
  }

  /**
   * 渲染公式列表
   */
  renderFormulaList() {
    const formulaList = document.getElementById('formula-list');
    if (!formulaList) return;

    // 清空现有内容
    formulaList.innerHTML = '';

    if (this.formulas.length === 0) {
      formulaList.innerHTML = `
        <div class="empty-placeholder">
          <i class="fas fa-magic"></i>
          <span>暂无公式，请添加新公式</span>
        </div>
      `;
      return;
    }

    // 渲染公式项
    this.formulas.forEach(formula => {
      const formulaItem = this.createFormulaItem(formula);
      formulaList.appendChild(formulaItem);
    });
  }

  /**
   * 创建公式项元素
   */
  createFormulaItem(formula) {
    const item = document.createElement('div');
    item.className = `formula-item ${formula.isPinned ? 'formula-item--pinned' : ''}`;
    item.dataset.formulaId = formula._id;

    item.innerHTML = `
      <div class="formula-title">${formula.title}</div>
      <div class="formula-preview">${formula.content}</div>
      <div class="formula-meta">
        ${formula.author ? `作者: ${formula.author}` : ''}
        ${formula.models ? ` | 适用模型: ${formula.models.length}个` : ''}
      </div>
    `;

    // 添加点击事件
    item.addEventListener('click', () => {
      this.selectFormula(formula);
    });

    return item;
  }

  /**
   * 选择公式
   */
  selectFormula(formula) {
    this.currentFormula = formula;
    this.selectedTags.clear();

    // 更新UI状态
    document.querySelectorAll('.formula-item').forEach(item => {
      item.classList.remove('formula-item--active');
    });
    
    const selectedItem = document.querySelector(`[data-formula-id="${formula._id}"]`);
    if (selectedItem) {
      selectedItem.classList.add('formula-item--active');
    }

    // 渲染公式内容
    this.renderFormulaContent();
    
    // 启用操作按钮
    this.updateActionButtons();
  }

  /**
   * 渲染公式内容
   */
  renderFormulaContent() {
    const formulaText = document.getElementById('formula-text');
    if (!formulaText || !this.currentFormula) return;

    if (this.currentMode === 'compose') {
      // 组合模式：将标签替换为按钮
      const content = this.parseFormulaContent(this.currentFormula.content);
      formulaText.innerHTML = content;
      
      // 绑定标签按钮事件
      this.bindTagButtonEvents();
    } else if (this.currentMode === 'manual') {
      // 手动模式：显示最终合成的内容
      const finalContent = this.generateFinalContent();
      formulaText.textContent = finalContent;
    }
  }

  /**
   * 解析公式内容，将标签转换为按钮
   */
  parseFormulaContent(content) {
    // 匹配 #{标签名} 格式
    return content.replace(/#{([^}]+)}/g, (match, tagName) => {
      const selectedSnippet = this.selectedTags.get(tagName);
      const buttonText = selectedSnippet ? selectedSnippet.title : `#${tagName}`;
      const buttonClass = selectedSnippet ? 'tag-button tag-button--selected' : 'tag-button';
      
      return `<button class="${buttonClass}" data-tag="${tagName}">${buttonText}</button>`;
    });
  }

  /**
   * 绑定标签按钮事件
   */
  bindTagButtonEvents() {
    const tagButtons = document.querySelectorAll('.tag-button');
    tagButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tagName = e.target.dataset.tag;
        this.showSnippetsForTag(tagName);
        
        // 更新按钮状态
        tagButtons.forEach(btn => btn.classList.remove('tag-button--active'));
        e.target.classList.add('tag-button--active');
      });
    });
  }

  /**
   * 显示指定标签的片段
   */
  showSnippetsForTag(tagName) {
    // 查找对应的标签
    const tag = this.tags.find(t => t.slug === tagName || t.name === tagName);
    if (!tag) {
      this.showNotification(`未找到标签: ${tagName}`, 'warning');
      return;
    }

    // 查找关联的片段
    const relatedSnippets = this.snippets.filter(snippet => 
      snippet.tags && snippet.tags.includes(tag._id)
    );

    // 渲染片段列表
    this.renderSnippetGrid(relatedSnippets, tagName);
  }

  /**
   * 渲染片段网格
   */
  renderSnippetGrid(snippets, currentTag = null) {
    const snippetGrid = document.getElementById('snippet-grid');
    if (!snippetGrid) return;

    // 清空现有内容
    snippetGrid.innerHTML = '';

    if (snippets.length === 0) {
      snippetGrid.innerHTML = `
        <div class="empty-placeholder">
          <i class="fas fa-cube"></i>
          <span>${currentTag ? `标签"${currentTag}"暂无片段` : '点击公式中的标签按钮查看相关片段'}</span>
        </div>
      `;
      return;
    }

    // 渲染片段卡片
    snippets.forEach(snippet => {
      const card = this.createSnippetCard(snippet, currentTag);
      snippetGrid.appendChild(card);
    });
  }

  /**
   * 创建片段卡片
   */
  createSnippetCard(snippet, currentTag) {
    const card = document.createElement('div');
    card.className = `snippet-card ${snippet.isPinned ? 'snippet-card--pinned' : ''}`;
    card.dataset.snippetId = snippet._id;

    card.innerHTML = `
      <div class="snippet-title">${snippet.title}</div>
      <div class="snippet-content">${snippet.content}</div>
    `;

    // 添加点击事件
    card.addEventListener('click', () => {
      this.selectSnippet(snippet, currentTag);
    });

    return card;
  }

  /**
   * 选择片段
   */
  selectSnippet(snippet, tagName) {
    if (!tagName) return;

    // 记录选择的片段
    this.selectedTags.set(tagName, snippet);

    // 更新公式显示
    this.renderFormulaContent();

    // 更新片段卡片状态
    document.querySelectorAll('.snippet-card').forEach(card => {
      card.classList.remove('snippet-card--selected');
    });
    
    const selectedCard = document.querySelector(`[data-snippet-id="${snippet._id}"]`);
    if (selectedCard) {
      selectedCard.classList.add('snippet-card--selected');
    }

    // 更新操作按钮状态
    this.updateActionButtons();

    this.showNotification(`已选择片段: ${snippet.title}`, 'success');
  }

  /**
   * 生成最终内容
   */
  generateFinalContent() {
    if (!this.currentFormula) return '';

    let content = this.currentFormula.content;
    
    // 替换已选择的标签
    this.selectedTags.forEach((snippet, tagName) => {
      const regex = new RegExp(`#{${tagName}}`, 'g');
      content = content.replace(regex, snippet.content);
    });

    return content;
  }

  /**
   * 更新操作按钮状态
   */
  updateActionButtons() {
    const copyBtn = document.getElementById('copy-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (this.currentFormula) {
      if (copyBtn) copyBtn.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
    } else {
      if (copyBtn) copyBtn.disabled = true;
      if (submitBtn) submitBtn.disabled = true;
    }
  }

  /**
   * 复制公式
   */
  async copyFormula() {
    if (!this.currentFormula) return;

    const content = this.generateFinalContent();
    
    try {
      await navigator.clipboard.writeText(content);
      this.showNotification('公式已复制到剪贴板', 'success');
    } catch (error) {
      console.error('复制失败:', error);
      this.showNotification('复制失败，请手动复制', 'error');
      
      // 降级方案：选中文本
      const formulaText = document.getElementById('formula-text');
      if (formulaText) {
        const range = document.createRange();
        range.selectNodeContents(formulaText);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  /**
   * 提交公式（预留功能）
   */
  submitFormula() {
    if (!this.currentFormula) return;

    const content = this.generateFinalContent();
    console.log('提交公式:', content);
    this.showNotification('提交功能暂未实现', 'info');
  }

  /**
   * 切换模式
   */
  switchMode(mode) {
    this.currentMode = mode;

    // 更新标签状态
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.remove('mode-tab--active');
    });
    
    const activeTab = document.querySelector(`[data-mode="${mode}"]`);
    if (activeTab) {
      activeTab.classList.add('mode-tab--active');
    }

    // 重新渲染公式内容
    this.renderFormulaContent();
  }

  /**
   * 进入编辑模式
   */
  enterEditMode() {
    if (!this.currentFormula) {
      this.showNotification('请先选择一个公式', 'warning');
      return;
    }

    const formulaContainer = document.getElementById('formula-container');
    const editContainer = document.getElementById('edit-mode-container');
    const editTextarea = document.getElementById('edit-textarea');
    const formulaNameInput = document.getElementById('formula-name-input');

    if (formulaContainer && editContainer && editTextarea && formulaNameInput) {
      formulaContainer.classList.add('is-hidden');
      editContainer.classList.remove('is-hidden');
      
      editTextarea.value = this.currentFormula.content;
      formulaNameInput.value = this.currentFormula.title;
      
      editTextarea.focus();
    }

    // 绑定编辑模式按钮事件
    this.bindEditModeEvents();
  }

  /**
   * 绑定编辑模式事件
   */
  bindEditModeEvents() {
    const saveBtn = document.getElementById('save-formula-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (saveBtn) {
      saveBtn.onclick = () => this.saveFormula();
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => this.exitEditMode();
    }
  }

  /**
   * 保存公式
   */
  async saveFormula() {
    const editTextarea = document.getElementById('edit-textarea');
    const formulaNameInput = document.getElementById('formula-name-input');

    if (!editTextarea || !formulaNameInput) return;

    const newContent = editTextarea.value.trim();
    const newTitle = formulaNameInput.value.trim();

    if (!newContent || !newTitle) {
      this.showNotification('请填写公式名称和内容', 'warning');
      return;
    }

    try {
      // 创建新公式对象
      const newFormula = {
        _id: `formula-${Date.now()}`,
        title: newTitle,
        content: newContent,
        description: `基于 ${this.currentFormula.title} 修改`,
        author: this.currentFormula.author || '用户',
        models: this.currentFormula.models || [],
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 保存到MiniDB
      await miniDBService.upsert('formulas', newFormula);

      // 更新本地状态
      this.formulas.push(newFormula);
      this.currentFormula = newFormula;

      // 重新渲染
      this.renderFormulaList();
      this.exitEditMode();

      this.showNotification('公式保存成功', 'success');
    } catch (error) {
      console.error('保存公式失败:', error);
      this.showNotification(`保存失败: ${error.message}`, 'error');
    }
  }

  /**
   * 退出编辑模式
   */
  exitEditMode() {
    const formulaContainer = document.getElementById('formula-container');
    const editContainer = document.getElementById('edit-mode-container');

    if (formulaContainer && editContainer) {
      formulaContainer.classList.remove('is-hidden');
      editContainer.classList.add('is-hidden');
    }

    // 重新渲染公式内容
    this.renderFormulaContent();
  }

  /**
   * 打开添加片段模态框
   */
  openAddSnippetModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.classList.remove('is-hidden');
      
      // 重置表单
      this.resetSnippetForm();
    }
  }

  /**
   * 关闭模态框
   */
  closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.classList.add('is-hidden');
    }
  }

  /**
   * 重置片段表单
   */
  resetSnippetForm() {
    const tagInput = document.getElementById('tag-input');
    const snippetItems = document.getElementById('snippet-items');

    if (tagInput) {
      tagInput.value = '';
    }

    if (snippetItems) {
      snippetItems.innerHTML = `
        <div class="snippet-item">
          <input type="text" class="snippet-title-input" placeholder="片段简称">
          <textarea class="snippet-content-input" placeholder="片段正文内容"></textarea>
          <button class="remove-snippet-btn" type="button">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      this.bindSnippetItemEvents();
    }
  }

  /**
   * 添加片段项
   */
  addSnippetItem() {
    const snippetItems = document.getElementById('snippet-items');
    if (!snippetItems) return;

    const newItem = document.createElement('div');
    newItem.className = 'snippet-item';
    newItem.innerHTML = `
      <input type="text" class="snippet-title-input" placeholder="片段简称">
      <textarea class="snippet-content-input" placeholder="片段正文内容"></textarea>
      <button class="remove-snippet-btn" type="button">
        <i class="fas fa-trash"></i>
      </button>
    `;

    snippetItems.appendChild(newItem);
    this.bindSnippetItemEvents();
  }

  /**
   * 绑定片段项事件
   */
  bindSnippetItemEvents() {
    const removeButtons = document.querySelectorAll('.remove-snippet-btn');
    removeButtons.forEach(button => {
      button.onclick = (e) => {
        const snippetItem = e.target.closest('.snippet-item');
        const snippetItems = document.getElementById('snippet-items');
        
        // 至少保留一个片段项
        if (snippetItems && snippetItems.children.length > 1) {
          snippetItem.remove();
        } else {
          this.showNotification('至少需要保留一个片段项', 'warning');
        }
      };
    });
  }

  /**
   * 确认添加片段
   */
  async confirmAddSnippet() {
    try {
      const tagInput = document.getElementById('tag-input');
      const snippetItems = document.querySelectorAll('.snippet-item');

      if (!tagInput || snippetItems.length === 0) return;

      const tagText = tagInput.value.trim();
      if (!tagText) {
        this.showNotification('请输入标签', 'warning');
        return;
      }

      // 解析标签
      const tags = this.parseTagInput(tagText);
      if (tags.length === 0) {
        this.showNotification('标签格式错误', 'warning');
        return;
      }

      // 收集片段数据
      const snippets = [];
      snippetItems.forEach(item => {
        const titleInput = item.querySelector('.snippet-title-input');
        const contentInput = item.querySelector('.snippet-content-input');
        
        if (titleInput && contentInput) {
          const title = titleInput.value.trim();
          const content = contentInput.value.trim();
          
          if (content) {
            snippets.push({
              title: title || content,
              content: content
            });
          }
        }
      });

      if (snippets.length === 0) {
        this.showNotification('请至少添加一个片段', 'warning');
        return;
      }

      // 保存标签和片段
      await this.saveTagsAndSnippets(tags, snippets);

      // 关闭模态框
      this.closeModal();
      
      this.showNotification('片段添加成功', 'success');
    } catch (error) {
      console.error('添加片段失败:', error);
      this.showNotification(`添加失败: ${error.message}`, 'error');
    }
  }

  /**
   * 解析标签输入
   */
  parseTagInput(input) {
    const tags = [];
    
    // 简单解析，支持空格分隔和 #{name|slug} 格式
    const parts = input.split(/\s+/);
    
    parts.forEach(part => {
      if (part.trim()) {
        // 移除开头的 # 和 {}
        let cleanPart = part.replace(/^#?\{?/, '').replace(/\}?$/, '');
        
        if (cleanPart.includes('|')) {
          const [name, slug] = cleanPart.split('|');
          tags.push({ name: name.trim(), slug: slug.trim() });
        } else {
          tags.push({ name: cleanPart, slug: cleanPart });
        }
      }
    });
    
    return tags;
  }

  /**
   * 保存标签和片段
   */
  async saveTagsAndSnippets(tags, snippets) {
    const savedTags = [];
    const savedSnippets = [];

    // 保存标签
    for (const tagData of tags) {
      // 检查标签是否已存在
      let existingTag = this.tags.find(t => t.slug === tagData.slug);
      
      if (!existingTag) {
        const newTag = {
          _id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          slug: tagData.slug,
          name: tagData.name,
          isMultiSelect: false,
          sortOrder: this.tags.length + 1,
          isPinned: false
        };
        
        await miniDBService.upsert('tags', newTag);
        this.tags.push(newTag);
        savedTags.push(newTag);
      } else {
        savedTags.push(existingTag);
      }
    }

    // 保存片段
    for (const snippetData of snippets) {
      const newSnippet = {
        _id: `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: snippetData.title,
        content: snippetData.content,
        tags: savedTags.map(tag => tag._id),
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await miniDBService.upsert('snippets', newSnippet);
      this.snippets.push(newSnippet);
      savedSnippets.push(newSnippet);
    }

    console.log('保存完成:', { tags: savedTags.length, snippets: savedSnippets.length });
  }

  /**
   * 渲染片段区域
   */
  renderSnippetArea() {
    this.renderSnippetGrid([]);
  }

  /**
   * 过滤公式
   */
  filterFormulas(searchTerm) {
    const filteredFormulas = this.formulas.filter(formula => 
      formula.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formula.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (formula.description && formula.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    this.renderFilteredFormulas(filteredFormulas);
  }

  /**
   * 按模型过滤公式
   */
  filterFormulasByModel(modelId) {
    let filteredFormulas = this.formulas;
    
    if (modelId) {
      filteredFormulas = this.formulas.filter(formula => 
        formula.models && formula.models.includes(modelId)
      );
    }

    this.renderFilteredFormulas(filteredFormulas);
  }

  /**
   * 渲染过滤后的公式
   */
  renderFilteredFormulas(formulas) {
    const formulaList = document.getElementById('formula-list');
    if (!formulaList) return;

    formulaList.innerHTML = '';

    if (formulas.length === 0) {
      formulaList.innerHTML = `
        <div class="empty-placeholder">
          <i class="fas fa-search"></i>
          <span>未找到匹配的公式</span>
        </div>
      `;
      return;
    }

    formulas.forEach(formula => {
      const formulaItem = this.createFormulaItem(formula);
      formulaList.appendChild(formulaItem);
    });
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // 自动移除通知
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * 防抖函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AISpellbookApp();
});