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
กลุ่มวัตถุประสงค์ของ Expense เช่น อาหาร เดินทาง หรือที่อยู่อาศัย โดย Expense อาจยังไม่ระบุหมวดได้ ส่วน Income ห้ามใช้ Expense Category หมวดที่ Archive แล้วไม่ใช้กับรายการใหม่แต่ยังแสดงชื่อในประวัติเดิม
_Avoid_: Wallet Category, Budget

**Monthly Budget**:
แผนกำหนดวงเงิน Expense รวมของหนึ่งเดือน เพื่อใช้เป็นกรอบควบคุมการใช้เงิน
_Avoid_: Monthly Limit, Monthly Plan

**Budget Allocation**:
ส่วนของ Monthly Budget ที่จัดไว้ให้ Expense Category หนึ่งประเภท
_Avoid_: Fixed Cost, Category Limit

**Unallocated Budget**:
ส่วนของ Monthly Budget ที่ยังไม่ได้จัดให้ Expense Category ใด และยังคงเป็นพื้นที่สำรองของ Budget Cycle นั้น
_Avoid_: Savings, Remaining Balance, Budget Allocation

**Overcommitted Budget**:
สถานะของ Budget Cycle ที่ยอด Fixed Cost ซึ่งต้องกันไว้สูงกว่า Monthly Budget ทำให้ Unallocated Budget ติดลบ เพื่อแสดงภาระที่เกินงบโดยไม่ซ่อนหรือตัดรายการออก
_Avoid_: Overspent Budget, Negative Wallet Balance

**Budget Cycle**:
ช่วงเวลาหนึ่งเดือนของ Monthly Budget ซึ่งเริ่มในวันที่ผู้ใช้กำหนดและสิ้นสุดก่อนวันเริ่มรอบถัดไป
_Avoid_: Calendar Month, Accounting Period

**Fixed Cost**:
Expense ที่คาดว่าจะเกิดซ้ำตามกำหนดและกัน Budget Allocation ไว้ล่วงหน้า แต่ยังไม่ถือเป็น Expense จริงจนกว่าจะยืนยันการจ่าย
_Avoid_: Subscription, Budget Allocation, Recurring Transaction

**Fixed Cost Schedule**:
กฎที่กำหนดชื่อ หมวด ยอดประมาณการ Payment Wallet ความถี่ วันครบกำหนด และการแจ้งเตือนของ Fixed Cost โดยสามารถ Archive เพื่อหยุดสร้างรายการในอนาคตโดยยังเก็บประวัติเดิมไว้
_Avoid_: Fixed Cost Occurrence, Transaction

**Fixed Cost Occurrence**:
Fixed Cost หนึ่งครั้งที่เกิดจาก Fixed Cost Schedule มีวันครบกำหนด สถานะ และยอดจริงของตนเอง
_Avoid_: Fixed Cost Schedule, Automatic Expense

**Payment Wallet**:
Wallet ที่กำหนดไว้เป็นแหล่งจ่ายเริ่มต้นของ Fixed Cost โดยยังไม่ถูกหักยอดจนกว่าจะยืนยันการจ่ายจริง
_Avoid_: Reserved Wallet, Budget Wallet

**Shopping List**:
รายการรวมของ Planned Purchase ที่ผู้ใช้อยากได้หรือต้องซื้อในอนาคต โดยไม่ผูกกับ Budget Cycle และไม่มีผลต่อ Budget หรือยอด Wallet จนกว่าจะซื้อจริง
_Avoid_: Monthly Budget, Expense List, Cart

**Planned Purchase**:
สินค้าหนึ่งรายการใน Shopping List ซึ่งเก็บรายละเอียดและราคาประมาณเพื่อช่วยวางแผน และเปลี่ยนเป็นส่วนหนึ่งของ Expense เมื่อผู้ใช้ยืนยันว่าซื้อแล้ว
_Avoid_: Expense, Fixed Cost, Budget Allocation

**Attention Item**:
สถานะทางการเงินที่ยังต้องให้ผู้ใช้ตรวจหรือจัดการ เช่น Fixed Cost ที่ใกล้ครบกำหนดหรือ Budget Allocation ที่ใกล้เต็ม โดยยังคงอยู่แม้ผู้ใช้จะอ่านการแจ้งเตือนแล้วจนกว่าสถานะต้นเหตุจะสิ้นสุด
_Avoid_: Notification, Transaction, Reminder

**Bank Slip**:
หลักฐานดิจิทัลจากธนาคารไทยสำหรับการโอนหรือชำระเงิน ซึ่งใช้ช่วยกรอกข้อมูลก่อนที่ผู้ใช้จะตรวจและยืนยันรายการ
_Avoid_: Paper Receipt, Invoice
