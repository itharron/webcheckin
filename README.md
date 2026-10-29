# 点名签到系统

一个现代化的 **Web 点名签到系统**，适配手机端与 PC 端浏览器，**无需后端即可运行**，所有数据均保存在浏览器本地（LocalStorage + IndexedDB）。

## ✨ 功能特性

- **仪表盘**：今日日期、总人数 / 今日已到 / 今日未到三张动画数据卡片，一键直达三大功能
- **人员名单**：增删改查、按姓名 / 学号实时搜索、批量导入（Excel / CSV）、导出名单
- **点名签到**：逐个点名 + 已到 / 未到大按钮，支持键盘快捷键（`→ / Enter / J` 已到，`← / K` 未到，`↑` 上一位），切换动画流畅，完成后自动生成统计
- **签到记录**：按日期查看、到勤率环形进度、状态点击切换、删除单条记录、导出 Excel / CSV
- **主题切换**：亮色 / 暗色模式，带过渡动画，跟随系统偏好
- **响应式**：PC 端侧边栏 + 表格，手机端底部 TabBar + 卡片式列表
- **PWA**：支持添加到主屏幕与离线访问（可选增强）

## 🛠 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3（Composition API + `<script setup>`） |
| 构建 | Vite 5 |
| UI 组件 | Element Plus（含暗色模式） |
| 样式 | Tailwind CSS |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 图标 | @element-plus/icons-vue |
| 数据存储 | LocalStorage（名单 / 设置）+ IndexedDB（签到记录，`idb` 封装） |
| 工具库 | dayjs、xlsx |
| 语言 | TypeScript（严格模式） |

## 📁 项目结构

```
roll-call-system/
├── public/                  # manifest.json、sw.js、icon.svg
├── src/
│   ├── assets/styles/       # main.css、theme.css（主题变量）
│   ├── components/
│   │   ├── common/          # AppHeader、ThemeToggle、EmptyState
│   │   ├── roster/          # RosterTable、RosterImport、StudentFormDialog
│   │   └── rollcall/        # RollCallDialog、RollCallProgress、QuickStats
│   ├── views/               # HomeView、RosterView、RollCallView、RecordsView
│   ├── stores/              # roster.ts、attendance.ts、settings.ts
│   ├── utils/               # storage.ts（IndexedDB）、export.ts、import.ts、id.ts
│   ├── types/index.ts       # 类型定义
│   ├── router/index.ts
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🚀 本地启动

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📖 使用说明

1. 前往「名单」页面，手动添加或通过 Excel / CSV 批量导入人员（自动识别「姓名」「学号」列）。
2. 返回「首页」或「签到」页面，点击「开始签到」。
3. 按顺序逐个点名，点击「已到 / 未到」或使用键盘快捷键快速标记。
4. 签到完成后自动展示统计，记录可在「签到记录」页面按日期查看、修改与导出。

> 提示：名单与设置保存在 LocalStorage，签到记录保存在 IndexedDB，清除浏览器站点数据会导致数据丢失，导出功能可用于备份。

## 📝 导入文件格式示例

```csv
姓名,学号
张三,2024001
李四,2024002
```

兼容列名：姓名 / name / Name / 学生姓名 / 学生；学号 / 编号 / id / ID / studentNo 等。