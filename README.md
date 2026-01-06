# Zhijian Platform (智健医疗服务平台)

## 📖 项目简介 (Introduction)

**Zhijian Platform** 是一个全栈式 O2O 医药健康服务平台，旨在打通患者、药店商家、配送骑手与平台管理之间的业务闭环。系统集成了 **AI 智能问诊**、**医药电商**、**即时配送** 以及 **多端协同** 等核心功能，为用户提供便捷的购药与健康咨询服务，同时赋能商家实现数字化经营。

## 🚀 核心功能 (Core Features)

*   **👨‍⚕️ 用户端 (Customer App)**
    *   **AI 智能问诊**：基于大模型 (DeepSeek/OpenAI) 的健康咨询助手。
    *   **医药商城**：药品搜索、分类浏览、购物车、在线支付。
    *   **订单管理**：实时查看订单状态、物流轨迹、评价晒单。
    *   **个人中心**：收货地址管理、我的收藏、电子病历/处方管理。

*   **🏪 商家端 (Merchant App)**
    *   **商品管理**：药品上架、库存管理、价格调整。
    *   **订单处理**：接单、拒绝、发货、退款审核。
    *   **经营报表**：销售数据统计、热销商品分析。
    *   **门店设置**：营业状态切换、店铺信息维护。

*   **🛠 管理端 (Admin Panel)**
    *   **基础数据**：用户管理、商家入驻审核、药品分类管理。
    *   **运营中心**：Banner 轮播图、优惠券/营销活动管理。
    *   **系统监控**：审计日志、系统配置、角色权限控制 (RBAC)。

*   **🛵 骑手端 (Rider App)**
    *   **配送接单**：抢单池、系统派单。
    *   **路径规划**：取货/送货路线导航。
    *   **钱包提现**：配送费结算、收入明细。

## 🛠 技术栈 (Tech Stack)

### Backend (后端)
*   **核心框架**: Java 17, Spring Boot 3
*   **持久层**: MyBatis-Plus, MySQL 8.0
*   **缓存/消息**: Redis, WebSocket (实时消息)
*   **工具**: Knife4j (API 文档), Lombok, Hutool
*   **AI 集成**: DeepSeek / OpenAI API
*   **云服务**: 阿里云 OSS (文件存储)

### Frontend (前端)
*   **构建工具**: Vite, pnpm (Monorepo 架构)
*   **核心库**: React 18, TypeScript
*   **UI 组件库**: 
    *   **用户端/商家端**: Ant Design Mobile / Custom UI
    *   **管理端**: Ant Design Pro Components
*   **样式方案**: TailwindCSS, CSS Modules
*   **跨平台**: Taro (骑手端小程序/App)

## 📂 项目结构 (Project Structure)

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
└── docs/                   # 项目文档与 SQL 脚本
```

## ⚡️ 快速开始 (Quick Start)

### 1. 环境准备
*   JDK 17+
*   Node.js 18+ & pnpm
*   MySQL 8.0
*   Redis

### 2. 后端启动
```bash
cd backend
mvn clean package -DskipTests
java -jar zhijian-start/target/zhijian-start-0.0.1-beta-SNAPSHOT.jar
```
*   服务端口: `8080`
*   API 文档: `http://localhost:8080/doc.html`

### 3. 前端启动
```bash
cd frontend
pnpm install

# 启动用户端 (Port: 3000)
pnpm dev:customer

# 启动商家端 (Port: 3002)
pnpm dev:merchant

# 启动管理端 (Port: 3001)
pnpm dev:admin
```

## � 部署指南 (Deployment)

### 1. 生产环境配置 (Environment Variables)
在生产环境（如宝塔面板）中，建议通过环境变量配置敏感信息，无需修改代码：

| 变量名 | 描述 | 默认值/示例 |
| :--- | :--- | :--- |
| `DB_PASSWORD` | MySQL 数据库密码 | `root` |
| `REDIS_PASSWORD` | Redis 密码 | (空) |
| `OPENAI_API_KEY` | AI 服务 API Key | `sk-...` |
| `ALIYUN_OSS_ACCESS_KEY_ID` | 阿里云 OSS Key ID | - |
| `ALIYUN_OSS_ACCESS_KEY_SECRET` | 阿里云 OSS Secret | - |
| `ALIYUN_SMS_ACCESS_KEY_ID` | 阿里云短信 Key ID | - |
| `ALIYUN_SMS_ACCESS_KEY_SECRET` | 阿里云短信 Secret | - |

### 2. 后端部署 (Backend)
1.  **打包**: 在 `backend` 目录下运行 `mvn clean package -DskipTests`。
2.  **产物**: 获取 `backend/zhijian-start/target/zhijian-start-*.jar`。
3.  **运行**: 上传到服务器，使用命令启动：
    ```bash
    java -jar -Dspring.profiles.active=prod zhijian-backend.jar
    ```

### 3. 前端部署 (Frontend)
1.  **构建**: 在 `frontend` 目录下运行 `npm run build:all`。
2.  **产物**: 
    *   管理端: `deploy/frontend/admin/`
    *   商家端: `deploy/frontend/merchant/`
    *   用户端: `deploy/frontend/customer/`
3.  **托管**: 将生成的静态文件上传到 Nginx/宝塔网站目录即可。

### 4. 骑手端小程序 (Rider App)
*   **平台**: 微信小程序
*   **部署**: 使用 **微信开发者工具** 导入 `frontend/apps/rider` 目录，配置 AppID 后上传审核。
*   **注意**: 需在小程序后台配置服务器域名为您的后端 HTTPS 域名。

## �📝 License
This project is licensed under the MIT License.
