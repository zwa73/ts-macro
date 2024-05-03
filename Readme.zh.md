**README.zh.md (中文)**

# @zwa73/macro

这个包提供了一个用于代码生成/预编译的宏。

## 特性

- 使用 `regionMacro` 将文本写入文件中的特定区域。
- 一个基于宏生成代码的命令行接口。

## 使用方法

### regionMacro

`regionMacro`函数将`codeText`写入对应的区域。

- `regionId`：区域id `//#region ${id}`。
- `codeText`：要写入的文本。
- `opt`：可选参数。
  - `opt.filePath`：目标文件。默认是没有".macro"的同名文件。
  - `opt.glob`：使用glob匹配而不是文件路径。

当你想在文件的指定区域写入特定的代码文本时，可以使用此函数。

### commentMacro

`commentMacro`函数将`codeText`写入对应的注释下方。

- `commentId`：注释id `// ${id}`。
- `codeText`：要写入的文本。
- `opt`：可选参数。
  - `opt.filePath`：目标文件。默认是没有".macro"的同名文件。
  - `opt.glob`：使用glob匹配而不是文件路径。

当你想在文件的指定注释下方写入特定的代码文本时，可以使用此函数。

### fileMacro

`fileMacro`函数将`codeText`写入对应的文件。如果文件不存在，它将被创建。

- `codeText`：要写入的文本。
- `opt`：可选参数。
  - `opt.filePath`：目标文件。默认是没有".macro"的同名文件。
  - `opt.glob`：使用glob匹配而不是文件路径。

当你想在指定的文件中写入特定的代码文本时，可以使用此函数。如果文件不存在，它将被创建。

## 示例

在 `src/test.macro.ts`:

```typescript
import {regionMacro,commentMacro,fileMacro} from '@zwa73/macro';
regionMacro('region1', 'type Region = 1;');
commentMacro('comment1', 'type Comment = 1;');
fileMacro('type FileMacro = 1;',{filePath:'src/testFileMacro.ts'});
```
在 `src/test.ts`:

```typescript
console.log(1);
//#region region1
//#endregion
console.log(2);
// comment1
// comment2
// comment3
```
执行后, 在 `src/test.ts`:

```typescript
console.log(1);
//#region region1
type Region = 1;
//#endregion
console.log(2);
// comment1
type Comment = 1;
// comment3
```
并且创建 `src/testFileMacro.ts`:

```typescript
type FileMacro = 1;
```
或者更多:

```typescript
function exportComment(glob:string){
    commentMacro(/export (\S*)/,({filePath,execArr})=>{
        const basedir = path.dirname(filePath).replaceAll('\\','/');
        const result = fileSearchGlob(basedir,execArr[1],{normalize:'posix'})
            .map((file)=>path.posix.relative(basedir,file))
            .map((file)=>path.parse(file).name)
            .filter((file)=>file!=path.parse(filePath).name)
            .map((file)=>`export * from './${file}'`)
            .join(';');
        return result.length>0? `${result};` : result;
    },{glob:true,filePath:glob});
}
exportComment('src/**/index.ts');
```
在任何 `index.ts`:

```typescript
// export *
```
执行后:

```typescript
// export *
import * from './YouModule1';import * from './YouModule2'; //...
```


### 命令行接口

这个包还提供了一个命令行接口，用于基于宏生成代码。

- -i, --include <glob> 包含的glob 默认 src/**/*.macro.ts  
- -g, --exclude <glob> 忽略的glob  
- -p, --project <path> tsconfig路径 默认 tsconfig.json  


``` powershell
npx zmacro Expand-Macro --include "src/**/*.macro.ts" --project "tsconfig.json"
```

这个指令会运行所有src/**/*.macro.ts匹配的文件, 如上述示例那样生成代码

## 安装

```powershell
npm i --save-dev @zwa73/macro
```

