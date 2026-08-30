# استخدام نسخة خفيفة وسريعة من Node.js
FROM node:20-alpine

# تحديد مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات تعريف المشروع أولاً لتسريع التثبيت
COPY package*.json ./

# تثبيت المكتبات (Express, Socket.io, Gemini) داخل الحاوية فقط
RUN npm install

# نسخ باقي ملفات المشروع
COPY . .

# فتح البورت 3000
EXPOSE 3000

# أمر تشغيل السيرفر
CMD ["node", "server.js"]