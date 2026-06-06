/**
 * 应用主入口模块
 * 负责初始化和协调各模块
 */

import { VCardGenerator } from './vcard-generator.js';
import { UIController } from './ui-controller.js';

/**
 * 应用配置常量
 */
const APP_CONFIG = {
  DEMO_DATA: [
    '张三 13812345678',
    '李四 13987654321',
    '王五 13712345678',
    'A0397 13612345679',
    'B0588 13512345670'
  ].join('\n'),
  NOTIFICATION_DURATION: 3000,
  CLEANUP_DELAY: 100
};

/**
 * 应用主类
 */
class App {
  constructor() {
    this.generator = null;
    this.uiController = null;
    this.isInitialized = false;
  }

  /**
   * 初始化应用
   */
  init() {
    try {
      this.generator = new VCardGenerator();
      this.uiController = new UIController(this.generator);
      
      this.bindEvents();
      this.isInitialized = true;
      
      console.log('VCardPro 应用初始化成功');
    } catch (error) {
      console.error('应用初始化失败:', error);
      this.showFatalError(error);
    }
  }

  /**
   * 绑定所有事件处理器
   */
  bindEvents() {
    // 演示按钮
    this.bindClick('demoBtn', () => {
      this.loadDemoData();
    });

    // 清空按钮
    this.bindClick('clearBtn', () => {
      this.uiController.handleClear();
    });

    // 下载按钮
    this.bindClick('downloadBtn', () => {
      this.uiController.handleDownload();
    });

    // 复制按钮
    this.bindClick('copyBtn', () => {
      this.uiController.handleCopy();
    });

    // 解析按钮
    this.bindClick('parseBtn', () => {
      this.uiController.handleParse();
    });

    // VCF 解析按钮
    this.bindClick('vcfParseBtn', () => {
      this.uiController.handleVCFParse();
    });

    // 键盘快捷键 - 联系人输入区域
    this.bindKeyShortcut('contactInput', 'Enter', true, () => {
      this.uiController.handleParse();
    });

    // 键盘快捷键 - VCF 输出区域
    this.bindKeyShortcut('vcfOutput', 'Enter', true, () => {
      this.uiController.handleVCFParse();
    });

    // 扩展 updatePreview 方法以同步 VCF 输出
    this.extendUpdatePreview();
  }

  /**
   * 绑定点击事件
   * @param {string} elementId - 元素 ID
   * @param {Function} handler - 事件处理函数
   */
  bindClick(elementId, handler) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`元素 #${elementId} 未找到`);
      return;
    }

    element.addEventListener('click', (event) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`${elementId} 点击事件错误:`, error);
        this.uiController?.showNotification('操作失败，请重试', 'error');
      }
    });
  }

  /**
   * 绑定键盘快捷键
   * @param {string} elementId - 元素 ID
   * @param {string} key - 触发键
   * @param {boolean} ctrlKey - 是否需要 Ctrl 键
   * @param {Function} handler - 事件处理函数
   */
  bindKeyShortcut(elementId, key, ctrlKey, handler) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`元素 #${elementId} 未找到`);
      return;
    }

    element.addEventListener('keydown', (event) => {
      if (event.key === key && event.ctrlKey === ctrlKey) {
        event.preventDefault();
        try {
          handler();
        } catch (error) {
          console.error(`${elementId} 快捷键事件错误:`, error);
          this.uiController?.showNotification('快捷键操作失败', 'error');
        }
      }
    });
  }

  /**
   * 加载演示数据
   */
  loadDemoData() {
    try {
      const contactInput = document.getElementById('contactInput');
      if (contactInput) {
        contactInput.value = APP_CONFIG.DEMO_DATA;
        this.uiController.handleParse();
        this.uiController.showNotification('已填入示例数据');
      }
    } catch (error) {
      console.error('加载演示数据失败:', error);
      this.uiController?.showNotification('演示数据填充失败', 'error');
    }
  }

  /**
   * 扩展 updatePreview 方法以同步 VCF 输出
   */
  extendUpdatePreview() {
    const originalUpdatePreview = this.uiController.updatePreview.bind(this.uiController);
    
    this.uiController.updatePreview = () => {
      try {
        originalUpdatePreview();
        
        // 更新 VCF 输出区域
        const vcfOutput = document.getElementById('vcfOutput');
        const copyBtn = document.getElementById('copyBtn');
        
        if (this.uiController.contacts && this.uiController.contacts.length > 0) {
          vcfOutput.value = this.generator.generateVCFContent(this.uiController.contacts);
          if (copyBtn) copyBtn.disabled = false;
        } else {
          vcfOutput.value = '';
          if (copyBtn) copyBtn.disabled = true;
        }
      } catch (error) {
        console.error('更新预览时发生错误:', error);
        this.uiController.showNotification('更新预览失败', 'error');
      }
    };
  }

  /**
   * 显示致命错误提示
   * @param {Error} error - 错误对象
   */
  showFatalError(error) {
    alert(`应用初始化失败：${error.message}\n请刷新页面重试或联系技术支持。`);
  }
}

// 创建并导出应用实例
const app = new App();

// DOM 加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

export { App, app };
