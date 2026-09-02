# วิจัยเส้นทางสร้าง ติดตั้ง และอัปเดต APK

วันที่ตัดสินใจ: 3 กันยายน 2026  
Issue: [#13](https://github.com/Exserlot/My-Wallet/issues/13)

## คำตัดสิน

สำหรับ My Wallet รุ่น Android ที่ใช้ส่วนตัว ให้พัฒนาด้วย Expo development build บนเครื่อง และใช้ **EAS Build แบบ cloud** สร้าง APK ที่เซ็นแล้วสำหรับติดตั้งจริง โดยแยกหน้าที่เป็น 3 โปรไฟล์:

- `development` — มี `expo-dev-client` ใช้กับ Metro เพื่อพัฒนาและ debug ไม่ใช่ไฟล์ส่งมอบ
- `preview` — APK แบบ standalone สำหรับติดตั้งและทดสอบเหมือนใช้งานจริง
- `production` — AAB สำหรับ Google Play ในอนาคต ไม่ใช้ติดตั้งตรงบนเครื่อง

Expo ระบุว่า `npx expo run:android` จะ compile, ติดตั้ง debug build และเปิด Metro ส่วนการแก้เฉพาะ JavaScript/TypeScript หลังจากนั้นใช้ `npx expo start` ได้ โดยต้อง rebuild เมื่อ native dependency หรือ app config ที่กระทบ native เปลี่ยน ([Expo: local app development](https://docs.expo.dev/guides/local-app-development/)). EAS สร้าง Android เป็น AAB โดยปริยาย ซึ่งติดตั้งตรงไม่ได้; `distribution: "internal"` หรือ `android.buildType: "apk"` ทำให้ได้ APK ([Expo: build APKs](https://docs.expo.dev/build-reference/apk/)).

เส้นทางใช้งานที่แนะนำ:

```text
พัฒนาประจำวัน -> npx expo run:android / npx expo start
ทดสอบก่อนปล่อย -> eas build -p android --profile preview -> ติดตั้ง APK บนเครื่องจริง
ขึ้น Play ภายหลัง -> eas build -p android --profile production -> ส่ง AAB เข้า Play
```

บน Windows ไม่ควรใช้ `eas build --local` เป็นเส้นทาง release หลัก เพราะ Expo รองรับ local EAS Build อย่างเป็นทางการบน macOS/Linux เท่านั้น; WSL ยังไม่ได้รับการทดสอบหรือรองรับ ใช้ EAS cloud จึงตรงและทำซ้ำง่ายกว่า ([Expo: local EAS builds](https://docs.expo.dev/build-reference/local-builds/)).

## การตั้งค่าเสนอแนะ

เมื่อเริ่ม implement ให้ปรับเลขเวอร์ชัน EAS CLI ตามรุ่นที่ทดสอบจริง และเพิ่ม config แนวนี้:

```json
{
  "cli": {
    "version": "<pin-tested-eas-cli-version>",
    "requireCommit": true
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "environment": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "environment": "preview",
      "android": { "buildType": "apk" }
    },
    "production": {
      "channel": "production",
      "environment": "production",
      "autoIncrement": true
    }
  }
}
```

ชื่อโปรไฟล์ไม่มีความหมายพิเศษ; คุณสมบัติข้างในเป็นตัวกำหนดผลลัพธ์ Expo แนะนำ 3 โปรไฟล์นี้ โดย preview ไม่มีเครื่องมือพัฒนาและเหมาะกับการทดสอบแบบ production-like ส่วน production ใช้ส่ง store ([Expo: `eas.json`](https://docs.expo.dev/build/eas-json/)). กำหนด `android.package` ครั้งเดียวและอย่าเปลี่ยนโดยไม่ตั้งใจ เพราะ application ID ใช้ระบุตัวแอป ([Expo: build configuration](https://docs.expo.dev/build-reference/build-configuration/)).

## Signing และความเป็นเจ้าของ keystore

ให้ EAS สร้างและจัดเก็บ Android credentials แบบ `remote` ได้ในช่วงแรก แต่ **เจ้าของ repository ต้องดาวน์โหลดสำรอง** keystore, alias และรหัสผ่านผ่าน `eas credentials` แล้วเก็บแบบเข้ารหัสอย่างน้อยสองตำแหน่งนอก Git หลัง build แรกสำเร็จ EAS รองรับทั้ง credentials ที่จัดการให้และ `credentials.json` ของผู้ใช้ ([Expo: app credentials](https://docs.expo.dev/app-signing/app-credentials/), [Expo: local credentials](https://docs.expo.dev/app-signing/local-credentials/)).

APK รุ่นใหม่จะติดตั้งทับรุ่นเดิมได้เมื่อ application ID ตรงกัน, certificate ตรงกัน (หรือมี proof-of-rotation) และ `versionCode` ไม่ต่ำกว่าเดิม หากไม่ผ่าน ผู้ใช้ต้องถอนแอปเดิมซึ่งลบข้อมูลแอป ([Android: how app updates work](https://developer.android.com/google/play/app-updates)). ดังนั้นห้าม commit keystore, `credentials.json`, รหัสผ่าน หรือ signing properties และห้ามสร้าง key ใหม่แบบไม่ตั้งใจ การเสีย private key ของ APK ที่แจกนอก Play อาจทำให้ไม่สามารถอัปเดตการติดตั้งเดิมได้ ([Android: sign your app](https://developer.android.com/studio/publish/app-signing)).

หากขึ้น Google Play ภายหลัง ให้ใช้ Play App Signing และเก็บ upload key แยกตามแนวทาง Android; AAB รุ่น production ยังคงต้องถูกเซ็นก่อนอัปโหลด ([Android: App Bundle FAQ](https://developer.android.com/guide/app-bundle/faq)).

## ขอบเขต OTA update

EAS Update ใช้อัปเดต JavaScript และ assets ที่เข้ากับ native runtime เดิม ไม่สามารถแทน APK ใหม่เมื่อเพิ่ม/อัปเดต native library, เปลี่ยน native configuration หรืออัปเกรด Expo SDK เพราะ native code ถูกฝังอยู่ใน binary ([Expo: runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)).

ให้ตั้ง `runtimeVersion: { "policy": "fingerprint" }` เพื่อลดโอกาสส่ง update ให้ binary ที่ native runtime ไม่ตรงกัน แยก `preview` กับ `production` channel และทดสอบ update บน preview ที่ runtime เดียวกันก่อน promote ไป production ([Expo: get started with EAS Update](https://docs.expo.dev/eas-update/getting-started/)). สำหรับ MVP ยังไม่จำเป็นต้องเปิด OTA ตั้งแต่วันแรก; signed APK แบบเต็มเป็นเส้นทางกู้คืนที่ต้องคงไว้เสมอ

## Secrets และข้อมูลส่วนตัว

- ค่า `EXPO_PUBLIC_*` ถูกฝังใน client bundle และผู้ติดตั้งอ่านได้ จึงใช้ได้เฉพาะค่าที่เปิดเผยได้ เช่น API base URL
- token ของ OCR หรือบริการที่ต้องลับจริงห้ามฝังใน APK; ต้องเรียกผ่าน backend หรือกลไก public-client ของผู้ให้บริการ
- แยก environment เป็น development/preview/production และเก็บ `.env*`, keystore, `credentials.json`, สลิปจริง และข้อมูลการเงินนอก Git
- EAS `Secret` ช่วยปิดค่าจาก logs/build runner แต่ไม่ทำให้ค่าที่สุดท้ายถูกฝังในแอปกลายเป็นความลับ ([Expo: EAS environment variables](https://docs.expo.dev/eas/environment-variables/)).

## ทำให้ build ทำซ้ำและตรวจสอบย้อนกลับได้

1. Commit lockfile และติดตั้งด้วย `npm ci`.
2. Pin Expo SDK, React Native, Node และ EAS CLI ที่ผ่านการทดสอบ; แชร์ค่าพื้นฐานระหว่าง profiles ด้วย `extends` เมื่อเริ่มมี config ซ้ำ ([Expo: configure EAS Build](https://docs.expo.dev/build/eas-json/)).
3. เปิด `cli.requireCommit`; build เฉพาะ clean commit และบันทึก commit SHA, app version, `versionCode`, profile, environment และ EAS build ID/URL.
4. ใช้ environment เดียวกันใน build และ update; ทดสอบ release mode ด้วย `npx expo run:android --variant release` เมื่อวิเคราะห์ปัญหา ([Expo: troubleshoot builds](https://docs.expo.dev/build-reference/troubleshooting/)).
5. CI เป็นทางเลือก ไม่ใช่เงื่อนไข MVP เริ่มจาก manual build ให้สำเร็จก่อน หากเพิ่ม CI ภายหลังให้ใช้ `EXPO_TOKEN`, `npm ci` และ `eas build --non-interactive`; Expo กำหนดให้ทำ interactive build สำเร็จอย่างน้อยหนึ่งครั้งเพื่อเตรียม project/credentials ก่อน ([Expo: builds on CI](https://docs.expo.dev/build/building-on-ci/)).

## Release acceptance gates

APK จะถือว่า “พร้อมติดตั้งจริง” เมื่อผ่านครบ:

- Git working tree สะอาด และ lint, tests, `npx expo-doctor`, `npx expo export` ผ่าน
- EAS สร้าง signed standalone APK จาก `preview` สำเร็จ พร้อมบันทึก SHA/version/profile/build URL
- ติดตั้งบน Android เครื่องจริงและเปิดใช้ได้โดยไม่พึ่ง Metro, USB หรือเครื่องพัฒนา
- ทดสอบ offline, สร้าง/แก้/ลบรายการ, ปิดเปิดแอปแล้วข้อมูลยังอยู่, export, backup และ restore
- ทดสอบอัปเกรด: ติดตั้ง v1 -> สร้างข้อมูล -> ติดตั้ง v2 ทับโดยไม่ถอน v1 -> ข้อมูลและ migration ยังถูกต้อง
- ตรวจว่า artifact, repository และ logs ไม่มี secret, keystore, สลิปจริง หรือข้อมูลการเงินจริง
- ดาวน์โหลดและตรวจเข้าถึง backup ของ signing credentials ได้จริง
- หากแชร์ build URL ให้จำกัดผู้เข้าถึง เพราะลิงก์ internal distribution อาจเปิดแก่ผู้ที่มี URL ตามการตั้งค่าโครงการ ([Expo: internal distribution](https://docs.expo.dev/build/internal-distribution/)).

## สิ่งที่ยังไม่ทำใน MVP

- ไม่ทำ Google Play publishing/auto-submit จนกว่าจะต้องการแจกผ่าน store
- ไม่เปิด CI เพียงเพื่อสร้าง APK ของผู้ใช้คนเดียว
- ไม่ใช้ OTA กับการเปลี่ยน native code
- ไม่เก็บ signing key หรือ secret ใน repository

แนวทางนี้ทำให้ติดตั้งใช้เองได้เร็ว โดยยังรักษาทางอัปเดต APK เดิมและไม่ปิดทางย้ายไป AAB/Google Play หรือเพิ่มเว็บในอนาคต
