# nodejs-web

Homepage web menggunakan Node.js + DynamoDB AWS.

## Deploy Singkat ke EC2

### Tools yang perlu disiapkan
- AWS Account + EC2 instance (Ubuntu)
- Key pair `.pem` untuk SSH
- Security Group (buka port `22`, `80`, dan `3000` jika belum pakai reverse proxy)
- Git
- Node.js 18+ dan npm
- PM2 (process manager)
- Nginx (opsional, tapi direkomendasikan untuk expose port 80)

### 1) Connect ke EC2
```bash
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

### 2) Install dependency di server
```bash
sudo apt update
sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

### 3) Deploy project
```bash
git clone <URL_REPO_KAMU>.git
cd nodejs-web
npm install
cp .env.example .env
```

### 4) Isi environment variable
Edit file `.env`, minimal isi:
- `PORT`
- `AWS_REGION`
- `DYNAMODB_TABLE`

### 5) Jalankan app
```bash
pm2 start src/server.js --name nodejs-web
pm2 save
pm2 startup
```

### 6) (Opsional) Reverse proxy via Nginx
Konfigurasikan Nginx agar request port `80` diarahkan ke app `localhost:3000`.
