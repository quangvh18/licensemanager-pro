# Script để fix lỗi GitHub authentication
Write-Host "=== Fix GitHub Authentication ===" -ForegroundColor Yellow
Write-Host ""

# Tìm và xóa GitHub credentials từ Windows Credential Manager
Write-Host "Dang tim credentials GitHub..." -ForegroundColor Cyan

# Lấy danh sách credentials
$credentials = cmdkey /list 2>$null | Select-String -Pattern "github" -CaseSensitive:$false

if ($credentials) {
    Write-Host "Tim thay credentials GitHub. Dang xoa..." -ForegroundColor Yellow
    # Xóa từng credential GitHub
    $credentials | ForEach-Object {
        $target = ($_ -split "Target:")[1].Trim()
        if ($target) {
            Write-Host "Xoa: $target" -ForegroundColor Gray
            cmdkey /delete:"$target" 2>$null
        }
    }
    Write-Host "Da xoa credentials cu!" -ForegroundColor Green
} else {
    Write-Host "Khong tim thay credentials GitHub trong Windows Credential Manager." -ForegroundColor Yellow
    Write-Host "Credentials co the duoc luu trong Git Credential Manager." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Buoc tiep theo ===" -ForegroundColor Cyan
Write-Host "1. Tao Personal Access Token tai: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "2. Chon quyen 'repo' va generate token" -ForegroundColor White
Write-Host "3. Chay lenh sau (thay YOUR_TOKEN):" -ForegroundColor White
Write-Host "   git remote set-url origin https://YOUR_TOKEN@github.com/quangvh18/licensemanager-pro.git" -ForegroundColor Green
Write-Host "4. Push lai: git push -u origin main" -ForegroundColor Green
Write-Host ""
Write-Host "Hoac ban co the push ngay bay gio, Git se yeu cau nhap token moi." -ForegroundColor Yellow

