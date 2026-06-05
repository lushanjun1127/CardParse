/**
 * VCard 生成器核心功能模块
 * 负责联系人的解析、生成和导出
 */

class VCardGenerator {
  /**
   * 从文本中智能提取姓名
   * @param {string} text - 去除电话号码后的文本
   * @returns {string} 提取的姓名
   */
  _extractName(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const trimmedText = text.trim();
    
    // 优先尝试匹配中文姓名（2-4 个汉字）
    let name = StringUtils.extractChineseName(trimmedText);
    if (name) {
      return name;
    }
    
    // 尝试匹配包含字母数字的姓名（如 A0397）
    name = StringUtils.extractAlphanumericName(trimmedText);
    if (name) {
      return name;
    }
    
    // 尝试匹配英文名（单词）
    name = StringUtils.extractEnglishName(trimmedText);
    if (name) {
      return name;
    }
    
    return '';
  }

  /**
   * 解析联系人信息
   * @param {string} text - 输入的文本
   * @returns {object} 解析结果 { contacts: [], invalidLines: 0 }
   */
  parseContacts(text) {
    // 输入验证
    if (!ValidationUtils.isValidString(text)) {
      console.warn('输入必须是有效的非空字符串');
      return { contacts: [], invalidLines: 0 };
    }

    const lines = text.split('\n').filter(line => line.trim());
    const parsedContacts = [];
    let invalidCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // 提取电话号码
      const phone = StringUtils.extractPhone(trimmedLine);
      
      if (phone) {
        // 提取姓名（去除电话号码后的部分）
        const remainingText = trimmedLine.replace(/\d{10,11}/, '').trim();
        let name = this._extractName(remainingText);
        
        // 如果没有找到合适的姓名，使用默认名称
        if (!name) {
          name = `联系人${parsedContacts.length + 1}`;
        }
        
        // 防止 XSS 攻击，清理姓名中的潜在危险字符
        name = SecurityUtils.sanitizeString(name);

        parsedContacts.push({ name, phone });
      } else {
        invalidCount++;
      }
    }

    return {
      contacts: parsedContacts,
      invalidLines: invalidCount
    };
  }

  /**
   * 解析 VCF 内容为联系人列表
   * @param {string} vcfContent - VCF 文件内容
   * @returns {Array} 联系人列表
   */
  parseVCF(vcfContent) {
    // 输入验证
    if (!ValidationUtils.isValidVCF(vcfContent)) {
      return [];
    }

    const vcards = vcfContent.split('END:VCARD');
    const contacts = [];

    for (const vcard of vcards) {
      if (!vcard.trim()) continue;

      // 提取姓名 (FN 字段)
      let name = '';
      const fnMatch = vcard.match(/FN:(.*)/);
      
      if (fnMatch) {
        name = fnMatch[1].trim();
      } else {
        // 如果没有 FN 字段，尝试从 N 字段获取
        const nMatch = vcard.match(/N:(.*)/);
        if (nMatch) {
          // N 字段格式通常是：姓;名;;;
          const nValue = nMatch[1].split(';')[0];
          name = nValue.trim() || '未知联系人';
        } else {
          name = '未知联系人';
        }
      }

      // 提取电话号码 (TEL 字段)
      const telMatches = [...vcard.matchAll(/TEL[^:]*:(.*)/g)];
      
      if (telMatches.length > 0) {
        for (const telMatch of telMatches) {
          const phone = telMatch[1].replace(/\s+/g, '').trim();
          if (phone) {
            contacts.push({
              name: SecurityUtils.sanitizeString(name),
              phone
            });
          }
        }
      } else {
        // 如果没有找到电话号码，仍然添加联系人（仅含姓名）
        contacts.push({
          name: SecurityUtils.sanitizeString(name),
          phone: '未提供'
        });
      }
    }

    return contacts;
  }

  /**
   * 生成 VCF 内容
   * @param {Array} contacts - 联系人数组
   * @returns {string} VCF 格式内容
   */
  generateVCFContent(contacts) {
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return '';
    }

    let vcfContent = '';
    
    for (const contact of contacts) {
      // 确保联系人对象包含必要属性
      if (!ValidationUtils.isValidContact(contact)) {
        continue;
      }
      
      vcfContent += 'BEGIN:VCARD\n';
      vcfContent += `VERSION:${AppConfig.VCF_VERSION}\n`;
      vcfContent += `FN:${contact.name}\n`;
      vcfContent += `N:${contact.name};;;;\n`;
      vcfContent += `TEL;TYPE=CELL:${contact.phone}\n`;
      vcfContent += 'END:VCARD\n';
    }
    
    return vcfContent;
  }

  /**
   * 下载 VCF 文件
   * @param {Array} contacts - 联系人数组
   * @param {string} filename - 文件名
   */
  downloadVCF(contacts, filename) {
    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('请先添加联系人');
    }

    const vcfContent = this.generateVCFContent(contacts);
    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    
    // 生成默认文件名
    const defaultFilename = filename || 
      `contacts_${new Date().toISOString().slice(0, 10)}.vcf`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = SecurityUtils.sanitizeString(defaultFilename);
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * 复制 VCF 内容到剪贴板
   * @param {Array} contacts - 联系人数组
   * @returns {Promise} 异步复制操作
   */
  async copyToClipboard(contacts) {
    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('没有联系人可复制');
    }

    const vcfContent = this.generateVCFContent(contacts);
    await navigator.clipboard.writeText(vcfContent);
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VCardGenerator;
}
