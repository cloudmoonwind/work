# 快速开始指南

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

或使用 yarn：
```bash
yarn install
```

或使用 pnpm：
```bash
pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动，浏览器会自动打开。

### 3. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 4. 预览生产构建

```bash
npm run preview
```

## 项目结构说明

```
dream-city-game/
├── src/
│   ├── components/          # React组件
│   │   ├── DreamCityMap.jsx      # 主地图组件
│   │   ├── LocationMarker.jsx    # 地点标记
│   │   ├── RoadNetwork.jsx       # 道路网络
│   │   ├── OuterRegions.jsx      # 外围区域
│   │   └── InfoPopup.jsx         # 信息弹窗
│   ├── data/                # 数据配置
│   │   ├── locations.json        # 地点数据
│   │   ├── roadNetwork.json      # 道路网络
│   │   ├── zones.json            # 区域划分
│   │   └── mapConfig.json        # 地图配置
│   ├── utils/               # 工具函数
│   ├── styles/              # 样式文件
│   │   └── map.css
│   ├── App.jsx              # 应用入口
│   └── main.jsx             # React入口
├── docs/                    # 文档
├── public/                  # 静态资源
├── index.html               # HTML模板
├── package.json             # 项目配置
├── vite.config.js           # Vite配置
└── README.md                # 项目文档
```

## 第一次修改

### 添加一个新地点

1. 打开 `src/data/locations.json`
2. 在 `locations` 数组末尾添加：

```json
{
  "id": "loc_023",
  "name": "新地点",
  "type": "public",
  "category": "custom",
  "position": { "x": 600, "y": 700 },
  "zoneId": "zone_001",
  "status": "active",
  "description": "这是一个新地点",
  "icon": "shop"
}
```

3. 保存文件，刷新浏览器即可看到新地点

### 修改地图样式

1. 打开 `src/data/mapConfig.json`
2. 修改 `cityBoundary.fill` 改变城市底色
3. 修改 `locationStyle.public.fill` 改变公共场所颜色

## 常用操作

### 地图交互
- **鼠标滚轮**：缩放地图
- **鼠标拖拽**：平移地图
- **点击地点**：查看详细信息
- **右上角按钮**：缩放控制和重置

### 开发调试
- 打开浏览器开发者工具（F12）
- 在 Console 中可以查看错误信息
- 使用 React DevTools 调试组件

## 常见问题

### 端口被占用
如果 3000 端口被占用，修改 `vite.config.js`：
```javascript
server: {
  port: 3001,  // 改为其他端口
  open: true
}
```

### 地图不显示
1. 检查浏览器控制台是否有错误
2. 确认 JSON 文件格式正确（使用 JSONLint 验证）
3. 清除浏览器缓存并刷新

### 样式不生效
1. 确认 `map.css` 被正确导入
2. 检查 CSS 选择器是否正确
3. 使用浏览器开发者工具检查样式优先级

## 下一步

- 阅读 [数据结构说明](./docs/数据结构说明.md) 了解数据格式
- 查看 [地点规划说明](./docs/地点规划说明.md) 了解布局设计
- 参考 [扩展开发指南](./docs/扩展开发指南.md) 添加新功能

## 获取帮助

- 查看项目 README.md
- 查看 docs/ 目录下的文档
- 提交 Issue 反馈问题

祝使用愉快！🎉
