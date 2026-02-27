# 心理测试平台 — Linux 部署指南

本指南详细说明如何在 Linux 服务器（Ubuntu 22.04/24.04, Debian 12, CentOS Stream 9）上部署心理测试平台。

> ⚠️ 文档中所有 `<尖括号>` 包裹的内容都需要替换为你自己的实际值。

---

## 一、系统要求

| 软件 | 最低版本 | 安装方式 | 说明 |
|------|---------|---------|------|
| Node.js | 20.9+ | `nvm install 20` 或 [官方安装](https://nodejs.org/) | Next.js 16 硬性要求 |
| npm | 10+ | 随 Node.js 自带 | |
| Nginx | 1.18+ | `sudo apt install nginx` | 反向代理 + 静态资源缓存 |
| certbot | 最新 | `sudo snap install --classic certbot` | 免费 SSL 证书 |
| SQLite3 | 3.x | `sudo apt install libsqlite3-dev` | better-sqlite3 编译需要 |
| 编译工具 | - | `sudo apt install python3 make g++` | better-sqlite3 是 C++ 原生模块 |

---

## 二、快速开始（5 步）

```bash
# ① 克隆项目到服务器
#    把 <your-repo-url> 替换为你的 Git 仓库地址
git clone <your-repo-url> /var/www/xinli-test
cd /var/www/xinli-test/unified-test-app

# ② 安装依赖（包含开发依赖，构建需要）
npm ci

# ③ 配置环境变量（⚠️ 重要！必须先配置再构建）
cp .env.example .env
#    用编辑器打开 .env，按照下面「三、环境变量详细说明」逐项填写
nano .env

# ④ 创建数据目录（存放 SQLite 数据库）
mkdir -p data
chown www-data:www-data data

# ⑤ 构建并启动
npm run build
npm run start
```

启动后访问 `http://<你的服务器IP>:3000` 验证是否正常。

---

## 三、环境变量详细说明

打开 `.env` 文件，按以下说明逐项填写：

### 3.1 基础配置

```bash
# 支付模式
#   sandbox  = 沙盒模式，点击「模拟支付成功」即可跳过真实支付，用于开发测试
#   production = 生产模式，走真实微信/支付宝支付流程
# 👉 首次部署建议先用 sandbox 跑通流程，确认无误后再改为 production
PAYMENT_MODE=sandbox

# 服务端口（Nginx 会代理到这个端口）
# 👉 如果 3000 被占用，改成其他端口（如 3001），同时修改 Nginx 配置中的 upstream 端口
PORT=3000

# SQLite 数据库文件路径
# 👉 一般不需要改，默认存在项目根目录的 data/ 文件夹下
DB_PATH=./data/payments.db
```

### 3.2 测试价格

```bash
# 单位：分（1元 = 100分）
# 👉 999 = ¥9.99，1999 = ¥19.99
# 👉 修改价格后需要重新构建：npm run build
PRICE_MBTI=999
PRICE_IQ=1999
PRICE_CAREER=999
```

### 3.3 微信支付配置

> 获取方式：登录 [微信支付商户平台](https://pay.weixin.qq.com/) → 账户中心 → API安全
>
> ⚠️ 需要已认证的企业微信支付商户号。个人无法申请。

```bash
# 微信公众号/小程序的 AppID
# 👉 在微信公众平台 (mp.weixin.qq.com) → 开发 → 基本配置 中获取
# 👉 格式示例：wx1234567890abcdef
WECHAT_APP_ID=<你的微信AppID>

# 微信支付商户号
# 👉 在微信支付商户平台 (pay.weixin.qq.com) → 账户中心 → 商户信息 中获取
# 👉 格式示例：1234567890
WECHAT_MCH_ID=<你的商户号>

# API 密钥（V2）
# 👉 商户平台 → 账户中心 → API安全 → 设置APIv2密钥
# 👉 32位字符串，自己设置的
WECHAT_API_KEY=<你设置的32位API密钥>

# API V3 密钥
# 👉 商户平台 → 账户中心 → API安全 → 设置APIv3密钥
# 👉 32位字符串，自己设置的
WECHAT_API_V3_KEY=<你设置的32位APIv3密钥>

# 商户API证书序列号
# 👉 商户平台 → 账户中心 → API安全 → 申请API证书 → 查看证书序列号
# 👉 格式示例：1234567890ABCDEF1234567890ABCDEF12345678
WECHAT_SERIAL_NO=<你的证书序列号>

# 商户API私钥（PEM 格式的内容，不是文件路径）
# 👉 申请API证书时下载的 apiclient_key.pem 文件内容
# 👉 把整个文件内容粘贴在这里（包括 BEGIN/END 行），或者用 \n 连接成一行
WECHAT_PRIVATE_KEY=<apiclient_key.pem的完整内容>

# 支付结果异步通知地址
# 👉 ⚠️ 必须替换 your-domain.com 为你的实际域名
# 👉 ⚠️ 必须是 HTTPS 地址，且公网可访问
# 👉 微信支付会在用户付款成功后，主动请求这个地址通知你
WECHAT_NOTIFY_URL=https://<你的域名>/api/payment/callback/wechat
```

### 3.4 支付宝配置

> 获取方式：登录 [支付宝开放平台](https://open.alipay.com/) → 开发设置
>
> ⚠️ 需要已认证的企业支付宝开发者账号。

```bash
# 支付宝应用 AppID
# 👉 在支付宝开放平台 → 我的应用 → 应用详情 中获取
# 👉 格式示例：2021001234567890
ALIPAY_APP_ID=<你的支付宝AppID>

# 应用私钥（RSA2 格式）
# 👉 在支付宝开放平台 → 开发设置 → 接口加签方式 中生成/上传
# 👉 使用支付宝提供的「密钥生成工具」生成 RSA2(SHA256) 密钥对
# 👉 把「应用私钥」的完整内容粘贴在这里
ALIPAY_PRIVATE_KEY=<你的应用私钥>

# 支付宝公钥（不是你的应用公钥！）
# 👉 上传应用公钥后，支付宝会返回一个「支付宝公钥」，用于验签
# 👉 在支付宝开放平台 → 开发设置 → 接口加签方式 → 查看支付宝公钥
ALIPAY_PUBLIC_KEY=<支付宝返回的公钥>

# 支付结果异步通知地址
# 👉 ⚠️ 必须替换为你的实际域名，必须 HTTPS，公网可访问
ALIPAY_NOTIFY_URL=https://<你的域名>/api/payment/callback/alipay

# 支付完成后的前端跳转地址
# 👉 ⚠️ 替换为你的实际域名
# 👉 用户在支付宝付款成功后，浏览器会跳转到这个页面
ALIPAY_RETURN_URL=https://<你的域名>/payment
```

### 3.5 邮件服务（Resend）

> 获取方式：注册 [Resend](https://resend.com/) → API Keys → Create API Key
>
> 免费额度：每月 3000 封，每天 100 封。

```bash
# Resend API Key
# 👉 在 resend.com → API Keys 页面创建
# 👉 格式示例：re_1234567890abcdefg
# 👉 如果暂时不需要邮件功能，留空即可（发送邮件时会返回「邮件服务未配置」）
RESEND_API_KEY=<你的Resend API Key>

# 发件人邮箱地址
# 👉 ⚠️ 替换为你的实际域名
# 👉 需要先在 Resend 后台验证你的域名（Resend → Domains → Add Domain）
# 👉 如果还没验证域名，可以用 Resend 提供的测试地址：onboarding@resend.dev
RESEND_FROM_EMAIL=noreply@<你的域名>
```

---

## 四、Nginx 反向代理配置

创建配置文件：

```bash
sudo nano /etc/nginx/sites-available/xinli-test
```

粘贴以下内容（⚠️ 有 3 处需要替换）：

```nginx
upstream next_app {
    server 127.0.0.1:3000;    # ← 如果你改了 PORT，这里也要改成一样的端口
    keepalive 32;
}

server {
    listen 80;
    server_name <你的域名>;   # ← ⚠️ 替换！例如：xinli-test.com 或 test.example.com

    client_max_body_size 10m;  # PDF 上传/下载需要

    # 所有请求代理到 Next.js
    location / {
        proxy_pass http://next_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js 静态资源 — 长期缓存（文件名含 hash，内容变了 hash 也变）
    location /_next/static/ {
        proxy_pass http://next_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

启用配置并重启：

```bash
# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/xinli-test /etc/nginx/sites-enabled/

# 检查配置语法是否正确
sudo nginx -t

# 重启 Nginx
sudo systemctl reload nginx
```

---

## 五、systemd 服务配置（开机自启 + 自动重启）

创建服务文件：

```bash
sudo nano /etc/systemd/system/xinli-test.service
```

粘贴以下内容（⚠️ 有 1 处可能需要修改）：

```ini
[Unit]
Description=Xinli Test Platform (心理测试平台)
After=network.target

[Service]
Type=simple
User=www-data                                              # ← 运行用户，确保该用户对项目目录有读写权限
WorkingDirectory=/var/www/xinli-test/       # ← 如果你的项目路径不同，改这里
Environment=NODE_ENV=production
Environment=PORT=3000                                      # ← 如果你改了端口，这里也要改
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start xinli-test

# 设置开机自启
sudo systemctl enable xinli-test

# 查看运行状态
sudo systemctl status xinli-test

# 查看实时日志
journalctl -u xinli-test -f
```

---

## 六、SSL/HTTPS 配置（免费证书）

> ⚠️ 微信支付和支付宝的回调通知地址必须是 HTTPS。不配置 SSL 则无法接收支付结果。

```bash
# 安装 certbot（如果还没装）
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# 自动获取证书并修改 Nginx 配置
# ⚠️ 替换 <你的域名> 为实际域名，例如：xinli-test.com
sudo certbot --nginx -d <你的域名>

# certbot 会自动：
#   1. 验证域名所有权
#   2. 下载 SSL 证书
#   3. 修改 Nginx 配置添加 HTTPS
#   4. 设置 HTTP → HTTPS 自动跳转

# 验证自动续期
sudo certbot renew --dry-run
```

配置完成后，用浏览器访问 `https://<你的域名>` 确认 HTTPS 正常。

---

## 七、PM2 替代方案（可选）

如果你更习惯用 PM2 而不是 systemd：

```bash
# 安装 PM2
npm install -g pm2
```

在项目根目录创建 `ecosystem.config.cjs`：

```javascript
module.exports = {
  apps: [{
    name: "xinli-test",
    cwd: "/var/www/xinli-test/unified-test-app",  // ← 改成你的实际路径
    script: "npm",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 3000    // ← 如果改了端口，这里也要改
    }
  }]
};
```

```bash
# 启动
pm2 start ecosystem.config.cjs

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs xinli-test
```

---

## 八、数据库备份

支付订单数据存储在 SQLite 文件中，务必定期备份：

```bash
# 手动备份
cp data/payments.db data/payments.db.bak.$(date +%Y%m%d)

# 自动每日备份（添加到 crontab）
crontab -e
# 添加这一行（每天凌晨 3 点备份）：
# 0 3 * * * cp /var/www/xinli-test/unified-test-app/data/payments.db /var/www/xinli-test/unified-test-app/data/payments.db.bak.$(date +\%Y\%m\%d)
```

---

## 九、常见问题

### 1. better-sqlite3 编译失败
```
Error: Could not locate the bindings file
```
原因：缺少 C++ 编译工具。
解决：`sudo apt install python3 make g++ libsqlite3-dev`，然后重新 `npm ci`。

### 2. Node.js 版本不对
```
error next@16.1.6: The engine "node" is incompatible with this module
```
解决：安装 Node.js 20+。推荐用 nvm：
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 3. PDF 中文乱码
项目已内置 Noto Sans SC 字体，一般不会乱码。如果仍有问题：
```bash
sudo apt install fonts-noto-cjk
```

### 4. 支付回调收不到通知
检查清单：
- [ ] `.env` 中的 `WECHAT_NOTIFY_URL` / `ALIPAY_NOTIFY_URL` 是否用了你的真实域名（不是 your-domain.com）
- [ ] 域名是否已解析到服务器 IP
- [ ] HTTPS 是否配置成功（回调地址必须是 https://）
- [ ] Nginx 是否正确代理到 Next.js（`nginx -t` 检查语法）
- [ ] 防火墙是否放行了 80/443 端口

### 5. 端口 3000 被占用
```bash
# 查看谁占用了 3000
lsof -i :3000

# 方案 A：杀掉占用进程
kill -9 <PID>

# 方案 B：改用其他端口
# 修改 .env 中 PORT=3001
# 同时修改 Nginx upstream 中的端口为 3001
# 同时修改 systemd 中的 Environment=PORT=3001
```

### 6. 权限问题（Permission denied）
```bash
# 确保 www-data 用户对项目目录有权限
sudo chown -R www-data:www-data /var/www/xinli-test/unified-test-app/data
```

---

## 十、部署后验证清单

部署完成后，逐项检查：

- [ ] `https://<你的域名>` 能正常打开首页
- [ ] 做一个 MBTI 测试 → 跳转到支付页面
- [ ] 沙盒模式下点击「模拟支付成功」→ 能看到测试结果
- [ ] 结果页面能下载 PDF
- [ ] 填写邮箱后能收到邮件（需要先配置 Resend）
- [ ] 测试记录页面能看到历史记录
- [ ] 手机上打开网站，布局正常、按钮可点击

全部通过后，将 `.env` 中 `PAYMENT_MODE` 改为 `production`，填入真实的微信/支付宝密钥，重新构建部署即可上线。
