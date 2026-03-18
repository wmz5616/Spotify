# Personal Music Cloud UI

<p align="center">
  <img src="https://nextjs.org/static/favicon/favicon-32x32.png" width="32" alt="Next.js Logo" />
</p>

一个现代化的音乐播放器前端界面，基于 Next.js 15 和 React 19 构建，提供类似 Spotify 的用户体验。

## ✨ 功能特性

- 🎵 **音乐播放** - 完整的播放控制（播放/暂停/上一曲/下一曲）
- 🔀 **播放模式** - 顺序播放、单曲循环、列表循环、随机播放
- 📋 **播放队列** - 队列管理、插入下一首、添加到队列
- 🔊 **音量控制** - 滑动调节、静音切换
- ⌨️ **键盘快捷键** - 空格暂停、方向键控制等
- 🎤 **歌词显示** - LRC 歌词同步显示
- 🔍 **搜索功能** - 搜索艺术家、专辑、歌曲
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🌙 **暗色主题** - 优雅的 Spotify 风格界面
- 💾 **状态持久化** - 播放状态本地存储

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Next.js](https://nextjs.org/) v15 | React 框架 |
| [React](https://react.dev/) v19 | UI 库 |
| [TailwindCSS](https://tailwindcss.com/) v3 | 样式框架 |
| [Zustand](https://zustand-demo.pmnd.rs/) v5 | 状态管理 |
| [Framer Motion](https://www.framer.com/motion/) | 动画效果 |
| [Lucide React](https://lucide.dev/) | 图标库 |

## 📦 安装

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
```

## ⚙️ 环境变量

在 `.env.local` 文件中配置：

```env
# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:3001

# API Key (与后端保持一致)
NEXT_PUBLIC_API_KEY=your-secret-api-key
```

## 🚀 运行

```bash
# 开发模式 (Turbopack)
npm run dev

# 生产构建
npm run build
npm run start
```

访问 http://localhost:3000

## 📁 项目结构

```
personal-music-ui/
├── public/               # 静态资源
├── src/
│   ├── app/              # Next.js 页面 (App Router)
│   │   ├── album/[id]/   # 专辑详情页
│   │   ├── artist/[id]/  # 艺术家详情页
│   │   ├── playlist/[id]/# 播放列表页
│   │   ├── search/       # 搜索页
│   │   ├── layout.tsx    # 根布局
│   │   └── page.tsx      # 首页
│   ├── components/       # React 组件
│   │   ├── PlayerControls.tsx    # 播放器控制栏
│   │   ├── FullScreenPlayer.tsx  # 全屏播放器
│   │   ├── Sidebar.tsx           # 侧边栏
│   │   ├── AlbumCard.tsx         # 专辑卡片
│   │   └── ...
│   ├── lib/              # 工具函数
│   │   ├── api-client.ts # API 客户端
│   │   └── lrc-parser.ts # 歌词解析
│   ├── store/            # Zustand 状态
│   │   └── usePlayerStore.ts
│   └── types.ts          # 类型定义
└── tailwind.config.js    # Tailwind 配置
```

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放/暂停 |
| `←` / `→` | 后退/前进 5 秒 |
| `↑` / `↓` | 音量增加/减少 |
| `M` | 静音切换 |
| `S` | 随机播放 |
| `R` | 循环模式切换 |
| `F` | 全屏播放器 |

## 🎨 界面预览

主要页面：
- **首页** - 随机推荐、专辑网格
- **专辑页** - 专辑封面、歌曲列表
- **艺术家页** - 艺术家信息、专辑列表
- **搜索页** - 全局搜索结果
- **全屏播放器** - 沉浸式播放体验

## 📝 License

[UNLICENSED](LICENSE)
