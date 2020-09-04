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

function filesUpload() {
  try {
        if(req.files) {
            let data = [];

            //loop all files
            _.forEach(_.keysIn(req.files.photos), (key) => {
                let photo = req.files.photos[key];

                //move photo to uploads directory
                console.log(__dirname);
                let uploadPath = __dirname + '/uploads/' + photo.name;
                console.log(uploadPath);
                photo.mv(uploadPath);

                //push file details
                data.push({
                    name: photo.name,
                    mimetype: photo.mimetype,
                    size: photo.size
                });
            });

            //return response
            // res.send({
            //     status: true,
            //     message: 'Files are uploaded',
            //     data: data
            // });
        }
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = {
  formatNum: formatNum,
  filesUpload: filesUpload
}
