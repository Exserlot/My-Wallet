# My Wallet

แอปจัดการการเงินส่วนบุคคลที่เน้นใช้งานแบบ Offline พัฒนาด้วย Expo และ React Native ข้อมูล Wallet, Transaction, Budget, Fixed Cost, Shopping List และลายนิ้วมือของสลิปเก็บอยู่ในอุปกรณ์

## ความสามารถปัจจุบัน

- แยก Wallet ตามเงินสด บัญชีธนาคาร และ e-Wallet
- บันทึก Income/Expense และจัดหมวดรายจ่าย
- วาง Monthly Budget พร้อม Budget Allocation และ Fixed Cost
- จัด Shopping List โดยไม่หักงบจนกว่าจะซื้อจริง
- นำเข้าสลิปหลายรูป อ่าน QR ในเครื่อง และตรวจรายการซ้ำ
- Dashboard, Attention Item, รายงาน และ local Android notification
- ซ่อนตัวเลขการเงินและรายละเอียดบนหน้าจอล็อกได้

## เริ่มพัฒนา

ต้องติดตั้ง Node.js รุ่น LTS และแอป Expo Go บนมือถือก่อน จากโฟลเดอร์โปรเจกต์ให้ใช้:

```sh
npm install
npx expo start
```

สแกน QR ที่แสดงในหน้าต่างคำสั่งด้วย Expo Go หรือกด `a` เพื่อเปิด Android Emulator

## ตรวจคุณภาพ

```sh
npm test
npm run typecheck
npm run lint
npx expo export
npx expo-doctor
```

ควรรันทั้งหมดก่อน commit โดยเฉพาะเมื่อแก้การคำนวณเงิน ฐานข้อมูล หรือการแจ้งเตือน

## สร้างไฟล์ติดตั้ง Android

ครั้งแรกต้องมีบัญชี Expo และเข้าสู่ระบบก่อน:

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

โปรไฟล์ `preview` สร้างไฟล์ APK ที่ดาวน์โหลดและติดตั้งบนมือถือได้โดยตรง เมื่อ build เสร็จให้เปิดลิงก์จาก Expo บนมือถือแล้วกด Install

สำหรับ Google Play ใช้โปรไฟล์ `production` ซึ่งสร้าง Android App Bundle:

```sh
npx eas-cli build --platform android --profile production
```

ห้าม commit รูปสลิป ข้อมูลการเงินจริง API key หรือไฟล์ signing credential เข้า repository
