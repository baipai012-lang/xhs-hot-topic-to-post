---
name: "xhs-hot-topic-to-post"
description: "小红书热门话题追踪→原创笔记→生图封面→发布全流程"
---

# 小红书热点追→原创笔记→AI封面→发布 全流程 Skill

## 概述

本 Skill 定义了一个完整的自动化工作流：**发现热门话题 → 搜索小红书热门笔记 → 读取分析热度前5篇 → 提炼核心观点撰写原创汇总笔记 → 发布前自检 → 调用 AI 生成小红书风格封面图 → 选择最佳时间发布到小红书**。

## 前置条件

### 工具

| 工具 | 用途 | 必需性 |
|------|------|--------|
| **xhs CLI** | 小红书搜索/阅读/发布 | ✅ 必需 |
| **封面图生成工具** | 生成小红书风格封面 | ✅ 必需（任选其一，见下方） |

### 安装 xhs CLI 🆕

> xhs CLI 是本 skill 的核心依赖，必须安装。

#### 前置依赖

| 依赖 | 安装方式 | 验证命令 |
|------|----------|----------|
| **Python 3.8+** | [python.org](https://www.python.org/downloads/) 或 `winget install Python.Python.3.12` | `python --version` |
| **uv**（Python 包管理器） | `pip install uv` 或 `curl -LsSf https://astral.sh/uv/install.sh \| sh` | `uv --version` |

#### 安装步骤

```bash
# 1. 确认 Python 和 uv 已安装
python --version  # 应显示 3.8+
uv --version      # 应显示版本号

# 2. 使用 uv 全局安装 xhs CLI
uv tool install xiaohongshu-cli

# 3. 验证安装
xhs --version     # 应显示版本号

# 4. （可选）如果 xhs 命令找不到，需要把 uv 工具目录加入 PATH
# Windows 默认路径: C:\Users\<用户名>\.local\bin
# Linux/Mac 默认路径: ~/.local/bin
```

#### 常见问题

| 问题 | 解决方案 |
|------|----------|
| `uv: command not found` | 重新安装 uv，或手动把 `~/.local/bin` 加入 PATH |
| `xhs: command not found` | 同上，检查 uv 工具目录是否在 PATH 中 |
| 安装时报 Python 版本错误 | 升级 Python 到 3.8+ |
| Windows 上安装后无法运行 | 尝试用 PowerShell 执行，或在 cmd 中用完整路径 `C:\Users\<用户名>\.local\bin\xhs.exe` |

### 封面图生成工具（任选其一）🆕

> 根据你的网络环境和权限选择合适的方案。**至少选一个**，否则无法生成封面图。

| 方案 | 适用场景 | 依赖 | 中文文字支持 |
|------|----------|------|--------------|
| **方案 A: Gemini API** | 有科学上网 + Google API Key | 网络 + API Key | ⚠️ 可能乱码 |
| **方案 B: 国内 AI 图像服务** | 国内网络环境 | 国内平台账号 | ✅ 较好 |
| **方案 C: 纯本地 Pillow 脚本** | 无网络/无 API/离线环境 | Python + Pillow | ✅ 完美 |
| **方案 D: 手动设计** | 对设计有要求/以上方案都不行 | Canva/稿定设计账号 | ✅ 完美 |

#### 方案 A: Gemini API（Nano Banana Pro）

```bash
# 前置：需要科学上网 + Google AI Studio 账号
# 1. 获取 API Key: https://aistudio.google.com/apikey
# 2. 设置环境变量
$env:GEMINI_API_KEY="<your-key>"
# 3. 使用本 workspace 内置脚本
{{NANO_BANANA}} --prompt "..." --filename "cover.png" --resolution 2K
```

#### 方案 B: 国内 AI 图像服务

> 如果无法访问 Gemini API，可以使用国内平台替代。

| 平台 | 模型 | 接入方式 | 免费额度 |
|------|------|----------|----------|
| **火山引擎（豆包）** | Doubao-Seedream-5.0 系列 | [火山引擎控制台](https://console.volcengine.com/iam) | 有 |
| **通义万相** | — | [阿里云控制台](https://dashscope.console.aliyun.com/) | 有 |
| **文心一格** | — | [百度智能云](https://cloud.baidu.com/) | 有 |
| **智谱 AI** | — | [open.bigmodel.cn](https://open.bigmodel.cn/) | 有 |

使用方式：登录对应平台 → 调用图像生成 API → 使用类似 Gemini 的 prompt → 下载图片到 `{{OUTPUT_DIR}}/cover.png`

> 💡 **推荐**：Doubao-Seedream-5.0 系列对中文文字渲染支持较好，适合直接生成带标题的封面图。

#### 方案 C: 纯本地 Pillow 脚本（推荐兜底方案）

> 完全不需要网络和 API，用 Python 本地生成封面图。中文文字完美支持。

脚本位置：`{{OUTPUT_DIR}}/generate_cover_local.py`

```python
from PIL import Image, ImageDraw, ImageFont
import sys

def generate_cover(title, subtitle, output_path, width=1080, height=1440):
    """生成小红书 3:4 封面图"""
    # 创建渐变背景（深蓝到紫色）
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        r = int(20 + (80 - 20) * y / height)
        g = int(20 + (40 - 20) * y / height)
        b = int(80 + (120 - 80) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # 加载字体（需要系统有中文支持的字体）
    try:
        font_title = ImageFont.truetype("msyh.ttc", 100)  # 微软雅黑
        font_sub = ImageFont.truetype("msyh.ttc", 50)
    except:
        try:
            font_title = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc", 100)
            font_sub = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc", 50)
        except:
            print("⚠️ 找不到中文字体，使用默认字体（可能不支持中文）")
            font_title = ImageFont.load_default()
            font_sub = ImageFont.load_default()
    
    # 绘制标题（居中）
    bbox = draw.textbbox((0, 0), title, font=font_title)
    x = (width - bbox[2] + bbox[0]) // 2
    y_title = height // 3
    # 文字阴影
    draw.text((x+3, y_title+3), title, fill="black", font=font_title)
    draw.text((x, y_title), title, fill="white", font=font_title)
    
    # 绘制副标题
    bbox2 = draw.textbbox((0, 0), subtitle, font=font_sub)
    x2 = (width - bbox2[2] + bbox2[0]) // 2
    draw.text((x2, y_title + 150), subtitle, fill="#CCCCCC", font=font_sub)
    
    img.save(output_path)
    print(f"✅ 封面图已生成: {output_path}")

if __name__ == "__main__":
    title = sys.argv[1] if len(sys.argv) > 1 else "你的标题"
    subtitle = sys.argv[2] if len(sys.argv) > 2 else "副标题"
    output = sys.argv[3] if len(sys.argv) > 3 else "cover.png"
    generate_cover(title, subtitle, output)
```

使用方式：
```bash
python {{OUTPUT_DIR}}/generate_cover_local.py "AI副业月入过万" "2024最新方向" "{{OUTPUT_DIR}}/cover.png"
```

#### 方案 D: 手动设计

> 如果对设计质量有高要求，或者以上方案都不满足需求。

1. 打开 [Canva](https://www.canva.com/) 或 [稿定设计](https://www.gaoding.com/)
2. 搜索"小红书封面"模板
3. 选择 3:4 竖版模板
4. 替换标题和背景
5. 导出 PNG 到 `{{OUTPUT_DIR}}/cover.png`

### 路径配置

> ⚠️ 首次使用时，根据实际环境替换以下变量。下文所有命令均使用这些变量。

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `{{XHS_CLI}}` | xhs CLI 可执行文件路径 | `~/.local/bin/xhs` 或 `C:\Users\<你的用户名>\.local\bin\xhs.exe` |
| `{{NANO_BANANA}}` | Nano Banana Pro 脚本路径 | `skills/nano-banana-pro/scripts/generate_image.py` |
| `{{ENV_FILE}}` | .env 文件路径（存放 API Key） | `state/.env` |
| `{{OUTPUT_DIR}}` | 笔记和封面图输出目录 | `~/Desktop` |

### 环境变量

> 所有环境变量在每次终端会话开始时统一设置，避免重复配置。

```bash
# ===== 统一环境配置（每次新终端执行一次即可）=====

# 1. 解决 Windows GBK 编码问题
$env:PYTHONUTF8="1"
$env:PYTHONIOENCODING="utf-8"

# 2. Gemini API Key
#    ✅ 推荐：从 .env 文件加载
#    ❌ 不要通过 --api-key 参数传入（中文/特殊字符会导致 ASCII 编码错误）
$env:GEMINI_API_KEY="<your-key>"
```

## 工作流程

### Step 0: 确认关键词来源 🆕

> ⚠️ **执行本 skill 前，必须先跟用户对齐关键词。** 不要自作主张选话题。

根据用户的输入情况，走不同路径：

| 用户输入 | 判断 | 执行路径 |
|----------|------|----------|
| 给了明确关键词（如"帮我写 AI 写作接单"） | 关键词已确定 | → 跳到 Step 3 直接搜索 |
| 只给了大方向（如"想写点 AI 副业的内容"） | 需要细化 | → 进入 Step 2 调研，推荐 3 个具体关键词供用户选择 |
| 说"你看着办" / "帮我找个热点" | 缺少定位信息 | → 先询问账号定位和目标受众，再进入 Step 2 |

#### 询问定位的话术（仅模式 C 需要）

```
在帮你选话题之前，我需要了解一下：
1. 你的小红书账号主要做什么领域？（如：AI/职场/副业/生活方式）
2. 目标受众是谁？（如：大学生/职场新人/宝妈/创业者）
3. 你希望这篇笔记达到什么效果？（涨粉/引流/品牌曝光/带货）
```

#### 推荐关键词的格式（模式 B 用）

```
我调研了「{大方向}」相关的热门话题，推荐以下 3 个：

1. {关键词A} — 推荐理由（搜索热度/竞争度/与你的匹配度）
2. {关键词B} — 推荐理由
3. {关键词C} — 推荐理由

建议选第 X 个，因为...。你觉得用哪个？
```

> 💡 等用户确认关键词后，再进入 Step 3。不要跳过确认环节。

### Step 1: 登录 xhs CLI

```bash
# 方式一：QR 码扫码登录（推荐，手机小红书扫码即可）
{{XHS_CLI}} login --qrcode

# 方式二：从浏览器提取 cookie（需先在浏览器登录小红书）
{{XHS_CLI}} login
```

> ⚠️ Cookie 有过期时间（约7天），过期后需要重新登录。如果后续步骤报 `Session expired` 错误，回来重新登录即可。

### Step 2: 选择关键词 🆕

> 关键词选对了，后面才不会白做。这一步决定了你的笔记能不能蹭上流量。

#### 关键词来源

| 来源 | 方法 | 适用场景 |
|------|------|----------|
| **小红书热搜** | 打开小红书 App → 搜索页 → 看热搜榜 | 追实时热点 |
| **行业动态** | 关注同领域头部账号最近发了什么 | 垂直领域内容 |
| **竞品分析** | 搜索目标关键词，看排名靠前的笔记在聊什么 | 找差异化角度 |
| **用户提问** | 小红书搜索栏输入关键词，看下拉联想词 | 发现真实需求 |

#### 关键词选择原则

1. **热度与竞争平衡** — 大词（如"AI"）流量大但竞争惨烈，长尾词（如"AI副业赚钱"）更精准
2. **时效性** — 优先选最近 3-7 天突然火起来的话题，而非常青话题
3. **可原创性** — 确认你有独特角度可以写，而不是单纯搬运
4. **搜索联想验证** — 在小红书搜索栏输入关键词，如果下拉联想词丰富，说明搜索量大

#### 示例关键词

```
✅ 好关键词：AI副业、转行数据分析、2024考研、小户型装修、减脂餐食谱
❌ 差关键词：AI（太泛）、美食（太泛）、今天天气（无搜索量）
```

### Step 3: 搜索关键词

```bash
{{XHS_CLI}} search "<关键词>"
```

返回结果为 YAML 格式，包含笔记标题、作者、互动数据（点赞/收藏/评论/分享）、封面图URL、标签等。

### Step 4: 按互动量排序，筛选前5篇热度最高的笔记

从搜索结果中按 `liked_count + collected_count + comment_count` 计算总互动量排序。

> 💡 **效率提示**：如果搜索结果较多（>10条），可以让 agent 写一段脚本自动解析 YAML 并按互动量排序，避免手动计算。

重点关注字段：
- `note_card.display_title` — 标题
- `note_card.interact_info` — 互动数据
- `note_card.user.nickname` — 作者
- `note_card.desc` — 正文内容（可能截断）

互动数据解读：
- **点赞高** → 情绪共鸣强（标题/观点打动人）
- **收藏高** → 实用价值高（干货/教程/清单）
- **评论多** → 话题性强（争议/讨论空间大）

### Step 5: 逐一阅读前5篇笔记全文

```bash
{{XHS_CLI}} read "<note_id>"
```

> ⚠️ 搜索结果的 `note_card.desc` 可能被截断，必须用 `read` 命令获取完整正文。

### Step 6: 分析每篇笔记特点

从以下维度分析：
- **标题吸引力**（悬念/争议/热点绑定/实用价值）
- **正文结构**（个人经历/分析解读/图解/视频）
- **互动表现**（点赞高≠收藏高，收藏高=长期价值，评论多=话题性强）
- **内容角度**（转行经验/行业分析/趋势预测/工具实操）

### Step 7: 撰写原创汇总笔记

核心原则：
1. ❌ **不要直接引用或列出原笔记来源** — 这是原创笔记，不是综述
2. ❌ **不要在结尾带参考资料来源** — 小红书用户不需要看引用
3. ✅ 把原笔记的核心观点打散重组成你自己的体系
4. ✅ 用大白话讲故事，避免学术化表达
5. ✅ 结尾加互动钩子引导评论
6. ✅ 使用 emoji 分段，提升阅读体验

推荐结构：
- **开头钩子**（为什么这个话题火了 + 个人观察）
- **概念解释**（用大白话说清楚是什么）
- **原因分析**（为什么会火）
- **具体拆解**（怎么做 / 什么要求）
- **趋势判断**（未来会怎样）
- **总结 + 互动提问**

字数建议：**300-800字**（太短没深度，太长没人看）

> ⚠️ 注意：**绝对不要保留类似「参考资料」段落**。这是一篇可以直接发的小红书笔记，不是研究报告。

### Step 7.5: 发布前自检 🆕

> 发布前过一遍这个清单，避免低级错误。

- [ ] **无引用残留** — 全文搜索"参考""来源""引用""出处"等关键词，确认无残留
- [ ] **无直接搬运** — 没有整段复制原文（可以观点相似，但表述必须原创）
- [ ] **标题有吸引力** — 能否在信息流中让人停下来点？（数字/悬念/痛点/利益点）
- [ ] **emoji 分布均匀** — 每 2-3 段至少一个 emoji，但不过度堆砌
- [ ] **结尾有互动钩子** — 有提问/投票/选择题引导评论
- [ ] **话题标签就绪** — 准备了 3-5 个相关话题标签（见 Step 9）
- [ ] **封面图就绪** — 3:4 比例、有醒目文字、文件 < 10MB
- [ ] **字数合理** — 正文 300-800 字

### Step 8: 生成小红书封面图

#### 选择封面图生成方案 🆕

> 根据前置条件中选择的方案执行。如果不确定用哪个，按以下决策树判断：

```
能访问 Gemini API 吗？（需要科学上网 + API Key）
├── ✅ 能 → 方案 A（Gemini API）
│   └── 生成的中文文字清晰吗？
│       ├── ✅ 清晰 → 直接用
│       └── ❌ 乱码 → 方案 C（Pillow 叠加文字）
└── ❌ 不能
    └── 有国内 AI 平台账号吗？（通义万相/文心一格/智谱）
        ├── ✅ 有 → 方案 B（国内 AI 服务）
        └── ❌ 没有
            └── 有 Python + Pillow 环境吗？
                ├── ✅ 有 → 方案 C（纯本地脚本）
                └── ❌ 没有 → 方案 D（手动 Canva/稿定设计）
```

#### 方案 A: Gemini API

##### 动态 Prompt 模板

> 不要每次手写 prompt，用模板根据笔记内容自动生成。

```
根据笔记标题 {TITLE} 和核心关键词 {KEYWORDS}，构造如下 prompt：

"Create a Xiaohongshu 3:4 portrait cover image.
大标题文字「{TITLE}」居中显示，使用白色粗体无衬线字体。
副标题/关键词「{KEYWORDS}」在标题下方，字号较小。
背景：深蓝到紫色科技感渐变。
整体风格：现代简约、高级感、信息流中醒目。
确保文字清晰可读，与背景有强对比。"
```

##### 执行命令

```bash
{{NANO_BANANA}} `
  --prompt "<根据上方模板生成的 prompt>" `
  --filename "cover.png" `
  --resolution 2K
```

输出文件保存到 `{{OUTPUT_DIR}}/cover.png`。

> ⚠️ 如果生成的中文文字变形/乱码，切换到方案 C 用 Pillow 叠加文字。

#### 方案 B: 国内 AI 图像服务

使用火山引擎 Doubao-Seedream-5.0 / 通义万相 / 文心一格 / 智谱 AI 等平台，prompt 与方案 A 相同。生成后下载图片到 `{{OUTPUT_DIR}}/cover.png`。

#### 方案 C: 纯本地 Pillow 脚本

```bash
python {{OUTPUT_DIR}}/generate_cover_local.py "{TITLE}" "{KEYWORDS}" "{{OUTPUT_DIR}}/cover.png"
```

> 脚本内容见"前置条件 → 方案 C"章节。首次使用需确保已安装 Pillow：`pip install Pillow`

#### 方案 D: 手动设计

打开 Canva / 稿定设计 → 搜索"小红书封面" → 选 3:4 模板 → 替换标题 → 导出到 `{{OUTPUT_DIR}}/cover.png`

#### 封面图关键设计原则（所有方案通用）

| 原则 | 说明 |
|------|------|
| **比例必须是3:4** | 小红书标准竖版封面比例（1080×1440px） |
| **必须有醒目大标题** | 纯背景图无人点击，文字是流量入口 |
| **大字 + 关键词前置** | FDE / 爆火 / 年薪百万 / 新风口 这类词汇放最显眼位置 |
| **颜色对比强烈** | 深色背景 + 亮色/白色文字，保证可读性 |
| **留白合理** | 标题区域不要太拥挤 |

### Step 9: 发布到小红书 🆕

#### 准备话题标签

发布前准备 **3-5 个话题标签**，格式为 `#话题名称#`。

话题选择策略：
1. **1个大话题** — 搜索量大的泛话题（如 `#AI#`、`#副业#`）
2. **2-3个中等话题** — 垂直领域话题（如 `#AI副业赚钱#`、`#ChatGPT教程#`）
3. **1个长尾话题** — 精准匹配内容的小话题（如 `#AI自动化工具推荐#`）

将话题标签追加到正文末尾：
```
<正文内容>

#话题1# #话题2# #话题3# #话题4#
```

#### 选择最佳发布时间 🆕

> 发布时间直接影响初始曝光量，避开凌晨和上午工作时段。

| 时段 | 适合度 | 说明 |
|------|--------|------|
| **12:00-13:00** | ⭐⭐⭐⭐⭐ | 午休刷手机高峰 |
| **18:00-20:00** | ⭐⭐⭐⭐⭐ | 下班通勤 + 晚饭前 |
| **21:00-23:00** | ⭐⭐⭐⭐ | 睡前刷手机 |
| **10:00-12:00** | ⭐⭐⭐ | 周末上午高峰 |
| 08:00-11:00 工作日 | ⭐⭐ | 上班中，流量低 |
| 00:00-07:00 | ⭐ | 几乎无人活跃 |

#### 发布命令

```bash
{{XHS_CLI}} post `
  --title "<笔记标题>" `
  --body "<笔记正文（含话题标签）>" `
  --images "{{OUTPUT_DIR}}/cover.png"
```

#### 长文本发布示例（PowerShell here-string）🆕

> 当正文较长时，直接传 `--body` 参数容易遇到转义问题。使用 PowerShell here-string 避免转义：

```powershell
$title = "2024年最值得做的3个AI副业，第2个月入过万不是梦"

$body = @"
🔥 最近身边越来越多朋友问我：AI 到底能不能赚钱？

答案是：能，但得选对方向。

我花了3个月时间测试了十几个 AI 副业方向，今天把最靠谱的3个分享给你们👇

1️⃣ AI 写作接单
...（正文内容）...

你们最想尝试哪个方向？评论区告诉我💬

#AI副业# #副业赚钱# #ChatGPT# #AI工具推荐# #2024副业#
"@

{{XHS_CLI}} post --title $title --body $body --images "{{OUTPUT_DIR}}/cover.png"
```

发布成功返回 `id`（笔记 ID）和 `score`（初始评分/曝光分）。

## 常见问题与排查

### 1. xhs CLI 未安装 🆕

```
错误: xhs: command not found
或: 'xhs' 不是内部或外部命令
```

解决：按"前置条件 → 安装 xhs CLI"章节的步骤安装。确保 Python 3.8+ 和 uv 已就绪，然后执行 `uv tool install xiaohongshu-cli`。安装后如果仍找不到命令，检查 PATH 是否包含 uv 工具目录。

### 2. Cookie 过期

```
错误: Session expired — please re-login with: xhs login
```

解决：重新 `{{XHS_CLI}} login --qrcode` 扫码登录

### 3. 编码问题

```
错误: UnicodeEncodeError: 'gbk' codec can't encode character
```

解决：确认已设置 `$env:PYTHONUTF8="1"` 和 `$env:PYTHONIOENCODING="utf-8"`（见"环境变量"章节）

### 4. Gemini API 无法访问 🆕

```
错误: ConnectionError / TimeoutError / 请求超时
或: google.api_core.exceptions.ServiceUnavailable
```

解决：
- 确认网络可以访问 `generativelanguage.googleapis.com`
- 如果在国内无法访问，切换到 **方案 B**（国内 AI 服务）或 **方案 C**（本地 Pillow 脚本）
- 参考 Step 8 的决策树选择替代方案

### 5. Gemini API Key 无效

```
错误: API key not valid
```

解决：检查 `{{ENV_FILE}}` 中 `GEMINI_API_KEY` 是否正确，或重新保存 key

### 6. 图片比例不对

生成的图片不符合小红书封面尺寸。

解决：在 prompt 中明确指定 `3:4 portrait aspect ratio` 或使用内置的 `image_generate` 工具带 `aspectRatio: "3:4"` 参数

### 7. 图片没有文字 / 中文乱码

封面图没有文字内容，或生成的中文字符变形/错乱。

解决：
- **方案 A 用户**：在 prompt 中更明确地描述文字内容和位置。如果仍乱码，切换到方案 C
- **方案 B 用户**：国内平台中文支持通常较好，如果仍有问题，用 Pillow 叠加文字
- **方案 C 用户**：确认系统已安装中文字体（Windows: 微软雅黑 `msyh.ttc`；Linux: `fonts-noto-cjk`）
- **最终兜底**：方案 D 手动用 Canva / 稿定设计处理

### 8. Pillow 脚本找不到中文字体 🆕

```
⚠️ 找不到中文字体，使用默认字体（可能不支持中文）
或: OSError: cannot open resource
```

解决：
- **Windows**：系统自带微软雅黑，一般不会有此问题。如果报错，检查 `C:\Windows\Fonts\msyh.ttc` 是否存在
- **Linux**：安装 Noto CJK 字体：`sudo apt install fonts-noto-cjk`
- **Mac**：系统自带苹方字体，把脚本中的字体路径改为 `/System/Library/Fonts/PingFang.ttc`

### 9. 笔记包含引用/参考来源

用户反馈笔记不能直接发布因为带有了原始笔记来源和参考资料。

解决：撰写时必须打散重组，不可保留「参考来源」段落。发布前用 Step 7.5 自检清单逐项检查。

### 10. 发布时 body 参数转义错误

长文本中包含引号、换行符等特殊字符导致命令解析失败。

解决：使用 PowerShell here-string `@"..."@` 格式传入 body（见 Step 9 示例）

## 文件路径参考

> ⚠️ 以下路径为示例，首次使用时替换为你的实际路径。

| 资源 | 变量 | 示例路径 |
|------|------|----------|
| xhs CLI | `{{XHS_CLI}}` | `~/.local/bin/xhs` 或 `C:\Users\<用户名>\.local\bin\xhs.exe` |
| Nano Banana Pro 脚本 | `{{NANO_BANANA}}` | `skills/nano-banana-pro/scripts/generate_image.py` |
| .env 文件（API Key） | `{{ENV_FILE}}` | `state/.env` |
| 输出目录 | `{{OUTPUT_DIR}}` | `~/Desktop` |

## 完成指标

### 流程完整性
- [ ] 成功登录 xhs CLI
- [ ] 选定关键词并搜索
- [ ] 找到并阅读热度前5篇笔记
- [ ] 撰写原创汇总笔记（无引用痕迹）
- [ ] 通过发布前自检清单
- [ ] 生成 3:4 封面图（含醒目文字）
- [ ] 成功发布到小红书

### 质量量化标准 🆕
| 指标 | 标准 |
|------|------|
| 正文字数 | 300-800 字 |
| 话题标签 | 3-5 个（1大 + 2-3中 + 1长尾） |
| 封面图比例 | 3:4 竖版 |
| 封面图文件大小 | < 10MB |
| 封面图文字 | 必须有，且清晰可读（无乱码） |
| emoji 密度 | 每 2-3 段至少 1 个 |
| 互动钩子 | 结尾必须有提问/投票/选择题 |
| 发布时间 | 在最佳时段内（12-13点 / 18-20点 / 21-23点） |
