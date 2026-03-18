# 宝塔部署说明

这套项目在宝塔上推荐按下面的结构部署：

- `customer`、`merchant`、`admin`：静态站点，由 Nginx 托管
- `backend`：Spring Boot Jar，监听 `127.0.0.1:8080`
- `tools_service`：FastAPI，监听 `127.0.0.1:18080`，可选
- `agent`：FastAPI，监听 `127.0.0.1:18081`，可选
- `MySQL 8`、`Redis`

推荐域名：

- `www.example.com` -> 用户端
- `merchant.example.com` -> 商家端
- `admin.example.com` -> 管理端

## 1. 服务器环境

宝塔里至少安装这些组件：

- `Nginx`
- `MySQL 8`
- `Redis`
- `Java 17`
- `Maven 3.9+`
- `Node.js 18+`
- `Python 3.11+`

建议把仓库放到：

```bash
/www/wwwroot/Smart-Health-Select
```

## 2. 构建项目

### 后端

```bash
cd /www/wwwroot/Smart-Health-Select
bash deploy/baota/scripts/build_backend.sh
```

### 前端

默认构建 `customer merchant admin` 三个 Web 端：

```bash
cd /www/wwwroot/Smart-Health-Select
bash deploy/baota/scripts/build_frontends.sh
```

如果要额外构建骑手 H5：

```bash
cd /www/wwwroot/Smart-Health-Select
bash deploy/baota/scripts/build_frontends.sh customer merchant admin rider
```

构建输出目录：

- `frontend/apps/customer/dist`
- `frontend/apps/merchant/dist`
- `frontend/apps/admin/dist`
- `frontend/apps/rider/dist`

## 3. 准备环境变量

把模板复制到服务器上的实际配置文件，再填真实值：

```bash
mkdir -p /www/server/bt-env/smart-health
cp deploy/baota/env/backend.env.example /www/server/bt-env/smart-health/backend.env
cp deploy/baota/env/tools.env.example /www/server/bt-env/smart-health/tools.env
cp deploy/baota/env/agent.env.example /www/server/bt-env/smart-health/agent.env
```

如果你暂时不启用 AI，只需要配置 `backend.env`。

## 4. 启动后端与 AI 服务

### backend

宝塔 `Supervisor/进程守护` 命令建议填写：

```bash
/bin/bash -lc 'cd /www/wwwroot/Smart-Health-Select && ./deploy/baota/scripts/run_backend.sh /www/server/bt-env/smart-health/backend.env'
```

### tools_service

```bash
/bin/bash -lc 'cd /www/wwwroot/Smart-Health-Select && ./deploy/baota/scripts/run_langgraph_tools.sh /www/server/bt-env/smart-health/tools.env'
```

### agent

```bash
/bin/bash -lc 'cd /www/wwwroot/Smart-Health-Select && ./deploy/baota/scripts/run_langgraph_agent.sh /www/server/bt-env/smart-health/agent.env'
```

建议把这三个进程都配置为开机自启。

## 5. 配置网站和 Nginx

在宝塔新建 3 个站点，对应 3 个前端域名，然后把各自 `dist` 目录上传或同步到站点根目录，例如：

- `/www/wwwroot/www.example.com`
- `/www/wwwroot/merchant.example.com`
- `/www/wwwroot/admin.example.com`

每个站点的 Nginx 配置可参考：

- `deploy/baota/nginx/spa-site.conf.example`

你需要替换两处：

- `server_name`
- `root`

这个模板已经包含：

- SPA 刷新回退到 `index.html`
- `/api/` 反向代理到 `127.0.0.1:8080`

如果你想额外暴露独立 API 域名，可参考：

- `deploy/baota/nginx/api-site.conf.example`

## 6. 初始化数据库

当前仓库内可见的 SQL 只有：

- `backend/zhijian-start/src/main/resources/schema.sql`

如果你有完整业务库初始化脚本，需要在宝塔 MySQL 中先导入，再启动后端。

## 7. 常见检查

后端接口：

```bash
curl http://127.0.0.1:8080/api/doc.html
```

AI 服务：

```bash
curl http://127.0.0.1:18080/health
curl http://127.0.0.1:18081/health
```

如果前端页面能打开但接口 404/502，优先检查：

- Nginx 站点里是否配置了 `/api/` 代理
- `backend` 进程是否正常监听 `127.0.0.1:8080`
- 后端是否使用了 `prod` profile 启动
- 数据库和 Redis 环境变量是否填写正确
