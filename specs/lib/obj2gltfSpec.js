import { obj2gltf } from "../../lib/obj2gltf.js";
import { openAsBlob } from "fs";
import { mtlGuesses } from "./resolverSpec.js";

const texturedObjPath = "specs/data/box-textured/box-textured.obj";
const complexObjPath =
  "specs/data/box-complex-material/box-complex-material.obj";
const missingMtllibObjPath =
  "specs/data/box-missing-mtllib/box-missing-mtllib.obj";

describe("obj2gltf", () => {
  it("converts obj to glb", async () => {
    const options = {
      guesser: mtlGuesses("specs/data/box-textured/"),
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    const glb = await obj2gltf(texturedObjBlob, options);
    const magic = glb.toString("utf8", 0, 4);
    expect(magic).toBe("glTF");
  });
  it("converts obj to glb with separate resources", async () => {
    const options = {
      guesser: mtlGuesses("specs/data/box-textured/"),
    };
    const texturedObjBlob = await openAsBlob(texturedObjPath);
    await obj2gltf(texturedObjBlob, options);
  });

  it("converts obj with multiple textures", async () => {
    const options = {
      guesser: mtlGuesses("specs/data/box-complex-material"),
    };
    const complexObjBlob = await openAsBlob(complexObjPath);
    await obj2gltf(complexObjBlob, options);
  });

  it("not sets overriding textures (1)", async () => {
    const options = {
      guesser: mtlGuesses("specs/data/box-complex-material"),
    };

    const complexObjBlob = await openAsBlob(complexObjPath);
    await obj2gltf(complexObjBlob, options);
  });

  it("not sets overriding textures (2)", async () => {
    const options = {
      guesser: mtlGuesses("specs/data/box-complex-material"),
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
      guesser: mtlGuesses("specs/data/box-missing-mtllib"),
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
});
