$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$previousPath = $env:Path
$exitCode = 0

Push-Location -LiteralPath $projectDirectory
try {
    $localNode = Join-Path $projectDirectory '.local\runtime\node_modules\node\bin\node.exe'
    if (Test-Path -LiteralPath $localNode -PathType Leaf) {
        $nodePath = (Resolve-Path -LiteralPath $localNode).Path
    } else {
        $nodePath = (Get-Command node.exe -CommandType Application -ErrorAction Stop).Source
    }

    $versionOutput = & $nodePath --version
    if ($LASTEXITCODE -ne 0) { throw '无法读取 Node.js 版本。' }
    $nodeVersion = [version]($versionOutput.Trim() -replace '^v', '')
    if ($nodeVersion -lt [version]'22.12.0') {
        throw "需要 Node.js 22.12 或更新版本，当前为 $nodeVersion。请安装受支持的 Node.js 后重试。"
    }

    $npmCommand = Get-Command npm.cmd -CommandType Application -ErrorAction Stop
    $npmDirectory = Split-Path -Parent $npmCommand.Source
    $npmCli = Join-Path $npmDirectory 'node_modules\npm\bin\npm-cli.js'
    if (-not (Test-Path -LiteralPath $npmCli -PathType Leaf)) {
        throw '未找到 npm-cli.js，请检查 npm 安装。'
    }

    $env:Path = "$(Split-Path -Parent $nodePath)$([IO.Path]::PathSeparator)$previousPath"
    Write-Host "使用 Node.js $nodeVersion；本地地址 http://127.0.0.1:5174"
    & $nodePath $npmCli run dev -- --host 127.0.0.1 --port 5174 --strictPort
    $exitCode = $LASTEXITCODE
} catch {
    [Console]::Error.WriteLine("启动失败：$($_.Exception.Message)")
    $exitCode = 1
} finally {
    $env:Path = $previousPath
    Pop-Location
}

exit $exitCode
