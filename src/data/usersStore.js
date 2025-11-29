const users = [];

exports.createUser = (user) => {
  users.push(user);
  return user;
};

exports.findUserByEmail = (email) => users.find((u) => u.email === email);

exports.findUserById = (id) => users.find((u) => u.id === id);

exports.listUsers = () => [...users];

exports.clearUsers = () => {
  users.length = 0;
};
