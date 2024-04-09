import Cartesian3 from "./Cartesian3.js";
import { ComponentDatatype } from "./ComponentDataType.js";

import path from "path";
import { ArrayStorage } from "./ArrayStorage.js";
import { loadMtl } from "./loadMtl.js";
import earcut from "earcut";

function defined(value) {
  return typeof value !== "undefined";
}

function Node() {
  this.name = undefined;
  this.meshes = [];
}

function Matrix3(
  column0Row0,
  column1Row0,
  column2Row0,
  column0Row1,
  column1Row1,
  column2Row1,
  column0Row2,
  column1Row2,
  column2Row2,
) {
  this[0] = column0Row0 ?? 0.0;
  this[1] = column0Row1 ?? 0.0;
  this[2] = column0Row2 ?? 0.0;
  this[3] = column1Row0 ?? 0.0;
  this[4] = column1Row1 ?? 0.0;
  this[5] = column1Row2 ?? 0.0;
  this[6] = column2Row0 ?? 0.0;
  this[7] = column2Row1 ?? 0.0;
  this[8] = column2Row2 ?? 0.0;
}

Matrix3.clone = function (matrix, result) {
  if (!defined(matrix)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Matrix3(
      matrix[0],
      matrix[3],
      matrix[6],
      matrix[1],
      matrix[4],
      matrix[7],
      matrix[2],
      matrix[5],
      matrix[8],
    );
  }
  result[0] = matrix[0];
  result[1] = matrix[1];
  result[2] = matrix[2];
  result[3] = matrix[3];
  result[4] = matrix[4];
  result[5] = matrix[5];
  result[6] = matrix[6];
  result[7] = matrix[7];
  result[8] = matrix[8];
  return result;
};

Matrix3.multiply = function (left, right, result) {
  const column0Row0 =
    left[0] * right[0] + left[3] * right[1] + left[6] * right[2];
  const column0Row1 =
    left[1] * right[0] + left[4] * right[1] + left[7] * right[2];
  const column0Row2 =
    left[2] * right[0] + left[5] * right[1] + left[8] * right[2];

  const column1Row0 =
    left[0] * right[3] + left[3] * right[4] + left[6] * right[5];
  const column1Row1 =
    left[1] * right[3] + left[4] * right[4] + left[7] * right[5];
  const column1Row2 =
    left[2] * right[3] + left[5] * right[4] + left[8] * right[5];

  const column2Row0 =
    left[0] * right[6] + left[3] * right[7] + left[6] * right[8];
  const column2Row1 =
    left[1] * right[6] + left[4] * right[7] + left[7] * right[8];
  const column2Row2 =
    left[2] * right[6] + left[5] * right[7] + left[8] * right[8];

  result[0] = column0Row0;
  result[1] = column0Row1;
  result[2] = column0Row2;
  result[3] = column1Row0;
  result[4] = column1Row1;
  result[5] = column1Row2;
  result[6] = column2Row0;
  result[7] = column2Row1;
  result[8] = column2Row2;
  return result;
};

Matrix3.ZERO = Object.freeze(
  new Matrix3(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
);

function computeFrobeniusNorm(matrix) {
  let norm = 0.0;
  for (let i = 0; i < 9; ++i) {
    const temp = matrix[i];
    norm += temp * temp;
  }

  return Math.sqrt(norm);
}

Matrix3.getElementIndex = function (column, row) {
  return column * 3 + row;
};

Matrix3.IDENTITY = Object.freeze(
  new Matrix3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0),
);

const rowVal = [1, 0, 0];
const colVal = [2, 2, 1];

function shurDecomposition(matrix, result) {
  // This routine was created based upon Matrix Computations, 3rd ed., by Golub and Van Loan,
  // section 8.4.2 The 2by2 Symmetric Schur Decomposition.
  //
  // The routine takes a matrix, which is assumed to be symmetric, and
  // finds the largest off-diagonal term, and then creates
  // a matrix (result) which can be used to help reduce it

  const tolerance = 1e-15;

  let maxDiagonal = 0.0;
  let rotAxis = 1;

  // find pivot (rotAxis) based on max diagonal of matrix
  for (let i = 0; i < 3; ++i) {
    const temp = Math.abs(
      matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])],
    );
    if (temp > maxDiagonal) {
      rotAxis = i;
      maxDiagonal = temp;
    }
  }

  let c = 1.0;
  let s = 0.0;

  const p = rowVal[rotAxis];
  const q = colVal[rotAxis];

  if (Math.abs(matrix[Matrix3.getElementIndex(q, p)]) > tolerance) {
    const qq = matrix[Matrix3.getElementIndex(q, q)];
    const pp = matrix[Matrix3.getElementIndex(p, p)];
    const qp = matrix[Matrix3.getElementIndex(q, p)];

    const tau = (qq - pp) / 2.0 / qp;
    let t;

    if (tau < 0.0) {
      t = -1.0 / (-tau + Math.sqrt(1.0 + tau * tau));
    } else {
      t = 1.0 / (tau + Math.sqrt(1.0 + tau * tau));
    }

    c = 1.0 / Math.sqrt(1.0 + t * t);
    s = t * c;
  }

  result = Matrix3.clone(Matrix3.IDENTITY, result);

  result[Matrix3.getElementIndex(p, p)] = result[
    Matrix3.getElementIndex(q, q)
  ] = c;
  result[Matrix3.getElementIndex(q, p)] = s;
  result[Matrix3.getElementIndex(p, q)] = -s;

  return result;
}

function offDiagonalFrobeniusNorm(matrix) {
  // Computes the "off-diagonal" Frobenius norm.
  // Assumes matrix is symmetric.

  let norm = 0.0;
  for (let i = 0; i < 3; ++i) {
    const temp = matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])];
    norm += 2.0 * temp * temp;
  }

  return Math.sqrt(norm);
}

Matrix3.transpose = function (matrix, result) {
  const column0Row0 = matrix[0];
  const column0Row1 = matrix[3];
  const column0Row2 = matrix[6];
  const column1Row0 = matrix[1];
  const column1Row1 = matrix[4];
  const column1Row2 = matrix[7];
  const column2Row0 = matrix[2];
  const column2Row1 = matrix[5];
  const column2Row2 = matrix[8];

  result[0] = column0Row0;
  result[1] = column0Row1;
  result[2] = column0Row2;
  result[3] = column1Row0;
  result[4] = column1Row1;
  result[5] = column1Row2;
  result[6] = column2Row0;
  result[7] = column2Row1;
  result[8] = column2Row2;
  return result;
};

Matrix3.computeEigenDecomposition = function (matrix, result) {
  const jMatrix = new Matrix3();
  const jMatrixTranspose = new Matrix3();

  // This routine was created based upon Matrix Computations, 3rd ed., by Golub and Van Loan,
  // section 8.4.3 The Classical Jacobi Algorithm

  const tolerance = 1e-20;
  const maxSweeps = 10;

  let count = 0;
  let sweep = 0;

  if (!defined(result)) {
    result = {};
  }

  const unitaryMatrix = (result.unitary = Matrix3.clone(
    Matrix3.IDENTITY,
    result.unitary,
  ));
  const diagMatrix = (result.diagonal = Matrix3.clone(matrix, result.diagonal));

  const epsilon = tolerance * computeFrobeniusNorm(diagMatrix);

  while (sweep < maxSweeps && offDiagonalFrobeniusNorm(diagMatrix) > epsilon) {
    shurDecomposition(diagMatrix, jMatrix);
    Matrix3.transpose(jMatrix, jMatrixTranspose);
    Matrix3.multiply(diagMatrix, jMatrix, diagMatrix);
    Matrix3.multiply(jMatrixTranspose, diagMatrix, diagMatrix);
    Matrix3.multiply(unitaryMatrix, jMatrix, unitaryMatrix);

    if (++count > 2) {
      ++sweep;
      count = 0;
    }
  }

  return result;
};

function computeArea2D(positions) {
  const length = positions.length;
  let area = 0.0;

  for (let i0 = length - 1, i1 = 0; i1 < length; i0 = i1++) {
    const v0 = positions[i0];
    const v1 = positions[i1];

    area += v0.x * v1.y - v1.x * v0.y;
  }

  return area * 0.5;
}

function computeWindingOrder2D(positions) {
  const area = computeArea2D(positions);
  return area > 0.0 ? 0x0901 : 0x0900;
}

function triangulate(positions, holes) {
  const flattenedPositions = Cartesian2.packArray(positions);
  return earcut(flattenedPositions, holes, 2);
}

function OrientedBoundingBox(center, halfAxes) {
  /**
   * The center of the box.
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.center = Cartesian3.clone(center ?? Cartesian3.ZERO);
  /**
   * The three orthogonal half-axes of the bounding box. Equivalently, the
   * transformation matrix, to rotate and scale a 2x2x2 cube centered at the
   * origin.
   * @type {Matrix3}
   * @default {@link Matrix3.ZERO}
   */
  this.halfAxes = Matrix3.clone(halfAxes ?? Matrix3.ZERO);
}

const scratchCartesian1 = new Cartesian3();
const scratchCartesian2 = new Cartesian3();
const scratchCartesian3 = new Cartesian3();
const scratchCartesian4 = new Cartesian3();
const scratchCartesian5 = new Cartesian3();
const scratchCartesian6 = new Cartesian3();
const scratchCovarianceResult = new Matrix3();
const scratchEigenResult = {
  unitary: new Matrix3(),
  diagonal: new Matrix3(),
};

Matrix3.getColumn = function (matrix, index, result) {
  const startIndex = index * 3;
  const x = matrix[startIndex];
  const y = matrix[startIndex + 1];
  const z = matrix[startIndex + 2];

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

Matrix3.multiplyByScale = function (matrix, scale, result) {
  result[0] = matrix[0] * scale.x;
  result[1] = matrix[1] * scale.x;
  result[2] = matrix[2] * scale.x;
  result[3] = matrix[3] * scale.y;
  result[4] = matrix[4] * scale.y;
  result[5] = matrix[5] * scale.y;
  result[6] = matrix[6] * scale.z;
  result[7] = matrix[7] * scale.z;
  result[8] = matrix[8] * scale.z;

  return result;
};

OrientedBoundingBox.fromPoints = function (positions, result) {
  if (!defined(result)) {
    result = new OrientedBoundingBox();
  }

  if (!defined(positions) || positions.length === 0) {
    result.halfAxes = Matrix3.ZERO;
    result.center = Cartesian3.ZERO;
    return result;
  }

  let i;
  const length = positions.length;

  const meanPoint = Cartesian3.clone(positions[0], scratchCartesian1);
  for (i = 1; i < length; i++) {
    Cartesian3.add(meanPoint, positions[i], meanPoint);
  }
  const invLength = 1.0 / length;
  Cartesian3.multiplyByScalar(meanPoint, invLength, meanPoint);

  let exx = 0.0;
  let exy = 0.0;
  let exz = 0.0;
  let eyy = 0.0;
  let eyz = 0.0;
  let ezz = 0.0;
  let p;

  for (i = 0; i < length; i++) {
    p = Cartesian3.subtract(positions[i], meanPoint, scratchCartesian2);
    exx += p.x * p.x;
    exy += p.x * p.y;
    exz += p.x * p.z;
    eyy += p.y * p.y;
    eyz += p.y * p.z;
    ezz += p.z * p.z;
  }

  exx *= invLength;
  exy *= invLength;
  exz *= invLength;
  eyy *= invLength;
  eyz *= invLength;
  ezz *= invLength;

  const covarianceMatrix = scratchCovarianceResult;
  covarianceMatrix[0] = exx;
  covarianceMatrix[1] = exy;
  covarianceMatrix[2] = exz;
  covarianceMatrix[3] = exy;
  covarianceMatrix[4] = eyy;
  covarianceMatrix[5] = eyz;
  covarianceMatrix[6] = exz;
  covarianceMatrix[7] = eyz;
  covarianceMatrix[8] = ezz;

  const eigenDecomposition = Matrix3.computeEigenDecomposition(
    covarianceMatrix,
    scratchEigenResult,
  );
  const rotation = Matrix3.clone(eigenDecomposition.unitary, result.halfAxes);

  let v1 = Matrix3.getColumn(rotation, 0, scratchCartesian4);
  let v2 = Matrix3.getColumn(rotation, 1, scratchCartesian5);
  let v3 = Matrix3.getColumn(rotation, 2, scratchCartesian6);

  let u1 = -Number.MAX_VALUE;
  let u2 = -Number.MAX_VALUE;
  let u3 = -Number.MAX_VALUE;
  let l1 = Number.MAX_VALUE;
  let l2 = Number.MAX_VALUE;
  let l3 = Number.MAX_VALUE;

  for (i = 0; i < length; i++) {
    p = positions[i];
    u1 = Math.max(Cartesian3.dot(v1, p), u1);
    u2 = Math.max(Cartesian3.dot(v2, p), u2);
    u3 = Math.max(Cartesian3.dot(v3, p), u3);

    l1 = Math.min(Cartesian3.dot(v1, p), l1);
    l2 = Math.min(Cartesian3.dot(v2, p), l2);
    l3 = Math.min(Cartesian3.dot(v3, p), l3);
  }

  v1 = Cartesian3.multiplyByScalar(v1, 0.5 * (l1 + u1), v1);
  v2 = Cartesian3.multiplyByScalar(v2, 0.5 * (l2 + u2), v2);
  v3 = Cartesian3.multiplyByScalar(v3, 0.5 * (l3 + u3), v3);

  const center = Cartesian3.add(v1, v2, result.center);
  Cartesian3.add(center, v3, center);

  const scale = scratchCartesian3;
  scale.x = u1 - l1;
  scale.y = u2 - l2;
  scale.z = u3 - l3;
  Cartesian3.multiplyByScalar(scale, 0.5, scale);
  Matrix3.multiplyByScale(result.halfAxes, scale, result.halfAxes);

  return result;
};

const scratchXAxis = new Cartesian3();
const scratchYAxis = new Cartesian3();
const scratchZAxis = new Cartesian3();
const obbScratch = new OrientedBoundingBox();

function computeProjectTo2DArguments(
  positions,
  centerResult,
  planeAxis1Result,
  planeAxis2Result,
) {
  const orientedBoundingBox = OrientedBoundingBox.fromPoints(
    positions,
    obbScratch,
  );
  const halfAxes = orientedBoundingBox.halfAxes;
  const xAxis = Matrix3.getColumn(halfAxes, 0, scratchXAxis);
  const yAxis = Matrix3.getColumn(halfAxes, 1, scratchYAxis);
  const zAxis = Matrix3.getColumn(halfAxes, 2, scratchZAxis);

  const xMag = Cartesian3.magnitude(xAxis);
  const yMag = Cartesian3.magnitude(yAxis);
  const zMag = Cartesian3.magnitude(zAxis);
  const min = Math.min(xMag, yMag, zMag);

  // If all the points are on a line return undefined because we can't draw a polygon
  if (
    (xMag === 0 && (yMag === 0 || zMag === 0)) ||
    (yMag === 0 && zMag === 0)
  ) {
    return false;
  }

  let planeAxis1;
  let planeAxis2;

  if (min === yMag || min === zMag) {
    planeAxis1 = xAxis;
  }
  if (min === xMag) {
    planeAxis1 = yAxis;
  } else if (min === zMag) {
    planeAxis2 = yAxis;
  }
  if (min === xMag || min === yMag) {
    planeAxis2 = zAxis;
  }

  Cartesian3.normalize(planeAxis1, planeAxis1Result);
  Cartesian3.normalize(planeAxis2, planeAxis2Result);
  Cartesian3.clone(orientedBoundingBox.center, centerResult);
  return true;
}

function Mesh() {
  this.name = undefined;
  this.primitives = [];
}

function Primitive() {
  this.material = undefined;
  this.indices = new ArrayStorage(ComponentDatatype.UNSIGNED_INT);
  this.positions = new ArrayStorage(ComponentDatatype.FLOAT);
  this.normals = new ArrayStorage(ComponentDatatype.FLOAT);
  this.uvs = new ArrayStorage(ComponentDatatype.FLOAT);
}

// OBJ regex patterns are modified from ThreeJS (https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/OBJLoader.js)
const vertexPattern =
  /v(\s+[\d|\.|\+|\-|e|E]+)(\s+[\d|\.|\+|\-|e|E]+)(\s+[\d|\.|\+|\-|e|E]+)/; // v float float float
const normalPattern =
  /vn(\s+[\d|\.|\+|\-|e|E]+)(\s+[\d|\.|\+|\-|e|E]+)(\s+[\d|\.|\+|\-|e|E]+)/; // vn float float float
const uvPattern = /vt(\s+[\d|\.|\+|\-|e|E]+)(\s+[\d|\.|\+|\-|e|E]+)/; // vt float float
const facePattern = /(-?\d+)\/?(-?\d*)\/?(-?\d*)/g; // for any face format "f v", "f v/v", "f v//v", "f v/v/v"

const scratchCartesian = new Cartesian3();

function Cartesian2(x, y) {
  /**
   * The X component.
   * @type {number}
   * @default 0.0
   */
  this.x = x ?? 0;

  /**
   * The Y component.
   * @type {number}
   * @default 0.0
   */
  this.y = y ?? 0;
}

Cartesian2.pack = function (value, array, startingIndex) {
  startingIndex = startingIndex ?? 0;

  array[startingIndex++] = value.x;
  array[startingIndex] = value.y;

  return array;
};

Cartesian2.packArray = function (array, result) {
  const length = array.length;

  const resultLength = length * 2;
  if (!defined(result)) {
    result = new Array(resultLength);
  } else if (!Array.isArray(result) && result.length !== resultLength) {
    //>>includeStart('debug', pragmas.debug);
    throw new Error(
      "If result is a typed array, it must have exactly array.length * 2 elements",
    );
    //>>includeEnd('debug');
  } else if (result.length !== resultLength) {
    result.length = resultLength;
  }

  for (let i = 0; i < length; ++i) {
    Cartesian2.pack(array[i], result, i * 2);
  }
  return result;
};

const scratchIntersectionPoint = new Cartesian3();
function projectTo2D(position, center, axis1, axis2, result) {
  const v = Cartesian3.subtract(position, center, scratchIntersectionPoint);
  const x = Cartesian3.dot(axis1, v);
  const y = Cartesian3.dot(axis2, v);

  result = new Cartesian2(x, y);
  return result;
}

function createProjectPointsTo2DFunction(center, axis1, axis2) {
  return function (positions) {
    const positionResults = new Array(positions.length);
    for (let i = 0; i < positions.length; i++) {
      positionResults[i] = projectTo2D(positions[i], center, axis1, axis2);
    }

    return positionResults;
  };
}

/**
 * Parse an obj file.
 *
 * @param {Blob} objBlob Path to the obj file.
 * @param {Object} options The options object passed along from lib/obj2gltf.js
 * @returns {Promise} A promise resolving to the obj data, which includes an array of nodes containing geometry information and an array of materials.
 *
 * @private
 */
export async function loadObj(objBlob, options) {
  // const axisTransform = getAxisTransform(
  //   options.inputUpAxis,
  //   options.outputUpAxis,
  // );

  // Global store of vertex attributes listed in the obj file
  let globalPositions = new ArrayStorage(ComponentDatatype.FLOAT);
  let globalNormals = new ArrayStorage(ComponentDatatype.FLOAT);
  let globalUvs = new ArrayStorage(ComponentDatatype.FLOAT);

  // The current node, mesh, and primitive
  let node;
  let mesh;
  let primitive;
  let activeMaterial;

  // All nodes seen in the obj
  const nodes = [];

  // Used to build the indices. The vertex cache is unique to each primitive.
  let vertexCache = {};
  const vertexCacheLimit = 1000000;
  let vertexCacheCount = 0;
  let vertexCount = 0;

  // All mtl paths seen in the obj
  let mtlPaths = [];

  // Buffers for face data that spans multiple lines
  let lineBuffer = "";

  // Used for parsing face data
  const faceVertices = [];
  const facePositions = [];
  const faceUvs = [];
  const faceNormals = [];

  function clearVertexCache() {
    vertexCache = {};
    vertexCacheCount = 0;
  }

  function getName(name) {
    return name === "" ? undefined : name;
  }

  function addNode(name) {
    node = new Node();
    node.name = getName(name);
    nodes.push(node);
    addMesh();
  }

  function addMesh(name) {
    mesh = new Mesh();
    mesh.name = getName(name);
    node.meshes.push(mesh);
    addPrimitive();
  }

  function addPrimitive() {
    primitive = new Primitive();
    primitive.material = activeMaterial;
    mesh.primitives.push(primitive);

    // Clear the vertex cache for each new primitive
    clearVertexCache();
    vertexCount = 0;
  }

  function reusePrimitive(callback) {
    const primitives = mesh.primitives;
    const primitivesLength = primitives.length;
    for (let i = 0; i < primitivesLength; ++i) {
      if (primitives[i].material === activeMaterial) {
        if (!defined(callback) || callback(primitives[i])) {
          primitive = primitives[i];
          clearVertexCache();
          vertexCount = primitive.positions.length / 3;
          return;
        }
      }
    }
    addPrimitive();
  }

  function useMaterial(name) {
    activeMaterial = getName(name);
    reusePrimitive();
  }

  function faceAndPrimitiveMatch(uvs, normals, primitive) {
    const faceHasUvs = defined(uvs[0]);
    const faceHasNormals = defined(normals[0]);
    const primitiveHasUvs = primitive.uvs.length > 0;
    const primitiveHasNormals = primitive.normals.length > 0;
    return (
      primitiveHasUvs === faceHasUvs && primitiveHasNormals === faceHasNormals
    );
  }

  function checkPrimitive(uvs, normals) {
    const firstFace = primitive.indices.length === 0;
    if (!firstFace && !faceAndPrimitiveMatch(uvs, normals, primitive)) {
      reusePrimitive(function (primitive) {
        return faceAndPrimitiveMatch(uvs, normals, primitive);
      });
    }
  }

  function getIndexFromStart(index, attributeData, components) {
    const i = parseInt(index);
    if (i < 0) {
      // Negative vertex indexes reference the vertices immediately above it
      return attributeData.length / components + i;
    }
    return i - 1;
  }

  function correctAttributeIndices(
    attributeIndices,
    attributeData,
    components,
  ) {
    const length = attributeIndices.length;
    for (let i = 0; i < length; ++i) {
      if (attributeIndices[i].length === 0) {
        attributeIndices[i] = undefined;
      } else {
        attributeIndices[i] = getIndexFromStart(
          attributeIndices[i],
          attributeData,
          components,
        );
      }
    }
  }

  function correctVertices(vertices, positions, uvs, normals) {
    const length = vertices.length;
    for (let i = 0; i < length; ++i) {
      vertices[i] = `${positions[i] ?? ""}/${uvs[i] ?? ""}/${normals[i] ?? ""}`;
    }
  }

  function createVertex(p, u, n) {
    // Positions
    if (defined(p) && globalPositions.length > 0) {
      if (p * 3 >= globalPositions.length) {
        throw new Error(`Position index ${p} is out of bounds`);
      }
      const px = globalPositions.get(p * 3);
      const py = globalPositions.get(p * 3 + 1);
      const pz = globalPositions.get(p * 3 + 2);
      primitive.positions.push(px);
      primitive.positions.push(py);
      primitive.positions.push(pz);
    }

    // Normals
    if (defined(n) && globalNormals.length > 0) {
      if (n * 3 >= globalNormals.length) {
        throw new Error(`Normal index ${n} is out of bounds`);
      }
      const nx = globalNormals.get(n * 3);
      const ny = globalNormals.get(n * 3 + 1);
      const nz = globalNormals.get(n * 3 + 2);
      primitive.normals.push(nx);
      primitive.normals.push(ny);
      primitive.normals.push(nz);
    }

    // UVs
    if (defined(u) && globalUvs.length > 0) {
      if (u * 2 >= globalUvs.length) {
        throw new Error(`UV index ${u} is out of bounds`);
      }
      const ux = globalUvs.get(u * 2);
      const uy = globalUvs.get(u * 2 + 1);
      primitive.uvs.push(ux);
      primitive.uvs.push(uy);
    }
  }

  function addVertex(v, p, u, n) {
    let index = vertexCache[v];
    if (!defined(index)) {
      index = vertexCount++;
      vertexCache[v] = index;
      createVertex(p, u, n);

      // Prevent the vertex cache from growing too large. As a result of clearing the cache there
      // may be some duplicate vertices.
      vertexCacheCount++;
      if (vertexCacheCount > vertexCacheLimit) {
        clearVertexCache();
      }
    }
    return index;
  }

  function getPosition(index, result) {
    const px = globalPositions.get(index * 3);
    const py = globalPositions.get(index * 3 + 1);
    const pz = globalPositions.get(index * 3 + 2);
    return Cartesian3.fromElements(px, py, pz, result);
  }

  function getNormal(index, result) {
    const nx = globalNormals.get(index * 3);
    const ny = globalNormals.get(index * 3 + 1);
    const nz = globalNormals.get(index * 3 + 2);
    return Cartesian3.fromElements(nx, ny, nz, result);
  }

  const scratch1 = new Cartesian3();
  const scratch2 = new Cartesian3();
  const scratch3 = new Cartesian3();
  const scratch4 = new Cartesian3();
  const scratch5 = new Cartesian3();
  const scratchCenter = new Cartesian3();
  const scratchAxis1 = new Cartesian3();
  const scratchAxis2 = new Cartesian3();
  const scratchNormal = new Cartesian3();
  const scratchPositions = [
    new Cartesian3(),
    new Cartesian3(),
    new Cartesian3(),
    new Cartesian3(),
  ];
  const scratchVertexIndices = [];
  const scratchPoints = [];

  function checkWindingCorrect(
    positionIndex1,
    positionIndex2,
    positionIndex3,
    normalIndex,
  ) {
    if (!defined(normalIndex)) {
      // If no face normal, we have to assume the winding is correct.
      return true;
    }
    const normal = getNormal(normalIndex, scratchNormal);
    const A = getPosition(positionIndex1, scratch1);
    const B = getPosition(positionIndex2, scratch2);
    const C = getPosition(positionIndex3, scratch3);

    const BA = Cartesian3.subtract(B, A, scratch4);
    const CA = Cartesian3.subtract(C, A, scratch5);
    const cross = Cartesian3.cross(BA, CA, scratch3);

    return Cartesian3.dot(normal, cross) >= 0;
  }

  function addTriangle(index1, index2, index3, correctWinding) {
    if (correctWinding) {
      primitive.indices.push(index1);
      primitive.indices.push(index2);
      primitive.indices.push(index3);
    } else {
      primitive.indices.push(index1);
      primitive.indices.push(index3);
      primitive.indices.push(index2);
    }
  }

  function addFace(
    vertices,
    positions,
    uvs,
    normals,
    triangleWindingOrderSanitization,
  ) {
    correctAttributeIndices(positions, globalPositions, 3);
    correctAttributeIndices(normals, globalNormals, 3);
    correctAttributeIndices(uvs, globalUvs, 2);
    correctVertices(vertices, positions, uvs, normals);

    checkPrimitive(uvs, faceNormals);

    if (vertices.length === 3) {
      const isWindingCorrect =
        !triangleWindingOrderSanitization ||
        checkWindingCorrect(
          positions[0],
          positions[1],
          positions[2],
          normals[0],
        );
      const index1 = addVertex(vertices[0], positions[0], uvs[0], normals[0]);
      const index2 = addVertex(vertices[1], positions[1], uvs[1], normals[1]);
      const index3 = addVertex(vertices[2], positions[2], uvs[2], normals[2]);
      addTriangle(index1, index2, index3, isWindingCorrect);
    } else {
      // Triangulate if the face is not a triangle
      const points = scratchPoints;
      const vertexIndices = scratchVertexIndices;

      points.length = 0;
      vertexIndices.length = 0;

      for (let i = 0; i < vertices.length; ++i) {
        const index = addVertex(vertices[i], positions[i], uvs[i], normals[i]);
        vertexIndices.push(index);
        if (i === scratchPositions.length) {
          scratchPositions.push(new Cartesian3());
        }
        points.push(getPosition(positions[i], scratchPositions[i]));
      }

      const validGeometry = computeProjectTo2DArguments(
        points,
        scratchCenter,
        scratchAxis1,
        scratchAxis2,
      );
      if (!validGeometry) {
        return;
      }
      const projectPoints = createProjectPointsTo2DFunction(
        scratchCenter,
        scratchAxis1,
        scratchAxis2,
      );
      const points2D = projectPoints(points);
      const indices = triangulate(points2D);
      const isWindingCorrect = computeWindingOrder2D(points2D) !== 0x0900;

      for (let i = 0; i < indices.length - 2; i += 3) {
        addTriangle(
          vertexIndices[indices[i]],
          vertexIndices[indices[i + 1]],
          vertexIndices[indices[i + 2]],
          isWindingCorrect,
        );
      }
    }
  }

  function parseLine(line) {
    line = line.trim();
    let result;

    if (line.length === 0 || line.charAt(0) === "#") {
      // Don't process empty lines or comments
    } else if (/^o\s/i.test(line)) {
      const objectName = line.substring(2).trim();
      addNode(objectName);
    } else if (/^g\s/i.test(line)) {
      const groupName = line.substring(2).trim();
      addMesh(groupName);
    } else if (/^usemtl/i.test(line)) {
      const materialName = line.substring(7).trim();
      useMaterial(materialName);
    } else if (/^mtllib/i.test(line)) {
      const mtllibLine = line.substring(7).trim();
      mtlPaths = mtlPaths.concat(getMtlPaths(mtllibLine));
    } else if ((result = vertexPattern.exec(line)) !== null) {
      const position = scratchCartesian;
      position.x = parseFloat(result[1]);
      position.y = parseFloat(result[2]);
      position.z = parseFloat(result[3]);
      // if (defined(axisTransform)) {
      //   Matrix4.multiplyByPoint(axisTransform, position, position);
      // }
      globalPositions.push(position.x);
      globalPositions.push(position.y);
      globalPositions.push(position.z);
    } else if ((result = normalPattern.exec(line)) !== null) {
      const normal = Cartesian3.fromElements(
        parseFloat(result[1]),
        parseFloat(result[2]),
        parseFloat(result[3]),
        scratchNormal,
      );
      if (Cartesian3.equals(normal, Cartesian3.ZERO)) {
        Cartesian3.clone(Cartesian3.UNIT_Z, normal);
      } else {
        Cartesian3.normalize(normal, normal);
      }
      // if (defined(axisTransform)) {
      //   Matrix4.multiplyByPointAsVector(axisTransform, normal, normal);
      // }
      globalNormals.push(normal.x);
      globalNormals.push(normal.y);
      globalNormals.push(normal.z);
    } else if ((result = uvPattern.exec(line)) !== null) {
      globalUvs.push(parseFloat(result[1]));
      globalUvs.push(1.0 - parseFloat(result[2])); // Flip y so 0.0 is the bottom of the image
    } else {
      // face line or invalid line
      // Because face lines can contain n vertices, we use a line buffer in case the face data spans multiple lines.
      // If there's a line continuation don't create face yet
      if (line.slice(-1) === "\\") {
        lineBuffer += line.substring(0, line.length - 1);
        return;
      }
      lineBuffer += line;
      if (lineBuffer.substring(0, 2) === "f ") {
        while ((result = facePattern.exec(lineBuffer)) !== null) {
          faceVertices.push(result[0]);
          facePositions.push(result[1]);
          faceUvs.push(result[2]);
          faceNormals.push(result[3]);
        }
        if (faceVertices.length > 2) {
          addFace(
            faceVertices,
            facePositions,
            faceUvs,
            faceNormals,
            options.triangleWindingOrderSanitization,
          );
        }

        faceVertices.length = 0;
        facePositions.length = 0;
        faceNormals.length = 0;
        faceUvs.length = 0;
      }
      lineBuffer = "";
    }
  }

  // Create a default node in case there are no o/g/usemtl lines in the obj
  addNode();

  const reader = objBlob.stream();
  const decoder = new TextDecoderStream();
  const stream = reader.pipeThrough(decoder);
  const final_reader = stream.getReader();

  let buffer = "";

  async function processChunk({ done, value }) {
    if (done) {
      if (buffer.length > 0) {
        parseLine(buffer);
      }
      return;
    }

    const combined_chunk = buffer + value;
    const lines = combined_chunk.split("\n");
    buffer = lines.pop();
    lines.forEach((line) => parseLine(line));
    const next_section = await final_reader.read();
    await processChunk(next_section);
  }

  const first_part = await final_reader.read();
  await processChunk(first_part);

  // Parse the obj file
  // return readLines(objPath, parseLine).then(function () {
  // Unload resources
  globalPositions = undefined;
  globalNormals = undefined;
  globalUvs = undefined;

  // Load materials and textures
  return finishLoading(nodes, mtlPaths, defined(activeMaterial), options);
  // });
}

function getMtlPaths(mtllibLine) {
  // Handle paths with spaces. E.g. mtllib my material file.mtl
  const mtlPaths = [];
  //Remove double quotes around the mtl file if it exists
  mtllibLine = mtllibLine.replace(/^"(.+)"$/, "$1");
  const splits = mtllibLine.split(" ");
  const length = splits.length;
  let startIndex = 0;
  for (let i = 0; i < length; ++i) {
    const extension = splits[i].split(".").at(-1);
    if (extension !== "mtl") {
      continue;
    }
    const mtlPath = splits.slice(startIndex, i + 1).join(" ");
    mtlPaths.push(mtlPath);
    startIndex = i + 1;
  }
  return mtlPaths;
}

function finishLoading(nodes, mtlPaths, usesMaterials, options) {
  nodes = cleanNodes(nodes);
  if (nodes.length === 0) {
    throw new Error(`supplied model does not have any geometry data`);
  }
  const name = "model";
  return loadMtls(mtlPaths, options).then(function (materials) {
    if (materials.length > 0 && !usesMaterials) {
      assignDefaultMaterial(nodes, materials, usesMaterials);
    }
    assignUnnamedMaterial(nodes, materials);
    return {
      nodes: nodes,
      materials: materials,
      name: name,
    };
  });
}

function normalizeMtlPath(mtlPath, objDirectory) {
  mtlPath = mtlPath.replace(/\\/g, "/");
  return path.normalize(path.resolve(objDirectory, mtlPath));
}

function loadMtls(mtlPaths, options) {
  let materials = [];

  // Remove duplicates
  mtlPaths = mtlPaths.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });

  return Promise.all(
    mtlPaths.map(async function (mtlPath) {
      mtlPath = normalizeMtlPath(mtlPath, options.objDirectory);
      const shallowPath = path.join(
        options.objDirectory,
        path.basename(mtlPath),
      );

      return await loadMtl(mtlPath, options)
        .catch(async function (error) {
          // Try looking for the .mtl in the same directory as the obj
          options.logger(error.message);
          options.logger(
            `Could not read material file at ${mtlPath}. Attempting to read the material file from within the obj directory instead.`,
          );
          return await loadMtl(shallowPath, options);
        })
        .then(function (materialsInMtl) {
          materials = materials.concat(materialsInMtl);
        })
        .catch(function (error) {
          options.logger(error.message);
          options.logger(
            `Could not read material file at ${shallowPath}. Using default material instead.`,
          );
        });
    }),
  ).then(function () {
    return materials;
  });
}

function assignDefaultMaterial(nodes, materials) {
  const defaultMaterial = materials[0].name;
  const nodesLength = nodes.length;
  for (let i = 0; i < nodesLength; ++i) {
    const meshes = nodes[i].meshes;
    const meshesLength = meshes.length;
    for (let j = 0; j < meshesLength; ++j) {
      const primitives = meshes[j].primitives;
      const primitivesLength = primitives.length;
      for (let k = 0; k < primitivesLength; ++k) {
        const primitive = primitives[k];
        primitive.material = primitive.material ?? defaultMaterial;
      }
    }
  }
}

function assignUnnamedMaterial(nodes, materials) {
  // If there is a material that doesn't have a name, assign that
  // material to any primitives whose material is undefined.
  const unnamedMaterial = materials.find(function (material) {
    return material.name.length === 0;
  });

  if (!defined(unnamedMaterial)) {
    return;
  }

  const nodesLength = nodes.length;
  for (let i = 0; i < nodesLength; ++i) {
    const meshes = nodes[i].meshes;
    const meshesLength = meshes.length;
    for (let j = 0; j < meshesLength; ++j) {
      const primitives = meshes[j].primitives;
      const primitivesLength = primitives.length;
      for (let k = 0; k < primitivesLength; ++k) {
        const primitive = primitives[k];
        if (!defined(primitive.material)) {
          primitive.material = unnamedMaterial.name;
        }
      }
    }
  }
}

function removeEmptyMeshes(meshes) {
  return meshes.filter(function (mesh) {
    // Remove empty primitives
    mesh.primitives = mesh.primitives.filter(function (primitive) {
      return primitive.indices.length > 0 && primitive.positions.length > 0;
    });
    // Valid meshes must have at least one primitive
    return mesh.primitives.length > 0;
  });
}

function meshesHaveNames(meshes) {
  const meshesLength = meshes.length;
  for (let i = 0; i < meshesLength; ++i) {
    if (defined(meshes[i].name)) {
      return true;
    }
  }
  return false;
}

function removeEmptyNodes(nodes) {
  const final = [];
  const nodesLength = nodes.length;
  for (let i = 0; i < nodesLength; ++i) {
    const node = nodes[i];
    const meshes = removeEmptyMeshes(node.meshes);
    if (meshes.length === 0) {
      continue;
    }
    node.meshes = meshes;
    if (!defined(node.name) && meshesHaveNames(meshes)) {
      // If the obj has groups (g) but not object groups (o) then convert meshes to nodes
      const meshesLength = meshes.length;
      for (let j = 0; j < meshesLength; ++j) {
        const mesh = meshes[j];
        const convertedNode = new Node();
        convertedNode.name = mesh.name;
        convertedNode.meshes = [mesh];
        final.push(convertedNode);
      }
    } else {
      final.push(node);
    }
  }
  return final;
}

function setDefaultNames(items, defaultName, usedNames) {
  const itemsLength = items.length;
  for (let i = 0; i < itemsLength; ++i) {
    const item = items[i];
    let name = item.name ?? defaultName;
    const occurrences = usedNames[name];
    if (defined(occurrences)) {
      usedNames[name]++;
      name = `${name}_${occurrences}`;
    } else {
      usedNames[name] = 1;
    }
    item.name = name;
  }
}

function setDefaults(nodes) {
  const usedNames = {};
  setDefaultNames(nodes, "Node", usedNames);
  const nodesLength = nodes.length;
  for (let i = 0; i < nodesLength; ++i) {
    const node = nodes[i];
    setDefaultNames(node.meshes, `${node.name}-Mesh`, usedNames);
  }
}

function cleanNodes(nodes) {
  nodes = removeEmptyNodes(nodes);
  setDefaults(nodes);
  return nodes;
}
