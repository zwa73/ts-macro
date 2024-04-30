/**将codeText写入对应region
 * @param regionId   - 区域id
 * @param codeText   - 文本
 * @param targetPath - 目标文件 默认为去除".macro"的同名文件
 */
export declare function $macro(regionId: string, codeText: string, targetPath?: string): Promise<void>;
export declare function command(): void;
