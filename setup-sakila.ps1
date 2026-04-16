# Script para importar la base de datos Sakila en MySQL/MariaDB (XAMPP)
# Ejecutar: .\setup-sakila.ps1

$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
$projectDir = $PSScriptRoot

Write-Host "=== Setup Sakila Database ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que MySQL/MariaDB existe
if (-not (Test-Path $mysqlPath)) {
    Write-Host "ERROR: No se encontro MySQL en $mysqlPath" -ForegroundColor Red
    Write-Host "Asegurate de tener XAMPP instalado o ajusta la ruta en este script." -ForegroundColor Yellow
    exit 1
}

# Importar schema
Write-Host "Importando schema (tablas)..." -ForegroundColor Yellow
& $mysqlPath -u root -e "SOURCE $projectDir\sakila-schema.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al importar schema" -ForegroundColor Red
    exit 1
}
Write-Host "Schema importado OK" -ForegroundColor Green

# Importar datos
Write-Host "Importando datos (puede tardar 1-2 minutos)..." -ForegroundColor Yellow
& $mysqlPath -u root -e "SOURCE $projectDir\sakila-data.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al importar datos" -ForegroundColor Red
    exit 1
}
Write-Host "Datos importados OK" -ForegroundColor Green

Write-Host ""
Write-Host "=== Sakila listo! ===" -ForegroundColor Cyan
Write-Host "Conecta con: mysql -u root sakila" -ForegroundColor White
Write-Host "O usa phpMyAdmin: http://localhost/phpmyadmin" -ForegroundColor White
