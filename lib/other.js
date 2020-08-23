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

module.exports = {
  formatNum: formatNum
}
