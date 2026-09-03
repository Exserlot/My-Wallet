# Personal Finance

บริบทนี้กำหนดภาษากลางสำหรับการวางแผนและติดตามการเงินส่วนบุคคล เพื่อให้หน้าจอ กฎธุรกิจ เอกสาร และโค้ดใช้คำเดียวกันตลอดทั้งระบบ

## Language

**Wallet**:
แหล่งเก็บมูลค่าทางการเงินหนึ่งแหล่ง เช่น เงินสด บัญชีธนาคาร หรือ e-Wallet โดยผู้ใช้หนึ่งคนมีได้หลาย Wallet
_Avoid_: Account, Pocket, กระเป๋าธนาคาร

**Wallet Type**:
ประเภทของ Wallet ที่บอกลักษณะแหล่งเงิน เช่น Cash, Bank Account หรือ e-Wallet
_Avoid_: Wallet Category

**Transaction**:
เหตุการณ์ทางการเงินที่ใช้คำนวณยอดของ Wallet โดยเป็น Income, Expense, Transfer, Opening Balance หรือ Balance Adjustment อย่างใดอย่างหนึ่ง
_Avoid_: Record, Entry, Movement

**Opening Balance**:
ยอดเงินที่ Wallet มีอยู่ก่อนเริ่มติดตามในแอป ซึ่งใช้ตั้งยอดเริ่มต้นแต่ไม่ถือเป็น Income
_Avoid_: Initial Income, Deposit

**Balance Adjustment**:
รายการแก้ส่วนต่างระหว่างยอดในแอปกับยอดเงินจริง โดยมีเหตุผลกำกับและไม่ถือเป็น Income หรือ Expense
_Avoid_: Correction Income, Correction Expense

**Income**:
เงินที่เข้าสู่ระบบการเงินของผู้ใช้จากแหล่งภายนอก และทำให้มูลค่ารวมเพิ่มขึ้น
_Avoid_: Deposit, เงินเข้า

**Expense**:
เงินที่ออกจากระบบการเงินของผู้ใช้ไปยังบุคคลหรือบริการภายนอก และทำให้มูลค่ารวมลดลง
_Avoid_: Withdrawal, Payment, เงินออก

**Transfer**:
การย้ายเงินระหว่าง Wallet ของผู้ใช้ ซึ่งไม่ถือเป็น Income หรือ Expense และไม่เปลี่ยนมูลค่ารวม
_Avoid_: Income, Expense

**Expense Category**:
กลุ่มวัตถุประสงค์ของ Expense เช่น อาหาร เดินทาง หรือที่อยู่อาศัย
_Avoid_: Wallet Category, Budget

**Monthly Budget**:
แผนกำหนดวงเงิน Expense รวมของหนึ่งเดือน เพื่อใช้เป็นกรอบควบคุมการใช้เงิน
_Avoid_: Monthly Limit, Monthly Plan

**Budget Allocation**:
ส่วนของ Monthly Budget ที่จัดไว้ให้ Expense Category หนึ่งประเภท
_Avoid_: Fixed Cost, Category Limit

**Budget Cycle**:
ช่วงเวลาหนึ่งเดือนของ Monthly Budget ซึ่งเริ่มในวันที่ผู้ใช้กำหนดและสิ้นสุดก่อนวันเริ่มรอบถัดไป
_Avoid_: Calendar Month, Accounting Period

**Fixed Cost**:
Expense ที่คาดว่าจะเกิดซ้ำตามกำหนดและกัน Budget Allocation ไว้ล่วงหน้า แต่ยังไม่ถือเป็น Expense จริงจนกว่าจะยืนยันการจ่าย
_Avoid_: Subscription, Budget Allocation, Recurring Transaction

**Bank Slip**:
หลักฐานดิจิทัลจากธนาคารไทยสำหรับการโอนหรือชำระเงิน ซึ่งใช้ช่วยกรอกข้อมูลก่อนที่ผู้ใช้จะตรวจและยืนยันรายการ
_Avoid_: Paper Receipt, Invoice
