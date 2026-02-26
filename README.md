# Zhijian System (智健优选医疗服务平台)

## 项目概览
智健优选是一个多端协同的医药健康服务平台，覆盖用户购药、商家经营、平台运营与骑手配送全流程，融合 AI 问诊与智能客服能力，支持线上医药电商与即时配送的闭环业务。

## 核心功能
* **用户端**：AI 问诊、药品搜索、购物车与支付、订单追踪、个人中心
* **商家端**：商品与库存管理、订单处理、退款审核、经营数据统计
* **管理端**：商家入驻审核、用户管理、内容与活动运营、权限与审计
* **骑手端**：抢单派单、路线导航、配送结算

## 技术栈
* **后端**：Java 17、Spring Boot 3、MyBatis-Plus、MySQL 8、Redis、WebSocket
* **前端**：React 18、TypeScript、Vite、pnpm、TailwindCSS
* **小程序/跨端**：Taro
* **AI 服务**：DeepSeek/OpenAI API + LangGraph
* **云服务**：阿里云 OSS、阿里云短信

## 目录结构
```
Zhijian-System/
├── backend/                # 后端工程 (Maven 多模块)
│   ├── zhijian-start       # 启动入口 & 全局配置
│   ├── zhijian-user        # 用户与权限模块
│   ├── zhijian-medicine    # 药品与库存模块
│   ├── zhijian-order       # 订单与支付模块
│   ├── zhijian-delivery    # 配送模块
│   └── ...
├── frontend/               # 前端工程 (pnpm Monorepo)
│   ├── apps/
│   │   ├── customer        # 用户端 (React + Vite)
│   │   ├── merchant        # 商家端 (React + Vite)
│   │   ├── admin           # 管理端 (React + Vite)
│   │   └── rider           # 骑手端 (Taro)
│   └── ...
├── zhijian_langgraph/      # AI 智能体服务 (FastAPI + LangGraph)
└── docs/                   # 项目文档与 SQL 脚本
```

## 快速开始
### 1. 环境准备
* JDK 17+
* Node.js 18+ 与 pnpm
* MySQL 8.0
* Redis

### 2. 后端启动
```bash
cd backend
mvn clean package -DskipTests
java -jar zhijian-start/target/zhijian-start-0.0.1-beta-SNAPSHOT.jar
```
* 服务端口：`8080`
* API 文档：`http://localhost:8080/doc.html`

### 3. 前端启动
```bash
cd frontend
pnpm install

pnpm dev:customer  # 用户端 3000
pnpm dev:merchant  # 商家端 3002
pnpm dev:admin     # 管理端 3001
```

### 4. AI 智能体服务启动
```bash
cd zhijian_langgraph
python -m uvicorn tools_service.app:app --host 127.0.0.1 --port 18080
python -m uvicorn agent.app:app --host 127.0.0.1 --port 18081
```

## 配置说明
### 1. 环境变量
| 变量名 | 描述 | 示例 |
| :--- | :--- | :--- |
| `DB_PASSWORD` | MySQL 密码 | `root` |
| `REDIS_PASSWORD` | Redis 密码 | (空) |
| `OPENAI_API_KEY` | AI 服务 API Key | `sk-...` |
| `LANGGRAPH_AGENT_BASE_URL` | AI 智能体服务地址 | `http://127.0.0.1:18081` |
| `ALIYUN_OSS_ACCESS_KEY_ID` | OSS Key ID | - |
| `ALIYUN_OSS_ACCESS_KEY_SECRET` | OSS Secret | - |
| `ALIYUN_SMS_ACCESS_KEY_ID` | 短信 Key ID | - |
| `ALIYUN_SMS_ACCESS_KEY_SECRET` | 短信 Secret | - |
| `ALIYUN_SMS_SIGN_NAME` | 短信签名 | - |
| `ALIYUN_SMS_TEMPLATE_CODE` | 短信模板 Code | - |

### 2. 短信验证码说明
当前短信验证码采用阿里云号码认证服务的系统模板，模板变量使用 `code` 与 `min`，请确保模板与签名为同一账号下的已审核配置。

## 部署指南
### 1. 后端部署
1. 在 `backend` 目录执行 `mvn clean package -DskipTests`
2. 运行：
```bash
java -jar -Dspring.profiles.active=prod zhijian-backend.jar
```

### 2. 前端部署
1. 在 `frontend` 目录执行 `pnpm build:all`
2. 产物目录：
* 管理端：`deploy/frontend/admin/`
* 商家端：`deploy/frontend/merchant/`
* 用户端：`deploy/frontend/customer/`

### 3. 骑手端小程序
* 使用微信开发者工具导入 `frontend/apps/rider`
* 配置 AppID 后上传审核
* 在小程序后台配置后端 HTTPS 域名

## License
This project is licensed under the MIT License.
