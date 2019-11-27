module.exports = (type, msg) => {
  const date = new Date();

  if (typeof msg === 'object') msg = msg.stack || msg.message;

  let text = `[${type}]: ${msg.endsWith('.') ? msg : msg + '.'} at ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

  console.log(text);
  return text;
};
