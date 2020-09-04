// 긴 숫자를 쉼표로 구분해주는 함수
function formatNum(num) {
  if (num === null) return;

  return (
    num
      .toString() // transform the number to string
      .split("") // transform the string to array with every digit becoming an element in the array
      .reverse() // reverse the array so that we can start process the number from the least digit
      .map((digit, index) =>
        index != 0 && index % 3 === 0 ? `${digit},` : digit
      ) // map every digit from the array.
      // If the index is a multiple of 3 and it's not the least digit,
      // that is the place we insert the comma behind.
      .reverse() // reverse back the array so that the digits are sorted in correctly display order
      .join("")
  ); // transform the array back to the string
}

// 이미지 업로드 처리 함수
function fileUpload(req, res) {
  let uploadedFiles;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded.');
    return;
  }

  if (req.files.photos.length > 1) {
    uploadedFiles = req.files.photos;
  } else {
    uploadedFiles = [req.files.photos];
  }

  uploadedFiles.forEach(function(file) {
    uploadPath = __dirname + '/../public/uploads/' + file.name;
    console.log('File uploaded to ' + uploadPath);

    file.mv(uploadPath, function(err) {
      if (err) {
        return res.status(500).send(err);
      }
    });
  });
}
module.exports = {
  formatNum: formatNum,
  fileUpload: fileUpload
}
