# Zhijian System（智健优选）

智健优选是一个多端协同的医药健康服务平台，覆盖用户购药、商家经营、平台运营与骑手配送全流程，并集成 AI 问诊/智能客服与阿里云能力（OSS/短信/OCR）。

## 仓库结构

```
Zhijian-System/
├─ backend/                 后端（Spring Boot + Maven 多模块）
│  ├─ zhijian-start/        启动入口（server.servlet.context-path=/api）
│  ├─ zhijian-user/         用户/商家/入驻/OCR
│  ├─ zhijian-order/        订单/支付
│  ├─ zhijian-medicine/     药品/库存
│  ├─ zhijian-delivery/     配送
│  └─ sql/                  数据库初始化与补丁
├─ frontend/                前端（pnpm monorepo）
│  └─ apps/
│     ├─ customer/          用户端（React + Vite，默认 3000）
│     ├─ merchant/          商家端（React + Vite，默认 3001）
│     ├─ admin/             管理端（React + Vite，默认 3002）
│     └─ rider/             骑手端（Taro）
└─ zhijian_langgraph/       AI 智能体服务（FastAPI + LangGraph）
```

## 快速开始（本地开发）

### 1) 环境准备

- JDK 17+
- Maven 3.9+
- Node.js 18+ / pnpm 9+
- MySQL 8.x
- Redis

### 2) 初始化数据库

- 导入初始化结构与数据：[zhijian_db.sql](file:///e:/Code/Zhijian-System/backend/sql/zhijian_db.sql)
- 若你的数据库已有 `sys_merchant` 表，需要增加身份证相关字段，执行补丁：[20260226_add_sys_merchant_idcard_fields.sql](file:///e:/Code/Zhijian-System/backend/sql/patches/20260226_add_sys_merchant_idcard_fields.sql)

### 3) 启动后端

后端统一 API 前缀为 `/api`（由 `server.servlet.context-path` 提供）。

```bash
cd backend
mvn clean package -DskipTests
java -jar zhijian-start/target/zhijian-start-0.0.1-beta-SNAPSHOT.jar
```

- 后端地址：`http://127.0.0.1:8080/api`
- 接口文档：`http://127.0.0.1:8080/api/doc.html`

### 4) 启动前端

前端使用 Vite 代理 `/api` 到 `http://127.0.0.1:8080`，不需要额外配置即可联调。

```bash
cd frontend
pnpm install

pnpm dev:customer
pnpm dev:merchant
pnpm dev:admin
```

默认端口：
- 用户端：http://127.0.0.1:3000
- 商家端：http://127.0.0.1:3001
- 管理端：http://127.0.0.1:3002

### 5) 启动 AI 智能体服务（可选）

```bash
cd zhijian_langgraph
python -m uvicorn tools_service.app:app --host 127.0.0.1 --port 18080
python -m uvicorn agent.app:app --host 127.0.0.1 --port 18081
```

## 配置（环境变量）

仓库不存放任何真实密钥，请通过环境变量注入（本地可用系统环境变量或运行配置）。

### 数据库与缓存

- `SPRING_DATASOURCE_URL`（示例：`jdbc:mysql://localhost:3306/zhijian_db?...`）
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_DATA_REDIS_HOST`
- `SPRING_DATA_REDIS_PORT`

### AI

- `ZHIJIAN_JWT_SECRET`（建议生产环境显式配置，避免使用默认开发值）
- `OPENAI_API_KEY`（或 DeepSeek 兼容 Key）
- `LANGGRAPH_AGENT_BASE_URL`（默认 `http://127.0.0.1:18081`）

### 阿里云 OSS（文件上传）

- `ALIYUN_OSS_ENDPOINT`
- `ALIYUN_OSS_ACCESS_KEY_ID`
- `ALIYUN_OSS_ACCESS_KEY_SECRET`
- `ALIYUN_OSS_BUCKET_NAME`

### 阿里云短信

- `ALIYUN_SMS_ACCESS_KEY_ID`
- `ALIYUN_SMS_ACCESS_KEY_SECRET`
- `ALIYUN_SMS_SIGN_NAME`
- `ALIYUN_SMS_TEMPLATE_CODE`

### 阿里云 OCR（商家入驻自动填表）

- `ALIYUN_OCR_ENDPOINT`（建议 `ocr-api.cn-hangzhou.aliyuncs.com`）
- `ALIYUN_OCR_ACCESS_KEY_ID`
- `ALIYUN_OCR_ACCESS_KEY_SECRET`
- `ALIYUN_OCR_CONFIDENCE_THRESHOLD`（默认 `0.8`）

商家端入驻页上传后会自动触发 OCR，并弹窗确认回填（营业执照 / 身份证正反面合并）。

## 常用命令

### 后端

```bash
cd backend
mvn -q clean package -DskipTests
```

### 前端

```bash
cd frontend
pnpm lint
pnpm build:all
```

## 安全说明

- 不要把任何 AccessKey/Secret/API Key 写入 yml 或提交到仓库。
- 建议定期轮换密钥，并使用最小权限策略。
