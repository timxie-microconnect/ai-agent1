// 滴灌投资信息收集系统 - 完整前端应用

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
          <h1 class="text-3xl font-bold text-gray-800">滴灌投资</h1>
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
            <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-seedling text-blue-600 mr-2"></i>滴灌投资</h1>
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
          <h1 class="text-3xl font-bold mb-2">滴灌投资信息收集系统</h1>
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
      businessDescription: '抖店投流垫资业务'
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
          <p class="text-gray-600 mt-2">滴灌投资后台管理系统</p>
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
              <button onclick="renderScoringConfigPage()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
                <i class="fas fa-sliders-h mr-2"></i>筛子配置
              </button>
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
              <div class="bg-green-50 p-4 rounded mb-4">
                <p class="text-green-700 font-semibold"><i class="fas fa-check-circle mr-2"></i>项目已通过审批</p>
              </div>
              <div class="flex gap-4">
                <button onclick="navigateToInvestmentPlan(${id})" class="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-bold">
                  <i class="fas fa-chart-line mr-2"></i>设计投资方案
                </button>
                <button onclick="handleUploadContract(${id})" class="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i class="fas fa-upload mr-2"></i>上传协议
                </button>
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
