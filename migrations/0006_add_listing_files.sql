-- 添加挂牌信息文件字段
ALTER TABLE listing_info ADD COLUMN file_company_registration TEXT;           -- 企业注册证书+公章
ALTER TABLE listing_info ADD COLUMN file_legal_rep_id TEXT;                  -- 法定代表人身份证件（正反面）
ALTER TABLE listing_info ADD COLUMN file_legal_rep_address_proof TEXT;       -- 法定代表人住址证明
ALTER TABLE listing_info ADD COLUMN file_actual_controller_id TEXT;          -- 实际控制人身份证件（正反面）
ALTER TABLE listing_info ADD COLUMN file_actual_controller_address_proof TEXT; -- 实际控制人住址证明
ALTER TABLE listing_info ADD COLUMN file_actual_controller_proof TEXT;       -- 实控人证明文件+公章
ALTER TABLE listing_info ADD COLUMN file_beneficial_owner_id TEXT;           -- 实益拥有人身份证件（正反面）
ALTER TABLE listing_info ADD COLUMN file_beneficial_owner_address_proof TEXT; -- 实益拥有人住址证明
ALTER TABLE listing_info ADD COLUMN file_condition_1_proof TEXT;             -- 存续时间证明文件
ALTER TABLE listing_info ADD COLUMN file_condition_2_proof TEXT;             -- 营业额证明文件+公章
ALTER TABLE listing_info ADD COLUMN file_revenue_forecast TEXT;              -- 未来12个月预估营业额+公章
ALTER TABLE listing_info ADD COLUMN file_directors_list TEXT;                -- 董事会成员名册+公章
ALTER TABLE listing_info ADD COLUMN file_board_resolution TEXT;              -- 董事會書面決議+公章
ALTER TABLE listing_info ADD COLUMN file_email_authorization TEXT;           -- 电邮申请说明+公章+签名
