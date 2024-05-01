/**宏的可选参数 */
type MacroOpt = {
    /**宏展开的目标文件 */
    targetPath: string;
};
/**将codeText写入对应region
 * @param regionId   - 区域id
 * @param codeText   - 文本
 * @param opt        - 可选参数
 * @param opt.targetPath - 目标文件 默认为去除".macro"的同名文件
 */
export declare function regionMacro(regionId: string, codeText: string | (() => string | Promise<string>), opt?: MacroOpt): Promise<void>;
export declare function command(): void;
export {};
