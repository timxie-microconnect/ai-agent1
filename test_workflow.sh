#!/bin/bash
# 滴灌投资系统工作流测试脚本

echo "=========================================="
echo "滴灌投资信息收集系统 - 工作流测试"
echo "=========================================="
echo ""

# 1. 用户登录
echo "1. 用户登录..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}')
USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.token')
echo "✓ 用户登录成功"
echo ""

# 2. 提交项目
echo "2. 提交新项目..."
PROJECT_DATA='{
  "step1": {"isSameEntity": "是", "hasIncomeSharing": "否", "fundUsage": "巨量引擎方舟账户广告投放充值"},
  "step2": {
    "companyName": "测试美妆店铺",
    "creditCode": "91110000123456789X",
    "address": "北京市朝阳区",
    "productCategory": "美妆",
    "roi": 2.2,
    "returnRate": 28,
    "profitRate": 22,
    "shopScore": 4.5,
    "operationMonths": 12,
    "businessDescription": "抖音美妆店铺运营"
  },
  "step3": {},
  "step4": [{"entityType": "主体A", "name": "张三", "idType": "身份证", "idNumber": "110101199001011234"}],
  "step5": [{"name": "李四", "idType": "身份证", "idNumber": "110101198001011234", "shareholding": 100}],
  "step6": {"contactName": "张三", "contactPhone": "13800138000", "contactEmail": "test@example.com"},
  "step7": {"bankName": "中国银行", "bankAccount": "6217000012345678", "invoiceType": "增值税专用发票", "taxId": "91110000123456789X"},
  "step8": [{"platformName": "抖音", "accountDescription": "官方店铺", "hasQianchuan": "是"}],
  "step9": {
    "totalAmount": 1000, "batchCount": 1, "batchAmount": 1000, "firstAmount": 1000,
    "subsequentAmount": 0, "roiTarget": 1.5, "roiRecoveryDays": 30, "roiMaintainDays": 30,
    "profitShare": 50, "annualRate": 18, "repaymentFrequency": "每月", "repaymentRules": "每月15日还款"
  }
}'

PROJECT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "$PROJECT_DATA")
PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.projectId')
SUBMISSION_CODE=$(echo $PROJECT_RESPONSE | jq -r '.submissionCode')
echo "✓ 项目提交成功"
echo "  项目ID: $PROJECT_ID"
echo "  提交编号: $SUBMISSION_CODE"
echo ""

# 3. 管理员登录
echo "3. 管理员登录..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token')
echo "✓ 管理员登录成功"
echo ""

# 4. 智能评分
echo "4. 执行智能评分..."
SCORE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
TOTAL_SCORE=$(echo $SCORE_RESPONSE | jq -r '.scoring.totalScore')
PASSED=$(echo $SCORE_RESPONSE | jq -r '.scoring.passed')
echo "✓ 评分完成"
echo "  总分: $TOTAL_SCORE / 100"
echo "  结果: $([ "$PASSED" = "true" ] && echo "✅ 通过" || echo "❌ 未通过")"
echo ""

# 5. 审批通过
echo "5. 审批通过..."
APPROVE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"action":"approve"}')
echo "✓ 审批通过"
echo ""

# 6. 上传协议
echo "6. 上传协议..."
CONTRACT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/upload-contract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "✓ 协议已上传"
echo ""

# 7. 确认出资
echo "7. 确认出资..."
FUNDING_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/confirm-funding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "✓ 出资已确认"
echo ""

# 8. 查看最终状态
echo "8. 查看项目最终状态..."
FINAL_STATUS=$(curl -s -X GET http://localhost:3000/api/admin/projects/$PROJECT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.project.status')
echo "✓ 项目状态: $FINAL_STATUS"
echo ""

echo "=========================================="
echo "✅ 工作流测试完成！"
echo "=========================================="
echo ""
echo "测试结果："
echo "- 项目ID: $PROJECT_ID"
echo "- 提交编号: $SUBMISSION_CODE"
echo "- 评分: $TOTAL_SCORE / 100"
echo "- 评估: $([ "$PASSED" = "true" ] && echo "通过" || echo "未通过")"
echo "- 最终状态: $FINAL_STATUS"
