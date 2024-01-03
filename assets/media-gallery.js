if (!customElements.get('media-gallery')) {
  customElements.define('media-gallery', class MediaGallery extends HTMLElement {
    constructor() {
      super();
      this.elements = {
        liveRegion: this.querySelector('[id^="GalleryStatus"]'),
        viewer: this.querySelector('[id^="GalleryViewer"]'),
        thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        slider: this.querySelector('[id^="Slider-Thumbnails"]'),
        sliderMedia: this.querySelector('[id^="Slider-Gallery"]'),
        thumbnailsArray: this.querySelectorAll('[id^="Slide-Thumbnails"]')
      }
      this.mql = window.matchMedia('(min-width: 750px)');
      if (!this.elements.thumbnails) return;
      this.elements.slider.addEventListener('click', this.setActiveThumbnail.bind(this))
      this.elements.slider.addEventListener('keyup', (event) => {
        if (event.code.toUpperCase() === 'ENTER') this.setActiveThumbnail(event)
      })
      if (this.dataset.desktopLayout !== 'one_column_grid' && this.dataset.desktopLayout !== 'two_columns_grid' && this.mql.matches) this.removeListSemantic();
    }

    setActiveMedia(mediaId) { 
      const prevActiv = this.elements.viewer.querySelector(`.is-active`)
      prevActiv.classList.remove('is-active');
      const activeMedia = this.elements.viewer.querySelector(`[data-media-id="${ mediaId }"]`);
      activeMedia.classList.add('is-active');
      if(this.elements.sliderMedia.classList.contains('slider-main--original')) {
        let height = activeMedia.offsetHeight
        this.elements.sliderMedia.style.height = height + 'px'
      }
      this.elements.sliderMedia.scrollTo({
        left: activeMedia.offsetLeft,
        behavior: 'smooth'
      })
      if (this.querySelector('[id^="GalleryThumbnails"]')) {
        const prevActiveThumbnail = this.elements.thumbnails.querySelector(`.is-active`)
        
        if (prevActiveThumbnail) prevActiveThumbnail.classList.remove('is-active');
        const mediaIdValue = this.elements.viewer.querySelector(`.is-active`).dataset.mediaId
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${ mediaIdValue }"]`)
        activeThumbnail.classList.add('is-active');
        this.elements.slider.scrollTo({
          left: activeThumbnail.offsetLeft - activeThumbnail.offsetWidth - 8,
          behavior: 'smooth'
        })
        if (activeThumbnail.parentElement.classList.contains('thumbnail-list--column')) {
          this.elements.thumbnails.scrollTo({
            top: activeThumbnail.offsetTop - activeThumbnail.offsetHeight - 8,
            behavior: 'smooth'
          })
        }
      }

      this.preventStickyHeader();
      window.setTimeout(() => {
        if (this.dataset.desktopLayout === 'one_column_grid' || this.dataset.desktopLayout === 'two_columns_grid') {
          activeMedia.scrollIntoView({behavior: 'smooth'});
        }
      });
      this.playActiveMedia(activeMedia);
      if (!this.elements.thumbnails) return;
      this.announceLiveRegion(activeMedia, this.elements.thumbnails.querySelector(`[data-target="${ mediaId }"]`).dataset.mediaPosition);
    }

    setActiveThumbnail(event) {
      let galleryMedia = this.elements.thumbnails.closest('.slider-block').querySelector('[id^="GalleryViewer-"]')
      galleryMedia.querySelector('[id^="Slider-Gallery-"]').classList.add('disable-scroll')
      if(!event.target.closest('.thumbnail-list__item')) return
      this.elements.thumbnails.querySelectorAll('button').forEach((element) => element.removeAttribute('aria-current'));
      this.elements.thumbnails.querySelectorAll('li').forEach(item => item.classList.remove('is-active'))
      galleryMedia.querySelectorAll('li').forEach(item => item.classList.remove('is-active'))
      let newActiveThumb = event.target.closest('.thumbnail-list__item')
      let activeThumbData = newActiveThumb.dataset.target
      
      let newActiveMedia = this.elements.sliderMedia.querySelector(`[data-media-id="${ activeThumbData }"]`)
      setTimeout(() => {
        newActiveThumb.classList.add('is-active')
        newActiveThumb.querySelector('button').setAttribute('aria-current', true);
        newActiveMedia.classList.add('is-active')
        if(this.elements.sliderMedia.classList.contains('slider-main--original')) {
          let height = newActiveMedia.offsetHeight
          this.elements.sliderMedia.style.height = height + 'px'
        }
          this.elements.sliderMedia.scrollTo({
          left: newActiveMedia.offsetLeft
        })
        if (this.elements.slider.classList.contains('thumbnail-list--column')) {
          this.elements.slider.closest('.thumbnail-slider--column').scrollTo({
            top: newActiveThumb.offsetTop - newActiveThumb.offsetHeight - 8,
            behavior: 'smooth'
          })
        } else {
          this.elements.slider.scrollTo({
            left: newActiveThumb.offsetLeft - newActiveThumb.offsetWidth - 8,
            behavior: 'smooth'
          })
        }
      }, 5) 
      setTimeout(() => {
        galleryMedia.querySelector('[id^="Slider-Gallery-"]').classList.remove('disable-scroll')
      }, 500)
    }

    announceLiveRegion(activeItem, position) {
      const image = activeItem.querySelector('.product__modal-opener--image img');
      if (!image) return;
      image.onload = () => {
        this.elements.liveRegion.setAttribute('aria-hidden', false);
        this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace(
          '[index]',
          position
        );
        setTimeout(() => {
          this.elements.liveRegion.setAttribute('aria-hidden', true);
        }, 2000);
      };
      image.src = image.src;
    }

    playActiveMedia(activeItem) {
      window.pauseAllMedia();
      const deferredMedia = activeItem.querySelector('.deferred-media');
      if (deferredMedia) deferredMedia.loadContent(false);
    }

    preventStickyHeader() {
      this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
      if (!this.stickyHeader) return;
      this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
    }

    removeListSemantic() {
      if (!this.elements.viewer.slider) return;
      this.elements.viewer.slider.setAttribute('role', 'presentation');
      this.elements.viewer.sliderItems.forEach(slide => slide.setAttribute('role', 'presentation'));
    }
  });
}
