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
    STATE.projects = result.projects;
    
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
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl" onclick="Router.navigate('/')">
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
              <input type="text" name="companyName" required class="w-full px-4 py-2 border rounded-lg">
            </div>
            
            <div>
              <label class="block font-semibold mb-2">商品品类 <span class="text-red-500">*</span></label>
              <select name="category" required class="w-full px-4 py-2 border rounded-lg">
                <option value="">请选择</option>
                <option value="女装">女装</option>
                <option value="男装">男装</option>
                <option value="美妆">美妆</option>
                <option value="食品">食品</option>
                <option value="日用品">日用品</option>
                <option value="母婴">母婴</option>
                <option value="家电">家电</option>
                <option value="家居">家居</option>
                <option value="药品">药品</option>
              </select>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold mb-2">投流ROI (%) <span class="text-red-500">*</span></label>
                <input type="number" step="0.1" name="roi" required class="w-full px-4 py-2 border rounded-lg">
              </div>
              <div>
                <label class="block font-semibold mb-2">退货率 (%) <span class="text-red-500">*</span></label>
                <input type="number" step="0.1" name="returnRate" required class="w-full px-4 py-2 border rounded-lg">
              </div>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold mb-2">净利润率 (%) <span class="text-red-500">*</span></label>
                <input type="number" step="0.1" name="profitRate" required class="w-full px-4 py-2 border rounded-lg">
              </div>
              <div>
                <label class="block font-semibold mb-2">店铺评分 (1-5) <span class="text-red-500">*</span></label>
                <input type="number" step="0.1" min="1" max="5" name="shopScore" required class="w-full px-4 py-2 border rounded-lg">
              </div>
            </div>
            
            <div>
              <label class="block font-semibold mb-2">运营时间 (月) <span class="text-red-500">*</span></label>
              <input type="number" name="operationMonths" required class="w-full px-4 py-2 border rounded-lg">
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
}

window.handleFormSubmit = async function(event) {
  event.preventDefault();
  const form = event.target;
  
  const projectData = {
    step1: { isSameEntity: '是', hasIncomeSharing: '否', fundUsage: '巨量引擎方舟账户广告投放充值' },
    step2: {
      companyName: form.companyName.value,
      creditCode: '91110000123456789X',
      address: '北京市朝阳区',
      productCategory: form.category.value,
      roi: parseFloat(form.roi.value),
      returnRate: parseFloat(form.returnRate.value),
      profitRate: parseFloat(form.profitRate.value),
      shopScore: parseFloat(form.shopScore.value),
      operationMonths: parseInt(form.operationMonths.value),
      businessDescription: '抖音电商店铺运营'
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
    const result = await API.createProject(projectData);
    showAlert('项目提交成功！', 'success');
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
          <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h1 class="text-3xl font-bold">${project.company_name_a || '项目详情'}</h1>
                <p class="text-gray-600 mt-2">提交编号：${project.submission_code}</p>
              </div>
              <div>${getStatusBadge(project.status, project.statusText)}</div>
            </div>
          </div>
          
          ${project.scoring ? `
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6 ${project.scoring.passed ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}">
              <h2 class="text-2xl font-bold mb-4">
                <i class="fas fa-chart-line mr-2"></i>智能评分结果
              </h2>
              <div class="text-center mb-6">
                <div class="text-5xl font-bold mb-2">${project.scoring.total_score} / 100</div>
                <div class="text-xl ${project.scoring.passed ? 'text-green-600' : 'text-red-600'}">
                  ${project.scoring.passed ? '✅ 项目评估通过' : '❌ 项目未通过评估'}
                </div>
              </div>
              <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div class="p-4 bg-gray-50 rounded">
                  <div class="text-sm text-gray-600">ROI评分</div>
                  <div class="text-2xl font-bold">${project.scoring.roi_score} / 25</div>
                </div>
                <div class="p-4 bg-gray-50 rounded">
                  <div class="text-sm text-gray-600">退货率评分</div>
                  <div class="text-2xl font-bold">${project.scoring.return_rate_score} / 25</div>
                </div>
                <div class="p-4 bg-gray-50 rounded">
                  <div class="text-sm text-gray-600">净利润评分</div>
                  <div class="text-2xl font-bold">${project.scoring.profit_score} / 25</div>
                </div>
                <div class="p-4 bg-gray-50 rounded">
                  <div class="text-sm text-gray-600">店铺评分</div>
                  <div class="text-2xl font-bold">${project.scoring.shop_score_value} / 12.5</div>
                </div>
              </div>
              <div class="bg-blue-50 p-4 rounded">
                <p class="text-gray-700">${project.scoring.evaluation_suggestion}</p>
              </div>
            </div>
          ` : ''}
          
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-4"><i class="fas fa-info-circle mr-2"></i>项目信息</h2>
            <div class="space-y-4">
              <div><span class="font-semibold">品类：</span>${project.product_category}</div>
              <div><span class="font-semibold">投流ROI：</span>${project.roi}%</div>
              <div><span class="font-semibold">退货率：</span>${project.return_rate}%</div>
              <div><span class="font-semibold">净利润率：</span>${project.profit_rate}%</div>
              <div><span class="font-semibold">店铺评分：</span>${project.shop_score}分</div>
              <div><span class="font-semibold">运营时间：</span>${project.operation_months}个月</div>
            </div>
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
    Router.navigate('/admin/login');
    return;
  }
  
  try {
    const result = await API.getAllProjects();
    STATE.allProjects = result.projects;
    
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-100">
        <nav class="bg-gray-800 text-white">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold"><i class="fas fa-shield-alt mr-2"></i>后台管理系统</h1>
            <button onclick="logout()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">
              <i class="fas fa-sign-out-alt mr-2"></i>退出
            </button>
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
                  <th class="text-left py-3 px-4">状态</th>
                  <th class="text-left py-3 px-4">创建时间</th>
                  <th class="text-left py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                ${STATE.allProjects.map((p, i) => `
                  <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50">
                    <td class="py-3 px-4 text-sm">${p.submissionCode}</td>
                    <td class="py-3 px-4 font-semibold">${p.projectName || '未命名'}</td>
                    <td class="py-3 px-4">${getStatusBadge(p.status, p.statusText)}</td>
                    <td class="py-3 px-4 text-sm">${p.createdAt}</td>
                    <td class="py-3 px-4">
                      <button onclick="openAdminProjectModal(${p.id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-eye mr-2"></i>查看详情
                      </button>
                    </td>
                  </tr>
                `).join('')}
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
          <div class="bg-gray-50 p-4 rounded">
            <h3 class="font-bold mb-2">基本信息</h3>
            <p><span class="font-semibold">提交编号：</span>${project.submission_code}</p>
            <p><span class="font-semibold">企业名称：</span>${project.company_name_a}</p>
            <p><span class="font-semibold">状态：</span>${getStatusBadge(project.status, project.statusText)}</p>
          </div>
          
          ${!project.scoring ? `
            <div id="scoringSection">
              <button onclick="handleScoreProject(${id})" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-bold">
                <i class="fas fa-calculator mr-2"></i>智能评分
              </button>
            </div>
          ` : `
            <div class="bg-${project.scoring.passed ? 'green' : 'red'}-50 border-2 border-${project.scoring.passed ? 'green' : 'red'}-500 rounded-lg p-6">
              <h3 class="text-2xl font-bold mb-4">智能评分结果</h3>
              <div class="text-center mb-4">
                <div class="text-5xl font-bold">${project.scoring.total_score} / 100</div>
                <div class="text-xl mt-2 ${project.scoring.passed ? 'text-green-600' : 'text-red-600'}">
                  ${project.scoring.passed ? '✅ 项目评估通过' : '❌ 项目未通过评估'}
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>ROI评分：${project.scoring.roi_score} / 25</div>
                <div>退货率评分：${project.scoring.return_rate_score} / 25</div>
                <div>净利润评分：${project.scoring.profit_score} / 25</div>
                <div>店铺评分：${project.scoring.shop_score_value} / 12.5</div>
              </div>
              <button onclick="handleScoreProject(${id})" class="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                <i class="fas fa-redo mr-2"></i>重新评分
              </button>
            </div>
          `}
          
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
              <button onclick="handleUploadContract(${id})" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <i class="fas fa-upload mr-2"></i>上传协议
              </button>
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

window.handleScoreProject = async function(id) {
  try {
    await API.scoreProject(id);
    showAlert('评分成功！', 'success');
    document.getElementById('adminModal').remove();
    refreshAdminProjects();
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

window.handleApprove = async function(id, action) {
  let remark = '';
  if (action === 'reject') {
    remark = prompt('请输入拒绝原因：');
    if (!remark) return;
  }
  
  try {
    await API.approveProject(id, action, remark);
    showAlert(`${action === 'approve' ? '审批通过' : '审批拒绝'}成功！`, 'success');
    document.getElementById('adminModal').remove();
    refreshAdminProjects();
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

window.handleUploadContract = async function(id) {
  try {
    await API.uploadContract(id);
    showAlert('协议上传成功！', 'success');
    document.getElementById('adminModal').remove();
    refreshAdminProjects();
  } catch (error) {
    showAlert(error.message, 'error');
  }
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

// ==================== 应用初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  Router.init();
});
