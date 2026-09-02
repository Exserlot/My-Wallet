# วิจัยการอ่าน Bank Slip ของธนาคารไทย

วันที่วิจัย: 3 กันยายน 2026  
คำถาม: วิธีใดเหมาะกับ Expo/React Native สำหรับอ่านวันที่ จำนวนเงิน ผู้รับ และธนาคารจากสลิปไทย โดยคำนึงถึงความแม่นยำ ความเป็นส่วนตัว ค่าใช้จ่าย และรายการซ้ำ

## ข้อสรุป

สำหรับ MVP ให้ใช้ **QR-first, user-confirmed และ local-first**:

1. ผู้ใช้เลือกรูปสลิปด้วย `expo-image-picker` แล้วอ่าน mini-QR ในเครื่องด้วย `Camera.scanFromURLAsync(..., ['qr'])`
2. ใช้ payload/transaction reference เป็นตัวระบุที่เชื่อถือได้สำหรับตรวจรายการซ้ำ แต่ **อย่าอ้างว่าเป็นหลักฐานยืนยันการโอนสำเร็จ** หากยังไม่ได้ตรวจผ่าน API ของธนาคาร
3. เติมวันที่ จำนวนเงิน ผู้รับ และธนาคารจาก OCR เฉพาะเมื่อ QR ให้ข้อมูลไม่ครบ โดย MVP ควรให้ผู้ใช้เลือกส่งไป Google Cloud Vision อย่างชัดเจนทุกครั้ง (หรือเปิดการยินยอมแบบจำได้ในการตั้งค่า)
4. แสดงแบบร่างให้ผู้ใช้ตรวจและแก้ก่อนบันทึกเสมอ การกรอกเองต้องยังใช้งานได้เมื่อ QR/OCR ล้มเหลว

แนวทางนี้ทำ Android ได้ทันที, ไม่ปิดทาง iOS และเว็บ, และไม่ผูก MVP กับสัญญาเชิงพาณิชย์ของธนาคาร

## หลักฐานและข้อจำกัด

### QR และ Expo

`expo-image-picker` รองรับ Android, iOS และเว็บ รวมถึง Expo Go สำหรับเลือกรูปจากคลังหรือถ่ายภาพ ([Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)). `expo-camera` รองรับสามแพลตฟอร์มและมี `scanFromURLAsync` สำหรับอ่านบาร์โค้ดจากรูป; iOS รองรับเฉพาะ QR ในเมธอดนี้ และ Android แม่นขึ้นเมื่อ QR กินพื้นที่ส่วนใหญ่ของภาพ ([Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/#camerascanfromurlasyncurl-barcodetypes)). ดังนั้น MVP ไม่จำเป็นต้องเพิ่ม native OCR module และยังทดลองใน Expo Go ได้

มาตรฐาน Thai QR ของธนาคารแห่งประเทศไทยเป็นมาตรฐาน QR **สำหรับเริ่มการชำระ/โอน** มีโครงสร้างได้ถึง 64 fields และ Tag 29–31 สำหรับ PromptPay/นวัตกรรมการชำระเงิน ([มาตรฐาน Thai QR Code](https://www.bot.or.th/content/dam/bot/documents/th/our-roles/payment-systems/about-payment-systems/ThaiQRCode_Payment_Standard.pdf)). อย่าสับสน payload นี้กับ mini-QR บน e-slip: เอกสาร Bangkok Bank ระบุว่า mini-QR ฝัง transaction reference ซึ่ง API `Pull Payment Transaction` ใช้ดึงและตรวจข้อมูลธุรกรรม ([Bangkok Bank QR Payment API](https://apiportal.bangkokbank.com/en/api/qr-payment/api-documents)). เอกสาร ธปท. ยังระบุว่าบริการตรวจ electronic receipt ผ่าน API ต้องเป็นไปตาม business rules ระหว่างผู้ให้บริการ จึงไม่ควรพึ่งรูปแบบ payload ที่ reverse-engineer และไม่ประกาศเป็นสาธารณะ ([BOT Policy Guideline](https://www.bot.or.th/content/dam/bot/fipcs/documents/FPG/2562/EngPDF/25620084.pdf)).

การตรวจสลิปด้วย QR ทำได้จริงในผลิตภัณฑ์ธนาคาร: K PLUS รองรับทั้งสแกน e-slip และนำเข้ารูปจากอัลบั้ม แต่หน้าอย่างเป็นทางการไม่ได้เสนอ public API แก่แอปทั่วไป ([KBank Verified Slip](https://www.kasikornbank.com/en/personal/digital-banking/kplus/functions/verified-slip/pages/index.html)).

### API ธนาคารไม่เหมาะเป็น dependency ของ MVP

Bangkok Bank เปิดเผยผลจาก Pull Payment Transaction เช่น `transRef`, `sendingBank`, `receivingBank`, `transDate`, `transTime` และ `amount`; การเชื่อมต่อใช้ OAuth/JWT และอยู่ในชุดบริการ merchant ([Bangkok Bank API](https://apiportal.bangkokbank.com/en/api/qr-payment/api-documents)). KBank QR API มี callback/inquiry แต่การเชื่อมตรงกำหนดให้เป็นนิติบุคคลไทยที่ดำเนินกิจการเกิน 1 ปี ทุนจดทะเบียนเกิน 1 ล้านบาท และผ่าน pre-screen/UAT ([KBank QR API](https://www.kasikornbank.com/th/business/sme/financial-services/Pages/qr-api.aspx)). ราคาจริงของธนาคารไม่ได้ประกาศในหน้าทางการที่ตรวจพบ จึงต้องถือว่าเป็นค่าใช้จ่ายและขั้นตอนเจรจา ไม่ใช่ฟังก์ชันออฟไลน์ของแอปส่วนตัว

ผลคือ MVP ควรเก็บสถานะ `extracted` ไม่ใช่ `bank_verified`; อนาคตค่อยเสียบ `SlipVerifier` เมื่อมีสิทธิ์ API โดยไม่เปลี่ยน flow ผู้ใช้

### OCR ภาษาไทย

Google ML Kit Text Recognition v2 ทำงานบนอุปกรณ์ แต่รายชื่อสคริปต์ที่รองรับมี Latin, Chinese, Devanagari, Japanese และ Korean โดย **ไม่มี Thai script** ([ML Kit languages](https://developers.google.com/ml-kit/vision/text-recognition/v2/languages)). จึงอาจอ่านตัวเลข/ข้อความละตินได้ แต่ไม่ควรใช้เป็นตัวหลักสำหรับชื่อไทยหรือชื่อธนาคาร

Google Cloud Vision รองรับ Thai (`th`) สำหรับ Text/Document Text Detection ([Cloud Vision OCR languages](https://docs.cloud.google.com/vision/docs/languages)). ราคาปัจจุบันคิดต่อภาพ: 1,000 หน่วยแรกต่อเดือนฟรี และ Text Detection หน่วย 1,001–5,000,000 ราคา US$1.50 ต่อ 1,000 หน่วย ([Cloud Vision pricing](https://cloud.google.com/vision/pricing)). ควรเรียกผ่าน backend เพื่อไม่ฝังคีย์ในแอป/เว็บ

ด้านความเป็นส่วนตัว Google ระบุว่างานแบบตอบทันทีประมวลผลภาพในหน่วยความจำและไม่บันทึกภาพลงดิสก์, ไม่ใช้เนื้อหาเพื่อฝึกโมเดล และเก็บ metadata บางส่วนชั่วคราว ([Cloud Vision Data Usage](https://docs.cloud.google.com/vision/docs/data-usage)). อย่างไรก็ตามรูปสลิปมีข้อมูลการเงินและบุคคล จึงต้องอธิบายผู้ให้บริการ/วัตถุประสงค์ก่อนอัปโหลด, ขอความยินยอมตามที่ผู้ใช้กำหนด, ส่งเฉพาะภาพที่จำเป็น, และลบไฟล์ชั่วคราวหลังประมวลผล

## ข้อมูลที่ควรสร้างเป็น `SlipDraft`

| Field | แหล่งหลัก | การบันทึก |
| --- | --- | --- |
| `transactionReference` | mini-QR หรือ bank API | เก็บแบบ normalized; ใช้ hard duplicate key |
| `sendingBank`, `receivingBank` | QR/API; OCR เป็น fallback | ใช้รหัสธนาคารมาตรฐานและชื่อแปลได้ |
| `occurredAt` | API หรือ OCR | เก็บ UTC พร้อม timezone ต้นทาง `Asia/Bangkok` |
| `amountMinor`, `currency` | API หรือ OCR | integer สตางค์; MVP เป็น `THB` |
| `senderName`, `receiverName` | API/OCR | ผู้ใช้ยืนยัน; หลีกเลี่ยงเก็บถ้าไม่จำเป็น |
| `senderAccountLast4`, `receiverAccountLast4` | API/OCR | เก็บเฉพาะเลขที่ถูก mask/ท้าย 4 หลัก |
| `direction`, `walletId`, `categoryId` | ผู้ใช้ | ห้ามเดาแล้วบันทึกอัตโนมัติ |
| `source`, `confidence`, `verificationStatus` | ระบบ | แยก `qr`, `ocr-cloud`, `manual`; `extracted`/`bank_verified` |

เก็บ raw QR payload แบบเข้ารหัสหรือเก็บเพียง SHA-256 เมื่อไม่จำเป็นต้องแสดงซ้ำ และไม่เก็บรูปต้นฉบับโดยค่าเริ่มต้น หากผู้ใช้เลือกแนบสลิป ให้เก็บในพื้นที่แอปที่เข้ารหัสและลบได้

## การป้องกันรายการซ้ำ

1. **Hard duplicate:** สร้าง `sourceFingerprint = SHA-256('thai-slip:v1|' + issuerBank + '|' + transactionReference)` และทำ unique index เมื่อมี reference; ถ้ายัง parse issuer ไม่ได้ ใช้ SHA-256 ของ normalized QR payload
2. **Same image:** hash bytes ของไฟล์ช่วยจับการนำเข้ารูปเดิม แต่ไม่พอสำหรับรูปที่ถูก crop/compress
3. **Soft duplicate สำหรับ OCR/manual:** เตือนเมื่อ `walletId + amountMinor + occurredAt (ช่วง ±2 นาที) + receiver/account-last4` ใกล้เคียงกัน แต่อนุญาตให้ยืนยัน เพราะธุรกรรมจริงอาจมีจำนวนเท่ากันในเวลาใกล้กัน
4. ตรวจ duplicate ตั้งแต่หลัง extract และตรวจซ้ำใน transaction เดียวกับการบันทึก เพื่อกันการแตะซ้ำ/งานพร้อมกัน

QR, OCR และ hash พิสูจน์ได้เพียงว่าไฟล์หรือข้อความเหมือนกัน ไม่พิสูจน์ว่าสลิปไม่ปลอมหรือเงินเข้าจริง; เฉพาะผลจากธนาคาร/ผู้ให้บริการที่ได้รับอนุญาตควรเปลี่ยนเป็น `bank_verified`

## โครงสร้าง implementation ที่แนะนำ

กำหนด interface กลางเพื่อแชร์ domain logic กับเว็บในอนาคต:

```ts
interface SlipReader {
  extract(imageUri: string): Promise<SlipExtraction>;
}

interface SlipOcrProvider {
  extractWithConsent(imageUri: string): Promise<SlipExtraction>;
}

interface SlipVerifier {
  verify(reference: SlipReference): Promise<VerifiedSlip>;
}
```

Pipeline: `select image → local QR → known-payload adapter → optional consented OCR → normalize → duplicate check → confirmation → save`. Parser แต่ละธนาคารควรเป็น adapter พร้อมชุด fixture ที่ทำข้อมูลนิรนาม และทุก field ต้องพก provenance/confidence เพื่อให้ UI รู้ว่าต้องเน้นตรวจค่าใด

## เกณฑ์ยอมรับสำหรับ MVP

- นำเข้ารูปและอ่าน QR ใน Android ได้โดยไม่ส่งภาพออกจากเครื่อง
- ถ้า QR ไม่ครบ ผู้ใช้เลือก “ส่งเพื่ออ่านข้อความ” ได้หลังเห็นคำอธิบายความเป็นส่วนตัว หรือข้ามไปกรอกเองได้
- แบบร่างต้องไม่ถูกบันทึกก่อนผู้ใช้ยืนยันวันที่ จำนวนเงิน ผู้รับ/ทิศทาง Wallet และหมวดหมู่
- รายการซ้ำจาก transaction reference ถูกบล็อก; soft duplicate แสดงคำเตือนและมี override
- ไม่มี API key ในแอป, ลบไฟล์ชั่วคราวหลังประมวลผล, log ไม่บันทึก raw OCR/QR หรือเลขบัญชีเต็ม
- โครงสร้างเดียวกันรองรับ iOS/เว็บ โดยเปลี่ยนเฉพาะ implementation ของ image picker/QR/OCR provider

## สิ่งที่ควรพิสูจน์ด้วย prototype ก่อน implement เต็ม

ทดสอบสลิปจริงที่ทำข้อมูลนิรนามอย่างน้อย 3–5 แบบจากแต่ละธนาคารเป้าหมาย โดยวัดอัตราอ่าน QR, ความถูกต้องของวันที่/จำนวนเงิน/ผู้รับ, เวลา และ soft-duplicate false positive จากนั้นตัดสินอีกครั้งว่า cloud OCR ให้ประโยชน์พอหรือควรให้กรอก fallback มากกว่า ทั้งนี้ไม่ควร commit รูปสลิปจริงเข้า repository
