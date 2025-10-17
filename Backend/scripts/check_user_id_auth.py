#!/usr/bin/env python3
"""
Script để kiểm tra và cập nhật tất cả các user_id mặc định thành current_user
"""

import os
import re
from pathlib import Path

def find_hardcoded_user_ids():
    """Tìm tất cả các hardcoded user_id trong code"""
    
    patterns = [
        r'user_id.*=.*1(?!\d)',  # user_id = 1 (không phải 10, 11, etc.)
        r'user_id: int = 1',
        r'created_by=1',
        r'"user_id":\s*1',
        r'Form\(1\)',
    ]
    
    backend_path = Path(__file__).parent.parent
    files_to_check = []
    
    # Tìm tất cả file Python trong backend
    for root, dirs, files in os.walk(backend_path):
        # Bỏ qua thư mục __pycache__, venv, etc.
        dirs[:] = [d for d in dirs if not d.startswith(('.', '__pycache__', 'venv'))]
        
        for file in files:
            if file.endswith('.py'):
                file_path = Path(root) / file
                files_to_check.append(file_path)
    
    findings = []
    
    for file_path in files_to_check:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    for pattern in patterns:
                        if re.search(pattern, line):
                            findings.append({
                                'file': str(file_path.relative_to(backend_path)),
                                'line': i,
                                'content': line.strip(),
                                'pattern': pattern
                            })
        except Exception as e:
            print(f"⚠️  Lỗi đọc file {file_path}: {e}")
    
    return findings

def analyze_router_endpoints():
    """Phân tích các endpoint trong router để xem cần auth không"""
    
    backend_path = Path(__file__).parent.parent
    router_path = backend_path / 'routers'
    
    endpoints_need_auth = []
    
    if router_path.exists():
        for router_file in router_path.glob('*.py'):
            try:
                with open(router_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Tìm các endpoint
                    endpoint_pattern = r'@router\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']\)'
                    endpoints = re.findall(endpoint_pattern, content)
                    
                    for method, path in endpoints:
                        # Kiểm tra xem endpoint có sử dụng get_current_user không
                        has_auth = 'get_current_user' in content or 'current_user' in content
                        has_hardcoded_user = any(pattern in content for pattern in [
                            'user_id = 1', 'user_id: int = 1', 'Form(1)', '"user_id": 1'
                        ])
                        
                        if has_hardcoded_user and not has_auth:
                            endpoints_need_auth.append({
                                'file': router_file.name,
                                'method': method.upper(),
                                'path': path,
                                'has_auth': has_auth,
                                'has_hardcoded_user': has_hardcoded_user
                            })
                            
            except Exception as e:
                print(f"⚠️  Lỗi đọc router {router_file}: {e}")
    
    return endpoints_need_auth

def generate_update_recommendations():
    """Tạo các đề xuất cập nhật"""
    
    print("🔍 Đang tìm kiếm các hardcoded user_id...")
    findings = find_hardcoded_user_ids()
    
    print(f"\n📋 Tìm thấy {len(findings)} vị trí cần cập nhật:\n")
    
    for finding in findings:
        print(f"📄 {finding['file']}:{finding['line']}")
        print(f"   Code: {finding['content']}")
        print(f"   Pattern: {finding['pattern']}")
        print()
    
    print("🔍 Đang phân tích các router endpoint...")
    endpoints = analyze_router_endpoints()
    
    if endpoints:
        print(f"\n🚨 Tìm thấy {len(endpoints)} endpoint cần thêm authentication:\n")
        
        for endpoint in endpoints:
            print(f"🌐 {endpoint['method']} {endpoint['path']}")
            print(f"   File: {endpoint['file']}")
            print(f"   Có auth: {endpoint['has_auth']}")
            print(f"   Có hardcoded user: {endpoint['has_hardcoded_user']}")
            print()
    
    print("\n💡 Đề xuất các bước cập nhật:")
    print("1. Thêm 'from core.auth import get_current_user' vào các router")
    print("2. Thêm 'current_user: User = Depends(get_current_user)' vào function parameters")  
    print("3. Thay thế hardcoded user_id bằng 'current_user.id'")
    print("4. Loại bỏ user_id từ request models nếu không cần")
    print("5. Cập nhật frontend để gửi token trong Authorization header")
    
    print(f"\n📊 Tổng kết:")
    print(f"   - {len(findings)} vị trí có hardcoded user_id")
    print(f"   - {len(endpoints)} endpoint cần thêm auth")
    
    return findings, endpoints

if __name__ == "__main__":
    print("🔧 User ID Authentication Update Checker")
    print("=" * 50)
    
    try:
        findings, endpoints = generate_update_recommendations()
        
        if findings or endpoints:
            print("\n✅ Kiểm tra hoàn tất! Vui lòng xem các đề xuất ở trên.")
        else:
            print("\n🎉 Tuyệt vời! Không tìm thấy hardcoded user_id nào!")
            
    except Exception as e:
        print(f"\n❌ Lỗi khi chạy script: {e}")