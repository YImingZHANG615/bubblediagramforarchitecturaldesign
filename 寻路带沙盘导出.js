// 全局变量
let gridData = [];
let startCell = null;
let endCell = null;
let lastPath = [];
let originalJsonData = null;

// 初始化Three.js场景
let scene, camera, renderer, controls;

function initThreeJS() {
    const container = document.getElementById('threejs-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.set(50, 100, 50);
    controls.update();

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function generate3DTerrain(grid3D) {
    // 清除旧地形
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    const cellSize = 10; // 每个网格单元的大小
    const halfCellSize = cellSize / 2;

    grid3D.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell.height > 0) {
                const geometry = new THREE.BoxGeometry(cellSize, cell.height, cellSize);
                const material = new THREE.MeshStandardMaterial({ color: cell.color });
                const cube = new THREE.Mesh(geometry, material);
                
                // 定位方块
                cube.position.set(
                    c * cellSize - (grid3D[0].length * halfCellSize),
                    cell.height / 2,
                    r * cellSize - (grid3D.length * halfCellSize)
                );

                scene.add(cube);
            }
        });
    });

    // 重新渲染场景
    renderer.render(scene, camera);
}

// 导出3D模型功能
function export3DModel() {
    if(!gridData || gridData.length === 0){
        alert("网格数据为空，请先生成网格！");
        return;
    }

    const grid3D = gridData.map((row, r) => row.map((cell, c) => {
        if(cell.isWall){
            return { height: 50, color: "#666" };
        } else if(cell.isDoor){
            return { height: 50, color: "#87CEFA" };
        } else if(lastPath.some(p => p.row === r && p.col === c)){
            return { height: 30, color: "#FFEB3B" };
        } else if(cell === startCell){
            return { height: 0, color: "#4CAF50" };
        } else if(cell === endCell){
            return { height: 0, color: "#F44336" };
        } else {
            return { height: 0, color: "#f9f9f9" };
        }
    }));

    // 直接生成3D模型
    generate3DTerrain(grid3D);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    animate();

    // 绑定导出3D模型按钮事件
    document.getElementById('export3dModelBtn').addEventListener('click', export3DModel);
});

// 其他函数（寻路、网格生成等）保持不变
// ...
