# 智健 (Zhijian) 后端开发文档

## 1. 项目概述

**智健 (Zhijian)** 是一个基于 **DDD (领域驱动设计)** 架构思想构建的现代化医疗健康电商平台后端系统。项目采用 Spring Boot 3.x 全家桶作为基础框架，集成了 DeepSeek AI 大模型进行智能导诊，使用阿里云 OSS 进行文件存储，并实现了完整的电商交易链路（商品、购物车、订单、支付、售后）。

### 技术栈

- **核心框架**: Spring Boot 3.x
- **ORM 框架**: MyBatis Plus
- **数据库**: MySQL 8.0
- **缓存**: Redis (规划中)
- **AI 集成**: LangChain4j + DeepSeek (OpenAI 兼容协议)
- **文件存储**: Aliyun OSS
- **工具库**: Hutool, Lombok, Knife4j (API 文档)
- **构建工具**: Maven

---

## 2. 项目结构与架构

项目采用 Maven 多模块结构，按照业务领域划分模块，每个模块内部遵循 DDD 分层架构。

### 模块划分

```text
zhijian-system
├── zhijian-start        # 启动模块 (Application入口, 配置文件)
├── zhijian-common       # 公共模块 (工具类, 全局异常, 通用结果, AOP)
├── zhijian-api          # API 接口定义 (Feign Client, DTO)
├── zhijian-user         # 用户/认证模块 (User, Patient, Address, Auth)
├── zhijian-medicine     # 药品/商品模块 (Medicine, Category, Banner)
├── zhijian-order        # 订单模块 (Order, OrderItem, Pay, Refund)
├── zhijian-cart         # 购物车模块
├── zhijian-marketing    # 营销模块 (Coupon)
├── zhijian-ai           # AI 智能导诊模块
├── zhijian-file         # 文件服务模块 (OSS)
├── zhijian-statistics   # 统计报表模块
├── zhijian-delivery     # 配送模块 (Mock)
└── zhijian-aftersales   # 售后模块
```

### DDD 分层架构

每个业务模块（如 `zhijian-order`）内部通常包含以下包结构：

- **interfaces (用户接口层)**:
  - `web`: REST Controllers, 处理 HTTP 请求。
  - `dto`: 数据传输对象。
- **application (应用层)**:
  - `service`: 应用服务接口，编排业务流程。
- **domain (领域层)**:
  - `entity`: 领域实体 (贫血模型/充血模型)。
  - `repository`: 仓储接口定义。
  - `service`: 领域服务 (处理跨实体逻辑)。
- **infrastructure (基础设施层)**:
  - `persistence`: 数据持久化实现 (Mapper, DO)。
  - `client`: 外部服务调用 (Feign)。

---

## 3. 核心模块与 API 说明

### 3.1 用户与认证模块 (`zhijian-user`)

负责用户的注册、登录、身份校验以及患者档案管理。

- **Base URL**: `/auth`, `/api/users`, `/api/patients`, `/api/user-addresses`
- **关键 API**:
  - `POST /auth/login`: 用户登录 (返回 JWT Token)。
  - `POST /auth/register`: 用户注册。
  - `GET /api/users/profile`: 获取当前用户信息。
  - `POST /api/patients`: 添加就诊人（患者）。
  - `GET /api/patients/list`: 获取当前用户的就诊人列表。
  - `POST /api/user-addresses`: 添加收货地址。

### 3.2 药品与商品模块 (`zhijian-medicine`)

管理药品信息、分类以及首页展示内容。

- **Base URL**: `/api/medicines`, `/api/categories`, `/api/home`
- **关键 API**:
  - `GET /api/home/content`: 获取首页聚合数据 (Banner, 推荐商品, 分类)。
  - `GET /api/medicines/list`: 药品列表查询 (支持搜索、分类筛选)。
  - `GET /api/medicines/{id}`: 药品详情。
  - `POST /admin/medicines`: (管理端) 上架/编辑药品。

### 3.3 订单模块 (`zhijian-order`)

处理订单的全生命周期：创建、支付、发货、收货、退款。

- **Base URL**: `/api/orders`
- **关键 API**:
  - `POST /api/orders/create`: 直接购买创建订单。
  - `POST /api/orders/createFromCart`: 从购物车创建订单。
  - `GET /api/orders/list`: 获取我的订单列表。
  - `POST /api/orders/{id}/pay`: **模拟支付** (直接修改订单状态为已支付)。
  - `POST /api/orders/{id}/ship`: (商家端) 订单发货。

### 3.4 AI 智能导诊模块 (`zhijian-ai`)

基于 DeepSeek 大模型提供智能健康咨询服务。

- **Base URL**: `/ai`
- **关键 API**:
  - `POST /ai/chat`: 发送咨询内容，获取 AI 回复。
- **配置**:
  - 模型: DeepSeek Chat (通过 OpenAI 兼容协议接入)。
  - 密钥配置在 `application.yml` 中。

### 3.5 文件服务模块 (`zhijian-file`)

提供统一的文件上传能力，目前对接阿里云 OSS。

- **Base URL**: `/file`
- **关键 API**:
  - `POST /file/upload`: 单文件上传，返回可访问的 URL。

### 3.6 统计模块 (`zhijian-statistics`)

提供管理端的数据看板。

- **Base URL**: `/statistics`
- **关键 API**:
  - `GET /statistics/dashboard`: 获取今日订单数、销售额、新增用户等核心指标。

---

## 4. 关键功能实现细节

### 4.1 认证与鉴权
- 使用 **JWT (JSON Web Token)** 进行无状态认证。
- `UserContext` 上下文工具类：通过 `ThreadLocal` 存储当前请求的用户 ID 和角色，方便在 Service 层直接获取。
- `@AdminCheck` 注解：基于 AOP 实现的简单权限验证，用于保护管理端接口。

### 4.2 支付功能 (Mock)
由于缺乏企业支付资质，系统实现了**模拟支付**流程：
1. 前端调用 `/api/orders/{id}/pay`。
2. 后端校验订单状态。
3. 直接更新数据库中订单状态为 `PAID`，并记录支付时间。
4. 触发支付成功事件（用于后续通知等）。

### 4.3 AI 接入 (DeepSeek)
- 使用 `langchain4j-open-ai` 依赖。
- DeepSeek 支持 OpenAI API 格式，配置 `base-url` 为 `https://api.deepseek.com` 即可无缝切换。
- `AiService` 封装了对话逻辑，支持上下文记忆（当前为单轮对话，可扩展）。

---

## 5. 配置说明 (`application.yml`)

核心配置文件位于 `zhijian-start/src/main/resources/application.yml`。

### 5.1 数据库配置
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/zhijian_db?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: YOUR_PASSWORD # 请修改为实际密码
```

### 5.2 AI 配置 (DeepSeek)
```yaml
zhijian:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}  # 您的 DeepSeek API Key
      base-url: https://api.deepseek.com
```

### 5.3 阿里云 OSS 配置
```yaml
aliyun:
  oss:
    endpoint: oss-cn-shenzhen.aliyuncs.com
    access-key-id: ${ALIYUN_OSS_ACCESS_KEY_ID}
    access-key-secret: ${ALIYUN_OSS_ACCESS_KEY_SECRET}
    bucket-name: ${ALIYUN_OSS_BUCKET_NAME}
```

---

## 6. 构建与运行

### 环境要求
- JDK 17+
- Maven 3.8+
- MySQL 8.0+

### 运行步骤
1. **启动数据库**: 确保 MySQL 运行中，并导入 `docs/zhijian_full_schema.sql` 和 `docs/zhijian_update_schema.sql`。
2. **构建项目**:
   ```bash
   cd backend
   mvn clean install
   ```
3. **启动应用**:
   运行 `zhijian-start` 模块下的 `ZhijianApplication.java`。
4. **访问文档**:
   启动成功后，访问 Knife4j 接口文档：`http://localhost:8080/doc.html`

---
*文档生成日期: 2025-12-29*
