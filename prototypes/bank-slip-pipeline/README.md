# Bank Slip Pipeline Prototype

ต้นแบบ logic แบบทิ้งได้สำหรับ GitHub Issue #9 เพื่อทดลอง pipeline:

`เลือกรูป → อ่าน QR ในเครื่อง → normalize → ตรวจซ้ำ → เติม fallback → ผู้ใช้ยืนยัน`

## Target banks

- ธนาคารกสิกรไทย (`KBank`, แอป K PLUS)
- ธนาคารไทยพาณิชย์ (`SCB`, แอป SCB EASY)

เป้าหมายการทดลองคือสลิปนิรนาม 3–5 รูปต่อธนาคาร โดยพยายามให้ครอบคลุมการโอนพร้อมเพย์ การโอนข้ามธนาคาร และการชำระร้านค้าเท่าที่ผู้ใช้มีตัวอย่าง

เปิด `index.html` ด้วยเบราว์เซอร์โดยตรง ไม่ต้องติดตั้ง dependency ข้อมูลอยู่ใน memory และหายเมื่อปิดหรือ reload หน้า

ข้อจำกัด:

- การอ่าน QR จากรูปใช้ `BarcodeDetector` ของเบราว์เซอร์ หากอุปกรณ์ไม่รองรับต้องพิสูจน์ส่วนนี้ซ้ำด้วย `Camera.scanFromURLAsync` บน Android/Expo
- รูปแบบ mini-QR ของ e-slip ไม่ใช่มาตรฐาน public ที่ควรเดา parser ต้นแบบจึงแยก “พบ payload” ออกจาก “ดึง field ได้”
- OCR cloud ในต้นแบบเป็นข้อมูลจำลอง ไม่มีภาพถูกส่งออกจากเครื่อง
- fixture ที่ขึ้นต้น `MW-SLIP` เป็นข้อมูลสังเคราะห์ ไม่ใช่ payload ของธนาคารจริง

รูปสลิปจริงต้องอยู่ใน `private-samples/` เท่านั้นและจะไม่ถูก Git ติดตาม

## Local sample results

ผลวันที่ 5 กันยายน 2026 จากสลิปจริงที่ผู้ใช้ให้ทดสอบเฉพาะในเครื่อง ธนาคารละ 1 รูป โดยไม่อัปโหลดและไม่บันทึก raw QR หรือ transaction reference:

| Bank | QR read | Reference in QR | Date in QR | Amount in QR |
| --- | --- | --- | --- | --- |
| KBank | 1/1 | 1/1 | 0/1 | 0/1 |
| SCB | 1/1 | 1/1 | 1/1 | 0/1 |

QR ทั้งสองใบยังอ่านสำเร็จหลังย่อความกว้างเหลือ 540 px, บีบ JPEG quality 50 และหมุน 90 องศา รวม 8/8 variants เวลา decode ด้วย `jsQR` บนเครื่อง desktop อยู่ระหว่าง 34–162 ms ตัวเลขนี้ไม่ใช่ benchmark ของ Android/Expo

ข้อสรุปชั่วคราว: raw QR เหมาะสำหรับสร้าง fingerprint กันซ้ำ และมี transaction reference ในตัวอย่างทั้งสองธนาคาร แต่ยังไม่ให้ amount ที่มองเห็นบนสลิป จึงต้องคง OCR/manual fallback ยังไม่ควรล็อก bank adapter จากตัวอย่างธนาคารละใบ
