# CV Analysis Backend (Spring Boot 3 + PostgreSQL + Gemini AI)

Backend cho website phân tích CV bằng AI (đồ án AIP202 — DAU). Khớp API với frontend
React tại `https://github.com/hieulefsdev-fs/ptich_CV_AI_DAU`.

## 1. Kiến trúc

- **Java 21 + Spring Boot 3.3**, layer: controller → service → repository
- **PostgreSQL 16** — dữ liệu user, lịch sử phân tích (JSONB), đơn hàng VNPay
- **Spring Security + JWT** — stateless, không dùng session
- **Gemini API** — phân tích CV, trả JSON có cấu trúc
- **Gmail SMTP** — gửi OTP đăng ký / quên mật khẩu
- **VNPay** — thanh toán nâng cấp gói Plus
- **Docker + Docker Compose** — chạy nhất quán trên mọi máy

## 2. Chạy local (không dùng Docker) — để code/debug

Yêu cầu: JDK 21, Maven, PostgreSQL đang chạy local.

```bash
# 1. Tạo database
createdb cv_analysis_db

# 2. Set biến môi trường (PowerShell ví dụ)
$env:DB_PASSWORD="yourpassword"
$env:JWT_SECRET="dev-secret-please-change"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173"
$env:MAIL_USERNAME="you@gmail.com"
$env:MAIL_PASSWORD="app-password"
$env:GEMINI_API_KEY="..."

# 3. Chạy
mvn spring-boot:run
```

Backend chạy ở `http://localhost:8080`. Frontend Vite mặc định chạy `http://localhost:5173`
— khớp với CORS mặc định trong `application.yml`.

## 3. Chạy bằng Docker (khuyến nghị — giống môi trường thật)

```bash
cp .env.example .env
# --> mở .env, điền đầy đủ giá trị thật (DB password, JWT secret, Gmail app password,
#     Gemini API key, VNPay sandbox key...)

docker compose up -d --build
docker compose logs -f backend   # xem log khởi động
```

Kiểm tra: `curl http://localhost:8080/api/v1/actuator/health` phải trả `{"status":"UP"}`.

**Vì sao dùng Docker ngay từ đầu:** đúng như bạn lo ngại — chạy `mvn spring-boot:run` trực
tiếp phụ thuộc vào Java/Maven/Postgres cài trên từng máy, dễ bị "máy tôi chạy được, máy
khác thì không". `docker compose up` đóng gói toàn bộ runtime + DB, chạy giống hệt nhau
trên máy bạn và trên server.

## 4. Lấy các API key cần thiết

| Biến | Cách lấy |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey — tạo key miễn phí |
| `MAIL_USERNAME`/`MAIL_PASSWORD` | Gmail → bật 2FA → tạo "App Password" tại https://myaccount.google.com/apppasswords (không dùng mật khẩu Gmail thật) |
| `VNPAY_TMN_CODE`/`VNPAY_HASH_SECRET` | Đăng ký tài khoản merchant sandbox tại https://sandbox.vnpayment.vn/devreg/ |

## 5. Deploy lên Ubuntu server (bạn đã có sẵn server)

### 5.1. Chuẩn bị server

```bash
# Cài Docker + Docker Compose plugin (nếu chưa có)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # rồi logout/login lại
```

### 5.2. Đưa code lên server

```bash
git clone https://github.com/hieulefsdev-fs/<ten-repo-backend>.git
cd <ten-repo-backend>
cp .env.example .env
nano .env   # điền giá trị PRODUCTION thật (đổi hết mật khẩu/secret so với lúc dev)
```

Với domain vừa mua: cập nhật `CORS_ALLOWED_ORIGINS`, `VNPAY_RETURN_URL`,
`FRONTEND_BASE_URL` trong `.env` thành domain thật, ví dụ:

```
CORS_ALLOWED_ORIGINS=https://cvai.yourdomain.com
VNPAY_RETURN_URL=https://api.yourdomain.com/api/v1/payment/vnpay-return
FRONTEND_BASE_URL=https://cvai.yourdomain.com
```

```bash
docker compose up -d --build
```

### 5.3. Trỏ domain + HTTPS bằng Nginx + Let's Encrypt

Cài Nginx trên server (ngoài Docker), reverse proxy vào container backend (cổng 8080
chỉ bind localhost — xem `docker-compose.yml`):

```nginx
# /etc/nginx/sites-available/api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS miễn phí
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Nếu bạn dùng Cloudflare cho domain (giống các bài lab Cloudflare bạn đã làm), có thể
để Cloudflare lo SSL (chế độ "Full") thay vì certbot — cả hai đều được, chọn 1.

Frontend build tĩnh thì deploy tương tự ở subdomain khác (`cvai.yourdomain.com`), Nginx
serve file build hoặc reverse-proxy tới container frontend nếu bạn cũng Docker hóa nó.

### 5.4. Migrate sang VNPay production (khi lên internet thật)

Sandbox chỉ dùng để test. Khi đồ án hoàn thiện / muốn nhận tiền thật, cần đăng ký merchant
thật với VNPay và đổi `VNPAY_PAY_URL` sang `https://vnpayment.vn/paymentv2/vpcpay.html`.
Với đồ án môn học, sandbox là đủ.

## 6. Checklist bảo mật trước khi public

- [ ] `.env` không được commit vào Git (đã có trong `.gitignore`)
- [ ] `JWT_SECRET` là chuỗi random dài (>= 32 ký tự), khác biệt hoàn toàn giữa dev và production
- [ ] `CORS_ALLOWED_ORIGINS` chỉ liệt kê đúng domain frontend thật, không để `*`
- [ ] Đổi `JPA_DDL_AUTO=validate` sau khi đã ổn định schema (tránh Hibernate tự sửa bảng trên production)
- [ ] Cổng 5432 (Postgres) và 8080 (backend) không mở ra Internet — chỉ Nginx (80/443) mở public
- [ ] Bật HTTPS bắt buộc (Nginx/Cloudflare) trước khi thu thập CV thật của người dùng
- [ ] Google App Password và Gemini/VNPay key phải là bộ khác với bộ dùng lúc code/test

## 7. Cấu trúc thư mục

```
src/main/java/com/cvai/backend/
├── config/          # Security, CORS, RestClient
├── security/        # JWT util, filter, UserDetails
├── entity/          # User, CvAnalysis, PaymentOrder, OtpCode + enums
├── repository/       # Spring Data JPA
├── dto/             # auth / analysis / payment / admin / ai (Gemini)
├── controller/      # REST endpoints khớp frontend
├── service/         # business logic
└── exception/       # xử lý lỗi tập trung
```
