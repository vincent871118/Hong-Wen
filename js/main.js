document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Highlight Active Link
    const currentLocation = location.href;
    const menuItem = document.querySelectorAll('.nav-links a');
    const menuLength = menuItem.length;

    for (let i = 0; i < menuLength; i++) {
        if (menuItem[i].href === currentLocation) {
            menuItem[i].className = "active";
        }
    }

    // Article Management (Only for investing.html)
    const articleList = document.getElementById('article-list');
    const articleForm = document.getElementById('article-form');
    const toggleBtn = document.getElementById('toggle-form-btn');
    const formContainer = document.getElementById('article-form-container');
    const cancelBtn = document.getElementById('cancel-btn');
    const currentUserForArticles = JSON.parse(localStorage.getItem('current_user'));

    if (articleList) {
        // Load articles
        loadArticles();

        // Toggle Form (admin only)
        if (toggleBtn && formContainer) {
            if (!currentUserForArticles || currentUserForArticles.role !== 'admin') {
                toggleBtn.style.display = 'none';
                formContainer.style.display = 'none';
            } else {
                toggleBtn.addEventListener('click', () => {
                    formContainer.classList.add('active');
                    toggleBtn.style.display = 'none';
                });
            }
        }

        if (cancelBtn && formContainer) {
            cancelBtn.addEventListener('click', () => {
                formContainer.classList.remove('active');
                toggleBtn.style.display = 'block';
            });
        }

        // Add Article (admin only)
        if (articleForm) {
            articleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const currentUser = JSON.parse(localStorage.getItem('current_user'));
                if (!currentUser || currentUser.role !== 'admin') {
                    alert('僅限管理員新增文章');
                    return;
                }
                const title = document.getElementById('article-title').value;
                const date = document.getElementById('article-date').value;
                const content = document.getElementById('article-content').value;

                if (title && date && content) {
                    const isMemberOnly = document.getElementById('article-member-only').checked;
                    const newArticle = {
                        id: Date.now(),
                        title,
                        date,
                        content,
                        isMemberOnly
                    };

                    saveArticle(newArticle);
                    articleForm.reset();
                    formContainer.classList.remove('active');
                    toggleBtn.style.display = 'block';
                    loadArticles();
                }
            });
        }
    }

    function loadArticles() {
        const articles = JSON.parse(localStorage.getItem('my_articles')) || [];
        const articleList = document.getElementById('article-list');
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        
        if (articles.length === 0) {
            articleList.innerHTML = '<p style="text-align: center; color: #888; padding: 2rem;">目前尚無文章，歡迎新增第一篇見解。</p>';
            return;
        }

        // Sort by date desc
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = '';
        articles.forEach(article => {
            let contentHtml = '';
            let badgeHtml = '';
            let deleteHtml = '';

            if (article.isMemberOnly) {
                badgeHtml = '<span class="member-badge">會員限定</span>';
                
                if (currentUser) {
                    // Logged in: show content
                    contentHtml = `<div class="article-content">${escapeHtml(article.content)}</div>`;
                } else {
                    // Not logged in: show locked message
                    contentHtml = `
                        <div class="article-content locked-content">
                            ${escapeHtml(article.content.substring(0, 100))}...
                        </div>
                        <div class="lock-message">
                            <span class="lock-icon">🔒</span>
                            <p>此文章為會員限定內容</p>
                            <a href="login.html" class="btn" style="margin-top: 0.5rem; font-size: 0.8rem;">登入以閱讀全文</a>
                        </div>
                    `;
                }
            } else {
                // Public content
                contentHtml = `<div class="article-content">${escapeHtml(article.content)}</div>`;
            }

            if (currentUser && currentUser.role === 'admin') {
                deleteHtml = `<button class="delete-btn" onclick="deleteArticle(${article.id})">刪除</button>`;
            }

            html += `
                <div class="article-item">
                    <div class="article-header">
                        <div>
                            <h3 class="article-title" style="display:inline;">${escapeHtml(article.title)}</h3>
                            ${badgeHtml}
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span class="article-date">${article.date}</span>
                            ${deleteHtml}
                        </div>
                    </div>
                    ${contentHtml}
                </div>
            `;
        });

        articleList.innerHTML = html;
    }

    function saveArticle(article) {
        const articles = JSON.parse(localStorage.getItem('my_articles')) || [];
        articles.push(article);
        localStorage.setItem('my_articles', JSON.stringify(articles));
    }

    // Helper to prevent XSS
    function escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================
    // Auth Logic
    // ==========================================
    const loginForm = document.getElementById('login-form');
    // const registerForm = document.getElementById('register-form');
    // const showRegisterBtn = document.getElementById('show-register');
    // const showLoginBtn = document.getElementById('show-login');
    
    // Toggle Login/Register
    // if (showRegisterBtn) {
    //     showRegisterBtn.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         document.getElementById('login-container').style.display = 'none';
    //         document.getElementById('register-container').style.display = 'block';
    //     });
    // }

    // if (showLoginBtn) {
    //     showLoginBtn.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         document.getElementById('register-container').style.display = 'none';
    //         document.getElementById('login-container').style.display = 'block';
    //     });
    // }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('login-username').value;
            const passwordInput = document.getElementById('login-password').value;

            // Check admin
            if (usernameInput === 'admin' && passwordInput === 'admin') {
                loginUser({ username: 'admin', role: 'admin' });
                return;
            }

            // Check registered users
            const users = JSON.parse(localStorage.getItem('site_users')) || [];
            const user = users.find(u => u.username === usernameInput && u.password === passwordInput);

            if (user) {
                if (user.status === 'inactive') {
                    alert('此帳號已被停權，請聯繫管理員');
                    return;
                }
                loginUser(user);
            } else {
                alert('帳號或密碼錯誤');
            }
        });
    }

    // Handle Register
    // if (registerForm) {
    //     registerForm.addEventListener('submit', (e) => {
    //         e.preventDefault();
    //         const username = document.getElementById('reg-username').value;
    //         const password = document.getElementById('reg-password').value;
    //         const confirmPassword = document.getElementById('reg-confirm-password').value;

    //         if (password !== confirmPassword) {
    //             alert('兩次密碼輸入不一致');
    //             return;
    //         }

    //         const users = JSON.parse(localStorage.getItem('site_users')) || [];
    //         if (users.find(u => u.username === username)) {
    //             alert('該帳號已被註冊');
    //             return;
    //         }

    //         users.push({ username, password });
    //         localStorage.setItem('site_users', JSON.stringify(users));
    //         alert('註冊成功，請登入');
            
    //         // Switch to login
    //         document.getElementById('register-container').style.display = 'none';
    //         document.getElementById('login-container').style.display = 'block';
    //         registerForm.reset();
    //     });
    // }

    function loginUser(user) {
        localStorage.setItem('current_user', JSON.stringify(user));
        alert('登入成功！');
        window.location.href = 'index.html';
    }

    // Initialize Theme
    initTheme();

    // Init Booking System
    initBookingSystem();

    // Init CMS
    initCMS();

    // Init Live Edit
    initLiveEdit();

    // Update Nav with Auth Status
    updateNavAuth();
    injectFooterLinks();
    initPortfolioPie();
    updateFooterYear();

    function initCMS() {
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        const cmsDenied = document.getElementById('cms-access-denied');
        const cmsMain = document.getElementById('cms-main-container');
        const articleSelect = document.getElementById('article-select');
        const titleInput = document.getElementById('cms-title');
        const contentEditable = document.getElementById('cms-content-editable');
        const memberOnlyCheck = document.getElementById('cms-member-only');
        const saveBtn = document.getElementById('cms-save-btn');
        const previewBtn = document.getElementById('cms-preview-btn');
        const previewPane = document.getElementById('cms-preview-pane');
        const previewArea = document.getElementById('preview-render-area');
        const logsContainer = document.getElementById('operation-logs');
        const clearLogsBtn = document.getElementById('clear-logs-btn');
        const revisionList = document.getElementById('revision-list');

        if (!cmsMain) return;

        // RBAC check
        if (!currentUser || currentUser.role !== 'admin') {
            cmsDenied.style.display = 'block';
            cmsMain.style.display = 'none';
            return;
        }

        // Load articles into select
        function loadArticleSelect() {
            const articles = JSON.parse(localStorage.getItem('my_articles')) || [];
            articleSelect.innerHTML = '<option value="new">-- 新增文章 --</option>';
            articles.forEach(article => {
                const option = document.createElement('option');
                option.value = article.id;
                option.textContent = article.title;
                articleSelect.appendChild(option);
            });
        }
        loadArticleSelect();

        // Handle article selection
        articleSelect.addEventListener('change', (e) => {
            const articles = JSON.parse(localStorage.getItem('my_articles')) || [];
            const id = e.target.value;
            if (id === 'new') {
                titleInput.value = '';
                contentEditable.innerHTML = '';
                memberOnlyCheck.checked = false;
                revisionList.innerHTML = '<p style="color: #888;">選擇文章後查看歷史版本...</p>';
            } else {
                const article = articles.find(a => a.id == id);
                if (article) {
                    titleInput.value = article.title;
                    contentEditable.innerHTML = article.content;
                    memberOnlyCheck.checked = !!article.isMemberOnly;
                    loadRevisions(id);
                }
            }
        });

        // Save (with Revision and Logging)
        saveBtn.addEventListener('click', () => {
            const id = articleSelect.value;
            const title = titleInput.value;
            const content = contentEditable.innerHTML;
            const isMemberOnly = memberOnlyCheck.checked;
            const date = new Date().toISOString().split('T')[0];

            if (!title || !content) {
                alert('標題與內容不能為空');
                return;
            }

            // Security: Second Factor for sensitive action
            const pin = prompt('請輸入管理員二階段驗證碼 (預設: 8888):');
            if (pin !== '8888') {
                alert('驗證碼錯誤，操作已取消。');
                logOperation('SECURITY_ALERT', `嘗試非法發布文章: ${title}`);
                return;
            }

            const articles = JSON.parse(localStorage.getItem('my_articles')) || [];
            let articleId = id === 'new' ? Date.now() : Number(id);
            let action = id === 'new' ? 'CREATE' : 'UPDATE';

            // Version Control: Store old version if update
            if (action === 'UPDATE') {
                const oldArticle = articles.find(a => a.id === articleId);
                if (oldArticle) saveRevision(oldArticle);
            }

            const newArticle = {
                id: articleId,
                title,
                date,
                content,
                isMemberOnly,
                updatedBy: currentUser.username,
                lastModified: new Date().toISOString()
            };

            if (action === 'CREATE') {
                articles.push(newArticle);
            } else {
                const idx = articles.findIndex(a => a.id === articleId);
                articles[idx] = newArticle;
            }

            localStorage.setItem('my_articles', JSON.stringify(articles));
            logOperation(action, `文章: ${title} (${articleId})`);
            alert('文章已發布！');
            loadArticleSelect();
            articleSelect.value = articleId;
            loadRevisions(articleId);
            loadLogs();
        });

        // Live Preview
        previewBtn.addEventListener('click', () => {
            previewPane.style.display = 'block';
            previewArea.innerHTML = `
                <h3 style="margin-top:0;">${titleInput.value || '未命名文章'}</h3>
                <div style="font-size:0.85rem; color:#888; margin-bottom:1rem;">預覽日期: ${new Date().toLocaleDateString()}</div>
                <div class="article-content">${contentEditable.innerHTML}</div>
            `;
            previewArea.scrollIntoView({ behavior: 'smooth' });
        });

        // Revision functions
        function saveRevision(article) {
            const revisions = JSON.parse(localStorage.getItem('cms_revisions')) || [];
            revisions.push({
                ...article,
                revId: Date.now(),
                articleId: article.id,
                revAt: new Date().toISOString()
            });
            localStorage.setItem('cms_revisions', JSON.stringify(revisions));
        }

        function loadRevisions(articleId) {
            const revisions = JSON.parse(localStorage.getItem('cms_revisions')) || [];
            const articleRevisions = revisions.filter(r => r.articleId == articleId);
            if (articleRevisions.length === 0) {
                revisionList.innerHTML = '<p style="color: #888;">尚無歷史版本。</p>';
                return;
            }
            revisionList.innerHTML = articleRevisions.map(r => `
                <div class="log-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>
                        <span class="log-timestamp">${new Date(r.revAt).toLocaleString()}</span>
                        <strong>${r.title}</strong>
                    </span>
                    <button class="action-btn" onclick="restoreRevision(${r.revId})" style="padding:2px 8px; font-size:0.8rem;">還原</button>
                </div>
            `).join('');
        }

        window.restoreRevision = (revId) => {
            if (!confirm('確定要還原到此版本嗎？目前編輯內容將被覆蓋。')) return;
            const revisions = JSON.parse(localStorage.getItem('cms_revisions')) || [];
            const rev = revisions.find(r => r.revId === revId);
            if (rev) {
                titleInput.value = rev.title;
                contentEditable.innerHTML = rev.content;
                memberOnlyCheck.checked = !!rev.isMemberOnly;
                alert('已從歷史版本載入。');
            }
        };

        // Logging functions
        function logOperation(action, detail) {
            const logs = JSON.parse(localStorage.getItem('cms_logs')) || [];
            logs.unshift({
                id: Date.now(),
                user: currentUser.username,
                action,
                detail,
                timestamp: new Date().toISOString()
            });
            // Limit to 50 logs
            if (logs.length > 50) logs.pop();
            localStorage.setItem('cms_logs', JSON.stringify(logs));
        }

        function loadLogs() {
            const logs = JSON.parse(localStorage.getItem('cms_logs')) || [];
            if (logs.length === 0) {
                logsContainer.innerHTML = '<p style="color: #888;">尚無操作記錄。</p>';
                return;
            }
            logsContainer.innerHTML = logs.map(log => `
                <div class="log-item">
                    <span class="log-timestamp">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span class="log-user">${log.user}</span>
                    <span class="log-action"> — ${log.action}:</span>
                    <span class="log-detail">${log.detail}</span>
                </div>
            `).join('');
        }
        loadLogs();

        clearLogsBtn.onclick = () => {
            if (confirm('確定要清空所有操作日誌嗎？')) {
                localStorage.removeItem('cms_logs');
                loadLogs();
            }
        };

        // Page VCS Logic
        const pageSelect = document.getElementById('page-select');
        const pageRevList = document.getElementById('page-revision-list');
        if (pageSelect) {
            pageSelect.addEventListener('change', () => loadPageRevisions(pageSelect.value));
            loadPageRevisions(pageSelect.value);
        }

        function loadPageRevisions(path) {
            const revisions = JSON.parse(localStorage.getItem(`page_revisions_${path}`)) || [];
            if (revisions.length === 0) {
                pageRevList.innerHTML = '<p style="color: #888;">尚無歷史版本。</p>';
                return;
            }
            pageRevList.innerHTML = revisions.map(r => `
                <div class="log-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>
                        <span class="log-timestamp">${new Date(r.timestamp).toLocaleString()}</span>
                        <strong>${r.author}</strong> 發布
                    </span>
                    <button class="action-btn" onclick="restorePageRevision('${path}', ${r.id})" style="padding:2px 8px; font-size:0.8rem;">還原</button>
                </div>
            `).join('');
        }

        window.restorePageRevision = (path, revId) => {
            if (!confirm('確定要將該頁面還原到此版本嗎？目前正式環境內容將被覆蓋。')) return;
            const revisions = JSON.parse(localStorage.getItem(`page_revisions_${path}`)) || [];
            const rev = revisions.find(r => r.id === revId);
            if (rev) {
                localStorage.setItem(`page_content_${path}`, JSON.stringify(rev.content));
                alert('頁面已成功還原！重新載入頁面即可看到變更。');
                loadPageRevisions(path);
            }
        };
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        // Inject Toggle Button into Nav
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            // Create list item for the button
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'theme-toggle';
            btn.setAttribute('aria-label', '切換深色/淺色模式');
            btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
            btn.onclick = toggleTheme;
            
            li.appendChild(btn);
            navLinks.appendChild(li);
        }
    }

    function toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const btn = document.querySelector('.theme-toggle');
        if (btn) {
            btn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    function injectFooterLinks() {
        const footer = document.querySelector('footer');
        if (!footer) return;
        if (footer.querySelector('.footer-links')) return;
        const container = document.createElement('div');
        container.className = 'footer-links';
        container.innerHTML = `
            <a href="https://x.com/SNEK_Chang" target="_blank" rel="noopener">X</a>
            <span>·</span>
            <a href="https://www.linkedin.com/in/鴻文-張-674429211/" target="_blank" rel="noopener">LinkedIn</a>
            <span>·</span>
            <a href="https://github.com/Vincent-Chang-Designer" target="_blank" rel="noopener">GitHub</a>
            <span>·</span>
            <a href="https://medium.com/@vincent.1118.1998" target="_blank" rel="noopener">Medium</a>
            <span>·</span>
            <a href="mailto:vincent.1118.1998@gmail.com">Email</a>
            <span>·</span>
            <a href="tel:0905938665">Phone</a>
            <span>·</span>
            <a href="https://www.google.com/maps/search/?api=1&query=%E8%87%BA%E4%B8%AD%E5%B8%82" target="_blank" rel="noopener">Location: Taichung, Taiwan</a>
        `;
        footer.appendChild(container);
    }

    function updateFooterYear() {
        const year = new Date().getFullYear();
        document.querySelectorAll('footer p').forEach(p => {
            p.textContent = p.textContent.replace(/\d{4}/, String(year));
        });
    }

    // ==========================================
    // Live Page Edit System
    // ==========================================
    function initLiveEdit() {
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        if (!currentUser || currentUser.role !== 'admin') return;

        // Load existing page content overrides
        const pagePath = window.location.pathname.split('/').pop() || 'index.html';
        const pageOverrides = JSON.parse(localStorage.getItem(`page_content_${pagePath}`)) || {};
        
        // Apply overrides immediately
        Object.keys(pageOverrides).forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                if (el.tagName === 'IMG') el.src = pageOverrides[selector];
                else el.innerHTML = pageOverrides[selector];
            }
        });

        // Inject Live Edit Toggle
        const overlay = document.createElement('div');
        overlay.className = 'live-edit-overlay';
        overlay.innerHTML = `
            <div class="live-edit-status">LIVE EDIT: OFF</div>
            <button class="live-edit-btn" id="live-edit-toggle">開啟編輯模式</button>
            <div id="live-edit-controls" style="display:none; flex-direction:column; gap:0.5rem;">
                <button class="live-edit-btn" id="live-edit-save" style="background:#28a745; color:white;">發布變更</button>
                <button class="live-edit-btn cancel" id="live-edit-cancel">結束並捨棄</button>
            </div>
        `;
        document.body.appendChild(overlay);

        const toggleBtn = document.getElementById('live-edit-toggle');
        const controls = document.getElementById('live-edit-controls');
        const saveBtn = document.getElementById('live-edit-save');
        const cancelBtn = document.getElementById('live-edit-cancel');
        const statusText = overlay.querySelector('.live-edit-status');

        let isEditing = false;
        let autoSaveTimer = null;

        toggleBtn.onclick = () => {
            isEditing = !isEditing;
            if (isEditing) {
                enterEditMode();
            } else {
                exitEditMode();
            }
        };

        function enterEditMode() {
            document.body.classList.add('live-edit-active');
            statusText.textContent = 'LIVE EDIT: ON (已自動存檔)';
            toggleBtn.style.display = 'none';
            controls.style.display = 'flex';
            
            // Make text elements editable
            document.querySelectorAll('h1, h2, h3, p, .bio, .card p, .card h3').forEach(el => {
                el.contentEditable = 'true';
                el.dataset.selector = getUniqueSelector(el);
            });

            // Make images clickable for change
            document.querySelectorAll('img').forEach(img => {
                img.onclick = () => {
                    const newUrl = prompt('請輸入新圖片網址:', img.src);
                    if (newUrl && newUrl !== img.src) {
                        img.src = newUrl;
                        img.dataset.changed = 'true';
                        img.dataset.selector = getUniqueSelector(img);
                    }
                };
            });

            // Start Auto-save
            autoSaveTimer = setInterval(autoSave, 5000);
        }

        function exitEditMode() {
            document.body.classList.remove('live-edit-active');
            statusText.textContent = 'LIVE EDIT: OFF';
            toggleBtn.style.display = 'block';
            controls.style.display = 'none';
            clearInterval(autoSaveTimer);
            
            document.querySelectorAll('[contenteditable="true"]').forEach(el => {
                el.contentEditable = 'false';
            });
            
            document.querySelectorAll('img').forEach(img => {
                img.onclick = null;
            });
        }

        function autoSave() {
            const draft = {};
            document.querySelectorAll('[contenteditable="true"]').forEach(el => {
                const selector = el.dataset.selector;
                if (selector) draft[selector] = el.innerHTML;
            });
            document.querySelectorAll('img[data-changed="true"]').forEach(img => {
                const selector = img.dataset.selector;
                if (selector) draft[selector] = img.src;
            });
            localStorage.setItem(`page_draft_${pagePath}`, JSON.stringify(draft));
            statusText.textContent = `LIVE EDIT: ON (自動存檔於 ${new Date().toLocaleTimeString()})`;
        }

        saveBtn.onclick = () => {
            const pin = prompt('請輸入管理員二階段驗證碼 (預設: 8888):');
            if (pin !== '8888') {
                alert('驗證碼錯誤');
                return;
            }

            const draft = JSON.parse(localStorage.getItem(`page_draft_${pagePath}`)) || {};
            const production = JSON.parse(localStorage.getItem(`page_content_${pagePath}`)) || {};
            
            // Merge draft into production
            const finalContent = { ...production, ...draft };
            localStorage.setItem(`page_content_${pagePath}`, JSON.stringify(finalContent));
            
            // Save Revision for VCS
            const revisions = JSON.parse(localStorage.getItem(`page_revisions_${pagePath}`)) || [];
            revisions.unshift({
                id: Date.now(),
                content: finalContent,
                timestamp: new Date().toISOString(),
                author: currentUser.username
            });
            localStorage.setItem(`page_revisions_${pagePath}`, JSON.stringify(revisions.slice(0, 10))); // Keep last 10

            alert('變更已成功發布至正式環境！');
            exitEditMode();
            location.reload();
        };

        cancelBtn.onclick = () => {
            if (confirm('確定要結束編輯並捨棄未發布的變更嗎？')) {
                localStorage.removeItem(`page_draft_${pagePath}`);
                exitEditMode();
                location.reload();
            }
        };

        function getUniqueSelector(el) {
            if (el.id) return `#${el.id}`;
            let selector = el.tagName.toLowerCase();
            const siblings = Array.from(el.parentNode.childNodes).filter(node => node.nodeType === 1);
            if (siblings.length > 1) {
                const index = siblings.indexOf(el) + 1;
                selector += `:nth-child(${index})`;
            }
            // Add parent context to ensure uniqueness
            if (el.parentNode && el.parentNode !== document.body) {
                selector = getUniqueSelector(el.parentNode) + ' > ' + selector;
            }
            return selector;
        }
    }

    function initPortfolioPie() {
        const container = document.getElementById('portfolio-pie');
        if (!container) return;
        const data = window.getPortfolioData ? window.getPortfolioData() : [];
        const size = 320;
        const r = 140;
        const cx = size / 2;
        const cy = size / 2;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.style.background = 'var(--white)';
        svg.style.borderRadius = '8px';
        let startAngle = -Math.PI / 2;
        const total = data.reduce((a, b) => a + b.value, 0);
        const tooltip = document.getElementById('pie-tooltip');
        data.forEach(d => {
            const angle = (d.value / total) * Math.PI * 2;
            const endAngle = startAngle + angle;
            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);
            const largeArc = angle > Math.PI ? 1 : 0;
            const pathData = [
                `M ${cx} ${cy}`,
                `L ${x1} ${y1}`,
                `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', d.color);
            path.style.cursor = 'pointer';
            path.addEventListener('mousemove', (e) => {
                if (!tooltip) return;
                tooltip.style.display = 'block';
                tooltip.textContent = `${d.label}：${d.value}% — 特色：${d.feature}`;
                tooltip.style.left = `${e.pageX + 12}px`;
                tooltip.style.top = `${e.pageY + 12}px`;
                highlightLegend(d.label);
            });
            path.addEventListener('mouseleave', () => {
                if (tooltip) tooltip.style.display = 'none';
                clearLegendHighlight();
            });
            svg.appendChild(path);
            startAngle = endAngle;
        });
        const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        centerCircle.setAttribute('cx', cx);
        centerCircle.setAttribute('cy', cy);
        centerCircle.setAttribute('r', 60);
        centerCircle.setAttribute('fill', 'var(--light-bg)');
        svg.appendChild(centerCircle);
        container.appendChild(svg);

        const legend = document.getElementById('pie-legend');
        if (legend) {
            const itemsHtml = data.map(d => `
                <div class="legend-item" data-label="${d.label}" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; border-radius: 6px; padding: 4px 6px;">
                    <div style="display:flex; align-items:center;">
                        <span style="display:inline-block; width:12px; height:12px; border-radius:2px; background:${d.color}; margin-right:8px;"></span>
                        <span>${d.label}</span>
                    </div>
                    <span class="legend-value">${d.value}%</span>
                </div>
            `).join('');
            legend.innerHTML = `
                <h3 style="margin-top: 0; font-size: 1rem; color: var(--accent-color);">資產配置說明</h3>
                ${itemsHtml}
            `;
        }
        function highlightLegend(label) {
            const items = document.querySelectorAll('#pie-legend .legend-item');
            items.forEach(el => {
                el.style.background = '';
                el.style.color = '';
                el.style.fontWeight = '';
            });
            const target = document.querySelector(`#pie-legend .legend-item[data-label="${CSS.escape(label)}"]`);
            if (target) {
                target.style.background = 'var(--light-bg)';
                target.style.color = 'var(--accent-color)';
                target.style.fontWeight = '600';
            }
        }
        function clearLegendHighlight() {
            const items = document.querySelectorAll('#pie-legend .legend-item');
            items.forEach(el => {
                el.style.background = '';
                el.style.color = '';
                el.style.fontWeight = '';
            });
        }
    }

    function updateNavAuth() {
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        const navLinks = document.querySelector('.nav-links');

        if (!navLinks) return;

        // Remove existing links
        ['nav-auth-link', 'nav-admin-link', 'nav-portfolio-link', 'nav-booking-admin-link', 'nav-cms-link'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        if (currentUser) {
            // Add Admin Links if admin
            if (currentUser.role === 'admin') {
                const adminLinks = [
                    { id: 'nav-admin-link', href: 'admin.html', text: '會員管理', color: '#dc3545' },
                    { id: 'nav-cms-link', href: 'cms.html', text: 'CMS 內容管理', color: '#007bff' },
                    { id: 'nav-portfolio-link', href: 'portfolio-admin.html', text: '投資管理', color: 'var(--accent-color)' },
                    { id: 'nav-booking-admin-link', href: 'booking-admin.html', text: '預約管理', color: 'var(--accent-color)' }
                ];
                
                adminLinks.forEach(link => {
                    const li = document.createElement('li');
                    li.id = link.id;
                    li.innerHTML = `<a href="${link.href}" style="color: ${link.color};">${link.text}</a>`;
                    navLinks.appendChild(li);
                });
            }

            const logoutLi = document.createElement('li');
            logoutLi.id = 'nav-auth-link';
            logoutLi.innerHTML = `<a href="#" id="logout-btn" style="color: var(--accent-color);">登出 (${currentUser.username})</a>`;
            navLinks.appendChild(logoutLi);

            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                if(confirm('確定要登出嗎？')) {
                    localStorage.removeItem('current_user');
                    window.location.href = 'index.html';
                }
            });
        } else {
            const loginLi = document.createElement('li');
            loginLi.id = 'nav-auth-link';
            loginLi.innerHTML = `<a href="login.html">會員登入</a>`;
            navLinks.appendChild(loginLi);
        }
    }

    // Booking System Logic
    function initBookingSystem() {
        const bookingForm = document.getElementById('booking-form-real');
        const dateInput = document.getElementById('booking-date');
        
        if (bookingForm && dateInput) {
            // Set min date to today
            dateInput.min = new Date().toISOString().split('T')[0];
            
            dateInput.addEventListener('change', (e) => {
                generateTimeSlots(e.target.value);
            });
            
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const timeInput = document.getElementById('booking-time');
                if (!timeInput.value) {
                    document.getElementById('time-error').style.display = 'block';
                    return;
                }
                
                const formData = {
                    id: Date.now(),
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    date: dateInput.value,
                    time: timeInput.value,
                    type: document.getElementById('type').value,
                    message: document.getElementById('message').value,
                    status: 'pending', // pending, confirmed, rejected
                    createdAt: new Date().toISOString()
                };
                
                saveBooking(formData);
            });
        }
    }

    function generateTimeSlots(date) {
        const container = document.getElementById('time-slots-container');
        const timeInput = document.getElementById('booking-time');
        const errorMsg = document.getElementById('time-error');
        
        container.innerHTML = '';
        timeInput.value = '';
        errorMsg.style.display = 'none';
        
        // Define slots
        const slots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
        
        // Get existing bookings
        const bookings = JSON.parse(localStorage.getItem('site_bookings')) || [];
        const bookedSlots = bookings
            .filter(b => b.date === date && b.status !== 'rejected' && b.status !== 'cancelled')
            .map(b => b.time);
            
        slots.forEach(time => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = time;
            btn.style.cssText = `
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #fff;
                cursor: pointer;
                transition: all 0.2s;
            `;
            
            if (bookedSlots.includes(time)) {
                btn.disabled = true;
                btn.style.background = '#e9ecef';
                btn.style.color = '#adb5bd';
                btn.style.cursor = 'not-allowed';
                btn.title = '已被預約';
            } else {
                btn.onclick = () => {
                    // Reset other buttons
                    container.querySelectorAll('button').forEach(b => {
                        if (!b.disabled) {
                            b.style.background = '#fff';
                            b.style.borderColor = '#ddd';
                            b.style.color = '#333';
                        }
                    });
                    
                    // Select this one
                    btn.style.background = 'var(--accent-color)';
                    btn.style.borderColor = 'var(--accent-color)';
                    btn.style.color = '#fff';
                    timeInput.value = time;
                    errorMsg.style.display = 'none';
                };
            }
            
            container.appendChild(btn);
        });
    }

    function saveBooking(booking) {
        const bookings = JSON.parse(localStorage.getItem('site_bookings')) || [];
        bookings.push(booking);
        localStorage.setItem('site_bookings', JSON.stringify(bookings));
        const subject = encodeURIComponent(`預約請求：${booking.date} ${booking.time}`);
        const body = encodeURIComponent(
            `姓名：${booking.name}\nEmail：${booking.email}\n日期：${booking.date}\n時段：${booking.time}\n類型：${booking.type}\n備註：${booking.message}\n建立時間：${new Date(booking.createdAt).toLocaleString()}`
        );
        const mailto = `mailto:vincent.1118.1998@gmail.com?subject=${subject}&body=${body}`;
        alert('預約請求已送出！已建立寄送至 vincent.1118.1998@gmail.com 的郵件草稿，請確認寄出。');
        window.location.href = mailto;
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
    }
});

// Global function for delete (needs to be attached to window)
window.deleteArticle = function(id) {
    if (confirm('確定要刪除這篇文章嗎？')) {
        const articles = JSON.parse(localStorage.getItem('my_articles')) || [];
        const newArticles = articles.filter(a => a.id !== id);
        localStorage.setItem('my_articles', JSON.stringify(newArticles));
        location.reload();
    }
};

// ==========================================
// Admin Functions (Global)
// ==========================================
window.getPortfolioData = function() {
    const saved = JSON.parse(localStorage.getItem('portfolio_data') || 'null');
    const defaults = [
        { label: 'BTC', value: 50, color: '#6f42c1', feature: '比特幣：主鏈、減半週期、長期配置' },
        { label: 'Real estate', value: 25, color: '#27ae60', feature: '不動產：REITs、房地產基金' },
        { label: 'Stocks', value: 15, color: '#2c7be5', feature: '股票：大型成長股、價值股、ETF' },
        { label: 'Bonds', value: 5, color: '#ffc107', feature: '債券：政府債、投資等級、公司債' }
    ];
    if (!Array.isArray(saved) || saved.length === 0) return defaults;
    return saved.map((d, i) => ({
        label: d.label || defaults[i % defaults.length].label,
        value: Number(d.value) || 0,
        color: d.color || defaults[i % defaults.length].color,
        feature: d.feature || ''
    }));
};
window.loadMembers = function() {
    const users = JSON.parse(localStorage.getItem('site_users')) || []; // Note: using 'site_users' key as per previous register logic
    const tbody = document.getElementById('member-list-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        const statusClass = user.status === 'inactive' ? 'status-inactive' : 'status-active';
        const statusText = user.status === 'inactive' ? '停權' : '正常';
        const toggleBtnText = user.status === 'inactive' ? '啟用' : '停權';
        const toggleBtnColor = user.status === 'inactive' ? '#28a745' : '#ffc107';
        
        // Handle date (some might not have createdAt if old data)
        const dateStr = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

        tr.innerHTML = `
            <td>${escapeHtml(user.username)}</td>
            <td>${dateStr}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn" style="background-color: ${toggleBtnColor}; color: #333;" onclick="toggleMemberStatus(${user.id})">${toggleBtnText}</button>
                <button class="action-btn btn-delete" onclick="deleteMember(${user.id})">刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.loadAdminPortfolio = function() {
    const tbody = document.getElementById('portfolio-list-body');
    if (!tbody) return;
    const data = getPortfolioData();
    tbody.innerHTML = '';
    data.forEach((d, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${escapeHtml(d.label)}" style="width: 100%;"></td>
            <td><input type="number" value="${d.value}" min="0" max="100" step="1" style="width: 100%;"></td>
            <td><input type="color" value="${d.color}" style="width: 60px; height: 32px;"></td>
            <td><input type="text" value="${escapeHtml(d.feature || '')}" style="width: 100%;"></td>
            <td><button class="action-btn btn-delete" onclick="deletePortfolioRow(${idx})">刪除</button></td>
        `;
        tbody.appendChild(tr);
    });
};

window.setupPortfolioAdmin = function() {
    const addBtn = document.getElementById('portfolio-admin-add');
    const saveBtn = document.getElementById('portfolio-admin-save');
    const resetBtn = document.getElementById('portfolio-admin-reset');
    if (addBtn) addBtn.addEventListener('click', addPortfolioRow);
    if (saveBtn) saveBtn.addEventListener('click', saveAdminPortfolio);
    if (resetBtn) resetBtn.addEventListener('click', resetAdminPortfolio);
};

window.addPortfolioRow = function() {
    const tbody = document.getElementById('portfolio-list-body');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" value="" style="width: 100%;"></td>
        <td><input type="number" value="0" min="0" max="100" step="1" style="width: 100%;"></td>
        <td><input type="color" value="#888888" style="width: 60px; height: 32px;"></td>
        <td><input type="text" value="" style="width: 100%;"></td>
        <td><button class="action-btn btn-delete" onclick="deletePortfolioRow(-1)">刪除</button></td>
    `;
    tbody.appendChild(tr);
};

window.deletePortfolioRow = function(index) {
    const tbody = document.getElementById('portfolio-list-body');
    if (!tbody) return;
    if (index >= 0) {
        tbody.removeChild(tbody.children[index]);
    } else {
        const last = tbody.lastElementChild;
        if (last) tbody.removeChild(last);
    }
};

window.saveAdminPortfolio = function() {
    const tbody = document.getElementById('portfolio-list-body');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const data = rows.map(tr => {
        const inputs = tr.querySelectorAll('input');
        return {
            label: inputs[0].value.trim(),
            value: Number(inputs[1].value),
            color: inputs[2].value,
            feature: inputs[3].value.trim()
        };
    }).filter(d => d.label);
    const total = data.reduce((s, d) => s + (isNaN(d.value) ? 0 : d.value), 0);
    if (total !== 100) {
        alert('比例總和需為 100，目前為 ' + total);
        return;
    }
    localStorage.setItem('portfolio_data', JSON.stringify(data));
    alert('投資組合已儲存');
};

window.resetAdminPortfolio = function() {
    localStorage.removeItem('portfolio_data');
    loadAdminPortfolio();
    alert('已重設為預設配置');
};
window.setupAdminForm = function() {
    const form = document.getElementById('add-member-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('new-username').value;
            const password = document.getElementById('new-password').value;
            
            if (!username || !password) return;

            const users = JSON.parse(localStorage.getItem('site_users')) || [];
            if (users.find(u => u.username === username)) {
                alert('帳號已存在');
                return;
            }

            users.push({
                id: Date.now(),
                username,
                password,
                role: 'member',
                status: 'active',
                createdAt: new Date().toISOString()
            });

            localStorage.setItem('site_users', JSON.stringify(users));
            alert('會員新增成功');
            form.reset();
            loadMembers();
        });
    }
};

window.toggleMemberStatus = function(userId) {
    const users = JSON.parse(localStorage.getItem('site_users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].status = users[userIndex].status === 'inactive' ? 'active' : 'inactive';
        localStorage.setItem('site_users', JSON.stringify(users));
        loadMembers();
    }
};

window.deleteMember = function(userId) {
    if (confirm('確定要刪除此會員嗎？此動作無法復原。')) {
        let users = JSON.parse(localStorage.getItem('site_users')) || [];
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('site_users', JSON.stringify(users));
        loadMembers();
    }
};

// Admin Booking Functions
window.loadAdminBookings = function() {
    const bookings = JSON.parse(localStorage.getItem('site_bookings')) || [];
    const tbody = document.getElementById('booking-list-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort by date desc
    bookings.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">目前無預約資料</td></tr>';
        return;
    }
    
    bookings.forEach(b => {
        const tr = document.createElement('tr');
        
        let statusClass = '';
        let statusText = '';
        switch(b.status) {
            case 'pending': statusClass = 'status-inactive'; statusText = '待確認'; break; // Reusing inactive style (reddish) for pending? Maybe yellow.
            case 'confirmed': statusClass = 'status-active'; statusText = '已確認'; break;
            case 'rejected': statusClass = 'status-inactive'; statusText = '已拒絕'; break;
        }
        
        // Custom color for pending
        const statusStyle = b.status === 'pending' ? 'background-color: #fff3cd; color: #856404;' : '';
        
        tr.innerHTML = `
            <td>
                <div>${b.date}</div>
                <div style="font-size: 0.85rem; color: #666;">${b.time}</div>
            </td>
            <td>
                <div>${escapeHtml(b.name)}</div>
                <div style="font-size: 0.85rem; color: #666;">${escapeHtml(b.email)}</div>
            </td>
            <td>${b.type}</td>
            <td><span class="status-badge ${statusClass}" style="${statusStyle}">${statusText}</span></td>
            <td>
                ${b.status === 'pending' ? `
                <button class="action-btn" style="background-color: #28a745; color: white;" onclick="updateBookingStatus(${b.id}, 'confirmed')">確認</button>
                <button class="action-btn" style="background-color: #dc3545; color: white;" onclick="updateBookingStatus(${b.id}, 'rejected')">拒絕</button>
                ` : ''}
                <button class="action-btn btn-delete" onclick="deleteBooking(${b.id})">刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.updateBookingStatus = function(id, status) {
    const bookings = JSON.parse(localStorage.getItem('site_bookings')) || [];
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
        bookings[idx].status = status;
        localStorage.setItem('site_bookings', JSON.stringify(bookings));
        loadAdminBookings();
    }
};

window.deleteBooking = function(id) {
    if(confirm('確定要刪除此預約紀錄嗎？')) {
        let bookings = JSON.parse(localStorage.getItem('site_bookings')) || [];
        bookings = bookings.filter(b => b.id !== id);
        localStorage.setItem('site_bookings', JSON.stringify(bookings));
        loadAdminBookings();
    }
};

// Helper for escaping HTML in admin functions (re-declared or reused if exposed, but let's just use a simple internal one or ensure the one in DOMContentLoaded is not needed here if we inject HTML carefully. 
// Actually, escapeHtml is inside the DOMContentLoaded scope. We need a global one or duplicate it.
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
