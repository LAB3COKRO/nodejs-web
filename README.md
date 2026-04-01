# nodejs-web

Homepage web menggunakan Node.js + DynamoDB AWS.

## Deploy Singkat ke EC2

### Tools yang perlu disiapkan
- AWS Account + EC2 instance (Amazon Linux / distro berbasis `yum`)
- Key pair `.pem` untuk SSH
- Security Group (buka port `22`, `80`, dan `3000` jika belum pakai reverse proxy)
- Git
- Node.js 18+ dan npm
- PM2 (process manager)
- Nginx (opsional, tapi direkomendasikan untuk expose port 80)

### 1) Connect ke EC2
```bash
ssh -i "your-key.pem" ec2-user@<EC2_PUBLIC_IP>
```

### 2) Install dependency di server
```bash
sudo yum update -y
sudo yum install -y git nginx
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
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

### 5) Setup AWS Credential

#### Opsi 1 (Recommended): IAM Role di EC2
1. Buat IAM Role untuk EC2.
2. Attach policy DynamoDB (minimal `dynamodb:Scan`) ke tabel yang dipakai.
3. Attach role tersebut ke EC2 instance.
4. Verifikasi di server:
```bash
aws sts get-caller-identity
```

#### Opsi 2 (Quick): Access Key di `.env`
Tambahkan ke `.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

Lalu restart app setelah update env:
```bash
pm2 restart nodejs-web --update-env
```

### 6) Buat DynamoDB (database)

Nama tabel yang dipakai default: `homepage-items`  
(atau sesuaikan dengan nilai `DYNAMODB_TABLE` di `.env`).

Struktur data minimal yang direkomendasikan:
- `id` (String) -> **Partition Key**
- `nama` (String)
- `keterangan` (String)

Contoh item:
```json
{
  "id": "1",
  "nama": "Produk A",
  "keterangan": "Deskripsi singkat produk A"
}
```

Cara cepat via AWS CLI:
```bash
aws dynamodb create-table \
  --table-name homepage-items \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

Tambah data contoh:
```bash
aws dynamodb put-item \
  --table-name homepage-items \
  --item '{"id":{"S":"1"},"nama":{"S":"Produk A"},"keterangan":{"S":"Deskripsi singkat produk A"}}' \
  --region ap-southeast-1
```

### 7) Jalankan app
```bash
pm2 start src/server.js --name nodejs-web
pm2 save
pm2 startup
```

### 8) (Opsional) Reverse proxy via Nginx
Konfigurasikan Nginx agar request port `80` diarahkan ke app `localhost:3000`.
