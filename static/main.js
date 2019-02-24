$(document).ready(function () {
  $("#addStreamerForm").submit(function (e) {
    e.preventDefault();
    var streamerId = $(this).find('input[name="streamer"]').val();
    if(streamerId){
      $.post('/add-streamer', {
        streamer: streamerId
      }).then(function(res){
        if(res.status === 'failure'){
          throw new Error(res.error);
        }else{
          $('.streamer-error').remove();
          window.location.href = '/stream';
        }
      }).catch(function(err) {
        $('.streamer-error').remove();
        const errorElement = "<div class='streamer-error text-danger'>" + err.toString() + "</div>";
        $(errorElement).insertAfter('#streamerHelp');
      });
    }
  });
});