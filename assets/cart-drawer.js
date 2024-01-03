class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.CartDrawer = document.querySelector('.drawer__inner')
    this.cartLinks = document.querySelectorAll('#cart-link');
    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
    document.addEventListener('shopify:section:load', this.setHeaderCartIconAccessibility.bind(this));
    document.querySelector('#shopify-section-cart-drawer').addEventListener('shopify:section:select', this.sectionSelect.bind(this));
    document.querySelector('#shopify-section-cart-drawer').addEventListener('shopify:section:deselect', this.close.bind(this));
  }

  setHeaderCartIconAccessibility() {
    this.cartLinks = document.querySelectorAll('#cart-link');
    Array.from(this.cartLinks).forEach(cartLink => {
      cartLink.setAttribute('role', 'button');
      cartLink.setAttribute('aria-haspopup', 'dialog');
      cartLink.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLink)
      });
      cartLink.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'ENTER') {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    })
  }

  sectionSelect() {
    this.cartLink = document.querySelector('#cart-link')
    this.open(this.cartLink)
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    setTimeout(() => {this.classList.add('animate', 'active')});
    document.body.classList.add('hidden');
    this.CartDrawer.setAttribute('tabindex', '0')
    setTimeout(() => trapFocus(triggeredBy, this.CartDrawer.querySelector('a')), 10)
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('hidden')
    document.dispatchEvent(new CustomEvent('body:visible'));
    this.CartDrawer.setAttribute('tabindex', '-1')
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      const sectionElements = document.querySelectorAll(section.selector);
      if(sectionElements) {
        Array.from(sectionElements).forEach(sectionElement => {
          sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        })
      } 
    }));

    if(this.className.includes('open-after-adding')) {
      setTimeout(() => {
        this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
        this.open();
      });
    }
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    let arraySections = []
    if (window.innerWidth > 920 && document.querySelector('.header-without-sidebars')) {
      arraySections = [
        {
          id: 'cart-drawer',
          selector: '#CartDrawer'
        },
        {
          id: 'menu-drawer',
          selector: '#cart-icon-bubble-menu-drawer'
        },
        {
          id: 'header',
          selector: '#cart-icon-bubble-header'
        },
        {
          id: 'secondary-sidebar',
          selector: '#cart-icon-bubble-secondary-sidebar'
        },
        {
          id: 'main-sidebar',
          selector: '#cart-icon-bubble-main-sidebar'
        }
      ];
    } else if (window.innerWidth > 920 && document.querySelector('.secondary-header-section')) {
      arraySections = [
        {
          id: 'cart-drawer',
          selector: '#CartDrawer'
        },
        {
          id: 'menu-drawer',
          selector: '#cart-icon-bubble-menu-drawer'
        },
        {
          id: 'secondary-header',
          selector: '#cart-icon-bubble-secondary-header'
        },
        {
          id: 'secondary-sidebar',
          selector: '#cart-icon-bubble-secondary-sidebar'
        },
        {
          id: 'main-sidebar',
          selector: '#cart-icon-bubble-main-sidebar'
        }
      ];
    } else {
      arraySections = [
        {
          id: 'cart-drawer',
          selector: '#CartDrawer'
        },
        {
          id: 'menu-drawer',
          selector: '#cart-icon-bubble-menu-drawer'
        },
        {
          id: 'mobile-header',
          selector: '#cart-icon-bubble-mobile-header'
        }
      ];
    }
    return arraySections
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);
