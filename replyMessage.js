function format(text) {
  return `🐻くまお先生だよ！

${text.replace(/\\\(/g, '(').replace(/\\\)/g, ')')}`;
}

module.exports = { format };