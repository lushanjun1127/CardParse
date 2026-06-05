/**
 * 工具函数模块 - 提供通用的安全处理和验证功能
 */

const SecurityUtils = {
  /**
   * 清理字符串，防止 XSS 攻击
   * @param {string} str - 待清理的字符串
   * @returns {string} 清理后的字符串
   */
  sanitizeString(str) {
    if (typeof str !== 'string') {
      return '';
    }
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * 转义 HTML，防止 XSS 攻击（用于显示内容）
   * @param {string} unsafe - 待转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
      return '';
    }
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

const ValidationUtils = {
  /**
   * 验证输入是否为有效字符串
   * @param {*} value - 待验证的值
   * @returns {boolean} 验证结果
   */
  isValidString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  },

  /**
   * 验证手机号码格式（10-11 位数字）
   * @param {string} phone - 电话号码
   * @returns {boolean} 验证结果
   */
  isValidPhone(phone) {
    if (typeof phone !== 'string') {
      return false;
    }
    const phoneRegex = /^\d{10,11}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  },

  /**
   * 验证 VCF 内容格式
   * @param {string} vcfContent - VCF 文件内容
   * @returns {boolean} 验证结果
   */
  isValidVCF(vcfContent) {
    return typeof vcfContent === 'string' && 
           vcfContent.includes('BEGIN:VCARD');
  },

  /**
   * 验证联系人对象是否完整
   * @param {object} contact - 联系人对象
   * @returns {boolean} 验证结果
   */
  isValidContact(contact) {
    return contact && 
           typeof contact === 'object' && 
           contact.name && 
           contact.phone;
  }
};

const StringUtils = {
  /**
   * 从文本中提取中文姓名（2-4 个汉字）
   * @param {string} text - 输入文本
   * @returns {string|null} 匹配到的姓名
   */
  extractChineseName(text) {
    const match = text.match(/([\u4e00-\u9fa5]{2,4})/);
    return match ? match[1] : null;
  },

  /**
   * 从文本中提取英文或字母数字混合姓名
   * @param {string} text - 输入文本
   * @returns {string|null} 匹配到的姓名
   */
  extractAlphanumericName(text) {
    const match = text.match(/([A-Za-z][A-Za-z0-9]{1,})|([A-Za-z0-9]+[A-Za-z][A-Za-z0-9]*)/);
    return match ? match[0] : null;
  },

  /**
   * 从文本中提取英文名（单词）
   * @param {string} text - 输入文本
   * @returns {string|null} 匹配到的姓名
   */
  extractEnglishName(text) {
    const match = text.match(/([A-Za-z]{2,})/);
    return match ? match[1] : null;
  },

  /**
   * 从文本行中提取电话号码
   * @param {string} line - 输入文本行
   * @returns {string|null} 匹配到的电话号码
   */
  extractPhone(line) {
    const phoneRegex = /(\d{10,11})/;
    const match = line.match(phoneRegex);
    return match ? match[1] : null;
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SecurityUtils,
    ValidationUtils,
    StringUtils
  };
}
