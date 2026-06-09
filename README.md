# 🔥 小红书热点追踪→原创笔记→AI封面→发布 全流程 Skill

> 让 AI Agent 自动追踪热门话题，分析爆款笔记，撰写原创内容，生成精美封面，一键发布到小红书。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)]()

---

## ✨ 这是什么

`xhs-hot-topic-to-post` 是一个 **AI Agent Skill**（工作流指令），专注于**热点追踪→内容创作→自动发布**的全流程自动化。

兼容各类 AI Agent 框架（Hermes Agent、OpenClaw、AutoGPT 等），只要支持 Markdown 格式的 Skill/Workflow 加载即可。

**核心理念**：不做全链路运营的瑞士军刀，只做「追热点→写爆款」这一件事，做到极致。

**一句话总结**：你给方向，AI 帮你追热点、写笔记、做封面、挑时间、加标签、发出去。

---

## 🎯 核心功能

### 1. 智能热点发现
- 🔍 主动搜索关键词，而非被动接受推荐
- 📊 按互动量（点赞+收藏+评论）自动排序
- 🎯 分析热度前5篇爆款笔记

### 2. 原创内容生成
- 📝 提炼核心观点，打散重组为原创体系
- ✅ 严格原创原则，不带引用痕迹
- 📏 300-800字黄金长度，emoji分段提升阅读体验
- 🎣 结尾互动钩子引导评论

### 3. 发布前自检
- 🔍 8项自检清单（无引用残留、无搬运、标题吸引力等）
- ⏰ 最佳发布时间建议（午休/下班/睡前高峰时段）
- 🏷️ 话题标签策略（1大+2-3中+1长尾）

### 4. 封面图生成（4种方案）
- **方案 A**: Gemini API（有科学上网）
- **方案 B**: 国内 AI 服务（通义万相/文心一格/智谱/豆包）
- **方案 C**: 本地 Pillow 脚本（离线可用，中文完美支持）
- **方案 D**: 手动 Canva/稿定设计

### 5. 关键词选择策略
- 🎯 3种触发模式（全自动/半自动/全手动）
- 📋 关键词来源（热搜榜/行业动态/竞品分析/搜索联想）
- ⚖️ 热度与竞争平衡原则

---

## 🚀 快速开始

### 安装

```bash
# 1. 克隆到你的 skills 目录
git clone https://github.com/baipai012-lang/xhs-hot-topic-to-post.git \
  <你的skills目录>/xhs-hot-topic-to-post

# 2. 安装 xhs CLI
uv tool install xiaohongshu-cli

# 3. 验证安装
xhs --version
```

### 使用

在你的 AI Agent 中加载 `SKILL.md`，然后告诉 AI：

```
# 模式 B（推荐）：给方向，AI 细化
"想写点 AI 副业方向的内容"

# 模式 C：直接给关键词
"帮我写一篇关于 AI 写作接单的小红书笔记"

# 模式 A：全自动（不推荐，AI 不知道你的定位）
"帮我发一篇小红书"
```

AI 会自动执行：
1. 确认关键词来源
2. 搜索热门笔记
3. 分析前5篇爆款
4. 撰写原创笔记
5. 发布前自检
6. 生成封面图
7. 选择最佳时间发布

---

## 📦 前置依赖

### 必需

| 依赖 | 安装方式 | 说明 |
|------|----------|------|
| **AI Agent 框架** | 任意（Hermes / OpenClaw / AutoGPT 等） | 能加载 Markdown Skill 即可 |
| **xhs CLI** | `uv tool install xiaohongshu-cli` | 小红书命令行工具 |
| **Python 3.8+** | [python.org](https://www.python.org/) | xhs CLI 依赖 |

### 封面图生成（任选其一）

| 方案 | 依赖 | 适用场景 |
|------|------|----------|
| **Gemini API** | 科学上网 + API Key | 有网络环境 |
| **国内 AI 服务** | 通义万相/文心一格/智谱/豆包账号 | 国内网络 |
| **本地 Pillow** | `pip install Pillow` | 离线环境 |
| **手动设计** | Canva/稿定设计账号 | 高设计要求 |

---

## 📁 项目结构

```
xhs-hot-topic-to-post/
├── README.md           # 本文件
├── LICENSE             # MIT License
├── SKILL.md            # Skill 主文件（AI Agent 加载入口）
├── .gitignore          # Git 忽略规则
└── examples/           # 示例输出（可选）
    ├── example-note.md
    └── example-cover.png
```

---

## 🏆 与其他小红书 Skills 的对比

### vs pigbiglong/xiaohongshu-ops-skill（3⭐）

| 维度 | 本 Skill | ops-skill |
|------|----------|-----------|
| **定位** | 热点追踪→创作→发布 | 全链路运营（7个工作流） |
| **热点发现** | ✅ 主动搜索+互动量排序 | ⚠️ 被动分析首页推荐 |
| **原创保障** | ✅ 写作原则+自检清单 | ⚠️ 未强调 |
| **封面方案** | ✅ 4种方案（含离线） | ⚠️ 依赖其他 skill |
| **发布优化** | ✅ 时间+标签策略 | ❌ 无 |
| **安装门槛** | ✅ 一条命令 | ⚠️ 需配置 Chrome CDP |
| **评论互动** | ❌ 无 | ✅ 有 |
| **账号诊断** | ❌ 无 | ✅ 有 |

**选择建议**：
- 想**追热点写爆款** → 选本 Skill
- 想**全链路运营**（含评论、诊断） → 选 ops-skill
- 两者可以**互补使用**

---

## 🎓 使用技巧

### 1. 关键词选择

```
✅ 好关键词：AI副业、转行数据分析、2024考研、小户型装修
❌ 差关键词：AI（太泛）、美食（太泛）、今天天气（无搜索量）
```

### 2. 最佳发布时间

| 时段 | 适合度 | 说明 |
|------|--------|------|
| 12:00-13:00 | ⭐⭐⭐⭐⭐ | 午休刷手机高峰 |
| 18:00-20:00 | ⭐⭐⭐⭐⭐ | 下班通勤+晚饭前 |
| 21:00-23:00 | ⭐⭐⭐⭐ | 睡前刷手机 |

### 3. 话题标签策略

```
#AI副业#          ← 大话题（搜索量大）
#AI写作接单#      ← 中等话题（垂直领域）
#ChatGPT赚钱#     ← 中等话题
#AI副业月入过万#  ← 长尾话题（精准匹配）
```

---

## 🛠️ 故障排查

| 问题 | 解决 |
|------|------|
| `xhs: command not found` | 检查 uv 工具目录是否在 PATH 中 |
| Cookie 过期 | 重新 `xhs login --qrcode` 扫码登录 |
| Gemini API 无法访问 | 切换到方案 B/C/D |
| 封面图中文乱码 | 使用方案 C（本地 Pillow） |
| 笔记带引用痕迹 | 发布前用自检清单逐项检查 |

详见 [SKILL.md](SKILL.md) 的「常见问题与排查」章节。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 可以改进的方向

- [ ] 评论互动功能
- [ ] 账号数据分析
- [ ] 多账号管理
- [ ] 定时发布
- [ ] 数据追踪（发布后阅读量/互动量）
- [ ] 更多封面图模板

---

## 📄 License

MIT © 2026

---

## 🙏 致谢

- [xiaohongshu-cli](https://github.com/nicepkg/xiaohongshu-cli) — 小红书命令行工具
- [pigbiglong/xiaohongshu-ops-skill](https://github.com/pigbiglong/xiaohongshu-ops-skill) — 全链路运营 Skill（灵感来源）

---

## 📞 联系

如有问题或建议，欢迎：
- 提交 [GitHub Issue](https://github.com/baipai012-lang/xhs-hot-topic-to-post/issues)

---

**Made with ❤️ for 小红书创作者**
