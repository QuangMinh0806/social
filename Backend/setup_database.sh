#!/bin/bash
# Script tự động setup database cho Linux/Mac
# Chạy script này: ./setup_database.sh

echo "================================"
echo "Database Setup Script"
echo "================================"
echo ""

# Kiểm tra Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ $PYTHON_VERSION"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo "✓ $PYTHON_VERSION"
    PYTHON_CMD="python"
else
    echo "✗ Python not found! Please install Python 3.8+"
    exit 1
fi

# Kiểm tra PostgreSQL
echo "Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    echo "✓ $PG_VERSION"
else
    echo "⚠ PostgreSQL not found in PATH"
    echo "  Make sure PostgreSQL is installed and running"
fi

echo ""
echo "Installing dependencies..."
$PYTHON_CMD -m pip install -r requirements.txt

echo ""
echo "Setting up database..."
$PYTHON_CMD init_db.py

echo ""
echo "================================"
echo "Setup completed!"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Update database connection in config/database.py"
echo "  2. Run: $PYTHON_CMD main.py"
echo "  3. Open: http://localhost:8000/docs"
