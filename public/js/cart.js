var quantity = 0;
var noOfItems = $(".cart-item").length;

$('#quantity-0').on("input propertychange paste", function() {
    $('#btn-update-0').show();
  });

  $('#btn-update-0').on("click", function() {
    $('#btn-update-0').hide();
  });

// function addClickEvent(i) {
//   addButtonId = "#btn-plus-" + i.toString();
//   minusButtonId = "#btn-minus-" + i.toString();
//   quantityInputId = "#quantity-" + i.toString();
//
//   $(addButtonId).click(function(e) {
//     e.preventDefault();
//     var quantity = parseInt($(quantityInputId).val());
//     $(quantityInputId).val(quantity + 1);
//   });
//
//   $(minusButtonId).click(function(e) {
//     e.preventDefault();
//     var quantity = parseInt($(quantityInputId).val());
//     if (quantity > 1) {
//       $(quantityInputId).val(quantity - 1);
//     }
//   });
// }
