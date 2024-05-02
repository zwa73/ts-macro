/**宏的可选参数 */
type MacroOpt = Partial<{
    /**宏展开的目标文件 */
    filePath: string[] | string;
    /**使用glob匹配而非文件路径 */
    glob: boolean;
}>;
/**将codeText写入对应region
 * @param regionId   - 区域id \`//#region ${id}\`
 * @param codeText   - 文本
 * @param opt        - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
export declare function regionMacro(regionId: string, codeText: string | (() => string | Promise<string>), opt?: MacroOpt): Promise<void>;
/**将codeText写入对应注释下
 * @param commentId - 注释id \`// ${id}\`
 * @param codeText  - 文本
 * @param opt       - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
export declare function commentMacro(commentId: string, codeText: string | (() => string | Promise<string>), opt?: MacroOpt): Promise<void>;
/**将codeText写入对应文件 不存在则创建
 * @param codeText  - 文本
 * @param opt       - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
export declare function fileMacro(codeText: string | (() => string | Promise<string>), opt?: MacroOpt): Promise<void>;
export {};
