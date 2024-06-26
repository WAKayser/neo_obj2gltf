import { createGltf } from "./createGltf.js";
import { loadObj } from "./loadObj.js";
import { writeGltf } from "./writeGltf.js";

/**
 * Converts an obj file to a glTF or glb.
 *
 * @param {Blob} objBlob Path to the obj file.
 * @param {Object} [options] An object with the following properties:
 * @param {Boolean} [options.checkTransparency=false] Do a more exhaustive check for texture transparency by looking at the alpha channel of each pixel.
 * @param {Boolean} [options.packOcclusion=false] Pack the occlusion texture in the red channel of the metallic-roughness texture.
 * @param {Boolean} [options.metallicRoughness=false] The values in the mtl file are already metallic-roughness PBR values and no conversion step should be applied. Metallic is stored in the Ks and map_Ks slots and roughness is stored in the Ns and map_Ns slots.
 * @param {Boolean} [options.specularGlossiness=false] The values in the mtl file are already specular-glossiness PBR values and no conversion step should be applied. Specular is stored in the Ks and map_Ks slots and glossiness is stored in the Ns and map_Ns slots. The glTF will be saved with the KHR_materials_pbrSpecularGlossiness extension.
 * @param {Boolean} [options.unlit=false] The glTF will be saved with the KHR_materials_unlit extension.
 * @param {String} [options.triangleWindingOrderSanitization=false] Apply triangle winding order sanitization.
 * @param {Logger} [options.logger] A callback function for handling logged messages. Defaults to console.log.
 * @param {Boolean} [options.doubleSidedMaterial=false] Allows materials to be double sided.
 * @return {Promise} A promise that resolves to the glTF JSON or glb buffer.
 */
export function obj2gltf(objBlob, options) {
  const defaults = obj2gltf.defaults;
  options = options ?? {};
  options.checkTransparency =
    options.checkTransparency ?? defaults.checkTransparency;
  options.doubleSidedMaterial =
    options.doubleSidedMaterial ?? defaults.doubleSidedMaterial;
  options.packOcclusion = options.packOcclusion ?? defaults.packOcclusion;
  options.metallicRoughness =
    options.metallicRoughness ?? defaults.metallicRoughness;
  options.specularGlossiness =
    options.specularGlossiness ?? defaults.specularGlossiness;
  options.unlit = options.unlit ?? defaults.unlit;
  options.logger = options.logger ?? getDefaultLogger();
  options.guesser =
    options.guesser ??
    (() => {
      console.error("no guesser implemented");
    });
  options.resolver =
    options.resolver ??
    (() => {
      console.error("no resolver implemented");
    });
  options.triangleWindingOrderSanitization =
    options.triangleWindingOrderSanitization ??
    defaults.triangleWindingOrderSanitization;

  if (typeof objBlob === "undefined") {
    throw new Error("objPath is required");
  }

  if (
    options.metallicRoughness + options.specularGlossiness + options.unlit >
    1
  ) {
    throw new Error(
      "Only one material type may be set from [metallicRoughness, specularGlossiness, unlit].",
    );
  }

  return loadObj(objBlob, options)
    .then(function (objData) {
      return createGltf(objData, options);
    })
    .then(function (gltf) {
      return writeGltf(gltf, options);
    });
}

function getDefaultLogger() {
  return function (message) {
    console.log(message);
  };
}

/**
 * Default values that will be used when calling obj2gltf(options) unless specified in the options object.
 */
obj2gltf.defaults = {
  /**
   * Gets or sets whether the converter will do a more exhaustive check for texture transparency by looking at the alpha channel of each pixel.
   * @type Boolean
   * @default false
   */
  checkTransparency: false,
  /**
   * Gets and sets whether a material will be doubleSided or not
   * @type Boolean
   * @default false
   */
  doubleSidedMaterial: false,
  /**
   * Gets or sets whether to pack the occlusion texture in the red channel of the metallic-roughness texture.
   * @type Boolean
   * @default false
   */
  packOcclusion: false,
  /**
   * Gets or sets whether rhe values in the .mtl file are already metallic-roughness PBR values and no conversion step should be applied. Metallic is stored in the Ks and map_Ks slots and roughness is stored in the Ns and map_Ns slots.
   * @type Boolean
   * @default false
   */
  metallicRoughness: false,
  /**
   * Gets or sets whether the values in the .mtl file are already specular-glossiness PBR values and no conversion step should be applied. Specular is stored in the Ks and map_Ks slots and glossiness is stored in the Ns and map_Ns slots. The glTF will be saved with the KHR_materials_pbrSpecularGlossiness extension.
   * @type Boolean
   * @default false
   */
  specularGlossiness: false,
  /**
   * Gets or sets whether the glTF will be saved with the KHR_materials_unlit extension.
   * @type Boolean
   * @default false
   */
  unlit: false,
  /**
   * Gets or sets whether triangle winding order sanitization will be applied.
   * @type Boolean
   * @default false
   */
  windingOrderSanitization: false,
};

/**
 * A callback function that logs messages.
 * @callback Logger
 *
 * @param {String} message The message to log.
 */

/**
 * A callback function that writes files that are saved as separate resources.
 * @callback Writer
 *
 * @param {String} file The relative path of the file.
 * @param {Buffer} data The file data to write.
 * @returns {Promise} A promise that resolves when the file is written.
 */
