$(function(){

  var KEYCODE_ESC = 27;

  // Mobile menu

  $('#menu-btn, .sliding-panel-close').on('click touchstart',function (e) {
    $('#menu-content').toggleClass('is-visible');

    if($('#menu-content').hasClass('is-visible')) {
      $('#menu-content a').attr('tabindex', '0');
    }
    else {
      $('#menu-content a').attr('tabindex', '-1');
    }

    e.preventDefault();
  });

  // Modal

  $('#modal-btn').on('click touchstart', function (e) {
    if ($('#modal').hasClass('hidden')) toggleModal('show');

    e.preventDefault();
  });


  $('#close-btn').on('click touchstart', function (e) {
    toggleModal('hide');

    e.preventDefault();
  });

  $(document).click(function(e) {
    if (!$(event.target).closest("#modal-content, #modal-btn").length && $('#modal').hasClass('flex')){
      toggleModal('hide');
    }
    else if(!$(event.target).closest("#menu-content, #menu-btn").length && $('#menu-content').hasClass('is-visible')){
      $('#menu-content').toggleClass('is-visible')
    }
  });

  $(document).keyup(function(e) {
    if(e.keyCode === KEYCODE_ESC && $('#modal').hasClass('flex')) {
      toggleModal('hide');
    }
  })

  $(document).focusin(function(e) {
    var modal = document.getElementById("modal");
    
    if($('#modal').hasClass('flex') && !$.contains(modal, e.target)) {
      e.stopPropagation();
      $('#modal-content').focus();
    }

  });

  var toggleModal = function(sh){ 
    if(sh == "show") {
      $('#modal').toggleClass('hidden flex');

      $('#modal-header').focus();

      $('#header, #main-content, #goc-footer').attr('aria-hidden', 'true');

      $("body").toggleClass('modal-open');
      
    }

    else {
      $('#modal').toggleClass('hidden flex');

      $('#header, #main-content, #goc-footer').attr('aria-hidden', 'false');

      $("body").toggleClass('modal-open');

      $('#close-btn').focus();
    }

  };

});
