$(window).load(function () {
	var footerHeight = $('footer').innerHeight();
	$('body').css({
		'paddingBottom': footerHeight
	});
});

$(document).ready(function () {
	$(document).on('click', '.ui-widget-overlay', function () {
		$('.ui-dialog-content').dialog('close');
	});

	$('a[href*=\'#\']').mPageScroll2id({
		scrollSpeed: 800,
		scrollEasing: 'easeInOutCubic',
		offset: 80
	});

	$('.slider').slick();

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
