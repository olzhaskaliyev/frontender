$(document).ready(function () {

    /*footer*/

    let autoFooterHeight = function () {
        let footerHeight = $('footer').outerHeight();
        let screenWidth = screen.width;
        if (screenWidth >= 767) {
            $('body').css({
                'paddingBottom': footerHeight
            });
        } else {
            $('body').css({
                'paddingBottom': 0
            });
        }
    };
    autoFooterHeight();
    $(window).resize(function () {
        autoFooterHeight();
    });

    /*mobile-menu*/

    let mobileMenu = $('.mobile-menu');
    $('.burger').click(function () {
        $(this).toggleClass('active');
        mobileMenu.toggleClass('active');
    });
    let mobileMenuConstructor = function () {
        if (screen.width < 767) {
            $('header .login').prependTo(mobileMenu);
            $('.navigation').appendTo(mobileMenu);
        } else {
            $('header .login').appendTo($('header .top-header .container'));
            $('.navigation').prependTo($('.navigation-wrap'));
        }
    };
    mobileMenuConstructor();
    $(window).resize(function () {
        mobileMenuConstructor();
    });

    /*sliders*/

    $('.slider').slick({
        autoplay: true,
        dots: true,
        nextArrow: '<div class="slick-next"></div>',
        prevArrow: '<div class="slick-prev"></div>',
        customPaging: function () {
            return '<div class="slick-dot"></div>';
        }
    });

    $('.carousel').slick({
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        nextArrow: '<div class="slick-next"></div>',
        prevArrow: '<div class="slick-prev"></div>',
        responsive: [
            {
                breakpoint: 991,
                settings: {
                    slidesToShow: 3
                }
            },
            {
                breakpoint: 767,
                settings: {
                    slidesToShow: 1
                }
            }
        ]
    });
});
