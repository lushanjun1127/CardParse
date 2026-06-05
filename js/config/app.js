/**
 * 应用配置模块
 */

const AppConfig = {
  // 应用版本
  VERSION: '1.0.0',
  
  // 应用名称
  APP_NAME: 'VCardPro',
  
  // VCF 版本
  VCF_VERSION: '3.0',
  
  // 默认文件名格式
  DEFAULT_FILENAME_PATTERN: 'contacts_{date}.vcf',
  
  // 通知显示时间（毫秒）
  NOTIFICATION_DURATION: 3000,
  
  // 最大联系人数量限制
  MAX_CONTACTS: 10000,
  
  // 支持的电话号长度范围
  PHONE_LENGTH: {
    MIN: 10,
    MAX: 11
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppConfig;
}
