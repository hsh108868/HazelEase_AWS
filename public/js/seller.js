function openPage(pageName, elmnt) {
  // Hide all elements with class="tabcontent" by default */
  var i, subform;
  subform = document.getElementsByClassName("subform");
  for (i = 0; i < subform.length; i++) {
    subform[i].style.display = "none";
  }

  // Show the specific tab content
  document.getElementById(pageName).style.display = "block";
}

// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();

$('#bs-yes').on('click', function() {
  $('#newSeller').addClass('hidden');
  $('#sellerSystem').show();
});

$('#shopId').change(function() {
  var shopId = $('#shopId').val();
  window.location.replace('/seller/show-stocks/' + shopId);
});

$('.qty-input').each(function(i, obj1) {
  $('.qty-save').each(function(j, obj2) {
    if (i === j) {
      $(obj1).on("input propertychange paste", function() {
        $(obj2).show();
        $(obj2).on('click', function() {
          var productQty = $(obj1).val();
          var productId = $('#currProductId' + i.toString()).val();
          var shopId = $('#currShopId' + i.toString()).val();
          window.location.replace('/seller/update-stock/' + productId + '-' + shopId + '/' + productQty);
        });
      });
    } else {
      $(obj1).on("input propertychange paste", function() {
        $(obj2).hide();
      });
    }
  })
});
