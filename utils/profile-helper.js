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
    "email",
    "age",
    "dob",
    "gender",
    "phoneNumber",
    "profileImage",
    "bloodGroup",
    "adhaar",
    "pan",
    "address1",
    "address2",
    "city",
    "state",
    "pincode",
  ];

  const isValid = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  };

  let completed = 0;

  fields.forEach((field) => {
    if (isValid(user[field])) completed++;
  });

  return Math.round((completed / fields.length) * 100);
};

