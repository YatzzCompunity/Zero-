class zam-ai {
    constructor() {
        this.currentAI = 'zam-ai';
        this.currentTool = null;
        this.conversations = [];
        this.currentConversationId = null;
        this.selectedFile = null;
        this.currentMediaUrl = null;
        this.mediaType = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadChatHistory();
        this.createNewConversation();
        this.updateModeIndicator();
    }

    bindEvents() {
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('show');
        });

        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.createNewConversation();
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('fileUploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        document.getElementById('removeFile').addEventListener('click', () => {
            this.removeFile();
        });

        document.querySelectorAll('.ai-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectAI(e.currentTarget.dataset.ai);
            });
        });

        document.querySelectorAll('.tool-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectTool(e.currentTarget.dataset.tool);
            });
        });

        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideMediaModal();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadMedia();
        });

        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target) && 
                sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
            }
        });
    }

    async callGeminiAPI(text) {
        try {
            const prompt = "Kamu adalah Zam-AI, asisten AI yang ahli dalam programming dan teknologi. Fokus utama kamu adalah membantu dalam hal coding, development, debugging, dan konsep pemrograman. Namun kamu juga bisa menjawab pertanyaan umum seperti AI pada umumnya. Gunakan bahasa Indonesia yang natural dan mudah dipahami. Berikan jawaban yang akurat dan membantu.";
            const apiUrl = `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}&content=${encodeURIComponent(text)}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            return data.data || 'Maaf, tidak ada respons dari AI.';
        } catch (err) {
            console.error('Gemini API Error:', err);
            return 'Terjadi kesalahan saat menghubungi AI.';
        }
    }

    async callMichelleAI(text) {
        try {
            const apiUrl = `https://vinztyty.my.id/ai/venice?text=${encodeURIComponent(text)}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.status === true && data.result) {
                return data.result;
            } else {
                return 'Maaf, tidak ada respons dari Michelle AI.';
            }
        } catch (error) {
            console.error('Michelle AI Error:', error);
            return 'Terjadi kesalahan saat menghubungi Michelle AI.';
        }
    }

    async callBingImageAPI(prompt) {
        try {
            const apiUrl = `https://beta.anabot.my.id/api/ai/bingImgCreator?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.status === 200 && data.data.result.length) {
                return data.data.result;
            } else {
                throw new Error('Gambar tidak ditemukan!');
            }
        } catch (error) {
            console.error('Bing Image API Error:', error);
            throw new Error('Terjadi kesalahan saat mengambil gambar.');
        }
    }

    async callVideoGenerationAPI(prompt) {
        try {
            const apiUrl = `https://vinztyty.my.id/ai/aicatvideo?prompt=${encodeURIComponent(prompt)}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.status === true && data.result && data.result.url) {
                return {
                    success: true,
                    videoUrl: data.result.url,
                    videoId: data.result.video_id,
                    query: data.query
                };
            } else {
                return {
                    success: false,
                    error: 'Gagal generate video'
                };
            }
        } catch (error) {
            console.error('Video API Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    selectAI(aiName) {
        document.querySelectorAll('.ai-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-ai="${aiName}"]`).classList.add('active');
        
        this.currentAI = aiName;
        this.currentTool = null;
        
        document.getElementById('currentAITitle').textContent = `zamAi - ${this.getAIDisplayName(aiName)}`;
        this.updateModeIndicator();
        
        this.removeFile();
        this.showAISwitchedMessage(aiName);
    }

    selectTool(toolName) {
        this.currentTool = toolName;
        this.currentAI = null;
        
        document.querySelectorAll('.ai-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelectorAll('.tool-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-tool="${toolName}"]`).classList.add('active');
        
        document.getElementById('currentAITitle').textContent = `zamAi - ${this.getToolDisplayName(toolName)}`;
        this.updateModeIndicator();
        this.showToolInstructions(toolName);
    }

    getAIDisplayName(aiName) {
        const names = {
            gemini: 'Gemini AI',
            michelle: 'Michelle AI'
        };
        return names[aiName] || aiName;
    }

    getToolDisplayName(toolName) {
        const names = {
            bingimg: 'Bing Image Creator',
            videogen: 'AI Video Generator'
        };
        return names[toolName] || toolName;
    }

    updateModeIndicator() {
        const modeIndicator = document.getElementById('currentMode');
        if (this.currentAI) {
            modeIndicator.innerHTML = `<i class="fas fa-comment"></i> Chat Mode - ${this.getAIDisplayName(this.currentAI)}`;
        } else if (this.currentTool) {
            modeIndicator.innerHTML = `<i class="fas fa-${this.getToolIcon(this.currentTool)}"></i> ${this.getToolDisplayName(this.currentTool)} Mode`;
        }
    }

    getToolIcon(toolName) {
        const icons = {
            bingimg: 'palette',
            videogen: 'film'
        };
        return icons[toolName] || 'cog';
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        const file = this.selectedFile;

        if (!message && !this.currentTool) {
            this.addMessage('bot', '❌ Silakan masukkan pesan!');
            return;
        }

        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;

        messageInput.value = '';
        
        if (this.currentAI || (message && !this.currentTool)) {
            this.addMessage('user', message, file);
        }

        this.showLoading(true);

        try {
            if (this.currentAI) {
                await this.handleAIChat(message, file);
            } else if (this.currentTool) {
                await this.handleToolOperation(message, file);
            }
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('bot', `❌ Error: ${error.message}`);
        }

        this.showLoading(false);
        sendBtn.disabled = false;
        messageInput.focus();
        this.removeFile();
    }

    async handleAIChat(message, file) {
        let response;
        
        switch (this.currentAI) {
            case 'gemini':
                response = await this.callGeminiAPI(message);
                break;
            case 'michelle':
                response = await this.callMichelleAI(message);
                break;
        }
        
        this.addMessage('bot', response);
        this.saveChatHistory();
    }

    async handleToolOperation(message, file) {
        try {
            switch (this.currentTool) {
                case 'bingimg':
                    if (!message) {
                        this.addMessage('bot', '❌ Silakan masukkan prompt untuk generate gambar!');
                        return;
                    }
                    const images = await this.callBingImageAPI(message);
                    this.showMediaModal(images, 'Bing Image Creator Results', 'image');
                    this.addMessage('bot', `✅ Berhasil generate ${images.length} gambar dengan prompt: "${message}"`);
                    break;
                    
                case 'videogen':
                    if (!message) {
                        this.addMessage('bot', '❌ Silakan masukkan prompt untuk generate video!');
                        return;
                    }
                    const videoResult = await this.callVideoGenerationAPI(message);
                    if (videoResult.success) {
                        this.showMediaModal([videoResult.videoUrl], `Video: ${message}`, 'video');
                        this.addMessage('bot', `✅ Berhasil generate video dengan prompt: "${message}"`);
                    } else {
                        this.addMessage('bot', `❌ Gagal generate video: ${videoResult.error}`);
                    }
                    break;
            }
        } catch (error) {
            this.addMessage('bot', `❌ Error: ${error.message}`);
        }
    }

    handleFileUpload(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Silakan upload file gambar!');
            return;
        }

        this.selectedFile = file;

        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        
        fileName.textContent = file.name;
        filePreview.style.display = 'block';
    }

    removeFile() {
        const fileInput = document.getElementById('fileInput');
        const filePreview = document.getElementById('filePreview');
        
        fileInput.value = '';
        filePreview.style.display = 'none';
        this.selectedFile = null;
    }

    addMessage(sender, text, file = null) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (file && sender === 'user') {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-attachment';
            fileDiv.style.marginBottom = '0.5rem';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '0.5rem';
            img.style.border = '2px solid var(--border-color)';
            fileDiv.appendChild(img);
            
            contentDiv.appendChild(fileDiv);
        }

        if (text) {
            const textDiv = document.createElement('div');
            textDiv.innerHTML = this.formatMessage(text);
            contentDiv.appendChild(textDiv);
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (this.currentConversationId) {
            const conversation = this.conversations.find(c => c.id === this.currentConversationId);
            if (conversation) {
                conversation.messages.push({
                    sender,
                    text,
                    file: file ? { name: file.name, type: file.type } : null,
                    timestamp: new Date()
                });
                conversation.title = text.substring(0, 30) + (text.length > 30 ? '...' : '') || 'New Chat';
            }
        }
        
        this.saveChatHistory();
        this.updateChatHistory();
    }

    formatMessage(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: var(--border-color); padding: 0.2rem 0.4rem; border-radius: 0.25rem;">$1</code>');
    }

    showMediaModal(mediaUrls, title, mediaType) {
        const modal = document.getElementById('imageModal');
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        
        this.mediaType = mediaType;
        this.currentMediaUrl = mediaUrls[0];
        
        const icon = mediaType === 'video' ? 'video' : 'image';
        modalTitle.innerHTML = `<i class="fas fa-${icon}"></i> ${title}`;
        
        modalBody.innerHTML = '';
        
        mediaUrls.forEach(url => {
            if (mediaType === 'video') {
                const video = document.createElement('video');
                video.src = url;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.maxHeight = '400px';
                video.style.borderRadius = '0.5rem';
                video.style.border = '2px solid var(--border-color)';
                modalBody.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Generated image';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '400px';
                img.style.marginBottom = '1rem';
                img.style.borderRadius = '0.5rem';
                img.style.border = '2px solid var(--border-color)';
                modalBody.appendChild(img);
            }
        });
        
        modal.style.display = 'flex';
    }

    hideMediaModal() {
        document.getElementById('imageModal').style.display = 'none';
        this.currentMediaUrl = null;
        this.mediaType = null;
    }

    downloadMedia() {
        if (this.currentMediaUrl) {
            const link = document.createElement('a');
            link.href = this.currentMediaUrl;
            
            if (this.mediaType === 'video') {
                link.download = 'zamx-video.mp4';
            } else {
                link.download = 'zamx-image.jpg';
            }
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showAISwitchedMessage(aiName) {
        const messages = {
            gemini: "Halo! Saya Gemini AI, siap membantu Anda dengan berbagai pertanyaan dan tugas.",
            michelle: "Halo! Namaku Michelle. Senang bertemu dengan Anda! Ada yang bisa saya bantu hari ini?"
        };
        
        this.addMessage('bot', messages[aiName] || "Halo! Saya AI assistant, siap membantu Anda.");
    }

    showToolInstructions(toolName) {
        const instructions = {
            bingimg: "🎨 Masukkan prompt untuk generate gambar. Contoh: 'mobil sport merah di jalan kota'",
            videogen: "🎬 Masukkan prompt untuk generate video. Contoh: 'kucing lucu bermain bola'"
        };
        
        this.addMessage('bot', instructions[toolName] || `Silakan gunakan tool ${this.getToolDisplayName(toolName)}.`);
    }

    createNewConversation() {
        const conversationId = Date.now().toString();
        const conversation = {
            id: conversationId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date()
        };

        this.conversations.unshift(conversation);
        this.currentConversationId = conversationId;
        
        this.clearChatMessages();
        this.updateChatHistory();
        this.saveChatHistory();
        
        this.showAISwitchedMessage(this.currentAI);
    }

    clearChatMessages() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
    }

    updateChatHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        this.conversations.forEach(conversation => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            if (conversation.id === this.currentConversationId) {
                historyItem.classList.add('active');
            }

            historyItem.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${conversation.title}</div>
                <div style="font-size: 0.8rem; opacity: 0.7;">
                    ${this.formatDate(conversation.createdAt)}
                </div>
            `;

            historyItem.addEventListener('click', () => {
                this.loadConversation(conversation.id);
            });

            historyList.appendChild(historyItem);
        });
    }

    loadConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentConversationId = conversationId;
        this.clearChatMessages();

        conversation.messages.forEach(msg => {
            this.addMessage(msg.sender, msg.text, msg.file);
        });

        this.updateChatHistory();
        
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('show');
        }
    }

    saveChatHistory() {
        try {
            localStorage.setItem('Conversations', JSON.stringify(this.conversations));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('Conversations');
            if (saved) {
                this.conversations = JSON.parse(saved);
                this.updateChatHistory();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.conversations = [];
        }
    }

    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        }
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return new Date(date).toLocaleDateString();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    new zam-ai();
});