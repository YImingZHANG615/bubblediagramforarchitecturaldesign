/** 
 * 建筑设计可视化工具 - 主程序
 * 现代化UI版本
 */

// ===== 全局变量 =====
let nodesData = [
    { id:"Nurse Station", label:"Nurse Station", radius:140, color:"#90c695", lineAttractions:{} },
    { id:"Treatment Room", label:"Treatment Room", radius:80, color:"#b8d4f0", lineAttractions:{} },
    { id:"Consultation Room", label:"Consultation Room", radius:50, color:"#f0d4b8", lineAttractions:{} },
    { id:"Disposal Room", label:"Disposal Room", radius:90, color:"#f0b8b8", lineAttractions:{} },
    { id:"Doctor's Office", label:"Doctor's Office", radius:90, color:"#8080cc", lineAttractions:{} },
    { id:"Nurse's Office", label:"Nurse's Office", radius:90, color:"#8080cc", lineAttractions:{} },
    { id:"Dressing Room", label:"Dressing Room", radius:90, color:"#8080cc", lineAttractions:{} },
    { id:"Consultation & Handover", label:"Consultation & Handover", radius:90, color:"#8080cc", lineAttractions:{} },
    { id:"Instrument Room", label:"Instrument Room", radius:90, color:"#a8a8a8", lineAttractions:{} },
    { id:"Pantry", label:"Pantry", radius:40, color:"#a8a8a8", lineAttractions:{} },
    { id:"Sluice Room", label:"Sluice Room", radius:40, color:"#a8a8a8", lineAttractions:{} },
    { id:"Female Changing Room", label:"Female Changing Room", radius:60, color:"#a8a8a8", lineAttractions:{} },
    { id:"Male Changing Room", label:"Male Changing Room", radius:60, color:"#a8a8a8", lineAttractions:{} },
    { id:"Male Restroom", label:"Male Restroom", radius:90, color:"#a8a8a8", lineAttractions:{} },
    { id:"Female Restroom", label:"Female Restroom", radius:90, color:"#a8a8a8", lineAttractions:{} },
    { id:"Male Duty Room", label:"Male Duty Room", radius:90, color:"#a8a8a8", lineAttractions:{} },
    { id:"Female Duty Room", label:"Female Duty Room", radius:90, color:"#a8a8a8", lineAttractions:{} },
    { id:"Storage Room", label:"Storage Room", radius:40, color:"#a8a8a8", lineAttractions:{} },
    { id:"Communication Room", label:"Communication Room", radius:40, color:"#a0b8d4", lineAttractions:{} }
];

let linksData = [
    { source:"Nurse Station", target:"Nurse's Office", force:1, distance:200 },
    { source:"Nurse Station", target:"Treatment Room", force:1, distance:200 },
    { source:"Nurse Station", target:"Disposal Room", force:1, distance:200 },
    { source:"Disposal Room", target:"Dressing Room", force:1, distance:400 },
    { source:"Dressing Room", target:"Treatment Room", force:1, distance:400 },
    { source:"Consultation Room", target:"Doctor's Office", force:1, distance:400 },
    { source:"Nurse Station", target:"Dressing Room", force:1, distance:200 },
    { source:"Nurse Station", target:"Pantry", force:1, distance:200 },
    { source:"Nurse Station", target:"Consultation & Handover", force:1, distance:200 },
    { source:"Nurse's Office", target:"Male Duty Room", force:1, distance:400 },
    { source:"Nurse's Office", target:"Female Duty Room", force:1, distance:400 },
    { source:"Doctor's Office", target:"Disposal Room", force:1, distance:400 },
    { source:"Doctor's Office", target:"Dressing Room", force:1, distance:400 },
    { source:"Doctor's Office", target:"Treatment Room", force:1, distance:400 },
    { source:"Doctor's Office", target:"Male Duty Room", force:1, distance:400 },
    { source:"Doctor's Office", target:"Female Duty Room", force:1, distance:400 },
    { source:"Doctor's Office", target:"Instrument Room", force:1, distance:400 },
    { source:"Treatment Room", target:"Instrument Room", force:1, distance:400 },
    { source:"Storage Room", target:"Instrument Room", force:1, distance:400 },
    { source:"Nurse's Office", target:"Consultation & Handover", force:1, distance:400 },
    { source:"Male Restroom", target:"Female Restroom", force:1, distance:400 },
    { source:"Male Restroom", target:"Male Duty Room", force:1, distance:400 },
    { source:"Male Restroom", target:"Male Changing Room", force:1, distance:400 },
    { source:"Female Restroom", target:"Female Changing Room", force:1, distance:400 },
    { source:"Male Duty Room", target:"Male Changing Room", force:1, distance:400 },
    { source:"Male Changing Room", target:"Female Changing Room", force:1, distance:400 },
    { source:"Female Duty Room", target:"Female Changing Room", force:1, distance:400 },
    { source:"Male Duty Room", target:"Female Duty Room", force:1, distance:400 },
    { source:"Female Duty Room", target:"Female Restroom", force:1, distance:400 },
    { source:"Pantry", target:"Sluice Room", force:1, distance:400 },
    { source:"Sluice Room", target:"Male Restroom", force:1, distance:400 },
    { source:"Sluice Room", target:"Female Restroom", force:1, distance:400 },
    { source:"Storage Room", target:"Male Duty Room", force:1, distance:400 },
    { source:"Storage Room", target:"Female Duty Room", force:1, distance:400 },
    { source:"Consultation Room", target:"Nurse Station", force:1, distance:200 },
    { source:"Communication Room", target:"Male Duty Room", force:1, distance:400 }
];

let boundaryType = 'none';
let boundaryPoints = [];
let boundaryVisible = true;
let lineComponents = [];
let hueRotate = 0;
let satScale = 1;
let lightScale = 1;
let selectedNode = null;
let selectedLinkNodeId = null;
let editingLink = null;

// D3.js 相关变量
let svg, simulation, node, link, boundaryGroup, boundaryPolygon, boundaryHandles;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadLanguageSettings();
    setupTabNavigation();
    setupResponsiveLayout();
    initializeBubbleEditor();
    setupEventListeners();
    setupLanguageSwitch();
    console.log('应用初始化完成');
}

// ===== 标签页导航 =====
function setupTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // 移除所有活动状态
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 激活当前标签
            tab.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // 处理特定标签的初始化
            handleTabSwitch(targetTab);
        });
    });
}

function handleTabSwitch(tabName) {
    switch(tabName) {
        case 'bubble-editor':
            if (!svg) {
                initializeBubbleEditor();
            }
            break;
        case 'integrated-analysis':
            openIntegratedAnalysis();
            break;
    }
}

// ===== 响应式布局 =====
function setupResponsiveLayout() {
    function handleResize() {
        if (svg) {
            updateCanvasSize();
        }
    }
    
    window.addEventListener('resize', debounce(handleResize, 250));
}

function updateCanvasSize() {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer || !svg) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    svg.attr('width', width).attr('height', height);
    
    if (simulation) {
        simulation.force('center', d3.forceCenter(width/2, height/2));
        simulation.alpha(0.3).restart();
    }
}

// ===== 泡泡图编辑器初始化 =====
function initializeBubbleEditor() {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    
    // 创建SVG
    svg = d3.select('#chart')
        .attr('width', width)
        .attr('height', height);
    
    // 清除现有内容
    svg.selectAll('*').remove();
    
    // 创建主要的容器组
    const mainGroup = svg.append('g').attr('class', 'main-group');
    
    // 创建边界组（在节点和连接之前）
    boundaryGroup = mainGroup.append('g').attr('class', 'boundary-group');
    boundaryPolygon = boundaryGroup.append('polygon')
        .attr('class', 'boundary-polygon')
        .style('display', 'none');
    
    // 创建连接线组
    const linkGroup = mainGroup.append('g').attr('class', 'links');
    
    // 创建节点组
    const nodeGroup = mainGroup.append('g').attr('class', 'nodes');
    
    // 初始化力导向图
    initializeForceSimulation(width, height);
    
    // 绘制初始图形
    updateVisualization();
    
    // 设置画布交互
    setupCanvasPanning();
    
    console.log('泡泡图编辑器初始化完成');
}

function initializeForceSimulation(width, height) {
    simulation = d3.forceSimulation(nodesData)
        .force('charge', d3.forceManyBody().strength(-100))
        .force('link', d3.forceLink(linksData).id(d => d.id).distance(d => d.distance))
        .force('collide', d3.forceCollide().radius(d => d.radius + 1))
        .force('center', d3.forceCenter(width/2, height/2))
        .on('tick', ticked);
}

function updateVisualization() {
    if (!svg) return;
    
    const mainGroup = svg.select('.main-group');
    if (mainGroup.empty()) {
        console.error('主要SVG组不存在，重新初始化');
        initializeBubbleEditor();
        return;
    }
    
    // 更新连接线
    link = mainGroup.select('.links').selectAll('.link')
        .data(linksData, d => `${d.source.id || d.source}-${d.target.id || d.target}`);
    
    link.exit().remove();
    
    link = link.enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke', '#cbd5e1')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 2)
        .merge(link);
    
    // 更新节点
    node = mainGroup.select('.nodes').selectAll('.node')
        .data(nodesData, d => d.id);
    
    node.exit().remove();
    
    const nodeEnter = node.enter()
        .append('g')
        .attr('class', 'node')
        .on('contextmenu', function(event, d) {
            event.preventDefault();
            selectNode(d);
        })
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded)
        );
    
    node = nodeEnter.merge(node);
    
    // 更新模拟
    if (simulation) {
        simulation.nodes(nodesData);
        simulation.force('link').links(linksData);
        simulation.alpha(1).restart();
    }
    
    // 更新线段选项
    updateLineSegmentOptions();
}

function ticked() {
    // 更新连接线位置
    link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
    
    // 清除并重绘节点
    node.selectAll('*').remove();
    
    node.each(function(d) {
        const nodeGroup = d3.select(this);
        
        // 应用颜色变换
        const adjustedColor = applyColorTransform(d.color);
        
        // 绘制圆形
        nodeGroup.append('circle')
            .attr('r', d.radius)
            .attr('fill', adjustedColor)
            .attr('stroke', '#475569')
            .attr('stroke-width', 2);
        
        // 绘制标签
        nodeGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.2em')
            .style('font-size', '12px')
            .style('font-weight', '500')
            .style('fill', '#1e293b')
            .text(d.label);
        
        // 绘制面积信息
        const area = Math.PI * (d.radius * d.radius) / 1000;
        nodeGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.2em')
            .style('font-size', '10px')
            .style('fill', '#64748b')
            .text(`${area.toFixed(1)}m²`);
    });
    
    // 更新节点位置
    node.attr('transform', d => `translate(${d.x},${d.y})`);
}

// ===== 颜色变换 =====
function applyColorTransform(color) {
    const [h, s, l] = hexToHSL(color);
    const newH = (h + hueRotate) % 360;
    const newS = Math.min(100, Math.max(0, s * satScale));
    const newL = Math.min(100, Math.max(0, l * lightScale));
    return hslToHex(newH, newS, newL);
}

function hexToHSL(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = c => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ===== 拖拽处理 =====
function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// ===== 节点选择和编辑 =====
function selectNode(nodeData) {
    selectedNode = nodeData;
    showNodeInfo(nodeData);
}

function showNodeInfo(nodeData) {
    document.getElementById('no-selection').style.display = 'none';
    document.getElementById('node-info').style.display = 'block';
    
    document.getElementById('node-name').value = nodeData.label;
    document.getElementById('node-radius').value = nodeData.radius;
    document.getElementById('node-area').value = (Math.PI * nodeData.radius * nodeData.radius / 1000).toFixed(6);
    document.getElementById('node-color').value = nodeData.color;
    
    updateLinksList();
    updateNewLinkOptions();
}

function updateLinksList() {
    const linksListDiv = document.getElementById('links-list');
    linksListDiv.innerHTML = '';
    
    if (!selectedNode) return;
    
    const connectedLinks = linksData.filter(l => 
        l.source.id === selectedNode.id || l.target.id === selectedNode.id
    );
    
    connectedLinks.forEach(link => {
        const otherId = link.source.id === selectedNode.id ? link.target.id : link.source.id;
        const otherNode = nodesData.find(n => n.id === otherId);
        const otherLabel = otherNode ? otherNode.label : otherId;
        
        const div = document.createElement('div');
        div.textContent = otherLabel;
        div.addEventListener('click', () => {
            document.querySelectorAll('#links-list div').forEach(d => d.classList.remove('selected-link'));
            div.classList.add('selected-link');
            selectedLinkNodeId = otherId;
            editingLink = link;
            showLinkEditPanel(link);
        });
        
        linksListDiv.appendChild(div);
    });
}

function showLinkEditPanel(link) {
    document.getElementById('link-edit-panel').style.display = 'block';
    document.getElementById('link-force-input').value = link.force;
    document.getElementById('link-distance-input').value = link.distance;
}

function updateNewLinkOptions() {
    const select = document.getElementById('new-link');
    select.innerHTML = '';
    
    if (!selectedNode) return;
    
    nodesData.forEach(node => {
        if (node.id !== selectedNode.id && !isConnected(selectedNode.id, node.id)) {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = node.label;
            select.appendChild(option);
        }
    });
}

function isConnected(id1, id2) {
    return linksData.some(link => 
        (link.source.id === id1 && link.target.id === id2) ||
        (link.source.id === id2 && link.target.id === id1)
    );
}

// ===== 事件监听器设置 =====
function setupEventListeners() {
    // 颜色滑块
    setupColorSliders();
    
    // 节点操作
    setupNodeOperations();
    
    // 文件操作
    setupFileOperations();
    
    // 边界操作
    setupBoundaryOperations();
    
    // 图片上传
    setupImageUpload();
    
    // 画布控制
    setupCanvasControls();
    
    // 更新线段吸引按钮
    document.getElementById('update-line-segment-attraction')?.addEventListener('click', updateLineSegmentAttraction);
}

function setupColorSliders() {
    const hueSlider = document.getElementById('hue-slider');
    const satSlider = document.getElementById('sat-slider');
    const lightSlider = document.getElementById('light-slider');
    
    hueSlider?.addEventListener('input', () => {
        hueRotate = +hueSlider.value;
        document.getElementById('hue-value').textContent = hueRotate;
        if (simulation) simulation.alpha(0.3).restart();
    });
    
    satSlider?.addEventListener('input', () => {
        satScale = +satSlider.value;
        document.getElementById('sat-value').textContent = satScale.toFixed(2);
        if (simulation) simulation.alpha(0.3).restart();
    });
    
    lightSlider?.addEventListener('input', () => {
        lightScale = +lightSlider.value;
        document.getElementById('light-value').textContent = lightScale.toFixed(2);
        if (simulation) simulation.alpha(0.3).restart();
    });
}

function setupNodeOperations() {
    // 选择节点
    document.getElementById('select-node-button')?.addEventListener('click', () => {
        const name = document.getElementById('select-node-input').value.trim();
        const node = nodesData.find(n => n.label === name);
        if (node) {
            selectNode(node);
        } else {
            alert('未找到该节点');
        }
    });
    
    // 创建节点
    document.getElementById('create-node')?.addEventListener('click', createNewNode);
    
    // 更新节点
    document.getElementById('update-node')?.addEventListener('click', updateSelectedNode);
    
    // 删除节点
    document.getElementById('delete-node')?.addEventListener('click', deleteSelectedNode);
    
    // 添加连接
    document.getElementById('add-link')?.addEventListener('click', addNewLink);
    
    // 删除连接
    document.getElementById('remove-selected-link')?.addEventListener('click', removeSelectedLink);
    
    // 更新连接
    document.getElementById('update-link')?.addEventListener('click', updateSelectedLink);
}

function createNewNode() {
    const name = document.getElementById('new-node-name').value.trim();
    const radius = +document.getElementById('new-node-radius').value;
    const area = +document.getElementById('new-node-area').value;
    const color = document.getElementById('new-node-color').value;
    
    if (!name) {
        alert('请输入节点名称');
        return;
    }
    
    let finalRadius = radius;
    if (area > 0) {
        finalRadius = Math.sqrt(area * 1000 / Math.PI);
    }
    
    let nodeId = name;
    let counter = 1;
    while (nodesData.find(n => n.id === nodeId)) {
        nodeId = `${name}_${counter++}`;
    }
    
    nodesData.push({
        id: nodeId,
        label: name,
        radius: finalRadius,
        color: color,
        lineAttractions: {}
    });
    
    updateVisualization();
    
    // 清空表单
    document.getElementById('new-node-name').value = '';
    document.getElementById('new-node-radius').value = '30';
    document.getElementById('new-node-area').value = '';
    document.getElementById('new-node-color').value = '#cccccc';
}

function updateSelectedNode() {
    if (!selectedNode) return;
    
    const name = document.getElementById('node-name').value.trim();
    const radius = +document.getElementById('node-radius').value;
    const area = +document.getElementById('node-area').value;
    const color = document.getElementById('node-color').value;
    
    selectedNode.label = name;
    selectedNode.color = color;
    
    if (area > 0) {
        selectedNode.radius = Math.sqrt(area * 1000 / Math.PI);
    } else {
        selectedNode.radius = radius;
    }
    
    if (simulation) simulation.alpha(0.3).restart();
}

function deleteSelectedNode() {
    if (!selectedNode) return;
    
    if (confirm(`确定要删除节点"${selectedNode.label}"吗？`)) {
        // 删除相关连接
        linksData = linksData.filter(link => 
            link.source.id !== selectedNode.id && link.target.id !== selectedNode.id
        );
        
        // 删除节点
        nodesData = nodesData.filter(node => node.id !== selectedNode.id);
        
        // 清空选择
        selectedNode = null;
        document.getElementById('node-info').style.display = 'none';
        document.getElementById('no-selection').style.display = 'block';
        
        updateVisualization();
    }
}

function addNewLink() {
    if (!selectedNode) return;
    
    const targetId = document.getElementById('new-link').value;
    if (!targetId) return;
    
    linksData.push({
        source: selectedNode.id,
        target: targetId,
        force: 1,
        distance: 200
    });
    
    updateVisualization();
    updateLinksList();
    updateNewLinkOptions();
}

function removeSelectedLink() {
    if (!selectedNode || !selectedLinkNodeId) return;
    
    linksData = linksData.filter(link => !(
        (link.source.id === selectedNode.id && link.target.id === selectedLinkNodeId) ||
        (link.source.id === selectedLinkNodeId && link.target.id === selectedNode.id)
    ));
    
    editingLink = null;
    document.getElementById('link-edit-panel').style.display = 'none';
    
    updateVisualization();
    updateLinksList();
    updateNewLinkOptions();
}

function updateSelectedLink() {
    if (!editingLink) return;
    
    editingLink.force = +document.getElementById('link-force-input').value;
    editingLink.distance = +document.getElementById('link-distance-input').value;
    
    if (simulation) {
        simulation.force('link').distance(d => d.distance);
        simulation.alpha(0.3).restart();
    }
}

function setupFileOperations() {
    // 保存项目
    document.getElementById('save-project')?.addEventListener('click', saveProject);
    document.getElementById('save-button')?.addEventListener('click', saveProject);
    
    // 加载项目
    document.getElementById('load-project')?.addEventListener('click', () => {
        document.getElementById('load-file')?.click();
    });
    document.getElementById('load-button')?.addEventListener('click', () => {
        document.getElementById('load-file')?.click();
    });
    document.getElementById('load-file')?.addEventListener('change', loadProject);
    
    // Excel导入导出
    document.getElementById('import-excel-button')?.addEventListener('click', () => {
        document.getElementById('excel-file-input')?.click();
    });
    document.getElementById('export-excel-button')?.addEventListener('click', exportToExcel);
    document.getElementById('excel-file-input')?.addEventListener('change', importFromExcel);
}

function saveProject() {
    const projectData = {
        nodes: nodesData,
        links: linksData.map(link => ({
            source: link.source.id || link.source,
            target: link.target.id || link.target,
            force: link.force,
            distance: link.distance
        })),
        boundaryType,
        boundaryPoints,
        hueRotate,
        satScale,
        lightScale,
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `建筑设计项目_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function loadProject(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const projectData = JSON.parse(e.target.result);
            
            nodesData = projectData.nodes || [];
            linksData = projectData.links || [];
            boundaryType = projectData.boundaryType || 'none';
            boundaryPoints = projectData.boundaryPoints || [];
            hueRotate = projectData.hueRotate || 0;
            satScale = projectData.satScale || 1;
            lightScale = projectData.lightScale || 1;
            
            // 更新UI
            document.getElementById('hue-slider').value = hueRotate;
            document.getElementById('sat-slider').value = satScale;
            document.getElementById('light-slider').value = lightScale;
            document.getElementById('hue-value').textContent = hueRotate;
            document.getElementById('sat-value').textContent = satScale.toFixed(2);
            document.getElementById('light-value').textContent = lightScale.toFixed(2);
            
            updateVisualization();
            
            alert('项目加载成功！');
        } catch (error) {
            alert('项目文件格式错误');
            console.error(error);
        }
    };
    reader.readAsText(file);
}

function exportToExcel() {
    try {
        const MAX_CAPACITY = 300;
        let wb = XLSX.utils.book_new();

        // sheet1 => A列:Name, B列:Area, C列:Color (英文表头)
        let sheet1Data = [["Name", "Area", "Color"]];
        let roomInfos = [];
        nodesData.forEach((n, idx) => {
            if (idx < MAX_CAPACITY) {
                let area = Math.PI * (n.radius * n.radius) / 1e3;
                sheet1Data.push([n.label, area.toFixed(2), n.color]);
                roomInfos.push({ name: n.label, id: n.id });
            }
        });
        // 若节点少于MAX_CAPACITY, 填充空行
        let usedRows = roomInfos.length;
        if (usedRows < MAX_CAPACITY) {
            for (let r = usedRows; r < MAX_CAPACITY; r++) {
                sheet1Data.push(["", "", ""]);
            }
        }
        let ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
        XLSX.utils.book_append_sheet(wb, ws1, "sheet1");

        // sheet2 NxN => "公式 + 值"
        let sheet2Data = [];
        // 首行 => ['', =sheet1!A2, =sheet1!A3, ...]
        {
            let row0 = [{ t: "s", v: "" }];
            for (let j = 0; j < MAX_CAPACITY; j++) {
                if (j < roomInfos.length) {
                    row0.push({
                        t: "s",
                        f: `=sheet1!A${j + 2}`,
                        v: roomInfos[j].name
                    });
                } else {
                    // 填充同步公式
                    row0.push({
                        t: "s",
                        f: `=IF(sheet1!A${j + 2}="", "", sheet1!A${j + 2})`,
                        v: ""
                    });
                }
            }
            sheet2Data.push(row0);
        }

        // 构建房间名到索引的映射
        let roomNameToIndex = {};
        roomInfos.forEach((room, idx) => {
            roomNameToIndex[room.name] = idx;
        });

        // adjacencyMap => 根据 linksData 构建连接关系
        let adjacencyMap = {};
        linksData.forEach(l => {
            let srcName = l.source.id || l.source;
            let tgtName = l.target.id || l.target;
            if (roomNameToIndex.hasOwnProperty(srcName) && roomNameToIndex.hasOwnProperty(tgtName)) {
                let i = roomNameToIndex[srcName];
                let j = roomNameToIndex[tgtName];
                if (i < j) {
                    adjacencyMap[i + "___" + j] = l.distance; // 使用实际的 distance 值
                } else if (j < i) {
                    adjacencyMap[j + "___" + i] = l.distance;
                }
            }
        });

        // 后续行
        for (let i = 0; i < MAX_CAPACITY; i++) {
            let firstCell = { t: "s", v: "", f: "" };
            if (i < roomInfos.length) {
                firstCell.f = `=sheet1!A${i + 2}`;
                firstCell.v = roomInfos[i].name;
            } else {
                firstCell.f = `=IF(sheet1!A${i + 2}="", "", sheet1!A${i + 2})`;
                firstCell.v = "";
            }
            let rowArr = [firstCell];
            for (let j = 0; j < MAX_CAPACITY; j++) {
                if (i >= roomInfos.length || j >= roomInfos.length) {
                    // 未定义房间的单元格设为空，保留上下三角的公式
                    if (j > i) {
                        // 上三角: 空字符串
                        rowArr.push({ t: "s", v: "", f: "" });
                    } else if (j < i) {
                        // 下三角: 引用上三角对应单元格
                        let refCell = XLSX.utils.encode_cell({ r: j + 1, c: i + 1 });
                        rowArr.push({ t: "s", f: `=${refCell}`, v: "" });
                    } else {
                        // 对角线: 0
                        rowArr.push({ t: "n", v: 0 });
                    }
                    continue;
                }
                if (i === j) {
                    // 对角线 => 0
                    rowArr.push({ t: "n", v: 0 });
                } else if (i < j) {
                    // 上三角 => 根据 adjacencyMap 设置值，若无连接则 0
                    let key = `${i}___${j}`;
                    let val = adjacencyMap[key] || 0;
                    rowArr.push({ t: "n", v: val });
                } else {
                    // 下三角: 引用上三角对应单元格
                    let refCell = XLSX.utils.encode_cell({ r: j + 1, c: i + 1 });
                    rowArr.push({ t: "s", f: `=${refCell}`, v: "" });
                }
            }
            sheet2Data.push(rowArr);
        }

        let ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
        XLSX.utils.book_append_sheet(wb, ws2, "sheet2");

        // 写入文件
        let wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        let blob = new Blob([wbout], { type: "application/octet-stream" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "bubble_diagram_300.xlsx";
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Excel文件导出成功！');
    } catch (e) {
        console.error(e);
        alert("导出 Excel 失败，请检查数据格式。");
    }
}

function importFromExcel(event) {
    let file = event.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = (e) => {
        try {
            let data = new Uint8Array(e.target.result);
            let wb = XLSX.read(data, { type: "array" });
            if (wb.SheetNames.length < 2) {
                alert("请确保Excel中存在sheet1(节点)和sheet2(邻接矩阵)");
                return;
            }
            let sheet1 = wb.Sheets["sheet1"] || wb.Sheets[wb.SheetNames[0]];
            let sheet2 = wb.Sheets["sheet2"] || wb.Sheets[wb.SheetNames[1]];
            if (!sheet1 || !sheet2) {
                alert("缺少sheet1或sheet2");
                return;
            }
            let nodeArr = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
            let newNodesData = [];
            for (let i = 1; i < nodeArr.length; i++) {
                let row = nodeArr[i];
                if (!row || row.length < 1) continue;
                let name = row[0], area = +row[1], color = row[2] || "#cccccc";
                if (!name) continue;
                let radius = 30;
                if (area > 0) {
                    radius = Math.round(Math.sqrt((area * 1e3) / Math.PI));
                }
                newNodesData.push({ id: name, label: name, radius, color, lineAttractions: {} });
            }

            let matrix = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
            let headerRow = matrix[0];
            let nodeLabels = headerRow.slice(1);
            let newLinksData = [];
            for (let i = 1; i < matrix.length; i++) {
                let row = matrix[i];
                let rowLabel = row[0];
                let values = row.slice(1);
                for (let j = i; j < values.length; j++) {
                    let colLabel = nodeLabels[j];
                    let val = values[j];
                    if (val === "" || val === null || val === undefined) continue; // Skip empty cells
                    let dist = +val;
                    if (!isNaN(dist) && dist > 0) {
                        newLinksData.push({
                            source: rowLabel,
                            target: colLabel,
                            distance: dist,
                            force: 1
                        });
                    }
                }
            }

            nodesData = newNodesData;
            linksData = newLinksData;
            selectedNode = null;
            editingLink = null;
            document.getElementById("node-info").style.display = "none";
            document.getElementById("no-selection").style.display = "block";
            updateVisualization();
            
            alert('Excel文件导入成功！');
        } catch (err) {
            alert("导入Excel失败，请检查文件格式。");
            console.error('Excel导入错误:', err);
        }
    };
    reader.readAsArrayBuffer(file);
    
    // 清空文件输入
    event.target.value = '';
}

function generateExcelFromVector() {
    if (!currentVectorData) {
        alert('没有可导出的矢量数据');
        return;
    }
    
    try {
        const data = currentVectorData;
        if (!data.rooms || !data.walls || !data.doors) {
            alert('JSON无效，需要包含rooms, walls, doors字段。');
            return;
        }

        const MAX_CAPACITY = 300;
        let wb = XLSX.utils.book_new();

        // sheet1 => A列:Name, B列:Area, C列:Color
        let sheet1Data = [["Name", "Area", "Color"]];
        let roomInfos = [];
        
        data.rooms.forEach((room, idx) => {
            if (idx >= MAX_CAPACITY) return; // 只处理前300个房间
            let rawArea = calculatePolygonArea(room);
            let area = rawArea / 1500; // 使用真实面积
            let name = `Room ${idx + 1}`; // 或使用其他命名规则
            let color = "#ffffff"; // 默认颜色，可以根据需要调整
            sheet1Data.push([name, area.toFixed(2), color]);
            roomInfos.push({ name, id: name, coords: room }); // 添加coords以便后续使用
        });
        
        // 若房间少于MAX_CAPACITY => 补空行
        let used = roomInfos.length;
        if (used < MAX_CAPACITY) {
            for (let r = used; r < MAX_CAPACITY; r++) {
                sheet1Data.push(["", "", ""]);
            }
        }
        
        let ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
        XLSX.utils.book_append_sheet(wb, ws1, "sheet1");

        // sheet2 NxN => "公式+值"
        let sheet2Data = [];
        
        // 首行 => ['', =sheet1!A2, =sheet1!A3, ...]
        {
            let row0 = [{ t: "s", v: "" }];
            for (let j = 0; j < MAX_CAPACITY; j++) {
                if (j < roomInfos.length) {
                    row0.push({
                        t: "s",
                        f: `=sheet1!A${j + 2}`,
                        v: roomInfos[j].name
                    });
                } else {
                    // 填充同步公式
                    row0.push({
                        t: "s",
                        f: `=IF(sheet1!A${j + 2}="", "", sheet1!A${j + 2})`,
                        v: ""
                    });
                }
            }
            sheet2Data.push(row0);
        }

        // 构建房间名到索引的映射
        let roomNameToIndex = {};
        roomInfos.forEach((room, idx) => {
            roomNameToIndex[room.name] = idx;
        });

        // adjacencyMap => 根据 walls 和 doors 判断连接，并使用实际的 distance 值
        let adjacencyMap = {};

        // 检查墙是否将两个房间连接
        data.walls.forEach(wall => {
            const [p1, p2] = wall.position;
            // 找到与 p1 近似的房间 A
            const roomA = roomInfos.find(room => room.coords.some(pt => arePointsClose([pt.x, pt.y], p1)));
            // 找到与 p2 近似的房间 B
            const roomB = roomInfos.find(room => room.coords.some(pt => arePointsClose([pt.x, pt.y], p2)));
            if (roomA && roomB) {
                let i = roomNameToIndex[roomA.name];
                let j = roomNameToIndex[roomB.name];
                if (i < j) {
                    adjacencyMap[i + "___" + j] = wall.distance || 100; // 使用 wall.distance 或默认值
                } else if (j < i) {
                    adjacencyMap[j + "___" + i] = wall.distance || 100;
                }
            }
        });

        // 检查门是否将两个房间连接
        data.doors.forEach(door => {
            const [p1, p2, p3, p4] = door.bbox;
            // 找到与 p1 近似的房间 A
            const roomA = roomInfos.find(room => room.coords.some(pt => arePointsClose([pt.x, pt.y], p1)));
            // 找到与 p3 近似的房间 B
            const roomB = roomInfos.find(room => room.coords.some(pt => arePointsClose([pt.x, pt.y], p3)));
            if (roomA && roomB) {
                let i = roomNameToIndex[roomA.name];
                let j = roomNameToIndex[roomB.name];
                if (i < j) {
                    adjacencyMap[i + "___" + j] = 400; // 门连接的距离设为400
                } else if (j < i) {
                    adjacencyMap[j + "___" + i] = 400;
                }
            }
        });

        // 后续行
        for (let i = 0; i < MAX_CAPACITY; i++) {
            let firstCell = { t: "s", v: "", f: "" };
            if (i < roomInfos.length) {
                firstCell.f = `=sheet1!A${i + 2}`;
                firstCell.v = roomInfos[i].name;
            } else {
                firstCell.f = `=IF(sheet1!A${i + 2}="", "", sheet1!A${i + 2})`;
                firstCell.v = "";
            }
            let rowArr = [firstCell];
            
            for (let j = 0; j < MAX_CAPACITY; j++) {
                if (i >= roomInfos.length || j >= roomInfos.length) {
                    // 未定义房间的单元格设为空，保留上下三角的公式
                    if (j > i) {
                        // 上三角: 空字符串
                        rowArr.push({ t: "s", v: "", f: "" });
                    } else if (j < i) {
                        // 下三角: 引用上三角对应单元格
                        let refCell = XLSX.utils.encode_cell({ r: j + 1, c: i + 1 });
                        rowArr.push({ t: "s", f: `=${refCell}`, v: "" });
                    } else {
                        // 对角线: 0
                        rowArr.push({ t: "n", v: 0 });
                    }
                    continue;
                }
                
                if (i === j) {
                    // 对角线 => 0
                    rowArr.push({ t: "n", v: 0 });
                } else if (i < j) {
                    // 上三角 => 根据 adjacencyMap 设置值，若无连接则 0
                    let key = `${i}___${j}`;
                    let val = adjacencyMap[key] || 0;
                    rowArr.push({ t: "n", v: val });
                } else {
                    // 下三角 => 引用上三角对应单元格
                    let refCell = XLSX.utils.encode_cell({ r: j + 1, c: i + 1 });
                    rowArr.push({ t: "s", f: `=${refCell}`, v: "" });
                }
            }
            sheet2Data.push(rowArr);
        }

        let ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
        XLSX.utils.book_append_sheet(wb, ws2, "sheet2");

        // 写入文件
        let wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        let blob = new Blob([wbout], { type: "application/octet-stream" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "bubble_diagram_300.xlsx";
        a.click();
        URL.revokeObjectURL(url);
        
        alert('矢量数据Excel文件导出成功！');
    } catch (error) {
        alert('导出矢量数据Excel文件失败: ' + error.message);
        console.error('矢量数据Excel导出错误:', error);
    }
}

// 计算多边形面积的函数（Shoelace Formula）
function calculatePolygonArea(coords) {
    let n = coords.length;
    let area = 0;
    for (let i = 0; i < n; i++) {
        let j = (i + 1) % n;
        area += coords[i].x * coords[j].y - coords[j].x * coords[i].y;
    }
    return Math.abs(area / 2);
}

// 判断两点是否接近（用于墙、门的判断）
function arePointsClose(p1, p2, tolerance = 5) {
    return Math.abs(p1[0] - p2[0]) <= tolerance && Math.abs(p1[1] - p2[1]) <= tolerance;
}

function setupBoundaryOperations() {
    // 边界类型选择
    document.getElementById('boundary-type')?.addEventListener('change', (e) => {
        boundaryType = e.target.value;
        updateBoundaryDisplay();
    });
    
    // 应用边界按钮
    document.getElementById('apply-boundary')?.addEventListener('click', applyBoundary);
    
    // 显示边界复选框
    document.getElementById('show-boundary')?.addEventListener('change', (e) => {
        boundaryVisible = e.target.checked;
        updateBoundaryDisplay();
    });
    
    // SVG点击事件处理边界编辑
    svg?.on('click', function(event) {
        if (event.shiftKey) {
            const [x, y] = d3.pointer(event);
            addBoundaryPoint(x, y);
        }
    });
}

function applyBoundary() {
    const type = document.getElementById('boundary-type').value;
    
    if (type === 'none') {
        boundaryPoints = [];
        boundaryType = 'none';
    } else if (type === 'rectangle') {
        createRectangleBoundary();
    } else if (type === 'triangle') {
        createTriangleBoundary();
    }
    
    updateBoundaryDisplay();
    updateSimulationBoundary();
}

function createRectangleBoundary() {
    const canvasContainer = document.querySelector('.canvas-container');
    const rect = canvasContainer.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    
    const margin = 50;
    boundaryPoints = [
        [margin, margin],
        [width - margin, margin],
        [width - margin, height - margin],
        [margin, height - margin]
    ];
    boundaryType = 'rectangle';
}

function createTriangleBoundary() {
    const canvasContainer = document.querySelector('.canvas-container');
    const rect = canvasContainer.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    
    const centerX = width / 2;
    const margin = 50;
    boundaryPoints = [
        [centerX, margin],
        [width - margin, height - margin],
        [margin, height - margin]
    ];
    boundaryType = 'triangle';
}

function addBoundaryPoint(x, y) {
    if (boundaryType === 'none') return;
    
    boundaryPoints.push([x, y]);
    updateBoundaryDisplay();
    updateSimulationBoundary();
}

function updateBoundaryDisplay() {
    if (!boundaryGroup || !boundaryPolygon) return;
    
    if (boundaryVisible && boundaryPoints.length > 2) {
        const pointsString = boundaryPoints.map(p => p.join(',')).join(' ');
        boundaryPolygon
            .attr('points', pointsString)
            .style('display', 'block');
        
        // 显示边界名称
        document.getElementById('boundary-name').style.display = 'block';
        
        // 更新边界句柄
        updateBoundaryHandles();
    } else {
        boundaryPolygon.style('display', 'none');
        document.getElementById('boundary-name').style.display = 'none';
        removeBoundaryHandles();
    }
}

function updateBoundaryHandles() {
    if (!boundaryGroup) return;
    
    // 移除现有句柄
    boundaryGroup.selectAll('.boundary-handle').remove();
    
    // 添加新句柄
    boundaryHandles = boundaryGroup.selectAll('.boundary-handle')
        .data(boundaryPoints)
        .enter()
        .append('circle')
        .attr('class', 'boundary-handle')
        .attr('cx', d => d[0])
        .attr('cy', d => d[1])
        .attr('r', 6)
        .on('click', function(event, d) {
            if (event.shiftKey) {
                removeBoundaryPoint(d);
            }
        })
        .call(d3.drag()
            .on('start', boundaryDragStarted)
            .on('drag', boundaryDragged)
            .on('end', boundaryDragEnded)
        );
}

function removeBoundaryHandles() {
    if (boundaryGroup) {
        boundaryGroup.selectAll('.boundary-handle').remove();
    }
}

function removeBoundaryPoint(point) {
    const index = boundaryPoints.findIndex(p => p[0] === point[0] && p[1] === point[1]);
    if (index > -1 && boundaryPoints.length > 3) {
        boundaryPoints.splice(index, 1);
        updateBoundaryDisplay();
        updateSimulationBoundary();
    }
}

function boundaryDragStarted(event, d) {
    // 拖拽开始
}

function boundaryDragged(event, d) {
    d[0] = event.x;
    d[1] = event.y;
    updateBoundaryDisplay();
}

function boundaryDragEnded(event, d) {
    updateSimulationBoundary();
}

function updateSimulationBoundary() {
    if (!simulation || boundaryPoints.length < 3) {
        // 如果没有边界，移除边界力
        simulation.force('boundary', null);
        return;
    }
    
    // 创建更强的边界力
    const boundaryForce = function(alpha) {
        nodesData.forEach(node => {
            if (node.x !== undefined && node.y !== undefined) {
                // 检查节点是否在边界内
                if (!isPointInPolygon([node.x, node.y], boundaryPoints)) {
                    // 将节点强制推回边界内
                    const closest = getClosestPointOnBoundary([node.x, node.y]);
                    const dx = closest[0] - node.x;
                    const dy = closest[1] - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        // 增强边界力的强度
                        const force = alpha * 0.5; // 增加力的强度
                        node.vx += dx * force;
                        node.vy += dy * force;
                        
                        // 如果节点距离边界太远，直接移动到边界内
                        if (distance > node.radius) {
                            const pushDistance = node.radius * 0.9; // 推到边界内一点
                            node.x = closest[0] - (dx / distance) * pushDistance;
                            node.y = closest[1] - (dy / distance) * pushDistance;
                        }
                    }
                }
            }
        });
    };
    
    simulation.force('boundary', boundaryForce);
    
    // 重新启动模拟以应用边界约束
    simulation.alpha(0.3).restart();
}

function isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    
    return inside;
}

function getClosestPointOnBoundary(point) {
    const [px, py] = point;
    let closestPoint = boundaryPoints[0];
    let minDistance = Infinity;
    
    for (let i = 0; i < boundaryPoints.length; i++) {
        const j = (i + 1) % boundaryPoints.length;
        const [x1, y1] = boundaryPoints[i];
        const [x2, y2] = boundaryPoints[j];
        
        const closest = getClosestPointOnLineSegment([px, py], [x1, y1], [x2, y2]);
        const distance = Math.sqrt(Math.pow(closest[0] - px, 2) + Math.pow(closest[1] - py, 2));
        
        if (distance < minDistance) {
            minDistance = distance;
            closestPoint = closest;
        }
    }
    
    return closestPoint;
}

function getClosestPointOnLineSegment(point, lineStart, lineEnd) {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return [x1, y1];
    
    let param = dot / lenSq;
    
    if (param < 0) {
        return [x1, y1];
    } else if (param > 1) {
        return [x2, y2];
    } else {
        return [x1 + param * C, y1 + param * D];
    }
}

function setupImageUpload() {
    // 图片上传事件
    document.getElementById('imageUpload')?.addEventListener('change', handleImageUpload);
    
    // 复制JSON按钮
    document.getElementById('copyJSONButton')?.addEventListener('click', copyJSONToClipboard);
    
    // 生成平面图按钮
    document.getElementById('drawFloorPlanButton')?.addEventListener('click', drawFloorPlanFromVector);
    
    // 保存平面图按钮
    document.getElementById('saveFloorPlanImage')?.addEventListener('click', saveFloorPlanImage);
    
    // 生成Excel按钮
    document.getElementById('excelFromVectorOutput')?.addEventListener('click', generateExcelFromVector);
    
    // 视域分析按钮
    document.getElementById('visibilityAnalysisButton')?.addEventListener('click', () => {
        if (currentVectorData) {
            // 将数据存储到sessionStorage中
            sessionStorage.setItem('floorPlanData', JSON.stringify(currentVectorData));
            sessionStorage.setItem('currentLanguage', currentLanguage);
            sessionStorage.setItem('activeTab', 'visibility-analysis'); // 设置要打开的标签页
            // 导航到整合分析页面
            window.location.href = '手绘平面图分析与重建.html';
        } else {
            alert('请先上传并矢量化图片');
        }
    });
    
    // 寻路按钮
    document.getElementById('roadfindButton')?.addEventListener('click', () => {
        if (currentVectorData) {
            // 将数据存储到sessionStorage中
            sessionStorage.setItem('floorPlanData', JSON.stringify(currentVectorData));
            sessionStorage.setItem('currentLanguage', currentLanguage);
            sessionStorage.setItem('activeTab', 'pathfinding'); // 设置要打开的标签页
            // 导航到整合分析页面
            window.location.href = '手绘平面图分析与重建.html';
        } else {
            alert('请先上传并矢量化图片');
        }
    });
}

let currentVectorData = null;

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('preview');
        preview.src = e.target.result;
        preview.style.display = 'block';
        
        // 开始矢量化处理
        vectorizeImage(e.target.result);
    };
    reader.readAsDataURL(file);
}

function vectorizeImage(dataURL) {
    // 显示加载状态
    document.getElementById('loading').style.display = 'block';
    document.getElementById('vectorOutput').textContent = '';
    document.getElementById('error').textContent = '';
    
    // 隐藏结果按钮
    hideVectorButtons();
    
    // 提取base64数据
    const base64Image = dataURL.split(',')[1];
    
    // 调用矢量化API
    callVectorAPI(base64Image);
}

function callVectorAPI(base64Image) {
    const data = JSON.stringify({ image: base64Image });
    
    fetch('https://backend.rasterscan.com/raster-to-vector-base64', {
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
        handleVectorSuccess(data);
    })
    .catch(error => {
        handleVectorError(error);
    })
    .finally(() => {
        document.getElementById('loading').style.display = 'none';
    });
}

function handleVectorSuccess(data) {
    currentVectorData = data;
    
    // 显示JSON数据
    const vectorOutput = document.getElementById('vectorOutput');
    vectorOutput.textContent = JSON.stringify(data, null, 2);
    vectorOutput.style.display = 'block';
    
    // 显示操作按钮
    showVectorButtons();
    
    // 自动绘制平面图
    drawFloorPlanFromVector();
    
    console.log('矢量化成功:', data);
}

function handleVectorError(error) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = `矢量化失败: ${error.message}`;
    errorDiv.style.display = 'block';
    
    console.error('矢量化错误:', error);
}

function hideVectorButtons() {
    document.getElementById('copyJSONButton').style.display = 'none';
    document.getElementById('drawFloorPlanButton').style.display = 'none';
    document.getElementById('saveFloorPlanImage').style.display = 'none';
    document.getElementById('excelFromVectorOutput').style.display = 'none';
}

function showVectorButtons() {
    document.getElementById('copyJSONButton').style.display = 'inline-flex';
    document.getElementById('drawFloorPlanButton').style.display = 'inline-flex';
    document.getElementById('saveFloorPlanImage').style.display = 'inline-flex';
    document.getElementById('excelFromVectorOutput').style.display = 'inline-flex';
}

function copyJSONToClipboard() {
    if (!currentVectorData) {
        alert('没有可复制的数据');
        return;
    }
    
    const jsonText = JSON.stringify(currentVectorData, null, 2);
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(jsonText).then(() => {
            alert('JSON数据已复制到剪贴板');
        }).catch(err => {
            fallbackCopyToClipboard(jsonText);
        });
    } else {
        fallbackCopyToClipboard(jsonText);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        alert('JSON数据已复制到剪贴板');
    } catch (err) {
        alert('复制失败，请手动复制');
    }
    
    document.body.removeChild(textArea);
}

function drawFloorPlanFromVector() {
    if (!currentVectorData) {
        alert('没有可绘制的数据');
        return;
    }
    
    const canvas = document.getElementById('floorPlanCanvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.display = 'block';
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // 处理墙体数据
    if (currentVectorData.walls && Array.isArray(currentVectorData.walls)) {
        currentVectorData.walls.forEach(wall => {
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
    if (currentVectorData.doors && Array.isArray(currentVectorData.doors)) {
        currentVectorData.doors.forEach(door => {
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
    if (currentVectorData.rooms && Array.isArray(currentVectorData.rooms)) {
        currentVectorData.rooms.forEach(room => {
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
    
    // 绘制房间
    if (currentVectorData.rooms && Array.isArray(currentVectorData.rooms)) {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1;
        
        currentVectorData.rooms.forEach(room => {
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
    
    // 绘制墙体
    if (currentVectorData.walls && Array.isArray(currentVectorData.walls)) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        
        currentVectorData.walls.forEach(wall => {
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
    
    // 绘制门
    if (currentVectorData.doors && Array.isArray(currentVectorData.doors)) {
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        
        currentVectorData.doors.forEach(door => {
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

function saveFloorPlanImage() {
    const canvas = document.getElementById('floorPlanCanvas');
    if (canvas.style.display === 'none') {
        alert('请先生成平面图');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `平面图_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function setupCanvasControls() {
    // 画布控制按钮
    document.getElementById('zoom-in')?.addEventListener('click', () => {
        zoomCanvas(1.2);
    });
    
    document.getElementById('zoom-out')?.addEventListener('click', () => {
        zoomCanvas(0.8);
    });
    
    document.getElementById('reset-view')?.addEventListener('click', () => {
        resetCanvasView();
    });
    
    // 设置画布拖拽和缩放
    setupCanvasPanning();
}

let currentZoom = 1;
let panX = 0;
let panY = 0;

function zoomCanvas(factor) {
    currentZoom *= factor;
    currentZoom = Math.max(0.1, Math.min(5, currentZoom)); // 限制缩放范围
    
    if (svg) {
        // 应用变换到主要的g元素
        const mainGroup = svg.select('g');
        if (mainGroup.empty()) {
            // 如果没有主要的g元素，创建一个
            svg.selectAll('*').remove();
            const g = svg.append('g');
            // 重新初始化
            initializeBubbleEditor();
        } else {
            mainGroup.attr('transform', `translate(${panX}, ${panY}) scale(${currentZoom})`);
        }
        
        // 重新启动模拟以适应新的缩放
        if (simulation) {
            simulation.alpha(0.1).restart();
        }
    }
}

function resetCanvasView() {
    currentZoom = 1;
    panX = 0;
    panY = 0;
    
    if (svg) {
        const mainGroup = svg.select('g');
        if (!mainGroup.empty()) {
            mainGroup.attr('transform', 'translate(0, 0) scale(1)');
        }
        
        // 重新计算画布尺寸
        updateCanvasSize();
        
        // 重新启动模拟
        if (simulation) {
            const canvasContainer = document.querySelector('.canvas-container');
            const rect = canvasContainer.getBoundingClientRect();
            simulation.force('center', d3.forceCenter(rect.width/2, rect.height/2));
            simulation.alpha(1).restart();
        }
    }
}

// 添加拖拽平移功能
function setupCanvasPanning() {
    if (!svg) return;
    
    const zoom = d3.zoom()
        .scaleExtent([0.1, 5])
        .on('zoom', function(event) {
            const { transform } = event;
            currentZoom = transform.k;
            panX = transform.x;
            panY = transform.y;
            
            const mainGroup = svg.select('g');
            if (!mainGroup.empty()) {
                mainGroup.attr('transform', transform);
            }
        });
    
    svg.call(zoom);
}

// ===== 其他功能页面加载 =====
function loadVisibilityAnalysis() {
    // 加载视域分析功能
    window.open('视域分析.html', '_blank');
}

function loadPathfinding() {
    // 加载路径规划功能
    window.open('寻路带沙盘导出.html', '_blank');
}

function load3DVisualization() {
    // 加载3D可视化功能
    window.open('3d visualization/index.html', '_blank');
}

// ===== 工具函数 =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== 导出全局函数供HTML使用 =====
window.BubbleEditor = {
    selectNode,
    updateVisualization,
    saveProject,
    loadProject
};

function updateLineSegmentAttraction() {
    if (!selectedNode) return;
    
    const segmentSelect = document.getElementById('line-segment-select');
    const attractionInput = document.getElementById('line-segment-attraction-input');
    
    const segmentId = segmentSelect.value;
    const attraction = parseFloat(attractionInput.value) || 0;
    
    if (segmentId) {
        selectedNode.lineAttractions[segmentId] = attraction;
        
        // 更新模拟力
        updateLineAttractionForces();
        
        if (simulation) {
            simulation.alpha(0.3).restart();
        }
    }
}

function updateLineAttractionForces() {
    if (!simulation) return;
    
    // 移除现有的线段吸引力
    simulation.force('lineAttraction', null);
    
    // 创建新的线段吸引力
    const lineAttractionForce = function(alpha) {
        nodesData.forEach(node => {
            if (node.lineAttractions && node.x !== undefined && node.y !== undefined) {
                Object.keys(node.lineAttractions).forEach(segmentId => {
                    const attraction = node.lineAttractions[segmentId];
                    if (attraction !== 0) {
                        const segment = lineComponents.find(s => s.id === segmentId);
                        if (segment) {
                            const closestPoint = getClosestPointOnLineSegment(
                                [node.x, node.y], 
                                segment.start, 
                                segment.end
                            );
                            
                            const dx = closestPoint[0] - node.x;
                            const dy = closestPoint[1] - node.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance > 0) {
                                const force = attraction * alpha * 0.1;
                                node.vx += dx * force / distance;
                                node.vy += dy * force / distance;
                            }
                        }
                    }
                });
            }
        });
    };
    
    simulation.force('lineAttraction', lineAttractionForce);
}

function updateLineSegmentOptions() {
    const select = document.getElementById('line-segment-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">选择线段</option>';
    
    lineComponents.forEach((segment, index) => {
        const option = document.createElement('option');
        option.value = segment.id || `segment_${index}`;
        option.textContent = segment.name || `线段 ${index + 1}`;
        select.appendChild(option);
    });
}

// ===== 语言切换功能 =====
let currentLanguage = 'zh'; // 默认中文

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
    
    // 通知子窗口更新语言
    notifyChildWindows(lang);
}

function notifyChildWindows(lang) {
    // 如果有打开的子窗口，通知它们更新语言
    try {
        if (window.visibilityWindow && !window.visibilityWindow.closed) {
            window.visibilityWindow.postMessage({ type: 'languageChange', language: lang }, '*');
        }
        if (window.pathfindingWindow && !window.pathfindingWindow.closed) {
            window.pathfindingWindow.postMessage({ type: 'languageChange', language: lang }, '*');
        }
        if (window.integratedAnalysisWindow && !window.integratedAnalysisWindow.closed) {
            window.integratedAnalysisWindow.postMessage({ type: 'languageChange', language: lang }, '*');
        }
    } catch (error) {
        // 忽略跨域错误
    }
}

function updatePlaceholders(lang) {
    const placeholders = {
        'select-node-input': {
            zh: '输入节点名称',
            en: 'Enter node name'
        },
        'new-node-name': {
            zh: '节点名称',
            en: 'Node name'
        },
        'nameInput': {
            zh: '自定义名称...',
            en: 'Custom name...'
        },
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

// 在初始化时加载保存的语言设置
function loadLanguageSettings() {
    const savedLang = localStorage.getItem('language');
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
        currentLanguage = savedLang;
    }
}

function openIntegratedAnalysis() {
    // 获取当前的JSON数据
    let jsonData = null;
    
    // 如果有矢量化数据，优先使用
    if (window.currentVectorData) {
        jsonData = window.currentVectorData;
    } else {
        // 否则从泡泡图生成基础数据
        jsonData = generateBasicFloorPlanData();
    }
    
    // 在当前页面中打开整合分析页面，而不是弹出新窗口
    if (jsonData) {
        // 将数据存储到sessionStorage中
        sessionStorage.setItem('floorPlanData', JSON.stringify(jsonData));
        sessionStorage.setItem('currentLanguage', currentLanguage);
    }
    
    // 在当前标签页中导航到整合分析页面
    window.location.href = '手绘平面图分析与重建.html';
}

function generateBasicFloorPlanData() {
    // 从当前泡泡图数据生成基础的平面图数据
    const bounds = {
        minX: Math.min(...nodesData.map(n => n.x - n.radius)),
        maxX: Math.max(...nodesData.map(n => n.x + n.radius)),
        minY: Math.min(...nodesData.map(n => n.y - n.radius)),
        maxY: Math.max(...nodesData.map(n => n.y + n.radius))
    };
    
    // 创建外围墙体
    const walls = [
        {"position": [[bounds.minX - 20, bounds.minY - 20], [bounds.maxX + 20, bounds.minY - 20]]},
        {"position": [[bounds.maxX + 20, bounds.minY - 20], [bounds.maxX + 20, bounds.maxY + 20]]},
        {"position": [[bounds.maxX + 20, bounds.maxY + 20], [bounds.minX - 20, bounds.maxY + 20]]},
        {"position": [[bounds.minX - 20, bounds.maxY + 20], [bounds.minX - 20, bounds.minY - 20]]}
    ];
    
    // 创建房间（基于节点位置）
    const rooms = nodesData.map(node => {
        const size = node.radius;
        return [
            {"x": node.x - size, "y": node.y - size},
            {"x": node.x + size, "y": node.y - size},
            {"x": node.x + size, "y": node.y + size},
            {"x": node.x - size, "y": node.y + size}
        ];
    });
    
    // 创建门（在连接的节点之间）
    const doors = [];
    linksData.forEach(link => {
        const source = nodesData.find(n => n.id === (link.source.id || link.source));
        const target = nodesData.find(n => n.id === (link.target.id || link.target));
        
        if (source && target) {
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const doorSize = 15;
            
            doors.push({
                "position": [
                    [midX - doorSize, midY - doorSize],
                    [midX + doorSize, midY + doorSize]
                ]
            });
        }
    });
    
    return {
        walls: walls,
        doors: doors,
        rooms: rooms
    };
}
