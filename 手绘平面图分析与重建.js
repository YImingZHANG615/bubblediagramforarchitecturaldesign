/**
 * 手绘平面图分析与重建 - 主程序
 * 整合视域分析、路径规划和3D重建功能
 */

// ===== 全局变量 =====
let currentJsonData = null;
let currentLanguage = 'zh';

// 视域分析相关
let visibilityCanvas, visibilityCtx;
let observerPosition = { x: 100, y: 100 };
let visibilityResult = null;

// 路径规划相关
let gridData = [];
let gridRows = 120, gridCols = 200;
let currentMode = null;
let startCell = null, endCell = null;
let pathResult = [];

// 3D重建相关
let scene, camera, renderer, controls;
let modelObjects = { walls: [], doors: [], floors: [] };

// 全局变量
let originalJsonData = null; // 存储原始矢量化JSON数据
let ROWS = 120, COLS = 200; // 网格大小
const maxRows = 200, maxCols = 200; // 最大网格尺寸

// 全局边界和缩放变量 - 原版程序必需
let minX, maxX, minY, maxY; // 全局边界变量
let scaleX, scaleY; // 全局缩放变量

// 寻路相关变量
let lastPath = [];

// 图片上传相关变量
let currentFloorPlanImage = null;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadLanguageSettings();
    setupTabNavigation();
    setupEventListeners();
    setupLanguageSwitch();
    initializeCanvases();
    initializeThreeJS();
    
    // 从sessionStorage加载数据
    loadDataFromSessionStorage();
    
    console.log('手绘平面图分析与重建应用初始化完成');
}

// 从sessionStorage加载数据
function loadDataFromSessionStorage() {
    try {
        const savedData = sessionStorage.getItem('floorPlanData');
        const savedLanguage = sessionStorage.getItem('currentLanguage');
        const activeTab = sessionStorage.getItem('activeTab');
        
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            switchLanguage(currentLanguage);
        }
        
        if (savedData) {
            const jsonData = JSON.parse(savedData);
            document.getElementById('jsonInput').value = JSON.stringify(jsonData, null, 2);
            loadJsonData(jsonData);
            console.log('从sessionStorage加载数据成功:', jsonData);
        }
        
        // 如果有指定的标签页，切换到该标签页
        if (activeTab) {
            console.log('切换到标签页:', activeTab);
            
            // 移除sessionStorage中的activeTab，避免下次访问时自动切换
            sessionStorage.removeItem('activeTab');
            
            // 查找对应的标签按钮并点击
            const tabButton = document.querySelector(`.analysis-tab[data-tab="${activeTab}"]`);
            if (tabButton) {
                // 延迟执行，确保页面初始化完成
                setTimeout(() => {
                    tabButton.click();
                }, 500);
            }
        }
    } catch (error) {
        console.warn('从sessionStorage加载数据失败:', error);
    }
}

// ===== 标签页导航 =====
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.analysis-tab');
    const contents = document.querySelectorAll('.analysis-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // 移除所有活动状态
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
            
            // 激活当前标签
            tab.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                handleTabSwitch(targetTab);
            }
        });
    });
}

function handleTabSwitch(tabName) {
    switch(tabName) {
        case 'data-input':
            // 数据输入页面无需特殊处理
            break;
        case 'visibility-analysis':
            if (visibilityCanvas) {
                resizeCanvas(visibilityCanvas);
                if (currentJsonData) {
                    drawFloorPlan(visibilityCanvas, currentJsonData);
                }
            }
            break;
        case 'pathfinding':
            if (currentJsonData && gridData.length === 0) {
                generateGridFromData();
            }
            break;
        case '3d-reconstruction':
            if (renderer) {
                setTimeout(() => {
                    const container = document.getElementById('threejsContainer');
                    if (container) {
                        renderer.setSize(container.clientWidth, container.clientHeight);
                        camera.aspect = container.clientWidth / container.clientHeight;
                        camera.updateProjectionMatrix();
                        renderer.render(scene, camera);
                    }
                }, 100);
            }
            break;
    }
}

// ===== 事件监听器设置 =====
function setupEventListeners() {
    // 数据输入相关
    document.getElementById('parseJsonBtn')?.addEventListener('click', parseJsonData);
    document.getElementById('loadSampleBtn')?.addEventListener('click', loadSampleData);
    document.getElementById('jsonFileInput')?.addEventListener('change', handleJsonFileUpload);
    
    // 平面图图片上传相关
    document.getElementById('uploadFloorPlanBtn')?.addEventListener('click', () => {
        document.getElementById('floorPlanImageUpload').click();
    });
    document.getElementById('floorPlanImageUpload')?.addEventListener('change', handleFloorPlanImageUpload);
    document.getElementById('vectorizeFloorPlanBtn')?.addEventListener('click', vectorizeFloorPlanImage);
    document.getElementById('clearImageBtn')?.addEventListener('click', clearFloorPlanImage);
    
    // 视域分析相关
    document.getElementById('calculateVisibility')?.addEventListener('click', calculateVisibility);
    document.getElementById('visibilityCanvas')?.addEventListener('click', handleVisibilityCanvasClick);
    
    // 视域分析显示选项
    document.getElementById('showWalls')?.addEventListener('change', () => {
        if (visibilityResult) drawVisibilityResult();
    });
    document.getElementById('showDoors')?.addEventListener('change', () => {
        if (visibilityResult) drawVisibilityResult();
    });
    document.getElementById('showRays')?.addEventListener('change', () => {
        if (visibilityResult) drawVisibilityResult();
    });
    document.getElementById('showVisibleArea')?.addEventListener('change', () => {
        if (visibilityResult) drawVisibilityResult();
    });
    
    // 路径规划相关
    document.getElementById('generateGrid')?.addEventListener('click', generateGridFromData);
    document.getElementById('setStartMode')?.addEventListener('click', () => setPathfindingMode('start'));
    document.getElementById('setEndMode')?.addEventListener('click', () => setPathfindingMode('end'));
    document.getElementById('setWallMode')?.addEventListener('click', () => setPathfindingMode('wall'));
    document.getElementById('findPath')?.addEventListener('click', findPath);
    document.getElementById('resetPath')?.addEventListener('click', resetPath);
    
    // 3D重建相关
    document.getElementById('generate3DModel')?.addEventListener('click', generate3DModel);
    document.getElementById('updateMaterials')?.addEventListener('click', updateMaterials);
    document.getElementById('resetCamera')?.addEventListener('click', resetCamera);
    document.getElementById('topView')?.addEventListener('click', () => setCameraView('top'));
    document.getElementById('frontView')?.addEventListener('click', () => setCameraView('front'));
    document.getElementById('sideView')?.addEventListener('click', () => setCameraView('side'));
    
    // 返回按钮
    document.getElementById('backButton')?.addEventListener('click', goBackToMain);
    
    // 窗口大小变化
    window.addEventListener('resize', handleWindowResize);
}

// ===== 数据输入功能 =====
function parseJsonData() {
    const jsonInput = document.getElementById('jsonInput').value.trim();
    if (!jsonInput) {
        alert('请输入JSON数据');
        return;
    }
    
    try {
        const data = JSON.parse(jsonInput);
        loadJsonData(data);
    } catch (error) {
        alert('JSON格式错误: ' + error.message);
        console.error('JSON解析错误:', error);
    }
}

function loadJsonData(data) {
    try {
        currentJsonData = data;
        originalJsonData = data; // 确保两个变量同步
        updateDataStatus(data);
        
        // 自动绘制到预览画布
        if (currentJsonData) {
            drawFloorPlan(previewCanvas, currentJsonData);
        }
        
        // 自动绘制到视域分析画布
        if (currentJsonData) {
            drawFloorPlan(visibilityCanvas, currentJsonData);
        }
        
        console.log('JSON数据加载成功');
    } catch (error) {
        console.error('加载JSON数据失败:', error);
        alert('加载JSON数据失败: ' + error.message);
    }
}

function updateDataStatus(data) {
    const statusDiv = document.getElementById('dataStatus');
    const infoDiv = document.getElementById('dataInfo');
    
    if (data && (data.walls || data.doors || data.rooms)) {
        statusDiv.innerHTML = `
            <div class="status-indicator success">
                <i class="fas fa-check-circle"></i>
                <span data-en="Data loaded successfully" data-zh="数据加载成功">数据加载成功</span>
            </div>
        `;
        
        // 更新统计信息
        document.getElementById('wallCount').textContent = data.walls ? data.walls.length : 0;
        document.getElementById('doorCount').textContent = data.doors ? data.doors.length : 0;
        document.getElementById('roomCount').textContent = data.rooms ? data.rooms.length : 0;
        
        infoDiv.style.display = 'block';
    } else {
        statusDiv.innerHTML = `
            <div class="status-indicator error">
                <i class="fas fa-exclamation-circle"></i>
                <span data-en="Invalid data format" data-zh="数据格式无效">数据格式无效</span>
            </div>
        `;
        infoDiv.style.display = 'none';
    }
    
    // 更新语言
    switchLanguage(currentLanguage);
}

function loadSampleData() {
    const sampleData = {
        "walls": [
            {"position": [[0, 0], [200, 0]]},
            {"position": [[200, 0], [200, 150]]},
            {"position": [[200, 150], [0, 150]]},
            {"position": [[0, 150], [0, 0]]},
            {"position": [[100, 0], [100, 75]]},
            {"position": [[100, 75], [200, 75]]}
        ],
        "doors": [
            {"position": [[50, 0], [70, 0]]},
            {"position": [[150, 75], [170, 75]]}
        ],
        "rooms": [
            [{"x": 10, "y": 10}, {"x": 90, "y": 10}, {"x": 90, "y": 65}, {"x": 10, "y": 65}],
            [{"x": 110, "y": 10}, {"x": 190, "y": 10}, {"x": 190, "y": 65}, {"x": 110, "y": 65}],
            [{"x": 10, "y": 85}, {"x": 190, "y": 85}, {"x": 190, "y": 140}, {"x": 10, "y": 140}]
        ]
    };
    
    document.getElementById('jsonInput').value = JSON.stringify(sampleData, null, 2);
    loadJsonData(sampleData);
}

function handleJsonFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            document.getElementById('jsonInput').value = JSON.stringify(data, null, 2);
            loadJsonData(data);
        } catch (error) {
            alert('文件格式错误: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// ===== 画布初始化 =====
function initializeCanvases() {
    // 初始化预览画布
    const previewCanvas = document.getElementById('previewCanvas');
    if (previewCanvas) {
        resizeCanvas(previewCanvas);
    }
    
    // 初始化视域分析画布
    visibilityCanvas = document.getElementById('visibilityCanvas');
    if (visibilityCanvas) {
        visibilityCtx = visibilityCanvas.getContext('2d');
        resizeCanvas(visibilityCanvas);
    }
}

function resizeCanvas(canvas) {
    if (!canvas) return;
    
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

// ===== 平面图绘制 =====
function drawFloorPlan(canvas, data) {
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算边界 - 使用与主程序相同的逻辑
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // 处理墙体数据
    if (data.walls && Array.isArray(data.walls)) {
        data.walls.forEach(wall => {
            if (wall.position && Array.isArray(wall.position)) {
                wall.position.forEach(point => {
                    if (Array.isArray(point) && point.length >= 2) {
                        minX = Math.min(minX, point[0]);
                        maxX = Math.max(maxX, point[0]);
                        minY = Math.min(minY, point[1]);
                        maxY = Math.max(maxY, point[1]);
                    }
                });
            }
        });
    }
    
    // 处理门数据
    if (data.doors && Array.isArray(data.doors)) {
        data.doors.forEach(door => {
            if (door.bbox && Array.isArray(door.bbox)) {
                door.bbox.forEach(point => {
                    if (Array.isArray(point) && point.length >= 2) {
                        minX = Math.min(minX, point[0]);
                        maxX = Math.max(maxX, point[0]);
                        minY = Math.min(minY, point[1]);
                        maxY = Math.max(maxY, point[1]);
                    }
                });
            }
        });
    }
    
    // 处理房间数据
    if (data.rooms && Array.isArray(data.rooms)) {
        data.rooms.forEach(room => {
            if (Array.isArray(room)) {
                room.forEach(point => {
                    if (point && typeof point === 'object' && 'x' in point && 'y' in point) {
                        minX = Math.min(minX, point.x);
                        maxX = Math.max(maxX, point.x);
                        minY = Math.min(minY, point.y);
                        maxY = Math.max(maxY, point.y);
                    }
                });
            }
        });
    }
    
    // 如果没有有效数据，使用默认范围
    if (minX === Infinity) {
        minX = 0; maxX = 100; minY = 0; maxY = 100;
    }
    
    // 计算缩放比例
    const margin = 50;
    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;
    const scaleX = (canvas.width - margin * 2) / dataWidth;
    const scaleY = (canvas.height - margin * 2) / dataHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (canvas.width - dataWidth * scale) / 2;
    const offsetY = (canvas.height - dataHeight * scale) / 2;
    
    // 绘制房间 - 使用与主程序相同的逻辑
    if (data.rooms && Array.isArray(data.rooms)) {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1;
        
        data.rooms.forEach(room => {
            if (Array.isArray(room) && room.length > 0) {
                ctx.beginPath();
                room.forEach((point, index) => {
                    if (point && typeof point === 'object' && 'x' in point && 'y' in point) {
                        const x = (point.x - minX) * scale + offsetX;
                        const y = (point.y - minY) * scale + offsetY;
                        if (index === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        });
    }
    
    // 绘制墙体 - 使用与主程序相同的逻辑
    if (data.walls && Array.isArray(data.walls)) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        
        data.walls.forEach(wall => {
            if (wall.position && Array.isArray(wall.position) && wall.position.length >= 2) {
                const [start, end] = wall.position;
                if (Array.isArray(start) && Array.isArray(end) && start.length >= 2 && end.length >= 2) {
                    const x1 = (start[0] - minX) * scale + offsetX;
                    const y1 = (start[1] - minY) * scale + offsetY;
                    const x2 = (end[0] - minX) * scale + offsetX;
                    const y2 = (end[1] - minY) * scale + offsetY;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
        });
    }
    
    // 绘制门 - 使用与主程序相同的逻辑
    if (data.doors && Array.isArray(data.doors)) {
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        
        data.doors.forEach(door => {
            if (door.bbox && Array.isArray(door.bbox) && door.bbox.length >= 4) {
                const [p1, p2, p3, p4] = door.bbox;
                if (Array.isArray(p1) && Array.isArray(p2) && Array.isArray(p3) && Array.isArray(p4)) {
                    ctx.beginPath();
                    ctx.moveTo((p1[0] - minX) * scale + offsetX, (p1[1] - minY) * scale + offsetY);
                    ctx.lineTo((p2[0] - minX) * scale + offsetX, (p2[1] - minY) * scale + offsetY);
                    ctx.lineTo((p3[0] - minX) * scale + offsetX, (p3[1] - minY) * scale + offsetY);
                    ctx.lineTo((p4[0] - minX) * scale + offsetX, (p4[1] - minY) * scale + offsetY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            }
        });
    }
}

// ===== 重置所有模块 =====
function resetAllModules() {
    // 重置视域分析
    visibilityResult = null;
    
    // 重置路径规划
    gridData = [];
    startCell = null;
    endCell = null;
    pathResult = [];
    
    // 重置3D模型
    if (scene) {
        modelObjects.walls.forEach(obj => scene.remove(obj));
        modelObjects.doors.forEach(obj => scene.remove(obj));
        modelObjects.floors.forEach(obj => scene.remove(obj));
        modelObjects = { walls: [], doors: [], floors: [] };
    }
}

// ===== 语言切换功能 =====
function setupLanguageSwitch() {
    document.getElementById('lang-zh')?.addEventListener('click', () => {
        switchLanguage('zh');
    });
    
    document.getElementById('lang-en')?.addEventListener('click', () => {
        switchLanguage('en');
    });
    
    // 初始化语言
    switchLanguage(currentLanguage);
}

function switchLanguage(lang) {
    currentLanguage = lang;
    
    // 更新按钮状态
    document.querySelectorAll('#lang-zh, #lang-en').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    
    if (lang === 'zh') {
        document.getElementById('lang-zh')?.classList.remove('btn-secondary');
        document.getElementById('lang-zh')?.classList.add('btn-primary');
    } else {
        document.getElementById('lang-en')?.classList.remove('btn-secondary');
        document.getElementById('lang-en')?.classList.add('btn-primary');
    }
    
    // 更新所有带有语言属性的元素
    document.querySelectorAll('[data-en][data-zh]').forEach(element => {
        if (lang === 'en') {
            element.textContent = element.getAttribute('data-en');
        } else {
            element.textContent = element.getAttribute('data-zh');
        }
    });
    
    // 更新选项元素
    document.querySelectorAll('option[data-en][data-zh]').forEach(option => {
        if (lang === 'en') {
            option.textContent = option.getAttribute('data-en');
        } else {
            option.textContent = option.getAttribute('data-zh');
        }
    });
    
    // 更新输入框占位符
    updatePlaceholders(lang);
    
    // 保存语言设置
    localStorage.setItem('language', lang);
}

function updatePlaceholders(lang) {
    const placeholders = {
        'jsonInput': {
            zh: '请粘贴平面图的JSON数据...',
            en: 'Please paste floor plan JSON data...'
        }
    };
    
    Object.keys(placeholders).forEach(id => {
        const element = document.getElementById(id);
        if (element && placeholders[id][lang]) {
            element.placeholder = placeholders[id][lang];
        }
    });
}

function loadLanguageSettings() {
    const savedLang = localStorage.getItem('language');
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
        currentLanguage = savedLang;
    }
}

// ===== 返回主页功能 =====
function goBackToMain() {
    // 清理sessionStorage
    sessionStorage.removeItem('floorPlanData');
    sessionStorage.removeItem('activeTab');
    
    // 返回主页面
    window.location.href = 'main.html';
}

// ===== 窗口大小变化处理 =====
function handleWindowResize() {
    // 重新调整画布大小
    const previewCanvas = document.getElementById('previewCanvas');
    if (previewCanvas) {
        resizeCanvas(previewCanvas);
        if (currentJsonData) {
            drawFloorPlan(previewCanvas, currentJsonData);
        }
    }
    
    if (visibilityCanvas) {
        resizeCanvas(visibilityCanvas);
        if (currentJsonData) {
            drawFloorPlan(visibilityCanvas, currentJsonData);
            if (visibilityResult) {
                drawVisibilityResult();
            }
        }
    }
    
    // 调整3D渲染器大小
    if (renderer) {
        const container = document.getElementById('threejsContainer');
        if (container) {
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
        }
    }
    
    // 重新适应网格大小
    if (gridData && gridData.length > 0) {
        setTimeout(() => {
            fitGridToContainer();
        }, 100); // 延迟执行，确保容器尺寸已更新
    }
}

// ===== 接收来自主窗口的数据 =====
window.receiveJsonData = function(data) {
    if (data) {
        document.getElementById('jsonInput').value = JSON.stringify(data, null, 2);
        loadJsonData(data);
        console.log('接收到来自主窗口的数据:', data);
    }
};

// 监听来自主窗口的语言切换消息
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'languageChange') {
        switchLanguage(event.data.language);
    }
});

console.log('手绘平面图分析与重建模块加载完成');

// ===== 视域分析功能 =====
function handleVisibilityCanvasClick(event) {
    if (!currentJsonData) return;
    
    const rect = visibilityCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 将画布坐标转换为世界坐标
    const bounds = calculateBounds(currentJsonData);
    const scale = calculateScale(visibilityCanvas, bounds);
    const offset = calculateOffset(visibilityCanvas, bounds, scale);
    
    const worldX = (x - offset.x) / scale + bounds.minX;
    const worldY = (y - offset.y) / scale + bounds.minY;
    
    // 更新观察者位置
    observerPosition.x = worldX;
    observerPosition.y = worldY;
    
    // 更新输入框
    document.getElementById('observerX').value = Math.round(worldX);
    document.getElementById('observerY').value = Math.round(worldY);
    
    // 重新计算视域
    calculateVisibility();
}

function calculateVisibility() {
    if (!currentJsonData) {
        alert('请先加载数据');
        return;
    }
    
    const viewRadius = parseFloat(document.getElementById('viewRadius').value);
    const rayCount = parseInt(document.getElementById('rayCount').value);
    
    // 获取墙体数据（减去门洞）
    const walls = getWallSegmentsWithoutDoors(currentJsonData);
    
    // 计算视域
    visibilityResult = calculateVisibilityPolygon(observerPosition, viewRadius, rayCount, walls);
    
    // 绘制结果
    drawFloorPlan(visibilityCanvas, currentJsonData);
    drawVisibilityResult();
}

function getWallSegmentsWithoutDoors(data) {
    const walls = [];
    
    if (data.walls) {
        data.walls.forEach(wall => {
            if (wall.position && wall.position.length >= 2) {
                const [start, end] = wall.position;
                walls.push({
                    start: { x: start[0], y: start[1] },
                    end: { x: end[0], y: end[1] }
                });
            }
        });
    }
    
    // 从墙体中减去门洞 - 使用原版的门处理逻辑
    if (data.doors) {
        const processedWalls = subtractDoorsFromWalls(
            data.walls.map(w => ({ position: w.position })), 
            data.doors
        );
        
        // 转换为线段格式
        return processedWalls.map(wall => ({
            start: { x: wall[0][0], y: wall[0][1] },
            end: { x: wall[1][0], y: wall[1][1] }
        }));
    }
    
    return walls;
}

// 添加原版的门处理函数
function subtractDoorsFromWalls(walls, doors) {
    let newWalls = [];
    walls.forEach(w => {
        const segments = getWallSegments(w.position);
        segments.forEach(seg => {
            let splitPoints = [];
            doors.forEach(d => {
                const doorEdges = getEdgesFromBbox(d.bbox || d.position);
                if (doorEdges) {
                    doorEdges.forEach(e => {
                        const inter = lineIntersection2D(seg[0], seg[1], e[0], e[1]);
                        if (inter) splitPoints.push(inter);
                    });
                    // 中点检测是否整段在门里
                    const mid = midpoint2D(seg[0], seg[1]);
                    if (isPointInPolygon2D(mid, d.bbox || d.position)) {
                        // 整段丢弃
                        return;
                    }
                }
            });
            splitPoints = removeDuplicatePoints2D(splitPoints);
            const subSegs = splitSegmentAtPoints2D(seg, splitPoints);
            subSegs.forEach(s => {
                const mid2 = midpoint2D(s[0], s[1]);
                let insideDoor = false;
                doors.forEach(d => {
                    if (isPointInPolygon2D(mid2, d.bbox || d.position)) insideDoor = true;
                });
                if (!insideDoor) newWalls.push(s);
            });
        });
    });
    return newWalls;
}

function getWallSegments(positions) {
    let arr = [];
    for (let i = 0; i < positions.length - 1; i++) {
        arr.push([positions[i], positions[i + 1]]);
    }
    return arr;
}

function getEdgesFromBbox(bbox) {
    if (!bbox || !Array.isArray(bbox)) return [];
    let edges = [];
    for (let i = 0; i < bbox.length; i++) {
        edges.push([bbox[i], bbox[(i + 1) % bbox.length]]);
    }
    return edges;
}

function midpoint2D(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function removeDuplicatePoints2D(points, eps = 1e-6) {
    let unique = [];
    points.forEach(p => {
        let dup = false;
        for (let q of unique) {
            if (Math.hypot(p[0] - q[0], p[1] - q[1]) < eps) {
                dup = true;
                break;
            }
        }
        if (!dup) unique.push(p);
    });
    return unique;
}

function splitSegmentAtPoints2D(segment, pts) {
    pts.sort((a, b) => {
        const da = Math.hypot(a[0] - segment[0][0], a[1] - segment[0][1]);
        const db = Math.hypot(b[0] - segment[0][0], b[1] - segment[0][1]);
        return da - db;
    });
    let res = [];
    let prev = segment[0];
    pts.forEach(p => {
        res.push([prev, p]);
        prev = p;
    });
    res.push([prev, segment[1]]);
    return res;
}

function lineIntersection2D(p1, p2, p3, p4) {
    const x1 = p1[0], y1 = p1[1];
    const x2 = p2[0], y2 = p2[1];
    const x3 = p3[0], y3 = p3[1];
    const x4 = p4[0], y4 = p4[1];
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
    }
    
    return null;
}

function isPointInPolygon2D(point, polygon) {
    if (!polygon || polygon.length < 3) return false;
    
    const x = point[0], y = point[1];
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    
    return inside;
}

function calculateVisibilityPolygon(observer, radius, rayCount, walls) {
    const visiblePoints = [];
    const angleStep = (2 * Math.PI) / rayCount;
    
    for (let i = 0; i < rayCount; i++) {
        const angle = i * angleStep;
        const rayEnd = {
            x: observer.x + Math.cos(angle) * radius,
            y: observer.y + Math.sin(angle) * radius
        };
        
        let closestIntersection = rayEnd;
        let minDistance = radius;
        
        // 检查与所有墙体的交点
        walls.forEach(wall => {
            const intersection = lineIntersection(
                observer, rayEnd,
                wall.start, wall.end
            );
            
            if (intersection) {
                const dist = distance(observer, intersection);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestIntersection = intersection;
                }
            }
        });
        
        visiblePoints.push(closestIntersection);
    }
    
    return visiblePoints;
}

function drawVisibilityResult() {
    if (!visibilityResult || !visibilityCanvas) return;
    
    const ctx = visibilityCtx;
    const bounds = calculateBounds(currentJsonData);
    const scale = calculateScale(visibilityCanvas, bounds);
    const offset = calculateOffset(visibilityCanvas, bounds, scale);
    
    // 重新绘制基础平面图
    drawFloorPlan(visibilityCanvas, currentJsonData);
    
    // 检查显示选项
    const showWalls = document.getElementById('showWalls')?.checked !== false;
    const showDoors = document.getElementById('showDoors')?.checked !== false;
    const showRays = document.getElementById('showRays')?.checked !== false;
    const showVisibleArea = document.getElementById('showVisibleArea')?.checked !== false;
    
    // 如果不显示墙体或门，需要重新绘制平面图
    if (!showWalls || !showDoors) {
        ctx.clearRect(0, 0, visibilityCanvas.width, visibilityCanvas.height);
        
        // 重新绘制选择性的平面图元素
        const tempData = {
            walls: showWalls ? currentJsonData.walls : [],
            doors: showDoors ? currentJsonData.doors : [],
            rooms: currentJsonData.rooms
        };
        drawFloorPlan(visibilityCanvas, tempData);
    }
    
    // 绘制可视区域
    if (showVisibleArea && visibilityResult.length > 0) {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.beginPath();
        
        visibilityResult.forEach((point, index) => {
            const x = (point.x - bounds.minX) * scale + offset.x;
            const y = (point.y - bounds.minY) * scale + offset.y;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.closePath();
        ctx.fill();
    }
    
    // 绘制射线
    if (showRays && visibilityResult.length > 0) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 1;
        
        const observerX = (observerPosition.x - bounds.minX) * scale + offset.x;
        const observerY = (observerPosition.y - bounds.minY) * scale + offset.y;
        
        visibilityResult.forEach(point => {
            const x = (point.x - bounds.minX) * scale + offset.x;
            const y = (point.y - bounds.minY) * scale + offset.y;
            
            ctx.beginPath();
            ctx.moveTo(observerX, observerY);
            ctx.lineTo(x, y);
            ctx.stroke();
        });
    }
    
    // 绘制观察者位置
    const observerX = (observerPosition.x - bounds.minX) * scale + offset.x;
    const observerY = (observerPosition.y - bounds.minY) * scale + offset.y;
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(observerX, observerY, 6, 0, 2 * Math.PI);
    ctx.fill();
}

// ===== 路径规划功能 =====
function generateGridFromData() {
    if (!currentJsonData) {
        alert('请先加载数据');
        return;
    }
    
    // 找到全局边界 - 使用原版算法
    findGlobalBounds();
    
    // 尝试基于门尺寸调整网格比例
    const scaleAdjusted = analyzeAndAdjustGridScale();
    
    // 如果没有调整成功（比如没有门数据），则使用默认的网格维度计算
    if (!scaleAdjusted) {
        // 计算网格行列数 - 使用原版算法
        calculateGridDimensions();
    }
    
    // 创建网格数据 - 使用原版算法
    createGridData();
    
    // 标记墙和门 - 使用原版算法
    markWallsAndDoors();
    
    // 渲染网格到DOM - 使用原版算法
    renderGridDOM();
    
    console.log(`网格生成完成: ${ROWS}x${COLS}`);
}

// 找到全局边界 - 原版算法
function findGlobalBounds() {
    const walls = currentJsonData.walls || [];
    const doors = currentJsonData.doors || [];
    
    // 重置边界变量
    minX = Infinity;
    maxX = -Infinity;
    minY = Infinity;
    maxY = -Infinity;
    
    // 处理墙的边界
    walls.forEach(wall => {
        if (wall.position && wall.position.length >= 2) {
            const [start, end] = wall.position;
            if (Array.isArray(start) && Array.isArray(end)) {
                minX = Math.min(minX, start[0], end[0]);
                maxX = Math.max(maxX, start[0], end[0]);
                minY = Math.min(minY, start[1], end[1]);
                maxY = Math.max(maxY, start[1], end[1]);
            }
        }
    });
    
    // 处理门的边界
    doors.forEach(door => {
        if (door.bbox && door.bbox.length === 4) {
            door.bbox.forEach(point => {
                if (Array.isArray(point) && point.length >= 2) {
                    minX = Math.min(minX, point[0]);
                    maxX = Math.max(maxX, point[0]);
                    minY = Math.min(minY, point[1]);
                    maxY = Math.max(maxY, point[1]);
                }
            });
        }
    });
    
    // 添加边距
    minX -= 1;
    minY -= 1;
    maxX += 1;
    maxY += 1;
    
    console.log(`边界: [${minX}, ${minY}] -> [${maxX}, ${maxY}]`);
}

// 分析门的尺寸并调整网格比例，确保门的宽度为5个格子
function analyzeAndAdjustGridScale() {
    console.log('=== 开始分析门尺寸并调整网格比例 ===');
    
    if (!currentJsonData || !currentJsonData.doors || currentJsonData.doors.length === 0) {
        console.log('没有门数据，使用默认比例');
        return false;
    }
    
    // 分析所有门的尺寸
    const doorAnalysis = [];
    currentJsonData.doors.forEach((door, index) => {
        if (!door.bbox || door.bbox.length !== 4) {
            console.warn(`门 ${index} 的bbox格式不正确`);
            return;
        }
        
        const [p1, p2, p3, p4] = door.bbox;
        
        // 计算门的边界框
        const minX_door = Math.min(p1[0], p2[0], p3[0], p4[0]);
        const maxX_door = Math.max(p1[0], p2[0], p3[0], p4[0]);
        const minY_door = Math.min(p1[1], p2[1], p3[1], p4[1]);
        const maxY_door = Math.max(p1[1], p2[1], p3[1], p4[1]);
        
        // 计算门的宽度和高度
        const doorWidth = maxX_door - minX_door;
        const doorHeight = maxY_door - minY_door;
        
        // 判断门的方向
        const isHorizontal = doorWidth > doorHeight;
        
        // 门的有效宽度（较短的那个边）
        const effectiveWidth = Math.min(doorWidth, doorHeight);
        
        doorAnalysis.push({
            index,
            width: doorWidth,
            height: doorHeight,
            effectiveWidth,
            isHorizontal
        });
        
        console.log(`门 ${index}: 宽度=${doorWidth.toFixed(2)}, 高度=${doorHeight.toFixed(2)}, 有效宽度=${effectiveWidth.toFixed(2)}, 方向=${isHorizontal ? '水平' : '垂直'}`);
    });
    
    if (doorAnalysis.length === 0) {
        console.log('没有有效的门数据');
        return false;
    }
    
    // 计算平均门宽（使用有效宽度）
    const avgDoorWidth = doorAnalysis.reduce((sum, door) => sum + door.effectiveWidth, 0) / doorAnalysis.length;
    console.log(`平均门宽: ${avgDoorWidth.toFixed(2)}`);
    
    // 目标：门的宽度应该占据5个格子
    const TARGET_DOOR_CELLS = 5;
    
    // 计算理想的单元格尺寸
    const idealCellSize = avgDoorWidth / TARGET_DOOR_CELLS;
    console.log(`理想单元格尺寸: ${idealCellSize.toFixed(2)}`);
    
    // 计算整个平面图的尺寸
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    
    // 基于理想单元格尺寸计算网格数量
    const idealCols = Math.round(worldWidth / idealCellSize);
    const idealRows = Math.round(worldHeight / idealCellSize);
    
    console.log(`基于门尺寸的理想网格: ${idealCols}x${idealRows}`);
    
    // 限制在合理范围内
    COLS = Math.max(20, Math.min(maxCols, idealCols));
    ROWS = Math.max(20, Math.min(maxRows, idealRows));
    
    // 重新计算实际的单元格尺寸
    scaleX = worldWidth / COLS;
    scaleY = worldHeight / ROWS;
    
    console.log(`调整后的网格: ${COLS}x${ROWS}`);
    console.log(`调整后的单元格尺寸: ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`);
    
    // 验证调整后的效果
    doorAnalysis.forEach(door => {
        const cellsOccupied = door.effectiveWidth / scaleX;
        console.log(`门 ${door.index} 将占据 ${cellsOccupied.toFixed(1)} 个格子`);
    });
    
    console.log('=== 网格比例调整完成 ===');
    return true;
}

// 计算网格维度 - 原版算法，修复长宽比问题
function calculateGridDimensions() {
    let w = Math.max(1, maxX - minX);
    let h = Math.max(1, maxY - minY);
    
    // 保持原始长宽比
    const aspectRatio = w / h;
    
    // 计算最大行列数，考虑长宽比
    let tempCols, tempRows;
    
    if (aspectRatio >= 1) {
        // 宽大于高
        tempCols = maxCols;
        tempRows = Math.floor(maxCols / aspectRatio);
    } else {
        // 高大于宽
        tempRows = maxRows;
        tempCols = Math.floor(maxRows * aspectRatio);
    }
    
    // 确保最小尺寸
    tempCols = Math.max(tempCols, 20);
    tempRows = Math.max(tempRows, 20);
    
    // 设置网格尺寸
    COLS = tempCols;
    ROWS = tempRows;
    
    // 计算单元格在世界坐标中的尺寸
    scaleX = w / COLS;
    scaleY = h / ROWS;
    
    console.log(`网格尺寸: ${COLS}x${ROWS}, 长宽比: ${aspectRatio.toFixed(2)}, 单元格尺寸: ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`);
}

// 创建网格数据 - 原版算法
function createGridData() {
    gridData = [];
    
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            row.push({
                row: r,
                col: c,
                isWall: false,
                isDoor: false,
                doorOrientation: null,
                type: 'empty',
                worldX: minX + c * scaleX + scaleX / 2,
                worldY: minY + r * scaleY + scaleY / 2
            });
        }
        gridData.push(row);
    }
}

// 标记墙和门 - 原版算法
function markWallsAndDoors() {
    // 标记墙
    markWallsOnGrid(currentJsonData.walls || []);
    
    // 标记门
    markDoorsOnGrid(currentJsonData.doors || []);
}

// 在网格上标记墙 - 精确版本，墙线只被采样到一行格子上
function markWallsOnGrid(walls) {
    console.log('=== 开始精确墙体标记 ===');
    
    walls.forEach((wall, wallIndex) => {
        if (!wall.position || wall.position.length < 2) return;
        
        const [start, end] = wall.position;
        if (!Array.isArray(start) || !Array.isArray(end)) return;
        
        console.log(`标记墙 ${wallIndex}: [${start[0]},${start[1]}] -> [${end[0]},${end[1]}]`);
        
        // 使用Bresenham算法或类似的线段栅格化算法来精确采样墙线
        const wallCells = rasterizeWallLine(start[0], start[1], end[0], end[1]);
        
        console.log(`墙 ${wallIndex} 采样到 ${wallCells.length} 个单元格`);
        
        // 标记采样到的单元格为墙
        wallCells.forEach(({row, col}) => {
            if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
                gridData[row][col].isWall = true;
                gridData[row][col].type = 'wall';
                console.log(`  标记墙单元格: [${row}, ${col}]`);
            }
        });
    });
    
    console.log('=== 精确墙体标记完成 ===');
}

// 精确的墙线栅格化函数 - 确保墙线只被采样到一行格子上
function rasterizeWallLine(x1, y1, x2, y2) {
    const wallCells = [];
    
    // 将世界坐标转换为网格坐标
    const startCol = (x1 - minX) / scaleX;
    const startRow = (y1 - minY) / scaleY;
    const endCol = (x2 - minX) / scaleX;
    const endRow = (y2 - minY) / scaleY;
    
    console.log(`  世界坐标: (${x1}, ${y1}) -> (${x2}, ${y2})`);
    console.log(`  网格坐标: (${startRow.toFixed(2)}, ${startCol.toFixed(2)}) -> (${endRow.toFixed(2)}, ${endCol.toFixed(2)})`);
    
    // 使用改进的Bresenham算法进行线段栅格化
    const dx = Math.abs(endCol - startCol);
    const dy = Math.abs(endRow - startRow);
    const stepX = startCol < endCol ? 1 : -1;
    const stepY = startRow < endRow ? 1 : -1;
    
    let currentCol = Math.floor(startCol);
    let currentRow = Math.floor(startRow);
    const targetCol = Math.floor(endCol);
    const targetRow = Math.floor(endRow);
    
    // 添加起始点
    if (currentRow >= 0 && currentRow < ROWS && currentCol >= 0 && currentCol < COLS) {
        wallCells.push({row: currentRow, col: currentCol});
    }
    
    if (dx > dy) {
        // 主要沿X方向移动
        let error = dx / 2;
        while (currentCol !== targetCol) {
            currentCol += stepX;
            error -= dy;
            if (error < 0) {
                currentRow += stepY;
                error += dx;
            }
            
            if (currentRow >= 0 && currentRow < ROWS && currentCol >= 0 && currentCol < COLS) {
                wallCells.push({row: currentRow, col: currentCol});
            }
        }
    } else {
        // 主要沿Y方向移动
        let error = dy / 2;
        while (currentRow !== targetRow) {
            currentRow += stepY;
            error -= dx;
            if (error < 0) {
                currentCol += stepX;
                error += dy;
            }
            
            if (currentRow >= 0 && currentRow < ROWS && currentCol >= 0 && currentCol < COLS) {
                wallCells.push({row: currentRow, col: currentCol});
            }
        }
    }
    
    // 确保添加终点
    if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
        const exists = wallCells.some(cell => cell.row === targetRow && cell.col === targetCol);
        if (!exists) {
            wallCells.push({row: targetRow, col: targetCol});
        }
    }
    
    // 去重
    const uniqueCells = [];
    const cellSet = new Set();
    
    wallCells.forEach(cell => {
        const key = `${cell.row},${cell.col}`;
        if (!cellSet.has(key)) {
            cellSet.add(key);
            uniqueCells.push(cell);
        }
    });
    
    console.log(`  栅格化结果: ${uniqueCells.length} 个唯一单元格`);
    return uniqueCells;
}

// 在网格上标记门 - 布尔交集版本，门只在与墙重叠的地方显示
function markDoorsOnGrid(doors) {
    doors.forEach((door, doorIndex) => {
        if (!door.bbox || door.bbox.length !== 4) {
            console.warn("门的bbox格式不正确:", door);
            return;
        }
        
        const [p1, p2, p3, p4] = door.bbox;
        
        // 计算门的边界框
        let minX_door = Math.min(p1[0], p2[0], p3[0], p4[0]);
        let maxX_door = Math.max(p1[0], p2[0], p3[0], p4[0]);
        let minY_door = Math.min(p1[1], p2[1], p3[1], p4[1]);
        let maxY_door = Math.max(p1[1], p2[1], p3[1], p4[1]);
        
        // 计算门的宽度和高度
        const doorWidth = maxX_door - minX_door;
        const doorHeight = maxY_door - minY_door;
        
        // 判断门的方向
        const isHorizontal = doorWidth > doorHeight;
        
        console.log(`门 ${doorIndex}: 边界=[${minX_door.toFixed(1)}, ${minY_door.toFixed(1)}] -> [${maxX_door.toFixed(1)}, ${maxY_door.toFixed(1)}], 尺寸=${doorWidth.toFixed(1)}x${doorHeight.toFixed(1)}, 方向=${isHorizontal ? '水平' : '垂直'}`);
        
        // 将世界坐标转换为网格坐标
        const startCol = Math.floor((minX_door - minX) / scaleX);
        const endCol = Math.floor((maxX_door - minX) / scaleX);
        const startRow = Math.floor((minY_door - minY) / scaleY);
        const endRow = Math.floor((maxY_door - minY) / scaleY);
        
        // 确保在网格范围内
        const gridStartCol = Math.max(0, Math.min(startCol, COLS - 1));
        const gridEndCol = Math.max(0, Math.min(endCol, COLS - 1));
        const gridStartRow = Math.max(0, Math.min(startRow, ROWS - 1));
        const gridEndRow = Math.max(0, Math.min(endRow, ROWS - 1));
        
        console.log(`门 ${doorIndex} 网格范围: [${gridStartRow}, ${gridStartCol}] -> [${gridEndRow}, ${gridEndCol}]`);
        
        // 布尔交集：只在门框与墙重叠的地方标记为门
        let doorCellCount = 0;
        let wallIntersectionCount = 0;
        
        for (let r = gridStartRow; r <= gridEndRow; r++) {
            for (let c = gridStartCol; c <= gridEndCol; c++) {
                if (r < ROWS && c < COLS) {
                    // 获取当前单元格的世界坐标
                    const cellWorldX = minX + c * scaleX + scaleX / 2;
                    const cellWorldY = minY + r * scaleY + scaleY / 2;
                    
                    // 检查单元格中心是否在门的边界框内
                    const isInDoorBbox = cellWorldX >= minX_door && cellWorldX <= maxX_door &&
                                        cellWorldY >= minY_door && cellWorldY <= maxY_door;
                    
                    if (isInDoorBbox) {
                        doorCellCount++;
                        
                        // 布尔交集：只有当前位置是墙时，才标记为门
                        if (gridData[r][c].isWall) {
                            wallIntersectionCount++;
                            
                            // 清除墙体标记，标记为门
                            gridData[r][c].isWall = false;
                            gridData[r][c].isDoor = true;
                            gridData[r][c].doorOrientation = isHorizontal ? 'horizontal' : 'vertical';
                            gridData[r][c].type = 'door';
                            
                            console.log(`  门单元格 [${r}, ${c}]: 墙->门`);
                        } else {
                            // 如果门框区域没有墙，则保持原状（可能是空白区域）
                            console.log(`  门单元格 [${r}, ${c}]: 无墙，保持原状`);
                        }
                    }
                }
            }
        }
        
        console.log(`门 ${doorIndex} 统计: 门框区域${doorCellCount}个单元格, 与墙交集${wallIntersectionCount}个单元格`);
        
        // 如果门与墙的交集太少，可能是门的位置不正确
        if (wallIntersectionCount === 0) {
            console.warn(`门 ${doorIndex} 警告: 门框区域没有与墙重叠，可能门的位置不正确`);
            
            // 尝试扩展搜索范围，寻找附近的墙
            const expandedStartRow = Math.max(0, gridStartRow - 2);
            const expandedEndRow = Math.min(ROWS - 1, gridEndRow + 2);
            const expandedStartCol = Math.max(0, gridStartCol - 2);
            const expandedEndCol = Math.min(COLS - 1, gridEndCol + 2);
            
            console.log(`  扩展搜索范围: [${expandedStartRow}, ${expandedStartCol}] -> [${expandedEndRow}, ${expandedEndCol}]`);
            
            for (let r = expandedStartRow; r <= expandedEndRow; r++) {
                for (let c = expandedStartCol; c <= expandedEndCol; c++) {
                    if (gridData[r][c].isWall) {
                        const cellWorldX = minX + c * scaleX + scaleX / 2;
                        const cellWorldY = minY + r * scaleY + scaleY / 2;
                        
                        // 计算到门中心的距离
                        const doorCenterX = (minX_door + maxX_door) / 2;
                        const doorCenterY = (minY_door + maxY_door) / 2;
                        const distance = Math.sqrt(
                            Math.pow(cellWorldX - doorCenterX, 2) + 
                            Math.pow(cellWorldY - doorCenterY, 2)
                        );
                        
                        // 如果距离在合理范围内，标记为门
                        const maxDistance = Math.max(doorWidth, doorHeight) * 1.5;
                        if (distance <= maxDistance) {
                            gridData[r][c].isWall = false;
                            gridData[r][c].isDoor = true;
                            gridData[r][c].doorOrientation = isHorizontal ? 'horizontal' : 'vertical';
                            gridData[r][c].type = 'door';
                            wallIntersectionCount++;
                            console.log(`  扩展搜索找到门单元格 [${r}, ${c}]: 距离=${distance.toFixed(1)}`);
                        }
                    }
                }
            }
            
            console.log(`门 ${doorIndex} 扩展搜索后: 与墙交集${wallIntersectionCount}个单元格`);
        }
    });
}

// 获取单元格在世界坐标中的矩形 - 原版算法
function cellWorldRect(row, col, second = false) {
    const x1 = minX + col * scaleX;
    const y1 = minY + row * scaleY;
    
    if (second) {
        // 返回右下角坐标
        const x2 = minX + (col + 1) * scaleX;
        const y2 = minY + (row + 1) * scaleY;
        return [x2, y2];
    } else {
        // 返回左上角坐标
        return [x1, y1];
    }
}

// 检查点是否在矩形内 - 原版算法
function pointInRect(px, py, rx1, ry1, rx2, ry2) {
    return px >= rx1 && px <= rx2 && py >= ry1 && py <= ry2;
}

// 检查线段是否与矩形相交 - 原版算法
function lineRectIntersection(x1, y1, x2, y2, rx1, ry1, rx2, ry2, thickness = 0) {
    // 检查线段的两个端点是否在矩形内
    if (pointInRect(x1, y1, rx1, ry1, rx2, ry2) || pointInRect(x2, y2, rx1, ry1, rx2, ry2)) {
        return true;
    }
    
    // 检查线段是否与矩形的四条边相交
    if (lineSegmentIntersect(x1, y1, x2, y2, rx1, ry1, rx2, ry1) || // 上边
        lineSegmentIntersect(x1, y1, x2, y2, rx2, ry1, rx2, ry2) || // 右边
        lineSegmentIntersect(x1, y1, x2, y2, rx1, ry2, rx2, ry2) || // 下边
        lineSegmentIntersect(x1, y1, x2, y2, rx1, ry1, rx1, ry2)) { // 左边
        return true;
    }
    
    // 如果有厚度，检查线段到矩形四个顶点的最小距离是否小于厚度
    if (thickness > 0) {
        const d1 = pointToSegmentDistance(rx1, ry1, x1, y1, x2, y2);
        const d2 = pointToSegmentDistance(rx2, ry1, x1, y1, x2, y2);
        const d3 = pointToSegmentDistance(rx1, ry2, x1, y1, x2, y2);
        const d4 = pointToSegmentDistance(rx2, ry2, x1, y1, x2, y2);
        
        if (Math.min(d1, d2, d3, d4) <= thickness) {
            return true;
        }
    }
    
    return false;
}

// 检查两条线段是否相交 - 原版算法
function lineSegmentIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    // 计算方向
    const d1 = (x4 - x3) * (y1 - y3) - (x1 - x3) * (y4 - y3);
    const d2 = (x4 - x3) * (y2 - y3) - (x2 - x3) * (y4 - y3);
    const d3 = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
    const d4 = (x2 - x1) * (y4 - y1) - (x4 - x1) * (y2 - y1);
    
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }
    
    // 检查端点是否在线段上
    if (d1 === 0 && pointOnSegment(x3, y3, x4, y4, x1, y1)) return true;
    if (d2 === 0 && pointOnSegment(x3, y3, x4, y4, x2, y2)) return true;
    if (d3 === 0 && pointOnSegment(x1, y1, x2, y2, x3, y3)) return true;
    if (d4 === 0 && pointOnSegment(x1, y1, x2, y2, x4, y4)) return true;
    
    return false;
}

// 检查点是否在线段上 - 原版算法
function pointOnSegment(x1, y1, x2, y2, px, py) {
    return px >= Math.min(x1, x2) && px <= Math.max(x1, x2) &&
           py >= Math.min(y1, y2) && py <= Math.max(y1, y2);
}

// 计算点到线段的距离 - 原版算法
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    
    if (param < 0) {
        return Math.sqrt(A * A + B * B);
    } else if (param > 1) {
        const E = px - x2;
        const F = py - y2;
        return Math.sqrt(E * E + F * F);
    } else {
        const projX = x1 + param * C;
        const projY = y1 + param * D;
        const G = px - projX;
        const H = py - projY;
        return Math.sqrt(G * G + H * H);
    }
}

// 渲染网格到DOM - 原版算法
function renderGridDOM() {
    const gridContainer = document.getElementById('gridContainer');
    if (!gridContainer) {
        console.error('找不到网格容器');
        return;
    }
    
    // 清空网格容器
    gridContainer.innerHTML = '';
    
    // 创建网格
    for (let r = 0; r < ROWS; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        rowDiv.style.display = 'flex';
        
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.style.width = '16px';
            cell.style.height = '16px';
            cell.style.border = '1px solid #ccc';
            cell.style.boxSizing = 'border-box';
            cell.style.cursor = 'pointer';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.position = 'relative';
            cell.style.backgroundColor = '#f9f9f9';
            
            // 添加点击事件
            cell.addEventListener('click', function() {
                handleGridCellClick(r, c);
            });
            
            rowDiv.appendChild(cell);
        }
        
        gridContainer.appendChild(rowDiv);
    }
    
    // 刷新网格UI
    refreshGridUI();
    
    // 调整网格大小以适应容器
    fitGridToContainer();
    
    // 添加窗口大小变化监听器（只添加一次）
    if (!window.gridResizeListenerAdded) {
        window.addEventListener("resize", fitGridToContainer);
        window.gridResizeListenerAdded = true;
        console.log('已添加网格自适应监听器');
    }
}

// 刷新网格UI - 原版算法
function refreshGridUI(path = []) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const gridElement = document.getElementById('gridContainer');
            if (!gridElement || !gridElement.children[r] || !gridElement.children[r].children[c]) continue;
            
            const cell = gridElement.children[r].children[c];
            const cellData = gridData[r][c];
            
            // 重置所有类
            cell.className = 'cell';
            cell.innerHTML = '';
            
            // 设置基础样式
            cell.style.width = '16px';
            cell.style.height = '16px';
            cell.style.border = '1px solid #ccc';
            cell.style.boxSizing = 'border-box';
            cell.style.cursor = 'pointer';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.position = 'relative';
            cell.style.backgroundColor = '#f9f9f9';
            
            // 添加适当的类和样式
            if (cellData.isWall) {
                cell.classList.add('wall');
                cell.style.backgroundColor = '#666';
            } else if (cellData.isDoor) {
                cell.classList.add('door');
                cell.style.backgroundColor = '#87CEFA';
                
                // 添加门的方向标识，使其看起来更像门
                const doorDiv = document.createElement('div');
                doorDiv.className = 'door-indicator';
                doorDiv.style.position = 'absolute';
                doorDiv.style.top = '15%';
                doorDiv.style.left = '15%';
                doorDiv.style.width = '70%';
                doorDiv.style.height = '70%';
                doorDiv.style.backgroundColor = '#8B4513';
                doorDiv.style.border = '1px solid #5d2906';
                doorDiv.style.borderRadius = '2px';
                
                // 判断门的方向（水平或垂直）
                const isHorizontal = cellData.doorOrientation === 'horizontal';
                doorDiv.style.transform = isHorizontal ? 'rotate(90deg)' : 'rotate(0deg)';
                cell.appendChild(doorDiv);
            }
            
            // 路径
            if (path.some(p => p.row === r && p.col === c)) {
                cell.classList.add('path');
                cell.style.backgroundColor = '#FFEB3B';
            }
            
            // 起点和终点
            if (startCell && startCell.row === r && startCell.col === c) {
                cell.classList.add('start');
                cell.style.backgroundColor = '#4CAF50';
                cell.style.color = 'white';
                cell.textContent = 'S';
            } else if (endCell && endCell.row === r && endCell.col === c) {
                cell.classList.add('end');
                cell.style.backgroundColor = '#F44336';
                cell.style.color = 'white';
                cell.textContent = 'E';
            }
        }
    }
}

// 适应容器 - 使用原版程序的实现
function fitGridToContainer() {
    const gridContainer = document.getElementById('gridContainer');
    const gridWrapper = document.getElementById('gridWrapper');
    
    if (!gridContainer) {
        console.error('找不到网格容器');
        return;
    }
    
    if (!gridWrapper) {
        console.error('找不到网格包装器');
        return;
    }
    
    // 重置变换以获取原始尺寸
    gridContainer.style.transform = "none";
    
    // 获取网格和包装器的边界矩形
    const gridRect = gridContainer.getBoundingClientRect();
    const wrapperRect = gridWrapper.getBoundingClientRect();
    
    console.log(`网格原始尺寸: ${gridRect.width}x${gridRect.height}`);
    console.log(`包装器尺寸: ${wrapperRect.width}x${wrapperRect.height}`);
    
    // 计算缩放比例
    let scale = 1;
    const scaleX = wrapperRect.width / gridRect.width;
    const scaleY = wrapperRect.height / gridRect.height;
    
    // 只缩小不放大
    scale = Math.min(scaleX, scaleY, 1);
    
    console.log(`缩放比例: ${scale.toFixed(3)} (scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)})`);
    
    // 应用缩放变换
    gridContainer.style.transform = `scale(${scale})`;
    
    console.log(`网格适应完成，缩放比例: ${scale.toFixed(3)}`);
}

function renderGrid() {
    renderGridDOM();
}

function setPathfindingMode(mode) {
    currentMode = mode;
    
    // 更新按钮状态
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`set${mode.charAt(0).toUpperCase() + mode.slice(1)}Mode`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function handleGridCellClick(row, col) {
    if (!currentMode || !gridData[row] || !gridData[row][col]) return;
    
    const cell = gridData[row][col];
    
    switch (currentMode) {
        case 'start':
            if (startCell) {
                gridData[startCell.row][startCell.col].type = 'empty';
            }
            startCell = { row, col };
            cell.type = 'start';
            break;
            
        case 'end':
            if (endCell) {
                gridData[endCell.row][endCell.col].type = 'empty';
            }
            endCell = { row, col };
            cell.type = 'end';
            break;
            
        case 'wall':
            if (cell.type === 'wall') {
                cell.type = 'empty';
            } else if (cell.type === 'empty') {
                cell.type = 'wall';
            }
            break;
    }
    
    renderGrid();
    updatePathDisplay();
}

function findPath() {
    if (!startCell || !endCell) {
        alert('请先设置起点和终点');
        return;
    }
    
    const startTime = performance.now();
    
    // A*算法实现
    const openSet = [startCell];
    const closedSet = [];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};
    
    // 初始化分数
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            gScore[`${r},${c}`] = Infinity;
            fScore[`${r},${c}`] = Infinity;
        }
    }
    
    gScore[`${startCell.row},${startCell.col}`] = 0;
    fScore[`${startCell.row},${startCell.col}`] = heuristic(startCell, endCell);
    
    let nodesExplored = 0;
    
    while (openSet.length > 0) {
        // 找到fScore最小的节点
        let current = openSet[0];
        let currentIndex = 0;
        
        for (let i = 1; i < openSet.length; i++) {
            if (fScore[`${openSet[i].row},${openSet[i].col}`] < fScore[`${current.row},${current.col}`]) {
                current = openSet[i];
                currentIndex = i;
            }
        }
        
        // 如果到达终点
        if (current.row === endCell.row && current.col === endCell.col) {
            pathResult = reconstructPath(cameFrom, current);
            const endTime = performance.now();
            
            // 更新路径信息
            document.getElementById('pathLength').textContent = pathResult.length;
            document.getElementById('calcTime').textContent = `${(endTime - startTime).toFixed(2)}ms`;
            document.getElementById('nodesExplored').textContent = nodesExplored;
            
            updatePathDisplay();
            return;
        }
        
        // 移动current从openSet到closedSet
        openSet.splice(currentIndex, 1);
        closedSet.push(current);
        nodesExplored++;
        
        // 检查邻居
        const neighbors = getNeighbors(current);
        
        for (const neighbor of neighbors) {
            if (closedSet.some(cell => cell.row === neighbor.row && cell.col === neighbor.col)) {
                continue;
            }
            
            // 只有墙体才阻挡路径，门是可以通过的
            if (gridData[neighbor.row][neighbor.col].isWall && !gridData[neighbor.row][neighbor.col].isDoor) {
                continue;
            }
            
            const tentativeGScore = gScore[`${current.row},${current.col}`] + 1;
            
            if (!openSet.some(cell => cell.row === neighbor.row && cell.col === neighbor.col)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= gScore[`${neighbor.row},${neighbor.col}`]) {
                continue;
            }
            
            cameFrom[`${neighbor.row},${neighbor.col}`] = current;
            gScore[`${neighbor.row},${neighbor.col}`] = tentativeGScore;
            fScore[`${neighbor.row},${neighbor.col}`] = gScore[`${neighbor.row},${neighbor.col}`] + heuristic(neighbor, endCell);
        }
    }
    
    alert('未找到路径');
}

function getNeighbors(cell) {
    const neighbors = [];
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],  // 上下左右
        [-1, -1], [-1, 1], [1, -1], [1, 1]  // 对角线
    ];
    
    for (const [dr, dc] of directions) {
        const newRow = cell.row + dr;
        const newCol = cell.col + dc;
        
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
            neighbors.push({ row: newRow, col: newCol });
        }
    }
    
    return neighbors;
}

function heuristic(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    
    while (cameFrom[`${current.row},${current.col}`]) {
        current = cameFrom[`${current.row},${current.col}`];
        path.unshift(current);
    }
    
    return path;
}

function updatePathDisplay() {
    // 清除之前的路径显示
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (gridData[r][c].type === 'path') {
                gridData[r][c].type = 'empty';
            }
        }
    }
    
    // 显示新路径
    pathResult.forEach(cell => {
        if (gridData[cell.row][cell.col].type === 'empty') {
            gridData[cell.row][cell.col].type = 'path';
        }
    });
    
    // 恢复起点和终点
    if (startCell) {
        gridData[startCell.row][startCell.col].type = 'start';
    }
    if (endCell) {
        gridData[endCell.row][endCell.col].type = 'end';
    }
    
    refreshGridUI(pathResult);
}

function resetPath() {
    pathResult = [];
    startCell = null;
    endCell = null;
    currentMode = null;
    
    // 清除路径和起终点
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (['path', 'start', 'end'].includes(gridData[r][c].type)) {
                gridData[r][c].type = 'empty';
            }
        }
    }
    
    // 重置按钮状态
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 重置路径信息
    document.getElementById('pathLength').textContent = '-';
    document.getElementById('calcTime').textContent = '-';
    document.getElementById('nodesExplored').textContent = '-';
    
    refreshGridUI();
}

// ===== 工具函数 =====
function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function distanceToLineSegment(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return distance(point, lineStart);
    
    let param = dot / lenSq;
    
    if (param < 0) {
        return distance(point, lineStart);
    } else if (param > 1) {
        return distance(point, lineEnd);
    } else {
        const projection = {
            x: lineStart.x + param * C,
            y: lineStart.y + param * D
        };
        return distance(point, projection);
    }
}

function lineIntersection(p1, p2, p3, p4) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }
    
    return null;
}

// ===== 3D重建功能 =====
function initializeThreeJS() {
    const container = document.getElementById('threejsContainer');
    if (!container) return;
    
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        5000
    );
    camera.position.set(0, 300, 500);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 清除容器并添加渲染器
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    
    // 添加环境光和平行光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 400, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    scene.add(directionalLight);
    
    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(1000, 100);
    scene.add(gridHelper);
    
    // 添加坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);
    
    // 添加轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.maxDistance = 2000;
    
    // 开始动画循环
    animate3D();
    
    console.log('Three.js 初始化完成');
}

function animate3D() {
    requestAnimationFrame(animate3D);
    if (controls) {
        controls.update();
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function generate3DModel() {
    if (!currentJsonData) {
        alert('请先加载数据');
        return;
    }
    
    // 显示加载遮罩
    showLoading();
    
    try {
        // 清除之前的模型
        clearPreviousModel();
        
        // 确保网格数据存在，如果没有则生成
        if (!gridData || gridData.length === 0) {
            console.log('网格数据不存在，正在生成...');
            generateGridFromData();
        }
        
        // 再次检查网格数据
        if (!gridData || gridData.length === 0) {
            throw new Error('无法生成网格数据，请检查输入数据格式');
        }
        
        console.log(`使用网格数据: ${ROWS}x${COLS}, 边界: [${minX}, ${minY}] -> [${maxX}, ${maxY}]`);
        
        // 创建3D网格数据
        const grid3D = gridData.map((row, r) => row.map((cell, c) => {
            if (cell.isWall) {
                return { 
                    height: 120, 
                    color: "#666666", 
                    isWall: true 
                };
            } else if (cell.isDoor) {
                return { 
                    height: 120 * 0.98, // 门高略小于墙高
                    color: "#8B4513", 
                    isDoor: true, 
                    doorOrientation: determineDoorOrientation(r, c)
                };
            }
            return null;
        }));
        
        console.log(`创建3D网格数据完成: ${grid3D.length}x${grid3D[0].length}`);
        
        // 生成3D地形
        generateTerrain(grid3D);
        
        console.log('3D模型生成完成');
    } catch (error) {
        console.error('3D模型生成失败:', error);
        alert('3D模型生成失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

function determineDoorOrientation(r, c) {
    // 简单的门方向判断逻辑
    // 检查周围的门单元格来确定方向
    let horizontalCount = 0;
    let verticalCount = 0;
    
    // 检查水平方向
    if (c > 0 && gridData[r][c-1].isDoor) horizontalCount++;
    if (c < COLS-1 && gridData[r][c+1].isDoor) horizontalCount++;
    
    // 检查垂直方向
    if (r > 0 && gridData[r-1][c].isDoor) verticalCount++;
    if (r < ROWS-1 && gridData[r+1][c].isDoor) verticalCount++;
    
    return horizontalCount > verticalCount ? 'horizontal' : 'vertical';
}

// 生成3D地形 - 使用新的门生成逻辑
function generateTerrain(grid3D) {
    try {
        console.log('=== 开始生成3D地形 ===');
        
        // 确保Three.js组件已初始化
        if (!scene || !camera || !renderer || !controls) {
            throw new Error("Three.js组件未初始化，请刷新页面重试!");
        }
        
        console.log("Three.js组件检查通过");
        console.log(`网格3D数据尺寸: ${grid3D.length}x${grid3D[0].length}`);
        
        // 清除旧地形
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
        console.log("清除旧场景完成");
        
        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 300, 100);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        console.log("光源添加完成");
        
        const cellSize = 8; // 单元格尺寸
        const halfCellSize = cellSize / 2;
        
        // 计算模型的中心位置
        const centerX = (grid3D[0].length * cellSize) / 2;
        const centerZ = (grid3D.length * cellSize) / 2;
        console.log(`模型中心位置: (${centerX}, ${centerZ})`);
        
        // 创建地板
        const floorGeometry = new THREE.PlaneGeometry(grid3D[0].length * cellSize * 1.5, grid3D.length * cellSize * 1.5);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xe0e0e0, 
            side: THREE.DoubleSide,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        floor.position.set(0, 0, 0);
        floor.receiveShadow = true;
        scene.add(floor);
        console.log("地板创建完成");
        
        // 使用简单的门生成逻辑 - 不进行过度验证
        console.log("开始生成门位置...");
        const doorGroups = generateDoorGroups(grid3D);
        console.log(`门位置生成完成，共 ${doorGroups.length} 个门组`);
        
        // 我们会跟踪哪些位置需要被当作门洞（不生成墙）
        const doorHoleMap = new Map(); // 键为 "r,c" 格式
        
        // 为每个门组创建3D门
        console.log("开始创建3D门...");
        doorGroups.forEach((door, index) => {
            try {
                createSimplifiedDoorFromGroup(door, index, doorHoleMap, grid3D);
            } catch (error) {
                console.error(`创建门组 ${index} 失败:`, error);
            }
        });
        console.log(`3D门创建完成，共创建了 ${doorGroups.length} 个门`);
        
        // 创建墙体，跳过门洞位置
        console.log("开始创建墙体...");
        createWallsExcludingDoorHoles(doorHoleMap, grid3D);
        console.log("墙体创建完成");
        
        // 设置相机位置和目标
        const modelSize = Math.max(grid3D.length, grid3D[0].length) * cellSize;
        camera.position.set(centerX, modelSize * 1.5, centerZ + modelSize * 1.5);
        controls.target.set(0, 60, 0);
        controls.update();
        console.log("相机位置设置完成");
        
        // 添加辅助坐标轴
        const axesHelper = new THREE.AxesHelper(50);
        scene.add(axesHelper);
        
        // 渲染场景
        renderer.render(scene, camera);
        console.log("场景渲染完成");
        
        // 验证3D门的尺寸
        validate3DDoorSizes();
        
        console.log("=== 3D模型生成成功! ===");
    } catch (error) {
        console.error("=== 生成3D模型时出错 ===", error);
        throw error; // 重新抛出错误以便上层处理
    }
}

function clearPreviousModel() {
    // 移除所有墙壁、门和地板
    for (const category in modelObjects) {
        modelObjects[category].forEach(obj => scene.remove(obj));
        modelObjects[category] = [];
    }
}

function generateFloor() {
    // 如果有房间信息，根据房间生成地板
    if (currentJsonData.rooms && Array.isArray(currentJsonData.rooms)) {
        currentJsonData.rooms.forEach((room, index) => {
            if (Array.isArray(room) && room.length >= 3) {
                const floorPoints = room.map(point => new THREE.Vector2(point.x, point.y));
                
                try {
                    const floorShape = new THREE.Shape(floorPoints);
                    const floorGeometry = new THREE.ShapeGeometry(floorShape);
                    
                    const floorColor = document.getElementById('floorColor').value;
                    const floorMaterial = new THREE.MeshStandardMaterial({
                        color: floorColor,
                        roughness: 0.3,
                        side: THREE.DoubleSide
                    });
                    
                    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
                    floorMesh.rotation.x = -Math.PI / 2; // 旋转使地板水平放置
                    floorMesh.position.y = 0;
                    floorMesh.receiveShadow = true;
                    
                    scene.add(floorMesh);
                    modelObjects.floors.push(floorMesh);
                } catch (error) {
                    console.warn('房间地板生成失败:', error);
                }
            }
        });
    } else {
        // 如果没有具体地板信息，创建一个默认地板
        const bounds = calculateBounds(currentJsonData);
        const floorWidth = bounds.maxX - bounds.minX + 100;
        const floorHeight = bounds.maxY - bounds.minY + 100;
        
        const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorHeight);
        const floorColor = document.getElementById('floorColor').value;
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: floorColor,
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(
            (bounds.minX + bounds.maxX) / 2,
            0,
            (bounds.minY + bounds.maxY) / 2
        );
        floor.receiveShadow = true;
        
        scene.add(floor);
        modelObjects.floors.push(floor);
    }
}

function generateWalls() {
    if (!currentJsonData.walls || !currentJsonData.walls.length) {
        console.warn('JSON数据中没有墙壁信息');
        return;
    }
    
    const wallHeight = parseFloat(document.getElementById('wallHeight').value);
    const wallThickness = parseFloat(document.getElementById('wallThickness').value);
    const wallColor = document.getElementById('wallColor').value;
    
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: 0.5
    });
    
    currentJsonData.walls.forEach(wall => {
        if (!wall.position || wall.position.length !== 2) return;
        
        const start = wall.position[0];
        const end = wall.position[1];
        
        if (!start || !end || start.length !== 2 || end.length !== 2) return;
        
        // 计算墙的长度和角度
        const startX = start[0];
        const startZ = start[1];
        const endX = end[0];
        const endZ = end[1];
        
        const length = Math.sqrt(
            Math.pow(endX - startX, 2) + 
            Math.pow(endZ - startZ, 2)
        );
        
        // 计算旋转角度
        const angle = Math.atan2(endZ - startZ, endX - startX);
        
        // 创建墙壁几何体
        const wallGeometry = new THREE.BoxGeometry(
            length, 
            wallHeight, 
            wallThickness
        );
        
        const wall3D = new THREE.Mesh(wallGeometry, wallMaterial);
        
        // 设置墙壁位置和旋转
        wall3D.position.set(
            (startX + endX) / 2,
            wallHeight / 2,
            (startZ + endZ) / 2
        );
        
        wall3D.rotation.y = angle;
        wall3D.castShadow = true;
        wall3D.receiveShadow = true;
        
        scene.add(wall3D);
        modelObjects.walls.push(wall3D);
    });
}

function generateDoors() {
    if (!currentJsonData.doors || !currentJsonData.doors.length) {
        console.warn('JSON数据中没有门的信息');
        return;
    }
    
    const doorHeight = parseFloat(document.getElementById('doorHeight').value);
    const doorColor = document.getElementById('doorColor').value;
    
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: doorColor,
        roughness: 0.5
    });
    
    currentJsonData.doors.forEach((door, index) => {
        if (!door.position || door.position.length !== 2) return;
        
        const start = door.position[0];
        const end = door.position[1];
        
        if (!start || !end || start.length !== 2 || end.length !== 2) return;
        
        // 计算门的长度和角度
        const startX = start[0];
        const startZ = start[1];
        const endX = end[0];
        const endZ = end[1];
        
        const doorWidth = Math.sqrt(
            Math.pow(endX - startX, 2) + 
            Math.pow(endZ - startZ, 2)
        );
        
        // 计算旋转角度
        const angle = Math.atan2(endZ - startZ, endX - startX);
        
        // 门的方向，水平还是垂直
        const doorOrientation = 
            Math.abs(endX - startX) > Math.abs(endZ - startZ) 
                ? 'horizontal' 
                : 'vertical';
        
        // 创建门几何体
        const doorDepth = 5; // 门的厚度
        const doorGeometry = new THREE.BoxGeometry(
            doorOrientation === 'horizontal' ? doorWidth : doorDepth, 
            doorHeight,
            doorOrientation === 'horizontal' ? doorDepth : doorWidth
        );
        
        const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
        
        // 设置门的位置和旋转
        doorMesh.position.set(
            (startX + endX) / 2,
            doorHeight / 2,
            (startZ + endZ) / 2
        );
        
        doorMesh.rotation.y = angle;
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;
        
        scene.add(doorMesh);
        modelObjects.doors.push(doorMesh);
        
        // 添加门把手
        generateDoorHandle(doorMesh, doorOrientation, doorWidth, doorDepth, doorHeight);
    });
}

function generateDoorHandle(doorMesh, orientation, doorWidth, doorDepth, doorHeight) {
    const handleRadius = 3;
    const handleGeometry = new THREE.SphereGeometry(handleRadius, 8, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0xCFB53B, // 金色门把手
        metalness: 0.8,
        roughness: 0.2
    });
    
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    
    // 根据门的方向确定门把手位置
    if (orientation === 'horizontal') {
        // 水平门，把手位于门右侧中间位置
        handle.position.set(
            doorMesh.position.x + (doorWidth / 2) - handleRadius * 2,
            doorMesh.position.y,
            doorMesh.position.z + (doorDepth / 2) + handleRadius / 2
        );
    } else {
        // 垂直门，把手位于门右侧中间位置
        handle.position.set(
            doorMesh.position.x + (doorDepth / 2) + handleRadius / 2,
            doorMesh.position.y,
            doorMesh.position.z + (doorWidth / 2) - handleRadius * 2
        );
    }
    
    handle.castShadow = true;
    scene.add(handle);
    modelObjects.doors.push(handle); // 将门把手也加入门的对象列表
}

function adjustCameraPosition() {
    // 找出所有对象的边界
    const allObjects = [
        ...modelObjects.walls,
        ...modelObjects.doors,
        ...modelObjects.floors
    ];
    
    if (allObjects.length === 0) return;
    
    // 创建一个临时的包围盒
    const boundingBox = new THREE.Box3();
    
    // 计算所有对象的总边界
    allObjects.forEach(obj => {
        if (obj.geometry) {
            obj.geometry.computeBoundingBox();
            const objectBox = new THREE.Box3().setFromObject(obj);
            boundingBox.union(objectBox);
        }
    });
    
    // 计算边界的中心点
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // 计算模型的大小
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.z);
    
    // 设置相机位置
    camera.position.set(
        center.x,
        maxDim * 0.8, // 相机高度
        center.z + maxDim * 1.2 // 相机距离
    );
    
    // 设置相机朝向中心点
    camera.lookAt(center);
    
    // 更新控制器
    controls.target.copy(center);
    controls.update();
}

function updateMaterials() {
    const wallColor = document.getElementById('wallColor').value;
    const floorColor = document.getElementById('floorColor').value;
    const doorColor = document.getElementById('doorColor').value;
    
    // 更新墙体材质
    modelObjects.walls.forEach(wall => {
        if (wall.material) {
            wall.material.color.setHex(wallColor.replace('#', '0x'));
        }
    });
    
    // 更新地板材质
    modelObjects.floors.forEach(floor => {
        if (floor.material) {
            floor.material.color.setHex(floorColor.replace('#', '0x'));
        }
    });
    
    // 更新门材质
    modelObjects.doors.forEach(door => {
        if (door.material && door.material.color.getHex() !== 0xCFB53B) { // 不更新门把手颜色
            door.material.color.setHex(doorColor.replace('#', '0x'));
        }
    });
}

function resetCamera() {
    if (!camera || !controls) return;
    
    camera.position.set(0, 300, 500);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

function setCameraView(viewType) {
    if (!camera || !controls) return;
    
    const bounds = calculateBounds(currentJsonData);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minY + bounds.maxY) / 2;
    const size = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    
    // 创建正交相机用于平行视角
    const container = document.getElementById('threejsContainer');
    const aspect = container.clientWidth / container.clientHeight;
    
    switch (viewType) {
        case 'top':
            // 顶视图 - 使用正交相机
            if (camera.type !== 'OrthographicCamera') {
                const orthoSize = size * 1.2;
                camera = new THREE.OrthographicCamera(
                    -orthoSize * aspect / 2, orthoSize * aspect / 2,
                    orthoSize / 2, -orthoSize / 2,
                    0.1, 5000
                );
                controls.object = camera;
            }
            camera.position.set(centerX, size * 2, centerZ);
            camera.lookAt(centerX, 0, centerZ);
            controls.enableRotate = false; // 禁用旋转保持平行视角
            break;
            
        case 'front':
            // 正视图 - 使用正交相机
            if (camera.type !== 'OrthographicCamera') {
                const orthoSize = size * 1.2;
                camera = new THREE.OrthographicCamera(
                    -orthoSize * aspect / 2, orthoSize * aspect / 2,
                    orthoSize / 2, -orthoSize / 2,
                    0.1, 5000
                );
                controls.object = camera;
            }
            camera.position.set(centerX, size * 0.5, bounds.maxY + size);
            camera.lookAt(centerX, size * 0.5, centerZ);
            controls.enableRotate = false;
            break;
            
        case 'side':
            // 侧视图 - 使用正交相机
            if (camera.type !== 'OrthographicCamera') {
                const orthoSize = size * 1.2;
                camera = new THREE.OrthographicCamera(
                    -orthoSize * aspect / 2, orthoSize * aspect / 2,
                    orthoSize / 2, -orthoSize / 2,
                    0.1, 5000
                );
                controls.object = camera;
            }
            camera.position.set(bounds.maxX + size, size * 0.5, centerZ);
            camera.lookAt(centerX, size * 0.5, centerZ);
            controls.enableRotate = false;
            break;
            
        default:
            // 恢复透视相机用于3D视角
            if (camera.type !== 'PerspectiveCamera') {
                camera = new THREE.PerspectiveCamera(
                    45,
                    aspect,
                    0.1,
                    5000
                );
                controls.object = camera;
            }
            camera.position.set(centerX, size * 1.5, centerZ + size * 1.5);
            camera.lookAt(centerX, 0, centerZ);
            controls.enableRotate = true; // 恢复旋转
            break;
    }
    
    controls.target.set(centerX, 0, centerZ);
    controls.update();
    
    // 更新渲染器
    if (renderer) {
        renderer.render(scene, camera);
    }
}

// ===== 加载遮罩功能 =====
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ===== 更新主页面导航 =====
function updateMainPageNavigation() {
    // 更新主页面的导航，添加新的整合页面
    if (window.opener && window.opener.document) {
        const mainNav = window.opener.document.querySelector('.nav-tabs');
        if (mainNav) {
            // 检查是否已经存在整合页面的导航
            const existingTab = mainNav.querySelector('[data-tab="integrated-analysis"]');
            if (!existingTab) {
                const newTab = document.createElement('button');
                newTab.className = 'nav-tab';
                newTab.setAttribute('data-tab', 'integrated-analysis');
                newTab.innerHTML = `
                    <i class="fas fa-drafting-compass"></i>
                    <span data-en="Integrated Analysis" data-zh="整合分析">整合分析</span>
                `;
                
                newTab.addEventListener('click', () => {
                    window.open('手绘平面图分析与重建.html', '_blank');
                });
                
                mainNav.appendChild(newTab);
            }
        }
    }
}

// 在页面加载完成后调用
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateMainPageNavigation, 1000);
});

// ===== 平面图图片上传功能 =====
function handleFloorPlanImageUpload(event) {
    console.log('图片上传事件触发');
    
    const file = event.target.files[0];
    if (!file) {
        console.log('没有选择文件');
        return;
    }
    
    console.log('选择的文件:', file.name, '大小:', file.size, '类型:', file.type);
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
    }
    
    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
        alert('图片文件过大，请选择小于10MB的图片');
        return;
    }
    
    console.log('开始读取文件...');
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('文件读取完成，开始显示预览');
        currentFloorPlanImage = e.target.result;
        
        // 直接显示预览，使用与主程序相同的简单方法
        const preview = document.getElementById('floorPlanPreview');
        const container = document.getElementById('imagePreviewContainer');
        
        console.log('预览元素:', preview);
        console.log('容器元素:', container);
        
        if (preview && container) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            container.style.display = 'block';
            console.log('图片预览设置完成');
        } else {
            console.error('找不到预览元素');
            // 如果找不到，尝试创建一个简单的预览
            const dataInputContent = document.querySelector('#data-input .analysis-main-content');
            if (dataInputContent) {
                let existingPreview = dataInputContent.querySelector('.temp-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                const tempPreview = document.createElement('div');
                tempPreview.className = 'temp-preview';
                tempPreview.style.cssText = 'margin: 20px 0; padding: 20px; border: 2px dashed #ccc; text-align: center;';
                tempPreview.innerHTML = `
                    <h4>图片预览</h4>
                    <img src="${e.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                `;
                dataInputContent.appendChild(tempPreview);
                console.log('创建临时预览成功');
            }
        }
    };
    reader.onerror = function() {
        console.error('文件读取失败');
        alert('文件读取失败');
    };
    reader.readAsDataURL(file);
}

function clearFloorPlanImage() {
    currentFloorPlanImage = null;
    
    // 清除原始预览元素
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImage = document.getElementById('floorPlanPreview');
    
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    if (previewImage) {
        previewImage.src = '';
        previewImage.style.display = 'none';
    }
    
    // 清除临时预览元素
    const tempPreview = document.querySelector('.temp-preview');
    if (tempPreview) {
        tempPreview.remove();
    }
    
    // 清除文件输入
    const fileInput = document.getElementById('floorPlanImageUpload');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // 清除错误信息
    const errorDiv = document.getElementById('vectorizationError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    console.log('图片预览已清除');
}

function vectorizeFloorPlanImage() {
    if (!currentFloorPlanImage) {
        alert('请先上传平面图图片');
        return;
    }
    
    // 显示加载状态
    document.getElementById('vectorizationLoading').style.display = 'block';
    document.getElementById('vectorizationError').style.display = 'none';
    
    // 调用矢量化API
    callFloorPlanVectorAPI(currentFloorPlanImage)
        .then(data => {
            document.getElementById('vectorizationLoading').style.display = 'none';
            handleFloorPlanVectorSuccess(data);
        })
        .catch(error => {
            document.getElementById('vectorizationLoading').style.display = 'none';
            handleFloorPlanVectorError(error);
        });
}

function callFloorPlanVectorAPI(dataURL) {
    return new Promise((resolve, reject) => {
        try {
            // 提取base64数据
            const base64Data = dataURL.split(',')[1];
            
            // 使用与主程序一致的API
            const data = JSON.stringify({ image: base64Data });
            const apiUrl = 'https://backend.rasterscan.com/raster-to-vector-base64';
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);
            
            fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'x-api-key': 'sk-693d8b4ffc3cdd6c8f726f09f81d852bf0ecc900',
                    'Content-Type': 'application/json'
                },
                body: data
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function handleFloorPlanVectorSuccess(data) {
    try {
        // 将矢量化结果转换为标准JSON格式
        const jsonData = convertVectorToStandardFormat(data);
        
        // 更新JSON输入框
        document.getElementById('jsonInput').value = JSON.stringify(jsonData, null, 2);
        
        // 加载数据
        loadJsonData(jsonData);
        
        // 显示成功消息
        showSuccessMessage('平面图矢量化成功！数据已自动加载。');
        
        console.log('平面图矢量化成功:', jsonData);
    } catch (error) {
        handleFloorPlanVectorError(error);
    }
}

function handleFloorPlanVectorError(error) {
    const errorDiv = document.getElementById('vectorizationError');
    errorDiv.style.display = 'block';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span data-en="Vectorization failed: ${error.message}" data-zh="矢量化失败: ${error.message}">矢量化失败: ${error.message}</span>
    `;
    
    console.error('平面图矢量化失败:', error);
    
    // 更新语言
    switchLanguage(currentLanguage);
}

function convertVectorToStandardFormat(vectorData) {
    // 直接返回API的原始数据，不进行格式转换
    // 因为主程序的drawFloorPlanFromVector函数已经能正确处理API返回的原始格式
    
    console.log('API返回的原始数据:', vectorData);
    
    // 检查数据是否有效
    if (!vectorData || typeof vectorData !== 'object') {
        console.warn('API返回的数据无效，使用默认数据');
        return createDefaultFloorPlanData();
    }
    
    // 直接返回API的原始数据
    return vectorData;
}

function createDefaultFloorPlanData() {
    // 创建一个基本的平面图结构作为示例
    return {
        walls: [
            {"position": [[0, 0], [200, 0]]},
            {"position": [[200, 0], [200, 150]]},
            {"position": [[200, 150], [0, 150]]},
            {"position": [[0, 150], [0, 0]]}
        ],
        doors: [
            {"bbox": [[80, 0], [120, 0], [120, 10], [80, 10]]}
        ],
        rooms: [
            [{"x": 10, "y": 10}, {"x": 190, "y": 10}, {"x": 190, "y": 140}, {"x": 10, "y": 140}]
        ]
    };
}

function showSuccessMessage(message) {
    // 创建成功提示
    const successDiv = document.createElement('div');
    successDiv.className = 'status-indicator success';
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '9999';
    successDiv.style.padding = '12px 20px';
    successDiv.style.borderRadius = '8px';
    successDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(successDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function calculateBounds(data) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // 处理墙体数据
    if (data.walls && Array.isArray(data.walls)) {
        data.walls.forEach(wall => {
            if (wall.position && Array.isArray(wall.position)) {
                wall.position.forEach(point => {
                    if (Array.isArray(point) && point.length >= 2) {
                        minX = Math.min(minX, point[0]);
                        maxX = Math.max(maxX, point[0]);
                        minY = Math.min(minY, point[1]);
                        maxY = Math.max(maxY, point[1]);
                    }
                });
            }
        });
    }
    
    // 处理门数据
    if (data.doors && Array.isArray(data.doors)) {
        data.doors.forEach(door => {
            if (door.bbox && Array.isArray(door.bbox)) {
                door.bbox.forEach(point => {
                    if (Array.isArray(point) && point.length >= 2) {
                        minX = Math.min(minX, point[0]);
                        maxX = Math.max(maxX, point[0]);
                        minY = Math.min(minY, point[1]);
                        maxY = Math.max(maxY, point[1]);
                    }
                });
            }
            // 兼容旧格式的门数据
            if (door.position && Array.isArray(door.position)) {
                door.position.forEach(point => {
                    if (Array.isArray(point) && point.length >= 2) {
                        minX = Math.min(minX, point[0]);
                        maxX = Math.max(maxX, point[0]);
                        minY = Math.min(minY, point[1]);
                        maxY = Math.max(maxY, point[1]);
                    }
                });
            }
        });
    }
    
    // 处理房间数据
    if (data.rooms && Array.isArray(data.rooms)) {
        data.rooms.forEach(room => {
            if (Array.isArray(room)) {
                room.forEach(point => {
                    if (point && typeof point === 'object' && 'x' in point && 'y' in point) {
                        minX = Math.min(minX, point.x);
                        maxX = Math.max(maxX, point.x);
                        minY = Math.min(minY, point.y);
                        maxY = Math.max(maxY, point.y);
                    }
                });
            }
        });
    }
    
    if (minX === Infinity) {
        return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
    
    return { minX, minY, maxX, maxY };
}

function calculateScale(canvas, bounds) {
    const margin = 50;
    const dataWidth = bounds.maxX - bounds.minX;
    const dataHeight = bounds.maxY - bounds.minY;
    const scaleX = (canvas.width - margin * 2) / dataWidth;
    const scaleY = (canvas.height - margin * 2) / dataHeight;
    return Math.min(scaleX, scaleY);
}

function calculateOffset(canvas, bounds, scale) {
    const dataWidth = bounds.maxX - bounds.minX;
    const dataHeight = bounds.maxY - bounds.minY;
    const offsetX = (canvas.width - dataWidth * scale) / 2;
    const offsetY = (canvas.height - dataHeight * scale) / 2;
    return { x: offsetX, y: offsetY };
}

// 新的门生成逻辑 - 基于门框与墙的布尔交集
function generateDoorPositionsFromIntersection() {
    console.log('=== 开始生成门位置 ===');
    
    // 检查必要的数据
    if (!currentJsonData) {
        console.error('currentJsonData 不存在');
        return [];
    }
    
    if (!gridData || gridData.length === 0) {
        console.error('gridData 不存在或为空');
        return [];
    }
    
    if (typeof minX === 'undefined' || typeof scaleX === 'undefined') {
        console.error('边界或缩放变量未定义:', { minX, maxX, minY, maxY, scaleX, scaleY });
        return [];
    }
    
    const doorPositions = [];
    const doors = currentJsonData.doors || [];
    
    console.log(`处理 ${doors.length} 个门`);
    console.log(`网格尺寸: ${ROWS}x${COLS}`);
    console.log(`边界: [${minX}, ${minY}] -> [${maxX}, ${maxY}]`);
    console.log(`缩放: scaleX=${scaleX}, scaleY=${scaleY}`);
    
    // 首先检查网格中是否有门标记
    let totalDoorCells = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (gridData[r] && gridData[r][c] && gridData[r][c].isDoor) {
                totalDoorCells++;
            }
        }
    }
    console.log(`网格中总共有 ${totalDoorCells} 个门单元格`);
    
    doors.forEach((door, doorIndex) => {
        console.log(`\n--- 处理门 ${doorIndex} ---`);
        console.log('门数据:', door);
        
        if (!door.bbox || door.bbox.length !== 4) {
            console.warn(`门 ${doorIndex}: bbox格式不正确`, door);
            return;
        }
        
        const [p1, p2, p3, p4] = door.bbox;
        
        // 计算门的边界框
        const doorMinX = Math.min(p1[0], p2[0], p3[0], p4[0]);
        const doorMaxX = Math.max(p1[0], p2[0], p3[0], p4[0]);
        const doorMinY = Math.min(p1[1], p2[1], p3[1], p4[1]);
        const doorMaxY = Math.max(p1[1], p2[1], p3[1], p4[1]);
        
        // 计算门的尺寸和方向
        const doorWidth = doorMaxX - doorMinX;
        const doorHeight = doorMaxY - doorMinY;
        const isHorizontal = doorWidth > doorHeight;
        
        console.log(`门 ${doorIndex}: 边界=[${doorMinX.toFixed(1)}, ${doorMinY.toFixed(1)}] -> [${doorMaxX.toFixed(1)}, ${doorMaxY.toFixed(1)}], 尺寸=${doorWidth.toFixed(1)}x${doorHeight.toFixed(1)}, 方向=${isHorizontal ? '水平' : '垂直'}`);
        
        // 将门的世界坐标转换为网格坐标范围
        const gridStartCol = Math.floor((doorMinX - minX) / scaleX);
        const gridEndCol = Math.floor((doorMaxX - minX) / scaleX);
        const gridStartRow = Math.floor((doorMinY - minY) / scaleY);
        const gridEndRow = Math.floor((doorMaxY - minY) / scaleY);
        
        console.log(`门 ${doorIndex}: 原始网格范围 [${gridStartRow}, ${gridStartCol}] -> [${gridEndRow}, ${gridEndCol}]`);
        
        // 确保在网格范围内
        const clampedStartCol = Math.max(0, Math.min(gridStartCol, COLS - 1));
        const clampedEndCol = Math.max(0, Math.min(gridEndCol, COLS - 1));
        const clampedStartRow = Math.max(0, Math.min(gridStartRow, ROWS - 1));
        const clampedEndRow = Math.max(0, Math.min(gridEndRow, ROWS - 1));
        
        console.log(`门 ${doorIndex}: 限制后网格范围 [${clampedStartRow}, ${clampedStartCol}] -> [${clampedEndRow}, ${clampedEndCol}]`);
        
        // 收集门框区域内与墙相交的网格单元格
        const intersectionCells = [];
        
        for (let r = clampedStartRow; r <= clampedEndRow; r++) {
            for (let c = clampedStartCol; c <= clampedEndCol; c++) {
                if (r < ROWS && c < COLS && gridData[r] && gridData[r][c]) {
                    const cellWorldX = minX + c * scaleX + scaleX / 2;
                    const cellWorldY = minY + r * scaleY + scaleY / 2;
                    
                    // 检查单元格中心是否在门的边界框内
                    const isInDoorBbox = cellWorldX >= doorMinX && cellWorldX <= doorMaxX &&
                                        cellWorldY >= doorMinY && cellWorldY <= doorMaxY;
                    
                    if (isInDoorBbox) {
                        console.log(`  单元格 [${r}, ${c}]: 在门框内, 类型=${gridData[r][c].type}, isWall=${gridData[r][c].isWall}, isDoor=${gridData[r][c].isDoor}`);
                        
                        // 修改逻辑：收集所有在门框内的单元格，不管是墙还是门
                        if (gridData[r][c].isWall || gridData[r][c].isDoor) {
                            intersectionCells.push({
                                row: r,
                                col: c,
                                worldX: cellWorldX,
                                worldY: cellWorldY,
                                type: gridData[r][c].type
                            });
                        }
                    }
                }
            }
        }
        
        console.log(`门 ${doorIndex}: 找到 ${intersectionCells.length} 个相关单元格`);
        
        if (intersectionCells.length === 0) {
            console.warn(`门 ${doorIndex}: 没有找到与墙的交集`);
            return;
        }
        
        // 根据门的方向采样出一条线
        const doorLine = sampleDoorLine(intersectionCells, isHorizontal);
        
        if (doorLine.length === 0) {
            console.warn(`门 ${doorIndex}: 无法采样出门线`);
            return;
        }
        
        console.log(`门 ${doorIndex}: 采样得到 ${doorLine.length} 个单元格的门线`);
        
        // 计算门的3D位置和尺寸
        const doorPosition = calculateDoorPosition(doorLine, isHorizontal, doorWidth, doorHeight);
        
        if (doorPosition) {
            doorPosition.doorIndex = doorIndex;
            doorPosition.cells = doorLine;
            doorPositions.push(doorPosition);
            console.log(`门 ${doorIndex}: 生成门位置成功`, doorPosition);
        } else {
            console.warn(`门 ${doorIndex}: 计算门位置失败`);
        }
    });
    
    // 去重：如果多个门位置重叠，只保留第一个
    const uniqueDoorPositions = removeDuplicateDoorPositions(doorPositions);
    
    console.log(`门位置去重: ${doorPositions.length} -> ${uniqueDoorPositions.length}`);
    console.log('=== 门位置生成完成 ===\n');
    
    return uniqueDoorPositions;
}

// 根据门的方向采样出一条线
function sampleDoorLine(intersectionCells, isHorizontal) {
    if (intersectionCells.length === 0) return [];
    
    if (isHorizontal) {
        // 水平门：选择中间行，按列排序
        const rows = [...new Set(intersectionCells.map(cell => cell.row))];
        const middleRow = rows[Math.floor(rows.length / 2)];
        
        const lineCells = intersectionCells
            .filter(cell => cell.row === middleRow)
            .sort((a, b) => a.col - b.col);
            
        console.log(`水平门采样: 选择行 ${middleRow}, 得到 ${lineCells.length} 个单元格`);
        return lineCells;
    } else {
        // 垂直门：选择中间列，按行排序
        const cols = [...new Set(intersectionCells.map(cell => cell.col))];
        const middleCol = cols[Math.floor(cols.length / 2)];
        
        const lineCells = intersectionCells
            .filter(cell => cell.col === middleCol)
            .sort((a, b) => a.row - b.row);
            
        console.log(`垂直门采样: 选择列 ${middleCol}, 得到 ${lineCells.length} 个单元格`);
        return lineCells;
    }
}

// 计算门的3D位置和尺寸
function calculateDoorPosition(doorLine, isHorizontal, originalWidth, originalHeight) {
    if (doorLine.length === 0) return null;
    
    // 使用新的方向分析逻辑
    const actualOrientation = analyzeDoorOrientation(doorLine, []);
    const isActuallyHorizontal = actualOrientation === 'horizontal';
    
    console.log(`原始方向判断: ${isHorizontal ? '水平' : '垂直'}, 实际方向: ${isActuallyHorizontal ? '水平' : '垂直'}`);
    
    const cellSize = 8;
    const centerX = (COLS * cellSize) / 2;
    const centerZ = (ROWS * cellSize) / 2;
    
    // 计算门线的中心位置
    const firstCell = doorLine[0];
    const lastCell = doorLine[doorLine.length - 1];
    
    const centerRow = (firstCell.row + lastCell.row) / 2;
    const centerCol = (firstCell.col + lastCell.col) / 2;
    
    // 计算3D世界坐标
    const doorX = centerCol * cellSize - centerX + cellSize / 2;
    const doorZ = centerRow * cellSize - centerZ + cellSize / 2;
    
    // 计算门的尺寸 - 使用实际方向
    let doorWidth, doorDepth;
    const doorHeight = 120 * 0.98; // 门高略小于墙高
    const wallThickness = cellSize; // 墙的厚度
    
    if (isActuallyHorizontal) {
        // 水平门：门与水平墙平行，开口在水平方向
        // 门的宽度 = 开口的长度（门线的长度）
        // 门的深度 = 墙的厚度
        doorWidth = doorLine.length * cellSize; // 开口宽度
        doorDepth = wallThickness * 0.8; // 略小于墙厚度
    } else {
        // 垂直门：门与垂直墙平行，开口在垂直方向
        // 门的宽度 = 墙的厚度
        // 门的深度 = 开口的长度（门线的长度）
        doorWidth = wallThickness * 0.8; // 略小于墙厚度
        doorDepth = doorLine.length * cellSize; // 开口宽度
    }
    
    console.log(`门尺寸计算: ${isActuallyHorizontal ? '水平' : '垂直'}门, 门线长度=${doorLine.length}, 宽度=${doorWidth.toFixed(1)}, 深度=${doorDepth.toFixed(1)}`);
    
    return {
        x: doorX,
        y: doorHeight / 2,
        z: doorZ,
        width: doorWidth,
        height: doorHeight,
        depth: doorDepth,
        orientation: actualOrientation,
        line: doorLine
    };
}

// 去除重复的门位置
function removeDuplicateDoorPositions(doorPositions) {
    const uniquePositions = [];
    const positionMap = new Map();
    
    doorPositions.forEach(doorPos => {
        // 使用门的网格位置作为唯一标识
        const key = doorPos.line.map(cell => `${cell.row},${cell.col}`).sort().join('|');
        
        if (!positionMap.has(key)) {
            positionMap.set(key, true);
            uniquePositions.push(doorPos);
        } else {
            console.log(`门位置重复，跳过: 门 ${doorPos.doorIndex}`);
        }
    });
    
    return uniquePositions;
}

// 创建单个3D门
function createSingle3DDoor(doorPosition, index) {
    const doorGeometry = new THREE.BoxGeometry(
        doorPosition.width, 
        doorPosition.height, 
        doorPosition.depth
    );
    
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.5
    });
    
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.set(doorPosition.x, doorPosition.y, doorPosition.z);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    scene.add(doorMesh);
    modelObjects.doors.push(doorMesh);
    
    console.log(`创建3D门 ${index}: 位置=(${doorPosition.x.toFixed(1)}, ${doorPosition.y.toFixed(1)}, ${doorPosition.z.toFixed(1)}), 尺寸=${doorPosition.width.toFixed(1)}x${doorPosition.height.toFixed(1)}x${doorPosition.depth.toFixed(1)}, 方向=${doorPosition.orientation}`);
}

// 创建墙体，排除门的位置
function createWallsExcludingDoorHoles(doorHoleMap, grid3D) {
    const cellSize = 8;
    const centerX = (COLS * cellSize) / 2;
    const centerZ = (ROWS * cellSize) / 2;
    
    let wallCount = 0;
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const key = `${r},${c}`;
            
            // 如果是墙但不在门的排除列表中，则创建墙体
            if (grid3D[r][c] && grid3D[r][c].isWall && !doorHoleMap.has(key)) {
                const wallHeight = grid3D[r][c].height;
                
                const geometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
                const material = new THREE.MeshStandardMaterial({ 
                    color: grid3D[r][c].color,
                    roughness: 0.7 
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    c * cellSize - centerX + cellSize / 2,
                    wallHeight / 2,
                    r * cellSize - centerZ + cellSize / 2
                );
                
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                modelObjects.walls.push(mesh);
                wallCount++;
            }
        }
    }
    
    console.log(`创建了 ${wallCount} 个墙体，排除了 ${doorHoleMap.size} 个门洞位置`);
}

// 备用门生成方案 - 直接从JSON数据生成简单的门
function generateFallbackDoors() {
    console.log('=== 开始备用门生成方案 ===');
    
    if (!currentJsonData || !currentJsonData.doors) {
        console.log('没有门数据，返回空数组');
        return [];
    }
    
    const fallbackDoors = [];
    const cellSize = 8;
    const centerX = (COLS * cellSize) / 2;
    const centerZ = (ROWS * cellSize) / 2;
    
    currentJsonData.doors.forEach((door, index) => {
        console.log(`处理备用门 ${index}:`, door);
        
        let doorMinX, doorMaxX, doorMinY, doorMaxY;
        
        // 处理不同的门数据格式
        if (door.bbox && door.bbox.length === 4) {
            // 使用bbox格式
            const [p1, p2, p3, p4] = door.bbox;
            doorMinX = Math.min(p1[0], p2[0], p3[0], p4[0]);
            doorMaxX = Math.max(p1[0], p2[0], p3[0], p4[0]);
            doorMinY = Math.min(p1[1], p2[1], p3[1], p4[1]);
            doorMaxY = Math.max(p1[1], p2[1], p3[1], p4[1]);
        } else if (door.position && door.position.length === 2) {
            // 使用position格式
            const [start, end] = door.position;
            doorMinX = Math.min(start[0], end[0]);
            doorMaxX = Math.max(start[0], end[0]);
            doorMinY = Math.min(start[1], end[1]);
            doorMaxY = Math.max(start[1], end[1]);
        } else {
            console.warn(`门 ${index} 数据格式不支持，跳过`);
            return;
        }
        
        // 计算门的中心位置和尺寸
        const doorCenterX = (doorMinX + doorMaxX) / 2;
        const doorCenterY = (doorMinY + doorMaxY) / 2;
        const doorWidth = doorMaxX - doorMinX;
        const doorHeight = doorMaxY - doorMinY;
        
        // 更智能的方向判断 - 分析门周围的墙体
        const gridCol = Math.floor((doorCenterX - minX) / scaleX);
        const gridRow = Math.floor((doorCenterY - minY) / scaleY);
        
        // 检查门周围的墙体分布
        let wallsAboveBelow = 0;
        let wallsLeftRight = 0;
        
        // 检查上下左右的墙体
        const checkRange = 2; // 检查范围
        for (let dr = -checkRange; dr <= checkRange; dr++) {
            for (let dc = -checkRange; dc <= checkRange; dc++) {
                const r = gridRow + dr;
                const c = gridCol + dc;
                
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && gridData[r] && gridData[r][c] && gridData[r][c].isWall) {
                    if (Math.abs(dr) > Math.abs(dc)) {
                        wallsAboveBelow++; // 主要在上下方向
                    } else if (Math.abs(dc) > Math.abs(dr)) {
                        wallsLeftRight++; // 主要在左右方向
                    }
                }
            }
        }
        
        // 根据墙体分布判断门的实际方向
        const isActuallyHorizontal = wallsLeftRight > wallsAboveBelow;
        
        console.log(`备用门 ${index} 方向分析: 上下墙体=${wallsAboveBelow}, 左右墙体=${wallsLeftRight}, 判断为${isActuallyHorizontal ? '水平' : '垂直'}门`);
        
        // 转换为3D坐标
        const worldX = doorCenterX - minX;
        const worldZ = doorCenterY - minY;
        
        // 转换为网格坐标
        const door3DX = gridCol * cellSize - centerX + cellSize / 2;
        const door3DZ = gridRow * cellSize - centerZ + cellSize / 2;
        
        // 计算3D尺寸
        let door3DWidth, door3DDepth;
        const door3DHeight = 120 * 0.98;
        const wallThickness = cellSize; // 墙的厚度
        
        if (isActuallyHorizontal) {
            // 水平门：门与水平墙平行
            // 门的宽度 = 原始门的宽度（开口宽度）
            // 门的深度 = 墙的厚度
            door3DWidth = doorWidth * (cellSize / scaleX); // 按比例转换开口宽度
            door3DDepth = wallThickness * 0.8; // 略小于墙厚度
        } else {
            // 垂直门：门与垂直墙平行
            // 门的宽度 = 墙的厚度
            // 门的深度 = 原始门的高度（开口宽度）
            door3DWidth = wallThickness * 0.8; // 略小于墙厚度
            door3DDepth = doorHeight * (cellSize / scaleY); // 按比例转换开口宽度
        }
        
        const doorPosition = {
            x: door3DX,
            y: door3DHeight / 2,
            z: door3DZ,
            width: door3DWidth,
            height: door3DHeight,
            depth: door3DDepth,
            orientation: isActuallyHorizontal ? 'horizontal' : 'vertical',
            doorIndex: index
        };
        
        fallbackDoors.push(doorPosition);
        console.log(`备用门 ${index} 生成成功:`, doorPosition);
    });
    
    console.log(`=== 备用门生成完成，共 ${fallbackDoors.length} 个门 ===`);
    return fallbackDoors;
}

// 分析门周围的墙体结构，确定门的真实方向
function analyzeDoorOrientation(doorLine, intersectionCells) {
    if (doorLine.length === 0) return 'horizontal';
    
    console.log('开始分析门的方向...');
    
    // 计算门线的边界
    const minRow = Math.min(...doorLine.map(cell => cell.row));
    const maxRow = Math.max(...doorLine.map(cell => cell.row));
    const minCol = Math.min(...doorLine.map(cell => cell.col));
    const maxCol = Math.max(...doorLine.map(cell => cell.col));
    
    console.log(`门线边界: 行[${minRow}, ${maxRow}], 列[${minCol}, ${maxCol}]`);
    
    // 检查门线周围的墙体分布
    let wallsAboveBelow = 0; // 上下方向的墙体数量
    let wallsLeftRight = 0;  // 左右方向的墙体数量
    
    // 检查门线上方和下方是否有墙
    for (let col = minCol; col <= maxCol; col++) {
        // 检查上方
        if (minRow > 0 && gridData[minRow - 1] && gridData[minRow - 1][col] && gridData[minRow - 1][col].isWall) {
            wallsAboveBelow++;
        }
        // 检查下方
        if (maxRow < ROWS - 1 && gridData[maxRow + 1] && gridData[maxRow + 1][col] && gridData[maxRow + 1][col].isWall) {
            wallsAboveBelow++;
        }
    }
    
    // 检查门线左侧和右侧是否有墙
    for (let row = minRow; row <= maxRow; row++) {
        // 检查左侧
        if (minCol > 0 && gridData[row] && gridData[row][minCol - 1] && gridData[row][minCol - 1].isWall) {
            wallsLeftRight++;
        }
        // 检查右侧
        if (maxCol < COLS - 1 && gridData[row] && gridData[row][maxCol + 1] && gridData[row][maxCol + 1].isWall) {
            wallsLeftRight++;
        }
    }
    
    console.log(`墙体分布: 上下方向=${wallsAboveBelow}, 左右方向=${wallsLeftRight}`);
    
    // 根据墙体分布判断门的方向
    // 如果上下有更多墙体，说明门是垂直的（门板垂直于上下的墙）
    // 如果左右有更多墙体，说明门是水平的（门板垂直于左右的墙）
    const isHorizontalDoor = wallsLeftRight > wallsAboveBelow;
    
    console.log(`门的真实方向: ${isHorizontalDoor ? '水平' : '垂直'} (基于墙体分布分析)`);
    
    return isHorizontalDoor ? 'horizontal' : 'vertical';
}

// 验证门位置的门生成逻辑 - 确保门只在与墙重叠的部分出现
function generateValidatedDoorGroups(grid3D) {
    console.log('=== 开始验证门分组 ===');
    
    const doorGroups = [];
    
    // 辅助函数：检查位置是否为门
    function isDoor(r, c) {
        return r >= 0 && r < grid3D.length && 
               c >= 0 && c < grid3D[0].length && 
               grid3D[r][c] && grid3D[r][c].isDoor;
    }
    
    // 辅助函数：检查位置是否为墙
    function isWall(r, c) {
        return r >= 0 && r < grid3D.length && 
               c >= 0 && c < grid3D[0].length && 
               grid3D[r][c] && grid3D[r][c].isWall;
    }
    
    // 辅助函数：验证门单元格是否与墙重叠或相邻
    function validateDoorCell(r, c) {
        // 检查当前位置是否原本是墙（被门替换）
        if (isWall(r, c)) {
            return true;
        }
        
        // 检查周围是否有墙（门应该在墙的开口处）
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // 上下左右
            [-1, -1], [-1, 1], [1, -1], [1, 1] // 对角线
        ];
        
        let adjacentWalls = 0;
        for (const [dr, dc] of directions) {
            if (isWall(r + dr, c + dc)) {
                adjacentWalls++;
            }
        }
        
        // 门单元格周围至少要有2个墙单元格
        return adjacentWalls >= 2;
    }
    
    // 将门分组，但只包含有效的门
    const visited = Array(grid3D.length).fill().map(() => Array(grid3D[0].length).fill(false));
    
    for (let r = 0; r < grid3D.length; r++) {
        for (let c = 0; c < grid3D[0].length; c++) {
            if (isDoor(r, c) && !visited[r][c] && validateDoorCell(r, c)) {
                const door = {
                    cells: [],
                    orientation: grid3D[r][c].doorOrientation || 'horizontal'
                };
                
                // 使用BFS收集相邻的有效门单元格
                const queue = [{r, c}];
                visited[r][c] = true;
                
                while (queue.length > 0) {
                    const {r: cr, c: cc} = queue.shift();
                    
                    // 验证当前单元格
                    if (validateDoorCell(cr, cc)) {
                        door.cells.push({r: cr, c: cc});
                        
                        // 检查相邻的门单元格
                        const dirs = [{dr: -1, dc: 0}, {dr: 1, dc: 0}, {dr: 0, dc: -1}, {dr: 0, dc: 1}];
                        
                        for (const {dr, dc} of dirs) {
                            const nr = cr + dr;
                            const nc = cc + dc;
                            
                            if (isDoor(nr, nc) && !visited[nr][nc] && 
                                (grid3D[nr][nc].doorOrientation || 'horizontal') === door.orientation) {
                                visited[nr][nc] = true;
                                queue.push({r: nr, c: nc});
                            }
                        }
                    }
                }
                
                // 只有当门组有有效单元格时才添加
                if (door.cells.length > 0) {
                    doorGroups.push(door);
                    console.log(`验证门组 ${doorGroups.length - 1}: ${door.cells.length} 个有效单元格, 方向=${door.orientation}`);
                } else {
                    console.log(`跳过无效门组: 位置[${r}, ${c}], 没有与墙重叠的单元格`);
                }
            }
        }
    }
    
    // 进一步验证：确保每个门组至少有最小尺寸
    const validatedDoorGroups = doorGroups.filter(door => {
        const minCells = 2; // 门至少需要2个单元格
        if (door.cells.length < minCells) {
            console.log(`移除过小的门组: 只有 ${door.cells.length} 个单元格，少于最小要求 ${minCells}`);
            return false;
        }
        return true;
    });
    
    console.log(`=== 验证门分组完成，共 ${validatedDoorGroups.length} 个有效门组 ===`);
    return validatedDoorGroups;
}

// 基于参考代码的门分组逻辑
function generateDoorGroups(grid3D) {
    console.log('=== 开始门分组 ===');
    console.log(`网格3D尺寸: ${grid3D.length}x${grid3D[0].length}`);
    
    // 调试：检查网格中是否有门
    let totalDoorCells = 0;
    let totalWallCells = 0;
    for (let r = 0; r < grid3D.length; r++) {
        for (let c = 0; c < grid3D[0].length; c++) {
            if (grid3D[r][c]) {
                if (grid3D[r][c].isDoor) {
                    totalDoorCells++;
                    console.log(`发现门单元格: [${r}, ${c}], 方向=${grid3D[r][c].doorOrientation}`);
                }
                if (grid3D[r][c].isWall) {
                    totalWallCells++;
                }
            }
        }
    }
    console.log(`网格统计: 门单元格=${totalDoorCells}, 墙单元格=${totalWallCells}`);
    
    const doorGroups = [];
    
    // 辅助函数：检查位置是否为门
    function isDoor(r, c) {
        return r >= 0 && r < grid3D.length && 
               c >= 0 && c < grid3D[0].length && 
               grid3D[r][c] && grid3D[r][c].isDoor;
    }
    
    // 将门分组
    const visited = Array(grid3D.length).fill().map(() => Array(grid3D[0].length).fill(false));
    
    for (let r = 0; r < grid3D.length; r++) {
        for (let c = 0; c < grid3D[0].length; c++) {
            if (isDoor(r, c) && !visited[r][c]) {
                const door = {
                    cells: [{r, c}],
                    orientation: grid3D[r][c].doorOrientation || 'horizontal'
                };
                
                visited[r][c] = true;
                
                // 寻找相邻的门
                const stack = [{r, c}];
                while (stack.length > 0) {
                    const {r: cr, c: cc} = stack.pop();
                    const dirs = [{dr: -1, dc: 0}, {dr: 1, dc: 0}, {dr: 0, dc: -1}, {dr: 0, dc: 1}];
                    
                    for (const {dr, dc} of dirs) {
                        const nr = cr + dr;
                        const nc = cc + dc;
                        
                        if (isDoor(nr, nc) && !visited[nr][nc] && 
                            (grid3D[nr][nc].doorOrientation || 'horizontal') === door.orientation) {
                            door.cells.push({r: nr, c: nc});
                            visited[nr][nc] = true;
                            stack.push({r: nr, c: nc});
                        }
                    }
                }
                
                doorGroups.push(door);
                console.log(`门组 ${doorGroups.length - 1}: ${door.cells.length} 个单元格, 方向=${door.orientation}`);
            }
        }
    }
    
    console.log(`=== 门分组完成，共 ${doorGroups.length} 个门组 ===`);
    return doorGroups;
}

// 基于参考代码的门创建逻辑
function createDoorFromGroup(door, index, doorHoleMap, grid3D) {
    const cellSize = 8;
    const halfCellSize = cellSize / 2;
    const centerX = (COLS * cellSize) / 2;
    const centerZ = (ROWS * cellSize) / 2;
    
    // 计算门的边界
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    door.cells.forEach(({r, c}) => {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
    });
    
    // 根据门的方向确定其属性
    let doorWidth, doorHeight, doorDepth, doorX, doorZ;
    let holeStartR, holeEndR, holeStartC, holeEndC;
    
    doorHeight = 120 * 0.98; // 门高略小于墙高
    
    if (door.orientation === 'horizontal') {
        // 水平门
        // 确保门的宽度至少为6个单元格
        const doorWidthInCells = Math.max(6, maxC - minC + 1);
        doorWidth = doorWidthInCells * cellSize;
        doorDepth = cellSize * 0.8;
        
        // 计算门洞范围，确保至少6个单元格宽
        const centerC = Math.floor((minC + maxC) / 2);
        const halfWidth = Math.floor(doorWidthInCells / 2);
        
        // 为了门的开启，我们需要在门的一侧创建旋转空间
        // 假设门的铰链在门的左侧（从上往下看），所以门向下开启
        const rotationRadius = Math.ceil(doorWidthInCells * 0.7); // 减少为门宽的70%
        
        holeStartR = minR; // 门所在行
        holeEndR = Math.min(ROWS - 1, minR + rotationRadius); // 只向下扩展空间
        holeStartC = Math.max(0, centerC - halfWidth);
        holeEndC = Math.min(COLS - 1, holeStartC + doorWidthInCells - 1);
        
        // 设置门的位置
        doorX = (holeStartC + holeEndC) / 2 * cellSize - centerX + halfCellSize;
        doorZ = minR * cellSize - centerZ + halfCellSize;
        
        console.log(`水平门 #${index}: 宽度=${doorWidthInCells}格, 范围=[${holeStartR},${holeStartC}]到[${holeEndR},${holeEndC}], 旋转半径=${rotationRadius}格, 向下开启`);
    } else {
        // 垂直门
        // 确保门的高度至少为6个单元格
        const doorHeightInCells = Math.max(6, maxR - minR + 1);
        doorWidth = cellSize * 0.8;
        doorDepth = doorHeightInCells * cellSize;
        
        // 计算门洞范围，确保至少6个单元格高
        const centerR = Math.floor((minR + maxR) / 2);
        const halfHeight = Math.floor(doorHeightInCells / 2);
        
        // 为了门的开启，我们需要在门的一侧创建旋转空间
        // 假设门的铰链在门的上侧（从左往右看），所以门向右开启
        const rotationRadius = Math.ceil(doorHeightInCells * 0.7); // 减少为门高的70%
        
        holeStartR = Math.max(0, centerR - halfHeight);
        holeEndR = Math.min(ROWS - 1, holeStartR + doorHeightInCells - 1);
        holeStartC = minC; // 门所在列
        holeEndC = Math.min(COLS - 1, minC + rotationRadius); // 只向右扩展空间
        
        // 设置门的位置
        doorX = minC * cellSize - centerX + halfCellSize;
        doorZ = (holeStartR + holeEndR) / 2 * cellSize - centerZ + halfCellSize;
        
        console.log(`垂直门 #${index}: 高度=${doorHeightInCells}格, 范围=[${holeStartR},${holeStartC}]到[${holeEndR},${holeEndC}], 旋转半径=${rotationRadius}格, 向右开启`);
    }
    
    // 标记门洞位置 - 修改为只标记实际的门单元格位置和少量必要空间
    console.log(`门组 #${index} 标记门洞位置:`);
    
    // 首先标记所有实际的门单元格
    door.cells.forEach(({r, c}) => {
        doorHoleMap.set(`${r},${c}`, true);
        console.log(`  标记实际门单元格: [${r}, ${c}]`);
    });
    
    // 为门的开启预留少量必要空间（仅在门的前方，且不覆盖墙体）
    if (door.orientation === 'horizontal') {
        // 水平门：在门的前方（下方）预留1个单元格的空间
        const reserveSpace = 1;
        for (let r = maxR + 1; r <= Math.min(ROWS - 1, maxR + reserveSpace); r++) {
            for (let c = minC; c <= maxC; c++) {
                // 只有当这个位置原本不是墙时才标记为门洞
                if (r < grid3D.length && c < grid3D[0].length && 
                    (!grid3D[r] || !grid3D[r][c] || !grid3D[r][c].isWall)) {
                    doorHoleMap.set(`${r},${c}`, true);
                    console.log(`  预留水平门开启空间: [${r}, ${c}]`);
                }
            }
        }
    } else {
        // 垂直门：在门的前方（右方）预留1个单元格的空间
        const reserveSpace = 1;
        for (let r = minR; r <= maxR; r++) {
            for (let c = maxC + 1; c <= Math.min(COLS - 1, maxC + reserveSpace); c++) {
                // 只有当这个位置原本不是墙时才标记为门洞
                if (r < grid3D.length && c < grid3D[0].length && 
                    (!grid3D[r] || !grid3D[r][c] || !grid3D[r][c].isWall)) {
                    doorHoleMap.set(`${r},${c}`, true);
                    console.log(`  预留垂直门开启空间: [${r}, ${c}]`);
                }
            }
        }
    }
    
    console.log(`门组 #${index} 总共标记了 ${doorHoleMap.size} 个门洞位置`);
    
    // 创建3D门
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.5
    });
    
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.set(doorX, doorHeight / 2, doorZ);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    scene.add(doorMesh);
    modelObjects.doors.push(doorMesh);
    
    // 添加门把手
    const handleRadius = Math.min(cellSize * 0.15, 1.2); // 门把手半径
    const handleGeometry = new THREE.SphereGeometry(handleRadius, 8, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0xCFB53B, // 金色门把手
        metalness: 0.8,
        roughness: 0.2
    });
    
    // 创建门把手
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    
    // 根据门的方向确定门把手位置
    if (door.orientation === 'horizontal') {
        // 水平门，把手位于门右侧中间位置
        handle.position.set(
            doorX + (doorWidth / 2) - handleRadius * 2,  // 右侧偏移
            doorHeight / 2,                              // 与门同高
            doorZ + (doorDepth / 2) + handleRadius / 2   // 前面突出
        );
    } else {
        // 垂直门，把手位于门右侧中间位置
        handle.position.set(
            doorX + (doorWidth / 2) + handleRadius / 2,  // 右侧突出
            doorHeight / 2,                              // 与门同高
            doorZ + (doorDepth / 2) - handleRadius * 2   // 前侧偏移
        );
    }
    
    handle.castShadow = true;
    scene.add(handle);
    modelObjects.doors.push(handle);
    
    console.log(`创建3D门 ${index}: 位置=(${doorX.toFixed(1)}, ${doorHeight / 2}, ${doorZ.toFixed(1)}), 尺寸=${doorWidth.toFixed(1)}x${doorHeight.toFixed(1)}x${doorDepth.toFixed(1)}, 方向=${door.orientation}`);
}
    
// 简化的门创建逻辑 - 确保门只在与墙重叠的部分出现
function createSimplifiedDoorFromGroup(door, index, doorHoleMap, grid3D) {
    const cellSize = 8;
    const halfCellSize = cellSize / 2;
    const centerX = (COLS * cellSize) / 2;
    const centerZ = (ROWS * cellSize) / 2;
    
    console.log(`=== 创建简化门 #${index} ===`);
    console.log(`门单元格:`, door.cells);
    console.log(`门方向: ${door.orientation}`);
    
    // 计算门的边界
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    door.cells.forEach(({r, c}) => {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
    });
    
    console.log(`门边界: [${minR}-${maxR}, ${minC}-${maxC}]`);
    
    // 只标记实际的门单元格为门洞
    door.cells.forEach(({r, c}) => {
        doorHoleMap.set(`${r},${c}`, true);
        console.log(`  标记门洞: [${r}, ${c}]`);
    });
    
    // 计算门的3D属性
    let doorWidth, doorHeight, doorDepth, doorX, doorZ;
    doorHeight = 120 * 0.98; // 门高略小于墙高
    
    if (door.orientation === 'horizontal') {
        // 水平门：宽度基于实际跨度
        doorWidth = (maxC - minC + 1) * cellSize;
        doorDepth = cellSize * 0.8;
        
        // 位置基于实际门单元格中心
        doorX = ((minC + maxC) / 2) * cellSize - centerX + halfCellSize;
        doorZ = ((minR + maxR) / 2) * cellSize - centerZ + halfCellSize;
        
        console.log(`水平门: 宽度=${doorWidth.toFixed(1)}, 深度=${doorDepth.toFixed(1)}`);
    } else {
        // 垂直门：深度基于实际跨度
        doorWidth = cellSize * 0.8;
        doorDepth = (maxR - minR + 1) * cellSize;
        
        // 位置基于实际门单元格中心
        doorX = ((minC + maxC) / 2) * cellSize - centerX + halfCellSize;
        doorZ = ((minR + maxR) / 2) * cellSize - centerZ + halfCellSize;
        
        console.log(`垂直门: 宽度=${doorWidth.toFixed(1)}, 深度=${doorDepth.toFixed(1)}`);
    }
    
    console.log(`门位置: (${doorX.toFixed(1)}, ${doorHeight / 2}, ${doorZ.toFixed(1)})`);
    
    // 创建3D门
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.5
    });
    
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.set(doorX, doorHeight / 2, doorZ);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    scene.add(doorMesh);
    modelObjects.doors.push(doorMesh);
    
    // 添加门把手
    const handleRadius = Math.min(cellSize * 0.15, 1.2);
    const handleGeometry = new THREE.SphereGeometry(handleRadius, 8, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0xCFB53B,
        metalness: 0.8,
        roughness: 0.2
    });
    
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    
    if (door.orientation === 'horizontal') {
        handle.position.set(
            doorX + (doorWidth / 2) - handleRadius * 2,
            doorHeight / 2,
            doorZ + (doorDepth / 2) + handleRadius / 2
        );
    } else {
        handle.position.set(
            doorX + (doorWidth / 2) + handleRadius / 2,
            doorHeight / 2,
            doorZ + (doorDepth / 2) - handleRadius * 2
        );
    }
    
    handle.castShadow = true;
    scene.add(handle);
    modelObjects.doors.push(handle);
    
    console.log(`=== 简化门 #${index} 创建完成 ===`);
}

// 验证3D门的尺寸是否与网格匹配
function validate3DDoorSizes() {
    console.log('=== 验证3D门尺寸 ===');
    
    const cellSize = 8; // 3D中的单元格尺寸
    const TARGET_DOOR_CELLS = 5; // 目标门宽度（格子数）
    const expectedDoorWidth = TARGET_DOOR_CELLS * cellSize; // 期望的3D门宽度
    
    console.log(`期望的3D门宽度: ${expectedDoorWidth} (${TARGET_DOOR_CELLS}格 × ${cellSize}单位/格)`);
    
    // 遍历所有门对象，检查尺寸
    let doorIndex = 0;
    modelObjects.doors.forEach((doorMesh) => {
        // 跳过门把手（门把手是SphereGeometry）
        if (doorMesh.geometry && doorMesh.geometry.type === 'BoxGeometry') {
            const params = doorMesh.geometry.parameters;
            const width = params.width;
            const depth = params.depth;
            
            // 门的有效宽度是较小的那个维度
            const effectiveWidth = Math.min(width, depth);
            const cellsOccupied = effectiveWidth / cellSize;
            
            console.log(`门 ${doorIndex}: 宽度=${width.toFixed(1)}, 深度=${depth.toFixed(1)}, 有效宽度=${effectiveWidth.toFixed(1)}, 占据${cellsOccupied.toFixed(1)}格`);
            
            // 检查是否接近目标
            const deviation = Math.abs(cellsOccupied - TARGET_DOOR_CELLS);
            if (deviation > 0.5) {
                console.warn(`门 ${doorIndex} 尺寸偏差较大: ${cellsOccupied.toFixed(1)}格 vs 目标${TARGET_DOOR_CELLS}格`);
            }
            
            doorIndex++;
        }
    });
    
    console.log('=== 3D门尺寸验证完成 ===');
}
    