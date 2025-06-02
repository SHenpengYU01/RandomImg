class ImageLoader {
    constructor(img_num) {
        this.images = [];
        this.targetWidth = 1024;
        this.loaded = 0;
        this.success = 0;
        this.errors = 0;
        
        // 获取DOM元素
        this.loadBtn = document.getElementById('loadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusEl = document.getElementById('status');
        this.progressBar = document.getElementById('progressBar');
        this.gallery = document.getElementById('gallery');
        this.loadedCount = document.getElementById('loadedCount');
        this.successCount = document.getElementById('successCount');
        this.errorCount = document.getElementById('errorCount');
        
        // 绑定事件
        this.loadBtn.addEventListener('click', () => this.loadImages(img_num));
        this.resetBtn.addEventListener('click', () => this.reset());
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
    
    // 获取单张图片URL（使用支持CORS的API）
    async fetchImageUrl() {
        try {
            // 使用支持CORS的API
            const timestamp = new Date().getTime();
            const workerUrl = "https://cors.mythlogos.top"; // 代理服务器地址

            // const targetUrl = `https://api.lolicon.app/setu/v2`;//失败
            // const targetUrl = `https://t.alcy.cc/ycy?json&nocache=${timestamp}`;//失败
            const targetUrl = `https://www.dmoe.cc/random.php?return=json&nocache=${timestamp}`; //樱花API
            // const targetUrl = `https://img.paulzzh.com/touhou/random?type=json&nocache=${timestamp}`;//过期东方P API

            // 通过代理请求
            const response = await fetch(`${workerUrl}/?url=${encodeURIComponent(targetUrl)}`);
            console.log("response = ",response);
            
            if (!response.ok) {
                throw new Error(`API响应错误: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('data = ',data);
            if (data && (data.imgurl || data.jpegurl || data.url || data.urls)) {
                return  data.url?data.url:
                        data.imgurl?data.imgurl:
                        data.jpegurl?data.jpegurl:
                        data.urls?data.urls.original:0;
            }
            
            throw new Error('API返回数据无效');
        } catch (error) {
            console.error('获取图片URL失败:', error);
            throw error;
        }
    }
    
    async getImageAsBase64(image_url) {
        try {
            // 通过代理服务器获取图片
            const workerUrl = `https://cors.mythlogos.top`
            const proxyUrl = `${workerUrl}/?url=${encodeURIComponent(image_url)}`;
            // console.log("Url of img = ",proxyUrl);
            
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error('图片请求失败');
            }
            
            // 获取Blob对象
            const blob = await response.blob();
            
            // 将Blob转换为Base64
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            
        } catch (error) {
            console.error('获取图片Base64失败:', error);
            throw error;
        }
    }
    
    // 加载并处理图片尺寸
    async processImage(url, index) {
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
            // 1. 通过代理获取图片的Base64数据
            const base64Image = await this.getImageAsBase64(url);
            
            // 2. 创建Image对象
            const img = new Image();
            img.src = base64Image;
            
            // 3. 等待图片加载
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('图片加载失败'));
            });
            console.log("width and height = ",img.width,img.height);
            
            // 4. 创建Canvas处理尺寸
            const canvas = document.createElement('canvas');
            canvas.width = this.targetWidth;
            canvas.height = this.targetWidth*img.height/img.width;
            
            const ctx = canvas.getContext('2d');
            
            // 5. 绘制并缩放图片
            ctx.drawImage(img, 0, 0, this.targetWidth, canvas.height);
            
            // 6. 转换为Data URL
            const processedUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // 7. 更新卡片显示处理后的图片
            card.className = 'image-card';
            card.innerHTML = `
                <div class="image-container">
                    <img src="${url}" alt="二次元图片 #${index+1}">
                </div>
                <div class="image-info">#${index+1}:${url}</div>
            `;
            
            return processedUrl;
            
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
        this.updateStatus('开始加载图片...');
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
                    const processedImage = await this.processImage(imageUrl, i);

                    console.log("after img process");

                    this.images.push(processedImage);
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
    const loader = new ImageLoader(2);
});