exports.success = (res, data = {}, message = "SUCCESS") => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

exports.error = (res, status = 400, code = "ERROR", message = "Something went wrong") => {
  return res.status(status).json({
    success: false,
    code,
    message
  });
};
