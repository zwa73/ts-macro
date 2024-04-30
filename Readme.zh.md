**README.zh.md (中文)**

# @zwa73/macro

这个包提供了一个用于代码生成/预编译的宏。

## 特性

- 使用 `$macro` 将文本写入文件中的特定区域。
- 一个基于宏生成代码的命令行接口。

## 使用方法

### $macro

函数将文本写入文件中的特定区域。它接受一个区域 ID，要写入的文本，以及一个可选的目标文件路径。

``` typescript
import {$macro} from '@zwa73/macro';
$macro('regionId', 'codeText', 'path/to/target.ts');
```
在 `src/test.macro.ts` 中:  

``` typescript
import {$macro} from '@zwa73/macro';
$macro('macrotest', 'type Test = 1;');
```
在 `src/test.ts` 中:  

``` typescript
console.log(1);
//#region macrotest
//#endregion
console.log(2);
```
执行后, 在 `src/test.ts` 中:  

``` typescript
console.log(1);
//#region macrotest
type Test = 1;
//#endregion
console.log(2);
```

### 命令行接口

这个包还提供了一个命令行接口，用于基于宏生成代码。

- -i, --include <glob> 包含的glob 默认 src/**/*.macro.ts  
- -g, --exclude <glob> 忽略的glob  
- -p, --project <path> tsconfig路径 默认 tsconfig.json  


``` powershell
npx zmacro Build-Macro --include "src/**/*.macro.ts" --project "tsconfig.json"
```

这个指令会运行所有src/**/*.macro.ts匹配的文件, 如上述示例那样生成代码

## 安装

```powershell
npm i @zwa73/macro
```

