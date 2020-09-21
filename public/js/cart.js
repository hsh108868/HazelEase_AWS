$('.qty-plus').each(function(i, obj1) {
  $('.qty-input').each(function(j, obj2) {
    if (i === j) {
      $(obj1).click(function(e) {
        e.preventDefault();
        var quantity = parseInt($(obj2).val());
        $(obj2).val(quantity + 1);
      });
    }
  })
});

$('.qty-minus').each(function(i, obj1) {
  $('.qty-input').each(function(j, obj2) {
    if (i === j) {
      $(obj1).click(function(e) {
        e.preventDefault();
        var quantity = parseInt($(obj2).val());
        if (quantity > 1) {
          $(obj2).val(quantity - 1);
        }
      });
    }
  })
});

$(".qty-input, .qty-plus, .qty-minus, .item").on("input propertychange paste click", function() {
    $('#save-button').show();
});

$('#save-button').on("click", function() {
  $('#cart-items-form').submit();
  $('#save-button').hide();
});

$('.item').each(function(i, obj1) {
  $('.cb-state').each(function(j, obj2) {
    if (i == j) {
      $(obj1).change(function() {
        if(this.checked)
          $(obj2).val('1');
        else
          $(obj2).val('0');
      });
    }
  })
})
