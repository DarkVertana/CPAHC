# FCM Device Test Script
# This script registers a test device and verifies FCM push notifications work

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = "",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://appanel.alternatehealthclub.com",
    
    [Parameter(Mandatory=$false)]
    [string]$WpUserId = "test_user_$(Get-Random)"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FCM Device Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js to run this script" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if API key is provided
if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    Write-Host "API Key not provided. Attempting to get from environment..." -ForegroundColor Yellow
    $ApiKey = $env:API_KEY
    if ([string]::IsNullOrWhiteSpace($ApiKey)) {
        Write-Host "ERROR: API Key is required!" -ForegroundColor Red
        Write-Host "Please provide API key using -ApiKey parameter or set API_KEY environment variable" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Usage: .\test-fcm-device.ps1 -Email 'user@example.com' -ApiKey 'ahc_live_sk_...'" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Email: $Email" -ForegroundColor White
Write-Host "  WordPress User ID: $WpUserId" -ForegroundColor White
Write-Host "  Base URL: $BaseUrl" -ForegroundColor White
Write-Host "  API Key: $($ApiKey.Substring(0, [Math]::Min(20, $ApiKey.Length)))..." -ForegroundColor White
Write-Host ""

# Check if test script exists
$testScriptPath = Join-Path $PSScriptRoot "fcm-device-tester.js"
if (-not (Test-Path $testScriptPath)) {
    Write-Host "ERROR: Test script not found at: $testScriptPath" -ForegroundColor Red
    exit 1
}

# Run the Node.js test script
Write-Host "Starting FCM device test..." -ForegroundColor Cyan
Write-Host ""

$env:TEST_EMAIL = $Email
$env:TEST_WP_USER_ID = $WpUserId
$env:TEST_API_KEY = $ApiKey
$env:TEST_BASE_URL = $BaseUrl

node $testScriptPath

$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "Test failed with exit code: $exitCode" -ForegroundColor Red
    exit $exitCode
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Green
