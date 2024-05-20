/**glob搜索选项 */
type FileSearchGlobOpt = Partial<{
    /**忽略的文件 默认 undefined */
    ingore: string | string[];
}>;
/**验证文件选项 */
type EnsurePathExistsOpt = Partial<{
    /**验证一个目录 默认 false
     * 默认仅在以path.sep结尾时创建文件夹
     */
    dir: boolean;
}>;
/**创建文件选项 */
type CreatePathOpt = Partial<{
    /**创建一个目录 默认 false
     * 默认仅在以path.sep结尾时创建文件夹
     */
    dir: boolean;
}>;
export declare namespace UtilFT {
    /**搜索符合Glob匹配的文件
     * @param dir         - 起始目录
     * @param globPattern - glob匹配
     * @param opt         - 可选参数
     * @param opt.ignore    - 忽略的文件
     * @param opt.normalize - 输出的路径风格 默认跟随系统
     * @returns 文件绝对路径数组
     */
    function fileSearchGlob(dir: string, globPattern: string | string[], opt?: FileSearchGlobOpt): string[];
    /**验证路径 文件或文件夹 是否存在 异步
     * @async
     * @param filePath - 待验证的路径
     * @returns 是否存在
     */
    function pathExists(filePath: string): Promise<boolean>;
    /**确保路径存在 不存在时创建 异步
     * @async
     * @param filePath - 待验证的路径
     * @param opt      - 可选参数
     * @param opt.dir  - 强制验证一个文件夹
     * @returns 是否成功执行 创建或已存在
     */
    function ensurePathExists(filePath: string, opt?: EnsurePathExistsOpt): Promise<boolean>;
    /**路径不存在时创建路径 以path.sep结尾时创建文件夹 异步
     * @async
     * @param filePath - 待创建的路径
     * @param opt      - 可选参数
     * @param opt.dir  - 创建一个目录
     * @returns 是否成功创建
     */
    function createPath(filePath: string, opt?: CreatePathOpt): Promise<boolean>;
}
export declare namespace UtilFunc {
    /**队列处理
     * 等待标签为 flag 的队列
     * 直到排在之前的任务全部完成再处理当前Promise
     * @param flag - 队列标签
     * @param task - 任务逻辑
     * @returns 处理结果
     */
    function queueProc<T>(flag: string, task: () => Promise<T>): Promise<T>;
    /**获取函数调用位置 getFunctionLocation
     * @param stack - 深度 默认1, 即getFuncLoc函数被调用的位置
     */
    function getFuncLoc(stack?: number): {
        filePath: string;
        lineNumber: `${number}:${number}`;
    } | undefined;
}
export declare namespace SLogger {
    const info: (...arg: any) => void;
    const error: (...arg: any) => void;
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
export declare function dedent(input: TemplateStringsArray | string, ...values: any[]): string;
export declare function throwError(str?: string): never;
export {};
