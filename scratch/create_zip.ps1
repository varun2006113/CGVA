$source = "c:\Users\VARUN V\Documents\VS code WEB\Bioinformatics Project"
$zipPath = "c:\Users\VARUN V\Documents\VS code WEB\Bioinformatics-Project.zip"

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$exclude = @('node_modules', 'dist', '.git', 'scratch')
$items = Get-ChildItem -Path $source | Where-Object { $exclude -notcontains $_.Name }

Compress-Archive -Path $items.FullName -DestinationPath $zipPath -Force
Write-Host "Zip created at $zipPath"
