class MenuDrawer extends HTMLElement {
    constructor() {
      super();

      this.elements = {
        sidebarDrawer: this.querySelector('.menu-drawer'),
        sidebarDrawerButton: this.querySelectorAll('.button-close'),
        focusableElements: Array.from(this.querySelectorAll('summary, a[href], button:enabled, [tabindex="0"], [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe'))
      };
      document.querySelectorAll('.burger-menu').forEach(item => item.addEventListener('click', this.openDrawer.bind(this)));
      document.querySelectorAll('.burger-menu').forEach(item => {
        item.addEventListener('keyup', (event) => {
          if (event.code.toUpperCase() === 'ENTER') {
            this.openDrawer()
            trapFocus(
              event.target.closest('.burger-menu'),
              this.elements.focusableElements[0]
            );
          }
        })
      });
      if (Shopify.designMode) {
        document.querySelector('#shopify-section-menu-drawer').addEventListener('shopify:section:select', this.openDrawer.bind(this));
        document.querySelector('#shopify-section-menu-drawer').addEventListener('shopify:section:deselect', this.closeDrawer.bind(this));
        document.querySelector('#shopify-section-menu-drawer').addEventListener('shopify:section:unload', this.openDrawer.bind(this))
        window.addEventListener('shopify:section:load', () => document.querySelectorAll('.burger-menu').forEach(item => item.addEventListener('click', this.openDrawer.bind(this))))
      }

      this.elements.sidebarDrawerButton.forEach(item => item.addEventListener('click', this.closeDrawer.bind(this)));
        document.addEventListener('keyup', (event) => {
          if (event.code.toUpperCase() === 'ESCAPE' && this.elements.sidebarDrawer.classList.contains('open')) this.closeDrawer()
        })
    }
  
    openDrawer() {
      this.elements.sidebarDrawer.removeAttribute('hidden')
      setTimeout(() => {
        this.elements.sidebarDrawer.classList.add('open')
      }, 100)
      document.body.classList.add('hidden')
    }
  
    closeDrawer() {
      this.elements.sidebarDrawer.setAttribute('hidden', 'true')
      this.elements.sidebarDrawer.classList.remove('open')
      document.body.classList.remove('hidden')
      document.dispatchEvent(new CustomEvent('body:visible'));
      document.querySelectorAll('.burger-menu').forEach(item => item.blur());
    }
  }
  customElements.define('menu-drawer', MenuDrawer);  