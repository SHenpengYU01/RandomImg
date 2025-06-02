class ImageLoader {
    constructor() {
        this.images = [];
        this.loaded = 0;
        this.success = 0;
        this.errors = 0;
        this.currentImageCount = 1;
        this.currentSource = 'sakura';
        this.imageSources = {
            sakura: {
                intro: '最后更新于2023年六月(T_T)',
                url: 'https://www.dmoe.cc/random.php?return=json'
            },
            jitsu: {
                intro: '别用这个(▼ヘ▼#)',
                url: 'https://moe.jitsu.top/img/?type=json&sort=pixiv',
            },
            liciyuan: {
                intro: '好图，无需多言(=￣ω￣=)',
                url: 'https://t.alcy.cc/ycy?json',
            },
            dongfang: {
                intro: '过期了',
                url:'https://img.paulzzh.com/touhou/random?type=json',
            },
            lolicon: {
                intro: '无法访问',
                url: 'https://api.lolicon.app/setu/v2'
            }
        };
        
        // 获取DOM元素
        this.loadBtn = document.getElementById('loadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusEl = document.getElementById('status');
        this.progressBar = document.getElementById('progressBar');
        this.gallery = document.getElementById('gallery');
        this.loadedCount = document.getElementById('loadedCount');
        this.successCount = document.getElementById('successCount');
        this.errorCount = document.getElementById('errorCount');
        
        this.imageCountInput = document.getElementById('imageCount');
        this.decrementBtn = document.getElementById('decrementBtn');
        this.incrementBtn = document.getElementById('incrementBtn');
        
        this.sourceSelector = document.getElementById('sourceSelector');
        this.previewDots = document.getElementById('previewDots');

        // 绑定事件
        this.loadBtn.addEventListener('click', () => this.loadImages(this.currentImageCount));
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.decrementBtn.addEventListener('click', () => this.adjustCount(-1));
        this.incrementBtn.addEventListener('click', () => this.adjustCount(1));
        this.imageCountInput.addEventListener('change', () => {
            this.setCount(parseInt(this.imageCountInput.value));
        });
        this.sourceSelector.addEventListener('click', (e) => this.selectSourse(e));

        // 初始化显示
        this.updateCounterDisplay();
        this.initpreviewDots();
    }
    //选择图源
    selectSourse(e){
        const sourceItem = e.target.closest('.source-item');
        if (sourceItem) {
            // 移除所有active类
            document.querySelectorAll('.source-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // 添加active类到当前选中项
            sourceItem.classList.add('active');
            // 更新当前图片源
            this.currentSource = sourceItem.dataset.source;
            this.updateStatus(this.imageSources[this.currentSource].intro);
        }
    }

     // 初始化预览点
    initpreviewDots() {
        this.previewDots.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const dot = document.createElement('div');
            dot.className = 'preview-dot';
            if (i < this.currentImageCount) {
                dot.classList.add('active');
            }
            this.previewDots.appendChild(dot);
        }
    }
    
    // 更新预览点
    updatePreviewDots() {
        const dots = this.previewDots.querySelectorAll('.preview-dot');
        dots.forEach((dot, index) => {
            if (index < this.currentImageCount) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // 更新状态信息
    updateStatus(message) {
        this.statusEl.textContent = message;
    }
    
    // 更新统计信息
    updateStats() {
        this.loadedCount.textContent = this.loaded;
        this.successCount.textContent = this.success;
        this.errorCount.textContent = this.errors;
    }
    
    // 更新进度条
    updateProgress(percent) {
        this.progressBar.style.width = `${percent}%`;
    }
    
    // 重置页面
    reset() {
        this.images = [];
        this.loaded = 0;
        this.success = 0;
        this.errors = 0;
        this.gallery.innerHTML = '';
        this.updateStatus('已重置页面，点击按钮重新加载图片');
        this.updateStats();
        this.updateProgress(0);
        this.loadBtn.disabled = false;
    }

     // 统一调整数量的方法
    adjustCount(delta) {
        const newCount = this.currentImageCount + delta;
        this.setCount(newCount);
    }
    
    // 设置数量（带边界检查）
    setCount(value) {
        if (isNaN(value)) value = 1;
        this.currentImageCount = Math.min(20, Math.max(1, value));
        this.updateCounterDisplay();
    }
    
    // 更新计数器UI
    updateCounterDisplay() {
        // this.counterValueDisplay.textContent = this.currentImageCount;
        this.imageCountInput.value = this.currentImageCount;
        this.updatePreviewDots();
    }
    
    
    // 获取单张图片URL（使用支持CORS的API）
    async fetchImageUrl() {
        try {
            // const timestamp = new Date().getTime();
            
            // 通过代理请求
            const workerUrl = "https://cors.mythlogos.top"; // 代理服务器地址
            const targetUrl = this.imageSources[this.currentSource].url;

            const finalUrl = this.currentSource=='jitsu'?targetUrl:`${workerUrl}/?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(finalUrl);
            console.log("response = ",response);
            
            if (!response.ok) throw new Error(`API响应错误: ${response.status}`);
            
            if(this.currentSource==='liciyuan'){
                const data = await response.text();
                console.log("response.text = ",data);
                return data;
            }
            
            const data = await response.json();
            console.log('data = ',data);
            if (data && (data.imgurl || data.jpegurl || data.url || data.urls || data.pics)) {
                return  data.url?data.url:
                        data.imgurl?data.imgurl:
                        data.jpegurl?data.jpegurl:
                        data.urls?data.urls.original:
                        data.pics?data.pics[0]:0;
            }
            
            throw new Error('API返回数据无效');
        } catch (error) {
            console.error('获取图片URL失败:', error);
            throw error;
        }
    }
    
    async loadCard(url, index) {
        // 创建占位卡片
        const card = document.createElement('div');
        card.className = 'image-card loading';
        card.innerHTML = `
            <div class="image-container">
                <div style="color:#aaa; font-size:14px;">加载中...</div>
            </div>
            <div class="image-info">图片 #${index+1}</div>
        `;
        this.gallery.appendChild(card);
        
        try {
            // 更新卡片显示处理后的图片
            card.className = 'image-card';
            card.innerHTML = `
                <div class="image-container">
                    <img src="${url}" alt="二次元图片 #${index+1}">
                </div>
                <div class="image-info">${index+1}</div>
            `;
            
        } catch (error) {
            // 更新卡片显示错误信息
            card.className = 'image-card';
            card.innerHTML = `
                <div class="image-container" style="background:#f4433620; color:#ff5555;">
                    <div style="text-align:center; padding:10px; font-size:14px;">
                        <div>加载失败</div>
                        <div style="font-size:12px; margin-top:5px;">${error.message}</div>
                    </div>
                </div>
                <div class="image-info">图片 #${index+1}</div>
            `;
            throw error;
        }
    }
    
    async loadImages(img_num) {
        this.loadBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.images = [];
        this.loaded = 0;
        this.success = 0;
        this.errors = 0;
        this.updateStats();
        this.updateProgress(0);
        this.updateStatus('开始加载...');
        this.gallery.innerHTML = '';
        
        try {
            for (let i = 0; i < img_num; i++) {
                this.loaded++;
                this.updateStatus(`正在加载图片 ${this.loaded}/${img_num}...`);
                this.updateProgress((this.loaded / img_num) * 100);
                this.updateStats();
                
                try {
                    // 获取图片URL并处理尺寸
                    const imageUrl = await this.fetchImageUrl();
                    this.loadCard(imageUrl, i);

                    this.images.push(imageUrl);
                    this.success++;
                    this.updateStats();
                    
                    // 添加一点延迟避免请求过快
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                } catch (error) {
                    console.error(`图片 #${i+1} 加载失败: ${error.message}`);
                    this.errors++;
                    this.updateStats();
                }
            }
            
            this.updateStatus(`图片加载完成！成功: ${this.success}张, 失败: ${this.errors}张`);
            this.updateProgress(100);
            
        } catch (error) {
            this.updateStatus(`加载过程中出错: ${error.message}`);
            console.error('加载图片时出错:', error);
        } finally {
            this.resetBtn.disabled = false;
        }
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    const loader = new ImageLoader();
});