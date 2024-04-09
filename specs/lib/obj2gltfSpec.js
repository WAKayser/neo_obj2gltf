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
  it("converts obj to glb", async () => {
    const options = {
      objDirectory: "specs/data/box-textured/",
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    const glb = await obj2gltf(texturedObjBlob, options);
    const magic = glb.toString("utf8", 0, 4);
    expect(magic).toBe("glTF");
  });
  it("converts obj to glb with separate resources", async () => {
    const options = {
      outputDirectory: outputDirectory,
      objDirectory: "specs/data/box-textured/",
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    await obj2gltf(texturedObjBlob, options);
  });

  it("converts obj with multiple textures", async () => {
    const options = {
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
