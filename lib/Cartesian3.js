function defined(value) {
  return typeof value !== "undefined";
}

/**
 * A 3D Cartesian point.
 * @alias Cartesian3
 * @constructor
 *
 * @param {number} [x=0.0] The X component.
 * @param {number} [y=0.0] The Y component.
 * @param {number} [z=0.0] The Z component.
 *
 * @see Cartesian2
 * @see Cartesian4
 * @see Packable
 */
function Cartesian3(x, y, z) {
  /**
   * The X component.
   * @type {number}
   * @default 0.0
   */
  this.x = x ?? 0.0;

  /**
   * The Y component.
   * @type {number}
   * @default 0.0
   */
  this.y = y ?? 0.0;

  /**
   * The Z component.
   * @type {number}
   * @default 0.0
   */
  this.z = z ?? 0.0;
}

/**
 * Creates a Cartesian3 instance from x, y and z coordinates.
 *
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @param {number} z The z coordinate.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
 */
Cartesian3.fromElements = function (x, y, z, result) {
  if (!defined(result)) {
    return new Cartesian3(x, y, z);
  }

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * Duplicates a Cartesian3 instance.
 *
 * @param {Cartesian3} cartesian The Cartesian to duplicate.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided. (Returns undefined if cartesian is undefined)
 */
Cartesian3.clone = function (cartesian, result) {
  if (!defined(cartesian)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Cartesian3(cartesian.x, cartesian.y, cartesian.z);
  }

  result.x = cartesian.x;
  result.y = cartesian.y;
  result.z = cartesian.z;
  return result;
};

/**
 * Computes the provided Cartesian's squared magnitude.
 *
 * @param {Cartesian3} cartesian The Cartesian instance whose squared magnitude is to be computed.
 * @returns {number} The squared magnitude.
 */
Cartesian3.magnitudeSquared = function (cartesian) {
  return (
    cartesian.x * cartesian.x +
    cartesian.y * cartesian.y +
    cartesian.z * cartesian.z
  );
};

/**
 * Computes the Cartesian's magnitude (length).
 *
 * @param {Cartesian3} cartesian The Cartesian instance whose magnitude is to be computed.
 * @returns {number} The magnitude.
 */
Cartesian3.magnitude = function (cartesian) {
  return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
};

/**
 * Computes the normalized form of the supplied Cartesian.
 *
 * @param {Cartesian3} cartesian The Cartesian to be normalized.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Cartesian3.normalize = function (cartesian, result) {
  const magnitude = Cartesian3.magnitude(cartesian);

  result.x = cartesian.x / magnitude;
  result.y = cartesian.y / magnitude;
  result.z = cartesian.z / magnitude;

  return result;
};

/**
 * Computes the dot (scalar) product of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @returns {number} The dot product.
 */
Cartesian3.dot = function (left, right) {
  return left.x * right.x + left.y * right.y + left.z * right.z;
};

/**
 * Computes the componentwise product of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Cartesian3.multiplyComponents = function (left, right, result) {
  result.x = left.x * right.x;
  result.y = left.y * right.y;
  result.z = left.z * right.z;
  return result;
};

/**
 * Computes the componentwise sum of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Cartesian3.add = function (left, right, result) {
  result.x = left.x + right.x;
  result.y = left.y + right.y;
  result.z = left.z + right.z;
  return result;
};

/**
 * Computes the componentwise difference of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Cartesian3.subtract = function (left, right, result) {
  result.x = left.x - right.x;
  result.y = left.y - right.y;
  result.z = left.z - right.z;
  return result;
};

/**
 * Multiplies the provided Cartesian componentwise by the provided scalar.
 *
 * @param {Cartesian3} cartesian The Cartesian to be scaled.
 * @param {number} scalar The scalar to multiply with.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Cartesian3.multiplyByScalar = function (cartesian, scalar, result) {
  result.x = cartesian.x * scalar;
  result.y = cartesian.y * scalar;
  result.z = cartesian.z * scalar;
  return result;
};

/**
 * Compares the provided Cartesians componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Cartesian3} [left] The first Cartesian.
 * @param {Cartesian3} [right] The second Cartesian.
 * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
 */
Cartesian3.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y &&
      left.z === right.z)
  );
};

/**
 * Computes the cross (outer) product of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The cross product.
 */
Cartesian3.cross = function (left, right, result) {
  const leftX = left.x;
  const leftY = left.y;
  const leftZ = left.z;
  const rightX = right.x;
  const rightY = right.y;
  const rightZ = right.z;

  const x = leftY * rightZ - leftZ * rightY;
  const y = leftZ * rightX - leftX * rightZ;
  const z = leftX * rightY - leftY * rightX;

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * An immutable Cartesian3 instance initialized to (0.0, 0.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.ZERO = Object.freeze(new Cartesian3(0.0, 0.0, 0.0));

/**
 * An immutable Cartesian3 instance initialized to (0.0, 0.0, 1.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_Z = Object.freeze(new Cartesian3(0.0, 0.0, 1.0));

/**
 * Duplicates this Cartesian3 instance.
 *
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
 */
Cartesian3.prototype.clone = function (result) {
  return Cartesian3.clone(this, result);
};

/**
 * Compares this Cartesian against the provided Cartesian componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Cartesian3} [right] The right hand side Cartesian.
 * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
 */
Cartesian3.prototype.equals = function (right) {
  return Cartesian3.equals(this, right);
};

/**
 * Creates a string representing this Cartesian in the format '(x, y, z)'.
 *
 * @returns {string} A string representing this Cartesian in the format '(x, y, z)'.
 */
Cartesian3.prototype.toString = function () {
  return `(${this.x}, ${this.y}, ${this.z})`;
};
export default Cartesian3;
