$code = Get-Content (Join-Path $PSScriptRoot "IconGenerator.cs") -Raw
Add-Type -TypeDefinition $code -ReferencedAssemblies "System.Drawing"
$resPath = Resolve-Path (Join-Path $PSScriptRoot "..\android\app\src\main\res")
[IconGenerator]::GenerateAll($resPath.Path)
Write-Host "ALL ICONS AND SPLASH SCREENS GENERATED SUCCESSFULLY!"
