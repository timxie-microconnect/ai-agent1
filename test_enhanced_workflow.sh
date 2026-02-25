#!/bin/bash

echo "========== 测试增强的智能评分和审批流程 =========="

# 1. 管理员登录
echo -e "\n1. 管理员登录..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')
echo "Admin Token: ${ADMIN_TOKEN:0:20}..."

# 2. 获取评分配置
echo -e "\n2. 获取评分配置（美妆品类）..."
curl -s -X GET http://localhost:3000/api/admin/scoring-config/美妆 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data | length'

# 3. 用户登录
echo -e "\n3. 用户登录..."
USER_TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}' | jq -r '.token')
echo "User Token: ${USER_TOKEN:0:20}..."

# 4. 提交新项目（美妆品类，设计评分60分以上）
echo -e "\n4. 提交新项目（美妆品类，优秀项目）..."
PROJECT_DATA=$(cat <<JSON
{
  "step1": {"relationship": "本企业"},
  "step2": {
    "companyName": "测试美妆公司",
    "creditCode": "123456789012345678",
    "productCategory": "美妆",
    "roi": 2.5,
    "returnRate": 25,
    "profitRate": 22,
    "shopScore": 4.8,
    "operationMonths": 18
  },
  "step3": {},
  "step4": [{"name": "张三", "idNumber": "110101199001011234"}],
  "step5": [{"name": "李四", "idNumber": "110101198001011234"}],
  "step6": {"contactName": "王五", "contactPhone": "13800138000"},
  "step7": {"bankName": "工商银行", "bankAccount": "123456789"},
  "step8": [{"platformName": "淘宝"}],
  "step9": {"totalAmount": 50}
}
JSON
)

PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PROJECT_DATA" | jq -r '.projectId')
echo "创建项目ID: $PROJECT_ID"

# 5. 管理员进行智能评分（使用动态评分API）
echo -e "\n5. 管理员进行智能评分（动态配置评分）..."
SCORE_RESULT=$(curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/score-dynamic \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")
echo "$SCORE_RESULT" | jq '{totalScore, passed, autoRejected, suggestion}'

# 6. 创建尽调checklist
echo -e "\n6. 创建尽调checklist..."
curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/create-checklist \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# 7. 获取checklist
echo -e "\n7. 获取尽调checklist..."
curl -s -X GET http://localhost:3000/api/admin/projects/$PROJECT_ID/checklist \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.checklist | length'

# 8. 模拟上传尽调文件
echo -e "\n8. 上传尽调文件..."
CHECKLIST_ID=$(curl -s -X GET http://localhost:3000/api/admin/projects/$PROJECT_ID/checklist \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.checklist[0].id')

curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/upload-dd-file \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"checklist_id\": $CHECKLIST_ID,
    \"file_category\": \"credit\",
    \"file_name\": \"营业执照.pdf\",
    \"file_url\": \"https://example.com/files/license.pdf\",
    \"file_size\": 102400,
    \"file_type\": \"application/pdf\",
    \"uploaded_by\": 1
  }" | jq .

# 9. 审批通过
echo -e "\n9. 审批通过..."
curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve","remark":"尽调完成"}' | jq .

# 10. 上传协议文件
echo -e "\n10. 上传协议文件..."
curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/upload-contract \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "投资协议.pdf",
    "file_url": "https://example.com/files/contract.pdf",
    "file_size": 204800,
    "file_type": "application/pdf",
    "uploaded_by": 1
  }' | jq .

# 11. 查看协议文件列表
echo -e "\n11. 查看协议文件列表..."
curl -s -X GET http://localhost:3000/api/admin/projects/$PROJECT_ID/contracts \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.files | length'

# 12. 确认出资
echo -e "\n12. 确认出资..."
curl -s -X POST http://localhost:3000/api/admin/projects/$PROJECT_ID/confirm-funding \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# 13. 最终状态
echo -e "\n13. 查看最终状态..."
curl -s -X GET http://localhost:3000/api/admin/projects/$PROJECT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{status: .project.status, statusText: .project.statusText}'

echo -e "\n========== 测试低分自动拒绝流程 =========="

# 14. 提交低分项目
echo -e "\n14. 提交低分项目（ROI低于阈值）..."
LOW_SCORE_DATA=$(cat <<JSON
{
  "step1": {"relationship": "本企业"},
  "step2": {
    "companyName": "低分测试公司",
    "creditCode": "123456789012345679",
    "productCategory": "美妆",
    "roi": 0.8,
    "returnRate": 45,
    "profitRate": 8,
    "shopScore": 3.2,
    "operationMonths": 3
  },
  "step3": {},
  "step4": [{"name": "赵六", "idNumber": "110101199101011234"}],
  "step5": [{"name": "孙七", "idNumber": "110101198101011234"}],
  "step6": {"contactName": "周八", "contactPhone": "13900139000"},
  "step7": {"bankName": "建设银行", "bankAccount": "987654321"},
  "step8": [{"platformName": "京东"}],
  "step9": {"totalAmount": 10}
}
JSON
)

LOW_PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$LOW_SCORE_DATA" | jq -r '.projectId')
echo "创建低分项目ID: $LOW_PROJECT_ID"

# 15. 智能评分（应该自动拒绝）
echo -e "\n15. 对低分项目进行智能评分..."
LOW_SCORE_RESULT=$(curl -s -X POST http://localhost:3000/api/admin/projects/$LOW_PROJECT_ID/score-dynamic \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")
echo "$LOW_SCORE_RESULT" | jq '{totalScore, passed, autoRejected, suggestion}'

# 16. 查看低分项目最终状态
echo -e "\n16. 查看低分项目最终状态（应为rejected）..."
curl -s -X GET http://localhost:3000/api/admin/projects/$LOW_PROJECT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{status: .project.status, statusText: .project.statusText}'

echo -e "\n========== 测试完成 =========="
