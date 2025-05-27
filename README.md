# 手绘建筑平面位图分析与图结构（泡泡图）重构再设计系统
# Hand-drawn Architectural Bitmap Analysis and Bubble Diagram Reconstruction System

[中文](#中文) | [English](#english)

---

<a name="中文"></a>
## 中文

### 项目简介

这是一个创新的建筑设计可视化工具，专为建筑师和设计师开发。这个项目源于一个学校设计课题——一个住院部设计。我初次接触医疗建筑设计时，面对复杂的医院平面功能组织感到无比困惑。传统的分析方法难以直观地展现各个功能空间之间错综复杂的关系，这让我意识到需要一个更智能的工具来辅助理解和优化建筑设计。

经过深入研究和开发，这个工具应运而生。它不仅能够识别和分析旧建筑的图结构关系，为改造设计提供数据支持，还能帮助设计师快速理解空间逻辑，优化功能布局。该系统能够识别和分析手绘平面位图，将其矢量化并进行三维重建，同时提供了强大的泡泡图编辑功能，帮助设计师更好地理解和优化建筑空间的功能组织关系。

### 系统架构

```
手绘建筑平面位图分析与图结构重构再设计系统/
├── index.html             # 宣传介绍页面（首页）
├── main.html              # 主界面入口
├── main.js                # 主程序逻辑
├── main.css               # 样式文件
├── 手绘平面图分析与重建.html  # 分析模块界面
├── 手绘平面图分析与重建.js   # 分析模块逻辑
└── README.md              # 项目说明文档
```

### 核心功能

#### 1. 手绘平面图分析与重建

##### 1.1 图像矢量化
- **技术实现**：基于深度学习的语义分割算法
- **功能特点**：
  - 自动识别手绘平面图中的墙体、门窗、房间等建筑元素
  - 准确提取建筑轮廓和空间布局信息
  - 将位图图像转换为可编辑的矢量数据（JSON格式）
- **处理流程**：
  1. 上传手绘平面图图片
  2. 调用语义分割API进行图像分析
  3. 返回结构化的矢量数据
  4. 支持导出为标准JSON格式

##### 1.2 三维重建
- **技术实现**：基于Three.js WebGL渲染引擎
- **功能特点**：
  - 将二维平面图自动转换为三维模型
  - 支持墙体高度、厚度、材质等参数调整
  - 实时渲染和交互式视角控制
  - 支持多视角查看（俯视图、正视图、侧视图）
- **实现方式**：
  1. 解析矢量化数据中的墙体、门窗位置
  2. 根据参数生成三维几何体
  3. 应用材质和光照效果
  4. 提供OrbitControls实现交互控制

##### 1.3 空间分析功能

###### 视域分析
- **算法实现**：基于射线投射的可视区域计算
- **功能说明**：
  - 分析任意观察点的可视范围
  - 考虑墙体遮挡和门窗通透性
  - 可调整视野半径和射线密度
  - 结果以可视化多边形显示
- **应用场景**：
  - 评估空间私密性
  - 优化监控点位置
  - 分析采光通风条件

###### 路径规划
- **算法实现**：A*寻路算法
- **功能说明**：
  - 自动生成可通行网格
  - 支持起点终点设置
  - 计算最短路径
  - 显示路径长度和计算时间
- **网格生成逻辑**：
  1. 根据矢量数据生成网格（可选精度：低30×40、中60×80、高120×200、超高200×200）
  2. 标记墙体为不可通行
  3. 标记门为可通行
  4. 使用A*算法计算最优路径

#### 2. 泡泡图编辑器

##### 2.1 图结构编辑
- **技术实现**：基于D3.js力导向图
- **核心功能**：
  - **节点管理**：创建、编辑、删除功能空间节点
  - **连接关系**：定义空间之间的功能联系强度和距离
  - **可视化编辑**：支持拖拽调整节点位置
  - **属性编辑**：
    - 节点名称、半径、颜色
    - 连接强度（force）和距离（distance）
    - 线段吸引力设置

##### 2.2 数据导入导出
- **Excel集成**：
  - 使用SheetJS库实现Excel文件读写
  - 支持节点表和连接表的导入导出
  - 自动计算面积和连接关系
- **JSON格式**：
  - 标准化的数据交换格式
  - 支持项目保存和加载
  - 与分析模块数据互通

##### 2.3 边界约束
- **实现方式**：自定义力函数约束节点位置
- **边界类型**：
  - 矩形边界
  - 三角形边界
  - 自定义多边形（Shift+点击添加顶点）
- **交互操作**：
  - 拖拽调整边界顶点
  - 实时更新节点约束

#### 3. 高级功能

- **双语界面**：完整的中英文切换支持
- **项目管理**：保存和加载完整的设计项目
- **颜色主题**：全局色相、饱和度、亮度调整
- **村庄分析**：集成的村庄情况分析工具（iframe嵌入）

### 操作指南

#### 泡泡图编辑操作流程

1. **创建节点**
   - 在左侧面板输入节点名称
   - 设置半径或面积（自动换算）
   - 选择颜色
   - 点击"创建节点"按钮

2. **编辑节点**
   - 右键点击节点进行选择
   - 在左侧面板修改属性
   - 点击"更新节点"保存更改

3. **添加连接**
   - 选择一个节点
   - 在"添加链接到"下拉菜单选择目标节点
   - 点击链接按钮创建连接

4. **调整布局**
   - 拖拽节点到理想位置
   - 使用边界工具约束布局范围
   - 调整连接强度优化布局

5. **数据导出**
   - 点击"导出Excel"生成数据表
   - 点击"保存JSON"保存项目文件

#### 手绘平面图分析操作流程

1. **数据输入**
   - **方式一**：上传手绘平面图图片
     - 点击"上传平面图图片"
     - 选择图片文件
     - 点击"转换为矢量"进行处理
   - **方式二**：粘贴JSON数据
     - 在文本框中粘贴矢量化JSON数据
     - 点击"解析数据"加载
   - **方式三**：上传JSON文件
     - 点击"上传JSON文件"
     - 选择.json文件

2. **视域分析**
   - 切换到"视域分析"标签
   - 设置观察者位置（X、Y坐标）
   - 调整视野半径和射线数量
   - 点击"计算视域"
   - 可通过点击画布快速设置观察点

3. **路径规划**
   - 切换到"路径规划"标签
   - 选择网格精度并点击"生成网格"
   - 使用模式按钮切换操作：
     - 起点模式：点击设置起点（绿色）
     - 终点模式：点击设置终点（红色）
     - 墙体模式：点击修改墙体
   - 点击"寻找路径"计算最优路线

4. **3D重建**
   - 切换到"3D重建"标签
   - 设置模型参数（墙高、厚度等）
   - 点击"生成3D模型"
   - 使用鼠标控制视角：
     - 左键拖拽：旋转
     - 右键拖拽：平移
     - 滚轮：缩放

### 技术架构

- **前端框架**：原生JavaScript（ES6+）
- **数据可视化**：D3.js v7（力导向图、数据绑定）
- **3D渲染**：Three.js r124（WebGL渲染）
- **语义分割**：深度学习模型API（图像识别）
- **数据处理**：SheetJS（Excel文件处理）
- **UI框架**：现代化响应式设计（CSS3 + Flexbox）

### 关键算法实现

#### 力导向布局算法
```javascript
// D3.js力模拟配置
simulation = d3.forceSimulation(nodesData)
    .force('charge', d3.forceManyBody().strength(-100))
    .force('link', d3.forceLink(linksData).id(d => d.id).distance(d => d.distance))
    .force('collide', d3.forceCollide().radius(d => d.radius + 1))
    .force('center', d3.forceCenter(width/2, height/2))
```

#### 视域分析算法
```javascript
// 射线投射计算可视区域
function calculateVisibilityPolygon(observer, radius, rayCount, walls) {
    const angles = [];
    const intersectionPoints = [];
    
    // 生成均匀分布的射线
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        // 计算射线与墙体的交点
        const intersection = castRay(observer, angle, radius, walls);
        intersectionPoints.push(intersection);
    }
    
    return intersectionPoints;
}
```

#### A*寻路算法
```javascript
// A*算法核心实现
function findPath() {
    const openSet = [startCell];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    while (openSet.length > 0) {
        // 选择f值最小的节点
        const current = openSet.reduce((a, b) => 
            fScore.get(a) < fScore.get(b) ? a : b
        );
        
        if (current === endCell) {
            return reconstructPath(cameFrom, current);
        }
        
        // 遍历邻居节点
        for (const neighbor of getNeighbors(current)) {
            const tentativeGScore = gScore.get(current) + 1;
            if (tentativeGScore < gScore.get(neighbor)) {
                // 更新路径
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + heuristic(neighbor, endCell));
            }
        }
    }
}
```

### 使用场景

1. **医疗建筑设计**：分析复杂的医院平面功能组织，优化科室布局
2. **旧建筑改造**：提取现有建筑的空间关系用于再设计
3. **空间优化**：通过视域分析和路径规划优化布局
4. **教学研究**：帮助学生理解建筑空间关系
5. **方案比选**：快速生成和比较不同的空间组织方案

### 项目背景

在接触医疗建筑设计的过程中，我发现医院等复杂建筑的平面功能组织极其复杂，传统的分析方法难以直观地理解空间关系。为了更好地学习和分析平面关系，我开发了这个程序。它不仅可以识别旧建筑的图结构关系用于再设计，还能帮助设计师快速理解和优化空间布局。

通过将语义分割技术应用于建筑设计领域，我们实现了从手绘草图到智能分析的跨越，让每一位设计师都能更高效地完成复杂的建筑设计任务。

### 系统要求

- **浏览器**：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+
- **显卡**：支持WebGL 2.0
- **内存**：建议4GB以上
- **屏幕分辨率**：建议1920×1080或更高

### 快速开始

1. 打开 `index.html` 查看系统介绍
2. 点击"进入系统"按钮访问主界面
3. 选择"泡泡图编辑"进行空间关系设计
4. 选择"手绘平面图分析与重建"进行图纸分析
5. 上传图片或导入数据开始使用

### 致谢

本项目的完成得益于以下人员的指导和支持：

- **徐跃家教授** - 北京建筑大学数字化设计教授，在建筑数字化设计理论和方法上给予了重要指导
- **郝晓赛老师** - 北京建筑大学医疗建筑研究所，在医疗建筑功能组织和空间关系分析方面提供了专业建议

特别感谢他们在项目开发过程中的悉心指导和宝贵建议。

### 开发者信息

- **作者**：张益铭
- **机构**：北京建筑大学
- **邮箱**：ym20021117@gmail.com
- **项目宗旨**：为建筑设计行业提供更智能的设计辅助工具

### 许可证

本项目仅供学习和研究使用。

---

*让建筑设计更智能，让空间关系更清晰。*

<a name="english"></a>
## English

### Project Overview

This is an innovative architectural design visualization tool developed specifically for architects and designers. Born from a university assignment to design a hospital inpatient department, this project emerged from my initial confusion when faced with the complexity of medical building design. The intricate functional organization of hospital floor plans revealed the limitations of traditional analysis methods, inspiring me to create a smarter tool for understanding and optimizing architectural design.

The system combines cutting-edge technologies to bridge the gap between hand-drawn sketches and intelligent analysis. It can recognize and analyze hand-drawn architectural floor plan bitmaps, vectorize them, perform 3D reconstruction, and provide powerful bubble diagram editing functionality to help designers better understand and optimize spatial relationships in buildings.

### System Architecture

```
Hand-drawn Architectural Bitmap Analysis and Bubble Diagram Reconstruction System/
├── index.html              # Landing page (homepage)
├── main.html               # Main interface
├── main.js                 # Main program logic
├── main.css                # Stylesheet
├── 手绘平面图分析与重建.html  # Analysis module interface
├── 手绘平面图分析与重建.js   # Analysis module logic
└── README.md              # Project documentation
```

### Core Features

#### 1. Hand-drawn Floor Plan Analysis and Reconstruction

The system employs deep learning-based semantic segmentation to automatically identify architectural elements in hand-drawn floor plans. It accurately extracts building contours and spatial layout information, converting bitmap images into editable vector data in JSON format. The process includes uploading images, API-based analysis, and export capabilities.

For 3D reconstruction, the system utilizes Three.js WebGL rendering engine to automatically convert 2D floor plans into interactive 3D models. Users can adjust wall height, thickness, and materials while enjoying real-time rendering and interactive view controls across multiple perspectives.

The spatial analysis functions include visibility analysis using ray casting algorithms to analyze visible ranges from any observation point, considering wall occlusion and door/window transparency. The pathfinding feature implements the A* algorithm to automatically generate walkable grids and calculate optimal paths between points.

#### 2. Bubble Diagram Editor

Built on D3.js force-directed graph technology, the editor provides comprehensive node management for creating, editing, and deleting functional space nodes. Users can define spatial relationships with customizable connection strengths and distances, while the visual editing interface supports drag-and-drop positioning.

The system features robust data import/export capabilities through SheetJS integration for Excel files and standardized JSON format support. Boundary constraints can be applied using custom force functions, supporting rectangular, triangular, and custom polygon boundaries with interactive vertex manipulation.

#### 3. Advanced Features

The system includes complete bilingual (Chinese/English) interface support, comprehensive project management for saving and loading complete design projects, global color theme adjustments, and an integrated village analysis tool via iframe embedding.

### Technical Architecture

- **Frontend Framework**: Native JavaScript (ES6+)
- **Data Visualization**: D3.js v7 for force-directed graphs and data binding
- **3D Rendering**: Three.js r124 for WebGL rendering
- **Image Processing**: Deep learning model API for semantic segmentation
- **Data Processing**: SheetJS for Excel file handling
- **UI Framework**: Modern responsive design with CSS3 + Flexbox

### Use Cases

1. **Medical Building Design**: Analyze complex hospital floor plan organizations and optimize department layouts
2. **Building Renovation**: Extract spatial relationships from existing buildings for redesign projects
3. **Space Optimization**: Optimize layouts through visibility analysis and pathfinding
4. **Educational Research**: Help students understand architectural spatial relationships
5. **Scheme Comparison**: Quickly generate and compare different spatial organization schemes

### System Requirements

- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Graphics**: WebGL 2.0 support required
- **Memory**: 4GB or more recommended
- **Screen Resolution**: 1920×1080 or higher recommended

### Quick Start

1. Open `index.html` to view the system introduction
2. Click "Enter System" to access the main interface
3. Select "Bubble Editor" for spatial relationship design
4. Select "Integrated Analysis" for drawing analysis
5. Upload images or import data to begin

### Acknowledgments

This project was completed with the guidance and support of:

- **Professor Xu Yuejia** - Professor of Digital Design at Beijing University of Civil Engineering and Architecture, who provided important guidance on architectural digital design theory and methods
- **Teacher Hao Xiaosai** - Medical Architecture Research Institute of Beijing University of Civil Engineering and Architecture, who provided professional advice on medical building functional organization and spatial relationship analysis

Special thanks for their careful guidance and valuable suggestions during the project development process.

### Developer Information

- **Author**: Zhang Yiming
- **Institution**: Beijing University of Civil Engineering and Architecture
- **Email**: ym20021117@gmail.com
- **Mission**: To provide smarter design assistance tools for the architectural design industry

### License

This project is for learning and research purposes only.

---

*Making architectural design smarter and spatial relationships clearer.*
