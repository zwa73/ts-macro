import fs from 'fs';
import path from 'path';
import { SLogger, UtilFT, UtilFunc, dedent, throwError } from './MiniReq';



/**宏的可选参数 */
type MacroOpt = Partial<{
    /**宏展开的目标文件 */
    filePath:string[]|string;
    /**使用glob匹配而非文件路径 */
    glob:boolean;
}>
/**codeText的参数 */
type CodeTextOpt = {
    /**匹配的region/comment id */
    matchId:string;
    /**region/comment id正则的执行结果*/
    execArr:RegExpExecArray;
    /**展开宏的目标文件 */
    filePath:string;
    /**展开宏区域的原文本 */
    text:string;
    /**缩进 会自动应用 */
    inent:string;
}
//#region macro工具
const parseMacroPaths = (opt?:MacroOpt)=>{
    const loc = UtilFunc.getFuncLoc(3);
    if(!loc && !opt?.filePath) throwError(`parseMacroPaths 未能找到函数位置`);
    const basePath = loc?.filePath!;
    return opt?.filePath
        ? opt.glob
            ? UtilFT.fileSearchGlob(process.cwd(),opt.filePath,{normalize:"posix"})
            : typeof opt?.filePath==="string"
                ? [opt?.filePath.replaceAll('\\','/')]
                : opt?.filePath.map((filepath)=>filepath.replaceAll('\\','/'))
        : [basePath.replace(/(.+)\.macro\.(js|ts|cjs|mjs)$/,"$1.$2").replaceAll('\\','/')];
}
const readFile = async (basePath:string)=>
    (await fs.promises.readFile(basePath,'utf-8')).replaceAll("\r\n","\n");
const parseCodeText = async (codeText:string|((opt:CodeTextOpt)=>string|Promise<string>),opt:CodeTextOpt)=>{
    const strText = typeof codeText === "function" ? await codeText(opt) : codeText;
    return strText.split('\n').map((line)=>`${opt.inent}${line}`).join('\n');
}
const literalRegex = (str:string)=>new RegExp(
    `^${str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(?!\\S)`);
//#endregion
/**将codeText写入对应region  
 * @param regionId   - 区域id \`//#region ${id}\`
 * @param codeText   - 文本
 * @param opt        - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
export async function regionMacro(regionId:string|RegExp,codeText:string|((opt:CodeTextOpt)=>string|Promise<string>),opt?:MacroOpt){
    const plist:Promise<void>[] = [];
    const filePaths = parseMacroPaths(opt);
    for(const filePath of filePaths){
        const queuefunc = async ()=>{
            if(!(await UtilFT.pathExists(filePath))) {
                SLogger.error(`UtilDT.regionMacro ${filePath} 不存在`);
                return
            }
            let fileText = await readFile(filePath);
            const regex = new RegExp(
                    /(^|\n)([^\S\n]*)(\/\/#region (.*)\n)/.source+
                    /([\s\S]*?)/.source+
                    /([^\S\n]*\/\/#endregion(?!\S).*)/.source
                    ,"g")
            regex.lastIndex=0;
            let match:RegExpExecArray|null;
            let hasMatch = false;
            while(match = regex.exec(fileText)){
                const id = match[4];
                const prefix = match[1];
                const content = match[5];
                const inent = match[2];
                const comment = match[3];
                const endcomment = match[6];

                const idregex = typeof regionId === "string"
                    ? literalRegex(regionId) : regionId;
                let idmatch = idregex.exec(id);
                if(idmatch==null) continue;
                hasMatch=true;
                const ol = fileText.length;
                const parseCode = await parseCodeText(codeText,{
                    matchId :idmatch[0],
                    execArr :idmatch,
                    text    :dedent(content),
                    inent   ,
                    filePath
                });
                fileText = fileText.replace(match[0], `${prefix}${inent}${comment}${parseCode}\n${endcomment}`);
                regex.lastIndex += fileText.length - ol;
            }
            if(hasMatch)
                await fs.promises.writeFile(filePath, fileText, 'utf-8');
            else if(!opt?.glob) SLogger.error(`UtilDT.regionMacro 无法找到区域 ${regionId}`);
        }
        plist.push(UtilFunc.queueProc(path.posix.normalize(filePath.replaceAll("\\","/")),queuefunc))
    }
    await Promise.all(plist);
}
/**将codeText写入对应注释下  
 * @param commentId - 注释id \`// ${id}\`
 * @param codeText  - 文本
 * @param opt       - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
export async function commentMacro(commentId:string|RegExp,codeText:string|((opt:CodeTextOpt)=>string|Promise<string>),opt?:MacroOpt){
    const plist:Promise<void>[] = [];
    const filePaths = parseMacroPaths(opt);
    for(const filePath of filePaths){
        const queuefunc = async ()=>{
            if(!(await UtilFT.pathExists(filePath))) {
                SLogger.error(`UtilDT.commentMacro ${filePath} 不存在`);
                return
            }
            let fileText = await readFile(filePath);
            const regex = new RegExp(
                    /(^|\n)([^\S\n]*)(\/\/ (.*))(\n|)/.source+
                    /([^\n]*)/.source
                    ,"g")
            let match:RegExpExecArray|null;
            let hasMatch = false;
            while(match = regex.exec(fileText)){
                const id = match[4];
                const prefix = match[1];
                const content = match[6];
                const inent = match[2];
                const comment = match[3];

                const idregex = typeof commentId === "string"
                    ? literalRegex(commentId) : commentId;
                let idmatch = idregex.exec(id);
                if(idmatch==null) continue;
                hasMatch=true;
                const ol = fileText.length;
                const parseCode = await parseCodeText(codeText,{
                    matchId :idmatch[0],
                    execArr :idmatch,
                    text    :dedent(content),
                    inent   ,
                    filePath
                });
                if(parseCode.includes('\n')){
                    SLogger.error(`UtilDT.commentMacro 无法使用多行文本, 考虑使用regionMacro ${codeText}`);
                    return;
                }
                fileText = fileText.replace(match[0], `${prefix}${inent}${comment}\n${parseCode}`);
                regex.lastIndex += fileText.length - ol;
            }
            if(hasMatch)
                await fs.promises.writeFile(filePath, fileText, 'utf-8');
            else if(!opt?.glob) SLogger.error(`UtilDT.commentMacro 无法找到注释 ${commentId}`);
        }
        plist.push(UtilFunc.queueProc(path.posix.normalize(filePath.replaceAll("\\","/")),queuefunc))
    }
    await Promise.all(plist);
}
/**将codeText写入对应文件 不存在则创建  
 * @param codeText  - 文本
 * @param opt       - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
export async function fileMacro(codeText:string|((opt:Omit<CodeTextOpt,'ident'|'matchId'|'execArr'>)=>string|Promise<string>),opt?:MacroOpt){
    const plist:Promise<void>[] = [];
    const filePaths = parseMacroPaths(opt);
    for(const filePath of filePaths){
        const queuefunc = async ()=>{
            await UtilFT.ensurePathExists(filePath);
            const text = await readFile(filePath);
            const parseCode = await parseCodeText(codeText,{
                matchId:'',
                execArr:/''/.exec('')!,
                text,
                inent:'',
                filePath
            });
            await fs.promises.writeFile(filePath, parseCode, 'utf-8');
        }
        plist.push(UtilFunc.queueProc(path.posix.normalize(filePath.replaceAll("\\","/")),queuefunc))
    }
    await Promise.all(plist);
}


