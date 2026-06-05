/**
 * VCard生成器核心功能模块
 */
class VCardGenerator {
  /**
   * 解析联系人信息
   * @param {string} text - 输入的文本
   * @returns {object} 解析结果
   */
  parseContacts(text) {
    // 输入验证
    if (typeof text !== 'string') {
      console.error('输入必须是字符串');
      return { contacts: [], invalidLines: 0 };
    }
    
    if (!text.trim()) {
      return { contacts: [], invalidLines: 0 };
    }

    const lines = text.split('\n').filter(line => line.trim());
    const parsedContacts = [];
    let invalidCount = 0;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // 匹配电话号码（10-11位数字）
      const phoneRegex = /(\d{10,11})/;
      const phoneMatch = trimmedLine.match(phoneRegex);

      if (phoneMatch) {
        const phone = phoneMatch[1];
        
        // 提取姓名（去除电话号码后的部分）
        const remainingText = trimmedLine.replace(phoneRegex, '').trim();
        
        // 改进的姓名提取逻辑，优先尝试匹配中文姓名或英文名
        let name = '';
        
        // 首先尝试匹配中文姓名（2-4个汉字）
        const chineseNameMatch = remainingText.match(/([\u4e00-\u9fa5]{2,4})/);
        if (chineseNameMatch) {
          name = chineseNameMatch[1];
        } else {
          // 尝试匹配包含字母数字的姓名（如A0397）
          const alphanumericNameMatch = remainingText.match(/([A-Za-z][A-Za-z0-9]{1,})|([A-Za-z0-9]+[A-Za-z][A-Za-z0-9]*)/);
          if (alphanumericNameMatch) {
            name = alphanumericNameMatch[0];
          } else {
            // 尝试匹配英文名（单词）
            const englishNameMatch = remainingText.match(/([A-Za-z]{2,})/);
            if (englishNameMatch) {
              name = englishNameMatch[1];
            }
          }
        }
        
        // 如果没有找到合适的姓名，使用默认名称
        if (!name) {
          name = `联系人${parsedContacts.length + 1}`;
        }
        
        // 防止XSS攻击，清理姓名中的潜在危险字符
        name = this.sanitizeString(name);

        parsedContacts.push({
          name: name,
          phone: phone
        });
      } else {
        invalidCount++;
      }
    });

    return {
      contacts: parsedContacts,
      invalidLines: invalidCount
    };
  }

  /**
   * 解析VCF内容为联系人列表
   * @param {string} vcfContent - VCF文件内容
   * @returns {Array} 联系人列表
   */
  parseVCF(vcfContent) {
    // 输入验证
    if (typeof vcfContent !== 'string' || !vcfContent.includes('BEGIN:VCARD')) {
      return [];
    }

    const vcards = vcfContent.split('END:VCARD');
    const contacts = [];

    vcards.forEach(vcard => {
      if (!vcard.trim()) return;

      // 提取姓名 (FN字段)
      const fnMatch = vcard.match(/FN:(.*)/);
      let name = '';
      if (fnMatch) {
        name = fnMatch[1].trim();
      } else {
        // 如果没有FN字段，尝试从N字段获取
        const nMatch = vcard.match(/N:(.*)/);
        if (nMatch) {
          // N字段格式通常是: 姓;名;;;
          const nValue = nMatch[1].split(';')[0];
          name = nValue.trim() || '未知联系人';
        } else {
          name = '未知联系人';
        }
      }

      // 提取电话号码 (TEL字段)
      const telMatches = [...vcard.matchAll(/TEL[^:]*:(.*)/g)];
      if (telMatches.length > 0) {
        telMatches.forEach(telMatch => {
          const phone = telMatch[1].replace(/\s+/g, '').trim(); // 清理空格
          if (phone) {
            contacts.push({
              name: this.sanitizeString(name),
              phone: phone
            });
          }
        });
      } else {
        // 如果没有找到电话号码，仍然添加联系人（仅含姓名）
        contacts.push({
          name: this.sanitizeString(name),
          phone: '未提供'
        });
      }
    });

    return contacts;
  }

  /**
   * 清理字符串，防止XSS攻击
   * @param {string} str - 待清理的字符串
   * @returns {string} 清理后的字符串
   */
  sanitizeString(str) {
    if (typeof str !== 'string') {
      return '';
    }
    
    // 移除潜在的危险字符
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * 生成VCF内容
   * @param {Array} contacts - 联系人数组
   * @returns {string} VCF格式内容
   */
  generateVCFContent(contacts) {
    if (!Array.isArray(contacts) || contacts.length === 0) return '';

    let vcfContent = '';
    
    contacts.forEach(contact => {
      // 确保联系人对象包含必要属性
      if (!contact || typeof contact !== 'object' || !contact.name || !contact.phone) {
        return;
      }
      
      vcfContent += 'BEGIN:VCARD\n';
      vcfContent += 'VERSION:3.0\n';
      vcfContent += `FN:${contact.name}\n`;
      vcfContent += `N:${contact.name};;;;\n`;
      vcfContent += `TEL;TYPE=CELL:${contact.phone}\n`;
      vcfContent += 'END:VCARD\n';
    });
    
    return vcfContent;
  }

  /**
   * 下载VCF文件
   * @param {Array} contacts - 联系人数组
   * @param {string} filename - 文件名
   */
  downloadVCF(contacts, filename = `contacts_${new Date().toISOString().slice(0, 10)}.vcf`) {
    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('请先添加联系人');
    }

    const vcfContent = this.generateVCFContent(contacts);
    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = this.sanitizeString(filename);
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * 复制VCF内容到剪贴板
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

// 导出模块（ES6 模块格式）
export { VCardGenerator };
