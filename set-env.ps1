# PowerShell script to create .env.local file
$envContent = "# Add JWT leeway to handle clock skew issues (in seconds)`nCLERK_JWT_LEEWAY=60`n"
$envPath = Join-Path $PSScriptRoot ".env.local"
Set-Content -Path $envPath -Value $envContent
Write-Output ".env.local file created with Clerk JWT leeway configuration" 