# 饮食库 · 食材与菜谱

手机优先、本地优先、可安装的**自托管静态 PWA**。管理菜谱、食材库存、采购清单、做饭记录与剩菜提醒。
**不记账、不记花费、不接外部菜谱服务、不需要后端、不需要构建步骤。**

> 仓库内所有菜谱 / 库存 / 采购清单 / 做饭记录 / 剩菜均为**示例假数据**（`js/recipe-book.js` + `js/seed.js`），
> 首次运行时按当天日期生成，不含任何真实家庭数据。

**菜谱取向：湘菜 + 家常菜，各 20 道，共 41 道**（湘菜 20 + 家常菜 20 + 早餐 1；其中 4 道同时带两个标签，所以「家常」标签计数为 24），
配 56 种食材，含剁椒、豆豉、螺丝椒、小米辣、鱼头、黄牛肉、腊肉、外婆菜、酸豆角、藕尖、香干、皮蛋、茶树菇、紫苏等湘味食材。
菜谱内容全部集中在**独立数据文件 `js/recipe-book.js`**，可随时更新（见第三节）。
`js/store.js` 里 `PREFERRED_TAGS = [{湘菜,+30},{家常,+18}]` 给这两类加权：推荐 Top3 与菜谱列表默认优先展示它们；
首页 Hero 也有「湘菜菜谱 / 家常菜谱」直达入口。**加权值刻意小于「临期食材 +100/样」，不会破坏临期优先这条硬规则。**

---

## 一、数据模型

逻辑上是 5 张主表 + 2 张字典表 + 1 张元数据表；实现上序列化为**一个 JSON 快照**，写入浏览器 `localStorage`。
`category` / `unit` 直接存**名称字符串**（而非外键 id），字典表作为可选值注册表与约束——这样导入 CSV / 手工编辑时不会产生悬空引用，等价于逻辑外键 `→ Category.name` / `→ Unit.name`。

### 1. Ingredient 食材库存

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string, PK | `ing_xxx`，新增时用前缀 + 时间戳 + 随机串 |
| `name` | string | 名称，非空 |
| `category` | string | 逻辑 FK → `Category.name` |
| `unit` | string | 逻辑 FK → `Unit.name` |
| `quantity` | number ≥ 0 | 库存数量，两位小数 |
| `expiresAt` | string \| null | 到期日 `YYYY-MM-DD`，空 = 不提醒 |
| `location` | string | 冷藏 / 冷冻 / 常温 … |
| `note` | string | 备注 |
| `createdAt` / `updatedAt` | string \| null | 建议补充字段，ISO 8601，便于追溯 |

### 2. Recipe 菜谱

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string, PK | `r_xxx` |
| `title` | string | 标题 |
| `servings` | number ≥ 1 | **建议补充**：基准份数，食材用量按它换算 |
| `ingredients` | `RecipeIngredient[]` | 内嵌数组：`{ ingredientId: string, quantity: number, unit: string }` |
| `steps` | string[] | 步骤（有序） |
| `tags` | string[] | 标签 |
| `lastCookedAt` | string \| null | 上次做的时间，ISO 8601；从 `CookLog` 反规范化，避免推荐时全表扫描 |
| `createdAt` | string \| null | 建议补充字段 |

关系：`Recipe.ingredients[].ingredientId → Ingredient.id`，一对多（多对多的连接表内嵌在菜谱里）。

### 3. CookLog 做饭记录

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string, PK | `cl_xxx` |
| `recipeId` | string, FK → `Recipe.id` | 允许悬空（菜谱被删后仍保留记录） |
| `cookedAt` | string | ISO 8601 时间 |
| `servings` | number | 份数 |
| `note` | string | 备注 |
| `deductions` | `{ingredientId, quantity, unit}[]` | **建议补充**：本次扣库存明细，用于手动修正后追溯 |

### 4. ShoppingItem 采购清单

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string, PK | `sh_xxx` |
| `name` | string | 名称 |
| `quantity` | number | 数量 |
| `unit` | string | 单位 |
| `done` | boolean | 是否完成 |
| `source` | string | 来源：`手动` / `低库存` / `缺料:<菜谱名>` |
| `createdAt` | string | 建议补充字段 |

### 5. Leftover 剩菜

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string, PK | `lf_xxx` |
| `recipeId` | string, FK → `Recipe.id` | 可为空（手动登记） |
| `cookedAt` | string | 做好时间 |
| `expiresAt` | string | 到期时间 |
| `note` | string | 备注 |
| `status` | `'active' \| 'eaten' \| 'discarded'` | **建议补充**：时间线状态，默认 `active` |

### 6. 辅助表

- `Category { id, name, sortOrder }`、`Unit { id, name, sortOrder }`：设置页可增删，被引用时禁止删除。
- `meta { schemaVersion, expiryWindowDays=3, defaultServings=2, leftoverDays=3, lowStockThreshold=1, theme, recipeFocus, seedVersion=3, recipeBookVersion=3 }`。`seedVersion` 是初始示例数据版本，`recipeBookVersion` 是菜谱书版本；两者共同控制增量更新（见第三、八节）。
- `Recipe.custom:boolean`（建议补充）：标记用户自建或改过的菜谱，菜谱库更新时按 id 保留、不覆盖。
- 顶层：`schemaVersion=1`、`app`、`format='foodpantry-full'`、`exportedAt`。

### 索引建议（迁移到 IndexedDB / SQLite 时）

| 表 | 索引 | 用途 |
| --- | --- | --- |
| `Ingredient` | `expiresAt`（升序）、`(expiresAt, quantity)` 复合 | 临期扫描、今天吃什么 |
| `Ingredient` | `category`、`name` | 分类筛选、搜索 |
| `Recipe` | `lastCookedAt`、`title`、`tags`（多值） | 「最近没做过」排序、搜索 |
| `CookLog` | `cookedAt` DESC、`recipeId` | 时间线、查上次做的时间 |
| `ShoppingItem` | `done`、`createdAt` | 待买/已完成分组、清空已完成 |
| `Leftover` | `expiresAt`、`status` | 到期提醒 |

当前数据量（几百条）全部在内存里过滤排序，localStorage 版**不需要**显式索引。

### 种子数据示例（`js/recipe-book.js` + `js/seed.js` 装配结果，节选）

```json
{
  "meta": { "expiryWindowDays": 3, "defaultServings": 2, "leftoverDays": 3, "recipeFocus": "湘菜 + 家常菜" },
  "ingredients": [
    { "id": "ing_qingjiao", "name": "青椒", "category": "蔬菜", "unit": "个", "quantity": 6, "expiresAt": "<今天+2天>", "location": "冷藏", "note": "临期，螺丝椒更香" },
    { "id": "ing_duojiao", "name": "剁椒", "category": "调味", "unit": "瓶", "quantity": 1, "expiresAt": "<今天+90天>", "location": "冷藏", "note": "湘菜灵魂" },
    { "id": "ing_tofu", "name": "嫩豆腐", "category": "乳品豆制", "unit": "盒", "quantity": 2, "expiresAt": "<今天+1天>", "location": "冷藏", "note": "临期" },
    { "id": "ing_bread", "name": "吐司", "category": "主食谷物", "unit": "袋", "quantity": 0, "expiresAt": "<今天+6天>", "location": "常温", "note": "库存为 0，用来演示缺料" }
  ],
  "recipes": [
    { "id": "r_chili_pork", "title": "辣椒炒肉", "servings": 2,
      "ingredients": [{"ingredientId":"ing_qingjiao","quantity":3,"unit":"个"},{"ingredientId":"ing_wuhuarou","quantity":150,"unit":"克"}],
      "steps": ["青椒切滚刀块，五花肉切薄片", "…"], "tags": ["湘菜","家常","下饭","快手"], "lastCookedAt": "<9天前的ISO时间>" },
    { "id": "r_tomato_egg", "title": "番茄炒蛋", "servings": 2,
      "ingredients": [{"ingredientId":"ing_tomato","quantity":2,"unit":"个"},{"ingredientId":"ing_egg","quantity":3,"unit":"个"}],
      "steps": ["番茄切块，鸡蛋打散", "…"], "tags": ["家常","快手","素"], "lastCookedAt": "<12天前的ISO时间>" }
  ],
  "cookLogs": [
    { "id": "cl_1", "recipeId": "r_egg_noodle", "cookedAt": "<昨天19:10>", "servings": 2, "note": "多加了一勺生抽", "deductions": [] }
  ],
  "shoppingItems": [
    { "id": "sh_1", "name": "牛奶", "quantity": 1, "unit": "盒", "done": false, "source": "手动" },
    { "id": "sh_3", "name": "蚝油", "quantity": 1, "unit": "瓶", "done": true, "source": "手动" }
  ],
  "leftovers": [
    { "id": "lf_2", "recipeId": "r_fried_rice", "cookedAt": "<2天前>", "expiresAt": "<今天>", "note": "今天把它吃掉", "status": "active" }
  ]
}
```

种子里日期用「相对今天」生成（`<今天+1天>` 等），因此无论哪天首次打开，「临期食材优先」的演示都成立。

### 示例菜谱清单（全部假数据）

| 取向 | 菜谱 |
| --- | --- |
| **湘菜（20）** | 辣椒炒肉、剁椒鱼头、小炒黄牛肉、酸豆角肉末、擂辣椒皮蛋、外婆菜炒蛋、毛氏红烧肉、干锅茶树菇、剁椒蒸豆腐、农家一碗香、东安子鸡、腊味合蒸、剁椒蒸芋头、手撕包菜、干锅花菜、攸县香干炒肉、酸辣藕尖、小炒猪肝、湘味红烧鱼块、紫苏煎黄瓜 |
| **家常菜（20）** | 番茄炒蛋、醋溜土豆丝、青椒肉丝、蒜蓉西兰花、小葱拌豆腐、葱油鸡蛋面、胡萝卜炒蛋、蛋炒饭、红烧茄子、香菇滑鸡、家常豆腐煲、西兰花炒鸡胸、土豆肉末、虾仁汤面、可乐鸡翅、糖醋排骨、西红柿鸡蛋汤、蒜薹炒肉、清炒上海青、肉末蒸蛋 |
| **其他（1）** | 芝士烤吐司（库存为 0，用来演示「缺料提示」） |

其中辣椒炒肉、外婆菜炒蛋、农家一碗香、手撕包菜同时带「湘菜」「家常」两个标签。
新增菜谱时在 `tags` 里写 `湘菜` 或 `家常` 就会被自动优先；在 `js/store.js` 的 `PREFERRED_TAGS` 里可调整取向与权重。

---

## 二、页面骨架

单列、移动端优先；底部 5 个 Tab + 顶栏齿轮进入设置。所有交互 **≥44px 触摸目标**，支持键盘导航与 `focus-visible`、浅/深/跟随系统主题、WCAG AA 对比度。

```
┌─────────────────────────────┐
│ 顶栏：标题 + 副标题      [⚙] │  ← 详情/设置页变为 [←] + 标题
├─────────────────────────────┤
│                             │
│  单列内容区（卡片 / 列表）   │
│                             │
│                    [＋ 悬浮] │  ← 库存、菜谱页的新增按钮
├─────────────────────────────┤
│ 今天  库存  菜谱  采购  记录 │  ← 底部导航，固定在 480px 列内
└─────────────────────────────┘
```

| 页面 | 区块（自上而下） | 关键交互 |
| --- | --- | --- |
| **今天吃什么** | Hero（规则说明 + 随机一个 + **湘菜/家常菜直达 chips**）→ 剩菜到期提醒 → **临期食材条** → 推荐菜谱 Top3（带取向徽章）→ 快捷入口 | 临期食材 chip 点击 = 只看含它的菜谱；取向 chip 点击 = 按标签浏览；随机结果可直接「做了」 |
| **库存列表** | 搜索 → 分类 chips → 「仅看临期 / 排序」 → 汇总条 → 食材行 | 每行 `[−] 数量+单位 [+]` 一键增减（就地更新，不跳页）；点数字进编辑弹层 |
| **菜谱列表 / 详情** | 搜索 → 标签 chips（**湘菜/家常排最前**）→ 卡片列表（**取向优先排序 + 取向徽章**）；详情：份数步进器 → 缺料提示 → 食材清单 → 步骤 → 操作 | 详情显示「缺哪几样」并可一键加入采购；「做了」弹出可修正的扣库存面板 |
| **采购清单** | 汇总 → 内联新增表单 → 待买列表 → 已完成列表 | 大号勾选框；「清空已完成」带撤销；「低库存补货」 |
| **做饭记录 / 剩菜** | 分段控件 → 时间线（按日期分组） | 做饭记录可展开扣库存明细；剩菜按到期排序、标记吃完 |
| **设置** | 导出/导入 → 存储信息 → 分类/单位管理 → 偏好 → 安装与更新 | JSON 全量、CSV 分表、导入前自动备份、回滚、重置示例、清空 |

**推荐规则（本地纯计算，`js/store.js` 的 `recommend`）**
每道菜打分：用到临期食材 `+100` / 已过期 `+55`；每项食材齐备 `+6`；全部齐备 `+40`，缺一项 `-12`；距上次做 `min(天数,30) × 2`，没做过 `+55`，今天刚做过 `-50`；**菜谱取向加权：湘菜 `+30`、家常 `+18`**（可累加，上限 `+48`）。按分数 → 临期数量 → 标题排序取 Top3。

两层优先互不冲突：**取向加权最大 `+48`，远小于单样临期食材 `+100`**，所以「临期食材优先」始终成立；在临期程度相近时，湘菜 / 家常菜会排到前面。`tools/smoke-test.js` 里有断言守住这个约束。

---

## 三、随时更新菜谱库 / 目录结构

### 菜谱书：`js/recipe-book.js`

菜谱与食材目录抽成了**独立纯数据文件**，改菜谱不用碰任何逻辑代码：

```js
// 1) 加食材（也可以不写，菜谱里出现新名字会自动补建库存项）
I('ing_larou','腊肉','肉蛋','克',300,60,'冷藏','')

// 2) 加菜谱：R(id, 标题, 份数, 标签, 上次做距今几天|null, 食材[[名,量,单位]], 步骤[])
R('r_new_dish','新菜名',2,['湘菜','快手'],null,
  [['青椒',2,'个'],['五花肉',150,'克']],
  ['第一步','第二步'])

// 3) 把顶部 VERSION 加 1
var VERSION = 4;
```

菜谱里食材用**中文名称**引用（不是 id），装配器 `RecipeBook.assemble()` 负责映射成 `ingredientId`；
目录里没有的名字会**自动补建一个库存为 1 的食材**（分类「未分类」），永远不会产生悬空引用。

### 四种更新方式

| 方式 | 操作 | 影响范围 |
| --- | --- | --- |
| 1. 应用内逐条改 | 菜谱页右下角「＋ 新增菜谱」，或详情里「编辑 / 删除」 | 立即生效，标记为 `custom:true` |
| 2. 菜谱库 JSON 往返 | 设置 → 菜谱库 →「导出菜谱库」→ 用文本编辑器改 →「导入菜谱库」 | 只换菜谱，库存/采购/记录/剩菜完全不动 |
| 3. 改仓库数据文件 | 编辑 `js/recipe-book.js` 并把 `VERSION` 加 1 → 提交推送 | 所有设备下次打开**自动增量更新**，旧数据先备份 |
| 4. 导入别人的菜谱库 | 设置 →「导入菜谱库」选 JSON | 同上，支持任何符合格式的文件 |

设置页还有「重新载入内置菜谱书」按钮，可随时手动把内置菜谱拉回来（保留自建菜谱）。

### 增量更新保证（`js/store.js` 的 `applyRecipeBook`）

更新菜谱时**不重置业务数据**，明确保留：

- 现有食材的库存数量 / 到期日 / 位置 / 备注，以及用户自建食材
- `custom:true` 的菜谱（自建或改过的，按 id 去重，不会被内置菜谱覆盖或产生重复）
- 已有菜谱的 `lastCookedAt`（上次做的时间）
- 采购清单、做饭记录、剩菜、分类、单位、主题偏好
- 更新前把旧库自动写入 `foodpantry.db.backup.v1`，可在「设置 → 回滚到导入前」找回

`load()` 检测 `meta.recipeBookVersion < RecipeBook.VERSION`（或 `seedVersion` 落后）时触发；
导入 JSON / 回滚时会调用 `markSeedCurrent()` 标记为当前版本，不会被反复覆盖。

### 目录结构

```
food-pantry/
├─ index.html                 应用外壳（按顺序加载 4 个 JS）
├─ styles.css                 设计令牌 / 组件 / 响应式 / 主题
├─ manifest.webmanifest       PWA 清单（standalone、192/512 图标、相对路径）
├─ sw.js                      离线缓存（只缓存静态文件）
├─ js/
│  ├─ recipe-book.js          ★ 菜谱书：41 道菜 + 56 种食材 + 装配/导入导出（改这里）
│  ├─ seed.js                 示例数据装配器（做饭记录 / 采购 / 剩菜 / 元数据）
│  ├─ store.js                数据层：持久化、增量更新、导入导出、推荐、扣库存
│  └─ app.js                  界面与交互
├─ icons/                     favicon.svg / icon-192.png / icon-512.png / icon-180.png
├─ tools/
│  ├─ make_icons.py           纯标准库 PNG 图标生成器
│  └─ smoke-test.js           Node 冒烟测试（验收项）
└─ README.md
```

---

## 四、本地运行与手机访问

本项目是**纯静态文件**，没有 `npm install`、没有构建、没有后端。

### 方式 A：本机直接看
双击 `index.html` 也能用，但 `file://` 下 Service Worker 与「安装应用」不可用，部分浏览器还会限制 `localStorage`。**建议用方式 B。**

### 方式 B：本机 HTTP + 手机同一 Wi-Fi（立即可用的手机网址）

```bash
cd food-pantry
python -m http.server 4173 --bind 0.0.0.0
```

查本机局域网 IP（Windows：`ipconfig`，找「IPv4 地址」，形如 `192.168.1.23`；macOS/Linux：`ifconfig | grep inet`）。
手机连**同一个 Wi-Fi**，浏览器打开：

```
http://192.168.1.23:4173/
```

> 这是局域网地址，只在家里 Wi-Fi 内、且电脑开着服务时有效；HTTP 下 PWA 安装受限，但功能完整。
> 想获得**长期可用、可安装的 HTTPS 网址**，见下一节（需你先授权）。

---

## 五、部署到一个手机能长期访问的网址（**需先授权**）

推荐 **GitHub Pages**（静态托管、免费 HTTPS、符合「不引入重后端」）。流程：

1. 你提供仓库地址 + 分支，并授予写权限、部署权限（见第八节清单）。
2. 我把本目录文件推到该分支（只提交示例假数据，`.gitignore` 已排除导出文件）。
3. 在仓库 `Settings → Pages` 选择部署分支与根目录，或用 GitHub Actions 部署 Pages。
4. 得到 `https://<用户名>.github.io/<仓库名>/`，手机浏览器打开即为 HTTPS 网页应用。
5. `manifest.webmanifest` 与 `sw.js` 全部使用**相对路径**（`start_url: "./"`、`scope: "./"`），所以部署在子路径下也能正常安装和离线使用。

**手机安装**
- Android Chrome：打开网址 → 右上角菜单 →「安装应用 / 添加到主屏幕」→ 桌面出现图标，全屏运行、支持离线。
- iPhone Safari：打开网址 → 分享 →「添加到主屏幕」。
- 设置页也有「安装到手机」按钮（浏览器触发 `beforeinstallprompt` 时可用）。
- 要求：HTTPS（GitHub Pages 自带）或 `localhost`；HTTP 局域网地址不能安装。

其他可选：Cloudflare Pages / Vercel / 你自己的 Nginx 静态目录——步骤相同，把本目录原样发布即可。

---

## 六、库存数据到底存在哪里

| 项 | 位置 |
| --- | --- |
| 业务数据 | **浏览器 `localStorage`**，键 `foodpantry.db.v1`，值为整个 JSON 快照 |
| 导入前自动备份 | 同域 `localStorage`，键 `foodpantry.db.backup.v1` |
| 离线静态资源 | Service Worker 缓存 `foodpantry-static-v1`（只有 HTML/CSS/JS/图标，**不缓存数据**） |
| 服务器 | **没有任何业务数据**，全部留在设备本地 |

要点：
- 数据**不上传服务器、不跨设备自动同步**；换手机 / 换浏览器请用 JSON 导出→导入手动迁移。
- `localStorage` 通常约 5MB 配额，本项目几百条记录远远够用。
- **清除浏览器数据 / 卸载 PWA / 换浏览器会丢数据** → 请定期在「设置」导出 JSON。
- 同一网址下，手机上装成 PWA 与普通浏览器标签页共享同一份 `localStorage`。

---

## 七、导入导出验证（照做即可验收）

**JSON 全量往返（推荐，可完整恢复）**
1. 设置 →「导出 JSON 全量备份」→ 得到 `饮食库-YYYY-MM-DD.json`。
2. 去库存页把「番茄」数量点几下 `+`，再去采购页勾掉一项。
3. 设置 →「导入 JSON」→ 选刚才的文件 → 提示 `导入成功：21 种食材 / 10 道菜（旧数据已备份）`。
4. 回到库存 / 采购页，番茄数量与勾选状态应恢复为导出时的值。
5. 若想回到第 2 步之后的状态：设置 →「回滚到导入前」。

**CSV 分表往返**
1. 设置 → 选「食材库存」→「导出 CSV」→ 得到带 UTF-8 BOM 的 CSV，可直接用 Excel 打开。
2. 改一行的 `quantity`，保存。
3. 设置 → 导入目标选「食材库存」、方式选「替换该表」→「导入 CSV」→ 选文件 → 条数保持一致。
4. 复杂字段（`recipes.ingredients`、`recipes.steps`、`cookLogs.deductions`）在 CSV 里是 JSON 字符串，`tags` 用 `|` 分隔，导出后可原样导回。

**菜谱库往返（验证「随时更新」）**：设置 → 菜谱库 →「导出菜谱库」→ 用编辑器改一道菜的标题、或加一道用了新食材名的菜 →「导入菜谱库」→ 菜谱变化生效，回到库存页看数量没变、做饭记录还在。导入前会自动备份，可「回滚到导入前」。

**自动检查**：`node tools/smoke-test.js`，会验证临期优先、湘菜/家常各 20 道、做菜扣库存、采购清空、JSON/CSV 往返、菜谱库往返、增量更新保留库存与自建菜谱。

---

## 八、更新方法

1. **只改菜谱内容**：编辑 `js/recipe-book.js`，把 `VERSION` 加 1，推送即可。所有设备下次打开自动增量更新菜谱，库存/记录不受影响（详见第三节）。
2. 改了 JS / CSS / HTML：**把 `sw.js` 里的 `CACHE_VERSION` 改大**（当前 `foodpantry-static-v3`，下次改 `v4`），否则老客户端会一直用旧缓存。
3. 推送到部署分支 → GitHub Pages 自动重新发布。
4. 手机端：下次打开自动拿到新版本；也可在「设置 → 检查更新」手动触发，或下拉刷新一次。
5. **数据不会受影响**：业务数据在 `localStorage`，Service Worker 只清理静态缓存；菜谱更新走 `applyRecipeBook()` 增量合并，不清空库存。
6. 若改了 `schemaVersion`，在 `js/store.js` 的 `normalize()` 里加迁移逻辑；若改了初始示例（做饭记录/采购/剩菜），把 `store.js` 的 `SEED_VERSION` 和 `seed.js` 的 `meta.seedVersion` 一起加 1。
7. 导入旧 JSON 文件或执行回滚时会调用 `markSeedCurrent()` 标记为当前版本，不会被反复覆盖。

> 本轮把菜谱扩到湘菜 20 道 + 家常菜 20 道，并抽成独立菜谱书；`VERSION` = 3、`SEED_VERSION` = 3、缓存 `v3`。刷新预览即可看到新菜谱，旧库存数据会保留。

---

## 九、需要你提供的仓库与部署权限清单（第 8 步 / 待授权）

**在你回复并授权之前，我不会创建仓库、不会推送、不会部署。** 请提供：

| # | 需要的内容 | 说明 |
| --- | --- | --- |
| 1 | **仓库地址** | 例如 `https://github.com/<用户名>/<仓库名>`；必须是已存在的仓库，我不会擅自新建公开仓库 |
| 2 | **分支名** | 例如 `main`；以及 Pages 用哪个分支/目录（常见：`main` + `/`，或 `gh-pages`） |
| 3 | **仓库写权限** | 该账号对仓库有 push 权限；HTTPS 推送凭据可用（本机内置 Git 的凭据管理器此前已授权过），或你提供具备 `repo` 范围的 Token |
| 4 | **部署权限** | 能开启/修改仓库 `Settings → Pages`（或已配置好 Pages 的 Actions 工作流）；若是 Cloudflare Pages / Vercel / 自有服务器，请给出对应发布方式与凭据 |
| 5 | **公开范围确认** | 仓库是公开还是私有；静态文件里只有示例假数据，但 PWA 网址本身会是公开可访问的 |
| 6 | **自定义域名（可选）** | 如有，给出域名与 DNS 管理方式 |

本机环境备注：`git` 不在系统 PATH，需使用 WorkBuddy 内置 PortableGit 的完整路径；没有 `gh` CLI。若授权后推送遇到网络问题，可能需要在你自己的终端重试。

---

## 十、验收自查

| 验收标准 | 实现位置 | 状态 |
| --- | --- | --- |
| 临期食材在「今天吃什么」中优先出现 | 顶部临期食材条 + `recommend()` 每样 `+100` | ✅ 可用 `node tools/smoke-test.js` 验证 |
| 湘菜 / 家常菜各不少于 20 道且优先展示 | `js/recipe-book.js` 41 道 + `PREFERRED_TAGS` 加权 + 列表取向排序 | ✅ 20 / 20，加权 < 临期权重 |
| 菜谱随时可以更新 | 独立菜谱书 + 应用内增删改 + 菜谱库 JSON 导入导出 + 版本增量更新 | ✅ 更新不动库存/记录，自建菜谱保留 |
| 做一道菜能扣对应库存 | `planCook()` → 可修正弹层 → `applyCook()`，生成 `CookLog` | ✅ |
| 采购清单可勾选并清空已完成 | `shopping-toggle` / `clearDoneShopping()` + 撤销 | ✅ |
| 导出文件可重新导入恢复 | `exportJSON()` / `importJSON()` / `toCSV()` / `fromCSV()` | ✅ |
| 最终给出手机端能用的网址 | **待第 9 节授权后**推送 + 开启 Pages，返回 HTTPS 网址 | ⏳ 等待授权 |
| 推送和部署前已索取权限、仓库均为假数据 | 第 9 节清单 + `js/seed.js` + `.gitignore` | ✅ 本轮未推送、未部署 |

---

## 十一、运行测试

```bash
node tools/smoke-test.js        # 数据层验收 15 项（无需浏览器、无需依赖）
python tools/make_icons.py      # 重新生成 PNG 图标（仅标准库）

# 覆盖：临期优先 / 湘菜家常各 20 道 / 取向加权 / 做菜扣库存 / 采购清空 /
# JSON+CSV 往返 / 菜谱库导出编辑再导入 / 版本增量更新保留库存与自建菜谱
```
