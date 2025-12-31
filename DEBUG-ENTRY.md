# Debug Guide - Entry Page Issues

## วิธีตรวจสอบปัญหา

### 1. เปิด Developer Tools บนมือถือ

**iOS Safari:**
1. เปิด Settings → Safari → Advanced → Web Inspector
2. เชื่อมต่อกับ Mac
3. เปิด Safari บน Mac → Develop → [Your iPhone] → [Page]

**Android Chrome:**
1. เปิด Chrome บน PC
2. พิมพ์ `chrome://inspect`
3. เชื่อมต่อมือถือผ่าน USB
4. คลิก "inspect" ที่หน้าเว็บ

### 2. ตรวจสอบ Console Errors

ดูว่ามี error อะไรใน Console:
- Network errors (API calls failed)
- JavaScript errors
- CORS errors

### 3. ตรวจสอบ Network Tab

ดูว่า API calls ส่งไปหรือไม่:
- POST `/api/transactions` - สำหรับเพิ่มข้อมูล
- Status code ควรเป็น 200 หรือ 201

---

## ปัญหาที่เป็นไปได้

### ปัญหา 1: CategorySelect ไม่ทำงาน
- Component อาจไม่แสดงบนมือถือ
- Dropdown ไม่เปิด

### ปัญหา 2: DatePicker ไม่ทำงาน  
- react-datepicker อาจมีปัญหาบนมือถือ
- Calendar ไม่เปิด

### ปัญหา 3: API Call Failed
- Vite proxy ไม่ทำงาน
- CORS issues
- Network timeout

### ปัญหา 4: Form Validation
- Required fields ไม่ผ่าน
- Input values ไม่ถูก set

---

## วิธีแก้ชั่วคราว

ผมได้สร้าง Entry page แบบง่ายไว้ที่ `Entry-Simple.jsx` ที่:
- ใช้ `<select>` ธรรมดาแทน CategorySelect
- ใช้ `<input type="date">` แทน DatePicker
- ไม่มี fancy components

ถ้าต้องการทดสอบ ให้เปลี่ยนชื่อไฟล์:
```powershell
cd c:\income-expense-tracker\client\src\pages
mv Entry.jsx Entry-Original.jsx
mv Entry-Simple.jsx Entry.jsx
```

---

## ข้อมูลที่ต้องการ

กรุณาบอกผมว่า:
1. **คลิกที่ช่องไหนแล้วไม่ทำงาน?**
   - Amount
   - Category
   - Date
   - Note

2. **มี error message แสดงไหม?**

3. **ปุ่ม Submit กดได้ไหม?**

4. **ถ้าเปิด Developer Tools ได้ มี error อะไรใน Console?**
