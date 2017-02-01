$(document).ready(function () {
    var footerHeight = $('footer').innerHeight();
    $('body').css({
        'paddingBottom': footerHeight
    });

    $(document).on('click', '.ui-widget-overlay', function () {
        $('.ui-dialog-content').dialog('close');
    });

    $('.slider').slick({
        nextArrow: '<div class="slick-next"></div>',
        prevArrow: '<div class="slick-prev"></div>'
    });

    $('.carousel').slick({
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        infinite: true,
        nextArrow: '<div class="slick-next"></div>',
        prevArrow: '<div class="slick-prev"></div>',
    });

    $(document).on('click', '.burger', function () {
        $('.mobile-menu').toggleClass('active');
    });
});
