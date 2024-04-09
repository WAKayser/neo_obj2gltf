import { createGltf } from "../../lib/createGltf.js";
import { obj2gltf } from "../../lib/obj2gltf.js";
import { openAsBlob } from "fs";

const texturedObjPath = "specs/data/box-textured/box-textured.obj";
const complexObjPath =
  "specs/data/box-complex-material/box-complex-material.obj";
const missingMtllibObjPath =
  "specs/data/box-missing-mtllib/box-missing-mtllib.obj";

const outputDirectory = "output";

const textureUrl = "specs/data/box-textured/cesium.png";

describe("obj2gltf", () => {
  it("converts obj to gltf", async () => {
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    const gltf = await obj2gltf(texturedObjBlob, {
      objDirectory: "specs/data/box-textured/",
    });
    expect(gltf).toBeDefined();
    expect(gltf.images.length).toBe(1);
  });

  it("converts obj to glb", async () => {
    const options = {
      binary: true,
      objDirectory: "specs/data/box-textured/",
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    const glb = await obj2gltf(texturedObjBlob, options);
    const magic = glb.toString("utf8", 0, 4);
    expect(magic).toBe("glTF");
  });

  it("convert obj to gltf with separate resources", async () => {
    const options = {
      separate: true,
      separateTextures: true,
      outputDirectory: outputDirectory,
      objDirectory: "specs/data/box-textured",
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    await obj2gltf(texturedObjBlob, options);
  });

  it("convert obj to gltf with separate resources when buffer exceeds Node limit", async () => {
    spyOn(createGltf, "_getBufferMaxByteLength").and.returnValue(0);
    const options = {
      separate: true,
      separateTextures: true,
      outputDirectory: outputDirectory,
      objDirectory: "specs/data/box-textured/",
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    await obj2gltf(texturedObjBlob, options);
  });

  it("converts obj to glb with separate resources", async () => {
    const options = {
      separate: true,
      separateTextures: true,
      outputDirectory: outputDirectory,
      binary: true,
      objDirectory: "specs/data/box-textured/",
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    await obj2gltf(texturedObjBlob, options);
  });

  it("converts obj with multiple textures", async () => {
    const options = {
      separateTextures: true,
      outputDirectory: outputDirectory,
      objDirectory: "specs/data/box-complex-material",
    };
    const complexObjBlob = await openAsBlob(complexObjPath);
    await obj2gltf(complexObjBlob, options);
  });

  it("sets overriding textures (1)", async () => {
    const options = {
      overridingTextures: {
        metallicRoughnessOcclusionTexture: textureUrl,
        normalTexture: textureUrl,
        baseColorTexture: textureUrl,
        emissiveTexture: textureUrl,
        alphaTexture: textureUrl,
      },
      separateTextures: true,
      outputDirectory: outputDirectory,
      objDirectory: "specs/data/box-complex-material",
    };

    const complexObjBlob = await openAsBlob(complexObjPath);
    await obj2gltf(complexObjBlob, options);
  });

  it("sets overriding textures (2)", async () => {
    const options = {
      overridingTextures: {
        specularGlossinessTexture: textureUrl,
        occlusionTexture: textureUrl,
        normalTexture: textureUrl,
        baseColorTexture: textureUrl,
        emissiveTexture: textureUrl,
        alphaTexture: textureUrl,
      },
      separateTextures: true,
      outputDirectory: outputDirectory,
      objDirectory: "specs/data/box-complex-material",
    };
    const complexObjBlob = await openAsBlob(complexObjPath);
    await obj2gltf(complexObjBlob, options);
  });

  it("uses a custom logger", async () => {
    let lastMessage;
    const options = {
      logger: (message) => {
        lastMessage = message;
      },
      objDirectory: "specs/data/box-missing-mtllib",
    };
    const missingMtllibObjBlob = await openAsBlob(missingMtllibObjPath);
    await obj2gltf(missingMtllibObjBlob, options);
    expect(lastMessage.indexOf("Could not read material file") >= 0).toBe(true);
  });

  it("uses a custom writer", async () => {
    const filePaths = [];
    const fileContents = [];
    const options = {
      separate: true,
      objDirectory: "specs/data/box-textured/",
      writer: (relativePath, contents) => {
        filePaths.push(relativePath);
        fileContents.push(contents);
      },
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    await obj2gltf(texturedObjBlob, options);
    expect(filePaths).toEqual(["cesium.png", "model.bin"]);
    expect(fileContents[0]).toBeDefined();
    expect(fileContents[1]).toBeDefined();
  });

  it("throws if both options.writer and options.outputDirectory are undefined when writing separate resources", async () => {
    const options = {
      separateTextures: true,
      objDirectory: "specs/data/box-textured/",
    };

    const texturedObjBlob = await openAsBlob(texturedObjPath);
    let thrownError;
    try {
      obj2gltf(texturedObjBlob, options);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toEqual(
      new Error(
        "Either options.writer or options.outputDirectory must be defined when writing separate resources.",
      ),
    );
  });

  it("throws if more than one material type is set", async () => {
    const options = {
      metallicRoughness: true,
      specularGlossiness: true,
      objDirectory: "specs/data/box-textured/",
    };

    const texturedObjBlob = await openAsBlob(texturedObjPath);
    let thrownError;
    try {
      obj2gltf(texturedObjBlob, options);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toEqual(
      new Error(
        "Only one material type may be set from [metallicRoughness, specularGlossiness, unlit].",
      ),
    );
  });

  it("throws if metallicRoughnessOcclusionTexture and specularGlossinessTexture are both defined", async () => {
    const options = {
      overridingTextures: {
        metallicRoughnessOcclusionTexture: textureUrl,
        specularGlossinessTexture: textureUrl,
      },
      objDirectory: "specs/data/box-textured/",
    };

    let thrownError;
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    try {
      obj2gltf(texturedObjBlob, options);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toEqual(
      new Error(
        "metallicRoughnessOcclusionTexture and specularGlossinessTexture cannot both be defined.",
      ),
    );
  });
});
