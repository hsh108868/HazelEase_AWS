$('#amountInput').on('changeproperty paste input', function() {
  let amount = $('#amountInput').val();
  $('#amountRange').val(amount);
})

$('#amountRange').on('changeproperty paste input', function() {
  let amount = $('#amountRange').val();
  $('#amountInput').val(amount);
})

$('#rechargeBtn').on('click', function() {
  $('#amountForm').removeClass('d-none');
  $('#buttonWrap').hide();
  $('#buttonSubmit').text('충전하기');
  $('#processMode').val('recharge');
  $('.mode').text('충전');
})

$('#withdrawBtn').on('click', function() {
  $('#amountForm').removeClass('d-none');
  $('#buttonWrap').hide();
  $('#buttonSubmit').text('인출하기');
  $('#processMode').val('withdraw');
  $('.mode').text('인출');
})

$('#buttonCancel').on('click', function() {
  $('#amountForm').addClass('d-none');
  $('#buttonWrap').show();
})
