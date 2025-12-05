export const isValid = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (typeof value === "number") {
    return !Number.isNaN(value) && value > 0;
  }
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  if (typeof value === "boolean") return true;
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return false;
};

export const calculateProfileScore = (user) => {
  const fields = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "age",
    "phoneNumber",
    "address",
    "email",
    "gender",
    "profileImage",
    "bloodGroup",
  ];

  let completed = 0;

  fields.forEach((field) => {
    if (isValid(user[field])) {
      completed++;
    }
  });
  return Math.round((completed / fields.length) * 100);
};
