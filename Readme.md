1. npm install
2. create .env (from discord)
3. optional: แก้ port ต่างๆ ได้ที่ .env
4. docker-compose up -d --build
5. เข้า pg admin ใช้ email,password ใน .env
6. สำหรับดู database ผ่าน pgadmin
   6.1 add new server
   6.2 บนtab general ตั้ง name อะไรก็ได้
   6.3 บนtab connection: host name/address= db, username/password ดูใน .env POSTGRES_USER,POSTGRES_PASSWORD
   6.4 ไปดู table ได้ที่ Server>xxxx>twinderdb>Schemas>Table
   6.5 โดยสามารถ click ขวาที่table ต่างๆ แล้วกด View/edit data เพื่อดูได้

kingking

i have this folder database,environment variable,middleware,models,public,routes,server,services,tests,utils,views
