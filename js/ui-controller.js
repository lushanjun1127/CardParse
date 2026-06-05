/**
 * UI控制器模块
 */
class UIController {
  constructor(generator) {
    this.generator = generator;
    this.contacts = [];
    
    // DOM元素引用
    this.contactInput = document.getElementById('contactInput');
    this.parseBtn = document.getElementById('parseBtn');
    this.vcfParseBtn = document.getElementById('vcfParseBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.copyBtn = document.getElementById('copyBtn');
    this.copyText = document.getElementById('copyText');
    this.contactPreview = document.getElementById('contactPreview');
    this.contactCount = document.getElementById('contactCount');
    this.totalContacts = document.getElementById('totalContacts');
    this.validContacts = document.getElementById('validContacts');
    this.invalidLines = document.getElementById('invalidLines');
    this.notification = document.getElementById('notification');
    this.notificationText = document.getElementById('notificationText');
    this.vcfOutput = document.getElementById('vcfOutput');
    
    // 验证DOM元素是否存在
    if (!this.contactInput || !this.parseBtn || !this.vcfParseBtn || 
        !this.clearBtn || !this.downloadBtn || !this.copyBtn || 
        !this.contactPreview || !this.notification || !this.vcfOutput) {
      throw new Error('UI控制器所需的DOM元素未找到');
    }
  }

  /**
   * 处理普通联系人解析操作
   */
  handleParse() {
    try {
      const result = this.generator.parseContacts(this.contactInput.value);
      this.contacts = result.contacts;
      
      // 更新无效行数显示
      this.invalidLines.textContent = result.invalidLines;
      
      this.updatePreview();
      
      if (result.contacts.length > 0) {
        this.showNotification(`成功解析 ${result.contacts.length} 个联系人`);
      } else {
        this.showNotification('未找到有效的联系人信息，请检查输入格式', 'error');
      }
    } catch (error) {
      console.error('解析联系人时发生错误:', error);
      this.showNotification('解析联系人时发生错误，请重试', 'error');
    }
  }

  /**
   * 处理VCF文件解析操作
   */
  handleVCFParse() {
    try {
      const vcfContent = this.vcfOutput.value;
      const contacts = this.generator.parseVCF(vcfContent);
      
      if (contacts.length > 0) {
        this.contacts = contacts;
        this.updatePreview();
        this.showNotification(`从VCF文件解析出 ${contacts.length} 个联系人`);
        
        // 将解析出的联系人信息填入输入区域
        let contactText = '';
        contacts.forEach(contact => {
          contactText += `${contact.name} ${contact.phone}\n`;
        });
        this.contactInput.value = contactText.trim();
      } else {
        this.showNotification('未能从VCF内容中解析出联系人，请检查格式', 'error');
      }
    } catch (error) {
      console.error('解析VCF内容时发生错误:', error);
      this.showNotification('解析VCF内容时发生错误，请重试', 'error');
    }
  }

  /**
   * 处理清空操作
   */
  handleClear() {
    try {
      this.contactInput.value = '';
      this.vcfOutput.value = '';
      this.contacts = [];
      this.updatePreview();
      this.showNotification('已清空所有内容');
    } catch (error) {
      console.error('清空内容时发生错误:', error);
      this.showNotification('清空内容时发生错误，请重试', 'error');
    }
  }

  /**
   * 处理下载操作
   */
  handleDownload() {
    try {
      this.generator.downloadVCF(this.contacts);
      this.showNotification(`已生成 ${this.contacts.length} 个联系人的VCF文件`);
    } catch (error) {
      console.error('下载VCF文件时发生错误:', error);
      this.showNotification(error.message || '下载VCF文件时发生错误', 'error');
    }
  }

  /**
   * 处理复制操作
   */
  async handleCopy() {
    try {
      await this.generator.copyToClipboard(this.contacts);
      // 安全地更新按钮文本，避免innerHTML
      this.copyText.innerHTML = '';
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fas fa-check';
      this.copyText.appendChild(checkIcon);
      this.showNotification('VCF内容已复制到剪贴板');
      
      setTimeout(() => {
        this.copyText.innerHTML = '';
        const copyIcon = document.createElement('i');
        copyIcon.className = 'fas fa-copy';
        this.copyText.appendChild(copyIcon);
      }, 2000);
    } catch (error) {
      console.error('复制VCF内容时发生错误:', error);
      this.showNotification(error.message || '复制VCF内容时发生错误', 'error');
    }
  }

  /**
   * 更新预览
   */
  updatePreview() {
    try {
      if (this.contacts.length === 0) {
        // 清空现有内容并添加空状态
        this.contactPreview.innerHTML = ''; // 清空现有内容
        
        const emptyStateDiv = document.createElement('div');
        emptyStateDiv.className = 'empty-state';
        
        const iconElement = document.createElement('i');
        iconElement.className = 'fas fa-user-friends';
        emptyStateDiv.appendChild(iconElement);
        
        const pElement = document.createElement('p');
        pElement.textContent = '暂无联系人数据';
        emptyStateDiv.appendChild(pElement);
        
        this.contactPreview.appendChild(emptyStateDiv);
        
        this.contactCount.textContent = '0 个联系人';
        this.totalContacts.textContent = '0';
        this.validContacts.textContent = '0';
        this.invalidLines.textContent = '0';
        this.downloadBtn.disabled = true;
        return;
      }

      // 清空现有预览内容
      this.contactPreview.innerHTML = '';
      
      this.contacts.forEach(contact => {
        // 对显示内容进行XSS防护
        const sanitizedName = this.escapeHtml(contact.name);
        const sanitizedPhone = this.escapeHtml(contact.phone);
        
        // 创建联系人项元素
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        
        // 创建联系人信息容器
        const contactInfo = document.createElement('div');
        contactInfo.className = 'contact-info';
        contactItem.appendChild(contactInfo);
        
        // 创建头像元素
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = sanitizedName.charAt(0);
        contactInfo.appendChild(avatar);
        
        // 创建联系人详情容器
        const contactDetails = document.createElement('div');
        contactDetails.className = 'contact-details';
        contactInfo.appendChild(contactDetails);
        
        // 添加姓名
        const nameHeading = document.createElement('h4');
        nameHeading.textContent = sanitizedName;
        contactDetails.appendChild(nameHeading);
        
        // 添加电话
        const phoneParagraph = document.createElement('p');
        phoneParagraph.textContent = sanitizedPhone;
        contactDetails.appendChild(phoneParagraph);
        
        // 添加图标容器
        const iconContainer = document.createElement('div');
        const phoneIcon = document.createElement('i');
        phoneIcon.className = 'fas fa-phone';
        phoneIcon.style.color = 'var(--success)';
        iconContainer.appendChild(phoneIcon);
        contactItem.appendChild(iconContainer);
        
        this.contactPreview.appendChild(contactItem);
      });

      this.contactCount.textContent = `${this.contacts.length} 个联系人`;
      this.totalContacts.textContent = this.contacts.length;
      this.validContacts.textContent = this.contacts.length;
      
      this.downloadBtn.disabled = false;
    } catch (error) {
      console.error('更新预览时发生错误:', error);
      this.showNotification('更新预览时发生错误，请重试', 'error');
    }
  }

  /**
   * 转义HTML，防止XSS攻击
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

  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型 ('success' 或 'error')
   */
  showNotification(message, type = 'success') {
    try {
      // 对通知消息进行XSS防护
      const safeMessage = this.escapeHtml(message);
      this.notificationText.textContent = safeMessage;
      this.notification.className = `notification ${type} show`;
      
      setTimeout(() => {
        this.notification.classList.remove('show');
      }, 3000);
    } catch (error) {
      console.error('显示通知时发生错误:', error);
    }
  }
}
// 导出模块（ES6 模块格式）
export { UIController };
