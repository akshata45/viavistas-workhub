// Creates an error that carries an HTTP status code.
// Controllers use it to send the right response (400, 403, 404...).
export const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};