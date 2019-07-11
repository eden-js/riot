module.exports = (classes) => {
  // entries
  return Object.entries(classes).reduce((acc, item) => {
    const [key, value] = item

    if (value) return [...acc, key]

    return acc
  }, []).join(' ')
};