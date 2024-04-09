import path from "path";
import { promises as fsPromises } from "fs";

export async function resolveFile(texturePath, mtlPath, handle = false) {
  const mtlDirectory = path.dirname(mtlPath || "");
  texturePath = path.normalize(path.resolve(mtlDirectory, texturePath));
  const fs_function = handle ? fsPromises.open : fsPromises.readFile;

  let source;
  try {
    source = await fs_function(texturePath);
  } catch {
    const shallowPath = path.join(mtlDirectory, path.basename(texturePath));
    try {
      source = await fs_function(shallowPath);
    } catch {
      console.info("file doesnt exist");
    }
  }
  const extension = path.extname(texturePath);

  const name = path.basename(texturePath, extension);
  return { source, name, extension };
}
