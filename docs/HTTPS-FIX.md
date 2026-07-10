# 小程序 HTTPS 修复指南

## 问题原因
- 微信后台已配置 `https://mayunfei.asia` 为合法域名
- 但服务器 `101.42.24.114:443` 端口未监听 HTTPS
- 结果：小程序体验版请求直接报 `ERR_CONNECTION_RESET`

## 方案一：Nginx + Let's Encrypt 自动 SSL（推荐，5 分钟搞定）

### 1. 在服务器执行以下命令

```bash
# 安装 certbot（以 Ubuntu 为例）
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 如果用的是 CentOS，用下面这个：
# sudo yum install -y certbot python3-certbot-nginx

# 获取证书并自动配置 nginx
sudo certbot --nginx -d mayunfei.asia

# 自动续期
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 2. 如果 certbot 没有自动改好 nginx 配置，手动添加这个 server 块

编辑 `/etc/nginx/sites-enabled/default` 或 `/etc/nginx/conf.d/default.conf`：

```nginx
server {
    listen 80;
    server_name mayunfei.asia;
    
    # 强制 HTTP 跳转 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name mayunfei.asia;

    # SSL 证书路径（certbot 会自动生成）
    ssl_certificate /etc/letsencrypt/live/mayunfei.asia/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mayunfei.asia/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    
    # 代理到后端 Spring Boot (8080)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

然后重启 nginx：
```bash
sudo nginx -t && sudo systemctl restart nginx
```

### 3. 验证 HTTPS 是否生效
```bash
curl -v https://mayunfei.asia/api/health
# 或者
# https://www.ssllabs.com/ssltest/analyze.html?d=mayunfei.asia
```

## 方案二：手动上传证书（如果你有已有证书）

如果你已购买或生成了证书，把两个文件放到服务器上，在 nginx 中指定路径即可：
```nginx
ssl_certificate /path/to/your/fullchain.pem;   # 或 .crt
ssl_certificate_key /path/to/your/privkey.pem;  # 或 .key
```

## 检查清单（修复后必做）

1. ✅ 浏览器访问 `https://mayunfei.asia` 能正常打开
2. ✅ `curl -v https://mayunfei.asia` 返回 200，不是 error 35
3. ✅ 微信开发者工具 → 刷新项目 → 测试登录接口
4. ✅ 如果改了 nginx 配置，确认 `/api/miniapp/auth/phone-login` 等 POST 接口也能正常响应

---

## 备选方案：如果无法配置 HTTPS，临时改成 HTTP 调试（不推荐长期使用）

打开 `utils/request.js`，修改 `PROD_BASE_URL` 为：
```js
const PROD_BASE_URL = 'http://101.42.24.114'
```

然后在微信公众平台 → 开发管理 → 服务器域名，把 `http://101.42.24.114` 也加到 request 合法域名。

⚠️ 注意：正式版小程序只支持 HTTPS，HTTP 仅限开发测试阶段。

## 下一步建议

1. 先在服务器执行 certbot 命令，获取证书
2. 如果过程中报错，把错误信息贴给我，我帮你排查
3. 修复后重新上传体验版，我帮你验证
