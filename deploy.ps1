# ============================================
# AUTO DEPLOY TO GITHUB
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AUTO DEPLOY TO GITHUB" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get commit message
$message = Read-Host "Enter commit message (or Enter for auto)"

if ([string]::IsNullOrWhiteSpace($message)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $message = "Auto-update: $timestamp"
}

Write-Host "`nAdding files..." -ForegroundColor Yellow
git add .

# Check for changes
$changes = git status --porcelain
if ([string]::IsNullOrWhiteSpace($changes)) {
    Write-Host "No changes to commit" -ForegroundColor Red
    Write-Host "Nothing to do" -ForegroundColor Green
    pause
    exit
}

Write-Host "Commit: $message" -ForegroundColor Yellow
git commit -m "$message"

Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
git push origin main

# Check result
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "Site: https://kkav45.github.io/cooperant/" -ForegroundColor Cyan
    Write-Host "Actions: https://github.com/kkav45/cooperant/actions" -ForegroundColor Cyan
    Write-Host "`nGitHub Pages will update in 1-2 minutes...`n" -ForegroundColor Yellow
} else {
    Write-Host "`nERROR: Failed to push" -ForegroundColor Red
    Write-Host "Check internet connection and permissions`n" -ForegroundColor Red
}

pause
