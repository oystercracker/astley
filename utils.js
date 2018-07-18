/**
 * Returns true if the object is undefined, null, or NaN.  Treats zero as non-nil.
 * @param {*} obj 
 */
function isNil(obj){
  if(obj === null) return true;
  if(typeof obj === 'undefined') return true;
  if(!obj && isNaN(obj)) return true;
  return false;
}
/**
 * Indicates if the object is just a plain ol' object. (and not an array or function)
 * @param {object} object
 */
function isPlainObject(object){
  return !isNil(object) && (typeof object === 'object') && !Array.isArray(object);
}

module.exports = {
  isNil, isPlainObject
};

