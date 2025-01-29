// 全局变量和初始化
let nodesData = [], linksData = [], boundaryType = 'none';
const chargeStrength = -30;

// 颜色转换函数
function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; 
    } else {
        let d = max - min;
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
    let r, g, b;
    if (s === 0) {
        r = g = b = l; 
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    const rgb2hex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${rgb2hex(r)}${rgb2hex(g)}${rgb2hex(b)}`;
}

// 其他函数和事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 颜色滑块事件
    const hueSlider = document.getElementById('hue-slider');
    const satSlider = document.getElementById('sat-slider');
    const lightSlider = document.getElementById('light-slider');

    [hueSlider, satSlider, lightSlider].forEach(slider => {
        slider.addEventListener('input', updateColorTransformation);
    });

    // 文件操作按钮事件
    document.getElementById('save-button').addEventListener('click', saveJSON);
    document.getElementById('load-button').addEventListener('click', () => {
        document.getElementById('load-file').click();
    });
    document.getElementById('load-file').addEventListener('change', loadJSON);

    // 导入/导出Excel按钮事件
    document.getElementById('import-excel-button').addEventListener('click', () => {
        document.getElementById('excel-file-input').click();
    });
    document.getElementById('export-excel-button').addEventListener('click', exportExcel);

    // 其他按钮和功能的事件监听器
    setupNodeSelectionAndEditing();
    setupBoundaryEvents();
    setupImageUploadAndVectorization();
});

// 实现其他函数...（这里只是一个框架，需要移植原有的所有函数）
function updateColorTransformation() {
    const hueValue = +hueSlider.value;
    const satValue = +satSlider.value;
    const lightValue = +lightSlider.value;

    document.getElementById('hue-value').textContent = hueValue;
    document.getElementById('sat-value').textContent = satValue.toFixed(2);
    document.getElementById('light-value').textContent = lightValue.toFixed(2);

    // 更新颜色变换逻辑
    // ...
}

function saveJSON() {
    // 保存JSON逻辑
    // ...
}

function loadJSON(event) {
    // 加载JSON逻辑
    // ...
}

function exportExcel() {
    // 导出Excel逻辑
    // ...
}

function setupNodeSelectionAndEditing() {
    // 节点选择和编辑逻辑
    // ...
}

function setupBoundaryEvents() {
    // 边界事件设置逻辑
    // ...
}

function setupImageUploadAndVectorization() {
    // 图像上传和矢量化逻辑
    // ...
}
