/**
 * 喵咒·AI Spellbook 主应用逻辑
 */

// 初始化数据库
const db = new MiniDB('aispellbook');

// 应用状态
let formulas = [];
let currentEditingId = null;

/**
 * 应用初始化
 */
function initApp() {
    console.log('🐱 喵咒·AI Spellbook 启动中...');
    loadFormulas();
    renderFormulas();
    setupEventListeners();
    console.log('✅ 应用初始化完成');
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 监听回车键快速保存
    document.getElementById('formulaName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveFormula();
        }
    });

    // 监听 Ctrl+S 快速保存
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveFormula();
        }
    });
}

/**
 * 从本地存储加载公式
 */
function loadFormulas() {
    formulas = db.get('formulas', []);
    console.log(`📚 加载了 ${formulas.length} 个公式`);
}

/**
 * 保存公式到本地存储
 */
function saveFormulasToStorage() {
    db.set('formulas', formulas);
}

/**
 * 保存新公式或更新现有公式
 */
function saveFormula() {
    const nameInput = document.getElementById('formulaName');
    const contentInput = document.getElementById('formulaContent');

    const name = nameInput.value.trim();
    const content = contentInput.value.trim();

    if (!name) {
        alert('请输入公式名称！');
        nameInput.focus();
        return;
    }

    if (!content) {
        alert('请输入公式内容！');
        contentInput.focus();
        return;
    }

    const now = new Date().toISOString();

    if (currentEditingId) {
        // 更新现有公式
        const index = formulas.findIndex(f => f.id === currentEditingId);
        if (index !== -1) {
            formulas[index] = {
                ...formulas[index],
                name,
                content,
                updatedAt: now
            };
            console.log(`📝 更新公式: ${name}`);
        }
        currentEditingId = null;
    } else {
        // 创建新公式
        const newFormula = {
            id: generateId(),
            name,
            content,
            createdAt: now,
            updatedAt: now
        };
        formulas.unshift(newFormula);
        console.log(`✨ 创建新公式: ${name}`);
    }

    saveFormulasToStorage();
    clearFormula();
    renderFormulas();
    showNotification('公式保存成功！', 'success');
}

/**
 * 清空表单
 */
function clearFormula() {
    document.getElementById('formulaName').value = '';
    document.getElementById('formulaContent').value = '';
    currentEditingId = null;
    console.log('🧹 表单已清空');
}

/**
 * 编辑公式
 */
function editFormula(id) {
    const formula = formulas.find(f => f.id === id);
    if (!formula) return;

    document.getElementById('formulaName').value = formula.name;
    document.getElementById('formulaContent').value = formula.content;
    currentEditingId = id;

    // 滚动到编辑区域
    document.querySelector('.formula-builder').scrollIntoView({ behavior: 'smooth' });
    console.log(`✏️ 编辑公式: ${formula.name}`);
}

/**
 * 删除公式
 */
function deleteFormula(id) {
    const formula = formulas.find(f => f.id === id);
    if (!formula) return;

    if (confirm(`确定要删除公式 "${formula.name}" 吗？`)) {
        formulas = formulas.filter(f => f.id !== id);
        saveFormulasToStorage();
        renderFormulas();
        console.log(`🗑️ 删除公式: ${formula.name}`);
        showNotification('公式删除成功！', 'success');
    }
}

/**
 * 复制公式内容到剪贴板
 */
async function copyFormula(id) {
    const formula = formulas.find(f => f.id === id);
    if (!formula) return;

    try {
        await navigator.clipboard.writeText(formula.content);
        console.log(`📋 复制公式: ${formula.name}`);
        showNotification('公式已复制到剪贴板！', 'success');
    } catch (error) {
        console.error('复制失败:', error);
        showNotification('复制失败，请手动复制', 'error');
    }
}

/**
 * 渲染公式列表
 */
function renderFormulas() {
    const container = document.getElementById('formulaContainer');
ECHO is off.
    if (formulas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted^); padding: var(--spacing-xl^);">
                <p>还没有保存任何公式</p>
                <p>开始创建您的第一个AI提示词公式吧！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = formulas.map(formula => `
        <div class="formula-item">
            <div class="formula-header">
                <span class="formula-name">${escapeHtml(formula.name)}</span>
                <div class="formula-actions">
                    <button onclick="copyFormula('${formula.id}'^)" class="btn btn-secondary" title="复制">📋</button>
                    <button onclick="editFormula('${formula.id}'^)" class="btn btn-secondary" title="编辑">✏️</button>
                    <button onclick="deleteFormula('${formula.id}'^)" class="btn btn-secondary" title="删除">🗑️</button>
                </div>
            </div>
            <div class="formula-content">${escapeHtml(formula.content)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted^); margin-top: var(--spacing-sm^);">
                创建时间: ${formatDate(formula.createdAt)}
