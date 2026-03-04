// 滴灌通-投流通信息收集系统 - 完整前端应用

// ==================== 全局状态管理 ====================
const STATE = {
  user: null,
  token: null,
  currentPath: window.location.pathname,
  currentStep: 1,
  formData: {
    step1: {}, step2: {}, step3: {}, step4: [], step5: [], 
    step6: {}, step7: {}, step8: [], step9: {}
  },
  currentProject: null,
  projects: [],
  allProjects: [],
};

// ==================== API 请求封装 ====================
const API = {
  baseURL: '/api',
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (STATE.token) headers['Authorization'] = `Bearer ${STATE.token}`;
    return headers;
  },
  async request(method, url, data = null) {
    try {
      const config = { method, url: this.baseURL + url, headers: this.getHeaders() };
      if (data) config.data = data;
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || '请求失败');
    }
  },
  register: (data) => API.request('POST', '/register', data),
  login: (data) => API.request('POST', '/login', data),
  adminLogin: (data) => API.request('POST', '/admin/login', data),
  createProject: (data) => API.request('POST', '/projects', data),
  getProjects: () => API.request('GET', '/projects'),
  getProject: (id) => API.request('GET', `/projects/${id}`),
  getAllProjects: () => API.request('GET', '/admin/projects'),
  getAdminProject: (id) => API.request('GET', `/admin/projects/${id}`),
  scoreProject: (id) => API.request('POST', `/admin/projects/${id}/score`),
  approveProject: (id, action, remark) => API.request('POST', `/admin/projects/${id}/approve`, { action, remark }),
  uploadContract: (id) => API.request('POST', `/admin/projects/${id}/upload-contract`),
  confirmFunding: (id) => API.request('POST', `/admin/projects/${id}/confirm-funding`),
  deleteProject: (id) => API.request('DELETE', `/admin/projects/${id}`),
};

// ==================== 路由管理 ====================
const Router = {
  routes: {},
  add(path, handler) { this.routes[path] = handler; },
  navigate(path) {
    window.history.pushState({}, '', path);
    STATE.currentPath = path;
    this.render();
  },
  render() {
    const path = STATE.currentPath;
    if (path.startsWith('/project/')) {
      const id = path.split('/')[2];
      this.routes['/project/:id']?.(id);
    } else {
      (this.routes[path] || this.routes['/'])();
    }
  },
  init() {
    window.addEventListener('popstate', () => {
      STATE.currentPath = window.location.pathname;
      this.render();
    });
    this.render();
  }
};

// ==================== 工具函数 ====================
function showAlert(message, type = 'info') {
  const colors = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700'
  };
  const alert = document.createElement('div');
  alert.className = `fixed top-4 right-4 z-50 ${colors[type]} border px-4 py-3 rounded shadow-lg max-w-md`;
  alert.innerHTML = `<div class="flex items-center justify-between"><span>${message}</span><button onclick="this.parentElement.parentElement.remove()" class="ml-4 font-bold">&times;</button></div>`;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

function getStatusBadge(status, statusText) {
  const colors = {
    pending: 'bg-gray-500', scoring: 'bg-blue-500', approved: 'bg-green-500',
    rejected: 'bg-red-500', contract_uploaded: 'bg-yellow-500', funded: 'bg-purple-500'
  };
  return `<span class="px-3 py-1 rounded-full text-white text-sm ${colors[status] || 'bg-gray-500'}">${statusText}</span>`;
}

function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    STATE.token = token;
    STATE.user = JSON.parse(user);
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  STATE.token = null;
  STATE.user = null;
  Router.navigate('/login');
}

// ==================== 页面组件 ====================

// 用户登录/注册页面
function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 px-4">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div class="text-center mb-6">
          <i class="fas fa-seedling text-5xl text-blue-600 mb-2"></i>
          <h1 class="text-3xl font-bold text-gray-800">滴灌通-投流通</h1>
          <p class="text-gray-600 mt-2">信息收集系统</p>
        </div>
        
        <div class="flex border-b mb-6">
          <button id="loginTab" class="flex-1 py-2 px-4 font-semibold border-b-2 border-blue-600 text-blue-600" onclick="switchTab('login')">登录</button>
          <button id="registerTab" class="flex-1 py-2 px-4 font-semibold text-gray-600" onclick="switchTab('register')">注册</button>
        </div>
        
        <form id="loginForm" onsubmit="handleLogin(event)">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">用户名</label>
            <input type="text" name="username" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 mb-2">密码</label>
            <input type="password" name="password" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-sign-in-alt mr-2"></i>登录
          </button>
        </form>
        
        <form id="registerForm" class="hidden" onsubmit="handleRegister(event)">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">用户名 <span class="text-red-500">*</span></label>
            <input type="text" name="username" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">密码 <span class="text-red-500">*</span></label>
            <input type="password" name="password" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">企业名称 <span class="text-red-500">*</span></label>
            <input type="text" name="companyName" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">联系人姓名 <span class="text-red-500">*</span></label>
            <input type="text" name="contactName" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">联系电话 <span class="text-red-500">*</span></label>
            <input type="tel" name="contactPhone" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 mb-2">联系邮箱 <span class="text-red-500">*</span></label>
            <input type="email" name="contactEmail" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-user-plus mr-2"></i>注册
          </button>
        </form>
      </div>
    </div>
  `;
}

window.switchTab = function(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (tab === 'login') {
    loginTab.className = 'flex-1 py-2 px-4 font-semibold border-b-2 border-blue-600 text-blue-600';
    registerTab.className = 'flex-1 py-2 px-4 font-semibold text-gray-600';
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    registerTab.className = 'flex-1 py-2 px-4 font-semibold border-b-2 border-blue-600 text-blue-600';
    loginTab.className = 'flex-1 py-2 px-4 font-semibold text-gray-600';
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
};

window.handleLogin = async function(event) {
  event.preventDefault();
  const form = event.target;
  try {
    const result = await API.login({ username: form.username.value, password: form.password.value });
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    STATE.token = result.token;
    STATE.user = result.user;
    showAlert('登录成功！', 'success');
    Router.navigate('/dashboard');
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

window.handleRegister = async function(event) {
  event.preventDefault();
  const form = event.target;
  try {
    const result = await API.register({
      username: form.username.value,
      password: form.password.value,
      companyName: form.companyName.value,
      contactName: form.contactName.value,
      contactPhone: form.contactPhone.value,
      contactEmail: form.contactEmail.value,
    });
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    STATE.token = result.token;
    STATE.user = result.user;
    showAlert('注册成功！', 'success');
    Router.navigate('/dashboard');
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

// 用户仪表盘
async function renderDashboard() {
  if (!checkAuth()) {
    Router.navigate('/login');
    return;
  }
  
  try {
    const result = await API.getProjects();
    // API现在直接返回数组，而不是{projects: [...]}
    STATE.projects = Array.isArray(result) ? result : (result.projects || []);
    
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-100">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-seedling text-blue-600 mr-2"></i>滴灌通-投流通</h1>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-sm text-gray-600">${STATE.user.companyName}</p>
                <p class="text-sm font-semibold">${STATE.user.username}</p>
              </div>
              <button onclick="logout()" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                <i class="fas fa-sign-out-alt mr-2"></i>退出
              </button>
            </div>
          </div>
        </nav>
        
        <div class="max-w-7xl mx-auto px-4 py-8">
          <h2 class="text-3xl font-bold mb-6">仪表盘</h2>
          
          <div class="grid md:grid-cols-2 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl" onclick="window.location.href='/apply-financing'">
              <i class="fas fa-plus-circle text-4xl mb-4"></i>
              <h3 class="text-xl font-bold mb-2">提交新项目</h3>
              <p class="text-blue-100">点击开始填写表单</p>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <i class="fas fa-folder-open text-4xl mb-4"></i>
              <h3 class="text-xl font-bold mb-2">我的项目</h3>
              <p class="text-3xl font-bold">${STATE.projects.length}</p>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4">我的项目列表</h3>
            ${STATE.projects.length === 0 ? `
              <div class="text-center py-12 text-gray-500">
                <i class="fas fa-inbox text-5xl mb-4"></i>
                <p>暂无项目</p>
              </div>
            ` : `
              <table class="w-full">
                <thead><tr class="border-b">
                  <th class="text-left py-3 px-4">项目名称</th>
                  <th class="text-left py-3 px-4">状态</th>
                  <th class="text-left py-3 px-4">提交编号</th>
                  <th class="text-left py-3 px-4">创建时间</th>
                  <th class="text-left py-3 px-4">操作</th>
                </tr></thead>
                <tbody>
                  ${STATE.projects.map((p, i) => `
                    <tr class="${i % 2 === 0 ? 'bg-gray-50' : ''} hover:bg-blue-50">
                      <td class="py-3 px-4 font-semibold">${p.projectName || '未命名'}</td>
                      <td class="py-3 px-4">${getStatusBadge(p.status, p.statusText)}</td>
                      <td class="py-3 px-4 text-sm">${p.submissionCode}</td>
                      <td class="py-3 px-4 text-sm">${p.createdAt}</td>
                      <td class="py-3 px-4">
                        <button onclick="Router.navigate('/project/${p.id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          <i class="fas fa-eye mr-2"></i>查看
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// 简化的10步表单页面（演示版本，包含主要字段）
function render10StepForm() {
  if (!checkAuth()) {
    Router.navigate('/login');
    return;
  }
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div class="max-w-4xl mx-auto px-4">
          <h1 class="text-3xl font-bold mb-2">滴灌通-投流通信息收集系统</h1>
          <p class="text-blue-100">联合经营协议 & 挂牌文件列表信息收集</p>
        </div>
      </div>
      
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold mb-6">项目信息收集表单（简化版）</h2>
          <p class="text-gray-600 mb-6">此为演示版本，包含关键评分字段。完整版本包含10步详细信息。</p>
          
          <form onsubmit="handleFormSubmit(event)" class="space-y-6">
            <div>
              <label class="block font-semibold mb-2">企业名称 <span class="text-red-500">*</span></label>
              <input type="text" name="companyName" required class="w-full px-4 py-2 border rounded-lg" placeholder="请输入营业执照上的完整企业名称">
            </div>
            
            <!-- 三级类目选择（筛子系统） -->
            <div class="border-t pt-4">
              <h3 class="text-lg font-bold mb-4 text-gray-800">
                <i class="fas fa-sitemap text-purple-600 mr-2"></i>经营类目选择
              </h3>
              
              <!-- 搜索功能 -->
              <div class="category-search-container relative mb-4">
                <label class="block font-semibold mb-2">
                  <i class="fas fa-search text-gray-500 mr-1"></i>快速搜索类目（支持拼音和中文）
                </label>
                <input type="text" id="category-search-input"
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="输入关键词，如：水果、女装、nz、sg...">
                <div id="category-search-results" 
                     class="hidden absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"></div>
              </div>

              <!-- 三级联动下拉选择 -->
              <div class="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block font-semibold mb-2">主营类目 <span class="text-red-500">*</span></label>
                  <select id="main-category-select" required
                          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">-- 请选择主营类目 --</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-2">一级类目 <span class="text-gray-500 text-sm">(可选)</span></label>
                  <select id="level1-category-select" disabled
                          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">-- 请先选择主营类目 --</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-2">二级类目 <span class="text-gray-500 text-sm">(可选)</span></label>
                  <select id="level2-category-select" disabled
                          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">-- 请先选择一级类目 --</option>
                  </select>
                </div>
              </div>

              <!-- 已选类目显示 -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div class="text-sm font-semibold text-gray-700 mb-2">当前选择：</div>
                <div id="selected-category-path" class="text-gray-400">
                  <i class="fas fa-info-circle mr-2"></i>未选择（至少需要选择主营类目）
                </div>
              </div>
              
              <!-- 隐藏字段存储类目JSON -->
              <input type="hidden" id="selected_category_json" name="categoryJson">
            </div>
            
            <!-- 近90天经营数据（筛子系统四项指标） -->
            <div class="border-t pt-4">
              <h3 class="text-lg font-bold mb-4 text-gray-800">
                <i class="fas fa-chart-line text-orange-600 mr-2"></i>近90天经营数据
              </h3>
              
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold mb-2">净成交ROI <span class="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0.01" name="netRoi" required 
                         class="w-full px-4 py-2 border rounded-lg"
                         placeholder="如：1.85（表示185%）">
                  <p class="text-xs text-gray-500 mt-1">大于0，如1.85表示185%</p>
                </div>
                <div>
                  <label class="block font-semibold mb-2">14日结算ROI <span class="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0.01" name="settleRoi" required 
                         class="w-full px-4 py-2 border rounded-lg"
                         placeholder="如：1.62">
                  <p class="text-xs text-gray-500 mt-1">大于0，如1.62</p>
                </div>
                <div>
                  <label class="block font-semibold mb-2">14日订单结算率 (%) <span class="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" max="100" name="settleRate" required 
                         class="w-full px-4 py-2 border rounded-lg"
                         placeholder="如：82">
                  <p class="text-xs text-gray-500 mt-1">0-100，如82表示82%</p>
                </div>
                <div>
                  <label class="block font-semibold mb-2">历史消耗金额（元）<span class="text-red-500">*</span></label>
                  <input type="number" min="0" step="1000" name="historySpend" required 
                         class="w-full px-4 py-2 border rounded-lg"
                         placeholder="如：500000">
                  <p class="text-xs text-gray-500 mt-1">累计消耗，整数</p>
                </div>
              </div>
            </div>
            
            <div class="flex gap-4">
              <button type="button" onclick="Router.navigate('/dashboard')" class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                返回
              </button>
              <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1">
                <i class="fas fa-paper-plane mr-2"></i>提交项目
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // 初始化筛子系统（加载类目树）
  setTimeout(async () => {
    if (window.SIEVE && window.SIEVE.init) {
      await window.SIEVE.init();
      console.log('✅ 筛子系统已初始化');
    }
  }, 100);
}

window.handleFormSubmit = async function(event) {
  event.preventDefault();
  const form = event.target;
  
  // 获取类目JSON
  const categoryJson = document.getElementById('selected_category_json').value;
  if (!categoryJson) {
    showAlert('请选择经营类目', 'error');
    return;
  }
  
  const category = JSON.parse(categoryJson);
  if (!category.main) {
    showAlert('至少需要选择主营类目', 'error');
    return;
  }
  
  const projectData = {
    step1: { isSameEntity: '是', hasIncomeSharing: '否', fundUsage: '巨量引擎方舟账户广告投放充值' },
    step2: {
      companyName: form.companyName.value,
      creditCode: '91110000123456789X',
      address: '北京市朝阳区',
      // 筛子系统字段
      productCategory: category.level2 || category.level1 || category.main,  // 使用最细粒度类目
      mainCategory: category.main,
      level1Category: category.level1 || null,
      level2Category: category.level2 || null,
      netRoi: parseFloat(form.netRoi.value),
      settleRoi: parseFloat(form.settleRoi.value),
      settleRate: parseFloat(form.settleRate.value),
      historySpend: parseInt(form.historySpend.value),
      // 保留兼容字段（用于旧评分系统）
      roi: parseFloat(form.netRoi.value) * 100,  // 转换为百分比形式
      returnRate: 0,  // 新系统不使用
      profitRate: 0,  // 新系统不使用
      shopScore: 5,   // 新系统不使用
      operationMonths: 12,  // 新系统不使用
      businessDescription: '抖店投流融资业务'
    },
    step3: {},
    step4: [{ entityType: '主体A', name: '张三', idType: '身份证', idNumber: '110101199001011234' }],
    step5: [{ name: '李四', idType: '身份证', idNumber: '110101198001011234', shareholding: 100 }],
    step6: { contactName: STATE.user.contactName, contactPhone: STATE.user.contactEmail, contactEmail: STATE.user.contactEmail },
    step7: { bankName: '中国银行', bankAccount: '6217000012345678', invoiceType: '增值税专用发票', taxId: '91110000123456789X' },
    step8: [{ platformName: '抖音', accountDescription: '官方店铺', hasQianchuan: '是' }],
    step9: {
      totalAmount: 1000, batchCount: 1, batchAmount: 1000, firstAmount: 1000,
      subsequentAmount: 0, roiTarget: 1.5, roiRecoveryDays: 30, roiMaintainDays: 30,
      profitShare: 50, annualRate: 18, repaymentFrequency: '每月', repaymentRules: '每月15日还款'
    }
  };
  
  try {
    // 先调用准入检查
    const admissionData = {
      company_name: form.companyName.value,
      main_category: category.main,
      level1_category: category.level1 || null,
      level2_category: category.level2 || null,
      net_roi: parseFloat(form.netRoi.value),
      settle_roi: parseFloat(form.settleRoi.value),
      settle_rate: parseFloat(form.settleRate.value) / 100,  // 用户输入80，转换为0.8
      history_spend: parseInt(form.historySpend.value)
    };
    
    const admissionResult = await axios.post('/api/sieve/check-admission', admissionData);
    
    // 如果未通过准入，显示结果但仍然提交
    const isAdmitted = admissionResult.data.data.is_admitted;
    const admissionStatus = isAdmitted ? '可评分' : '未准入/不通过';
    
    if (!isAdmitted) {
      const confirmSubmit = confirm(
        `准入检查结果：${admissionStatus}\n` +
        `原因：${admissionResult.data.data.reasons.join('；')}\n\n` +
        `是否仍要提交项目？（提交后将标记为"未准入"状态）`
      );
      
      if (!confirmSubmit) {
        return;
      }
      
      // 标记为未准入
      projectData.step2.admissionResult = admissionStatus;
      projectData.step2.admissionDetails = JSON.stringify(admissionResult.data.data);
    } else {
      // 通过准入
      projectData.step2.admissionResult = '可评分';
      projectData.step2.admissionDetails = JSON.stringify(admissionResult.data.data);
    }
    
    const result = await API.createProject(projectData);
    showAlert('项目提交成功！准入检查已完成。', 'success');
    setTimeout(() => Router.navigate('/dashboard'), 1500);
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

// 项目详情页面
async function renderProjectDetail(id) {
  if (!checkAuth()) {
    Router.navigate('/login');
    return;
  }
  
  try {
    const result = await API.getProject(id);
    const project = result.project;
    
    // 构建类目路径
    const categoryPath = [project.main_category, project.level1_category, project.level2_category]
      .filter(Boolean).join(' > ') || '未填写';
    
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-100">
        <nav class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-4">
            <button onclick="Router.navigate('/dashboard')" class="text-blue-600 hover:underline">
              <i class="fas fa-arrow-left mr-2"></i>返回仪表盘
            </button>
          </div>
        </nav>
        
        <div class="max-w-5xl mx-auto px-4 py-8">
          <!-- 项目标题卡片 -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h1 class="text-3xl font-bold">${project.company_name_a || '项目详情'}</h1>
                <p class="text-gray-600 mt-2">提交编号：${project.submission_code}</p>
              </div>
              <div>${getStatusBadge(project.status, project.statusText)}</div>
            </div>
            
            <!-- 类目信息 -->
            <div class="mt-4 p-4 bg-blue-50 rounded-lg">
              <div class="text-sm text-gray-600 mb-1">经营类目</div>
              <div class="text-lg font-semibold text-blue-900">${categoryPath}</div>
            </div>
          </div>
          
          <!-- 经营数据卡片 -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-2xl font-bold mb-4">
              <i class="fas fa-chart-line mr-2"></i>经营数据
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div class="text-sm text-gray-600 mb-1">净成交ROI</div>
                <div class="text-2xl font-bold text-blue-900">
                  ${project.net_roi ? project.net_roi : '-'}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  ${project.net_roi ? (project.net_roi * 100).toFixed(0) + '%' : ''}
                </div>
              </div>
              
              <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div class="text-sm text-gray-600 mb-1">14日结算ROI</div>
                <div class="text-2xl font-bold text-green-900">
                  ${project.settle_roi ? project.settle_roi : '-'}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  ${project.settle_roi ? (project.settle_roi * 100).toFixed(0) + '%' : ''}
                </div>
              </div>
              
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div class="text-sm text-gray-600 mb-1">订单结算率</div>
                <div class="text-2xl font-bold text-purple-900">
                  ${project.settle_rate ? (project.settle_rate * 100).toFixed(1) + '%' : '-'}
                </div>
              </div>
              
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <div class="text-sm text-gray-600 mb-1">历史消耗</div>
                <div class="text-2xl font-bold text-orange-900">
                  ${project.history_spend ? '¥' + project.history_spend.toLocaleString() : '-'}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 筛子评分结果 -->
          ${project.sieve_score != null ? `
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 class="text-2xl font-bold mb-4">
                <i class="fas fa-award mr-2"></i>筛子评分
              </h2>
              <div class="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <div class="text-6xl font-bold ${project.sieve_score >= 60 ? 'text-green-600' : 'text-red-600'}">
                  ${project.sieve_score}
                </div>
                <div class="text-lg mt-2 text-gray-600">总分（满分100）</div>
                <div class="text-xl mt-3 font-semibold ${project.sieve_score >= 60 ? 'text-green-600' : 'text-red-600'}">
                  ${project.sieve_score >= 60 ? '✅ 评分通过' : '❌ 评分未达标'}
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- 投资方案入口（审批通过后显示）-->
          ${project.status === 'approved' || project.status === 'contract_uploaded' || project.status === 'funded' ? `
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-2xl font-bold mb-2">
                    <i class="fas fa-rocket mr-2"></i>投资方案
                  </h3>
                  <p class="text-blue-100">
                    您的项目已通过审批，现在可以设计投资方案了！
                  </p>
                </div>
                <button onclick="window.location.href='/investment-plan/${id}'" 
                        class="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-lg">
                  <i class="fas fa-chart-line mr-2"></i>查看/设计方案
                </button>
              </div>
            </div>
          ` : project.status === 'pending' || project.status === 'scoring' ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div class="flex items-center">
                <i class="fas fa-clock text-yellow-600 text-3xl mr-4"></i>
                <div>
                  <h3 class="text-lg font-bold text-yellow-900">项目审核中</h3>
                  <p class="text-yellow-700 mt-1">管理员正在审核您的项目，请耐心等待...</p>
                </div>
              </div>
            </div>
          ` : project.status === 'rejected' ? `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div class="flex items-center">
                <i class="fas fa-times-circle text-red-600 text-3xl mr-4"></i>
                <div>
                  <h3 class="text-lg font-bold text-red-900">项目未通过审批</h3>
                  <p class="text-red-700 mt-1">您的项目未通过审核，如有疑问请联系管理员</p>
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- 创建时间 -->
          <div class="bg-white rounded-lg shadow-lg p-4 text-center text-gray-600">
            <i class="fas fa-calendar mr-2"></i>创建时间：${project.createdAt || project.created_at}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// 管理员登录页面
function renderAdminLoginPage() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 px-4">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div class="text-center mb-6">
          <i class="fas fa-lock text-5xl text-gray-700 mb-2"></i>
          <h1 class="text-3xl font-bold text-gray-800">管理员登录</h1>
          <p class="text-gray-600 mt-2">滴灌通-投流通后台管理系统</p>
        </div>
        
        <form onsubmit="handleAdminLogin(event)">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">用户名</label>
            <input type="text" name="username" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 mb-2">密码</label>
            <input type="password" name="password" required class="w-full px-4 py-2 border rounded-lg">
          </div>
          <button type="submit" class="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-800">
            <i class="fas fa-sign-in-alt mr-2"></i>登录
          </button>
        </form>
      </div>
    </div>
  `;
}

window.handleAdminLogin = async function(event) {
  event.preventDefault();
  const form = event.target;
  try {
    const result = await API.adminLogin({ username: form.username.value, password: form.password.value });
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    STATE.token = result.token;
    STATE.user = result.user;
    showAlert('登录成功！', 'success');
    Router.navigate('/admin');
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

// 管理员后台
async function renderAdminDashboard() {
  if (!checkAuth()) {
    console.log('未授权，跳转到登录页');
    Router.navigate('/admin/login');
    return;
  }
  
  console.log('当前STATE.token:', STATE.token);
  console.log('当前STATE.user:', STATE.user);
  
  try {
    console.log('开始请求管理员项目列表...');
    const result = await API.getAllProjects();
    console.log('获取到项目列表:', result);
    STATE.allProjects = result.projects;
    
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-100">
        <nav class="bg-gray-800 text-white">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold"><i class="fas fa-shield-alt mr-2"></i>后台管理系统</h1>
            <div class="flex space-x-4">
              <a href="/admin/scoring-config" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white inline-flex items-center">
                <i class="fas fa-sliders-h mr-2"></i>筛子配置
              </a>
              <button onclick="logout()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">
                <i class="fas fa-sign-out-alt mr-2"></i>退出
              </button>
            </div>
          </div>
        </nav>
        
        <div class="max-w-7xl mx-auto px-4 py-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold">项目列表</h2>
            <button onclick="refreshAdminProjects()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <i class="fas fa-sync-alt mr-2"></i>刷新
            </button>
          </div>
          
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left py-3 px-4">提交编号</th>
                  <th class="text-left py-3 px-4">企业名称</th>
                  <th class="text-left py-3 px-4">经营类目</th>
                  <th class="text-left py-3 px-4">准入状态</th>
                  <th class="text-left py-3 px-4">筛子评分</th>
                  <th class="text-left py-3 px-4">项目状态</th>
                  <th class="text-left py-3 px-4">创建时间</th>
                  <th class="text-left py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                ${STATE.allProjects.map((p, i) => {
                  // 构建类目路径
                  const categoryPath = [p.main_category, p.level1_category, p.level2_category]
                    .filter(Boolean).join(' > ') || '未填写';
                  
                  // 准入状态徽章
                  const admissionBadge = p.admission_result === '可评分' 
                    ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"><i class="fas fa-check-circle mr-1"></i>可评分</span>'
                    : p.admission_result === '未准入/不通过'
                    ? '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"><i class="fas fa-times-circle mr-1"></i>未准入</span>'
                    : '<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">-</span>';
                  
                  // 筛子评分显示
                  const sieveScore = p.sieve_score != null
                    ? `<span class="font-bold ${p.sieve_score >= 60 ? 'text-green-600' : 'text-red-600'}">${p.sieve_score}分</span>`
                    : '<span class="text-gray-400">未评分</span>';
                  
                  return `
                  <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50">
                    <td class="py-3 px-4 text-sm">${p.submissionCode}</td>
                    <td class="py-3 px-4 font-semibold">${p.projectName || '未命名'}</td>
                    <td class="py-3 px-4 text-sm">
                      <div class="max-w-xs truncate" title="${categoryPath}">${categoryPath}</div>
                    </td>
                    <td class="py-3 px-4">${admissionBadge}</td>
                    <td class="py-3 px-4">${sieveScore}</td>
                    <td class="py-3 px-4">${getStatusBadge(p.status, p.statusText)}</td>
                    <td class="py-3 px-4 text-sm">${p.createdAt}</td>
                    <td class="py-3 px-4">
                      <button onclick="openAdminProjectModal(${p.id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-eye mr-2"></i>查看详情
                      </button>
                    </td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

window.refreshAdminProjects = function() {
  renderAdminDashboard();
};

window.openAdminProjectModal = async function(id) {
  try {
    const result = await API.getAdminProject(id);
    const project = result.project;
    
    const modal = document.createElement('div');
    modal.id = 'adminModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 class="text-2xl font-bold">项目详情</h2>
          <button onclick="document.getElementById('adminModal').remove()" class="text-gray-600 hover:text-gray-800">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- 基本信息 -->
          <div class="bg-gray-50 p-4 rounded">
            <h3 class="font-bold mb-3 text-lg">基本信息</h3>
            <div class="grid grid-cols-2 gap-3">
              <p><span class="font-semibold">提交编号：</span>${project.submission_code}</p>
              <p><span class="font-semibold">企业名称：</span>${project.company_name_a}</p>
              <p><span class="font-semibold">项目状态：</span>${getStatusBadge(project.status, project.statusText)}</p>
              <p><span class="font-semibold">创建时间：</span>${project.created_at}</p>
            </div>
          </div>
          
          <!-- 筛子评分按钮 -->
          ${!project.sieve_score && project.main_category && project.net_roi ? `
            <div id="sieveScoreSection">
              <button onclick="handleSieveScore(${id})" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg text-lg font-bold">
                <i class="fas fa-calculator mr-2"></i>筛子智能评分
              </button>
              ${project.admission_result && project.admission_result !== '可评分' ? `
                <div class="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  该项目准入检查未通过，但管理员可手动评分
                </div>
              ` : ''}
            </div>
          ` : project.sieve_score != null ? `
            <!-- 筛子评分结果 -->
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6">
              <h3 class="text-xl font-bold mb-4 text-purple-900">
                <i class="fas fa-award mr-2"></i>筛子评分结果
              </h3>
              <div class="text-center mb-4">
                <div class="text-6xl font-bold ${project.sieve_score >= 60 ? 'text-green-600' : 'text-red-600'}">
                  ${project.sieve_score}
                </div>
                <div class="text-sm text-gray-600 mt-1">总分（满分100）</div>
                <div class="text-xl mt-2 ${project.sieve_score >= 60 ? 'text-green-600' : 'text-red-600'}">
                  ${project.sieve_score >= 60 ? '✅ 评分通过' : '❌ 评分未达标'}
                </div>
              </div>
              
              ${project.sieve_score_details ? `
                <div class="mt-4 space-y-2">
                  ${(() => {
                    try {
                      const details = JSON.parse(project.sieve_score_details);
                      let html = details.details ? details.details.map(d => `
                        <div class="bg-white p-3 rounded flex justify-between items-center">
                          <div>
                            <div class="font-semibold text-sm">${d.field_name}</div>
                            <div class="text-xs text-gray-600">
                              实际: ${d.actual_display} | 阈值: ${d.threshold_display} | 提升: +${(d.uplift * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div class="text-lg font-bold text-blue-600">${d.sub_score.toFixed(1)}分</div>
                        </div>
                      `).join('') : '';
                      
                      // 添加90天数据统计指标（不参与评分）
                      if (details.revenue_stats) {
                        const stats = details.revenue_stats;
                        html += `
                          <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 class="font-bold text-blue-900 mb-3 flex items-center">
                              <i class="fas fa-chart-bar mr-2"></i>90天净成交数据统计（不参与评分）
                            </h4>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div class="bg-white p-2 rounded">
                                <div class="text-gray-600">数据天数</div>
                                <div class="font-bold text-gray-900">${stats.count}天</div>
                              </div>
                              <div class="bg-white p-2 rounded">
                                <div class="text-gray-600">平均值</div>
                                <div class="font-bold text-gray-900">¥${stats.avg.toLocaleString()}</div>
                              </div>
                              <div class="bg-white p-2 rounded">
                                <div class="text-gray-600">中位数</div>
                                <div class="font-bold text-gray-900">¥${stats.median.toLocaleString()}</div>
                              </div>
                              <div class="bg-white p-2 rounded">
                                <div class="text-gray-600">最低值</div>
                                <div class="font-bold text-orange-600">¥${stats.min.toLocaleString()}</div>
                              </div>
                              <div class="bg-white p-2 rounded">
                                <div class="text-gray-600">最高值</div>
                                <div class="font-bold text-green-600">¥${stats.max.toLocaleString()}</div>
                              </div>
                              <div class="bg-white p-2 rounded">
                                <div class="text-gray-600">波动率</div>
                                <div class="font-bold ${stats.volatility > 0.10 ? 'text-red-600' : 'text-green-600'}">
                                  ${(stats.volatility * 100).toFixed(2)}%
                                </div>
                              </div>
                            </div>
                            <div class="mt-2 text-xs text-gray-600">
                              <i class="fas fa-info-circle mr-1"></i>
                              波动率反映经营稳定性，但爆发力和稳定性需要综合判断，此指标仅供参考不参与评分
                            </div>
                          </div>
                        `;
                      }
                      
                      return html;
                    } catch (e) {
                      return '';
                    }
                  })()}
                </div>
              ` : ''}
              
              <button onclick="handleSieveScore(${id})" class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <i class="fas fa-redo mr-2"></i>重新评分
              </button>
            </div>
          ` : ''}
          
          
          <div id="workflow-actions">
            ${project.status === 'pending' || project.status === 'scoring' ? `
              <div class="flex gap-4">
                <button onclick="handleApprove(${id}, 'approve')" class="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <i class="fas fa-check mr-2"></i>审批通过
                </button>
                <button onclick="handleApprove(${id}, 'reject')" class="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <i class="fas fa-times mr-2"></i>审批拒绝
                </button>
              </div>
            ` : project.status === 'approved' ? `
              <div class="bg-blue-50 p-4 rounded mb-4">
                <p class="text-blue-700 font-semibold">
                  <i class="fas fa-info-circle mr-2"></i>
                  项目已通过审批，等待融资方提交投资方案和挂牌信息
                </p>
              </div>
              <div id="listingInfoSection" class="mt-4">
                <!-- 这里将自动加载投资方案和挂牌信息审核界面 -->
              </div>
            ` : project.status === 'contract_uploaded' ? `
              <div class="bg-yellow-50 p-4 rounded mb-4">
                <p class="text-yellow-700 font-semibold"><i class="fas fa-file-contract mr-2"></i>协议已上传</p>
              </div>
              <button onclick="handleConfirmFunding(${id})" class="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <i class="fas fa-money-bill mr-2"></i>确认出资
              </button>
            ` : project.status === 'funded' ? `
              <div class="bg-purple-50 p-4 rounded">
                <p class="text-purple-700 font-semibold"><i class="fas fa-check-double mr-2"></i>已完成出资</p>
              </div>
            ` : `
              <div class="bg-red-50 p-4 rounded">
                <p class="text-red-700 font-semibold"><i class="fas fa-ban mr-2"></i>项目已拒绝</p>
              </div>
            `}
          </div>
          
          <button onclick="handleDeleteProject(${id})" class="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <i class="fas fa-trash mr-2"></i>删除记录
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 如果项目已通过审批，自动加载投资方案和挂牌信息
    if (project.status === 'approved') {
      setTimeout(() => {
        window.loadInvestmentPlanAndListingInfo(id);
      }, 100);
    }
  } catch (error) {
    showAlert(error.message, 'error');
  }
};


// 筛子评分处理函数
window.handleSieveScore = async function(id) {
  try {
    showAlert('正在计算筛子评分...', 'info');
    
    // 调用筛子评分API
    const result = await axios.post(`/api/sieve/scoring/calculate/${id}`);
    
    if (result.data.success) {
      const score = result.data.data.total_score;
      showAlert(`筛子评分完成：${score.toFixed(1)}分 ${score >= 60 ? '✅ 通过' : '❌ 未达标'}`, 'success');
      
      document.getElementById('adminModal').remove();
      refreshAdminProjects();
    } else {
      showAlert(result.data.error || '评分失败', 'error');
    }
  } catch (error) {
    showAlert(error.response?.data?.error || error.message || '评分失败', 'error');
  }
};

// 导航到投资方案设计页面
window.navigateToInvestmentPlan = function(id) {
  window.location.href = `/investment-plan/${id}`;
};

window.handleApprove = async function(id, action) {
  if (action === 'reject') {
    const remark = prompt('请输入拒绝原因：');
    if (!remark) return;
    
    try {
      await API.approveProject(id, action, remark);
      showAlert('审批拒绝成功！', 'success');
      document.getElementById('adminModal').remove();
      refreshAdminProjects();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  } else {
    // 审批通过
    const confirmed = confirm('确认审批通过该项目？');
    if (!confirmed) return;
    
    try {
      const result = await API.approveProject(id, action, '审批通过');
      showAlert('审批通过成功！', 'success');
      document.getElementById('adminModal').remove();
      refreshAdminProjects();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  }
};

// 加载投资方案和挂牌信息（管理员审核用）
window.loadInvestmentPlanAndListingInfo = async function(projectId) {
  try {
    // 1. 加载投资方案
    const planResponse = await axios.get(`/api/investment/projects/${projectId}/investment-plan`, {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    
    // 2. 加载挂牌信息
    const listingResponse = await axios.get(`/api/investment/projects/${projectId}/listing-info`, {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    
    const section = document.getElementById('listingInfoSection');
    if (!section) return;
    
    const planData = planResponse.data.data;
    const listingData = listingResponse.data.data;
    
    // 如果两者都没有数据，显示等待提示
    if (!planData && !listingData) {
      section.innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p class="text-yellow-800">
            <i class="fas fa-clock mr-2"></i>
            等待融资方提交投资方案和挂牌信息...
          </p>
        </div>
      `;
      return;
    }
    
    // 如果已提交，显示审核界面
    // 注意：is_submitted在数据库中是0或1，需要转换为布尔值判断
    if (listingData && (listingData.is_submitted === 1 || listingData.is_submitted === true)) {
      section.innerHTML = `
        <div class="border-2 border-green-500 rounded-lg p-6 bg-green-50">
          <h3 class="text-2xl font-bold text-green-800 mb-4">
            <i class="fas fa-clipboard-check mr-2"></i>
            投资方案和挂牌信息审核
          </h3>
          <p class="text-green-700 mb-4">
            <i class="fas fa-check-circle mr-2"></i>
            融资方已提交投资方案和挂牌信息，请审核
          </p>
          
          <!-- 投资方案 -->
          ${planData ? `
            <div class="bg-white rounded-lg p-4 mb-4">
              <h4 class="font-bold text-lg mb-3 text-purple-800">
                <i class="fas fa-chart-line mr-2"></i>投资方案
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span class="text-gray-600">联营资金总额：</span>
                  <span class="font-bold text-lg text-blue-600">¥${(planData.investmentAmount || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span class="text-gray-600">分成比例：</span>
                  <span class="font-bold text-lg text-purple-600">${((planData.profitShareRatio || 0) * 100).toFixed(2)}%</span>
                </div>
                <div>
                  <span class="text-gray-600">回款频率：</span>
                  <span class="font-bold">${planData.paymentFrequency === 'daily' ? '每日' : planData.paymentFrequency === 'weekly' ? '每周' : '每两周'}</span>
                </div>
                <div>
                  <span class="text-gray-600">每日回款金额：</span>
                  <span class="font-bold">¥${(planData.dailyRepayment || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div>
                  <span class="text-gray-600">预计联营天数：</span>
                  <span class="font-bold">${planData.estimatedDays || 0}天</span>
                </div>
                <div>
                  <span class="text-gray-600">年化收益率：</span>
                  <span class="font-bold text-lg text-orange-600">${planData.annualRate ? (planData.annualRate * 100).toFixed(2) + '%' : '-'}</span>
                </div>
                <div>
                  <span class="text-gray-600">总支付金额：</span>
                  <span class="font-bold text-lg text-green-600">¥${(planData.totalReturnAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          ` : '<div class="bg-yellow-50 p-3 rounded text-yellow-800 text-sm">未设置投资方案</div>'}
          
          <!-- 挂牌信息 -->
          ${listingData ? `
            <div class="bg-white rounded-lg p-4 mb-4">
              <h4 class="font-bold text-lg mb-3 text-blue-800">
                <i class="fas fa-building mr-2"></i>挂牌主体信息
              </h4>
              <div class="space-y-3 text-sm">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-gray-600">企业中文名称：</span>
                    <span class="font-semibold">${listingData.company_name || '-'}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">注册编号：</span>
                    <span class="font-semibold">${listingData.registration_number || '-'}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">注册地址：</span>
                    <span class="font-semibold">${listingData.registered_address || '-'}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">成立日期：</span>
                    <span class="font-semibold">${listingData.establishment_date || '-'}</span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-gray-600">经营业态：</span>
                    <span class="font-semibold">${listingData.business_format || '-'}</span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-gray-600">经营简介：</span>
                    <span>${listingData.business_intro || '-'}</span>
                  </div>
                </div>
                
                <div class="border-t pt-3">
                  <h5 class="font-bold text-gray-700 mb-2">法定代表人信息</h5>
                  <div class="grid grid-cols-2 gap-2">
                    <div><span class="text-gray-600">姓名：</span>${listingData.legal_rep_name || '-'}</div>
                    <div><span class="text-gray-600">证件类型：</span>${listingData.legal_rep_id_type || '-'}</div>
                    <div><span class="text-gray-600">证件号码：</span>${listingData.legal_rep_id_number || '-'}</div>
                    <div><span class="text-gray-600">电话：</span>${listingData.legal_rep_phone || '-'}</div>
                  </div>
                </div>
                
                <div class="border-t pt-3">
                  <h5 class="font-bold text-gray-700 mb-2">实控人信息</h5>
                  <div class="grid grid-cols-2 gap-2">
                    <div><span class="text-gray-600">姓名：</span>${listingData.actual_controller_name || '-'}</div>
                    <div><span class="text-gray-600">证件类型：</span>${listingData.actual_controller_id_type || '-'}</div>
                  </div>
                </div>
                
                <div class="border-t pt-3">
                  <h5 class="font-bold text-gray-700 mb-2">预计营收（万元）</h5>
                  <div class="grid grid-cols-4 gap-2">
                    <div><span class="text-gray-600">2026年：</span>${listingData.revenue_2026 || '-'}</div>
                    <div><span class="text-gray-600">2027年：</span>${listingData.revenue_2027 || '-'}</div>
                    <div><span class="text-gray-600">2028年：</span>${listingData.revenue_2028 || '-'}</div>
                    <div><span class="text-gray-600">2029年：</span>${listingData.revenue_2029 || '-'}</div>
                  </div>
                </div>
              </div>
              
              <button onclick="viewFullListingInfo(${projectId})" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <i class="fas fa-expand mr-2"></i>查看完整信息
              </button>
            </div>
          ` : '<div class="bg-yellow-50 p-3 rounded text-yellow-800 text-sm">未提交挂牌信息</div>'}
          
          <!-- 审核操作 -->
          <div class="flex gap-4 mt-6">
            <button onclick="handleListingApprove(${projectId}, 'approve')" class="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">
              <i class="fas fa-check mr-2"></i>审核通过
            </button>
            <button onclick="handleListingApprove(${projectId}, 'reject')" class="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold">
              <i class="fas fa-times mr-2"></i>审核拒绝
            </button>
          </div>
        </div>
      `;
    } else {
      // 已保存草稿但未提交
      section.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-blue-800">
            <i class="fas fa-edit mr-2"></i>
            融资方正在填写投资方案和挂牌信息（已保存草稿）...
          </p>
          ${planData ? `
            <p class="text-sm text-gray-600 mt-2">
              当前投资金额：¥${(planData.investmentAmount || 0).toLocaleString()} | 
              分成比例：${((planData.profitShareRatio || 0) * 100).toFixed(2)}%
            </p>
          ` : ''}
        </div>
      `;
    }
    
  } catch (error) {
    console.error('加载失败:', error);
    const section = document.getElementById('listingInfoSection');
    if (section) {
      section.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            加载失败：${error.message}
          </p>
        </div>
      `;
    }
  }
};

// 查看完整挂牌信息
window.viewFullListingInfo = async function(projectId) {
  // 辅助函数：渲染文件链接
  const renderFileLink = (fileData, label) => {
    // 过滤空值和字符串"null"
    if (!fileData || fileData === 'null' || fileData === 'undefined') return '';
    
    try {
      const fileInfo = typeof fileData === 'string' ? JSON.parse(fileData) : fileData;
      if (fileInfo && fileInfo.file_url) {
        return `
          <div class="bg-white p-3 rounded col-span-2">
            <div class="text-sm text-gray-600 mb-1">${label}</div>
            <a href="${fileInfo.file_url}" target="_blank" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
              <i class="fas fa-file-download"></i>
              <span>${fileInfo.file_name || '查看文件'}</span>
              <span class="text-xs text-gray-500">(${(fileInfo.file_size / 1024).toFixed(2)} KB)</span>
            </a>
          </div>
        `;
      }
    } catch (e) {
      console.warn('解析文件信息失败:', label, e);
    }
    return '';
  };
  
  try {
    // 加载挂牌信息
    const response = await axios.get(`/api/investment/projects/${projectId}/listing-info`, {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    
    const listingData = response.data.data;
    
    if (!listingData) {
      showAlert('未找到挂牌信息', 'warning');
      return;
    }
    
    // 创建详细信息模态框
    const detailModal = document.createElement('div');
    detailModal.id = 'listingDetailModal';
    detailModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4';
    detailModal.innerHTML = `
      <div class="bg-white rounded-lg max-w-5xl w-full max-h-screen overflow-y-auto">
        <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 class="text-2xl font-bold">
            <i class="fas fa-file-alt mr-2"></i>挂牌主体完整信息
          </h2>
          <button onclick="document.getElementById('listingDetailModal').remove()" class="text-white hover:text-gray-200">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- 1. 挂牌主体工商信息 -->
          <div class="border-l-4 border-blue-500 pl-6 bg-blue-50 rounded-r-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-building mr-2 text-blue-600"></i>
              1. 挂牌主体工商信息
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">挂牌主体企业中文名称</div>
                <div class="font-semibold text-gray-900">${listingData.company_name || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">注册编号</div>
                <div class="font-semibold text-gray-900">${listingData.registration_number || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">注册地址</div>
                <div class="font-semibold text-gray-900">${listingData.registered_address || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">企业成立日期</div>
                <div class="font-semibold text-gray-900">${listingData.establishment_date || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">主题业态</div>
                <div class="font-semibold text-gray-900">${listingData.business_format || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">主营业务简介</div>
                <div class="text-gray-900">${listingData.business_intro || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">经营范围</div>
                <div class="text-gray-900">${listingData.business_scope || '-'}</div>
              </div>
              ${renderFileLink(listingData.file_company_registration, '📄 企业注册证书+公章')}
            </div>
          </div>
          
          <!-- 2. 法定代表人 -->
          <div class="border-l-4 border-purple-500 pl-6 bg-purple-50 rounded-r-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-user-tie mr-2 text-purple-600"></i>
              2. 法定代表人
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">中文姓名</div>
                <div class="font-semibold text-gray-900">${listingData.legal_rep_name || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">证件类型</div>
                <div class="font-semibold text-gray-900">${listingData.legal_rep_id_type || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">证件号码</div>
                <div class="font-semibold text-gray-900">${listingData.legal_rep_id_number || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">电话</div>
                <div class="font-semibold text-gray-900">${listingData.legal_rep_phone || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">实际居住地址</div>
                <div class="font-semibold text-gray-900">${listingData.legal_rep_address || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">电邮</div>
                <div class="font-semibold text-gray-900">${listingData.legal_rep_email || '-'}</div>
              </div>
              ${renderFileLink(listingData.file_legal_rep_id, '📄 法定代表人身份证件（正反面）')}
              ${renderFileLink(listingData.file_legal_rep_address_proof, '📄 法定代表人住址证明')}
            </div>
          </div>
          
          <!-- 3. 实控人 -->
          <div class="border-l-4 border-green-500 pl-6 bg-green-50 rounded-r-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-user-shield mr-2 text-green-600"></i>
              3. 实控人
            </h3>
            <p class="text-sm text-gray-600 mb-3">股权穿透后持股占比最大的自然人及其它实际控制人</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">中文姓名</div>
                <div class="font-semibold text-gray-900">${listingData.actual_controller_name || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">证件类型</div>
                <div class="font-semibold text-gray-900">${listingData.actual_controller_id_type || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">证件号码</div>
                <div class="font-semibold text-gray-900">${listingData.actual_controller_id_number || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">电话</div>
                <div class="font-semibold text-gray-900">${listingData.actual_controller_phone || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">实际居住地址</div>
                <div class="font-semibold text-gray-900">${listingData.actual_controller_address || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">电邮</div>
                <div class="font-semibold text-gray-900">${listingData.actual_controller_email || '-'}</div>
              </div>
              ${renderFileLink(listingData.file_actual_controller_id, '📄 实际控制人身份证件（正反面）')}
              ${renderFileLink(listingData.file_actual_controller_address_proof, '📄 实际控制人住址证明')}
              ${renderFileLink(listingData.file_actual_controller_proof, '📄 实控人证明文件+公章')}
            </div>
          </div>
          
          <!-- 4. 实益拥有人 -->
          <div class="border-l-4 border-orange-500 pl-6 bg-orange-50 rounded-r-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-users mr-2 text-orange-600"></i>
              4. 实益拥有人
            </h3>
            <p class="text-sm text-gray-600 mb-3">所有直接或间接拥有或控制25%或以上实益拥有权的自然人</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">中文姓名</div>
                <div class="font-semibold text-gray-900">${listingData.beneficial_owner_name || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">证件类型</div>
                <div class="font-semibold text-gray-900">${listingData.beneficial_owner_id_type || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">证件号码</div>
                <div class="font-semibold text-gray-900">${listingData.beneficial_owner_id_number || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">电话</div>
                <div class="font-semibold text-gray-900">${listingData.beneficial_owner_phone || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">实际居住地址</div>
                <div class="font-semibold text-gray-900">${listingData.beneficial_owner_address || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">电邮</div>
                <div class="font-semibold text-gray-900">${listingData.beneficial_owner_email || '-'}</div>
              </div>
              ${renderFileLink(listingData.file_beneficial_owner_id, '📄 实益拥有人身份证件（正反面）')}
              ${renderFileLink(listingData.file_beneficial_owner_address_proof, '📄 实益拥有人住址证明')}
            </div>
          </div>
          
          <!-- 5. 准入条件 -->
          <div class="border-l-4 border-red-500 pl-6 bg-red-50 rounded-r-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-check-circle mr-2 text-red-600"></i>
              5. 准入条件
            </h3>
            <div class="space-y-3">
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">存续时间不短于12个月</div>
                <div class="font-semibold ${listingData.condition_1 === '是' ? 'text-green-600' : 'text-red-600'}">
                  ${listingData.condition_1 || '-'}
                </div>
                ${listingData.condition_1_note ? `<div class="text-sm text-gray-700 mt-2 p-2 bg-yellow-50 rounded">说明：${listingData.condition_1_note}</div>` : ''}
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">最近连续365日合计营业额不低于500万人民币</div>
                <div class="font-semibold ${listingData.condition_2 === '是' ? 'text-green-600' : 'text-red-600'}">
                  ${listingData.condition_2 || '-'}
                </div>
                ${listingData.condition_2_note ? `<div class="text-sm text-gray-700 mt-2 p-2 bg-yellow-50 rounded">说明：${listingData.condition_2_note}</div>` : ''}
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">有可靠且运营情况良好的收入管控系统</div>
                <div class="font-semibold ${listingData.condition_3 === '是' ? 'text-green-600' : 'text-red-600'}">
                  ${listingData.condition_3 || '-'}
                </div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">整体营收状况良好，能够达到营收能力要求</div>
                <div class="font-semibold ${listingData.condition_4 === '是' ? 'text-green-600' : 'text-red-600'}">
                  ${listingData.condition_4 || '-'}
                </div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">不存在重大法律合规风险</div>
                <div class="font-semibold ${listingData.condition_5 === '是' ? 'text-green-600' : 'text-red-600'}">
                  ${listingData.condition_5 || '-'}
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              ${renderFileLink(listingData.file_condition_1_proof, '📄 存续时间证明文件')}
              ${renderFileLink(listingData.file_condition_2_proof, '📄 营业额证明文件+公章')}
            </div>
          </div>
          
          <!-- 6. 企业预计营收信息 -->
          <div class="border-l-4 border-indigo-500 pl-6 bg-indigo-50 rounded-r-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-chart-line mr-2 text-indigo-600"></i>
              6. 企业预计营收信息
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">2026 营业总收入/门店数</div>
                <div class="font-semibold text-gray-900">${listingData.revenue_2026 || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">2027 营业总收入/门店数</div>
                <div class="font-semibold text-gray-900">${listingData.revenue_2027 || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">2028 营业总收入/门店数</div>
                <div class="font-semibold text-gray-900">${listingData.revenue_2028 || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">2029 营业总收入/门店数</div>
                <div class="font-semibold text-gray-900">${listingData.revenue_2029 || '-'}</div>
              </div>
              ${renderFileLink(listingData.file_revenue_forecast, '📄 未来12个月预估营业额信息+公章')}
            </div>
          </div>
          
          <!-- 7. 授权人信息 -->
          <div class="border-l-4 border-pink-500 pl-6 bg-pink-50 rounded-r-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-user-check mr-2 text-pink-600"></i>
              7. 授权人信息
            </h3>
            <p class="text-sm text-gray-600 mb-3">可以是法人/其他授权人士</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">中文姓名</div>
                <div class="font-semibold text-gray-900">${listingData.authorizer_name || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">证件类型</div>
                <div class="font-semibold text-gray-900">${listingData.authorizer_id_type || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">证件号码</div>
                <div class="font-semibold text-gray-900">${listingData.authorizer_id_number || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded">
                <div class="text-sm text-gray-600">电话</div>
                <div class="font-semibold text-gray-900">${listingData.authorizer_phone || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">实际居住地址</div>
                <div class="font-semibold text-gray-900">${listingData.authorizer_address || '-'}</div>
              </div>
              <div class="bg-white p-3 rounded col-span-2">
                <div class="text-sm text-gray-600">电邮</div>
                <div class="font-semibold text-gray-900">${listingData.authorizer_email || '-'}</div>
              </div>
              ${renderFileLink(listingData.file_directors_list, '📄 董事会成员及其他主要人员名册+公章')}
              ${renderFileLink(listingData.file_board_resolution, '📄 董事会书面决议授权+公章')}
              ${renderFileLink(listingData.file_email_authorization, '📄 电邮申请说明+公章+授权人/法人签名')}
            </div>
          </div>
          
          <!-- 提交信息 -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-600">提交状态</div>
                <div class="font-bold ${listingData.is_submitted === 1 ? 'text-green-600' : 'text-yellow-600'}">
                  ${listingData.is_submitted === 1 ? '✅ 已提交' : '📝 草稿'}
                </div>
              </div>
              ${listingData.submitted_at ? `
                <div>
                  <div class="text-sm text-gray-600">提交时间</div>
                  <div class="font-semibold text-gray-900">${new Date(listingData.submitted_at).toLocaleString('zh-CN')}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-between">
          <div class="flex gap-3">
            <button onclick="exportListingToExcel(${projectId})" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <i class="fas fa-file-excel"></i>
              导出Excel
            </button>
            <button onclick="downloadAllFiles(${projectId})" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <i class="fas fa-download"></i>
              下载所有文件
            </button>
          </div>
          <button onclick="document.getElementById('listingDetailModal').remove()" class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            <i class="fas fa-times mr-2"></i>关闭
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(detailModal);
  } catch (error) {
    console.error('加载完整信息失败:', error);
    showAlert('加载失败: ' + error.message, 'error');
  }
};

// 处理挂牌信息审核
window.handleListingApprove = async function(projectId, action) {
  if (action === 'reject') {
    const remark = prompt('请输入审核拒绝原因：');
    if (!remark) return;
    
    try {
      // TODO: 调用审核拒绝API
      showAlert('审核拒绝成功！', 'success');
      document.getElementById('adminModal').remove();
      refreshAdminProjects();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  } else {
    const confirmed = confirm('确认审核通过投资方案和挂牌信息？');
    if (!confirmed) return;
    
    try {
      // TODO: 调用审核通过API，更新项目状态
      showAlert('审核通过成功！可以上传协议了', 'success');
      document.getElementById('adminModal').remove();
      refreshAdminProjects();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  }
};

// 导出挂牌信息为Excel
window.exportListingToExcel = async function(projectId) {
  try {
    showAlert('正在生成Excel文件...', 'info');
    
    // 调用后端API获取数据
    const response = await axios.get(`/api/investment/projects/${projectId}/listing-info/export`, {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || '导出失败');
    }
    
    const excelData = response.data.data;
    const filename = response.data.filename;
    
    // 动态加载xlsx库
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('加载xlsx库失败'));
      });
    }
    
    // 转换数据为二维数组格式（竖向布局：一列字段名，一列值）
    const headers = Object.keys(excelData);
    const values = Object.values(excelData);
    const wsData = headers.map((header, index) => [header, values[index]]);
    
    // 创建工作表
    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽（第一列字段名，第二列值）
    ws['!cols'] = [
      { wch: 30 },  // 字段名列宽
      { wch: 50 }   // 值列宽
    ];
    
    // 创建工作簿
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, '挂牌信息');
    
    // 导出文件
    window.XLSX.writeFile(wb, filename);
    
    showAlert('Excel文件导出成功！', 'success');
    
  } catch (error) {
    console.error('导出Excel失败:', error);
    showAlert('导出失败: ' + error.message, 'error');
  }
};

// 下载所有KYC文件
window.downloadAllFiles = async function(projectId) {
  try {
    showAlert('正在获取文件列表...', 'info');
    
    // 获取所有文件信息
    const response = await axios.get(`/api/investment/projects/${projectId}/listing-files`, {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || '获取文件列表失败');
    }
    
    const { projectCode, files, totalCount } = response.data.data;
    
    if (totalCount === 0) {
      showAlert('没有可下载的文件', 'warning');
      return;
    }
    
    // 确认下载
    if (!confirm(`共有 ${totalCount} 个文件，是否开始下载？\n\n提示：浏览器会逐个下载文件，请允许多个下载请求。`)) {
      return;
    }
    
    showAlert(`开始下载 ${totalCount} 个文件...`, 'info');
    
    // 逐个下载文件
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 检查是否是base64数据URL
        if (file.url.startsWith('data:')) {
          // 处理base64数据URL
          const a = document.createElement('a');
          a.href = file.url;
          a.download = `${projectCode}_${file.name}_${file.originalName}`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          // 处理普通URL
          const a = document.createElement('a');
          a.href = file.url;
          a.download = `${projectCode}_${file.name}_${file.originalName}`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        
        successCount++;
        
        // 延迟避免浏览器阻止多个下载
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('下载文件失败:', file.name, error);
        failCount++;
      }
    }
    
    // 显示结果
    if (failCount === 0) {
      showAlert(`成功触发 ${successCount} 个文件下载！`, 'success');
    } else {
      showAlert(`成功: ${successCount} 个，失败: ${failCount} 个`, 'warning');
    }
    
  } catch (error) {
    console.error('下载文件失败:', error);
    showAlert('下载失败: ' + error.message, 'error');
  }
};

window.handleUploadContract = function(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      showAlert('正在上传协议...', 'info');
      
      // 模拟上传文件
      const uploadResult = await simulateFileUpload(file);
      
      // 保存到数据库
      await API_EXTENDED.uploadContractFile(id, {
        file_name: uploadResult.file_name,
        file_url: uploadResult.file_url,
        file_size: uploadResult.file_size,
        file_type: uploadResult.file_type,
        uploaded_by: STATE.user.userId
      });
      
      showAlert('协议上传成功！', 'success');
      document.getElementById('adminModal')?.remove();
      refreshAdminProjects();
    } catch (error) {
      showAlert('上传失败: ' + error.message, 'error');
    }
  };
  input.click();
};

window.handleConfirmFunding = async function(id) {
  try {
    await API.confirmFunding(id);
    showAlert('出资确认成功！', 'success');
    document.getElementById('adminModal').remove();
    refreshAdminProjects();
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

window.handleDeleteProject = async function(id) {
  if (!confirm('确定要删除这条记录吗？此操作不可恢复。')) return;
  
  try {
    await API.deleteProject(id);
    showAlert('删除成功！', 'success');
    document.getElementById('adminModal').remove();
    refreshAdminProjects();
  } catch (error) {
    showAlert(error.message, 'error');
  }
};



// ==================== 路由注册 ====================
Router.add('/', render10StepForm);
Router.add('/login', renderLoginPage);
Router.add('/dashboard', renderDashboard);
Router.add('/project/:id', renderProjectDetail);
Router.add('/admin/login', renderAdminLoginPage);
Router.add('/admin', renderAdminDashboard);

// 注意：/admin/scoring-config 路由在 app-extended.js 中注册

// ==================== 全局函数导出 ====================
window.loadAdminProjects = refreshAdminProjects;

// ==================== 应用初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  Router.init();
});
