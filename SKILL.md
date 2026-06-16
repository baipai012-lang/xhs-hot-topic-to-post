---
name: "xhs-hot-topic-to-post"
description: "小红书热门话题追踪→原创笔记→生图封面→发布全流程"
triggers:
  - 发小红书
  - 发布笔记
  - 热点笔记
  - 写一篇小红书
  - 小红书发帖
  - 追热点
  - 热门话题
  - xhs-hot-topic
  - 帮我发一篇
  - 发一篇
---

# 小红书热点追→原创笔记→AI封面→发布 全流程 Skill

## 概述

本 Skill 定义了一个完整的自动化工作流：**发现热门话题 → 搜索小红书热门笔记 → 读取分析热度前5篇 → 提炼核心观点撰写原创汇总笔记 → 发布前自检 → 生成小红书风格封面图 → 选择最佳时间发布到小红书**。

## 环境配置（Sonny 的实际环境）

> ⚠️ 以下路径是 Sonny 机器上的实际配置，直接使用即可。

| 变量 | 实际值 | 说明 |
|------|--------|------|
| `{{XHS_CLI}}` | `/mnt/c/Users/Administrator/AppData/Roaming/uv/tools/xiaohongshu-cli/Scripts/python.exe -c "import sys; sys.stdout.reconfigure(encoding='utf-8'); from xhs_cli.cli import cli; cli([...])"` | 从 WSL 调用 Windows 上的 xhs CLI |
| `{{OUTPUT_DIR}}` | `/mnt/d/openclaw/workspace/skills/xhs-hot-topic-to-post/output/` | 笔记和封面图输出目录 |
| `{{NANO_BANANA}}` |  未安装 | Nano Banana Pro 脚本不存在，不要使用 |

### 封面图生成方案（按优先级）

| 方案 | 状态 | 说明 |
|------|------|------|
| **方案 A: Pillow 本地脚本** | ✅ 推荐 | 中文文字完美渲染，微软雅黑字体，3:4比例 |
| **方案 B: Hermes image_gen** | ✅ 可用 | Hermes 内置图像生成工具，直接调用 |
| **方案 C: Gemini API** | ⚠️ 中文崩坏 | Gemini 无法可靠渲染中文字符，仅适合无文字的装饰图 |
| **方案 D: 手动设计** | ✅ 可用 | Canva/稿定设计 |

> 💡 **推荐顺序**：有中文文字 → 必须用 Pillow。无文字装饰图 → image_gen 或 Gemini。

### Pillow 封面图生成脚本

> ⚠️ 必须通过 Windows Python 执行，WSL 的 Python 没有 Pillow。

```bash
/mnt/c/Users/Administrator/AppData/Roaming/uv/tools/xiaohongshu-cli/Scripts/python.exe << 'EOF'
import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image, ImageDraw, ImageFont

def generate_cover(title, subtitle, output_path, width=1080, height=1440):
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        r = int(20 + (80 - 20) * y / height)
        g = int(20 + (40 - 20) * y / height)
        b = int(80 + (120 - 80) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    try:
        font_title = ImageFont.truetype("msyh.ttc", 120)
        font_sub = ImageFont.truetype("msyh.ttc", 60)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), title, font=font_title)
    x = (width - bbox[2] + bbox[0]) // 2
    y_title = height // 3
    draw.text((x+4, y_title+4), title, fill="black", font=font_title)
    draw.text((x, y_title), title, fill="white", font=font_title)
    
    bbox2 = draw.textbbox((0, 0), subtitle, font=font_sub)
    x2 = (width - bbox2[2] + bbox2[0]) // 2
    draw.text((x2, y_title + 180), subtitle, fill="#CCCCCC", font=font_sub)
    
    img.save(output_path)
    print(f"✅ 封面图已生成: {output_path}")

generate_cover("标题", "副标题", r"D:\openclaw\workspace\skills\xhs-hot-topic-to-post\output\cover.png")
EOF
```

### 发布命令（实际用法）

```bash
/mnt/c/Users/Administrator/AppData/Roaming/uv/tools/xiaohongshu-cli/Scripts/python.exe -c "
import sys; sys.stdout.reconfigure(encoding='utf-8')
from xhs_cli.cli import cli
cli(['post', '--title', '标题', '--body', '正文内容', '--images', 'D:\\\\openclaw\\\\workspace\\\\skills\\\\xhs-hot-topic-to-post\\\\output\\\\cover.png'])
"
```

> ⚠️ Windows 路径中的反斜杠需要双重转义 `\\\\`。

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

> ⚠️ **首次使用需先创建脚本文件**：将下方代码保存到 `{{OUTPUT_DIR}}/generate_cover_local.py`

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

#### 📌 封面图发布前校验（所有方案通用）

封面图生成后，**必须经过以下校验才能进入发布环节**：

| 检查项 | 检查方法 | 失败处理 |
|--------|----------|----------|
| 文件是否存在 | `ls -la {{OUTPUT_DIR}}/cover.png` | 重新生成 |
| 文件大小 < 10MB | `ls -lh` 查看 | 降低分辨率或压缩 |
| 3:4 比例 | `python -c "from PIL import Image; i=Image.open('{{OUTPUT_DIR}}/cover.png'); print(i.size)"` 验证比例是否为 3:4 | 方案 A 重设 prompt；方案 C 调整 width/height |
| 中文文字清晰 | (无自动化手段) → **请求用户肉眼确认** | 用户说不行 → 切换到方案 C 或 D |

> ⚠️ **关键规则**：封面图必须让用户确认 OK 后，才进入发布步骤。AI 生成的封面图不一定完美，跳过确认直接发布可能会翻车。

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
| `{{XHS_CLI}}` | xhs CLI 可执行文件路径 | Windows: `C:\Users\<用户名>\.local\bin\xhs.exe` / Mac/Linux: `~/.local/bin/xhs` |
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

# 2. Gemini API Key（用于封面图生成）
#    获取: https://aistudio.google.com/apikey
#    ⚠️ 粘贴时确保前后无空格/隐藏字符，否则报 API_KEY_INVALID
$env:GEMINI_API_KEY="<your-key>"
```

### Gemini API 封面图生成（方案 A 详细步骤）

> 不需要安装 `google-generativeai` SDK，直接用 curl 调用 REST API 即可。

**模型选择**（2026-06 验证可用）：
- ✅ `gemini-2.5-flash-image` — 支持 TEXT + IMAGE 输出
-  `gemini-2.0-flash-exp-image-generation` — 已下线，返回 404
- ❌ `gemini-2.0-flash-preview-image-generation` — 已下线

**curl 调用示例**：
```bash
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "<prompt>"}]}],
    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
  }' > /tmp/gemini_response.json
```

**提取图片**（Python）：
```python
import json, base64
with open('/tmp/gemini_response.json') as f:
    data = json.load(f)
for p in data['candidates'][0]['content']['parts']:
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        with open('cover.png', 'wb') as out:
            out.write(img)
        print(f'✅ Saved: {len(img)} bytes')
```

**Prompt 模板**（小红书封面）：
```
Create a Xiaohongshu 3:4 portrait cover image.
大标题文字「{TITLE}」居中显示，使用白色粗体无衬线字体。
副标题「{SUBTITLE}」在标题下方，字号较小。
背景：深蓝到紫色科技感渐变。
整体风格：现代简约、高级感、信息流中醒目。
确保文字清晰可读，与背景有强对比。
```

**常见错误**：
| 错误 | 原因 | 解决 |
|------|------|------|
| `API_KEY_INVALID` | Key 复制时有隐藏字符 | 重新从 aistudio 复制，确保无空格 |
| `NOT_FOUND` | 模型名已下线 | 用 `gemini-2.5-flash-image` |
| 返回只有 text 无 image | prompt 不够明确 | 强调 "3:4 portrait cover image" + "文字居中" |

## 相关 Skills

- **xiaohongshu-cli** — 评论回复、登录管理、笔记读取等日常操作
- 本 skill 依赖 xiaohongshu-cli 的搜索/阅读/发布功能
- **爆款公式参考** — `references/xhs-viral-formulas.md` 包含13条世界杯爆款笔记公式，涵盖赛前预测、赛后复盘、情绪吐槽、数据看板等全场景。写笔记时参考此文件选择合适公式。
- **批量赛前预测流程** — `references/batch-match-notes.md` 记录"多场比赛×多种公式×配图"的批量生产流程，含ELO查询、深度分析、并行写笔记、并行生成配图、发布全链路。

## 工作流程

> 📁 **Support files**:
> - `scripts/generate_cover_gemini.sh` — Reusable Gemini cover generation script
> - `references/gemini-api-cover-generation.md` — Gemini API details, model discovery, error handling
> - `references/world-cup-content-strategy.md` — 小红书世界杯话题爆款笔记类型分析、内容策略、合规红线

### Step 0: 确认关键词来源 

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
- [ ] **封面图就绪** — 3:4 比例、有醒目文字、中文文字清晰可读（无乱码）、文件 < 10MB
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

#### 方案 C: Gemini API（仅适合无中文文字的装饰图）

> ⚠️ **关键限制：Gemini 无法可靠渲染中文文字。** `gemini-2.5-flash-image` 返回的图片中，中文字符经常出现笔画缺失、位置偏移、乱码等问题。**不要用 Gemini 生成需要中文文字的封面图。** 仅适合生成纯装饰性背景图（无文字或只有英文文字）。

##### 模型选择

#### 方案 C: Gemini API（仅适合无中文文字的装饰图）

> ⚠️ **关键限制：Gemini 无法可靠渲染中文文字。** `gemini-2.5-flash-image` 返回的图片中，中文字符经常出现笔画缺失、位置偏移、乱码等问题。**不要用 Gemini 生成需要中文文字的封面图。** 仅适合生成纯装饰性背景图（无文字或只有英文文字）。

##### 模型选择

**当前可用模型**: `gemini-2.5-flash-image`

> ⚠️ 模型名称经常变化。如果调用失败，用以下命令查询最新可用模型：
> ```bash
> curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | python3 -c "
> import sys, json
> data = json.load(sys.stdin)
> for m in data.get('models', []):
>     name = m.get('name', '')
>     if 'image' in name.lower() or 'flash' in name.lower():
>         print(name)
> "
> ```

##### API Key 格式

Gemini API Key 有两种格式：
- `AIzaSy...` — 旧格式，可能已失效
- `AQ.Ab8RN6...` — 新格式（2025+），从 https://aistudio.google.com/apikey 获取

如果旧格式 Key 返回 `API_KEY_INVALID`，去 AI Studio 重新生成。

##### REST API 调用方式

```bash
# 设置环境变量（一次性）
export GEMINI_API_KEY="<your-gemini-api-key>"

# 调用 Gemini 生成封面图
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Create a Xiaohongshu 3:4 portrait cover image. 大标题文字「{TITLE}」居中显示，使用白色粗体无衬线字体。副标题「{SUBTITLE}」在标题下方，字号较小。背景：深蓝到紫色科技感渐变。整体风格：现代简约、高级感、信息流中醒目。确保文字清晰可读，与背景有强对比。"
      }]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"]
    }
  }' > /tmp/gemini_response.json

# 提取图片并保存
python3 -c "
import json, base64
with open('/tmp/gemini_response.json') as f:
    data = json.load(f)
if 'candidates' in data:
    parts = data['candidates'][0]['content']['parts']
    for p in parts:
        if 'inlineData' in p:
            img_data = base64.b64decode(p['inlineData']['data'])
            with open('{{OUTPUT_DIR}}/cover.png', 'wb') as out:
                out.write(img_data)
            print(f'✅ Image saved! Size: {len(img_data)} bytes')
        elif 'text' in p:
            print(f'Text: {p[\"text\"][:200]}')
else:
    print('Error:', json.dumps(data, indent=2)[:500])
"
#### 方案 C: Gemini API（仅适合无中文文字的装饰图）

> ⚠️ **关键限制：Gemini 无法可靠渲染中文文字。** `gemini-2.5-flash-image` 返回的图片中，中文字符经常出现笔画缺失、位置偏移、乱码等问题。**不要用 Gemini 生成需要中文文字的封面图。** 仅适合生成纯装饰性背景图（无文字或只有英文文字）。

##### 模型选择

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
# 1. 调用 API
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "<prompt>"}]}],
    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
  }' > /tmp/gemini_response.json

# 2. 提取图片
python3 -c "
import json, base64
with open('/tmp/gemini_response.json') as f:
    data = json.load(f)
for p in data['candidates'][0]['content']['parts']:
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        with.open('{{OUTPUT_DIR}}/cover.png', 'wb') as out:
            out.write(img)
        print(f'✅ Saved: {len(img)} bytes')
"
```

输出文件保存到 `{{OUTPUT_DIR}}/cover.png`。

#### 方案 B: 国内 AI 图像服务

使用火山引擎 Doubao-Seedream-5.0 / 通义万相 / 文心一格 / 智谱 AI 等平台，prompt 与方案 A 相同。生成后下载图片到 `{{OUTPUT_DIR}}/cover.png`。

#### 方案 C: 纯本地 Pillow 脚本

```bash
python {{OUTPUT_DIR}}/generate_cover_local.py "{TITLE}" "{KEYWORDS}" "{{OUTPUT_DIR}}/cover.png"
```

> 脚本内容见"前置条件 → 方案 C"章节。首次使用需确保已安装 Pillow：`pip install Pillow`

#### 方案 D: 手动设计

打开 Canva / 稿定设计 → 搜索"小红书封面" → 选 3:4 模板 → 替换标题 → 导出到 `{{OUTPUT_DIR}}/cover.png`

#### 笔记排序注意

`xhs my-notes` 返回的笔记列表按**最新在前**排序。但用户通常按**发布时间从早到晚**计数（"第一篇"=最早发布的）。沟通时注意对齐，避免混淆。

### 封面图生成注意

- **必须用 Windows Python 执行 Pillow 脚本**，WSL 的 Python 没有 Pillow 模块
- Windows 路径中的反斜杠在 Python 字符串中需要双重转义 `\\\\`
- 生成后必须让用户确认封面效果，不要跳过确认直接发布

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

> ⚠️ **多图片必须用多个 `--images` 参数**，每个图片一个 `--images`。不能用逗号分隔或空格拼接。

```bash
# 单张图片
{{XHS_CLI}} post --title "标题" --body "正文" --images "path/to/cover.png"

# 多张图片（每个 --images 一张）
{{XHS_CLI}} post --title "标题" --body "正文" \
  --images "path/to/01.png" \
  --images "path/to/02.png" \
  --images "path/to/03.png"
```

#### 从 WSL 发布：脚本文件方式（推荐）🆕

> ⚠️ **致命陷阱：中文路径编码问题**。从 WSL 调用 Windows Python 时，命令行中的中文路径会被 GBK 编码破坏，导致 `can't open file` 或 `Got unexpected extra arguments` 错误。

**正确做法**：把发布逻辑写成 `.py` 脚本文件，放到纯英文路径，然后用 Windows Python 执行。

```python
# -*- coding: utf-8 -*-
# 保存到 C:\Users\Administrator\publish.py（纯英文路径！）
import sys, os
sys.stdout.reconfigure(encoding='utf-8')

# 图片也复制到纯英文路径
base = r"C:\Users\Administrator\temp_imgs"
images = [os.path.join(base, f) for f in ["01.jpg", "02.png", "03.png"]]

title = "你的标题"
body = """正文内容（可以包含中文）"""

from xhs_cli.cli import cli
args = ['post', '--title', title, '--body', body]
for img in images:
    args.extend(['--images', img])  # 每个图片单独 --images
cli(args)
```

执行：
```bash
# 从 WSL 调用（路径中不能有中文）
/mnt/c/Users/Administrator/AppData/Roaming/uv/tools/xiaohongshu-cli/Scripts/python.exe "C:\Users\Administrator\publish.py"
```

**完整发布流程（从 WSL）**：
1. 把图片复制到纯英文临时目录（如 `C:\Users\Administrator\temp_imgs\`）
2. 把发布脚本写到纯英文路径（如 `C:\Users\Administrator\publish.py`）
3. 用 Windows Python 执行脚本
4. 发布成功后清理临时文件

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

#### 📌 发布后记录

发布成功后，建议记录以下信息供后续回顾：

| 字段 | 示例值 |
|------|--------|
| 笔记 ID | `6a27d33b000000001700ae0e` |
| 标题 | FDE为什么突然爆火？一文讲透AI新风口 |
| 关键词 | AI FDE 前线部署工程师 |
| 发布时间 | 2026-06-09 17:00 |
| 封面方案 | 方案 A (Gemini) |
| 发布时的初始评分 | score: 10 |

可以追加到 `memory/YYYY-MM-DD.md` 或专门的发布日志文件中。

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

### 3.5. 中文路径被 GBK 破坏（WSL→Windows 调用）🆕

```
错误: can't open file 'C:\\...\\����VSĦ���\\...'
或: Got unexpected extra arguments (...����...)
```

**原因**：从 WSL 调用 Windows Python 时，命令行参数中的中文路径被 Windows 控制台 GBK 编码破坏。

**解决**：
1. 不要直接在命令行传中文路径参数
2. 把图片复制到纯英文路径（如 `C:\Users\Administrator\temp_imgs\`）
3. 把发布脚本写成 `.py` 文件放到纯英文路径
4. 在脚本内用 `os.path.join()` 构建路径（脚本内的字符串不受命令行编码影响）
5. 用 Windows Python 执行该脚本

详见 Step 9 "从 WSL 发布：脚本文件方式"。

### 3.6. xhs CLI 多图片发布：必须逐个 --images 🆕

```
错误: Got unexpected extra arguments (...)
```

**原因**：`--images` 参数只接受单张图片。多张图片必须用多个 `--images` 参数。

**正确做法**：
```python
args = ['post', '--title', title, '--body', body]
for img in images:
    args.extend(['--images', img])
cli(args)
```

```
错误: UnicodeEncodeError: 'gbk' codec can't encode character
```

解决：确认已设置 `$env:PYTHONUTF8="1"` 和 `$env:PYTHONIOENCODING="utf-8"`（见"环境变量"章节）

### 3.5. 中文路径被 GBK 破坏（WSL→Windows 调用）🆕

```
错误: can't open file 'C:\\...\\����VSĦ���\\...'
或: Got unexpected extra arguments (...����...)
```

**原因**：从 WSL 调用 Windows Python 时，命令行参数中的中文路径被 Windows 控制台 GBK 编码破坏。

**解决**：
1. 不要直接在命令行传中文路径参数
2. 把图片复制到纯英文路径（如 `C:\Users\Administrator\temp_imgs\`）
3. 把发布脚本写成 `.py` 文件放到纯英文路径
4. 在脚本内用 `os.path.join()` 构建路径（脚本内的字符串不受命令行编码影响）
5. 用 Windows Python 执行该脚本

详见 Step 9 "从 WSL 发布：脚本文件方式"。

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

### 9. 封面图生成后忘记确认就发布

封面图翻车没被发现就直接发布了。

解决：Step 8 已添加封面图校验环节（含用户确认），严格执行即可避免。

### 10. 笔记包含引用/参考来源

用户反馈笔记不能直接发布因为带有了原始笔记来源和参考资料。

解决：撰写时必须打散重组，不可保留「参考来源」段落。发布前用 Step 7.5 自检清单逐项检查。

### 10. 发布时 body 参数转义错误

长文本中包含引号、换行符等特殊字符导致命令解析失败。

解决：使用 PowerShell here-string `@"..."@` 格式传入 body（见 Step 9 示例）

### 11. 自动回复被判定为机器人行为 🆕

```
错误: 回复发送失败 / 账号被限制评论功能
或: 回复发出去了但别人看不到（shadow ban）
```

解决：
- 降低回复频率，每条间隔 30-60 秒
- 不要复制粘贴相同内容，每条评论的回复要有差异
- 不要在凌晨回复
- 如果连续被限制，暂停自动回复 24-48 小时
- 确保回复内容自然，不要有明显的模板痕迹

### 12. 回复内容不自然 / 翻车 🆕

AI 生成的回复太机械或答非所问。

解决：
- 调整 Step 10.3 的 prompt 模板，加入更多上下文（笔记主题、你的观点）
- 前几次手动确认每条回复质量后再发送
- 加入"回复预览"环节：先生成所有回复内容让你过目，确认后再批量发送

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
- [ ] （可选）自动回复新评论

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
| 评论回复率 | ≥80% 的新评论在 24h 内回复 |
| 回复风格 | 友好自然，合理使用 emoji，不机械 |

---

## Step 10: 自动回复评论区互动 🆕

> 发布后持续监控评论，自动回复新评论，保持互动热度。评论区活跃度直接影响小红书算法推荐。

### 触发方式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **手动触发** | 用户说"帮我回复评论" | 随时执行一次 |
| **定时触发** | 配合 cron job 每 2-4 小时执行 | 笔记发布后 48h 内 |
| **发布后自动** | Step 9 发布完成后自动进入 | 全流程模式 |

### Step 10.1: 检查未读评论通知

```bash
# 查看未读通知概览
{{XHS_CLI}} unread

# 获取评论和@通知详情
{{XHS_CLI}} notifications --type mentions --json
```

返回的 JSON 中包含：
- `comment_id` — 评论 ID
- `note_id` — 所属笔记 ID
- `content` — 评论内容
- `nickname` — 评论者昵称
- `time` — 评论时间

### Step 10.2: 过滤需要回复的评论

不是所有评论都需要回复。按以下规则过滤：

| 评论类型 | 是否回复 | 原因 |
|----------|----------|------|
| 提问类（"怎么做？""在哪里？"） | ✅ 必须回复 | 真实需求，回复能涨好感 |
| 正面评价（"写得好""收藏了"） | ✅ 回复感谢 | 维护粉丝关系 |
| 负面/质疑 | ✅ 礼貌回复 | 展示专业度，化解争议 |
| 纯表情/无意义 | ❌ 跳过 | 回复显得机械 |
| 广告/引流 | ❌ 跳过 | 不值得互动 |
| 已回复过的 | ❌ 跳过 | 避免重复回复 |

#### 已回复记录管理

维护一个本地记录文件 `{{OUTPUT_DIR}}/replied_comments.json`，避免重复回复：

```json
{
  "replied": [
    {
      "comment_id": "xxx",
      "note_id": "yyy",
      "replied_at": "2026-06-09T20:00:00",
      "reply_content": "谢谢支持！😊"
    }
  ]
}
```

每次执行前先读取该文件，跳过已回复的 `comment_id`。

### Step 10.3: AI 生成回复内容

根据评论内容，用 AI 生成自然、有个性的回复。

#### 回复风格指南

| 原则 | 说明 | 示例 |
|------|------|------|
| **像真人说话** | 不要官方腔，像朋友聊天 | ✅ "哈哈对的！" ❌ "感谢您的关注与支持" |
| **适度用 emoji** | 每条回复 1-2 个 emoji，不要堆砌 | ✅ "谢谢喜欢～🥰" ❌ "谢谢🥰🥰🥰❤️❤️❤️" |
| **回复要有信息量** | 不要只说"谢谢"，补充点内容 | ✅ "谢谢！其实我还测了XX方向，改天写一篇" |
| **对提问认真回答** | 提问是最好的互动机会 | ✅ "在某宝搜XX就行，我用的XX牌子，挺好用的" |
| **对质疑保持礼貌** | 不要怼人，用事实回应 | ✅ "理解你的顾虑，其实..." |
| **控制长度** | 回复 1-3 句话，不要写小作文 | 20-80 字为宜 |

#### 回复 Prompt 模板

```
你是一个小红书博主，正在回复粉丝的评论。请根据以下信息生成回复：

笔记标题：{NOTE_TITLE}
笔记主题：{NOTE_TOPIC}
评论内容：{COMMENT_CONTENT}
评论者昵称：{NICKNAME}
评论类型：{提问/正面评价/质疑/其他}

回复要求：
1. 语气亲切自然，像朋友聊天
2. 使用 1-2 个 emoji，不要堆砌
3. 如果是提问，认真回答并给出具体建议
4. 如果是正面评价，表示感谢并适当补充
5. 如果是质疑，礼貌回应，不要怼人
6. 控制在 1-3 句话，20-80 字
7. 不要出现"作为AI"之类的表述
8. 不要用"您"，用"你"就行

直接输出回复内容，不要加引号或前缀。
```

#### 常用回复模板（快速参考）

| 评论类型 | 回复模板 | emoji 推荐 |
|----------|----------|------------|
| "写得好/收藏了" | "谢谢喜欢～后面还会更新XX方向，记得关注哦" | 🥰 👍 ✨ |
| "怎么做到的？" | "其实核心就是XX，具体方法我改天单独出一篇详细教程" | 💡 🔥 |
| "在哪里买？" | "某宝搜XX就行，我用的XX牌子，亲测好用" | 🛒 👀 |
| "这个不行吧" | "理解你的顾虑～其实我一开始也担心，但试下来效果还不错，主要是..." | 🤔 💪 |
| "能教教我吗" | "当然可以！你可以先从XX开始，有问题评论区随时问我" | 😄 🙌 |
| "太贵了" | "确实不便宜哈哈，不过性价比还行，也有平替方案，我后面写一篇" | 😂 💰 |

### Step 10.4: 发送回复

```bash
# 回复指定评论
{{XHS_CLI}} reply <note_id> --comment-id <comment_id> -c "<回复内容>"
```

### Step 10.5: 记录回复日志

每次回复后，追加到 `{{OUTPUT_DIR}}/replied_comments.json`：

```python
import json
from datetime import datetime

def log_reply(note_id, comment_id, reply_content, output_dir):
    log_path = f"{output_dir}/replied_comments.json"
    try:
        with open(log_path, 'r') as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {"replied": []}
    
    data["replied"].append({
        "comment_id": comment_id,
        "note_id": note_id,
        "replied_at": datetime.now().isoformat(),
        "reply_content": reply_content
    })
    
    with open(log_path, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
```

### Step 10.6: 频率控制 ⚠️

> 不要短时间大量回复，会被小红书判定为机器人行为。

| 规则 | 说明 |
|------|------|
| **单次上限** | 每次执行最多回复 10 条评论 |
| **回复间隔** | 每条回复之间间隔 30-60 秒（随机） |
| **每日上限** | 同一篇笔记每天最多回复 20 条 |
| **执行频率** | 建议每 2-4 小时执行一次，不要超过每 1 小时一次 |
| **活跃时段** | 只在 8:00-23:00 回复，凌晨不要回复 |

#### 间隔实现

```bash
# 每条回复后随机等待 30-60 秒
sleep $((RANDOM % 31 + 30))
```

### Step 10.7: 完整执行流程

```
1. 读取 replied_comments.json → 获取已回复列表
2. xhs unread → 检查是否有未读评论
3. xhs notifications --type mentions --json → 获取评论通知
4. 过滤：跳过已回复的 / 纯表情的 / 广告的
5. 对每条评论：
   a. 分析评论类型（提问/正面/质疑/其他）
   b. 用 AI 生成回复（按 Step 10.3 的 prompt 模板）
   c. xhs reply <note_id> --comment-id <id> -c "<回复>"
   d. 记录到 replied_comments.json
   e. 等待 30-60 秒
   f. 如果已回复 10 条 → 停止
6. 输出本次回复统计：回复了几条、跳过了几条
```

### 配合 cron job 自动执行（可选）

> 如果你想让评论回复全自动运行，可以用 Hermes 的 cron job 功能。

```bash
# 示例：每 3 小时检查一次新评论并自动回复
# 在 Hermes 中设置 cron job
```

> ⚠️ **建议**：至少前几次手动执行，确认回复质量 OK 后再开自动模式。自动回复翻车（回复内容不当）比不回复更糟糕。
