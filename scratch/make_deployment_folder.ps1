$src = "c:\Users\VARUN V\Documents\VS code WEB\Bioinformatics Project"
$destFolder = "c:\Users\VARUN V\Documents\VS code WEB\Bioinformatics-Deployment-Ready"
$zipPath = "c:\Users\VARUN V\Documents\VS code WEB\Bioinformatics-Project.zip"

if (Test-Path $destFolder) { Remove-Item $destFolder -Recurse -Force }
New-Item -ItemType Directory -Force -Path $destFolder | Out-Null

$itemsToCopy = @(
    "api",
    "lib",
    "src",
    "index.html",
    "package.json",
    "package-lock.json",
    "vercel.json",
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "README.md",
    ".gitignore",
    ".env.example"
)

foreach ($item in $itemsToCopy) {
    $itemPath = Join-Path $src $item
    if (Test-Path $itemPath) {
        Copy-Item -Path $itemPath -Destination $destFolder -Recurse -Force
    }
}

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
$zipItems = Get-ChildItem -Path $destFolder
Compress-Archive -Path $zipItems.FullName -DestinationPath $zipPath -Force

Write-Host "SUCCESS: Deployment folder ready at $destFolder"
Write-Host "SUCCESS: Deployment ZIP ready at $zipPath"
