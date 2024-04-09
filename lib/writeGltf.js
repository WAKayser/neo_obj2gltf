import { PNG } from "pngjs";
import { getBufferPadded } from "./getBufferPadded.js";
import { gltfToGlb } from "./gltfToGlb.js";

/**
 * Write glTF resources as embedded data uris or external files.
 *
 * @param {Object} gltf The glTF asset.
 * @param {Object} options The options object passed along from lib/obj2gltf.js
 * @returns {Promise} A promise that resolves to the glTF JSON or glb buffer.
 *
 * @private
 */
export function writeGltf(gltf, options) {
  return encodeTextures(gltf).then(function () {
    const promises = [];
    writeEmbeddedTextures(gltf);

    const binaryBuffer = gltf.buffers[0].extras._obj2gltf.source;

    return Promise.all(promises).then(function () {
      deleteExtras(gltf);
      removeEmpty(gltf);
      return gltfToGlb(gltf, binaryBuffer);
    });
  });
}

function encodePng(texture) {
  const rgbColorType = 2;
  const rgbaColorType = 6;

  const png = new PNG({
    width: texture.width,
    height: texture.height,
    colorType: texture.transparent ? rgbaColorType : rgbColorType,
    inputColorType: rgbaColorType,
    inputHasAlpha: true,
  });

  png.data = texture.pixels;

  return new Promise(function (resolve, reject) {
    const chunks = [];
    const stream = png.pack();
    stream.on("data", function (chunk) {
      chunks.push(chunk);
    });
    stream.on("end", function () {
      resolve(Buffer.concat(chunks));
    });
    stream.on("error", reject);
  });
}

function encodeTexture(texture) {
  if (
    typeof texture.source === "undefined" &&
    typeof texture.pixels !== "undefined" &&
    texture.extension === ".png"
  ) {
    // if (
    //   !defined(texture.source) &&
    //   defined(texture.pixels) &&
    //   texture.extension === ".png"
    // ) {
    return encodePng(texture).then(function (encoded) {
      texture.source = encoded;
    });
  }
}

function encodeTextures(gltf) {
  // Dynamically generated PBR textures need to be encoded to png prior to being saved
  const encodePromises = [];
  const images = gltf.images;
  const length = images.length;
  for (let i = 0; i < length; ++i) {
    encodePromises.push(encodeTexture(images[i].extras._obj2gltf));
  }
  return Promise.all(encodePromises);
}

function deleteExtras(gltf) {
  const buffers = gltf.buffers;
  const buffersLength = buffers.length;
  for (let i = 0; i < buffersLength; ++i) {
    delete buffers[i].extras;
  }

  const images = gltf.images;
  const imagesLength = images.length;
  for (let i = 0; i < imagesLength; ++i) {
    delete images[i].extras;
  }
}

function removeEmpty(json) {
  Object.keys(json).forEach(function (key) {
    if (
      // !defined(json[key]) ||
      typeof json[key] === "undefined" ||
      (Array.isArray(json[key]) && json[key].length === 0)
    ) {
      delete json[key]; // Delete values that are undefined or []
    } else if (typeof json[key] === "object") {
      removeEmpty(json[key]);
    }
  });
}

const gltfMimeTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  glsl: "text/plain",
  vert: "text/plain",
  vs: "text/plain",
  frag: "text/plain",
  fs: "text/plain",
  txt: "text/plain",
  dds: "image/vnd-ms.dds",
};

function writeEmbeddedTextures(gltf) {
  const buffer = gltf.buffers[0];
  const bufferExtras = buffer.extras._obj2gltf;
  const bufferSource = bufferExtras.source;
  const images = gltf.images;
  const imagesLength = images.length;
  const sources = [bufferSource];
  let byteOffset = bufferSource.length;

  for (let i = 0; i < imagesLength; ++i) {
    const image = images[i];
    const texture = image.extras._obj2gltf;
    const textureSource = texture.source;
    const textureByteLength = textureSource.length;

    image.mimeType =
      gltfMimeTypes[texture.extension] ?? "application/octet-stream";
    image.bufferView = gltf.bufferViews.length;
    gltf.bufferViews.push({
      buffer: 0,
      byteOffset: byteOffset,
      byteLength: textureByteLength,
    });
    byteOffset += textureByteLength;
    sources.push(textureSource);
  }

  const source = getBufferPadded(Buffer.concat(sources));
  bufferExtras.source = source;
  buffer.byteLength = source.length;
}
