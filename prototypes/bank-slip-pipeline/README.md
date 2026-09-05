# Bank Slip Pipeline Prototype

ต้นแบบ logic แบบทิ้งได้สำหรับ GitHub Issue #9 เพื่อทดลอง pipeline:

`เลือกรูป → อ่าน QR ในเครื่อง → normalize → ตรวจซ้ำ → เติม fallback → ผู้ใช้ยืนยัน`

เปิด `index.html` ด้วยเบราว์เซอร์โดยตรง ไม่ต้องติดตั้ง dependency ข้อมูลอยู่ใน memory และหายเมื่อปิดหรือ reload หน้า

ข้อจำกัด:

- การอ่าน QR จากรูปใช้ `BarcodeDetector` ของเบราว์เซอร์ หากอุปกรณ์ไม่รองรับต้องพิสูจน์ส่วนนี้ซ้ำด้วย `Camera.scanFromURLAsync` บน Android/Expo
- รูปแบบ mini-QR ของ e-slip ไม่ใช่มาตรฐาน public ที่ควรเดา parser ต้นแบบจึงแยก “พบ payload” ออกจาก “ดึง field ได้”
- OCR cloud ในต้นแบบเป็นข้อมูลจำลอง ไม่มีภาพถูกส่งออกจากเครื่อง
- fixture ที่ขึ้นต้น `MW-SLIP` เป็นข้อมูลสังเคราะห์ ไม่ใช่ payload ของธนาคารจริง

รูปสลิปจริงต้องอยู่ใน `private-samples/` เท่านั้นและจะไม่ถูก Git ติดตาม
