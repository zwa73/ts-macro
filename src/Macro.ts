import fs from 'fs';
import path from 'path';
import { SLogger, UtilFT, UtilFunc, dedent } from './MiniReq';



/**宏的可选参数 */
type MacroOpt = Partial<{
    /**宏展开的目标文件 */
    filePath:string[]|string;
    /**使用glob匹配而非文件路径 */
    glob:boolean;
}>
/**codeText的参数 */
type CdeeTextOpt = {
    /**展开宏的目标文件 */
    filePath:string;
    /**展开宏区域的原文本 */
    text:string;
    /**缩进 会自动应用 */
    inent:string;
}
//#region macro工具
const parseMacroPaths = (basePath:string,opt?:MacroOpt)=>{
    return opt?.filePath
        ? opt.glob
            ? UtilFT.fileSearchGlob(process.cwd(),opt.filePath)
            : typeof opt?.filePath==="string" ? [opt?.filePath] : opt?.filePath
        : [basePath.replace(/(.+)\.macro\.(js|ts|cjs|mjs)$/,"$1.$2")];
}
const readFile = async (basePath:string)=>
    (await fs.promises.readFile(basePath,'utf-8')).replaceAll("\r\n","\n");
const parseCodeText = async (codeText:string|((opt:CdeeTextOpt)=>string|Promise<string>),opt:CdeeTextOpt)=>{
    const strText = typeof codeText === "function" ? await codeText(opt) : codeText;
    return strText.split('\n').map((line)=>`${opt.inent}${line}`).join('\n');
}
//#endregion
/**将codeText写入对应region  
 * @param regionId   - 区域id \`//#region ${id}\`
 * @param codeText   - 文本
 * @param opt        - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
export async function regionMacro(regionId:string,codeText:string|(()=>string|Promise<string>),opt?:MacroOpt){
    const loc = UtilFunc.getFuncLoc(2);
    if(!loc){
        SLogger.error(`UtilDT.regionMacro 未能找到函数位置`);
        return
    }
    const plist:Promise<void>[] = [];
    const filePaths = parseMacroPaths(loc.filePath,opt);
    for(const filePath of filePaths){
        const queuefunc = async ()=>{
            if(!(await UtilFT.pathExists(filePath))) {
                SLogger.error(`UtilDT.regionMacro ${filePath} 不存在`);
                return
            }
            const text = await readFile(filePath);
            const getregex = ()=>new RegExp(
                `([^\\S\\n]*)(//#region ${regionId}(?!\\S).*\\n)`+
                /([\s\S]*?)/.source+
                /([^\S\n]*\/\/#endregion(?!\S).*)/.source
                ,"g");
            if (!getregex().test(text)) {
                if(!opt?.glob) SLogger.error(`UtilDT.regionMacro 无法找到区域 ${regionId}`);
                return;
            }
            const match = getregex().exec(text)!;
            const parseCode = await parseCodeText(codeText,{text:dedent(match[3]),inent:match[1],filePath});
            const ntext = text.replace(getregex(), `$1$2${parseCode}\n$4`);
            await fs.promises.writeFile(filePath, ntext, 'utf-8');
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
export async function commentMacro(commentId:string,codeText:string|(()=>string|Promise<string>),opt?:MacroOpt){
    const loc = UtilFunc.getFuncLoc(2);
    if(!loc){
        SLogger.error(`UtilDT.commentMacro 未能找到函数位置`);
        return
    }
    const plist:Promise<void>[] = [];
    const filePaths = parseMacroPaths(loc.filePath,opt);
    for(const filePath of filePaths){
        const queuefunc = async ()=>{
            if(!(await UtilFT.pathExists(filePath))) {
                SLogger.error(`UtilDT.commentMacro ${filePath} 不存在`);
                return
            }
            const text = await readFile(filePath);
            const getregex = ()=>new RegExp(
                `([^\\S\\n]*)(// ${commentId}(?!\\S).*)`+
                /(\n|)/.source +
                /([^\n]*)/.source
                ,"g");
            if (!getregex().test(text)) {
                if(!opt?.glob) SLogger.error(`UtilDT.commentMacro 无法找到注释 ${commentId}`);
                return;
            }
            const match = getregex().exec(text)!;
            const parseCode = await parseCodeText(codeText,{text:match[3],inent:match[1],filePath});
            if(parseCode.includes('\n')){
                SLogger.error(`UtilDT.commentMacro 无法使用多行文本, 考虑使用regionMacro ${codeText}`);
                return;
            }
            const ntext = text.replace(getregex(), `$1$2\n${parseCode}`);
            await fs.promises.writeFile(filePath, ntext, 'utf-8');
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
export async function fileMacro(codeText:string|(()=>string|Promise<string>),opt?:MacroOpt){
    const loc = UtilFunc.getFuncLoc(2);
    if(!loc){
        SLogger.error(`UtilDT.fileMacro 未能找到函数位置`);
        return
    }
    const plist:Promise<void>[] = [];
    const filePaths = parseMacroPaths(loc.filePath,opt);
    for(const filePath of filePaths){
        const queuefunc = async ()=>{
            await UtilFT.ensurePathExists(filePath);
            const text = await readFile(filePath);
            const parseCode = await parseCodeText(codeText,{text,inent:'',filePath});
            await fs.promises.writeFile(filePath, parseCode, 'utf-8');
        }
        plist.push(UtilFunc.queueProc(path.posix.normalize(filePath.replaceAll("\\","/")),queuefunc))
    }
    await Promise.all(plist);
}



