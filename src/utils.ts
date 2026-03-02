// 工具函数

// 生成唯一的提交编号
export function generateSubmissionCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DGT${timestamp}${random}`;
}

// 格式化日期时间
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取状态显示文本
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '待审核',
    'scoring': '评分中',
    'approved': '已通过',
    'rejected': '已拒绝',
    'contract_uploaded': '协议已上传',
    'funded': '已放款'
  };
  return statusMap[status] || status;
}

// 获取状态颜色
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'pending': 'gray',
    'scoring': 'blue',
    'approved': 'green',
    'rejected': 'red',
    'contract_uploaded': 'yellow',
    'funded': 'purple'
  };
  return colorMap[status] || 'gray';
}

// 简单的JWT生成（仅用于演示，生产环境需要更安全的实现）
export function createSimpleToken(userId: number, username: string): string {
  const payload = JSON.stringify({ userId, username, exp: Date.now() + 24 * 60 * 60 * 1000 });
  return btoa(payload);
}

export function verifySimpleToken(token: string): { userId: number; username: string } | null {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      return null;
    }
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}
