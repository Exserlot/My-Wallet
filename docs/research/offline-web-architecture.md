# วิจัยสถาปัตยกรรม Offline-first สำหรับ Mobile ที่ต่อยอดสู่ Web

วันที่วิจัย: 3 กันยายน 2026  
ประเด็น: [GitHub Issue #5](https://github.com/Exserlot/My-Wallet/issues/5)

## ข้อสรุป

ใช้ **Expo + React Native + Expo Router** เป็นแอปแบบ universal แต่แชร์เฉพาะ UI ที่เหมาะสมและแกนธุรกิจภาษา TypeScript ส่วนการเก็บข้อมูลให้ซ่อนหลัง repository interface:

- Android MVP ใช้ `expo-sqlite` เป็นแหล่งข้อมูลจริงเพียงแห่งเดียว ทำงานได้โดยไม่ต้องมีบัญชีผู้ใช้ อินเทอร์เน็ต หรือ backend
- Web ในอนาคตใช้ adapter ของตนเองบน IndexedDB หรือใช้ sync engine ที่มี SDK ทั้ง React Native และ Web
- ยังไม่ติดตั้ง Supabase, PowerSync, authentication, outbox หรือ conflict engine ใน MVP เพียงเตรียม schema และขอบเขตโมดูลให้ย้ายได้

แนวทางนี้ให้ Android รุ่นแรกเรียบง่ายที่สุด แต่ไม่ทำให้ business rule, use case และแบบจำลองข้อมูลติดกับ SQLite หรือหน้าจอ Mobile

## หลักฐานจากแหล่งทางการ

- Expo Router ออกแบบสำหรับ Android, iOS และ Web โดยใช้ navigation structure ร่วมกัน และรองรับการแยก implementation ตามแพลตฟอร์มเมื่อจำเป็น ([Expo Router](https://docs.expo.dev/router/introduction/), [platform-specific modules](https://docs.expo.dev/router/advanced/platform-specific-modules/))
- `expo-sqlite` เก็บฐานข้อมูลข้ามการเปิดแอปใหม่ รองรับ transaction และแนะนำ WAL เพื่อประสิทธิภาพทั่วไป จึงเหมาะกับข้อมูลธุรกรรมบน Android ([Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/))
- แม้ `expo-sqlite` ระบุ Web เป็นแพลตฟอร์มที่รองรับ แต่ ณ วันที่วิจัยส่วน Web ยังเป็น **alpha** และต้องตั้งค่า WASM, `SharedArrayBuffer`, COEP และ COOP จึงไม่ควรทำให้ persistence ของ Web ผูกกับมันตั้งแต่วันนี้ ([Expo SQLite — Web setup](https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup))
- IndexedDB เป็นฐานข้อมูลแบบ transaction สำหรับ structured data ใน browser ทำงานแบบ asynchronous และถูกออกแบบให้เว็บทำงานได้แม้ไม่มี network ([MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB))
- PowerSync มี SDK ทางการสำหรับ React Native/Expo และ JavaScript Web โดยแต่ละ SDK จัดการ local SQLite ที่ sync กับ backend; ฝั่ง Web อ่าน/เขียน local database ได้ทั้ง online และ offline แต่การ sync ต้องมี backend connector, token และ upload handling ([PowerSync SDK overview](https://docs.powersync.com/client-sdks/overview), [JavaScript Web SDK](https://docs.powersync.com/client-sdks/reference/javascript-web))
- Supabase quickstart สำหรับ Expo แสดงการ query backend โดยตรง และใช้ local persistence สำหรับ auth session ไม่ใช่ฐานข้อมูล offline พร้อม sync อัตโนมัติ ดังนั้น Supabase เพียงตัวเดียวไม่แก้โจทย์ local-first ([Supabase Expo quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native))

## ทางเลือกที่เปรียบเทียบ

| ทางเลือก | Android MVP | Web ภายหลัง | Cloud sync | ข้อพิจารณา |
| --- | --- | --- | --- | --- |
| `expo-sqlite` ทุกแพลตฟอร์ม | ดีและตรงกับ Expo | เป็น alpha และต้องตั้ง header/WASM | ต้องสร้างเอง | โค้ด SQLร่วมได้มาก แต่เสี่ยงผูก Web กับของที่ยังไม่เสถียร |
| SQLite บน Mobile + IndexedDB บน Web หลัง repository interface | เรียบง่าย | ใช้ browser-native storage ที่แพร่หลาย | เพิ่ม adapter/sync ภายหลัง | **แนะนำ**; มี adapter สองชุด แต่แกนธุรกิจไม่ต้องเปลี่ยน |
| PowerSync ตั้งแต่ MVP | Offline และ reactive พร้อม | มี Web SDK | พร้อมกว่าเมื่อมี backend | เพิ่ม auth, backend connector, schema/sync rules และ dependency ก่อนจำเป็น |
| Supabase client โดยตรง | ต้องเขียน offline queue/cache เอง | ใช้ได้ดีเมื่อ online | เป็น backend ได้ | ไม่ใช่ offline-first database; network กลายเป็นส่วนของ use case เร็วเกินไป |

## โครงสร้างที่แนะนำ

```text
app/                         # Expo Router; composition และ route เท่านั้น
src/domain/                  # entity, value object, กฎคำนวณ; ห้าม import Expo/React
src/application/             # use case และ repository ports
src/database/
  migrations/               # migration มีเลข version และทดสอบได้
  sqlite/                    # Android adapter ของ repository
src/features/                # UI/controller แยกตาม feature
src/i18n/                    # translation catalogs และ locale selection
```

เมื่อเริ่ม Web ค่อยย้าย `domain` และ `application` เป็น workspace packages เช่น `packages/domain` และ `packages/application`; เพิ่ม `apps/web` กับ `src/database/indexeddb` โดยไม่ย้ายก่อนมี consumer ตัวที่สอง

UI เรียก use case เช่น `recordExpense()` และ `transferMoney()` เท่านั้น ไม่เรียก SQL โดยตรง Repository ต้องคืน domain object ไม่เปิดเผย row หรือชนิดของ SQLite การเขียนหลายตาราง เช่น transfer สองฝั่ง ต้องผ่าน `UnitOfWork`/transaction เดียว

## Seam ที่ต้องเตรียมตั้งแต่ MVP

1. ใช้ UUID แบบ string ที่สร้างบนอุปกรณ์ ห้ามพึ่ง auto-increment เป็น identity ระหว่างอุปกรณ์
2. เก็บจำนวนเงินเป็นจำนวนเต็มหน่วยสตางค์พร้อม `currencyCode` (`THB`) ไม่ใช้ floating point
3. ทุก record ที่อาจ sync มี `createdAt`, `updatedAt`, `version` และ `deletedAt` (tombstone); ยังไม่ต้องสร้าง network queue
4. แยก schema migration ออกจาก app startup logic และทำ backup เป็น JSON ที่มี `schemaVersion`; CSV เป็น export สำหรับอ่าน ไม่ใช่ไฟล์ restore
5. กำหนด repository ports สำหรับ Wallet, Transaction, Budget, FixedCost และ Settings พร้อม contract tests ที่ใช้ซ้ำกับ adapter ในอนาคต
6. เมื่อเปิด online phase ให้เพิ่ม `ownerId`, authentication และ sync adapter หลัง ports เดิม ก่อนเลือก conflict policy จากการทดลองจริง

สำหรับข้อมูลการเงิน หลีกเลี่ยงการใช้ “ค่าที่เขียนล่าสุดชนะ” แบบครอบจักรวาล: transfer ต้องคง atomicity และการลบข้ามอุปกรณ์ต้องใช้ tombstone จนทุกเครื่องรับทราบ จึงควรกำหนด conflict policy แยกตาม aggregate ใน phase sync

## ผลต่อการรองรับหลายภาษา

ใช้ `expo-localization` อ่าน locale บน Android/iOS/Web และใช้ translation library ที่รองรับ message catalog; Expo แนะนำไลบรารี เช่น `i18n-js`, `react-i18next` หรือ `react-intl` ([Expo Localization API](https://docs.expo.dev/versions/latest/sdk/localization/), [Localization guide](https://docs.expo.dev/guides/localization/))

- เริ่ม catalog `th` และมี fallback `en`; ห้ามเขียนข้อความไทยไว้ใน domain/use case
- เก็บ category/system status เป็น code เช่น `expense.food` ไม่เก็บคำว่า “อาหาร”; ชื่อที่ผู้ใช้ตั้งเองไม่แปล
- เก็บเวลาเป็นค่ามาตรฐานและเก็บ local civil date/time zone ที่จำเป็นต่อรอบงบประมาณ; แปลรูปแบบเฉพาะตอนแสดง
- format เงินด้วย `Intl.NumberFormat(locale, { style: 'currency', currency: record.currencyCode })` โดยไม่เดาสกุลเงินจาก locale เพราะ Expo ระบุว่าข้อมูล currency บน Web อาจเป็น `null`
- เตรียม layout ให้รองรับข้อความยาวและ RTL แม้ MVP เปิดเฉพาะภาษาไทย

## แผนเปลี่ยนผ่าน

### Phase 1 — Android offline MVP

สร้าง domain/application ports, SQLite adapter, migrations, backup/restore, CSV export และภาษาไทยพร้อม fallback อังกฤษ ไม่มี login หรือ network dependency

### Phase 2 — Web proof of concept

ทดสอบหนึ่ง vertical slice (Wallet + Transaction + Monthly Budget) บน Expo Web ใช้ IndexedDB adapter และรัน repository contract tests ชุดเดียวกัน ตัดสินใจภายหลังว่าจะใช้ UI ร่วมทั้งหมดหรือใช้ `.web.tsx` สำหรับ layout ที่ต่างกัน

### Phase 3 — Cloud sync

เลือก backend และ sync engine จาก prototype จริง เพิ่ม user ownership และ migration metadata หากเลือก PowerSync ให้แทน local adapter หลัง repository ports และใช้ SDK แยก Mobile/Web; หากสร้าง sync เอง ให้เพิ่ม outbox, cursor, retry, idempotency และ conflict tests ใน phase นี้เท่านั้น

## ความเสี่ยงและเงื่อนไขทบทวน

- Adapter สองชุดเพิ่มงานทดสอบ แต่ contract tests ลดความต่างของพฤติกรรมได้
- Browser storage มี quota/eviction และ same-origin constraints จึงต้องมี cloud/backup ก่อนให้ Web เป็นเครื่องหลัก
- ถ้า Expo SQLite Web ออกจาก alpha และผ่านการทดสอบ multi-tab/hosting ของโปรเจกต์ อาจลดเหลือ SQL adapter เดียวได้
- ถ้าต้อง sync หลายอุปกรณ์เร็วกว่าคาด ให้ทำ PowerSync proof of concept ก่อนเขียน sync protocol เอง

**Decision gist:** ทำ Android แบบ local-only ด้วย Expo SQLite หลัง repository ports; แชร์ pure TypeScript domain/application กับ Web และเพิ่ม Web storage กับ cloud sync เป็น adapter ใน phase ถัดไป
