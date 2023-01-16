import * as path from "path";
import { getFileExt } from "./file-extension";

/**
 * Calculates file path between from and to.
 * @param {string} from Dragged file path.
 * @param {string} to Active text editor file path.
 * @returns relative file path of dragged and active text editor.
 */
function relative(from: string, to: string): string {
    return path.relative(path.dirname(from), to);
}
