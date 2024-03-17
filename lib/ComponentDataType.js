export const ComponentDatatype = {
  BYTE: 0x1400,
  UNSIGNED_BYTE: 0x1401,
  SHORT: 0x1402,
  UNSIGNED_SHORT: 0x1403,
  INT: 0x1404,
  UNSIGNED_INT: 0x1405,
  FLOAT: 0x1406,
  DOUBLE: 0x140a,
};

/**
 * Returns the size, in bytes, of the corresponding datatype.
 *
 * @param {ComponentDatatype} componentDatatype The component datatype to get the size of.
 * @returns {number} The size in bytes.
 *
 * @exception {Error} componentDatatype is not a valid value.
 *
 * @example
 * // Returns Int8Array.BYTES_PER_ELEMENT
 * const size = Cesium.ComponentDatatype.getSizeInBytes(Cesium.ComponentDatatype.BYTE);
 */
export function getSizeInBytes(componentDatatype) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof componentDatatype === "undefined") {
    throw new Error("value is required.");
  }
  //>>includeEnd('debug');

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return Int8Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_BYTE:
      return Uint8Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.SHORT:
      return Int16Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_SHORT:
      return Uint16Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.INT:
      return Int32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_INT:
      return Uint32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.FLOAT:
      return Float32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.DOUBLE:
      return Float64Array.BYTES_PER_ELEMENT;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new Error("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
}

/**
 * Gets the {@link ComponentDatatype} for the provided TypedArray instance.
 *
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} array The typed array.
 * @returns {ComponentDatatype} The ComponentDatatype for the provided array, or undefined if the array is not a TypedArray.
 */
export function fromTypedArray(array) {
  if (array instanceof Int8Array) {
    return ComponentDatatype.BYTE;
  }
  if (array instanceof Uint8Array) {
    return ComponentDatatype.UNSIGNED_BYTE;
  }
  if (array instanceof Int16Array) {
    return ComponentDatatype.SHORT;
  }
  if (array instanceof Uint16Array) {
    return ComponentDatatype.UNSIGNED_SHORT;
  }
  if (array instanceof Int32Array) {
    return ComponentDatatype.INT;
  }
  if (array instanceof Uint32Array) {
    return ComponentDatatype.UNSIGNED_INT;
  }
  if (array instanceof Float32Array) {
    return ComponentDatatype.FLOAT;
  }
  if (array instanceof Float64Array) {
    return ComponentDatatype.DOUBLE;
  }

  //>>includeStart('debug', pragmas.debug);
  throw new Error(
    "array must be an Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, or Float64Array.",
  );
  //>>includeEnd('debug');
}

/**
 * Validates that the provided component datatype is a valid {@link ComponentDatatype}
 *
 * @param {ComponentDatatype} componentDatatype The component datatype to validate.
 * @returns {boolean} <code>true</code> if the provided component datatype is a valid value; otherwise, <code>false</code>.
 *
 * @example
 * if (!Cesium.ComponentDatatype.validate(componentDatatype)) {
 *   throw new Cesium.Error('componentDatatype must be a valid value.');
 * }
 */
export function validate(componentDatatype) {
  return (
    typeof componentDatatype === "undefined" &&
    (componentDatatype === ComponentDatatype.BYTE ||
      componentDatatype === ComponentDatatype.UNSIGNED_BYTE ||
      componentDatatype === ComponentDatatype.SHORT ||
      componentDatatype === ComponentDatatype.UNSIGNED_SHORT ||
      componentDatatype === ComponentDatatype.INT ||
      componentDatatype === ComponentDatatype.UNSIGNED_INT ||
      componentDatatype === ComponentDatatype.FLOAT ||
      componentDatatype === ComponentDatatype.DOUBLE)
  );
}

/**
 * Creates a typed array corresponding to component data type.
 *
 * @param {ComponentDatatype} componentDatatype The component data type.
 * @param {number|Array} valuesOrLength The length of the array to create or an array.
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} A typed array.
 *
 * @exception {Error} componentDatatype is not a valid value.
 *
 * @example
 * // creates a Float32Array with length of 100
 * const typedArray = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 100);
 */
export function createTypedArray(componentDatatype, valuesOrLength) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof componentDatatype === "undefined") {
    throw new Error("componentDatatype is required.");
  }
  if (typeof valuesOrLength === "undefined") {
    throw new Error("valuesOrLength is required.");
  }
  //>>includeEnd('debug');

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return new Int8Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_BYTE:
      return new Uint8Array(valuesOrLength);
    case ComponentDatatype.SHORT:
      return new Int16Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_SHORT:
      return new Uint16Array(valuesOrLength);
    case ComponentDatatype.INT:
      return new Int32Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_INT:
      return new Uint32Array(valuesOrLength);
    case ComponentDatatype.FLOAT:
      return new Float32Array(valuesOrLength);
    case ComponentDatatype.DOUBLE:
      return new Float64Array(valuesOrLength);
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new Error("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
}

/**
 * Creates a typed view of an array of bytes.
 *
 * @param {ComponentDatatype} componentDatatype The type of the view to create.
 * @param {ArrayBuffer} buffer The buffer storage to use for the view.
 * @param {number} [byteOffset] The offset, in bytes, to the first element in the view.
 * @param {number} [length] The number of elements in the view.
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} A typed array view of the buffer.
 *
 * @exception {Error} componentDatatype is not a valid value.
 */
export function createArrayBufferView(
  componentDatatype,
  buffer,
  byteOffset,
  length,
) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof componentDatatype === "undefined") {
    throw new Error("componentDatatype is required.");
  }
  if (typeof buffer === "undefined") {
    throw new Error("buffer is required.");
  }
  //>>includeEnd('debug');

  byteOffset = byteOffset ?? 0;
  length =
    length ??
    (buffer.byteLength - byteOffset) / getSizeInBytes(componentDatatype);

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return new Int8Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_BYTE:
      return new Uint8Array(buffer, byteOffset, length);
    case ComponentDatatype.SHORT:
      return new Int16Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_SHORT:
      return new Uint16Array(buffer, byteOffset, length);
    case ComponentDatatype.INT:
      return new Int32Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_INT:
      return new Uint32Array(buffer, byteOffset, length);
    case ComponentDatatype.FLOAT:
      return new Float32Array(buffer, byteOffset, length);
    case ComponentDatatype.DOUBLE:
      return new Float64Array(buffer, byteOffset, length);
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new Error("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
}

/**
 * Get the ComponentDatatype from its name.
 *
 * @param {string} name The name of the ComponentDatatype.
 * @returns {ComponentDatatype} The ComponentDatatype.
 *
 * @exception {Error} name is not a valid value.
 */
export function fromName(name) {
  switch (name) {
    case "BYTE":
      return ComponentDatatype.BYTE;
    case "UNSIGNED_BYTE":
      return ComponentDatatype.UNSIGNED_BYTE;
    case "SHORT":
      return ComponentDatatype.SHORT;
    case "UNSIGNED_SHORT":
      return ComponentDatatype.UNSIGNED_SHORT;
    case "INT":
      return ComponentDatatype.INT;
    case "UNSIGNED_INT":
      return ComponentDatatype.UNSIGNED_INT;
    case "FLOAT":
      return ComponentDatatype.FLOAT;
    case "DOUBLE":
      return ComponentDatatype.DOUBLE;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new Error("name is not a valid value.");
    //>>includeEnd('debug');
  }
}
