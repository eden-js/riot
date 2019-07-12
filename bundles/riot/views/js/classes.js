
// create classes mixin
module.exports = (classes) => {
  // entries
  return Object.entries(classes).reduce((acc, item) => {
    // key/value
    const [key, value] = item;

    // check value
    if (value) return [...acc, key];

    // return accumulated
    return acc;
  }, []).join(' ');
};
