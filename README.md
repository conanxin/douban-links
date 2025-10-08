# Douban Custom Links (豆瓣外链直达 · 强校验)

在 **豆瓣 电影/图书详情页** 的右侧栏插入“外链直达”模块：根据页内信息自动生成到第三方站点的搜索链接，并在**后台强校验**确认该站点确有结果时才显示按钮。遇到跨域/反爬拦截，还提供**强制显示**兜底 + 站点**自动填词提交**适配器。

> 适用：Chrome（Manifest V3）。
> 关键词策略覆盖 **中英名 + 年份** / **ISBN** 等，开箱即用，站点可自定义。

---

## ✨ 特性

* **右侧栏模块**（不遮挡）：粘性布局、样式轻量。
* **多关键词强校验**：电影优先 *英文名 + 年份*，再到中文名/又名等；图书优先 ISBN。
* **只显示有结果的站点**：后台抓取站点“搜索页”并用**正则**判断是否命中结果。
* **网络受限智能回退**：CORS/超时无法判定时，提供“**强制显示所有站点**”按钮；落地页会自动填词提交。
* **站点可配置**：在选项页新增/删除站点（`{key}` 占位符），选择启用在“电影/书籍”。
* **无侵入**：不修改豆瓣原页面功能；无用户数据上报。

---

## 🚀 快速开始

### 方式一：加载已解压扩展

1. 下载或克隆本仓库到本地。
2. 打开 `chrome://extensions` → 开启**开发者模式**。
3. 点击“**加载已解压的扩展程序**”，选择仓库根目录。
4. 打开任意豆瓣电影（或图书）详情页，右侧会出现「外链直达」卡片。

### 方式二：打包 ZIP 后加载

1. 将仓库内容打包为 ZIP。
2. `chrome://extensions` → “加载已解压的扩展程序” → 选择解压后的文件夹。

---

## 🧭 默认站点 & 搜索 URL 模板

> `{key}` 为关键词占位符（由页面解析与策略生成）。

| 站点          | URL 模板                                                       | 适用 |
| ----------- | ------------------------------------------------------------ | -- |
| 巧眯网         | `http://www.qiaomi.cn/s/{key}`                               | 电影 |
| 人人电影网       | `https://www.rrdynb.com/plus/search.php?q={key}&pagesize=10` | 电影 |
| 人人影视（YYeTs） | `https://yyets.click/search?keyword={key}&type=default`      | 电影 |
| 微信读书        | `https://weread.qq.com/web/search/books?keyword={key}`       | 书籍 |
| 京东图书        | `https://search.jd.com/Search?keyword={key}`                 | 书籍 |
| Bilibili 搜索 | `https://search.bilibili.com/all?keyword={key}`              | 电影 |
| YouTube 预告  | `https://www.youtube.com/results?search_query={key}+trailer` | 电影 |

你可以在**选项页**自由增删（见下）。

---

## 🔍 关键词策略

### 电影

顺序尝试（命中即停）：

1. `英文名 + 空格 + 年份`（例：`Fahrenheit 451 1966`）
2. `中文名 + 空格 + 年份`
3. `又名 + 空格 + 年份`
4. `英文名`
5. `中文名`
6. `又名`

> 字段来源：
>
> * 中文名：`#content h1 span[property="v:itemreviewed"]`（去掉尾部 `(YYYY)`）
> * 年份：`#content h1 .year`（去括号）
> * 又名/外文名：在 `#info` 文本中匹配“又名/外文名/原名/英文名”行

### 图书

1. `ISBN`（优先）
2. `书名 + 空格 + 作者`
3. `书名`

> 字段来源：
>
> * 书名：`#wrapper h1 span`
> * 作者/ISBN：在 `#info` 文本中匹配“作者/ISBN”行

---

## 🛡️ 强校验（Only show when results exist）

后台 Service Worker (`bg.js`) 会对每个站点的候选“搜索页 URL”执行 `fetch` 并读取 HTML 文本，用**正则/字符串特征**判断是否有结果（不使用 DOMParser，兼容 MV3 Worker）。

示例特征（任一命中即判定为真）：

* **巧眯网**

  * 链接：`/play`、`vod-detail`、`/detail`
  * 列表类：`xing_vb`、`module-items`、`search-list`
  * 文案信号：含 `搜索结果|找到|条结果|资源` 且包含关键词
* **人人电影网**

  * 链接：`m=vod-detail`、`/voddetail`、`/play/`
  * 列表类：`module-items`、`search-list`
  * 文案信号同上
* **人人影视（YYeTs）**

  * 链接：`/resource/`、`/detail/`
  * 列表类：`search-result`、`list`
  * 文案信号：`搜索|结果|资源|字幕`

**回退策略**：如果全部请求都因 CORS/超时等**无法判定**，前端会出现“未命中结果 + **强制显示所有站点**”按钮；点击后，照 `{key}` 的首选关键词渲染所有站点按钮，并在 URL 尾部追加 `#extkey=<key>` 用于落地页自动提交。

---

## 🧩 站点适配器（自动填词提交）

`adapters.js` 注入到目标站。当用户被带到站点首页或非结果页时：

* 从 `location.hash` 读取 `extkey`；
* 自动写入站点的搜索输入框并提交表单。

选择器（择一命中即可）：

* **巧眯网**：`input[name="wd"]` / `#wd` / `input[type="text"]`；提交 `.search_btn` 或 `form.submit()`
* **人人影视**：`input[name="keyword"]` / `input[type="search"]` / `input[type="text"]`；`form.submit()` 或按钮点击
* **人人电影网**：`input[name="wd"]` / `input[type="text"]`；`form.submit()` 或按钮点击

---

## ⚙️ 配置（Options）

打开扩展的**选项页**可：

* 新增/删除站点（字段：`name`、`urlTemplate`、`enableOn` = `["movie"] | ["book"] | ["movie","book"]`）
* 开关：

  * **调试日志**（默认开）：页面 Console 打印 `[DCL] ...`
  * **模式**（可选项，若已实现）：

    * 严格模式：仅显示后台确认命中的站点
    * 智能回退：无法确认时提供“强制显示所有站点”

---

## 📁 目录结构

```
/assets/icon128.png
manifest.json
bg.js            # 强校验（抓取 + 正则判定）+ 回退
content.js       # 解析豆瓣、生成关键词、渲染卡片、与后台通信
content.css      # 右侧卡片样式
adapters.js      # 目标站自动填词提交
options.html     # 自定义站点 & 开关
```

---

## 🔧 开发与调试

* 前端日志：页面 `F12 → Console`（开启调试开关后会打印）
* 后台日志：`chrome://extensions → 该扩展 → Service Worker`
* 右侧模块**总会先渲染**；若按钮迟迟不出，多半是强校验被拦，可点“强制显示所有站点”验证。

---

## ✅ 验收用例（示例）

* 页面：《华氏451度 (1966)》

  * 关键词尝试序列包含：`Fahrenheit 451 1966`、`华氏451度 1966`、`Fahrenheit 451`、`华氏451度`
  * 任一站点能搜到时，对应按钮必须出现
  * 全部被拦截时，显示“强制显示所有站点”，点击可用；落地页自动填词提交
* 书籍详情页：ISBN 存在时优先使用 ISBN 搜索
* UI：模块位于 `.aside` 顶部，`position: sticky; top: 16px;`，不遮挡

---

## 🔒 权限与隐私

* 仅使用 `storage` 与站点 `host_permissions`；不采集用户数据，不上传外部服务。
* 后台请求仅用于**检测指定搜索页是否存在结果**，不做内容存储。

---

## 🗺️ Roadmap

* [ ] 选项页增加“严格/回退模式”切换
* [ ] 站点规则“表驱动”与热修
* [ ] 更多站点预设与测试用例
* [ ] 暗色模式 & 微动画

---

## 🧩 兼容性

* Chrome 120+（MV3）
* 桌面端，中文/英文豆瓣界面均可（若选择器变动，可适度放宽）

---

## 🤝 贡献

欢迎 PR / Issue：

* 新站点支持（提供示例搜索 URL 与“命中特征”片段）
* 关键词策略改进 / 解析选择器修正
* UI/UX 优化

---

## 📄 许可

MIT License

---
