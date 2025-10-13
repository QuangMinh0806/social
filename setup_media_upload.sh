#!/bin/bash

# Script cài đặt dependencies cho Media Upload Feature

echo "=== Cài đặt Backend Dependencies ==="
cd Backend

# Cài đặt python-multipart và Pillow
pip install python-multipart==0.0.6
pip install Pillow==10.1.0

# Hoặc cài đặt toàn bộ từ requirements.txt
# pip install -r requirements.txt

# Tạo thư mục uploads
mkdir -p uploads/image uploads/video uploads/gif

echo "✅ Backend dependencies đã được cài đặt"
echo "✅ Thư mục uploads đã được tạo"

echo ""
echo "=== Khởi động Backend ==="
echo "Chạy lệnh sau để start server:"
echo "python main.py"
echo ""
echo "Hoặc với uvicorn:"
echo "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

cd ..

echo ""
echo "=== Frontend ==="
echo "Frontend đã sẵn sàng, không cần cài đặt thêm package"
echo "Chạy lệnh sau để start frontend:"
echo "cd Frontend && npm run dev"

echo ""
echo "=== Hoàn tất ==="
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
