# 智健优选（Smart Health Select）技术架构文档

**文档版本**：v2.0  
**生成日期**：2026-03-22  
**适用范围**：毕业设计最终交付版 / 部署版 / 论文技术章节

---

## 1. 架构概览

智健优选是一套多端协同的医药健康服务系统，整体由以下几层组成：

- 前端应用层：用户端、商家端、管理端、骑手端
- 后端业务层：Spring Boot 多模块服务
- AI 服务层：FastAPI + LangGraph
- 数据层：MySQL、Redis、阿里云 OSS
- 部署层：宝塔部署为主，AI 支持可选容器化

系统不是单纯的“前后端商城”，而是围绕医药场景设计的业务系统，覆盖：

- 用户购药与咨询
- 商家入驻与经营
- 平台审核与运营
- 骑手配送履约
- AI 角色化对话服务

---

## 2. 仓库结构

```text
Smart-Health-Select/
├─ backend/                         Spring Boot Maven 多模块后端
│  ├─ zhijian-common/               公共模块
│  ├─ zhijian-user/                 用户/商家/地址/OCR
│  ├─ zhijian-medicine/             药品/分类/Banner/资讯/收藏/足迹/IM
│  ├─ zhijian-order/                订单/支付/评价/统计
│  ├─ zhijian-cart/                 购物车
│  ├─ zhijian-marketing/            优惠券
│  ├─ zhijian-file/                 文件上传
│  ├─ zhijian-delivery/             配送
│  ├─ zhijian-aftersales/           售后
│  ├─ zhijian-ai/                   Java 侧 AI 聚合层
│  ├─ zhijian-message/              短信与消息能力
│  ├─ zhijian-statistics/           旧统计模块
│  └─ zhijian-start/                启动入口
├─ frontend/
│  └─ apps/
│     ├─ customer/                  用户端（React + Vite）
│     ├─ merchant/                  商家端（React + Vite）
│     ├─ admin/                     管理端（React + Vite）
│     └─ rider/                     骑手端（Taro）
├─ zhijian_langgraph/               AI 服务（FastAPI + LangGraph）
├─ deploy/baota/                    宝塔部署脚本、环境模板、Nginx 示例
├─ docker-compose.langgraph.yml     AI 容器化编排
├─ Dockerfile.langgraph             AI Agent 镜像定义
└─ Dockerfile.tools                 AI Tools 镜像定义
```

---

## 3. 技术栈

## 3.1 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 17 | 核心开发语言 |
| Spring Boot | 3.2.1 | Web 框架 |
| Maven | 3.9+ | 构建工具 |
| MyBatis-Plus | 3.5.5 | ORM 与分页 |
| MySQL | 8.x | 主数据库 |
| Redis | 7.x | 缓存、会话、状态 |
| JWT | 0.11.5 | 身份认证 |
| Knife4j | 4.3.0 | API 文档 |
| Hutool | 5.8.25 | 工具库 |
| LangChain4j | 0.25.0 | Java 侧 AI 集成 |

## 3.2 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI 开发 |
| TypeScript | 5.2.2 | 类型系统 |
| Vite | 5.x | 构建工具 |
| Ant Design | 5.x | 组件库 |
| Tailwind CSS | 3.x | 样式工具 |
| React Router | 6.x | 路由管理 |
| Axios | 1.x | HTTP 请求 |
| Taro | 3.6.19 | 骑手端小程序/H5 |

## 3.3 AI 技术栈

| 技术 | 用途 |
|------|------|
| Python 3.11 | AI 服务运行环境 |
| FastAPI | AI 接口服务 |
| LangGraph | 多角色图编排 |
| Redis | 会话状态持久化 |

---

## 4. 系统分层架构

## 4.1 前端层

前端采用多应用模式：

- `customer`：面向终端购药用户
- `merchant`：面向商家经营管理
- `admin`：面向平台运营与审核
- `rider`：面向配送履约

三个 Web 端都采用：

- React + TypeScript
- 基于 `App.tsx` 做路由总入口
- 基于 `services/` 统一访问后端接口
- 基于 `context/` 管理登录态、购物车、AI 状态等

## 4.2 后端层

后端采用 Maven 多模块架构，所有业务统一由 `zhijian-start` 启动。

统一特征：

- API 前缀为 `/api`
- 通过 JWT + `UserContext` 做认证与角色识别
- 控制器负责接口层与权限校验
- `service/impl` 负责核心业务逻辑
- MyBatis-Plus 负责数据访问

## 4.3 AI 层

AI 由两部分组成：

### Java 聚合层

模块：
- `backend/zhijian-ai`

职责：

- 对外暴露 `/ai/*` 和 `/merchant/ai/*`
- 校验登录态
- 构造会话 ID
- 调用 LangGraph Agent
- 转换成前端可用的同步响应或 SSE 响应

### Python Agent 层

目录：
- `zhijian_langgraph/agent`
- `zhijian_langgraph/tools_service`

职责：

- `agent`：角色图编排、意图识别、多轮状态管理
- `tools_service`：查询业务数据、执行工具操作

---

## 5. 后端模块职责

## 5.1 `zhijian-common`

职责：

- 统一返回结构 `Result`
- 全局异常处理
- 认证拦截器
- 用户上下文 `UserContext`
- JWT 工具

## 5.2 `zhijian-user`

职责：

- 注册、登录、找回密码
- 商家入驻与审核
- 用户资料
- 地址管理
- 就诊人管理
- OCR 识别

主要控制器：

- `AuthController`
- `MerchantController`
- `UserController`
- `UserAddressController`
- `PatientController`
- `SysConfigController`

## 5.3 `zhijian-medicine`

职责：

- 药品发布与管理
- 分类管理
- Banner 管理
- 健康资讯
- 收藏
- 足迹
- 商品评价
- 简易站内消息

主要控制器：

- `MedicineController`
- `AdminMedicineController`
- `CategoryController`
- `BannerController`
- `HealthArticleController`
- `MedicineFavoriteController`
- `MedicineCommentController`
- `HomeController`
- `ImController`

## 5.4 `zhijian-order`

职责：

- 创建订单
- 购物车下单
- 运费试算
- 支付、取消、确认收货
- 商家发货
- 处方审核
- 订单评价
- 平台和商家数据看板

主要控制器：

- `OrderController`
- `OrderCommentController`
- `DashboardController`

## 5.5 `zhijian-cart`

职责：

- 加购
- 更新数量
- 删除购物车项
- 查询当前用户购物车

## 5.6 `zhijian-aftersales`

职责：

- 用户退款申请
- 管理端/商家审核退款
- 售后列表与详情补充

## 5.7 `zhijian-delivery`

职责：

- 配送单创建
- 骑手接单
- 配送完成
- 异常上报
- 骑手配送统计

## 5.8 `zhijian-marketing`

职责：

- 优惠券创建、更新、删除、状态管理
- 用户领取优惠券
- 我的优惠券查询
- 订单使用优惠券

## 5.9 `zhijian-file`

职责：

- 统一文件上传入口
- 对接阿里云 OSS

## 5.10 `zhijian-message`

职责：

- 短信验证码发送
- WebSocket 与通知能力的基础支持

## 5.11 `zhijian-ai`

职责：

- Java 侧 AI 聚合层
- 聊天历史读取与清空
- SSE 流式输出
- 与 LangGraph Agent 交互

## 5.12 `zhijian-statistics`

职责：

- 旧版统计聚合逻辑
- 当前仍在代码中保留，但主看板已经由 `zhijian-order` 中的 `DashboardController` 提供

---

## 6. 关键业务数据流

## 6.1 用户下单数据流

1. 用户端调用购物车或订单接口
2. 后端校验用户身份、商品状态、库存、地址
3. 计算商品总额、运费、优惠券抵扣
4. 创建订单主记录和订单项记录
5. 需要处方的订单进入待审核状态
6. 普通订单进入待支付状态

## 6.2 售后数据流

1. 用户提交售后申请
2. 系统生成退款申请记录
3. 订单状态切换为售后中
4. 管理端或商家审核
5. 审核通过则走退款逻辑并写支付记录
6. 审核拒绝则恢复原订单状态

## 6.3 商家入驻数据流

1. 商家上传店铺与资质资料
2. OCR 自动识别营业执照与身份证字段
3. 商家提交入驻申请
4. 管理员审核
5. 审核通过后商家可正常经营

## 6.4 AI 对话数据流

1. 前端发起 `/ai/chat` 或 `/ai/stream`
2. Java 聚合层构造会话 ID 与请求 ID
3. 调用 LangGraph Agent
4. Agent 根据角色选择普通图、商家图或管理图
5. Agent 调用 tools-service 获取订单、商品、售后、经营等数据
6. 返回文本、卡片、动作事件
7. Java 聚合层回传前端
8. 前端写入上下文和历史消息

---

## 7. 前端架构设计

## 7.1 应用结构

每个 Web 端大体采用以下结构：

```text
src/
├─ App.tsx                 路由入口
├─ main.tsx                挂载入口
├─ context/                全局上下文
├─ services/               接口访问层
├─ pages/                  页面层
├─ components/             通用组件
├─ layouts/                布局组件
└─ utils/                  工具函数
```

## 7.2 请求层设计

三端都采用统一 `request.ts` 做 axios 封装，负责：

- 补充 token
- 统一解析 `{ code, message, data }`
- 统一处理错误
- 隔离业务层和底层网络库

## 7.3 状态管理设计

使用 React Context 管理轻量全局状态：

- 用户端：`AuthContext`、`CartContext`、`AIContext`
- 管理端：`AuthContext`
- 商家端：`AuthContext`

优点：

- 结构简单
- 无需引入额外状态库
- 足够支撑毕业设计规模

---

## 8. AI 架构设计

## 8.1 角色化图结构

系统按角色划分三类会话图：

- 用户图：健康咨询、订单查询、售后咨询、购药推荐
- 商家图：经营分析、订单处理、库存与售后辅助
- 管理图：审核、运营、平台数据分析

## 8.2 `agent.app` 的职责

- 校验 Bearer Token
- 读取 Redis 中的会话状态
- 写入当前用户消息
- 选择正确的业务图
- 执行图并返回结果
- 保存下一轮对话所需状态

## 8.3 `tools_service.app` 的职责

- 基于数据库和后端接口做数据查询
- 提供工具型接口给 Agent 调用
- 对敏感字段做脱敏处理
- 对不同角色做细粒度权限限制

## 8.4 AI 返回结构

AI 返回的结果不仅有文本，还可能包括：

- `cards`：推荐卡片
- `action`：前端跳转或操作提示
- `pending_action` / `pending_intent`：多轮状态

---

## 9. 接口设计规范

## 9.1 统一前缀

- 后端统一以 `/api` 为接口前缀

## 9.2 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 9.3 认证方式

- 使用 JWT Bearer Token
- 由拦截器解析 Token
- 将用户信息注入 `UserContext`

## 9.4 角色控制

常见角色包括：

- `USER`
- `SELLER`
- `ADMIN`
- `PHARMACIST`

控制方式：

- 控制器层先做身份与角色判断
- service 层再补业务归属校验

---

## 10. 部署架构

## 10.1 本地开发模式

本地开发不依赖 Docker，直接原生启动：

- 后端：Spring Boot Jar
- 前端：Vite 开发服务器
- AI：Python Uvicorn

## 10.2 宝塔主部署模式

当前正式交付版本以宝塔部署为主：

- 前端：
  - `customer`
  - `merchant`
  - `admin`
  作为静态站点部署到宝塔 Nginx

- 后端：
  - Spring Boot Jar
  - 监听 `127.0.0.1:8080`
  - 由 `systemd` 或宝塔进程守护管理

- AI：
  - 可直接以 Python 进程运行
  - 或通过 `docker-compose.langgraph.yml` 单独容器化运行

## 10.3 发布方式

推荐流程：

1. 本地构建发布包
2. 上传到服务器
3. 备份当前线上文件
4. 覆盖前端静态资源、后端 Jar、AI 源码
5. 重启后端和 AI
6. 做本地与外网探活验证

## 10.4 当前保留的容器化能力

当前仓库不再保留“整站 Docker 一键部署”，只保留：

- `docker-compose.langgraph.yml`
- `Dockerfile.langgraph`
- `Dockerfile.tools`

这意味着：

- 本地开发不用 Docker
- 线上部署以宝塔为主
- AI 可按需要单独容器化

---

## 11. 安全设计

## 11.1 凭证管理

- 所有密钥通过环境变量或外部配置文件注入
- 仓库中不提交真实密钥
- 宝塔环境变量单独保存在服务器目录中

## 11.2 数据安全

- JWT 做登录态校验
- 商家资料、联系方式等敏感字段在部分场景下脱敏返回
- 文件上传统一走后端服务，不允许前端直接写 OSS

## 11.3 权限控制

- 用户仅能操作自己的订单、地址、就诊人、售后
- 商家仅能操作自己的商品、订单、评价
- 管理员拥有平台审核与运营权限

---

## 12. 测试与验证

## 12.1 当前可验证项

- `admin / customer / merchant` 前端构建
- 后端 `mvn test`
- 后端 `mvn -DskipTests package`
- 宝塔部署后：
  - `http://127.0.0.1:8080/api/doc.html`
  - `http://127.0.0.1:18080/health`
  - `http://127.0.0.1:18081/health`
  - 外网关键 API 接口

## 12.2 当前验证结论

基于当前仓库版本，核心链路已经完成：

- 本地构建通过
- 后端测试通过
- 宝塔部署通过
- AI 服务探活通过
- 外网用户端、商家端、管理端接口验证通过

---

## 13. 现阶段架构评价

### 13.1 优势

- 多端协同结构清晰
- 业务模块划分明确
- 支持 AI 角色化扩展
- 支持宝塔部署与发布包式交付
- 对毕业设计规模来说，复杂度与展示效果平衡较好

### 13.2 局限

- 状态流转规则部分仍依赖代码约定，缺少统一状态机抽象
- 骑手端能力仍偏基础
- AI 能力偏工具增强，尚未形成完整业务自动执行闭环
- 统计模块存在旧接口与新接口并存的情况

### 13.3 后续演进方向

- 抽离更清晰的订单状态机
- 引入统一审计日志
- 提升 AI 对业务动作执行的闭环能力
- 优化商家经营分析能力
- 扩展支付、医保、处方流转等真实业务能力

---

## 14. 结论

智健优选当前已经形成一套完整的多端医药健康平台架构：

- 前端多端清晰分工
- 后端多模块承担核心业务
- AI 体系以 Java 聚合层 + Python LangGraph 层协同实现
- 部署方式以宝塔为主，并为 AI 保留可选容器化能力

对于毕业设计目标而言，这套架构已经能够支撑：

- 功能实现
- 系统演示
- 架构分析
- 测试验证
- 部署说明
- 论文撰写

