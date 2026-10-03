---
name: react-tailwind-ui-standards
description: Enforce modern, accessible, responsive React 18 and Tailwind CSS v3 UI code standards. Use when creating, refactoring, or reviewing React components, pages, modals, tables, forms, layouts, or dashboards with dark/light mode and Lucide icons.
---

# React Tailwind UI Standards

Standardized frontend design and engineering guidelines for building clean, minimal, accessible, and high-performance user interfaces using React 18, TypeScript, and Tailwind CSS v3.

## 1. บทบาทและหลักการพื้นฐาน (Core Principles)
- **Minimalist & Purposeful:** ออกแบบหน้าตาให้คลีน เรียบหรู ใช้งานง่าย จัดวาง Spacing ให้พอดี Typography คมชัด
- **Zero Bloat (Tailwind-native):** เขียน Custom Component ด้วย React + Tailwind CSS v3 100% ไม่ติดตั้ง Component Library สำเร็จรูปที่หนักเกินจำเป็น (เช่น Material UI, Ant Design, Chakra UI) เพื่อรักษา Bundle size และความเร็วสูงสุด
- **Iconography:** ใช้ `lucide-react` เสมอ กำหนดขนาดที่ชัดเจน และมีข้อความกำกับหรือ `aria-label` สำหรับ Screen Reader
- **Full Dual-Theme Support:** ทุกหน้าและทุก Component ต้องรองรับทั้ง **Light Mode** และ **Dark Mode** อย่างสมบูรณ์ผ่านคลาส `dark:`

---

## 2. Design Tokens และชุดสี (Color Palette)

### โทนสีกลาง (Neutrals - Slate)
- **Light Background:** `bg-slate-50` หรือ `bg-white`
- **Dark Background:** `dark:bg-slate-900` หรือ `dark:bg-slate-950`
- **Card / Surface:** `bg-white dark:bg-slate-800/80`
- **ข้อความหลัก:** `text-slate-900 dark:text-slate-100`
- **ข้อความรอง/คำอธิบาย:** `text-slate-500 dark:text-slate-400`
- **เส้นขอบ (Borders):** `border-slate-200 dark:border-slate-700/60`

### สีเน้นและแอกชันหลัก (Brand & Accent - Amber & Indigo)
- **Primary Action (ปุ่มหลัก / Focus ring):** `bg-amber-500 hover:bg-amber-600 text-slate-950`, `focus:ring-amber-500`
- **Secondary Action (ปุ่มรอง / Navigation):** `bg-indigo-600 hover:bg-indigo-700 text-white`, `focus:ring-indigo-500`

### สีสถานะและแจ้งเตือน (Status - Emerald & Rose)
- **สำเร็จ / เปิดใช้งาน:**
  - Light: `bg-emerald-50 text-emerald-700 border-emerald-200`
  - Dark: `dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800`
- **ข้อผิดพลาด / ยกเลิก:**
  - Light: `bg-rose-50 text-rose-700 border-rose-200`
  - Dark: `dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800`

### เทคนิคตกแต่งสมัยใหม่ (Glassmorphism & Shadows)
- **Glass Effect:** `backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/50`
- **เงา (Elevation):** เน้นเงานุ่มนวล ละมุน (`shadow-sm`, `shadow-md`, `shadow-xl`) ไม่ใช้เงาที่ทึบหรือเข้มจนเกินไป

### แบบอักษร (Typography)
- ใช้ฟอนต์ **Inter** ร่วมกับ System UI Fonts
- **หัวข้อ (Headings):** `font-semibold text-slate-900 dark:text-slate-100 tracking-tight`
- **เนื้อหา (Body):** `text-sm text-slate-600 dark:text-slate-300 leading-relaxed`
- **ป้ายกำกับ (Labels):** `text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider`

---

## 3. มาตรฐานการเข้าถึงและโครงสร้าง (Accessibility & Semantic HTML)

1. **Semantic Tags:** ใช้แท็กโครงสร้างมาตรฐาน W3C เสมอ เช่น `<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
2. **Interactive Elements:**
   - ปุ่มกดต้องใช้แท็ก `<button type="button | submit">` เสมอ **ห้ามใช้ `<div onClick>`** เพื่อให้รองรับ Keyboard Navigation (Tab, Enter, Space)
   - ฟอร์ม Input ต้องมี `<label>` ที่ผูกกับ `id` และ `htmlFor` ชัดเจน
3. **Focus States:** ทุกปุ่มและช่อง Input ต้องมี Focus Ring เด่นชัด เช่น:
   `focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900`
4. **Color Contrast (WCAG 2.1 AA):** ค่า Contrast อัตราส่วนขั้นต่ำ 4.5:1 สำหรับข้อความปกติ
5. **Screen Reader Support:**
   - ปุ่มที่มีเฉพาะไอคอนต้องใส่ `aria-label` เสมอ (เช่น `<button aria-label="ปิดหน้าต่าง">`)
   - ไอคอนตกแต่งให้ใส่ `aria-hidden="true"`

---

## 4. Responsive Web Design (Mobile-First)

- พัฒนาแบบ **Mobile-First** เริ่มจากจอมือถือ แล้วขยายสู่ Breakpoints:
  - `sm:` (640px+): มือถือแนวนอน
  - `md:` (768px+): แท็บเล็ต
  - `lg:` (1024px+): แล็ปท็อป / หน้าจอคอมพิวเตอร์
  - `xl:` (1280px+): หน้าจอขนาดใหญ่
- **Responsive Navigation:** บนมือถือใช้ Drawer หรือเมนูแบบย่อ ส่วน Desktop แสดง Sidebar ด้านซ้ายแบบคงที่
- **ตารางข้อมูล (Data Table / Timetable):** ต้องครอบด้วยคอนเทนเนอร์ `overflow-x-auto` ป้องกันตารางล้นจอเมื่อเปิดบนมือถือ
- **Grid Layout:** ปรับตามขนาดหน้าจออัตโนมัติ เช่น `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- **Touch Targets:** พื้นที่สัมผัสสำหรับปุ่มบนมือถือต้องมีขนาดไม่น้อยกว่า 44x44px

---

## 5. ข้อควรระวัง (Gotchas)
- **ห้ามใส่สี Light Mode โดยไม่มี Dark Mode คู่กัน:** หลีกเลี่ยง `bg-white` หรือ `text-black` เดี่ยวๆ ให้ใส่ `dark:bg-slate-800` และ `dark:text-slate-100` เสมอ
- **ห้ามตัด Focus Outline โดยไม่มี Ring ทดแทน:** การใช้ `focus:outline-none` ต้องมี `focus:ring-2 focus:ring-amber-500` ควบคู่เสมอ
- **ห้ามใช้ `<div onClick>`:** ทำลายความสามารถด้านการเข้าถึงและคีย์บอร์ดทั้งหมด
- **ตารางต้องมี `overflow-x-auto`:** เพื่อป้องกันปัญหาเลย์เอาต์แตกบนหน้าจอมือถือ
- **ไม่ติดตั้งไลบรารี Component หนักๆ เพิ่ม:** ให้ใช้ประโยชน์จาก Tailwind utility classes ในการสร้าง Vanilla React components
