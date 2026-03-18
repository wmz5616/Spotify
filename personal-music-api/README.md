# Personal Music Cloud API

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="Nest Logo" />
</p>

一个基于 NestJS 的个人音乐云服务后端 API，为你的私人音乐库提供完整的管理和流媒体服务。

## ✨ 功能特性

- 🎵 **音乐库扫描** - 自动扫描目录，提取音乐元数据
- 💽 **专辑管理** - 专辑列表、详情、封面处理
- 🎤 **艺术家信息** - 艺术家详情、头像、简介
- 📋 **播放列表** - 创建和管理个人播放列表
- 🔍 **全局搜索** - 模糊搜索艺术家、专辑、歌曲
- 🎧 **音频流** - 支持 Range 请求的音频流媒体
- 🎨 **封面处理** - 自动提取和缓存专辑封面
- 📝 **歌词支持** - 内嵌 LRC 歌词解析

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [NestJS](https://nestjs.com/) v11 | Web 框架 |
| [Prisma](https://www.prisma.io/) v5.21 | ORM |
| SQLite | 数据库 |
| [music-metadata](https://github.com/borewit/music-metadata) | 音频元数据解析 |
| [Sharp](https://sharp.pixelplumbing.com/) | 图片处理 |
| [Winston](https://github.com/winstonjs/winston) | 日志记录 |

## 📦 安装

```bash
# 安装依赖
npm install

# 配置环境变量 (复制 .env.example 并修改)
cp .env.example .env

# 初始化数据库
npx prisma db push

# 生成 Prisma Client
npx prisma generate
```

## ⚙️ 环境变量

在 `.env` 文件中配置以下环境变量：

```env
# 数据库 URL
DATABASE_URL="file:./prisma/dev.db"

# 音乐目录路径
MUSIC_DIRECTORY="D:/Music"

# API Key (用于认证)
API_KEY="your-secret-api-key"

# CORS 允许的来源
CORS_ORIGIN="http://localhost:3000"

# 服务端口
PORT=3001
```

## 🚀 运行

```bash
# 开发模式 (热重载)
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

## 📖 API 文档

启动服务后，访问 Swagger API 文档：

```
http://localhost:3001/api-docs
```

### 主要接口概览

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/library/scan` | 扫描音乐库 |
| GET | `/api/albums` | 获取所有专辑 |
| GET | `/api/albums/:id` | 获取专辑详情 |
| GET | `/api/albums/random` | 获取随机专辑 |
| GET | `/api/covers/:id` | 获取专辑封面 |
| GET | `/api/artists` | 获取所有艺术家 |
| GET | `/api/artists/:id` | 获取艺术家详情 |
| GET | `/api/songs/:id` | 获取歌曲详情 |
| GET | `/api/stream/:id` | 音频流 |
| GET | `/api/search?q=关键词` | 搜索 |
| GET | `/api/playlists` | 获取播放列表 |
| POST | `/api/playlists` | 创建播放列表 |

### 认证方式

所有 API 请求需要认证：

1. **Header 认证** (推荐):
   ```
   x-api-key: your-api-key
   ```

2. **URL 参数认证** (用于音频/图片流):
   ```
   /api/stream/1?key=your-api-key
   ```

## 📁 项目结构

```
personal-music-api/
├── prisma/
│   ├── schema.prisma      # 数据模型定义
│   └── migrations/        # 数据库迁移
├── src/
│   ├── common/
│   │   ├── filters/       # 异常过滤器
│   │   └── guards/        # API Key 守卫
│   ├── modules/
│   │   ├── music-library/ # 音乐库核心模块
│   │   └── streaming/     # 流媒体模块
│   ├── prisma/            # Prisma 服务
│   ├── app.module.ts
│   └── main.ts
├── public/                # 静态资源 (封面等)
└── logs/                  # 日志文件
```

## 🧪 测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

## 📝 License

[UNLICENSED](LICENSE)
