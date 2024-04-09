import Cartesian3 from "../../lib/Cartesian3.js";
import { loadObj } from "../../lib/loadObj.js";
import { obj2gltf } from "../../lib/obj2gltf.js";
import { openAsBlob } from "fs";
import { resolveFile } from "./resolverSpec.js";

const objNormalsPath = "specs/data/box-normals/box-normals.obj";
const objGroupsPath = "specs/data/box-groups/box-groups.obj";
const objObjectsGroupsPath =
  "specs/data/box-objects-groups/box-objects-groups.obj";
const objObjectsGroupsMaterialsPath2 =
  "specs/data/box-objects-groups-materials-2/box-objects-groups-materials-2.obj";
const objNoMaterialsPath = "specs/data/box-no-materials/box-no-materials.obj";
const objResourcesInRootPath =
  "specs/data/box-resources-in-root/box-resources-in-root.obj";
const objExternalResourcesInRootPath =
  "specs/data/box-external-resources-in-root/box-external-resources-in-root.obj";
const objSubdirectoriesPath = "specs/data/box-subdirectories/box-textured.obj";
const objInvalidContentsPath = "specs/data/box/box.mtl";
const objIncompletePositionsPath =
  "specs/data/box-incomplete-attributes/box-incomplete-positions.obj";
const objIncompleteNormalsPath =
  "specs/data/box-incomplete-attributes/box-incomplete-normals.obj";
const objIncompleteUvsPath =
  "specs/data/box-incomplete-attributes/box-incomplete-uvs.obj";

function getMeshes(data) {
  let meshes = [];
  const nodes = data.nodes;
  const nodesLength = nodes.length;
  for (let i = 0; i < nodesLength; ++i) {
    meshes = meshes.concat(nodes[i].meshes);
  }
  return meshes;
}

function getPrimitives(data) {
  let primitives = [];
  const nodes = data.nodes;
  const nodesLength = nodes.length;
  for (let i = 0; i < nodesLength; ++i) {
    const meshes = nodes[i].meshes;
    const meshesLength = meshes.length;
    for (let j = 0; j < meshesLength; ++j) {
      primitives = primitives.concat(meshes[j].primitives);
    }
  }
  return primitives;
}

let options;

describe("loadObj", () => {
  beforeEach(() => {
    options = structuredClone(obj2gltf.defaults);
    options.resolver = resolveFile;
    options.logger = () => {};
  });

  it("loads obj with positions, normals, and uvs", async () => {
    const objBlob = await openAsBlob("specs/data/box/box.obj");
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box",
    });
    const materials = data.materials;
    const nodes = data.nodes;
    const name = data.name;
    const meshes = getMeshes(data);
    const primitives = getPrimitives(data);

    expect(name).toBe("model");
    expect(materials.length).toBe(1);
    expect(nodes.length).toBe(1);
    expect(meshes.length).toBe(1);
    expect(primitives.length).toBe(1);

    const node = nodes[0];
    const mesh = meshes[0];
    const primitive = primitives[0];

    expect(node.name).toBe("Cube");
    expect(mesh.name).toBe("Cube-Mesh");
    expect(primitive.positions.length / 3).toBe(24);
    expect(primitive.normals.length / 3).toBe(24);
    expect(primitive.uvs.length / 2).toBe(24);
    expect(primitive.indices.length).toBe(36);
    expect(primitive.material).toBe("Material");
  });

  it("loads obj with normals", async () => {
    const objBlob = await openAsBlob(objNormalsPath);
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-normals",
    });
    const primitive = getPrimitives(data)[0];
    expect(primitive.positions.length / 3).toBe(24);
    expect(primitive.normals.length / 3).toBe(24);
    expect(primitive.uvs.length / 2).toBe(0);
  });

  it("normalizes normals", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-unnormalized/box-unnormalized.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-unnormalized",
    });
    const scratchNormal = new Cartesian3();
    const primitive = getPrimitives(data)[0];
    const normals = primitive.normals;
    const normalsLength = normals.length / 3;
    for (let i = 0; i < normalsLength; ++i) {
      const normalX = normals.get(i * 3);
      const normalY = normals.get(i * 3 + 1);
      const normalZ = normals.get(i * 3 + 2);
      const normal = Cartesian3.fromElements(
        normalX,
        normalY,
        normalZ,
        scratchNormal,
      );
      expect(Math.abs(Cartesian3.magnitude(normal) - 1) < 0.0001).toBe(true);
    }
  });

  it("loads obj with uvs", async () => {
    const objBlob = await openAsBlob("specs/data/box-uvs/box-uvs.obj");
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-uvs",
    });
    const primitive = getPrimitives(data)[0];
    expect(primitive.positions.length / 3).toBe(20);
    expect(primitive.normals.length / 3).toBe(0);
    expect(primitive.uvs.length / 2).toBe(20);
  });

  it("loads obj with negative indices", async () => {
    const objBlob1 = await openAsBlob(
      "specs/data/box-positions-only/box-positions-only.obj",
    );
    const objBlob2 = await openAsBlob(
      "specs/data/box-negative-indices/box-negative-indices.obj",
    );

    const results = [
      await loadObj(objBlob1, {
        ...options,
        objDirectory: "specs/data/box-positions-only",
      }),
      await loadObj(objBlob2, {
        ...options,
        objDirectory: "specs/data/box-negative-indices",
      }),
    ];
    const positionsReference = getPrimitives(
      results[0],
    )[0].positions.toFloatBuffer();
    const positions = getPrimitives(results[1])[0].positions.toFloatBuffer();
    expect(positions).toEqual(positionsReference);
  });

  it("loads obj with triangle faces", async () => {
    const objBlob = await openAsBlob("specs/data/box-objects/box-objects.obj");
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-objects",
    });
    const primitive = getPrimitives(data)[0];
    expect(primitive.positions.length / 3).toBe(24);
    expect(primitive.indices.length).toBe(36);
  });

  it("loads obj with objects", async () => {
    const objBlob = await openAsBlob("specs/data/box-objects/box-objects.obj");
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-objects",
    });
    const nodes = data.nodes;
    expect(nodes.length).toBe(3);
    expect(nodes[0].name).toBe("CubeBlue");
    expect(nodes[1].name).toBe("CubeGreen");
    expect(nodes[2].name).toBe("CubeRed");

    const primitives = getPrimitives(data);
    expect(primitives.length).toBe(3);
    expect(primitives[0].material).toBe("Blue");
    expect(primitives[1].material).toBe("Green");
    expect(primitives[2].material).toBe("Red");
  });

  it("loads obj with groups", async () => {
    const objBlob = await openAsBlob(objGroupsPath);
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-groups",
    });
    const nodes = data.nodes;
    expect(nodes.length).toBe(3);
    expect(nodes[0].name).toBe("CubeBlue");
    expect(nodes[1].name).toBe("CubeGreen");
    expect(nodes[2].name).toBe("CubeRed");

    const primitives = getPrimitives(data);
    expect(primitives.length).toBe(3);
    expect(primitives[0].material).toBe("Blue");
    expect(primitives[1].material).toBe("Green");
    expect(primitives[2].material).toBe("Red");
  });

  it("loads obj with objects and groups", async () => {
    const objObjectsGroupsBlob = await openAsBlob(objObjectsGroupsPath);
    const data = await loadObj(objObjectsGroupsBlob, {
      ...options,
      objDirectory: "specs/data/box-objects-groups",
    });
    const nodes = data.nodes;
    expect(nodes.length).toBe(3);
    expect(nodes[0].name).toBe("CubeBlue");
    expect(nodes[1].name).toBe("CubeGreen");
    expect(nodes[2].name).toBe("CubeRed");

    const meshes = getMeshes(data);
    expect(meshes.length).toBe(3);
    expect(meshes[0].name).toBe("CubeBlue_CubeBlue_Blue");
    expect(meshes[1].name).toBe("CubeGreen_CubeGreen_Green");
    expect(meshes[2].name).toBe("CubeRed_CubeRed_Red");

    const primitives = getPrimitives(data);
    expect(primitives.length).toBe(3);
    expect(primitives[0].material).toBe("Blue");
    expect(primitives[1].material).toBe("Green");
    expect(primitives[2].material).toBe("Red");
  });

  function loadsObjWithObjectsGroupsAndMaterials(data) {
    const nodes = data.nodes;
    expect(nodes.length).toBe(1);
    expect(nodes[0].name).toBe("Cube");
    const meshes = getMeshes(data);
    expect(meshes.length).toBe(3);
    expect(meshes[0].name).toBe("Blue");
    expect(meshes[1].name).toBe("Green");
    expect(meshes[2].name).toBe("Red");
    const primitives = getPrimitives(data);
    expect(primitives.length).toBe(6);
    expect(primitives[0].material).toBe("Blue");
    expect(primitives[1].material).toBe("Green");
    expect(primitives[2].material).toBe("Green");
    expect(primitives[3].material).toBe("Red");
    expect(primitives[4].material).toBe("Red");
    expect(primitives[5].material).toBe("Blue");
  }

  it("loads obj with objects, groups, and materials", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-objects-groups-materials/box-objects-groups-materials.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-objects-groups-materials",
    });
    loadsObjWithObjectsGroupsAndMaterials(data);
  });

  it("loads obj with objects, groups, and materials (2)", async () => {
    // The usemtl lines are placed in an unordered fashion but
    // should produce the same result as the previous test
    const objBlob = await openAsBlob(objObjectsGroupsMaterialsPath2);
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-objects-groups-materials-2",
    });
    loadsObjWithObjectsGroupsAndMaterials(data);
  });

  it("loads obj with concave face containing 5 vertices", async () => {
    const objBlob = await openAsBlob("specs/data/concave/concave.obj");
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/concave",
    });
    const primitive = getPrimitives(data)[0];
    expect(primitive.positions.length / 3).toBe(30);
    expect(primitive.indices.length).toBe(48);
  });

  it("loads obj with usemtl only", async () => {
    const objBlob = await openAsBlob("specs/data/box-usemtl/box-usemtl.obj");
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-usemtl",
    });
    const nodes = data.nodes;
    expect(nodes.length).toBe(1);
    expect(nodes[0].name).toBe("Node"); // default name

    const meshes = getMeshes(data);
    expect(meshes.length).toBe(1);
    expect(meshes[0].name).toBe("Node-Mesh");

    const primitives = getPrimitives(data);
    expect(primitives.length).toBe(3);
    expect(primitives[0].material).toBe("Blue");
    expect(primitives[1].material).toBe("Green");
    expect(primitives[2].material).toBe("Red");
  });

  it("loads obj with no materials", async () => {
    const objBlob = await openAsBlob(objNoMaterialsPath);
    const data = await loadObj(objBlob, options);
    const nodes = data.nodes;
    expect(nodes.length).toBe(1);
    expect(nodes[0].name).toBe("Node"); // default name

    const primitives = getPrimitives(data);
    expect(primitives.length).toBe(1);
  });

  it("loads obj with multiple materials", async () => {
    // The usemtl markers are interleaved, but should condense to just three primitives
    const objBlob = await openAsBlob(
      "specs/data/box-multiple-materials/box-multiple-materials.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-multiple-materials",
    });
    const nodes = data.nodes;
    expect(nodes.length).toBe(1);

    const primitives = getPrimitives(data);
    expect(primitives.length).toBe(3);

    expect(primitives[0].indices.length).toBe(12);
    expect(primitives[1].indices.length).toBe(12);
    expect(primitives[2].indices.length).toBe(12);
    expect(primitives[0].material).toBe("Red");
    expect(primitives[1].material).toBe("Green");
    expect(primitives[2].material).toBe("Blue");

    for (let i = 0; i < 3; ++i) {
      const indices = primitives[i].indices;
      for (let j = 0; j < indices.length; ++j) {
        expect(indices.get(j)).toBeLessThan(8);
      }
    }
  });

  it("loads obj uncleaned", async () => {
    // Obj with extraneous o, g, and usemtl lines
    // Also tests handling of o and g lines with the same names
    const objBlob = await openAsBlob(
      "specs/data/box-uncleaned/box-uncleaned.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-uncleaned",
    });
    const nodes = data.nodes;
    const meshes = getMeshes(data);
    const primitives = getPrimitives(data);

    expect(nodes.length).toBe(1);
    expect(meshes.length).toBe(1);
    expect(primitives.length).toBe(1);

    expect(nodes[0].name).toBe("Cube");
    expect(meshes[0].name).toBe("Cube_1");
  });

  it("loads obj with multiple mtllibs", async () => {
    const objBlob = await openAsBlob("specs/data/box-mtllib/box-mtllib.obj");
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-mtllib",
    });
    const materials = data.materials;
    expect(materials.length).toBe(3);

    // .mtl files are loaded in an arbitrary order, so sort for testing purposes
    materials.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    expect(materials[0].name).toBe("Blue");
    expect(materials[0].pbrMetallicRoughness.baseColorFactor).toEqual([
      0.0, 0.0, 0.64, 1.0,
    ]);
    expect(materials[1].name).toBe("Green");
    expect(materials[1].pbrMetallicRoughness.baseColorFactor).toEqual([
      0.0, 0.64, 0.0, 1.0,
    ]);
    expect(materials[2].name).toBe("Red");
    expect(materials[2].pbrMetallicRoughness.baseColorFactor).toEqual([
      0.64, 0.0, 0.0, 1.0,
    ]);
  });

  it("loads obj with mtllib paths with spaces", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-mtllib-spaces/box mtllib.obj",
    );

    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-mtllib-spaces",
    });
    const materials = data.materials;
    expect(materials.length).toBe(3);

    // .mtl files are loaded in an arbitrary order, so sort for testing purposes
    materials.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    expect(materials[0].name).toBe("Blue");
    expect(materials[0].pbrMetallicRoughness.baseColorFactor).toEqual([
      0.0, 0.0, 0.64, 1.0,
    ]);
    expect(materials[1].name).toBe("Green");
    expect(materials[1].pbrMetallicRoughness.baseColorFactor).toEqual([
      0.0, 0.64, 0.0, 1.0,
    ]);
    expect(materials[2].name).toBe("Red");
    expect(materials[2].pbrMetallicRoughness.baseColorFactor).toEqual([
      0.64, 0.0, 0.0, 1.0,
    ]);
  });

  it("loads obj with missing mtllib", async () => {
    const spy = jasmine.createSpy("logger");
    options.logger = spy;
    const objBlob = await openAsBlob(
      "specs/data/box-missing-mtllib/box-missing-mtllib.obj",
    );

    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-missing-mtllib",
    });
    expect(data.materials.length).toBe(0);
    // expect(spy.calls.argsFor(0)[0].indexOf("ENOENT") >= 0).toBe(true);
    expect(
      spy.calls
        .argsFor(1)[0]
        .indexOf(
          "Attempting to read the material file from within the obj directory instead.",
        ) >= 0,
    ).toBe(true);
    // expect(spy.calls.argsFor(2)[0].indexOf("ENOENT") >= 0).toBe(true);
    expect(
      spy.calls.argsFor(3)[0].indexOf("Could not read material file") >= 0,
    ).toBe(true);
  });

  it("loads obj with missing usemtl", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-missing-usemtl/box-missing-usemtl.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-missing-usemtl",
    });
    expect(data.materials.length).toBe(1);
    expect(data.nodes[0].meshes[0].primitives[0].material).toBe("Material");
  });

  it("loads obj with unnamed material", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-unnamed-material/box-unnamed-material.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-unnamed-material",
    });
    expect(data.materials.length).toBe(1);
    expect(data.nodes[0].meshes[0].primitives[0].material).toBe("");
  });

  it("loads .mtl outside of the obj directory", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-external-resources/box-external-resources.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-external-resources",
    });
    const materials = data.materials;
    expect(materials.length).toBe(2);

    // .mtl files are loaded in an arbitrary order, so find the "MaterialTextured" material
    const materialTextured =
      materials[0].name === "MaterialTextured" ? materials[0] : materials[1];
    const baseColorTexture =
      materialTextured.pbrMetallicRoughness.baseColorTexture;
    expect(baseColorTexture.source).toBeDefined();
    expect(baseColorTexture.name).toEqual("cesium");
  });

  it("loads .mtl from root directory when the .mtl path does not exist", async () => {
    const objBlob = await openAsBlob(objResourcesInRootPath);
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-resources-in-root",
    });
    const baseColorTexture =
      data.materials[0].pbrMetallicRoughness.baseColorTexture;
    expect(baseColorTexture.name).toBe("cesium");
    expect(baseColorTexture.source).toBeDefined();
  });

  it("loads .mtl from root directory when the .mtl path is outside of the obj directory and secure is true", async () => {
    const objBlob = await openAsBlob(objExternalResourcesInRootPath);
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-external-resources-in-root",
    });
    const materials = data.materials;
    expect(materials.length).toBe(2);

    // .mtl files are loaded in an arbitrary order, so find the "MaterialTextured" material
    const materialTextured =
      materials[0].name === "MaterialTextured" ? materials[0] : materials[1];
    const baseColorTexture =
      materialTextured.pbrMetallicRoughness.baseColorTexture;
    expect(baseColorTexture.source).toBeDefined();
    expect(baseColorTexture.name).toEqual("cesium");
  });

  it("loads obj with texture", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-textured/box-textured.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-textured",
    });
    const baseColorTexture =
      data.materials[0].pbrMetallicRoughness.baseColorTexture;
    expect(baseColorTexture.name).toBe("cesium");
    expect(baseColorTexture.source).toBeDefined();
  });

  it("loads obj with missing texture", async () => {
    const spy = jasmine.createSpy("logger");
    options.logger = spy;

    const objBlob = await openAsBlob(
      "specs/data/box-missing-texture/box-missing-texture.obj",
    );

    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-missing-texture",
    });
    expect(data.materials[0]).toBeUndefined();
  });

  it("loads obj with subdirectories", async () => {
    const objBlob = await openAsBlob(objSubdirectoriesPath);
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-subdirectories",
    });
    const baseColorTexture =
      data.materials[0].pbrMetallicRoughness.baseColorTexture;
    expect(baseColorTexture.name).toBe("cesium");
    expect(baseColorTexture.source).toBeDefined();
  });

  it("loads obj with windows paths", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-windows-paths/box-windows-paths.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-windows-paths",
    });
    const baseColorTexture =
      data.materials[0].pbrMetallicRoughness.baseColorTexture;
    expect(baseColorTexture.name).toBe("cesium");
    expect(baseColorTexture.source).toBeDefined();
  });

  it("loads an obj where coordinates are separated by tabs", async () => {
    /**
     * We know Tinkercad to produce files with coordinates separated by tabs.
     */
    const objBlob = await openAsBlob(
      "specs/data/box-with-tabs/box-with-tabs.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-with-tabs",
    });
    const primitive = getPrimitives(data)[0];
    expect(primitive.positions.length / 3).toBe(24);
    expect(primitive.normals.length / 3).toBe(24);
    expect(primitive.uvs.length / 2).toBe(24);
  });

  it("separates faces that don't use the same attributes as other faces in the primitive", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-mixed-attributes/box-mixed-attributes.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-mixed-attributes",
    });
    const primitives = getPrimitives(data);
    expect(primitives.length).toBe(4);
    expect(primitives[0].indices.length).toBe(18); // 6 faces
    expect(primitives[1].indices.length).toBe(6); // 2 faces
    expect(primitives[2].indices.length).toBe(6); // 2 faces
    expect(primitives[3].indices.length).toBe(6); // 2 faces
  });

  // function getFirstPosition(data) {
  //   const primitive = getPrimitives(data)[0];
  //   return new Cartesian3(
  //     primitive.positions.get(0),
  //     primitive.positions.get(1),
  //     primitive.positions.get(2),
  //   );
  // }

  // function getFirstNormal(data) {
  //   const primitive = getPrimitives(data)[0];
  //   return new Cartesian3(
  //     primitive.normals.get(0),
  //     primitive.normals.get(1),
  //     primitive.normals.get(2),
  //   );
  // }

  // async function checkAxisConversion(
  //   inputUpAxis,
  //   outputUpAxis,
  //   position,
  //   normal,
  // ) {
  //   const sameAxis = inputUpAxis === outputUpAxis;
  //   options.inputUpAxis = inputUpAxis;
  //   options.outputUpAxis = outputUpAxis;
  //   const data = await loadObj(objRotatedUrl, options);
  //   const rotatedPosition = getFirstPosition(data);
  //   const rotatedNormal = getFirstNormal(data);
  //   if (sameAxis) {
  //     expect(rotatedPosition).toEqual(position);
  //     expect(rotatedNormal).toEqual(normal);
  //   } else {
  //     expect(rotatedPosition).not.toEqual(position);
  //     expect(rotatedNormal).not.toEqual(normal);
  //   }
  // }
  //
  // it("performs up axis conversion", async () => {
  //   const data = await loadObj(objRotatedUrl, options);
  //   const position = getFirstPosition(data);
  //   const normal = getFirstNormal(data);
  //
  //   const axes = ["X", "Y", "Z"];
  //   const axesLength = axes.length;
  //   for (let i = 0; i < axesLength; ++i) {
  //     for (let j = 0; j < axesLength; ++j) {
  //       await checkAxisConversion(axes[i], axes[j], position, normal);
  //     }
  //   }
  // });

  it("ignores missing normals and uvs", async () => {
    const objBlob = await openAsBlob(
      "specs/data/box-missing-attributes/box-missing-attributes.obj",
    );
    const data = await loadObj(objBlob, {
      ...options,
      objDirectory: "specs/data/box-missing-attributes",
    });
    const primitive = getPrimitives(data)[0];
    expect(primitive.positions.length).toBeGreaterThan(0);
    expect(primitive.normals.length).toBe(0);
    expect(primitive.uvs.length).toBe(0);
  });

  async function loadAndGetIndices(objPath, options) {
    const objBlob = await openAsBlob(objPath);
    const data = await loadObj(objBlob, options);
    const primitive = getPrimitives(data)[0];
    const indices = primitive.indices;
    return new Uint16Array(indices.toUint16Buffer().buffer);
  }

  it("applies triangle winding order sanitization", async () => {
    options.triangleWindingOrderSanitization = false;
    options.objDirectory = "specs/data/box-incorrect-winding-order";

    const indicesIncorrect = await loadAndGetIndices(
      "specs/data/box-incorrect-winding-order/box-incorrect-winding-order.obj",
      options,
    );

    options.triangleWindingOrderSanitization = true;
    const indicesCorrect = await loadAndGetIndices(
      "specs/data/box-incorrect-winding-order/box-incorrect-winding-order.obj",
      options,
    );

    expect(indicesIncorrect[0]).toBe(0);
    expect(indicesIncorrect[2]).toBe(2);
    expect(indicesIncorrect[1]).toBe(1);

    expect(indicesCorrect[0]).toBe(0);
    expect(indicesCorrect[2]).toBe(1);
    expect(indicesCorrect[1]).toBe(2);
  });

  it("throws when position index is out of bounds", async () => {
    let thrownError;
    const objBlob = await openAsBlob(objIncompletePositionsPath);
    try {
      await loadObj(objBlob, options);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toEqual(new Error("Position index 1 is out of bounds"));
  });

  it("throws when normal index is out of bounds", async () => {
    const objBlob = await openAsBlob(objIncompleteNormalsPath);
    let thrownError;
    try {
      await loadObj(objBlob, options);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toEqual(new Error("Normal index 1 is out of bounds"));
  });

  it("throws when uv index is out of bounds", async () => {
    const blobObj = await openAsBlob(objIncompleteUvsPath);
    let thrownError;
    try {
      await loadObj(blobObj, options);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toEqual(new Error("UV index 1 is out of bounds"));
  });

  it("throws when file has invalid contents", async () => {
    const blobObj = await openAsBlob(objInvalidContentsPath);
    let thrownError;
    try {
      await loadObj(blobObj, options);
    } catch (e) {
      thrownError = e;
    }
    expect(thrownError).toEqual(
      new Error(`supplied model does not have any geometry data`),
    );
  });
});
