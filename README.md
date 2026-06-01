# Next.js PostgreSQL Plesk Test

โปรเจกต์นี้เป็นระบบทดสอบเล็ก ๆ สำหรับเช็กว่า Next.js ที่ติดตั้งบน Plesk เชื่อมต่อ PostgreSQL ได้หรือไม่

## สิ่งที่มีให้

- หน้าเว็บ `/` สำหรับกดทดสอบอ่าน/เขียนฐานข้อมูล
- API `GET /api/db-test` สำหรับทดสอบอ่านข้อมูลจาก PostgreSQL
- API `POST /api/db-test` สำหรับสร้างตาราง `plesk_connection_tests` และ insert แถวทดสอบ
- รองรับการตั้งค่าผ่าน `DATABASE_URL` หรือชุดตัวแปร `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

## ติดตั้งบนเครื่อง

```bash
npm install
cp .env.example .env
npm run dev
```

แก้ค่าใน `.env` ให้ตรงกับฐานข้อมูล PostgreSQL ของคุณ แล้วเปิด `http://localhost:3000`

## ตัวอย่าง `.env`

ใช้ connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
PGSSLMODE="disable"
```

หรือใช้ตัวแปรแยก:

```env
PGHOST="localhost"
PGPORT="5432"
PGDATABASE="database_name"
PGUSER="database_user"
PGPASSWORD="database_password"
PGSSLMODE="disable"
```

ถ้าฐานข้อมูลบังคับ SSL ให้เปลี่ยนเป็น:

```env
PGSSLMODE="require"
```

## Deploy ไป Plesk

1. อัปโหลดโปรเจกต์นี้ไปที่โดเมนหรือ subdomain ใน Plesk
2. เปิดเมนู **Node.js** ของโดเมนนั้น
3. ตั้งค่า:
   - Node.js version: `20` หรือสูงกว่า
   - Application mode: `production`
   - Application root: โฟลเดอร์โปรเจกต์นี้
   - Document root: ควรชี้ไปที่ public path ตามที่ Plesk กำหนดไว้สำหรับแอป Node.js
   - Application startup file: ใช้คำสั่งผ่าน npm scripts ของ Plesk หรือระบุ `node_modules/next/dist/bin/next`
4. ในส่วน Environment variables ให้เพิ่มค่า `DATABASE_URL` หรือ `PG*` ตามด้านบน
5. กด **NPM install**
6. รัน `npm run build`
7. Start หรือ Restart แอป

ถ้า Plesk ให้กรอกคำสั่ง start เอง ให้ใช้:

```bash
npm start
```

หลัง deploy แล้ว เปิดหน้าเว็บและกด:

- **ทดสอบการอ่าน** เพื่อตรวจ connection
- **ทดสอบการเขียน** เพื่อตรวจ permission การสร้างตารางและ insert ข้อมูล

## ตรวจปัญหาเบื้องต้น

```bash
npm run check:env
npm run build
```

ถ้าเชื่อมต่อไม่ได้ ให้ตรวจ:

- Host, port, database, username, password ถูกต้อง
- PostgreSQL อนุญาต remote connection จาก server Plesk
- Firewall เปิด port PostgreSQL แล้ว
- ค่า `PGSSLMODE` ตรงกับ requirement ของฐานข้อมูล
