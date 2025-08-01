import { MiniDB } from "@lazycatcloud/minidb";

/**
 * MiniDB操作封装类
 * 提供统一的数据库操作接口
 */
class MiniDBService {
  constructor() {
    this.db = new MiniDB();
    this.collections = {
      formulas: this.db.getCollection("formulas"),
      models: this.db.getCollection("models"),
      snippets: this.db.getCollection("snippets"),
      tags: this.db.getCollection("tags"),
      settings: this.db.getCollection("settings")
    };
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  /**
   * 带重试机制的操作执行
   * @param {Function} operation - 要执行的操作
   * @returns {Promise} 操作结果
   */
  async withRetry(operation) {
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`MiniDB操作失败，第 ${i + 1} 次重试:`, error.message);
        if (i === this.retryCount - 1) {
          throw new Error(`MiniDB操作失败: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
  }

  /**
   * 测试数据库连接
   * @returns {Promise<Object>} 连接测试结果
   */
  async testConnection() {
    return this.withRetry(async () => {
      // 尝试创建一个测试集合并插入数据
      const testCollection = this.db.getCollection("connection_test");
      const testData = {
        id: "test-connection",
        timestamp: new Date().toISOString(),
        test: true
      };
      
      await testCollection.upsert(testData);
      const result = await testCollection.findOne({ id: "test-connection" });
      
      // 清理测试数据
      await this.removeCollection("connection_test");
      
      return {
        success: true,
        message: "MiniDB连接测试成功",
        data: result,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * 插入或更新数据
   * @param {string} collectionName - 集合名称
   * @param {Object|Array} data - 要插入的数据
   * @returns {Promise<Object>} 操作结果
   */
  async upsert(collectionName, data) {
    return this.withRetry(async () => {
      const collection = this.collections[collectionName];
      if (!collection) {
        throw new Error(`集合 ${collectionName} 不存在`);
      }
      
      const result = await collection.upsert(data);
      return {
        success: true,
        message: `数据插入/更新成功`,
        data: result
      };
    });
  }

  /**
   * 查询数据
   * @param {string} collectionName - 集合名称
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 查询结果
   */
  async find(collectionName, query = {}, options = {}) {
    return this.withRetry(async () => {
      const collection = this.collections[collectionName];
      if (!collection) {
        throw new Error(`集合 ${collectionName} 不存在`);
      }
      
      const result = await collection.find(query, options).fetch();
      return result;
    });
  }

  /**
   * 查询单个文档
   * @param {string} collectionName - 集合名称
   * @param {Object} query - 查询条件
   * @returns {Promise<Object|null>} 查询结果
   */
  async findOne(collectionName, query) {
    return this.withRetry(async () => {
      const collection = this.collections[collectionName];
      if (!collection) {
        throw new Error(`集合 ${collectionName} 不存在`);
      }
      
      const result = await collection.findOne(query);
      return result;
    });
  }

  /**
   * 删除集合
   * @param {string} collectionName - 集合名称
   * @returns {Promise<Object>} 操作结果
   */
  async removeCollection(collectionName) {
    return this.withRetry(async () => {
      await this.db.removeCollection(collectionName);
      return {
        success: true,
        message: `集合 ${collectionName} 删除成功`
      };
    });
  }

  /**
   * 批量初始化数据
   * @param {Object} initData - 初始化数据对象
   * @returns {Promise<Object>} 操作结果
   */
  async initializeData(initData) {
    const results = {};
    
    for (const [collectionName, data] of Object.entries(initData)) {
      if (collectionName === 'settings') {
        // 设置数据特殊处理
        results[collectionName] = await this.upsert(collectionName, data);
      } else if (Array.isArray(data)) {
        // 数组数据批量插入
        results[collectionName] = await this.upsert(collectionName, data);
      }
    }
    
    return {
      success: true,
      message: "数据初始化完成",
      results: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 执行CRUD测试
   * @returns {Promise<Object>} 测试结果
   */
  async runCRUDTest() {
    const testResults = [];
    const testCollectionName = "crud_test";
    
    try {
      // 创建测试集合
      const testCollection = this.db.getCollection(testCollectionName);
      
      // 测试插入
      const insertData = {
        _id: "test-1",
        name: "测试数据",
        value: 123,
        timestamp: new Date().toISOString()
      };
      
      await testCollection.upsert(insertData);
      testResults.push({ operation: "INSERT", success: true, message: "插入测试成功" });
      
      // 测试查询
      const findResult = await testCollection.findOne({ _id: "test-1" });
      if (findResult && findResult.name === "测试数据") {
        testResults.push({ operation: "READ", success: true, message: "查询测试成功" });
      } else {
        testResults.push({ operation: "READ", success: false, message: "查询测试失败" });
      }
      
      // 测试更新
      const updateData = { ...insertData, value: 456, updated: true };
      await testCollection.upsert(updateData);
      const updatedResult = await testCollection.findOne({ _id: "test-1" });
      if (updatedResult && updatedResult.value === 456) {
        testResults.push({ operation: "UPDATE", success: true, message: "更新测试成功" });
      } else {
        testResults.push({ operation: "UPDATE", success: false, message: "更新测试失败" });
      }
      
      // 测试批量操作
      const batchData = [
        { _id: "test-2", name: "批量数据1", value: 100 },
        { _id: "test-3", name: "批量数据2", value: 200 }
      ];
      await testCollection.upsert(batchData);
      const batchResult = await testCollection.find({}).fetch();
      if (batchResult.length >= 3) {
        testResults.push({ operation: "BATCH", success: true, message: "批量操作测试成功" });
      } else {
        testResults.push({ operation: "BATCH", success: false, message: "批量操作测试失败" });
      }
      
      // 清理测试数据
      await this.removeCollection(testCollectionName);
      testResults.push({ operation: "DELETE", success: true, message: "删除测试成功" });
      
      return {
        success: true,
        message: "CRUD测试完成",
        results: testResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      testResults.push({ 
        operation: "ERROR", 
        success: false, 
        message: `CRUD测试失败: ${error.message}` 
      });
      
      // 尝试清理
      try {
        await this.removeCollection(testCollectionName);
      } catch (cleanupError) {
        console.warn("清理测试数据失败:", cleanupError);
      }
      
      return {
        success: false,
        message: "CRUD测试失败",
        results: testResults,
        error: error.message
      };
    }
  }

  /**
   * 查询功能测试
   * @returns {Promise<Object>} 测试结果
   */
  async runQueryTest() {
    const testResults = [];
    const testCollectionName = "query_test";
    
    try {
      const testCollection = this.db.getCollection(testCollectionName);
      
      // 准备测试数据
      const testData = [
        { _id: "q1", name: "测试1", value: 10, category: "A", active: true },
        { _id: "q2", name: "测试2", value: 20, category: "B", active: false },
        { _id: "q3", name: "测试3", value: 30, category: "A", active: true },
        { _id: "q4", name: "测试4", value: 40, category: "C", active: true },
        { _id: "q5", name: "测试5", value: 50, category: "B", active: false }
      ];
      
      await testCollection.upsert(testData);
      
      // 测试基础查询
      const basicResult = await testCollection.find({ category: "A" }).fetch();
      testResults.push({
        test: "基础查询",
        success: basicResult.length === 2,
        message: `查询category=A，期望2条，实际${basicResult.length}条`
      });
      
      // 测试范围查询
      const rangeResult = await testCollection.find({ 
        value: { $gte: 20, $lte: 40 } 
      }).fetch();
      testResults.push({
        test: "范围查询",
        success: rangeResult.length === 3,
        message: `查询value 20-40，期望3条，实际${rangeResult.length}条`
      });
      
      // 测试$in查询
      const inResult = await testCollection.find({ 
        category: { $in: ["A", "C"] } 
      }).fetch();
      testResults.push({
        test: "$in查询",
        success: inResult.length === 3,
        message: `查询category in [A,C]，期望3条，实际${inResult.length}条`
      });
      
      // 测试排序
      const sortResult = await testCollection.find({}, { sort: ["value"] }).fetch();
      const isCorrectOrder = sortResult[0].value === 10 && sortResult[4].value === 50;
      testResults.push({
        test: "排序查询",
        success: isCorrectOrder,
        message: `按value排序，${isCorrectOrder ? '顺序正确' : '顺序错误'}`
      });
      
      // 测试$like查询
      const likeResult = await testCollection.find({ 
        name: { $like: "测试[12]" } 
      }).fetch();
      testResults.push({
        test: "$like查询",
        success: likeResult.length === 2,
        message: `模糊查询测试[12]，期望2条，实际${likeResult.length}条`
      });
      
      // 清理测试数据
      await this.removeCollection(testCollectionName);
      
      const allSuccess = testResults.every(result => result.success);
      return {
        success: allSuccess,
        message: allSuccess ? "查询功能测试全部通过" : "部分查询功能测试失败",
        results: testResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      // 清理测试数据
      try {
        await this.removeCollection(testCollectionName);
      } catch (cleanupError) {
        console.warn("清理测试数据失败:", cleanupError);
      }
      
      return {
        success: false,
        message: "查询功能测试失败",
        error: error.message,
        results: testResults
      };
    }
  }
}

// 导出MiniDB服务实例
export const miniDBService = new MiniDBService();