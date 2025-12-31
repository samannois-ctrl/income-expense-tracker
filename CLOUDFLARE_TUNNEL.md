# Cloudflare Tunnel Setup - Quick Guide

## 🚀 ขั้นตอนการติดตั้ง Cloudflare Tunnel

### 1. ติดตั้ง Cloudflared

**ดาวน์โหลด:**
- ไปที่: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
- เลือก Windows
- ดาวน์โหลด `cloudflared-windows-amd64.exe`
- เปลี่ยนชื่อเป็น `cloudflared.exe`
- ย้ายไปที่ `C:\Windows\System32\` (หรือ folder ที่อยู่ใน PATH)

**หรือใช้ PowerShell:**
```powershell
# ดาวน์โหลดและติดตั้ง
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"

# ย้ายไปที่ System32
Move-Item cloudflared.exe C:\Windows\System32\cloudflared.exe
```

---

### 2. Login เข้า Cloudflare

```powershell
cloudflared tunnel login
```

- เบราว์เซอร์จะเปิดขึ้นมา
- Login ด้วย Cloudflare account (สมัครฟรีถ้ายังไม่มี)
- เลือก domain (หรือสร้างใหม่ฟรีที่ Cloudflare)
- อนุญาต cloudflared

---

### 3. สร้าง Tunnel

```powershell
# สร้าง tunnel ชื่อ income-tracker
cloudflared tunnel create income-tracker
```

จะได้ Tunnel ID (เก็บไว้)

---

### 4. สร้างไฟล์ Config

สร้างไฟล์ `config.yml` ที่ `C:\Users\<username>\.cloudflared\config.yml`

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<username>\.cloudflared\<TUNNEL_ID>.json

ingress:
  # Frontend
  - hostname: income-tracker.yourdomain.com
    service: http://localhost:5173
  
  # Backend API
  - hostname: api-income-tracker.yourdomain.com
    service: http://localhost:3001
  
  # Catch-all rule (required)
  - service: http_status:404
```

**แก้ไข:**
- `<TUNNEL_ID>` - ใส่ Tunnel ID ที่ได้
- `<username>` - ใส่ username Windows ของคุณ
- `yourdomain.com` - ใส่ domain ของคุณ

---

### 5. Route DNS

```powershell
# Route frontend
cloudflared tunnel route dns income-tracker income-tracker.yourdomain.com

# Route backend
cloudflared tunnel route dns income-tracker api-income-tracker.yourdomain.com
```

---

### 6. รัน Tunnel

**แบบทดสอบ:**
```powershell
cloudflared tunnel run income-tracker
```

**แบบ Background (Windows Service):**
```powershell
# ติดตั้งเป็น service
cloudflared service install

# Start service
cloudflared service start
```

---

### 7. ทดสอบ

เปิดเบราว์เซอร์:
- Frontend: `https://income-tracker.yourdomain.com`
- Backend: `https://api-income-tracker.yourdomain.com/api/health`

---

## 🎯 แบบง่ายที่สุด (Quick Tunnel)

ถ้าต้องการทดสอบเร็วๆ ไม่ต้องตั้งค่า:

```powershell
# รัน quick tunnel (ได้ URL ชั่วคราว)
cloudflared tunnel --url http://localhost:5173
```

จะได้ URL แบบ: `https://random-name.trycloudflare.com`

> [!WARNING]
> Quick Tunnel เป็น URL ชั่วคราว จะเปลี่ยนทุกครั้งที่รัน ไม่เหมาะสำหรับ production

---

## 📝 สรุป

### ใช้งานจริง (Production)
1. สร้าง Tunnel แบบถาวร
2. ตั้งค่า DNS
3. รันเป็น Windows Service
4. ✅ ได้ URL ถาวร + HTTPS

### ทดสอบเร็วๆ
1. รัน `cloudflared tunnel --url http://localhost:5173`
2. ✅ ได้ URL ทันที (แต่ชั่วคราว)

---

## 🔐 Security Tips

1. **ใช้ Cloudflare Access** - เพิ่ม authentication layer
2. **จำกัด IP** - อนุญาตเฉพาะ IP ที่ต้องการ
3. **Enable WAF** - Web Application Firewall
4. **Monitor Logs** - ดู access logs เป็นประจำ

---

**ต้องการความช่วยเหลือเพิ่มเติม?**
- Cloudflare Docs: https://developers.cloudflare.com/cloudflare-one/
- Community: https://community.cloudflare.com/
