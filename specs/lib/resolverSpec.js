import path from "path";
import { promises as fsPromises } from "fs";

export function mtlGuesses(directory, mtlPath) {
  const fullPath = path.join(directory, mtlPath);
  const shallowPath = path.join(directory, path.basename(mtlPath));
  return [fullPath, shallowPath];
}

export async function resolveFile(texturePath, mtlPath) {
  const mtlDirectory = path.dirname(mtlPath || "");
  texturePath = path.normalize(path.resolve(mtlDirectory, texturePath));

  let source;
  try {
    source = await fsPromises.readFile(texturePath);
  } catch {
    const shallowPath = path.join(mtlDirectory, path.basename(texturePath));
    try {
      source = await fsPromises.readFile(shallowPath);
    } catch {
      console.info("file doesnt exist");
    }
  }
  const extension = path.extname(texturePath);

  const name = path.basename(texturePath, extension);
  return { source, name, extension };
}
