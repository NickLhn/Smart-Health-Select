# Smart-Health-Select 技术架构文档

> **智健优选** - 多端协同的医药健康服务平台
> 
> 生成日期: 2026-03-16

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构总览](#2-系统架构总览)
3. [后端架构](#3-后端架构)
4. [前端架构](#4-前端架构)
5. [AI智能体架构](#5-ai智能体架构)
6. [数据库设计](#6-数据库设计)
7. [部署架构](#7-部署架构)
8. [技术选型说明](#8-技术选型说明)
9. [安全设计](#9-安全设计)

---

## 1. 项目概述

### 1.1 项目简介

**智健优选** 是一个覆盖多端协同的医药健康服务平台，涵盖：

- **用户端** - 购药、问诊、订单管理
- **商家端** - 店铺经营、商品管理、订单处理
- **管理端** - 平台运营、商家审核、数据监控
- **骑手端** - 配送管理
- **AI智能客服** - 智能问诊、订单咨询、售后服务

### 1.2 核心业务域

| 业务域 | 描述 |
|--------|------|
| 用户域 | 用户注册/登录、地址管理、个人信息 |
| 商家域 | 商家入驻、资质审核、店铺管理 |
| 商品域 | 药品管理、库存管理、分类管理 |
| 订单域 | 购物车、下单、支付、订单状态流转 |
| 配送域 | 配送调度、骑手管理、物流追踪 |
| 售后域 | 退款/退货申请、审核、打款 |
| 营销域 | 优惠券、促销活动 |
| AI域 | 智能问诊、智能客服、商家助手 |

---

## 2. 系统架构总览

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              前端层 (Frontend)                               │
├──────────────┬──────────────┬──────────────┬────────────────────────────────┤
│   用户端      │   商家端      │   管理端      │           骑手端               │
│   (React)    │   (React)    │   (React)    │         (Taro小程序)           │
│   Port:3000  │   Port:3001  │   Port:3002  │                                │
└──────┬───────┴──────┬───────┴──────┬───────┴────────────────┬───────────────┘
       │              │              │                        │
       └──────────────┴──────┬───────┴────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────────┐
│                      API网关层 (API Gateway)                                  │
│                          ┌─┴─┐                                              │
│                          │Nginx│ 反向代理、负载均衡                           │
│                          └───┘                                              │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────────┐
│                      业务服务层 (Backend Services)                            │
│                         ┌──┴──┐                                             │
│                         │Spring│  Boot 3.2 + Java 17                         │
│                         │ Boot │  Port: 8080                                 │
│                         └──┬──┘                                             │
│    ┌──────────┬───────────┼───────────┬──────────┬──────────┐                │
│    │          │           │           │          │          │                │
│ ┌──┴──┐   ┌───┴───┐   ┌───┴───┐   ┌───┴───┐ ┌──┴──┐   ┌───┴───┐            │
│ │用户模块│   │药品模块│   │订单模块│   │购物车 │ │营销模块│   │文件模块│            │
│ │zhijian│   │zhijian│   │zhijian│   │zhijian│ │zhijian│   │zhijian│            │
│ │ -user │   │-medicine│  │-order │   │ -cart │ │-marketing│  │ -file │            │
│ └───────┘   └───────┘   └───────┘   └───────┘ └───────┘   └───────┘            │
│ ┌──────────┬──────────┬──────────┬──────────┐                                  │
│ │ 配送模块  │ 售后模块  │ AI模块    │ 消息模块  │                                  │
│ │zhijian-  │zhijian-  │zhijian-  │zhijian-  │                                  │
│ │delivery │aftersales│   -ai    │-message  │                                  │
│ └──────────┴──────────┴──────────┴──────────┘                                  │
└────────────────────────────┬──────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────────────────┐
│                      AI智能体层 (AI Agent)                                    │
│                    ┌───────┴───────┐                                          │
│                    │  FastAPI      │  Port: 18080/18081                         │
│                    │  LangGraph    │  Python 3.x                                │
│                    └───────┬───────┘                                          │
│    ┌───────────────────────┼───────────────────────┐                          │
│    │                       │                       │                          │
│ ┌──┴──┐              ┌────┴────┐            ┌────┴────┐                       │
│ │用户端 │              │ 商家端   │            │ 管理端   │                       │
│ │Graph │              │ Graph   │            │ Graph   │                       │
│ └─────┘              └─────────┘            └─────────┘                       │
└───────────────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴──────────────────────────────────────────────────┐
│                      数据存储层 (Data Layer)                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   MySQL     │  │   Redis     │  │  阿里云OSS  │  │    外部AI服务        │   │
│  │  主数据库    │  │   缓存      │  │   文件存储  │  │  (OpenAI/DeepSeek)  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 服务调用关系

```
                    ┌──────────────────┐
                    │     前端应用      │
                    │ (Customer/Merchant│
                    │  Admin/Rider)    │
                    └────────┬─────────┘
                             │ HTTP/REST
                             ▼
                    ┌──────────────────┐
                    │   Backend API    │
                    │   (Spring Boot)  │
                    │    Port: 8080    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │   MySQL  │   │  Redis   │   │ AI Agent │
       │  主数据   │   │  缓存会话 │   │ 18080/81 │
       └──────────┘   └──────────┘   └────┬─────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
                     ▼                    ▼                    ▼
              ┌──────────┐        ┌──────────┐        ┌──────────┐
              │ 用户端AI  │        │ 商家端AI  │        │ 管理端AI  │
              │  Graph   │        │  Graph   │        │  Graph   │
              └──────────┘        └──────────┘        └──────────┘
```

---

## 3. 后端架构

### 3.1 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 17 | 开发语言 |
| Spring Boot | 3.2.1 | 基础框架 |
| Maven | 3.9+ | 构建工具 |
| MyBatis-Plus | 3.5.5 | ORM框架 |
| MySQL | 8.x | 关系型数据库 |
| Redis | 5.x+ | 缓存与会话 |
| JWT | 0.11.5 | 身份认证 |
| Knife4j | 4.3.0 | API文档 |
| Hutool | 5.8.25 | 工具库 |
| LangChain4j | 0.25.0 | AI集成 |

### 3.2 模块划分

```
backend/
├── pom.xml                      # 父POM，依赖管理
├── zhijian-start/               # 启动模块
│   └── 统一入口，context-path=/api
├── zhijian-common/              # 公共模块
│   ├── 工具类
│   ├── 通用DTO
│   └── 常量定义
├── zhijian-user/                # 用户模块
│   ├── 用户注册/登录
│   ├── 商家入驻
│   └── 地址管理
├── zhijian-medicine/            # 药品模块
│   ├── 药品管理
│   ├── 库存管理
│   └── 分类管理
├── zhijian-order/               # 订单模块
│   ├── 订单创建
│   ├── 订单状态流转
│   └── 支付处理
├── zhijian-cart/                # 购物车模块
├── zhijian-marketing/           # 营销模块
│   ├── 优惠券
│   └── 促销活动
├── zhijian-file/                # 文件模块
│   └── 阿里云OSS集成
├── zhijian-delivery/            # 配送模块
├── zhijian-aftersales/          # 售后模块
│   ├── 退款申请
│   └── 审核处理
├── zhijian-ai/                  # AI模块
│   └── LangChain4j集成
├── zhijian-message/             # 消息模块
└── zhijian-statistics/          # 统计模块
```

### 3.3 核心依赖版本

```xml
<properties>
    <java.version>17</java.version>
    <mybatis-plus.version>3.5.5</mybatis-plus.version>
    <knife4j.version>4.3.0</knife4j.version>
    <hutool.version>5.8.25</hutool.version>
    <jjwt.version>0.11.5</jjwt.version>
    <langchain4j.version>0.25.0</langchain4j.version>
    <aliyun-oss.version>3.17.4</aliyun-oss.version>
    <aliyun-ocr-api.version>3.1.3</aliyun-ocr-api.version>
</properties>
```

### 3.4 API 设计规范

- **基础路径**: `/api`
- **认证方式**: JWT Bearer Token
- **响应格式**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {}
  }
  ```
- **API文档**: Knife4j (Swagger增强版)
  - 访问地址: `http://localhost:8080/api/doc.html`

---

## 4. 前端架构

### 4.1 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| pnpm | 9.0.0 | 包管理器 |
| TypeScript | 5.2.2 | 开发语言 |
| React | 18.2.0 | UI框架 |
| Vite | 5.0.0 | 构建工具 |
| Ant Design | 5.12.0 | UI组件库 |
| TailwindCSS | 3.3.0 | CSS框架 |
| React Router | 6.20.0 | 路由管理 |
| Axios | 1.6.2 | HTTP客户端 |
| Taro | 3.6.19 | 小程序框架(骑手端) |

### 4.2 项目结构

```
frontend/
├── package.json                 # 根package.json
├── pnpm-workspace.yaml          # pnpm工作区配置
├── pnpm-lock.yaml
├── apps/                        # 应用目录
│   ├── customer/                # 用户端
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   ├── merchant/                # 商家端
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   ├── admin/                   # 管理端
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   └── rider/                   # 骑手端(小程序)
│       ├── package.json
│       └── src/
└── scripts/                     # 脚本目录
    └── start-all.ps1
```

### 4.3 多应用配置

每个应用独立配置，共享pnpm workspace:

```json
// frontend/package.json
{
  "name": "zhijian-frontend",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev:customer": "pnpm --filter @zhijian/customer dev",
    "dev:merchant": "pnpm --filter @zhijian/merchant dev",
    "dev:admin": "pnpm --filter @zhijian/admin dev",
    "dev:rider": "pnpm --filter @zhijian/rider dev",
    "build:all": "pnpm -r build"
  }
}
```

### 4.4 Vite代理配置

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      }
    }
  }
})
```

### 4.5 端口分配

| 应用 | 端口 | 访问地址 |
|------|------|----------|
| 用户端 | 3000 | http://localhost:3000 |
| 商家端 | 3001 | http://localhost:3001 |
| 管理端 | 3002 | http://localhost:3002 |
| 后端API | 8080 | http://localhost:8080/api |

---

## 5. AI智能体架构

### 5.1 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.x | 开发语言 |
| FastAPI | 0.115.6 | Web框架 |
| Uvicorn | 0.34.0 | ASGI服务器 |
| LangGraph | 1.x | 智能体工作流 |
| PyMySQL | 1.1.1 | 数据库连接 |
| Redis | 5.2.1 | 会话存储 |
| PyJWT | 2.10.1 | 认证 |
| httpx | 0.28.1 | HTTP客户端 |

### 5.2 服务架构

```
zhijian_langgraph/
├── tools_service/               # 工具服务 (Port: 18080)
│   ├── app.py                   # FastAPI入口
│   ├── auth.py                  # 认证逻辑
│   ├── db.py                    # 数据库连接
│   ├── repository.py            # 数据访问层
│   ├── formatters.py            # 数据格式化
│   └── settings.py              # 配置管理
├── agent/                       # 智能体服务 (Port: 18081)
│   ├── app.py                   # FastAPI入口
│   ├── graph/                   # 用户端Graph
│   │   ├── builder.py           # Graph构建器
│   │   ├── router.py            # 意图路由
│   │   ├── states.py            # 状态定义
│   │   ├── nodes/               # 节点实现
│   │   │   ├── intent.py        # 意图识别
│   │   │   ├── normalize.py     # 输入规范化
│   │   │   ├── order.py         # 订单节点
│   │   │   ├── refund.py        # 退款节点
│   │   │   ├── shipping.py      # 物流节点
│   │   │   ├── medical.py       # 问诊节点
│   │   │   ├── medicine.py      # 药品节点
│   │   │   └── purchase.py      # 购买节点
│   │   └── formatters/          # 格式化器
│   ├── admin/                   # 管理端Graph
│   │   ├── builder.py
│   │   ├── router.py
│   │   └── nodes/
│   ├── merchant/                # 商家端Graph
│   ├── admin_graph.py           # 管理端图构建
│   ├── merchant_graph.py        # 商家端图构建
│   ├── memory.py                # 会话管理
│   └── settings.py
└── langgraph.json               # LangGraph配置
```

### 5.3 Graph 工作流

#### 用户端 Graph

```
                    ┌──────────────┐
                    │    START     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │normalize_input│ 输入规范化
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │handle_pending │ 处理待办
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │ ORDER   │  │ REFUND  │  │SHIPPING │
        │ 订单流   │  │ 退款流   │  │ 物流流   │
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
        ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
        │ MEDICAL │  │ MEDICINE│  │PURCHASE │
        │ 问诊流   │  │ 药品流   │  │ 购买流   │
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
             └────────────┼────────────┘
                          │
                          ▼
                    ┌──────────────┐
                    │     END      │
                    └──────────────┘
```

### 5.4 意图识别

系统支持7种意图类型:

| 意图 | 描述 |
|------|------|
| ORDER | 订单相关查询 |
| REFUND | 退款/售后相关 |
| SHIPPING | 物流/配送相关 |
| MEDICAL | 医疗问诊相关 |
| MEDICINE | 药品查询相关 |
| PURCHASE | 购买/加购相关 |
| OTHER | 其他问题 |

### 5.5 状态管理

```python
class GraphState(TypedDict):
    message: str              # 用户消息
    token: str                # 认证token
    request_id: str           # 请求追踪ID
    intent: Intent            # 识别出的意图
    pending_action: str       # 待处理动作
    candidates: list          # 候选项列表
    order_no: str             # 订单号
    purchase_draft: dict      # 购买草稿
    last_medicine_id: int     # 最后操作药品ID
    reply: str                # 回复内容
    cards: list               # 卡片数据
    action: dict              # 前端动作
```

---

## 6. 数据库设计

### 6.1 数据库选型

| 存储 | 用途 |
|------|------|
| MySQL 8.x | 主数据库，存储业务数据 |
| Redis | 会话缓存、Token存储 |

### 6.2 核心表结构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户域                                │
├─────────────────────────────────────────────────────────────┤
│ sys_user              用户表                                │
│ sys_merchant          商家信息表                             │
│ sys_user_address      用户地址表                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        商品域                                │
├─────────────────────────────────────────────────────────────┤
│ pms_medicine          药品表                                │
│ pms_category          分类表                                │
│ pms_medicine_stock    库存表                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        订单域                                │
├─────────────────────────────────────────────────────────────┤
│ oms_order             订单主表                               │
│ oms_order_item        订单商品表                             │
│ oms_cart_item         购物车表                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        售后域                                │
├─────────────────────────────────────────────────────────────┤
│ oms_refund_apply      退款申请表                             │
│ oms_refund_payment    退款支付表                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        配送域                                │
├─────────────────────────────────────────────────────────────┤
│ oms_delivery          配送表                                │
│ oms_delivery_log      配送日志表                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        营销域                                │
├─────────────────────────────────────────────────────────────┤
│ sms_coupon            优惠券表                               │
│ sms_coupon_history    优惠券使用记录                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 部署架构

### 7.1 开发环境启动

```bash
# 1. 启动后端
cd backend
mvn clean package -DskipTests
java -jar zhijian-start/target/zhijian-start-0.0.1-beta-SNAPSHOT.jar

# 2. 启动前端
cd frontend
pnpm install
pnpm dev:customer  # 用户端
pnpm dev:merchant  # 商家端
pnpm dev:admin     # 管理端

# 3. 启动AI服务
cd zhijian_langgraph
python -m uvicorn tools_service.app:app --host 127.0.0.1 --port 18080
python -m uvicorn agent.app:app --host 127.0.0.1 --port 18081
```

### 7.2 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Backend API | 8080 | Spring Boot 主服务 |
| Customer UI | 3000 | 用户端前端 |
| Merchant UI | 3001 | 商家端前端 |
| Admin UI | 3002 | 管理端前端 |
| Tools Service | 18080 | AI工具服务 |
| Agent Service | 18081 | AI智能体服务 |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |

### 7.3 环境变量

```bash
# 数据库
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/zhijian_db
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=xxx

# Redis
SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379

# AI
OPENAI_API_KEY=sk-xxx
LANGGRAPH_AGENT_BASE_URL=http://127.0.0.1:18081

# 阿里云OSS
ALIYUN_OSS_ENDPOINT=xxx
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_BUCKET_NAME=xxx

# 阿里云短信
ALIYUN_SMS_ACCESS_KEY_ID=xxx
ALIYUN_SMS_ACCESS_KEY_SECRET=xxx
ALIYUN_SMS_SIGN_NAME=xxx
ALIYUN_SMS_TEMPLATE_CODE=xxx

# 阿里云OCR
ALIYUN_OCR_ENDPOINT=ocr-api.cn-hangzhou.aliyuncs.com
ALIYUN_OCR_ACCESS_KEY_ID=xxx
ALIYUN_OCR_ACCESS_KEY_SECRET=xxx
```

---

## 8. 技术选型说明

### 8.1 为什么选择这些技术

| 技术 | 选型理由 |
|------|----------|
| **Spring Boot 3.x** | 成熟稳定，生态丰富，云原生支持好 |
| **Java 17** | LTS版本，性能优化，语法糖丰富 |
| **MyBatis-Plus** | 简化CRUD，代码生成，分页插件 |
| **React 18** | 组件化开发，生态成熟，性能优秀 |
| **Vite** | 快速启动，热更新，现代化构建 |
| **pnpm** | 节省磁盘空间，安装速度快，依赖管理严格 |
| **LangGraph** | 可视化AI工作流，状态管理清晰，易于扩展 |
| **FastAPI** | 高性能Python框架，自动API文档，类型安全 |

### 8.2 架构亮点

1. **模块化设计** - 后端按业务域拆分模块，职责清晰
2. **多端复用** - 前端采用pnpm workspace，共享组件和工具
3. **AI驱动** - LangGraph构建多角色智能体，支持用户/商家/管理端
4. **工具链丰富** - 集成阿里云OSS/OCR/短信，功能完善

---

## 9. 安全设计

### 9.1 认证授权

- **JWT Token** - 无状态认证，支持Token刷新
- **角色分离** - USER/SELLER/ADMIN 三种角色，接口权限隔离
- **密码加密** - 数据库密码加密存储

### 9.2 数据安全

- **密钥外置** - 所有密钥通过环境变量注入，不提交到仓库
- **数据脱敏** - 手机号、身份证号、统一信用代码等敏感字段脱敏展示
- **SQL注入防护** - 使用MyBatis-Plus参数化查询

### 9.3 接口安全

- **参数校验** - 使用Bean Validation进行入参校验
- **限流保护** - 关键接口可配置限流
- **操作预览** - 重要操作（删除、审核）先预览再执行

---

## 附录

### A. 项目依赖图

```
zhijian-start
├── zhijian-common
├── zhijian-user
│   └── zhijian-common
├── zhijian-medicine
│   └── zhijian-common
├── zhijian-order
│   ├── zhijian-common
│   └── zhijian-medicine
├── zhijian-cart
│   └── zhijian-common
├── zhijian-marketing
│   └── zhijian-common
├── zhijian-file
│   └── zhijian-common
├── zhijian-delivery
│   └── zhijian-common
├── zhijian-aftersales
│   ├── zhijian-common
│   └── zhijian-order
├── zhijian-ai
│   └── zhijian-common
├── zhijian-message
│   └── zhijian-common
└── zhijian-statistics
    └── zhijian-common
```

### B. 快速参考

| 操作 | 命令 |
|------|------|
| 构建后端 | `cd backend && mvn clean package -DskipTests` |
| 启动后端 | `java -jar zhijian-start/target/*.jar` |
| 安装前端依赖 | `cd frontend && pnpm install` |
| 启动用户端 | `pnpm dev:customer` |
| 启动商家端 | `pnpm dev:merchant` |
| 启动管理端 | `pnpm dev:admin` |
| 启动AI工具服务 | `python -m uvicorn tools_service.app:app --port 18080` |
| 启动AI智能体 | `python -m uvicorn agent.app:app --port 18081` |

---

*文档版本: 1.0*
*最后更新: 2026-03-16*
