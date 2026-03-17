#!/bin/bash
# 智健优选 Docker 快速部署脚本

echo "🚀 开始部署智健优选..."

# 检查前置条件
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 请先安装 Docker Compose"
    exit 1
fi

# 1. 构建前端（需要本地有 Node.js + pnpm）
if [ -d "frontend" ]; then
    echo "📦 构建前端..."
    cd frontend
    pnpm install || npm install
    pnpm build:all || npm run build:all
    cd ..
fi

# 2. 检查环境变量
if [ ! -f ".env" ]; then
    echo "⚠️ 未找到 .env 文件，创建默认配置..."
    cat > .env << 'ENVEOF'
# 数据库密码（建议修改）
MYSQL_ROOT_PASSWORD=root123

# OpenAI / DeepSeek API Key（必须配置）
OPENAI_API_KEY=your_api_key_here

# 阿里云配置（可选）
ALIYUN_OSS_ACCESS_KEY_ID=
ALIYUN_OSS_ACCESS_KEY_SECRET=
ALIYUN_SMS_ACCESS_KEY_ID=
ALIYUN_SMS_ACCESS_KEY_SECRET=
ENVEOF
    echo "⚠️ 请编辑 .env 文件，填入你的 API Key 后再启动！"
fi

# 3. 启动所有服务
echo "🐳 启动 Docker 服务..."
docker-compose up -d

echo "✅ 部署完成！"
echo ""
echo "📍 访问地址："
echo "   用户端:   http://服务器IP:3000"
echo "   商家端:   http://服务器IP:3001"
echo "   管理端:   http://服务器IP:3002"
echo "   后端API:  http://服务器IP:8080/api"
echo "   接口文档: http://服务器IP:8080/api/doc.html"
echo ""
echo "📝 查看日志: docker-compose logs -f backend"
