# Admin Operational Runbook — Student Registration System

## Overview
เอกสารคู่มือปฏิบัติการสำหรับผู้ดูแลระบบ (System Administrator) และวิศวกร DevOps ในการบริหารจัดการ ติดตั้งระบบ บำรุงรักษาฐานข้อมูล และการรับมือเหตุขัดข้อง (Disaster Recovery)

---

## 1. Production Deployment via Docker Compose

### Prerequisites
- Docker Engine 24.0+ & Docker Compose 2.20+
- Neon PostgreSQL database instance (or cloud PostgreSQL 16+)
- Domain and SSL Certificates (Reverse Proxy / Cloudflare / Nginx)

### Deployment Steps
```bash
# 1. Clone or unpack system release
cd /path/to/student-registration-system

# 2. Configure production environment
cp backend/.env.production.example backend/.env
# Update DATABASE_URL and secure JWT_SECRET

# 3. Run database migrations and generate schema
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
cd ..

# 4. Start all containers in detached mode
docker compose up -d --build

# 5. Verify service health
docker compose ps
curl http://localhost:3000/api/v1/health
```

---

## 2. Database Operations & Maintenance

### Database Migrations
เมื่อมีการปรับแก้ Prisma Schema (`schema.prisma`):
```bash
# Development (สร้าง migration ใหม่)
npx prisma migrate dev --name <migration_name>

# Production (รัน migration ที่ทดสอบแล้ว)
npx prisma migrate deploy
```

### Seeding Initial University Data
```bash
# Seed initial departments, courses, teachers, students, and active semester
npx ts-node prisma/seed.ts
```

### Database Backup & Disaster Recovery
```bash
# Backup Neon / Remote PostgreSQL database
pg_dump -d "$DATABASE_URL" -F c -b -v -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Restore database from backup
pg_restore -d "$DATABASE_URL" -v --clean "backup_file.dump"
```

---

## 3. User Administration & Security Operations

### Managing Credentials & Password Reset
1. เข้าสู่ระบบด้วยบัญชี Administrator: `admin@reg.edu`
2. ไปที่เมนู **User Management** (`/admin/users`)
3. ค้นหาผู้ใช้งานด้วยชื่อ, อีเมล หรือรหัสประจำตัว
4. กดปุ่ม **"แก้ไข" (Edit)**
5. สามารถแก้ไขข้อมูลได้ครบถ้วน:
   - ตั้งรหัสผ่านใหม่ (ระบบจะเข้ารหัสผ่านด้วย bcrypt ทันที)
   - ปรับปรุงอีเมลและเบอร์โทรศัพท์
   - ปรับสถานะนิสิต/นักศึกษา (ACTIVE, SUSPENDED, GRADUATED)
   - ปรับเปลี่ยนสาขาวิชา/ภาควิชา

### Security Audit Trails Inspection
1. ไปที่เมนู **Audit Logs** (`/admin/audit-logs`)
2. ตรวจสอบบันทึกพฤติกรรมความปลอดภัย:
   - บันทึกการลงทะเบียนและการถอนรายวิชา
   - บันทึกการสร้างและแก้ไขข้อมูลผู้ใช้งาน
   - บันทึกการเปลี่ยนแปลงภาคการศึกษาและที่นั่งเรียน
   - ตรวจจับ IP Address และ Timestamp แบบ Real-time

---

## 4. Performance & Health Monitoring
- **Health Check Endpoint**: `GET /api/v1/health` (แสดง uptime และสถานะบริการ)
- **API Documentation**: `GET /api/docs` (OpenAPI Swagger UI)
- **Rate Limit Policy**: ค่าเริ่มต้น 120 คำขอต่อนาทีต่อ IP ป้องกัน DoS
- **Caching Eviction**: สถิติ Dashboard ถูกแคชไว้ 3 วินาทีเพื่อลดโหลดฐานข้อมูล
