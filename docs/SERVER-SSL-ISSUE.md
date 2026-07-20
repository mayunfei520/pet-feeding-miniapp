# 真机小程序请求失败：根因 = 服务器使用自签名 SSL 证书

> 状态：**已于 2026-07-20 修复**。属**服务器/部署层**问题，小程序前端代码无需改动（baseURL 已正确指向 https://mayunfei.asia）。

## ✅ 已修复（2026-07-20）
经 SSH 巡检发现：**服务器 `/etc/letsencrypt/live/mayunfei.asia/` 早已有一张完整有效的 Let's Encrypt 证书**（ECDSA P-256，签发者 Let's Encrypt YE2，覆盖 `mayunfei.asia`+`www.mayunfei.asia`，有效期至 2026-09-27，私钥已验证与证书配对，certbot `snap.certbot.renew.timer` 自动续期已激活）。nginx 容器（pet-feeding-nginx）却一直挂载 `host-nginx/mayunfei.asia.pem`（自签名）未切过去。

用户另在 `/tmp` 放了两张 DigiCert 证书（`mayunfei_cert_1.pem`=服务器证书、`mayunfei_cert_2.pem`=中级 CA），CA 签发且覆盖域名，但**缺失对应私钥**（全机/本机均未找到 `.key`），nginx 配 TLS 必须证书+私钥配对，故当时无法直接用。

**实际操作（未新生成证书，直接复用已有 LE）：**
1. 备份自签名：`host-nginx/mayunfei.asia.pem/.key` → `.selfsigned.bak.20260720_085706`
2. 拷入 LE：`/etc/letsencrypt/live/mayunfei.asia/fullchain.pem` → `host-nginx/mayunfei.asia.pem`；`privkey.pem` → `host-nginx/mayunfei.asia.key`（bind 挂载即生效）
3. `docker exec pet-feeding-nginx nginx -t && nginx -s reload` → 容器内已生效 LE 证书
4. 本机严格校验（不加 `-k`）：`curl .../send-code` 返回 `HTTP:200` + 验证码，`openssl verify` 链 `Verification: OK / return code 0` ✅

**续期打通：** 新增 root crontab 每日 04:04 把 `/etc/letsencrypt/live/...` 最新证书同步进 `host-nginx/` 并 `nginx -s reload`，保证自动续期后 nginx 不回退到旧证。

**验收结果：** 真机/体验版 `wx.request` 现已可握手（用系统信任库，LE 受信任），"获取验证码失败"根因消除。仍需用户在微信后台登记 request 合法域名 `https://mayunfei.asia`（见下）。

> 备注：若日后想换回用户自己的 DigiCert 证书，需提供 `mayunfei_cert_1.pem` 对应的**私钥 `.key` 文件**，我再把 fullchain(1+2)+私钥拷入 host-nginx/ 并 reload 即可。

## 现象
- 微信开发者工具（urlCheck:false，本地跳过校验）与 `curl -k` 都能正常拿到接口返回。
- 真机/体验版小程序请求全部失败（如「获取验证码失败」「网络异常」）。

## 证据（2026-07-17 实测）
```
$ curl -s -m20 -w "HTTP:%{http_code}" ... https://mayunfei.asia/...   # 不加 -k
HTTP:000          # 严格校验下直接连接失败

$ openssl s_client -connect mayunfei.asia:443
subject=CN=mayunfei.asia, O=PetFeeding, C=CN
issuer =CN=mayunfei.asia, O=PetFeeding, C=CN   # subject==issuer => 自签名
verify error:num=18:self-signed certificate
```

## 根因
服务器（nginx，docker-compose 部署）当前用的是**自签名证书**（由 PetFeeding 自己签发，不在任何系统/微信信任的根证书库里）。

微信 `wx.request` 在真机上对 TLS 证书**零容忍**：
- 证书必须由受信任 CA 签发（如 Let's Encrypt、DigiCert、阿里云免费证书等）；
- 自签名证书 → 握手失败 → 请求直接 abort → 前端收到「网络异常/获取失败」。

开发者工具因为 `project.private.config.json` 里 `"urlCheck": false`（本地跳过校验）掩盖了这个坑，所以工具里一直正常。

> 注：就算证书修了，**微信公众平台后台的 request 合法域名**仍必须登记 `https://mayunfei.asia`，否则真机同样会被挡。两项缺一不可。

## 修复方案（归后端/运维执行，前端不碰服务器）
在部署机（101.42.24.114，容器 pet-feeding-backend / nginx）上把自签名证书换成受信任 CA 证书，推荐**免费 Let's Encrypt**：

1. 确认 80/443 端口对外开放、域名 mayunfei.asia 已解析到该服务器。
2. 在部署目录（/home/ubuntu/docker-deploy/pet-feeding-admin-docker）的 nginx 配置里：
   - 用 certbot 申请证书：`sudo certbot certonly --nginx -d mayunfei.asia`（或 `--webroot`）。
   - 把 `ssl_certificate` / `ssl_certificate_key` 指向 `/etc/letsencrypt/live/mayunfei.asia/fullchain.pem` 与 `privkey.pem`。
   - 重启 nginx 容器生效。
3. 证书 90 天有效期，建议加 `certbot renew` 定时任务自动续期。
4. （可选）若不想用 Let's Encrypt，也可在阿里云/腾讯云申请免费 DV 证书，下载 nginx 版替换。

## 验收
- `curl https://mayunfei.asia/api/miniapp/auth/send-code`（**不加 -k**）返回 200 + 验证码；
- 真机/体验版小程序「获取验证码」成功、自动填入；
- 微信后台 request 合法域名已含 https://mayunfei.asia。

## 责任边界
- 前端（本仓库）：无需改动。baseURL 已正确。
- 后端/运维：负责服务器证书替换与域名白名单登记。
