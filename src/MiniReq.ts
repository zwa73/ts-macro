

import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';

/**glob搜索选项 */
type FileSearchGlobOpt = Partial<{
    /**忽略的文件 默认 undefined */
    ingore:string|string[];
    /**输出的路径风格 默认跟随系统 */
    normalize:"posix"|"win32";
}>
/**验证文件选项 */
type EnsurePathExistsOpt = Partial<{
    /**验证一个目录 默认 false  
     * 默认仅在以path.sep结尾时创建文件夹  
     */
    dir:boolean
}>
/**创建文件选项 */
type CreatePathOpt = Partial<{
    /**创建一个目录 默认 false  
     * 默认仅在以path.sep结尾时创建文件夹  
     */
    dir:boolean
}>
export namespace UtilFT{
    /**搜索符合Glob匹配的文件
     * @param dir         - 起始目录
     * @param globPattern - glob匹配
     * @param opt         - 可选参数
     * @param opt.ignore    - 忽略的文件
     * @param opt.normalize - 输出的路径风格 默认跟随系统
     * @returns 文件绝对路径数组
     */
    export function fileSearchGlob(dir: string, globPattern:string|string[],opt?:FileSearchGlobOpt){
        const fixedPath = typeof globPattern === "string"
            ? path.join(dir,globPattern).replaceAll("\\","/")
            : globPattern.map((p)=>path.join(dir,p).replaceAll("\\","/"));
        return globSync(fixedPath, { ignore: opt?.ingore, absolute: true })
            .map((filePath) => {
            if (opt?.normalize === undefined) return filePath;
            switch(opt.normalize){
                case 'posix':
                    return path['posix'].normalize(filePath.replaceAll("\\", "/"))
                case 'win32':
                    return path['win32'].normalize(filePath.replaceAll("/", "\\"))
            }
            throw '';
        });
    }
    /**验证路径 文件或文件夹 是否存在 异步
     * @async
     * @param filePath - 待验证的路径
     * @returns 是否存在
     */
    export async function pathExists(filePath: string):Promise<boolean>{
        try {
            await fs.promises.access(filePath);
            return true;
        } catch (e) {
            return false;
        }
    }
    /**确保路径存在 不存在时创建 异步
     * @async
     * @param filePath - 待验证的路径
     * @param opt      - 可选参数
     * @param opt.dir  - 强制验证一个文件夹
     * @returns 是否成功执行 创建或已存在
     */
    export async function ensurePathExists(filePath: string, opt?:EnsurePathExistsOpt):Promise<boolean>{
        if(await pathExists(filePath))
            return true;
        return await createPath(filePath,opt);
    }
    /**路径不存在时创建路径 以path.sep结尾时创建文件夹 异步
     * @async
     * @param filePath - 待创建的路径
     * @param opt      - 可选参数
     * @param opt.dir  - 创建一个目录
     * @returns 是否成功创建
     */
    export async function createPath(filePath: string, opt?:CreatePathOpt):Promise<boolean>{
        if(opt?.dir==true)
            filePath = path.join(filePath,path.sep);

        try{
            if(filePath.endsWith(path.sep)){
                await fs.promises.mkdir(filePath, {recursive: true});
                return true;
            }
            await fs.promises.mkdir(path.dirname(filePath), {recursive: true});
            const filehandle = await fs.promises.open(filePath, 'w');
            await filehandle.close();
            return true;
        }
        catch(e){
            SLogger.error("createPath 错误",e);
            return false;
        }
    }
}
export namespace UtilFunc{
    /**代办表 用于队列处理等待 */
    const pendingMap:Record<string,((...args:any)=>any)[]> = {};

    /**队列处理  
     * 等待标签为 flag 的队列  
     * 直到排在之前的任务全部完成再处理当前Promise  
     * @param flag - 队列标签
     * @param task - 任务逻辑
     * @returns 处理结果
     */
    export function queueProc<T>(flag: string, task: () => Promise<T>): Promise<T> {
        // 如果当前标签的队列不存在，则创建一个新的队列
        if (!pendingMap[flag]) pendingMap[flag] = [];

        // 创建一个新的Promise，并保存resolve函数以便后续调用
        let resolveFunc: (value: T | PromiseLike<T>) => void;
        const promise = new Promise<T>((resolve) => {
            resolveFunc = resolve;
        });

        // 定义处理任务的函数
        const processTask = async () => {
            let result: T;
            try {
                // 执行任务并等待结果
                result = await task();
                // 使用保存的resolve函数来解决Promise
                resolveFunc(result);
            } catch (error) {
                // 如果任务执行出错，记录错误日志
                console.warn(`queueProc 错误: `,error,`flag: ${String(flag)}`);
            } finally {
                // 无论任务是否成功，都从队列中移除当前任务
                pendingMap[flag].shift();
                // 如果队列中还有任务，执行下一个任务
                if (pendingMap[flag].length > 0) {
                    pendingMap[flag][0]();
                } else {
                    // 如果队列中没有任务，删除队列
                    delete pendingMap[flag];
                }
            }
        };

        // 将处理任务的函数添加到队列中
        pendingMap[flag].push(processTask);
        // 如果队列中只有当前任务，立即执行
        if (pendingMap[flag].length === 1) processTask();

        // 返回Promise，以便调用者可以等待任务完成
        return promise;
    }
    /**获取函数调用位置 getFunctionLocation 
     * @param stack - 深度 默认1, 即getFuncLoc函数被调用的位置
     */
    export function getFuncLoc(stack=1) {
        const stackLines = new Error().stack!.split('\n');
        const regex = /([a-zA-Z]+?:.+?):(\d+?:\d+)/;
        //console.log(stackLines)
        const match = regex.exec(stackLines[stack+1]);
        if(match){
            const filePath = match[1];
            const lineNumber = match[2] as `${number}:${number}`;
            return {filePath,lineNumber}
        }
        return undefined;
    }
}
export namespace SLogger{
    export const info = (...arg:any)=>console.info(...arg);
    export const error = (...arg:any)=>console.error(...arg);
}
/**移除多行字符串中每行开始的最小空格数。
 *
 * @param input   - 需要处理的多行 字符串模板 或 字符串。
 * @param values  - 插入模板字符串中的值。
 * @returns 返回处理后的字符串，每行开始的空格数已被最小化。
 *
 * @example
 * const name = 'World';
 * const str = dedent`
 *     Hello,
 *         ${name}!
 * `;
 * console.log(str);
 * // 输出：
 * // Hello,
 * //     World!
 */
export function dedent(input: TemplateStringsArray|string, ...values: any[]): string {
    const str = typeof input === 'string'
        ? input
        : input.reduce((result, string, i) => result + string + (values[i] ?? ''), '');
    const lines = str.split('\n');
    const minIndent = Math.min(
        ...lines.filter(line => line.trim() !== '').map(line => line.search(/\S/))
    );
    return lines.map(line => line.slice(minIndent)).join('\n');
}