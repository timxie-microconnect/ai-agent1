-- 迁移：为 listing_info 表添加联营协议签署信息字段
-- 对应申请表「8. 联营协议签署信息」和「9. 销售收款账户」「10. 营销推广账户」
-- 使用 ALTER TABLE ADD COLUMN（SQLite 不支持 IF NOT EXISTS，靠应用层容错）

-- 8. 联营协议签署信息
ALTER TABLE listing_info ADD COLUMN company_address TEXT;           -- 融资方住所（营业执照上的地址）
ALTER TABLE listing_info ADD COLUMN business_activity TEXT;         -- 融资方经营业务（如：于抖音平台销售【】品牌相关商品）
ALTER TABLE listing_info ADD COLUMN marketing_platform TEXT;        -- 融资方营销推广账户（抖音账号或店铺名称）
ALTER TABLE listing_info ADD COLUMN signer_name TEXT;               -- 融资方签署人姓名
ALTER TABLE listing_info ADD COLUMN signer_title TEXT;              -- 融资方签署人职务（如：法定代表人、总经理等）
ALTER TABLE listing_info ADD COLUMN contact_source TEXT;            -- 融资方联系人信息来源
ALTER TABLE listing_info ADD COLUMN contact_wechat TEXT;            -- 融资方联系人微信号

-- 对公账户补充字段（原 projects 表已有 bank_name/bank_account，这里补充签署专用对公账户）
ALTER TABLE listing_info ADD COLUMN bank_account_name TEXT;         -- 对公账户-户名
ALTER TABLE listing_info ADD COLUMN bank_account_number TEXT;       -- 对公账户-账号
ALTER TABLE listing_info ADD COLUMN bank_name TEXT;                 -- 对公账户-开户行
ALTER TABLE listing_info ADD COLUMN bank_branch TEXT;               -- 对公账户-开户支行

-- 9. 销售收款账户（JSON数组，存储多条）
ALTER TABLE listing_info ADD COLUMN sales_accounts TEXT;            -- 销售收款账户列表（JSON）

-- 10. 营销推广账户（JSON数组，存储多条）
ALTER TABLE listing_info ADD COLUMN marketing_accounts TEXT;        -- 营销推广账户列表（JSON）
