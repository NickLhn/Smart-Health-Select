# 《智健优选》开发实施路线图

## 一、 技术栈概览
- **前端体系 (Monorepo 架构)**:
    - **技术核心**: React 18 + TypeScript + Vite + pnpm workspaces
    - **状态管理**: Zustand (轻量级) 或 Redux Toolkit
    - **样式方案**: TailwindCSS + Ant Design (PC) / Ant Design Mobile (移动端)
    - **应用端口**:
        - **用户端 (小程序/H5)**: Taro + React (C端核心流量入口)
        - **用户端 (PC Web)**: React 18 + Ant Design (门户与商城)
        - **商家端 (PC Web)**: React 18 + Ant Design (工作台)
        - **平台管理端 (PC Web)**: React 18 + Ant Design Pro (后台管理)
        - **骑手端 (小程序)**: Taro + React (适配微信小程序)
- **后端**: Java 17 + Spring Boot 3.2 + Spring Security (遵循 DDD 分层架构)
- **数据库**: MySQL 8.0.17
- **缓存**: Redis 5.0
- **文件存储**: 阿里云 OSS (Aliyun Object Storage Service)
- **AI**: LangChain4j + DeepSeek API
- **地图**: 高德地图 JS API
- **其他**: WebSocket (消息推送), Quartz (定时任务)

## 二、 详细开发流程步骤

### 第一阶段：设计与基础设施 (Week 1)
**目标**: 完成领域建模，搭建 DDD 后端脚手架。

1.  **领域建模与数据库设计 (Day 1-2)**
    *   [x] 核心表结构设计 (User, Medicine, Order, Prescription)
    *   [ ] 划分限界上下文 (Bounded Contexts): 用户域, 商品域, 订单域, 支付域, 配送域
    *   [ ] 编写 SQL 建表脚本
    *   [ ] 数据库环境初始化 (MySQL + Redis)

2.  **后端 DDD 架构搭建 (Day 2-3)**
    *   初始化 Spring Boot 3 项目
    *   **集成阿里云 OSS SDK** (文件上传服务)
    *   **分层结构落地**:
        *   `interfaces`: Web API, DTO, Assembler
        *   `application`: 应用服务 (Orchestration), Command/Query
        *   `domain`: 实体, 值对象, 聚合根, 领域服务, 仓储接口
        *   `infrastructure`: 持久化实现 (MyBatis-Plus), 外部防腐层 (ACL - 支付/地图/OSS)
    *   配置 Swagger/Knif4j
    *   封装统一响应结果 (Result<T>) 与 全局异常处理

3.  **前端架构搭建 (Day 3)**
    *   初始化 React Monorepo 或 独立项目结构 (用户端/商家端/管理端)
    *   初始化 微信小程序 项目
    *   集成 Ant Design 全局主题
    *   封装 Axios 请求拦截器 (Token注入)
    *   配置 React Router 路由结构

### 第二阶段：核心业务开发 (MVP) (Week 2-3)
**目标**: 实现用户购药、下单、模拟支付主流程。

4.  **用户与权限模块 (Day 4-5)**
    *   实现 JWT 登录/注册
    *   RBAC 权限控制 (普通用户/药师/管理员)
    *   用户地址管理

5.  **药品与库存模块 (Day 6-7)**
    *   药品上下架 (商家端)
    *   药品搜索与详情展示 (用户端)
    *   库存扣减逻辑 (利用 Redis Lua 脚本保证原子性)

6.  **订单与支付模块 (Day 8-10)**
    *   **核心**: 订单状态机开发 (待支付->待接单->配送中->完成)
    *   购物车功能
    *   模拟支付接口 (Mock Payment)
    *   超时自动取消 (Redis Key Expiration 或 Quartz)

### 第三阶段：医疗与配送增强 (Week 4)
**目标**: 加入处方审核、AI 问诊与配送逻辑。

7.  **处方与实名认证 (Day 11-12)**
    *   **实名就诊人管理**: 图片上传 + 后端 OCR 辅助识别 (姓名/身份证)
    *   用户上传处方图片
    *   药师端审核接口 (电子签章模拟)
    *   下单前的处方拦截逻辑

8.  **药品效期管理 (Day 13)**
    *   入库录入生产日期/有效期
    *   临期预警定时任务 (Quartz)
    *   过期自动下架逻辑

9.  **AI 智能导诊 (Day 14)**
    *   集成 LangChain4j
    *   对接 DeepSeek API
    *   实现 "基于症状推荐药品" 的对话接口

10. **配送与地图 (Day 15-16)**
    *   骑手端订单池
    *   高德地图路径规划集成
    *   **双向验证码**: 商家取货码 + 用户收货码逻辑
    *   配送状态实时更新

### 第四阶段：实时交互与报表 (Week 5)
**目标**: 提升体验，完善管理功能。

11. **消息推送 (Day 17)**
    *   WebSocket 服务端搭建
    *   实现：订单状态变更 -> 推送给用户/商家

11. **数据看板 (Day 17)**
    *   ECharts 集成
    *   统计：热销药品、销售额趋势

12. **测试与部署 (Day 18-20)**
    *   单元测试 (JUnit 5)
    *   压力测试 (JMeter)
    *   Docker 镜像构建与部署

## 三、 关键检查点
- **M1**: 数据库 SQL 评审通过
- **M2**: 后端 Login 接口跑通
- **M3**: 订单全流程 (下单->支付->发货) 跑通
- **M4**: AI 对话功能可用

## 四、 开发规范
1. **代码注释**: 所有关键逻辑、类、方法必须包含中文注释 (Javadoc)。
2. **严格执行**: 开发过程严格遵循本文档规划的步骤，不得随意跳过或更改架构设计。
