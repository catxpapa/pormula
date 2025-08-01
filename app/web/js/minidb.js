/**
 * MiniDB - 轻量级本地存储封装
 * 提供简单的数据存储和检索功能
 */
class MiniDB {
    constructor(dbName = 'minidb') {
        this.dbName = dbName;
        this.prefix = `${dbName}_`;
    }

    /**
     * 保存数据到本地存储
     * @param {string} key - 数据键名
     * @param {any} value - 要保存的数据
     */
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            console.error('MiniDB 保存数据失败:', error);
            return false;
        }
    }

    /**
     * 从本地存储获取数据
     * @param {string} key - 数据键名
     * @param {any} defaultValue - 默认值
     * @returns {any} 获取的数据或默认值
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('MiniDB 获取数据失败:', error);
            return defaultValue;
        }
    }

    /**
     * 删除指定键的数据
     * @param {string} key - 要删除的数据键名
     */
    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    /**
     * 清空所有数据
     */
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * 获取所有键名
     * @returns {Array} 所有键名数组
     */
    keys() {
        const keys = Object.keys(localStorage);
        return keys
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.substring(this.prefix.length));
    }

    /**
     * 检查是否存在指定键
     * @param {string} key - 要检查的键名
     * @returns {boolean} 是否存在
     */
    has(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    }
}

// 导出 MiniDB 类
window.MiniDB = MiniDB;
