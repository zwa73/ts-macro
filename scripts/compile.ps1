﻿Write-Output 开始删除原dist
Remove-Item -Recurse -Force dist
Write-Output 开始编译
tsc -p tsconfig.compile.json
tsc-alias -p tsconfig.compile.json