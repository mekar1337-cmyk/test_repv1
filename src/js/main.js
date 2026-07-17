const swiper = new Swiper('.swiper', {
  // Одна карточка на всех разрешениях экрана
  slidesPerView: 1,
  
  // Бесконечная прокрутка (можно убрать loop: true, если не нужна)
  loop: true,
  
  // Только пагинация (точки внизу)
  pagination: {
    el: '.swiper-pagination',
    clickable: true, // Разрешает переключение слайдов кликом по точкам
  },
});


document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.querySelector('.video-player__play-btn');
  const popup = document.getElementById('videoPopup');
  const closeBtn = document.querySelector('.video-popup__close');
  const overlay = document.querySelector('.video-popup__overlay');
  const video = document.getElementById('popupVideo');

  const openPopup = () => {
    popup.classList.add('is-active');
    video.play().catch(error => {
      console.log('Автовоспроизведение заблокировано браузером:', error);
    });
  };

  const closePopup = () => {
    popup.classList.remove('is-active');
    video.pause();
    video.currentTime = 0;
  };

  // События
  if (playBtn) {
    playBtn.addEventListener('click', openPopup);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closePopup);
  }

  if (overlay) {
    overlay.addEventListener('click', closePopup); 
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('is-active')) {
      closePopup();
    }
  });
});