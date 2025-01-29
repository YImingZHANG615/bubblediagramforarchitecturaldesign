// 全局变量
let canvas, ctx;
let rooms = [];
let selectedRoom = null;
let obstacleRooms = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('mainCanvas');
    ctx = canvas.getContext('2d');
    
    // 调整画布大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化事件监听器
    setupEventListeners();
});

function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawCanvas();
}

function setupEventListeners() {
    const roomSelect = document.getElementById('roomSelect');
    const calculateButton = document.getElementById('calculateVisibility');

    // 填充房间选择下拉菜单
    populateRoomSelect();

    roomSelect.addEventListener('change', (e) => {
        selectedRoom = rooms.find(room => room.name === e.target.value);
        drawCanvas();
    });

    calculateButton.addEventListener('click', calculateVisibility);

    canvas.addEventListener('click', handleCanvasClick);
}

function populateRoomSelect() {
    const roomSelect = document.getElementById('roomSelect');
    roomSelect.innerHTML = '<option value="">选择房间</option>';
    
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.name;
        option.textContent = room.name;
        roomSelect.appendChild(option);
    });
}

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制房间和障碍物
    rooms.forEach(room => {
        ctx.beginPath();
        ctx.rect(room.x, room.y, room.width, room.height);
        
        if (room === selectedRoom) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        } else if (obstacleRooms.includes(room)) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        } else {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        }
        
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    });
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 检测点击的房间
    const clickedRoom = rooms.find(room => 
        x >= room.x && x <= room.x + room.width &&
        y >= room.y && y <= room.y + room.height
    );

    if (clickedRoom) {
        document.getElementById('roomSelect').value = clickedRoom.name;
        selectedRoom = clickedRoom;
        drawCanvas();
    }
}

function calculateVisibility() {
    if (!selectedRoom) {
        alert('请先选择一个房间');
        return;
    }

    // 重置障碍物房间
    obstacleRooms = [];

    // 简单的可视性计算
    rooms.forEach(room => {
        if (room !== selectedRoom) {
            // 这里可以添加更复杂的可视性判断逻辑
            if (isObstructed(selectedRoom, room)) {
                obstacleRooms.push(room);
            }
        }
    });

    // 更新结果显示
    updateVisibilityResult();
    drawCanvas();
}

function isObstructed(sourceRoom, targetRoom) {
    // 简单的碰撞检测
    return !(
        sourceRoom.x + sourceRoom.width < targetRoom.x ||
        sourceRoom.x > targetRoom.x + targetRoom.width ||
        sourceRoom.y + sourceRoom.height < targetRoom.y ||
        sourceRoom.y > targetRoom.y + targetRoom.height
    );
}

function updateVisibilityResult() {
    const resultDiv = document.getElementById('visibilityResult');
    if (obstacleRooms.length === 0) {
        resultDiv.textContent = `${selectedRoom.name}没有被任何房间遮挡`;
    } else {
        const obstacleNames = obstacleRooms.map(room => room.name).join('、');
        resultDiv.textContent = `${selectedRoom.name}被以下房间遮挡：${obstacleNames}`;
    }
}

// 从URL参数加载房间数据
function loadRoomsFromParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    
    // 如果有返回URL，说明是从其他页面跳转过来的
    if (returnUrl) {
        // 尝试从localStorage获取房间数据
        const storedRooms = localStorage.getItem('roomData');
        if (storedRooms) {
            rooms = JSON.parse(storedRooms);
            populateRoomSelect();
            drawCanvas();
        }
    }
}

// 返回按钮事件
document.getElementById('returnButton').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    if (returnUrl) {
        window.location.href = returnUrl;
    }
});

// 页面加载时执行
document.addEventListener('DOMContentLoaded', loadRoomsFromParams);
