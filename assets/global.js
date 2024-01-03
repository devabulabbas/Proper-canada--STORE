window.theme = window.theme || {};

theme.config = {
  mqlSmall: false,
  mediaQuerySmall: 'screen and (max-width: 749px)',
  isTouch: ('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
  rtl: document.documentElement.getAttribute('dir') === 'rtl' ? true : false
};

const PUB_SUB_EVENTS = {
  cartUpdate: 'cart-update',
  quantityUpdate: 'quantity-update',
  variantChange: 'variant-change',
  cartError: 'cart-error'
};

let subscribers = {}

function subscribe(eventName, callback) {
  if (subscribers[eventName] === undefined) {
    subscribers[eventName] = []
  }

  subscribers[eventName] = [...subscribers[eventName], callback];

  return function unsubscribe() {
    subscribers[eventName] = subscribers[eventName].filter((cb) => {
      return cb !== callback
    });
  }
};

function publish(eventName, data) {
  if (subscribers[eventName]) {
    subscribers[eventName].forEach((callback) => {
      callback(data)
    })
  }
}

function filterShopifyEvent(event, domElement, callback) {
  let executeCallback = false;
  if (event.type.includes('shopify:section')) {
    if (domElement.hasAttribute('data-section-id') && domElement.getAttribute('data-section-id') === event.detail.sectionId) {
      executeCallback = true;
    }
  }
  else if (event.type.includes('shopify:block') && event.target === domElement) {
    executeCallback = true;
  }
  if (executeCallback) {
    callback(event);
  }
}

// Init section function when it's visible, then disable observer
theme.initWhenVisible = function(options) {
  const threshold = options.threshold ? options.threshold : 0;

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (typeof options.callback === 'function') {
          options.callback();
          observer.unobserve(entry.target);
        }
      }
    });
  }, {rootMargin: `0px 0px ${threshold}px 0px`});

  observer.observe(options.element);
};

function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll(
        "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
      )
    );
  }
  
  document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));
  
    if(summary.nextElementSibling.getAttribute('id')) {
      summary.setAttribute('aria-controls', summary.nextElementSibling.id);
    }
  
    summary.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });
  
    if (summary.closest('header-drawer')) return;
    summary.parentElement.addEventListener('keyup', onKeyUpEscape);
  });
  
  const trapFocusHandlers = {};
  
  function trapFocus(container, elementToFocus = container) {
  
    var elements = getFocusableElements(container);
    
    var first = elements[0];
    var last = elements[elements.length - 1];
  
    removeTrapFocus();
  
    trapFocusHandlers.focusin = (event) => {
      if (
        event.target !== container &&
        event.target !== last &&
        event.target !== first
      )
        return;
  
      document.addEventListener('keydown', trapFocusHandlers.keydown);
    };
  
    trapFocusHandlers.focusout = function() {
      document.removeEventListener('keydown', trapFocusHandlers.keydown);
    };
  
    trapFocusHandlers.keydown = function(event) {
      if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
      // On the last focusable element and tab forward, focus the first element.
      if (event.target === last && !event.shiftKey) {
        event.preventDefault();
        first.focus();
      }
  
      //  On the first focusable element and tab backward, focus the last element.
      if (
        (event.target === container || event.target === first) &&
        event.shiftKey
      ) {
        event.preventDefault();
        last.focus();
      }
    };
  
    document.addEventListener('focusout', trapFocusHandlers.focusout);
    document.addEventListener('focusin', trapFocusHandlers.focusin);
  
    elementToFocus.focus();
  }
  focusVisiblePolyfill()
  
  // Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
  try {
    document.querySelector(":focus-visible");
  } catch(e) {
    focusVisiblePolyfill();
  }
  
  function focusVisiblePolyfill() {
    const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
    let currentFocusedElement = null;
    let mouseClick = null;
  
    window.addEventListener('keydown', (event) => {
      if(event.code && navKeys.includes(event.code.toUpperCase())) {
        mouseClick = false;
      }
    });
  
    window.addEventListener('mousedown', (event) => {
      mouseClick = true;
    });
  
    window.addEventListener('focus', () => {
      if (currentFocusedElement) currentFocusedElement.classList.remove('focused');
      if (mouseClick) return;
      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add('focused');
  
    }, true);
  }
  
  function pauseAllMedia() {
    document.querySelectorAll('.js-youtube').forEach((video) => {
      video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
    });
    document.querySelectorAll('.js-vimeo').forEach((video) => {
      video.contentWindow.postMessage('{"method":"pause"}', '*');
    });
    document.querySelectorAll('video').forEach((video) => video.pause());
    document.querySelectorAll('product-model').forEach((model) => {
      if (model.modelViewerUI) model.modelViewerUI.pause();
    });
  }

  // Play or pause a video/product model if it’s visible or not
  setTimeout(() => {
    document.querySelectorAll('video').forEach((video) => {
      if(!video.closest('.none-autoplay')) {
        let isVisible = elemInViewport(video);
        let isPlaying = video.currentTime > 0 && !video.paused && !video.ended && video.readyState > video.HAVE_CURRENT_DATA;
        if(isVisible) {
          if(!isPlaying) video.play()
        } else {
          video.pause()
        }
      }
    })
    document.querySelectorAll('product-model').forEach((model) => {
      if (model.modelViewerUI) {
        let isVisible = elemInViewport(model);
        isVisible ? model.modelViewerUI.play() : model.modelViewerUI.pause();
      }
    })
  }, 10)

  document.addEventListener('scroll', () => {
    document.querySelectorAll('video').forEach((video) => {
      if(!video.closest('.none-autoplay')) {
        let isVisible = elemInViewport(video);
        let isPlaying = video.currentTime > 0 && !video.paused && !video.ended && video.readyState > video.HAVE_CURRENT_DATA;
        if(isVisible) {
          if(!isPlaying) video.play()
        } else {
          video.pause()
        }
      }
    })
  })  

  if (Shopify.designMode) {
    document.addEventListener('shopify:section:load', () => {
      document.querySelectorAll('video').forEach((video) => {
        if(!video.closest('.none-autoplay')) {
          let isVisible = elemInViewport(video);
          let isPlaying = video.currentTime > 0 && !video.paused && !video.ended && video.readyState > video.HAVE_CURRENT_DATA;
          if(isVisible) {
            if(!isPlaying) video.play()
          } else {
            video.pause()
          }
        }
      })
    })
  }

  function elemInViewport(elem) {
    let box = elem.getBoundingClientRect();
    let top = box.top;
    let bottom = box.bottom;
    let height = document.documentElement.clientHeight;
    let maxHeight = 0;
    return Math.min(height,bottom)- Math.max(0,top) >= maxHeight
  }
  
  function removeTrapFocus(elementToFocus = null) {
    document.removeEventListener('focusin', trapFocusHandlers.focusin);
    document.removeEventListener('focusout', trapFocusHandlers.focusout);
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  
    if (elementToFocus) elementToFocus.focus();
  }
  
  function onKeyUpEscape(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;
  
    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;
  
    const summaryElement = openDetailsElement.querySelector('summary');
    openDetailsElement.removeAttribute('open');
    summaryElement.setAttribute('aria-expanded', false);
    summaryElement.focus();
  }
  
  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  
  function fetchConfig(type = 'json') {
    return {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
    };
  }
  
function isStorageSupported (type) {
  // Return false if we are in an iframe without access to sessionStorage
  if (window.self !== window.top) {
    return false;
  }

  const testKey = 'avante-theme:test';
  let storage;
  if (type === 'session') {
    storage = window.sessionStorage;
  }
  if (type === 'local') {
    storage = window.localStorage;
  }

  try {
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  }
  catch (error) {
    // Do nothing, this may happen in Safari in incognito mode
    return false;
  }
}

  /*
    * Shopify Common JS
    */
  if ((typeof window.Shopify) == 'undefined') {
    window.Shopify = {};
  }
  
  Shopify.bind = function(fn, scope) {
    return function() {
      return fn.apply(scope, arguments);
    }
  };
  
  Shopify.setSelectorByValue = function(selector, value) {
    for (var i = 0, count = selector.options.length; i < count; i++) {
      var option = selector.options[i];
      if (value == option.value || value == option.innerHTML) {
        selector.selectedIndex = i;
        return i;
      }
    }
  };
  
  Shopify.addListener = function(target, eventName, callback) {
    target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
  };
  
  Shopify.postLink = function(path, options) {
    options = options || {};
    var method = options['method'] || 'post';
    var params = options['parameters'] || {};
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);
  
    for(var key in params) {
      var hiddenField = document.createElement("input");
      hiddenField.setAttribute("type", "hidden");
      hiddenField.setAttribute("name", key);
      hiddenField.setAttribute("value", params[key]);
      form.appendChild(hiddenField);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };
  
  Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
    this.countryEl 
    this.provinceEl
    this.provinceContainer

    if(document.querySelector('#main-cart')) {
      this.shippingCalculators = document.querySelectorAll('shipping-calculator')
      this.shippingCalculators.forEach(shippingCalculator => {
        this.countryEl         = shippingCalculator.querySelector(`#${country_domid}`);
        this.provinceEl        = shippingCalculator.querySelector(`#${province_domid}`);
        this.provinceContainer = shippingCalculator.querySelector(`#${options['hideElement']}` || `#${province_domid}`);

        Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));
    
        this.initCountry();
        this.initProvince();
      })
    } else {
      this.countryEl         = document.getElementById(country_domid);
      this.provinceEl        = document.getElementById(province_domid);
      this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

      Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

      this.initCountry();
      this.initProvince();
    }
  };

  Shopify.CountryProvinceSelector.prototype = {
    initCountry: function() {
      var value = this.countryEl.getAttribute('data-default');
      Shopify.setSelectorByValue(this.countryEl, value);
      this.countryHandler();
    },
  
    initProvince: function() {
      var value = this.provinceEl.getAttribute('data-default');
      if (value && this.provinceEl.options.length > 0) {
        Shopify.setSelectorByValue(this.provinceEl, value);
      }
    },
  
    countryHandler: function(e) {
      var opt       = this.countryEl.options[this.countryEl.selectedIndex];
      var raw       = opt.getAttribute('data-provinces');
      var provinces = JSON.parse(raw);
  
      this.clearOptions(this.provinceEl);
      if (provinces && provinces.length == 0) {
        this.provinceContainer.style.display = 'none';
      } else {
        for (var i = 0; i < provinces.length; i++) {
          var opt = document.createElement('option');
          opt.value = provinces[i][0];
          opt.innerHTML = provinces[i][1];
          this.provinceEl.appendChild(opt);
        }
        this.provinceContainer.style.display = "";
      }
    },
  
    clearOptions: function(selector) {
      while (selector.firstChild) {
        selector.removeChild(selector.firstChild);
      }
    },
  
    setOptions: function(selector, values) {
      for (var i = 0, count = values.length; i < values.length; i++) {
        var opt = document.createElement('option');
        opt.value = values[i];
        opt.innerHTML = values[i];
        selector.appendChild(opt);
      }
    }
  };

  class LocalizationForm extends HTMLElement {
    constructor() {
      super();
      this.elements = {
        input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
        inputLanguage: this.querySelector('input[name="locale_code"]'),
        button: this.querySelector('button'),
        panel: this.querySelector('.disclosure__list-wrapper'),
      };
      this.elements.button.addEventListener('click', this.openSelector.bind(this));
      this.elements.button.addEventListener('focusout', this.closeSelector.bind(this));
      this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
      this.querySelectorAll('a').forEach(item => item.addEventListener('click', this.onItemClick.bind(this)));
      this.elements.button.closest('.shopify-section').querySelector('div').addEventListener('scroll', this.hidePanel.bind(this))
      document.addEventListener('scroll', this.hidePanel.bind(this))
    }
    
    alignPanel() {
      this.buttonCoordinate = this.elements.button.getBoundingClientRect()
      this.viewportHeight = window.innerHeight
      this.viewportWidth = window.innerWidth
      this.elements.panel.style.top = this.buttonCoordinate.bottom + 'px'
      this.elementCoordinate = this.elements.panel.getBoundingClientRect();
      if (this.elementCoordinate.bottom > this.viewportHeight) this.elements.panel.style.top = this.buttonCoordinate.top - this.elements.panel.offsetHeight + 'px'
      if (this.elementCoordinate.right + 16 > this.viewportWidth) this.elements.panel.style.right = '16px'
    }

    hidePanel() {
      if (this.elements.panel.hasAttribute('hidden')) return
      this.elements.button.setAttribute('aria-expanded', 'false');
      this.elements.panel.setAttribute('hidden', true);
      this.elements.button.querySelectorAll('.disclosure__button-icon').forEach(item => item.classList.toggle('open'));
    }

    onContainerKeyUp(event) {
      if (event.code.toUpperCase() !== 'ESCAPE') return;
      this.hidePanel();
      this.elements.button.focus();
    }

    onItemClick(event) {
      event.preventDefault();
      const form = this.querySelector('form');
      this.elements.input.value = event.currentTarget.dataset.value;
      if (form) form.submit();
    }

    openSelector() {
      this.elements.button.focus();
      this.elements.panel.toggleAttribute('hidden');
      this.elements.button.querySelectorAll('.disclosure__button-icon').forEach(item => item.classList.toggle('open'));
      this.elements.button.setAttribute('aria-expanded', (this.elements.button.getAttribute('aria-expanded') === 'false').toString());
      setTimeout(this.alignPanel(), 20) 
    }

    closeSelector(event) {
      const shouldClose = event.relatedTarget && event.relatedTarget.nodeName === 'BUTTON';
      if (event.relatedTarget === null || shouldClose) {
        this.hidePanel();
        this.elements.button.querySelectorAll('.disclosure__button-icon').forEach(item => item.classList.remove('open'));
      }
    }
  }
  customElements.define('localization-form', LocalizationForm);

class MenuDropdown extends HTMLElement {
  constructor() {
    super();

    this.elements = {
      firstLevelLinkHeader: this.querySelectorAll('.menu__item-title--header'),
      dropdownFirstLevelLink: this.querySelectorAll('.menu__item-title--slide_out'),
      firstLevelCollapsibleButton: this.querySelectorAll('.menu__item-title--collapsible .dropdown-icon--first-level'),
      secondLevelButton: this.querySelectorAll('.dropdown-icon--second-level'),
      secondLevelLink: this.querySelectorAll('.menu__item-title--second-level'),
      headerDropdownChild: this.querySelectorAll('.menu__item-title--header ~ .menu__dropdown-container'),
      sidebarDropdownChild: this.querySelectorAll('.menu__item-title--slide_out ~ .menu__dropdown-container'),
      dropdownChildList: this.querySelectorAll('.menu__dropdown-child'),
      navContainer: this.querySelectorAll('.menu__navigation'),
      links: this.querySelectorAll('.menu__list a')
    };

    /*Script for Header menu*/
    this.elements.firstLevelLinkHeader.forEach(item => item.addEventListener('mouseenter', (event) => {
      this.openHeaderMenu(event, item)
    }))

    this.elements.firstLevelLinkHeader.forEach(item => {
      this.icon = item.querySelector('.dropdown-icon--first-level')
      if (this.icon) {
        this.icon.addEventListener('keyup', (event) => {
          if (event.code.toUpperCase() === 'ENTER') {
            if(!item.classList.contains('open')) this.openHeaderMenu(event, item)
            else if(item.classList.contains('open')) {
              this.elements.headerDropdownChild.forEach(item => item.classList.remove('open'))
              this.elements.firstLevelLinkHeader.forEach(item => item.classList.remove('open'))
              this.closeSecondDropdown(item)
            }
          }
        })
      }
    })

    this.elements.firstLevelLinkHeader.forEach(item => item.addEventListener('mouseleave', (event) => {
      if (event.relatedTarget && !event.relatedTarget.closest('.menu__dropdown-container') && !event.relatedTarget.closest('.menu__item')) {
        this.elements.headerDropdownChild.forEach(item => {
          item.classList.remove('open')
          if (item.classList.contains('mega-menu')) item.removeAttribute('style')
        })
        this.elements.firstLevelLinkHeader.forEach(item => item.classList.remove('open'))
        this.closeSecondDropdown(item)
      }
    }))

    this.elements.headerDropdownChild.forEach(item => item.addEventListener('mouseleave', (event) => {
      if (item.classList.contains('mega-menu') && item.classList.contains('mega-menu--wide') && item.closest('.header').offsetWidth > 1024) item.removeAttribute('style')
      if (event.relatedTarget != item.previousElementSibling && !Array.from(item.previousSibling.children).includes(event.relatedTarget)) {
        this.elements.firstLevelLinkHeader.forEach(item => item.classList.remove('open'))
        this.closeSecondDropdown(item)
      }
    }))
    /*Script for Collapsible menu type in Main sidebar and Menu in Menu Drawer section */
    this.elements.firstLevelCollapsibleButton.forEach(item => item.addEventListener('click', () => {
      this.toggleCollapsibleMenu(item)
    }))

    this.elements.firstLevelCollapsibleButton.forEach(item => item.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ENTER') {
        this.toggleCollapsibleMenu(item)
      }
    }))

    this.elements.secondLevelButton.forEach(item => item.addEventListener('click', () => {
      this.toggleSecondLevelMenu(item)
    }))
    this.elements.secondLevelButton.forEach(item => item.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ENTER') this.toggleSecondLevelMenu(item)
    }))

    /*Script for Slide out menu type in Main Sidebar */
    this.elements.dropdownFirstLevelLink.forEach(item => item.addEventListener('mouseenter', () => {
      this.openSlideOutMenu(item)
    }))
    this.elements.dropdownFirstLevelLink.forEach(item => {
      this.icon = item.querySelector('.dropdown-icon--first-level')
      if (this.icon) {
        this.icon.addEventListener('keyup', (event) => {
          if (event.code.toUpperCase() === 'ENTER') {
            if(!item.classList.contains('open')) this.openSlideOutMenu(item)
            else if(item.classList.contains('open')) {
              this.elements.dropdownFirstLevelLink.forEach(item => item.classList.remove('open'))
            }
          }
        })
      }
    })
    this.elements.dropdownFirstLevelLink.forEach(item => item.addEventListener('mouseleave', (event) => {
      if (item.classList.contains('open') && !event.relatedTarget.classList.contains('menu__dropdown-container') && !Array.from(item.nextSibling.children).includes(event.relatedTarget) && !event.relatedTarget.classList.contains('menu__dropdown-child-item-link') && event.relatedTarget != item.closest('.menu-container')) {
        this.elements.dropdownFirstLevelLink.forEach(item => {
          item.classList.remove('open')
          item.closest('.main-sidebar-section').style.zIndex = 20
        })
      }
    }))
   
    this.elements.sidebarDropdownChild.forEach(item => item.addEventListener('mouseleave', (event) => {
      if (event.relatedTarget != item.previousElementSibling && !Array.from(item.previousElementSibling.children).includes(event.relatedTarget)) {
        this.elements.dropdownFirstLevelLink.forEach(item => {
          item.classList.remove('open')
          item.closest('.main-sidebar-section').style.zIndex = 20
        })
      }
    }))

    this.elements.links.forEach(link => {
      link.addEventListener('click', this.closeParentContainers.bind(link, this))
    })
  }

  openHeaderMenu(event, item) {
    if (event.target.closest('.menu__item-title--first-level.menu__item-title--header')) item.classList.add('open') 
    this.elements.headerDropdownChild.forEach(itemContainer => {
      if (itemContainer.classList.contains('mega-menu') && itemContainer.classList.contains('mega-menu--wide') && itemContainer.closest('.header').offsetWidth > 1024) {
        itemContainer.style.left = - item.getBoundingClientRect().left + itemContainer.closest('.header').getBoundingClientRect().left + 24 + 'px'
        itemContainer.style.width = itemContainer.closest('.header').offsetWidth - 48 + 'px' 
      } else if (itemContainer.classList.contains('mega-menu') && itemContainer.classList.contains('mega-menu--wide') && itemContainer.closest('.header').offsetWidth <= 1024) {
        setTimeout(this.alignDropdown(), 1000)
      } else if (!itemContainer.classList.contains('mega-menu') || itemContainer.classList.contains('mega-menu') && itemContainer.classList.contains('mega-menu--narrow')) {
        setTimeout(this.alignDropdown(), 1000)
      }
    })
    if (item.classList.contains('menu__item-title--slide_out')) {
      this.itemCoordinate = item.getBoundingClientRect()   
      this.elements.dropdownChildList.forEach(el => el.style.top = +this.itemCoordinate.top + 'px')
      this.elements.navContainer.forEach(item => {
        this.containerCoordinate = item.getBoundingClientRect()
        this.elements.dropdownChildList.forEach(element => element.style.top = -this.containerCoordinate.top + 'px')
      })
    }
    if (item.classList.contains('open')) {
      if (item.nextElementSibling) item.nextElementSibling.querySelectorAll('.menu__dropdown-child-item-link').forEach(link => link.setAttribute('tabindex', '0'))
    } else {
      if (item.nextElementSibling) item.nextElementSibling.querySelectorAll('.menu__dropdown-child-item-link').forEach(link => link.setAttribute('tabindex', '-1'))
    }  
  }

  openSlideOutMenu(item) {
    if (!item.nextElementSibling) return
    
    item.closest('.main-sidebar-section').style.zIndex = 21
    // let padding = 24
    let itemParentStyles = window.getComputedStyle(item.closest('.main-sidebar'))
    let padding = +itemParentStyles.getPropertyValue("padding-left").slice(0, -2)
    item.nextSibling.style.left = item.closest('.menu__item').offsetWidth + padding + 'px'         
    this.itemCoordinate = item.getBoundingClientRect()
    this.elements.sidebarDropdownChild.forEach(el => el.style.top = this.closest('.main-sidebar').getBoundingClientRect().top + 'px')
    document.addEventListener('scroll', () => {
      this.elements.sidebarDropdownChild.forEach(el => el.style.top = this.closest('.main-sidebar').getBoundingClientRect().top + 'px')
    })
    this.elements.dropdownChildList.forEach(el => el.style.top = +this.itemCoordinate.top - this.closest('.main-sidebar').getBoundingClientRect().top + 'px')
    this.dropdownWidth = item.closest('.main-sidebar').offsetWidth
    item.nextSibling.style.width = this.dropdownWidth + 'px'
    item.classList.add('open')
    if (item.classList.contains('open')) {
      item.nextElementSibling.querySelectorAll('.menu__dropdown-child-item-link').forEach(link => link.setAttribute('tabindex', '0'))
    } else {
      item.nextElementSibling.querySelectorAll('.menu__dropdown-child-item-link').forEach(link => link.setAttribute('tabindex', '-1'))
    }  
  }

  toggleCollapsibleMenu(item) {
    item.closest('.menu__item-title--collapsible').classList.toggle('open')
      if (item.classList.contains('dropdown-icon--plus')) {
        item.setAttribute('tabindex', '-1')
        item.nextElementSibling.setAttribute('tabindex', '0')
      }
      if (item.classList.contains('dropdown-icon--minus')) {
        item.setAttribute('tabindex', '-1')
        item.previousElementSibling.setAttribute('tabindex', '0')
      }
      let panel = item.closest('.menu__item-title--collapsible').nextElementSibling
      panel.style.maxHeight ? panel.style.maxHeight = null : panel.style.maxHeight = panel.scrollHeight + "px"
      if (item.closest('.menu__item-title--collapsible').classList.contains('open')) {
        panel.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '0'))
      } else {
        panel.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '-1'))
      }
      if (!item.closest('.menu__item-title--collapsible').classList.contains('open')) {
        let parentItem = item.closest('.menu__item')
        parentItem.querySelector('.menu__item-title--second-level').classList.remove('open')
        if(parentItem.querySelector('.menu__dropdown-grandchild-container')) parentItem.querySelector('.menu__dropdown-grandchild-container').style.maxHeight = ''
      }
  }

  toggleSecondLevelMenu(item) {
    item.parentElement.classList.toggle('open')
    let childPanel = item.closest('.menu__item-title--second-level').nextElementSibling
    childPanel.style.maxHeight ? childPanel.style.maxHeight = null : childPanel.style.maxHeight = childPanel.scrollHeight + "px"
    if (item.closest('.menu__item-title--collapsible + .menu__dropdown-container')) {
      let parent = item.closest('.menu__item-title--collapsible + .menu__dropdown-container')
      let parentHeight = parent.offsetHeight
      parent.style.maxHeight = parentHeight + childPanel.scrollHeight + "px"
    }
    let panel = item.closest('.menu__item-title--second-level').nextElementSibling
      if (item.closest('.menu__item-title--second-level').classList.contains('open')) {
        panel.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '0'))
      } else {
        panel.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '-1'))
      }
  }

  alignDropdown() {
    this.elements.headerDropdownChild.forEach(item => {
      this.itemCoordinate = item.getBoundingClientRect();
      this.viewportHeight = window.innerHeight
      this.viewportWidth = window.innerWidth
      this.header = item.closest('.header')
      if (item.closest('.menu__item').getBoundingClientRect().left + item.offsetWidth > this.viewportWidth) item.style.left = - (item.closest('.menu__item').getBoundingClientRect().left + item.offsetWidth) + this.viewportWidth - 16 + 'px'
      if (this.itemCoordinate.offsetHeight > this.viewportHeight) item.style.top = - this.itemCoordinate.height + 'px'
    })
  }
  closeParentContainers(link) {
    if (link.closest('.menu-drawer')) {
      link.closest('.menu-drawer').setAttribute('hidden', 'true')
      link.closest('.menu-drawer').classList.remove('open')
      document.body.classList.remove('hidden')
      document.dispatchEvent(new CustomEvent('body:visible'));
    }
    if (link.closest('.menu__list--header')) link.closest('.menu__item-title--header').classList.remove('open')
    if (link.closest('.menu__list--main-sidebar')) link.closest('.menu__item-title--slide_out').classList.remove('open')
  }

  closeSecondDropdown(parent) {
    let children = parent.querySelectorAll('.menu__dropdown-child-item')
    children.forEach(item => {
      item.querySelector('.menu__item-title--second-level').classList.remove('open')
      if (item.querySelector('.menu__dropdown-grandchild-container')) item.querySelector('.menu__dropdown-grandchild-container').style.maxHeight = ''
    })
  }
}
customElements.define('menu-dropdown', MenuDropdown);

class FormState extends HTMLElement {
  constructor() {
    super();

    this.formInputs = this.querySelectorAll('input.required, select[required]');
    this.form = this.querySelector('form');
    if (this.form) this.buttonSubmit = this.form.querySelector('button[type="submit"]') || this.form.querySelector('.button--submit');

    this.formInputs.forEach((input) => {
      input.addEventListener('input', this.onInputChange.bind(this));
    });
    if (this.buttonSubmit) this.buttonSubmit.addEventListener('click', this.onSubmitHandler.bind(this));
  }

  onInputChange(event) {
    if(event.target.closest('.invalid')) event.target.classList.remove('invalid');
    event.target.classList.add('valid');
  }

  onSubmitHandler() {
    this.formInputs.forEach((input) => {
      if(input.hasAttribute('type') && input.getAttribute('type') == 'password' || input.hasAttribute('type') && input.getAttribute('type') == 'text') {
        input.value.length == 0 ? this.invalidInput(input) : this.validInput(input)
      }
      if(input.hasAttribute('type') && input.getAttribute('type') == 'email') {
        input.value.includes('@') ? this.validInput(input) : this.invalidInput(input)
      }
      if(!input.hasAttribute('type')) {
        input.value === input.dataset.empty ? this.invalidInput(input) : this.validInput(input)
      }
    });
  }

  invalidInput(input) {
    if(input.closest('.valid')) input.classList.remove('valid');
    input.classList.add('invalid');
  }
  validInput(input) {
    if(input.closest('.invalid')) input.classList.remove('invalid');
    input.classList.add('valid');
  }
}
customElements.define('form-state', FormState);  

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })
    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}
customElements.define('quantity-input', QuantityInput);

class ModalDialog extends HTMLElement {
  constructor() {
    super();

    this.elements = {
      body: document.querySelector('body'),
      buttons: this.querySelectorAll('.open-popup'),
      overlay: this.querySelector('.overlay'),
      buttonsClose: this.querySelectorAll('.close-popup'),
      filterGroups: this.querySelectorAll('.filter-group')
    }
    this.elements.buttons.forEach(button => button.addEventListener('click', (event) => {
      if (!event.target.closest('.video-button') && event.target.closest('a') && !event.target.closest('.card-quick-view')) return
      this.openContainer(event)
    }))
    this.elements.buttons.forEach(button => button.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'ENTER') {
        if (!event.target.closest('.video-button') && event.target.closest('a') && !event.target.closest('.card-quick-view')) return
        this.openContainer(event)
      }
    }))

    document.addEventListener('keyup', (event) => {
      if (event.code && event.code.toUpperCase() === 'ESCAPE' && this.querySelector('.popup-wrapper.open')) this.closeContainer(event)   
    })
    
    if (this.elements.overlay) this.elements.overlay.addEventListener('click', this.closeContainer.bind(this));
    if (this.elements.buttonsClose) this.elements.buttonsClose.forEach(buttonClose => buttonClose.addEventListener('click', this.closeContainer.bind(this)));
    if (this.closest('.only-mobile.snippet-facets')) {
      window.addEventListener('resize', () => {
        if(window.innerWidth > 768 && this.popup && this.popup.closest('.open')) {
          this.closeContainer(this.querySelector('.close-popup'))
        }
      })
    }
  }
  
  openContainer(event) {
    if (event.target.closest('.card-quick-view')) {
      event.preventDefault()
      event.target.closest('.card-quick-view').classList.add('no-hover')
    }
    this.popup = event.target.closest('.open-popup').parentNode.querySelector('.popup-wrapper')
    if (!this.popup) return
    this.popup.classList.add('open')
    this.elements.overlay.classList.add('open')
    if(this.closest('.container--sticky')) this.closest('.container--sticky').style.position = 'static'
    if (this.popup.closest('.hover-content')) this.popup.closest('.banner__content').style.setProperty('opacity', 1, 'important')
    // Make content visible if modal-dialog is inside slider-component
    if(this.popup.closest('.slider__grid')) this.popup.closest('.slider__grid').style.overflow = 'visible';
    // Add focus to input in password page popup
    const inputPassword = this.popup.querySelector('input.enter-using-password')
    if(inputPassword) inputPassword.focus()
    if(!this.elements.body.className.includes('hidden')) this.elements.body.classList.add('hidden')
    document.dispatchEvent(new CustomEvent('dialog:after-show'))
  }

  closeContainer(event) {
    if(this.closest('a.media-with-text__card')) event.preventDefault()
    let eventTarget
    event.target ? eventTarget = event.target : eventTarget = event
    if (eventTarget.closest('.card-quick-view')) {
      event.preventDefault()
      eventTarget.closest('.card-quick-view').classList.remove('no-hover')
    }
    this.popup = this.querySelector('.popup-wrapper.open')
    this.popup.classList.remove('open')
    this.elements.overlay.classList.remove('open')
    if(this.closest('.container--sticky')) this.closest('.container--sticky').style.position = 'sticky'
    if (this.popup.closest('.hover-content')) this.popup.closest('.banner__content').style.removeProperty('opacity', 1, 'important')
    if(this.popup.closest('.slider__grid')) {
      this.popup.closest('.slider__grid').style.overflowX = 'auto';
      this.popup.closest('.slider__grid').style.overflowY = 'hidden';
    }
    if(this.elements.body.className.includes('hidden')) {
      this.elements.body.classList.remove('hidden')
      document.dispatchEvent(new CustomEvent('body:visible'));
    }
    this.elements.filterGroups.forEach(item => {
      if (item.hasAttribute(open)) item.setAttribute('open')
    })
    document.dispatchEvent(new CustomEvent('dialog:after-hide'))
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalWindow extends HTMLElement {
  constructor() {
    super();

    this.querySelectorAll('[id^="ModalClose-"]').forEach(button => button.addEventListener(
      'click',
      this.hide.bind(this)
    ));
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target.nodeName === 'MODAL-DIALOG') this.hide();
      });
    }
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('hidden');
    this.setAttribute('open', '');
    if (this.querySelector('.product-popup-modal__content.popup-wrapper')) {
      this.querySelector('.product-popup-modal__content').classList.add('open')
      this.querySelector('.overlay').classList.add('open')
    }
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('hidden');
    document.dispatchEvent(new CustomEvent('body:visible'));
    this.removeAttribute('open');
    if (this.querySelector('.product-popup-modal__content.popup-wrapper')) {
      this.querySelector('.product-popup-modal__content').classList.remove('open')
      this.querySelector('.overlay').classList.remove('open')
    }
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-window', ModalWindow);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    this.button = this.querySelector('button');
    this.posX1 
    this.posInit 
    this.posX2
    this.posY1
    this.posY2 
    this.posInitY
    if (this.classList.contains('zoom-disabled')) return
    if (!this.button) return;
    this.button.addEventListener('mousedown', this.mouseDown.bind(this))
    this.button.addEventListener('mousemove', this.mouseMove.bind(this))
    this.button.addEventListener('mouseup', this.mouseUp.bind(this))
    document.addEventListener('shopify:section:load', () => {
      this.button = this.querySelector('button');
    })
  }

  getEvent (event) {
    return event.type.search('touch') !== -1 ? event.touches[0] : event;
  }

  mouseDown(event) {
    let evt = this.getEvent(event);
    this.posInit = this.posX1 = evt.clientX;
    this.posInitY = this.posY1 = evt.clientY
  }

  mouseMove() {
    let evt = this.getEvent(event)
    this.posX2 = this.posX1 - evt.clientX;
    this.posX1 = evt.clientX;
    this.posY2 = this.posY1 - evt.clientY;
    this.posY1 = evt.clientY;
  }

  mouseUp() {
    if ((Math.abs(this.posInit - this.posX1) - Math.abs(this.posInitY - this.posY1) > 5)) return
    const modal = document.querySelector(this.getAttribute('data-modal'));
    if (modal) modal.show(this.button);
  }
}
customElements.define('modal-opener', ModalOpener);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.thumbnails = this.querySelector('[id^="Slider-Thumbnails"]'),
    this.enableSliderLooping = false;
    this.pages = this.querySelector('.slider-counter')
    this.sliderViewport = this.querySelector('.slider__viewport')
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelectorAll('button[name="previous"]');
    this.nextButton = this.querySelectorAll('button[name="next"]');
    this.parentContainer = this.closest('section') || this
    this.posX1 
    this.posInit 
    this.posX2
    this.posY1
    this.posY2 
    this.posInitY
    this.widthItem
    this.gapValue
    this.fullWidthItem  
    this.isOnButtonClick = '0'
    this.disableSwipe = false
    this.linkElem
    
    if (!this.slider) return;
    this.sliderDataCount = this.slider.getAttribute('data-count')
    this.sliderMobileDataCount = this.slider.getAttribute('data-count-mobile')
    if (this.pages) {
      this.initPages();
      const resizeObserver = new ResizeObserver(entries => this.initPages());
      resizeObserver.observe(this.slider);
    }
    // If slider made up of section blocks, make selected block active in theme editor
    if(this.closest('.scroll-to-block') && Shopify.designMode) {
      document.addEventListener('shopify:block:select', (event) => {
        let activeBlock = event.target
        if(!this.querySelector(`#${activeBlock.getAttribute('id')}`)) return
        let activeSlide = this.slider.querySelector('.is-active')
        if(!activeSlide) return
        activeSlide.classList.remove('is-active')
        activeBlock.classList.add('is-active')
        let activeSlideIndex = Array.from(this.sliderItems).indexOf(activeBlock) 
        this.disableButtons()
        this.update()
        if(this.sliderItems[activeSlideIndex]) this.slider.scrollLeft = this.sliderItems[activeSlideIndex].offsetLeft
      })
    }
    
    if (this.prevButton || this.nextButton) {
      this.prevButton.forEach(button => button.addEventListener('click', this.onButtonClick.bind(this, 'previous', false)));
      this.nextButton.forEach(button => button.addEventListener('click', this.onButtonClick.bind(this, 'next', false)));
      this.disableButtons()
    }  
    this.resizeImage(this.slider.querySelector('.is-active'))
    window.addEventListener('resize', () => {
      this.resizeImage.bind(this, this.slider.querySelector('.is-active'))
      this.disableButtons()
    })
    document.addEventListener('shopify:section:load', this.resizeImage.bind(this, this.slider.querySelector('.is-active')))

    if (this.slider.classList.contains('recently-viewed')) {
      this.sliderItems[0].classList.add('is-active')
      let lastChildIndex = this.sliderItems.length - 1
      let dataCount = +this.slider.dataset.count
      let sliderContainer = this.closest('.slider-container-js')
      if (lastChildIndex + 1 >= dataCount) this.sliderItems[lastChildIndex].classList.add('last-desktop')
      if (sliderContainer.offsetWidth < 769) {
        dataCount = +this.slider.dataset.countMobile
        if (lastChildIndex + 1 >= dataCount) this.sliderItems[lastChildIndex].classList.add('last-mobile')
      }
    }
    // Check if slider could be a grid
    if (!this.slider.classList.contains('grid') && this.closest('.slider-container-js').offsetWidth > 768 && this.sliderItems.length > 1 || this.closest('.slider-container-js').offsetWidth <= 768 && this.sliderItems.length > 1) {
      if (!this.slider.classList.contains('thumbnail-list')) {
        this.activeSlide = this.slider.querySelector('.is-active')
        this.slider.addEventListener('scroll', () => {
          if (this.isOnButtonClick != 'onButtonClick') {
            if (this.slider.className.includes('disable-scroll')) return
            this.slider.querySelectorAll('.snap-align').forEach(item => item.classList.remove('is-active'))
            if (this.slider.closest('.product--side_thumbnails') || this.slider.closest('.product--thumbnails_below')) {
              let galleryThumb = this.slider.closest('.slider-block').querySelector('[id^="GalleryThumbnails-"]')
              galleryThumb.querySelectorAll('.snap-align').forEach(item => item.classList.remove('is-active'))
            }
            this.changeActiveSlideOnScroll()
          }
        })
      }
      if(this.sliderItems.length > this.sliderDataCount && this.parentContainer.getBoundingClientRect().width > 768 || this.sliderItems.length > this.sliderMobileDataCount && this.parentContainer.getBoundingClientRect().width <= 768 || this.sliderItems.length >= this.sliderDataCount && this.sliderDataCount == 5 && this.parentContainer.getBoundingClientRect().width <= 1024 && this.parentContainer.getBoundingClientRect().width > 768) {
        this.slider.addEventListener('mousedown', this.swipeStart.bind(this));  
        this.slider.addEventListener('mousemove', this.swipeAction.bind(this));
        this.slider.addEventListener('mouseup', this.swipeEnd.bind(this));
      }
    }
    this.slider.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ARROWRIGHT' || event.code.toUpperCase() === 'ARROWLEFT') {
        let activElem = document.activeElement
        this.activeSlide = this.slider.querySelector('.is-active')
        if(!activElem.closest('[id^="Slide-"]').classList.contains('is-active')) {
          if(this.activeSlide) this.activeSlide.classList.remove('is-active')
          activElem.classList.add('is-active')
          this.update()
          // Check if product gallery has thumbnails
          if(this.slider.closest('.product--side_thumbnails') || this.slider.closest('.product--thumbnails_below')) {
            this.scrollThumbnail()
          } 
        }
      }
    })
  }

  resizeImage(activeElem) {
    if(this.slider.classList.contains('slider-main--original')) {
      let height = activeElem.offsetHeight
      this.slider.style.height = height + 'px'
    }
    if(this.sliderItems.length > this.sliderDataCount && this.parentContainer.offsetWidth > 768 || this.sliderItems.length > this.sliderMobileDataCount && this.parentContainer.offsetWidth <= 768 || this.sliderItems.length >= this.sliderDataCount && this.sliderDataCount == 5 && this.parentContainer.offsetWidth <= 1024 && this.parentContainer.offsetWidth > 768) {
      this.disableSwipe = false
    } else {
      this.disableSwipe = true
    }
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor(this.slider.clientWidth / this.sliderItemOffset);
    this.totalPages = this.sliderItemsToShow.length
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    if (!this.pages) return
    const previousPage = this.currentPage;
    this.activeSlide = this.slider.querySelector('.is-active')
  
    let activeSlideIndex = Array.from(this.sliderItems).indexOf(this.activeSlide)

    if(this.activeSlide) this.currentPage = Math.round(this.activeSlide.offsetLeft / this.sliderItemOffset) + 1;
    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(new CustomEvent('slideChanged', { detail: {
        currentPage: this.currentPage,
        currentElement: this.sliderItemsToShow[this.currentPage - 1]
      }}));
    }
    
    if (this.prevButton && this.nextButton) {
      activeSlideIndex == 0 ? this.prevButton.forEach(button => button.setAttribute('disabled', 'disabled')) : this.prevButton.forEach(button => button.removeAttribute('disabled'))
      activeSlideIndex == this.totalPages - 1 ? this.nextButton.forEach(button => button.setAttribute('disabled', 'disabled')) : this.nextButton.forEach(button => button.removeAttribute('disabled'))
    }
  }

  disableButtons() {
    if (!this.prevButton || !this.nextButton) return
    this.activeSlide = this.slider.querySelector('.is-active')
    let activeSlideIndex = Array.from(this.sliderItems).indexOf(this.activeSlide)
    if(this.slider.closest('#cart-notification')) this.slider.setAttribute("data-count", "3")
    // dataCount - number of visible slides 
    let dataCount = +this.slider.dataset.count
    // If viewport width is lower than 1024px, five in a row slider becomes four in a row
    if (dataCount == 5 && this.closest('.slider-container-js').offsetWidth < 1025 ) dataCount = 4
    let sliderContainer
    !this.closest('.cart-drawer') && !this.closest('#cart-notification') ? sliderContainer = this.closest('.slider-container-js') : sliderContainer = document.querySelector('#body')
    // Change dataCount on mobile devices
    if (sliderContainer && sliderContainer.offsetWidth < 769) dataCount = +this.slider.dataset.countMobile
    let nextActiveSlide = dataCount
    activeSlideIndex > this.sliderItems.length - 1 - nextActiveSlide ? this.nextButton.forEach(button => button.setAttribute('disabled', 'disabled')) : this.nextButton.forEach(button => button.removeAttribute('disabled'))
    activeSlideIndex == 0 ? this.prevButton.forEach(button => button.setAttribute('disabled', 'disabled')) : this.prevButton.forEach(button => button.removeAttribute('disabled'))
  }

  scrollThumbnail() {
    this.activeSlide = this.slider.querySelector('.is-active')
    let activeSlideIndex = Array.from(this.sliderItems).indexOf(this.activeSlide)
    let galleryThumb = this.slider.closest('.slider-block').querySelector('[id^="GalleryThumbnails-"]')
    let sliderThumb = galleryThumb.querySelector('[id^="Slider-Thumbnails"]')
    let activeThumb = galleryThumb.querySelectorAll('[id^="Slide-"]')[activeSlideIndex]
    if(!activeThumb) return
    let prevActiveSlide = sliderThumb.querySelector('.is-active')
    if (prevActiveSlide) prevActiveSlide.classList.remove('is-active')  
    activeThumb.classList.add('is-active')
    // Check thumbnails gallery position   
    if (sliderThumb.classList.contains('thumbnail-list--column')) {
      sliderThumb.closest('.thumbnail-slider--column').scrollTo({
        top: activeThumb.offsetTop - activeThumb.offsetHeight - 8,
        behavior: 'smooth'
      })
    } else {
      sliderThumb.scrollTo({
        left: activeThumb.offsetLeft - activeThumb.offsetWidth - 8,
        behavior: 'smooth'
      })
    }
  }

  changeActiveSlideOnScroll() {
    window.pauseAllMedia()
    let sliderLeft = Math.round(this.sliderViewport.getBoundingClientRect().left)
    let sliderItemLeft 
    this.sliderItems.forEach((item) => {
      sliderItemLeft = Math.round(item.getBoundingClientRect().left)
      if (Math.abs(sliderLeft - sliderItemLeft) < 7) {
        item.classList.add('is-active')
      } else {
        if(this.closest('.advantages')) this.querySelectorAll('[id^="Slide-"]')[this.sliderItems.length - 2].classList.add('is-active')
      }
    })
    // Make the gallery flexible if media ratio is original
    if(this.slider.classList.contains('slider-main--original')) {
      let height = this.slider.querySelector('.is-active').offsetHeight
      setTimeout(() => this.slider.style.height = height + 'px', 100)
    }
    if(this.slider.closest('.product--side_thumbnails') || this.slider.closest('.product--thumbnails_below')) {
      this.scrollThumbnail()
    } 
    this.disableButtons()
    this.update() 
    this.activeSlide = this.slider.querySelector('.is-active')
    let activeSlideIndex = Array.from(this.sliderItems).indexOf(this.activeSlide)
    this.setActiveModel(activeSlideIndex)
  }

  setActiveModel(activeSlideIndex) {
    if (!this.classList.contains('slider-mobile-gutter')) return
    let activeMediaId
    if (this.sliderItems[activeSlideIndex]) activeMediaId = this.sliderItems[activeSlideIndex].dataset.productMediaId
    if (this.nextElementSibling && this.nextElementSibling.classList.contains('product__xr-button')) this.nextElementSibling.dataset.shopifyModel3dId = activeMediaId
  }

  onButtonClick(direction, nextActiveSlideSwipe) {
    window.pauseAllMedia()
      if (this.slider.classList.contains('thumbnail-list')) return
      this.activeSlide = this.slider.querySelector('.is-active')
      let activeSlideIndex = Array.from(this.sliderItems).indexOf(this.activeSlide)
      if (this.slider.closest('.product--side_thumbnails') || this.slider.closest('.product--thumbnails_below')) {
        let galleryThumb = this.slider.closest('.slider-block').querySelector('[id^="GalleryThumbnails-"]')
        let activeThumb = galleryThumb.querySelectorAll('[id^="Slide-"]')[activeSlideIndex]
        activeThumb.classList.remove('is-active')
      }
      if(this.slider.closest('#cart-notification')) this.slider.setAttribute("data-count", "3")
      let dataCount = +this.slider.dataset.count
      if (dataCount == 5 && this.closest('.slider-container-js').offsetWidth < 1025 ) dataCount = 4
      let sliderContainer
      !this.closest('.cart-drawer') && !this.closest('#cart-notification') ? sliderContainer = this.closest('.slider-container-js') : sliderContainer = document.querySelector('#body')
      if (sliderContainer.offsetWidth < 769) dataCount = +this.slider.dataset.countMobile
      let nextActiveSlide
      // Determine the step for changing the active slide
      nextActiveSlideSwipe ? nextActiveSlide = nextActiveSlideSwipe : nextActiveSlide = dataCount
      if (direction == 'next') {
        let sliderItemsLength = this.sliderItems.length - 1
        if(this.closest('.advantages') && window.innerWidth < 768 || this.closest('.testimonials')) sliderItemsLength = this.sliderItems.length
        // Restrict gallery scrolling at the end
        if (activeSlideIndex + nextActiveSlide > sliderItemsLength  - nextActiveSlide) {
          nextActiveSlideSwipe ? activeSlideIndex = sliderItemsLength - nextActiveSlide : activeSlideIndex = this.sliderItems.length - nextActiveSlide
        } else {
          activeSlideIndex = activeSlideIndex + nextActiveSlide
        }
        this.activeSlide.classList.remove('is-active')
        if(this.sliderItems[activeSlideIndex]) this.sliderItems[activeSlideIndex].classList.add('is-active')
        this.resizeImage(this.sliderItems[activeSlideIndex])
        if (this.classList.contains('slider--row') && this.parentElement.offsetWidth > 768) {
          setTimeout(() => {
            this.slider.scrollLeft = this.sliderItems[activeSlideIndex].offsetLeft - this.sliderItems[activeSlideIndex].offsetWidth
          }, 1)
        } else {
          setTimeout(() => {
             this.slider.scrollLeft = this.sliderItems[activeSlideIndex].offsetLeft
          }, 1)
        }
      }
      if (direction == 'previous') {   
        activeSlideIndex - nextActiveSlide < 0 ? activeSlideIndex = 0 : activeSlideIndex = activeSlideIndex - nextActiveSlide
        if(this.activeSlide) this.activeSlide.classList.remove('is-active')  
        this.sliderItems[activeSlideIndex].classList.add('is-active')
        this.resizeImage(this.sliderItems[activeSlideIndex])
        // Restrict gallery scrolling at the beginnig
        if (this.classList.contains('slider--row') && this.offsetWidth > 768) {
          this.slider.scrollLeft = this.sliderItems[activeSlideIndex].offsetLeft - this.sliderItems[activeSlideIndex].offsetWidth 
        } else {
          this.slider.scrollLeft = this.sliderItems[activeSlideIndex].offsetLeft
        }       
      }
      if(this.slider.closest('.product--side_thumbnails') || this.slider.closest('.product--thumbnails_below')) {
        this.scrollThumbnail()
      } 
      this.update()
      this.disableButtons()
      this.isOnButtonClick = 'onButtonClick'
      this.setActiveModel(activeSlideIndex)
      this.slider.addEventListener('wheel', () => this.isOnButtonClick = 0)
      this.slider.addEventListener('touchstart', () => this.isOnButtonClick = 0)
      this.slider.addEventListener('touchmove', () => this.isOnButtonClick = 0)
      this.slider.addEventListener('touchend', () => this.isOnButtonClick = 0)
  }

  getEvent (event) {
    return event.type.search('touch') !== -1 ? event.touches[0] : event;
  }

  swipeStart(event) {
    // if(!this.querySelector(`#${event.target.closest('.slider__grid').getAttribute('id')}`)) return
    if (event.target.closest('.slider__grid').getAttribute('id') != this.slider.getAttribute('id')) return
    if(this.disableSwipe) return
    if (event.target.closest('.card__extras') || event.target.closest('.only-mobile-slider') && this.closest('section').offsetWidth > 768) return
    if(event.button == 2) return
    event.preventDefault()
    if(event.target.closest('.thumbnail-slider') || event.target.classList.contains('3d-model')) return
    this.slider.style.userSelect = 'none'
    this.slider.style.cursor = 'grab'
   
    setTimeout(() => {
      this.sliderItems.forEach(item => {
        if (item.querySelector('a.card-js')) item.querySelector('a.card-js').style.pointerEvents = 'none'
      }, 20)
    })
    this.sliderItems.forEach(item => {
      item.querySelector('.card-js') ? item.querySelector('.card-js').style.cursor = 'grab' : item.closest('.card-js').style.cursor = 'grab'
    })
    let evt = this.getEvent(event);
    this.posInit = this.posX1 = evt.clientX;
    this.posInitY = this.posY1 = evt.clientY
    this.widthItem = +this.sliderItems[0].offsetWidth
    this.gapValue = +window.getComputedStyle(this.slider).getPropertyValue("gap").slice(0, -2)
    this.fullWidthItem = this.widthItem + this.gapValue
  }

  swipeAction(event) {
    if (event.target.closest('.slider__grid').getAttribute('id') != this.slider.getAttribute('id')) return
    if(this.slider.classList.contains('disable-scroll')) this.slider.classList.remove('disable-scroll')
    if(event.target.closest('.thumbnail-slider')) return
    let evt = this.getEvent(event)
    this.posX2 = this.posX1 - evt.clientX;
    this.posX1 = evt.clientX;
    this.posY2 = this.posY1 - evt.clientY;
    this.posY1 = evt.clientY;
  }

  swipeEnd(event) {
    if (event.target.closest('.slider__grid').getAttribute('id') != this.slider.getAttribute('id')) return
    if(this.disableSwipe) return
    if(event.target.closest('.thumbnail-slider') || event.target.classList.contains('3d-model')) return
    if (event.target.closest('.color-swatch')) return
    // Return default cursor value
    this.slider.style.userSelect = 'auto'
    this.slider.style.cursor = 'default'
    let parentOrChild
    this.sliderItems.forEach(item => {
      item.querySelector('.card-js') ? parentOrChild = item.querySelector('.card-js') : parentOrChild = item.closest('.card-js')
      parentOrChild.style.cursor = 'pointer'
      if (item.querySelector('.product-labels__item')) item.querySelector('.product-labels__item').style.cursor = 'auto'
      parentOrChild.style.pointerEvents = 'auto'
      if (item.querySelector('.testimonials_card')) item.querySelector('.testimonials_card').style.cursor = 'auto'
      if(item.closest('.logo-slider') || item.closest('.banner-gallery')) {
        parentOrChild.style.cursor = 'default'
        if(item.querySelector('a.card-js')) item.querySelector('a.card-js').style.cursor = 'pointer'
      }
    })
    // Check right click
    if(event.button == 2) return
    if (event.target.closest('.card__extras') || event.target.closest('.only-mobile-slider') && this.closest('section').offsetWidth > 768) return
    // Check if swipe was horizontal or vertical
    let isHorizontalSwipe = Math.abs(this.posInit - this.posX1) > Math.abs(this.posInitY - this.posY1)
    let horizontalSwipeIsOk = Math.abs(this.posInit - this.posX1) > 50
    let swipeVertical = Math.abs(this.posInitY - this.posY1) > 20
    let swipeHorizontal = Math.abs(this.posInit - this.posX1) > 20
    if(!swipeHorizontal && !swipeVertical) {
      if(event.target.closest('a')) {
        this.linkElem = event.target.closest('a')
      } 
      else {
        if(event.target == this.slider || event.target == this.sliderViewport || event.target == this) return;
        if(event.target.querySelector('a') && !event.target.querySelector('a').closest('.richtext')) this.linkElem = event.target.querySelector('a')
      }
      if(this.linkElem) this.linkElem.hasAttribute('target') && !Shopify.designMode ? window.open(this.linkElem.href, '_blank') : location.href = this.linkElem.href
    }
    this.slider.removeEventListener('mousemove', this.swipeAction.bind(this));
    this.slider.removeEventListener('mouseup', this.swipeEnd.bind(this));
    if (!isHorizontalSwipe || !horizontalSwipeIsOk) return
    // Check slider direction
    let posFinal = this.posInit - this.posX1;
    let direction = 'next'
    posFinal > 0 ? direction = 'next' : direction = 'previous'
    // nextActiveSlideSwipe variable determines how many slides the galery will scroll through
    let nextActiveSlideSwipe = 0 // The step between active slide could be equal to the number of slides in visible area, so the variable = 0
    if(!this.slider.closest('.slider-block')) if(Math.abs(posFinal) < this.fullWidthItem) nextActiveSlideSwipe = 1
    this.onButtonClick(direction, nextActiveSlideSwipe)
  }
}
customElements.define('slider-component', SliderComponent);

class AddToCart extends HTMLElement {
  constructor() {
    super();
    if (this.classList.contains('cart-drawer')) this.miniCart = document.querySelector('cart-drawer');
    if (this.classList.contains('cart-notification')) this.miniCart = document.querySelector('cart-notification');
   
    this.addEventListener('click', (event) => {
      event.preventDefault()
      if (this.querySelector('button[disabled]')) return
      this.onClickHandler(this)
    }) 
  }

  onClickHandler() {
    const variantId = this.dataset.variantId;

    if (variantId) {
      if (document.body.classList.contains('template-cart') ) {
        Shopify.postLink(window.routes.cart_add_url, {
          parameters: {
            id: variantId,
            quantity: 1
          },
        });
        return;
      }

      this.setAttribute('disabled', true);
      this.classList.add('loading');
      const sections = this.miniCart ? this.miniCart.getSectionsToRender().map((section) => section.id) : this.getSectionsToRender().map((section) => section.id);

      const body = JSON.stringify({
        id: variantId,
        quantity: 1,
        sections: sections,
        sections_url: window.location.pathname
      });

      fetch(`${window.routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
        .then((response) => response.json())
        .then((parsedState) => {
          if (parsedState.status === 422) {
             document.dispatchEvent(new CustomEvent('ajaxProduct:error', {
                detail: {
                  errorMessage: parsedState.description
                }
              }));
           }
           else {
            this.miniCart && this.miniCart.renderContents(parsedState);
            this.renderContents(parsedState)
             document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
              detail: {
                product: parsedState
              }
            }));
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.classList.remove('loading');
          this.removeAttribute('disabled');
        });
    }
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
  renderContents(parsedState) {
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      const sectionElements = document.querySelectorAll(section.selector);
      if(sectionElements) {
        Array.from(sectionElements).forEach(sectionElement => {
          sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        })
      } 
    }));
  }
  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }
}
customElements.define('add-to-cart', AddToCart);

// This script works both for Slideshow section and for Anouncement bar
class SlideshowComponent extends HTMLElement {
  constructor() {
    super();
      this.debug = false;
      
          this.slideshow = this.querySelector('.slideshow__slider');
          this.fade = this.slideshow.classList.contains("animation-fade") ? true : false;
          this.data = this.slideshow.dataset;
          this.time = 500;
          this.posX1 
          this.posInit 
          this.posX2
          this.posY1
          this.posY2 
          this.posInitY
          this.swipeVertical
          this.swipeHorizontal
          this.init(this.slideshow.querySelector(".slideshow__slide:nth-child("+(this.data.start? this.data.start : 1)+")"));
  
          if (Shopify.designMode) {
            document.addEventListener('shopify:section:load', (event) => {
              if (event.target.closest('.slideshow-section')) {
                this.init(this.slideshow.querySelector(".slideshow__slide:nth-child("+(this.data.start? this.data.start : 1)+")"))
              }
            })
            document.addEventListener('shopify:section:reorder', () => {
              this.init(this.slideshow.querySelector(".slideshow__slide:nth-child("+(this.data.start? this.data.start : 1)+")"))
            })
            document.addEventListener('shopify:block:select', (event) => {
              this.slideshow.querySelectorAll('.slideshow__slide').forEach(slide => {
                if (event.target.getAttribute('id') == slide.getAttribute('id')) this.init(slide)
              } )        
            })
          }
          
          this.controls = {
            "buttonNext": this.querySelector('.slideshow__controls--next'),
            "buttonPrev": this.querySelector('.slideshow__controls--prev'),
            "currentSlideNumber": this.querySelector('.slideshow__controls-current'),
            "slides": this.querySelectorAll('.slideshow__slide')
          };
          if (this.controls.buttonNext || this.controls.buttonPrev) {
            this.controls.buttonNext.addEventListener('click', () => {
              this.next('next')
              this.autoplay = this.data.autoplay ? this.data.autoplay : false
              if(this.autoplay) {
                this.stopAutoplay();
                this.start()
              }
            })
            this.controls.buttonPrev.addEventListener('click', () => {
              this.prev('prev')
              this.autoplay = this.data.autoplay ? this.data.autoplay : false
              if(this.autoplay) {
                this.stopAutoplay();
                this.start()
              }
            })
          }

          if (!this.data.autoplay) return
          this.querySelectorAll('.slideshow__content-js').forEach(content => {
            content.addEventListener('mouseenter', this.stopAutoplay.bind(this))
            content.addEventListener('mouseleave', this.start.bind(this))
          })
          if (this.controls.buttonNext || this.controls.buttonPrev) {
            this.controls.buttonNext.addEventListener('mouseenter', this.stopAutoplay.bind(this))
            this.controls.buttonPrev.addEventListener('mouseenter', this.stopAutoplay.bind(this))
          }
  }

  init(element) {   
      this.slideshow.querySelectorAll(".slideshow__slide").forEach(slide => {
        slide.classList.remove('loaded')
        slide.classList.remove('current')
      })
      this.current = {
          "int": this.data.start? parseInt(this.data.start) : 1,
          "element": element
      }
      if (this.current.element && this.current.element.classList){ 
          this.current.element.classList.add("current");
      }
      
      this.length = parseInt(this.slideshow.querySelectorAll(".slideshow__slide").length);

      this.autoplay = this.data.autoplay ? this.data.autoplay : false;
      this.timeout = null;
      if(this.autoplay) this.start();
      this.refreshControls()
      this.classList.add("slideshow-initialized");
  }

  prev(useAnimation = true){ 
    this.slideshow.querySelectorAll('.slideshow__slide').forEach(slide => slide.classList.remove('prev'))
      var temp = this.slideshow.querySelector(".slideshow__slide:nth-child("+(this.current.int - 1)+")")
      if(temp){
        var prev = {
          "int": this.current.int - 1,
          "element": temp
        }
      } 
      else {
        var prev = {
          "int": this.length,
          "element": this.slideshow.querySelector(".slideshow__slide:nth-child("+(this.length)+")")
        }
      }

      this.setPosition(prev, 'prev', useAnimation)
      this.refreshControls()
  }

  next(useAnimation = true){  
      var temp = this.slideshow.querySelector(".slideshow__slide:nth-child("+(this.current.int + 1)+")")
      if(temp)
          var next = {
              "int": this.current.int + 1,
              "element": temp
          }
      else
          var next = {
              "int": 1,
              "element": this.slideshow.querySelector(".slideshow__slide:nth-child(1)")
          }
      this.setPosition(next, 'next', useAnimation);
      this.refreshControls()
  }

  set(index, useAnimation = true){
      index = parseInt(index)
      var temp = this.slideshow.querySelector(`.slideshow__slide:nth-child(${index})`)
      if(temp){
          if(this.autoplay){
              this.stopAutoplay();
          }
          this.autoplay = false;
          this.setPosition({
              "int": index,
              "element": temp
          }, useAnimation);
      }
  }

  setPosition(to, direction){
    if(this.current.int != to.int) {
        this.stop();
        var after = function () {
          let arr = Array.from(this.slideshow.querySelectorAll('.slideshow__slide'))
            this.current.element.classList.remove("current");
            arr.forEach(slide => {
              slide.classList.add('animate')
              slide.classList.remove('prev', `direction-${direction}`)
            })
            if (this.current.element.querySelector(".slide-content.slide-background>img")) {
                this.current.element.querySelector(".slide-content.slide-background>img").style.removeProperty("transform");
            }
            to.element.classList.add("current");
            this.current = to;

            if (this.querySelectorAll('.slideshow__button a').length > 0) this.querySelectorAll('.slideshow__button a').forEach(button => {
              button.closest('.current') ? button.setAttribute('tabindex', '0') : button.setAttribute('tabindex', '-1')
            })
            this.currentElementIndex = arr.indexOf(this.current.element)
            
            if (direction == 'next') {
              this.current.element.classList.add(`direction-${direction}`)
              if (this.currentElementIndex > 0) {
                this.prevElement = arr[this.currentElementIndex - 1]
                this.prevElement.classList.add(`direction-${direction}`)
              } else {
                this.prevElement = arr[arr.length - 1]
                this.prevElement.classList.add(`direction-${direction}`)
              }
            } else {
              this.current.element.classList.add(`direction-${direction}`)
              if (this.currentElementIndex == arr.length - 1) {
                this.prevElement = arr[0]
                this.prevElement.classList.add(`direction-${direction}`)
              } else {
                this.prevElement = arr[this.currentElementIndex + 1]
                this.prevElement.classList.add(`direction-${direction}`)
              }
            }
            if (this.slideshow.classList.contains('text-blocks')) this.slideshow.style.left = `calc(-100% * ${this.currentElementIndex})`
            if (this.prevElement.classList) this.prevElement.classList.add('prev')
            if(this.autoplay) this.start();
            this.lock = false;
            this.refreshControls()
        }.bind(this);
        after()
      }
  }

  start() {
      this.autoplay = this.data.autoplay ? this.data.autoplay : false;

      this.slideshow.classList.add("slideshow-playing");
      this.slideshow.classList.remove("slideshow-stopped");
      
      this.timeout = setTimeout(this.next.bind(this), this.autoplay);
      
  } 
  stop() {
      clearTimeout(this.timeout);
  }
  stopAutoplay(){
      if(this.slideshow.classList.contains("slideshow-playing")){
          this.slideshow.classList.add("slideshow-stopped");
          this.slideshow.classList.remove("slideshow-playing");
      }
      this.stop();
  }

  changeSlide(direction) {
    if (direction == 'next') {
      this.currentSlide = this.querySelector('.slideshow__slide.current')
      let index = Array.from(this.controls.slides).indexOf(this.currentSlide) + 1
  
      if (index < this.controls.slides.length) {
        this.set((index + 1));
        this.start();
      }
      else {
        this.set((1));
        this.start();
      }
      this.refreshControls()
    }
    if (direction == 'prev') {
      this.currentSlide = this.querySelector('.slideshow__slide.current')
      let index = Array.from(this.controls.slides).indexOf(this.currentSlide) + 1
  
      this.set((index + 1));
      if (index > 1) {
        this.set((index - 1));
        this.start();
      }
      else {
        this.set((this.controls.slides.length));
        this.start();
      }
      this.refreshControls()
    }
  }

  refreshControls() {
    this.currentSlide = this.querySelector('.slideshow__slide.current')
    this.currentSlideNumber = this.querySelector('.slideshow__controls-current')
    if (!this.currentSlideNumber) return
    this.currentSlideNumber.innerHTML = this.currentSlide.dataset.position
  }

  touchStart(event) {
    if (event.target.closest('.slideshow__controls--prev') || event.target.closest('.slideshow__controls--next')) return
    let evt = event.changedTouches[0];
    this.posInit = this.posX1 = evt.clientX;
    this.posInitY = this.posY1 = evt.clientY
  }

  touchMove(event) {
    if (event.target.closest('.slideshow__controls')) return
    let evt = event.changedTouches[0];
    this.posX2 = this.posX1 - evt.clientX;
    this.posX1 = evt.clientX;
    this.posY2 = this.posY1 - evt.clientY;
    this.posY1 = evt.clientY;
    // this.rads = Math.atan(this.posY2/this.posX2)
    // this.deg = Math.abs(this.rads * (180/3.14))
  }

  touchEnd(event) {
    if (event.target.closest('.slideshow__controls--prev') || event.target.closest('.slideshow__controls--next')) return
    let isHorizontalSwipe = Math.abs(this.posInit - this.posX1) > Math.abs(this.posInitY - this.posY1)
    let horizontalSwipeIsOk = Math.abs(this.posInit - this.posX1) > 50
    let swipeVertical = Math.abs(this.posInitY - this.posY1) > 80
    let swipeHorizontal = Math.abs(this.posInit - this.posX1) > 60
    if (isHorizontalSwipe && horizontalSwipeIsOk) {
      this.slideshow.removeEventListener('touchmove', this.touchMove.bind(this));
      this.slideshow.removeEventListener('touchend', this.touchEnd.bind(this));
      let posFinal = this.posInit - this.posX1;
      let direction = 'next'
      posFinal > 0 ? direction = 'next' : direction = 'previous'
      if (direction == 'next') {
        this.next('next')
        this.autoplay = this.data.autoplay ? this.data.autoplay : false
        if(this.autoplay) {
          this.stopAutoplay();
          this.start()
        }
      }
      if (direction == 'previous') {
        this.prev('prev')
        this.autoplay = this.data.autoplay ? this.data.autoplay : false
        if(this.autoplay) {
          this.stopAutoplay();
          this.start()
        }
      }
    }
  }
}
customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange() {
    const loader = document.querySelector('.product-form__submit .loading-overlay__spinner').innerHTML
    const addButton = document.querySelector('.product-form__submit[name="add"]');
    addButton.innerHTML = `<div class="loading-overlay__spinner">${loader}</div>`
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.updateVariantStatuses();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
    document.dispatchEvent(new CustomEvent('variant:change', {
      detail: {
        variant: this.currentVariant
      }
    }))
  }

  updateOptions() {

  this.options = []
  this.querySelectorAll('.product-form__input').forEach(optionSelect => {
    if (optionSelect.querySelector('select')) {
      let select = optionSelect.querySelector('select')
      let selectedValue = select.value
      this.options.push(selectedValue)
    } else {
      let radio = optionSelect.querySelector('input[type="radio"]:checked')
      let selectedValue = radio.value
      this.options.push(selectedValue)
    }
  })
  return this.options
  
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options.map((option, index) => {
         return this.options[index] === option;
        }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGallery = document.getElementById(`MediaGallery-${this.dataset.section}`);
    mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
  
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(variant => this.querySelector(':checked').value === variant.option1);
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')]
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue)
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach(input => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        
        input.closest('select') ? input.innerText = input.getAttribute('value') : input.classList.remove('disabled')
      } else {
        input.closest('select') ? input.innerText = window.variantStrings.unavailable_with_option.replace('[value]', input.getAttribute('value')) : input.classList.add('disabled')
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
      fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        this.updateSKU(responseText);
        this.updatePrice(responseText);
        this.updatePriceAlt(responseText);
        this.updateColorName(responseText);
        this.updateInventoryStatus(responseText);
        if (this.currentVariant) this.toggleAddButton(!this.currentVariant.available, variantStrings.soldOut);
        publish(PUB_SUB_EVENTS.variantChange, {data: {
          sectionId: this.dataset.section,
          html: new DOMParser().parseFromString(responseText, 'text/html'),
          variant: this.currentVariant
        }})
      })
      .catch((e) => {
        console.error(e);
      });
  }

  updateSKU(responseText) {
    const id = `sku-${this.dataset.section}`;
    const html = new DOMParser().parseFromString(responseText, 'text/html')
    const destination = document.getElementById(id);
    const source = html.getElementById(id);

    if (source && destination) destination.innerHTML = source.innerHTML;
    if (destination) destination.classList.remove('visually-hidden');
    if (!source && destination) destination.classList.add('visually-hidden')
  }

  updatePrice(responseText) {
    const id = `price-${this.dataset.section}`;
    const html = new DOMParser().parseFromString(responseText, 'text/html')
    const destination = document.getElementById(id);
    const source = html.getElementById(id);

    if (source && destination) destination.innerHTML = source.innerHTML;
    if (destination) destination.classList.remove('visually-hidden');
  }

  updatePriceAlt(responseText) {
    const id = `price-${this.dataset.section}--alt`;
    const html = new DOMParser().parseFromString(responseText, 'text/html')
    const destination = document.getElementById(id);
    const source = html.getElementById(id);

    if (source && destination) destination.innerHTML = source.innerHTML;
    if (destination) destination.classList.remove('visually-hidden');
  }

  updateColorName(responseText) {
    const id = `color-${this.dataset.section}`;
    const html = new DOMParser().parseFromString(responseText, 'text/html')
    const destination = document.getElementById(id);
    const source = html.getElementById(id);

    if (source && destination) destination.innerHTML = source.innerHTML;
    if (destination) destination.classList.remove('visually-hidden');
  }

  updateInventoryStatus(responseText) {
    const id = `inventory-${this.dataset.section}`;
    const html = new DOMParser().parseFromString(responseText, 'text/html')
    const destination = document.getElementById(id);
    const source = html.getElementById(id);

    if (source && destination) destination.innerHTML = source.innerHTML;
    if (destination) destination.classList.remove('visually-hidden');
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-${this.dataset.section}--alt`);
    const loader = document.querySelector('.loading-overlay__spinner').innerHTML
    productForms.forEach((productForm) => {
      const addButton = productForm.querySelector('[name="add"]');
      
      if (!addButton) return;
      if (disable) {
        addButton.setAttribute('disabled', true);
        if (text) addButton.innerHTML = `<span>${text}</span> <div class="loading-overlay__spinner hidden">${loader}</div>`;
      }
      else {
        addButton.removeAttribute('disabled');
        addButton.innerHTML = addButton.dataset.preOrder === 'true' ? `<span>${variantStrings.preOrder}</span> <div class="loading-overlay__spinner hidden">${loader}</div>` : `<span>${variantStrings.addToCart}</span> <div class="loading-overlay__spinner hidden">${loader}</div>`;
      }

      if (!modifyClass) return;
    });
  }

  setUnavailable() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-${this.dataset.section}--alt`);
    const loader = document.querySelector('.loading-overlay__spinner').innerHTML
    productForms.forEach((productForm) => {
      const addButton = productForm.querySelector('[name="add"]');
      if (!addButton) return;
      addButton.innerHTML = `<span>${variantStrings.unavailable}</span>  <div class="loading-overlay__spinner hidden">${loader}</div>`;

      const price = document.getElementById(`price-${this.dataset.section}`);
      if (price) price.classList.add('visually-hidden');

      const priceAlt = document.getElementById(`price-${this.dataset.section}--alt`);
      if (priceAlt) priceAlt.classList.add('visually-hidden');

      const inventory = document.getElementById(`inventory-${this.dataset.section}`);
      if (inventory) inventory.classList.add('visually-hidden');

      const sku = document.getElementById(`sku-${this.dataset.section}`);
      if (sku) sku.classList.add('visually-hidden');
    });
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}
customElements.define('variant-selects', VariantSelects);

class ProgressBar extends HTMLElement {
  constructor() {
    super();

    theme.initWhenVisible({
      element: this,
      callback: this.init.bind(this),
      threshold: 0
    });
  }

  init() {
    setTimeout(() => {
      const quantity = parseInt(this.dataset.quantity);
      const totalQuantity = parseInt(this.dataset.total);
      this.style.setProperty('--progress-bar-width', `${quantity / totalQuantity * 100}%`);
    }, 300);
  }
}
customElements.define('progress-bar', ProgressBar);

class AccordionBlock extends HTMLElement {
  constructor() {
    super();
    this.item = this.querySelector('.accordion-toggle')
    this.panel = this.querySelector('.accordion__panel')
    this.links = this.panel.querySelectorAll('a')
    this.textareas = this.panel.querySelectorAll('textarea')
    this.inputs = this.panel.querySelectorAll('input')
    this.selects = this.panel.querySelectorAll('select')
    this.buttons = this.panel.querySelectorAll('button')
    this.panelHeight
    this.item.addEventListener('mousedown', () => this.item.closest('body').classList.add('no-user-select'))
    this.item.addEventListener('mouseup', () => this.item.closest('body').classList.remove('no-user-select'))
    if (!this.item.classList.contains('is-open')) this.blurElements()
    if(this.closest('.snippet-facets--horizontal')) {
      document.addEventListener('click', (event) => {
        if (!event.target.closest('.accordion-toggle') && this.item.classList.contains('is-open')) this.item.classList.remove('is-open')
      })
    }

    if (this.item.classList.contains('js-filter')) {
      document.addEventListener('filters:rerendered', ()=> {
        if(this.closest('.snippet-facets--horizontal')) return
        let filters = this.querySelectorAll('.accordion-toggle')
        filters.forEach((filter) => {
          this.panel = filter.querySelector('.accordion__panel')
          this.panel.style.transitionDuration = '0s'
          !filter.classList.contains('is-open') ? this.panel.style.maxHeight = null : this.panel.style.maxHeight = this.panel.scrollHeight + "px"
          setTimeout(() => {this.panel.style.transitionDuration = '0.3s'}, 100)
        })
      })
      this.item.addEventListener('click', (event) => {
        this.panel = this.querySelector('.accordion__panel')
        if(this.closest('.snippet-facets--horizontal')) {
          let facets = this.closest('.snippet-facets--horizontal')
          facets.querySelectorAll('.accordion-toggle').forEach(item => {
            if(item.classList.contains('is-open') && event.target.closest('.accordion-toggle') != item) item.classList.remove('is-open')
          })
        }
        if (!event.target.closest('.mobile-facets__summary')) return
        this.item.classList.toggle('is-open')
        if(this.closest('.snippet-facets--horizontal')) return
        this.panelHeight = this.panel.scrollHeight + "px"
        
        this.panel.style.setProperty('--max-height', `${this.panelHeight}`)
        !this.item.classList.contains('is-open') ? this.panel.style.maxHeight = null : this.panel.style.maxHeight = this.panelHeight
        this.item.classList.contains('is-open') ? this.focusElements() : this.blurElements()
      })
      this.item.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'ENTER') {
          this.panel = this.querySelector('.accordion__panel')
          if(this.closest('.snippet-facets--horizontal')) {
            let facets = this.closest('.snippet-facets--horizontal')
            facets.querySelectorAll('.accordion-toggle').forEach(item => {
              if(item.classList.contains('is-open') && event.target.closest('.accordion-toggle') != item) item.classList.remove('is-open')
            })
          }
          if (event.target.closest('.accordion__panel')) return
          this.item.classList.toggle('is-open')
          if(this.closest('.snippet-facets--horizontal')) return
          this.panelHeight = this.panel.scrollHeight + "px"
          this.panel.style.setProperty('--max-height', `${this.panelHeight}`)
          !this.item.classList.contains('is-open') ? this.panel.style.maxHeight = null : this.panel.style.maxHeight = this.panelHeight
        }
        if (event.code.toUpperCase() === 'ESCAPE') {
          this.item.classList.remove('is-open')
          this.panel.style.maxHeight = null
        }
        this.item.classList.contains('is-open') ? this.focusElements() : this.blurElements()
      })
    } 
    else {
      this.item.querySelector('.accordion__summary > input[type="checkbox"]') ? this.accordionButton = this.item.querySelector('.accordion__summary > input[type="checkbox"]') : this.accordionButton = this.item.querySelector('.accordion__summary')
      if(this.item.className.includes('not_collapsible')) return
      this.accordionButton.addEventListener('click', (event) => {
        !this.item.className.includes('is-open') ? this.item.classList.add('is-open') : this.item.classList.remove('is-open')
        this.panel.style.maxHeight ? this.panel.style.maxHeight = null : this.panel.style.maxHeight = this.panel.scrollHeight + "px"
        this.item.classList.contains('is-open') ? this.focusElements() : this.blurElements()
      })
      this.accordionButton.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'ENTER') {
          !this.item.className.includes('is-open') ? this.item.classList.add('is-open') : this.item.classList.remove('is-open')
          this.panel.style.maxHeight ? this.panel.style.maxHeight = null : this.panel.style.maxHeight = this.panel.scrollHeight + "px"
        }
        if (event.code.toUpperCase() === 'ESCAPE') {
          this.item.classList.remove('is-open')
          this.panel.style.maxHeight = null
        }
        this.item.classList.contains('is-open') ? this.focusElements() : this.blurElements()
      })
    }
  }

  blurElements() {
    this.links.forEach(link => link.setAttribute('tabindex', '-1'))
    this.textareas.forEach(textarea => textarea.setAttribute('tabindex', '-1'))
    this.inputs.forEach(input => input.setAttribute('tabindex', '-1'))
    this.selects.forEach(select => select.setAttribute('tabindex', '-1'))
    this.buttons.forEach(button => button.setAttribute('tabindex', '-1'))
  }
  focusElements() {
    this.links.forEach(link => link.setAttribute('tabindex', '0'))
    this.inputs.forEach(input => input.setAttribute('tabindex', '0'))
    this.selects.forEach(select => select.setAttribute('tabindex', '0'))
    this.buttons.forEach(button => button.setAttribute('tabindex', '0'))
  }
}
customElements.define('accordion-block', AccordionBlock);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (!this.querySelector('slideshow-component') && this.classList.contains('complementary-products')) {
            this.remove();
          }

          if (html.querySelector('.grid__item')) {
            this.classList.add('product-recommendations--loaded');
          }
        })
        .catch(e => {
          console.error(e);
        });
    }

    new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
  }
}
customElements.define('product-recommendations', ProductRecommendations);

class ComplementaryProducts extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.prevButton = this.querySelectorAll('button[name="previous"]');
    this.nextButton = this.querySelectorAll('button[name="next"]');

    if (this.prevButton || this.nextButton) {
      this.prevButton.forEach(button => button.addEventListener('click', this.onButtonClick.bind(this, 'previous')));
      this.nextButton.forEach(button => button.addEventListener('click', this.onButtonClick.bind(this, 'next')));
      this.disableButtons()
    }  
  }
  disableButtons() {
    if (!this.prevButton || !this.nextButton) return
    this.activeSlide = this.querySelector('.is-active')
    let activeSlideIndex = Array.from(this.sliderItems).indexOf(this.activeSlide)
    let nextActiveSlide = 1
    activeSlideIndex > this.sliderItems.length - 1 - nextActiveSlide ? this.nextButton.forEach(button => button.setAttribute('disabled', 'disabled')) : this.nextButton.forEach(button => button.removeAttribute('disabled'))
    activeSlideIndex == 0 ? this.prevButton.forEach(button => button.setAttribute('disabled', 'disabled')) : this.prevButton.forEach(button => button.removeAttribute('disabled'))
  }

  onButtonClick(direction) {
      this.activeSlide = this.slider.querySelector('.is-active')
      let activeSlideIndex = Array.from(this.sliderItems).indexOf(this.activeSlide)
      let dataCount = 1
      let nextActiveSlide
      nextActiveSlide = dataCount
      if (direction == 'next') {
        let sliderItemsLength = this.sliderItems.length - 1
        activeSlideIndex + nextActiveSlide > sliderItemsLength ? activeSlideIndex = this.sliderItems.length - nextActiveSlide : activeSlideIndex = activeSlideIndex + nextActiveSlide
        this.activeSlide.classList.remove('is-active')
        if(this.sliderItems[activeSlideIndex]) this.sliderItems[activeSlideIndex].classList.add('is-active')
      }
      if (direction == 'previous') {   
        activeSlideIndex - nextActiveSlide < 0 ? activeSlideIndex = 0 : activeSlideIndex = activeSlideIndex - nextActiveSlide
        if(this.activeSlide) this.activeSlide.classList.remove('is-active')  
        this.sliderItems[activeSlideIndex].classList.add('is-active')
      }
      this.disableButtons()
  }
}
customElements.define('complementary-products', ComplementaryProducts);

class ProductRecentlyViewed extends HTMLElement {
  constructor() {
    super();
    
    // Save the product ID in local storage to be eventually used for recently viewed section
    if (isStorageSupported('local')) {
      const productId = parseInt(this.dataset.productId);
      const cookieName = 'avante-theme:recently-viewed';
      const items = JSON.parse(window.localStorage.getItem(cookieName) || '[]');

      // Check if the current product already exists, and if it does not, add it at the start
      if (!items.includes(productId)) {
        items.unshift(productId);
      }

      // By keeping only the 10 most recent
      window.localStorage.setItem(cookieName, JSON.stringify(items.slice(0, 10)));
    }
  }
}
customElements.define('product-recently-viewed', ProductRecentlyViewed);

class RecentlyViewedProducts extends HTMLElement {
  constructor() {
    super();

    theme.initWhenVisible({
      element: this,
      callback: this.init.bind(this),
      threshold: 600
    });
  }

  init() {
    fetch(this.dataset.url + this.getQueryString())
      .then(response => response.text())
      .then(text => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector('recently-viewed-products');
        if (recommendations && recommendations.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        }
      })
      .catch(e => {
        console.error(e);
      });
  }

  getQueryString() {
    const cookieName = 'avante-theme:recently-viewed';
    let items = JSON.parse(window.localStorage.getItem(cookieName) || "[]");
    items = items.filter(item => item != null)
    if (this.dataset.productId && items.includes(parseInt(this.dataset.productId))) {
      items.splice(items.indexOf(parseInt(this.dataset.productId)), 1);
    }
    return items.map((item) => "id:" + item).slice(0, 10).join(" OR ");
  }
}
customElements.define('recently-viewed-products', RecentlyViewedProducts);

class VideoSection extends HTMLElement {
  constructor() {
    super();

    this.background = this.dataset.initMode !== 'template';
    this.popup = this.closest('modal-dialog')
    if(this.popup) {
      this.buttonClose = this.popup.querySelector('.close-popup')
      this.overlay = this.popup.querySelector('.overlay')
      this.openPopup = this.popup.querySelector('.open-popup')
      this.bannersWrapper = this.openPopup.closest('.banner__wrapper')
      this.videoButton = this.openPopup.closest('.video-button-block')
      this.buttonClose.addEventListener('click', () => { 
        this.player.pauseVideo()
        this.hiddenVideoPopup()
      })
      this.buttonClose.addEventListener('keydown', (event) => { 
        if (event.code.toUpperCase() === 'ENTER') {
          this.player.pauseVideo()
          this.hiddenVideoPopup()
        }
      })
      this.overlay.addEventListener('click', () => {
        this.player.pauseVideo()
        this.hiddenVideoPopup()
      })
      this.openPopup.addEventListener('click', () => {
        this.visuallyVideoPopup()
        if(this.player) this.player.playVideo()
      })
      this.openPopup.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'ENTER') {
          this.visuallyVideoPopup()
          if(this.player) this.player.playVideo()
        }
      });
      document.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'ESCAPE' && this.player) {
          this.player.pauseVideo()
          this.hiddenVideoPopup()
        }
      })
    }

    if (this.background) {
      theme.initWhenVisible({
        element: this,
        callback: this.init.bind(this),
        threshold: 600
      });
    }
    else {
      this.init();
    }
  }

  hiddenVideoPopup() {
    if(this.bannersWrapper) {
      this.bannersWrapper.style.zIndex="1"
      if(!this.bannersWrapper.closest('.overlapping-section')) this.bannersWrapper.style.overflow="hidden"
    }
    if(this.videoButton) this.videoButton.style.zIndex="1"
  }
  visuallyVideoPopup() {
    if(this.bannersWrapper) {
      this.bannersWrapper.style.zIndex="40"
      this.bannersWrapper.style.overflow="visible"
    }
    if(this.videoButton) this.videoButton.style.zIndex="40"
  }

  init() {
    this.parentSelector = this.dataset.parent || '.deferred-media';
    this.parent = this.closest(this.parentSelector);

    switch(this.dataset.type) {
      case 'youtube':
        this.initYoutubeVideo();
        break;

      case 'vimeo':
        this.initVimeoVideo();
        break;

      case 'mp4':
        this.initMp4Video();
        break;
    }
  }

  initYoutubeVideo() {
    this.loadScript('youtube').then(this.setupYoutubePlayer.bind(this));
  }

  initVimeoVideo() {
    this.loadScript('vimeo').then(this.setupVimeoPlayer.bind(this));
  }

  initMp4Video() {
    const player = this.querySelector('video');

    if (player) {
      const promise = player.play();

      // Edge does not return a promise (video still plays)
      if (typeof promise !== 'undefined') {
        promise.then(function() {
          // playback normal
        }).catch(function() {
          player.setAttribute('controls', '');
        });
      }
    }
  }

  loadScript(videoType) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      document.body.appendChild(script);
      script.onload = resolve;
      script.onerror = reject;
      script.async = true;
      script.src = videoType === 'youtube' ? 'https://www.youtube.com/iframe_api' : '//player.vimeo.com/api/player.js';
    });
  }

  setAsLoaded() {
    this.parent.setAttribute('loaded', true);
  }

  setupYoutubePlayer() {
    const videoId = this.dataset.videoId;
    
    const playerInterval = setInterval(() => {
      if (window.YT) {
        window.YT.ready(() => {
          const element = document.createElement('div');
          this.appendChild(element);

          this.player = new YT.Player(element, {
            videoId: videoId,
            playerVars: {
              showinfo: 0,
              controls: !this.background,
              fs: !this.background,
              rel: 0,
              height: '100%',
              width: '100%',
              iv_load_policy: 3,
              html5: 1,
              loop: 1,
              playsinline: 1,
              modestbranding: 1,
              disablekb: 1
            },
            events: {
              onReady: this.onYoutubeReady.bind(this),
              onStateChange: this.onYoutubeStateChange.bind(this)
            }
          });
          clearInterval(playerInterval);
        });
      }
    }, 50);
  }

  onYoutubeReady() {
    this.iframe = this.querySelector('iframe'); // iframe once YT loads
    this.iframe.classList.add('js-youtube')
    this.iframe.setAttribute('tabindex', '-1');

    if(theme.config.isTouch) this.player.mute();
    if (typeof this.player.playVideo === 'function') this.player.playVideo();

    this.setAsLoaded();

    // pause when out of view
    const observer = new IntersectionObserver((entries, _observer) => {
      entries.forEach(entry => {
        entry.isIntersecting ? this.youtubePlay() : this.youtubePause();
      });
    }, {rootMargin: '0px 0px 50px 0px'});

    observer.observe(this.iframe);
  }

  onYoutubeStateChange(event) {
    switch (event.data) {
      case -1: // unstarted
        // Handle low power state on iOS by checking if
        // video is reset to unplayed after attempting to buffer
        if (this.attemptedToPlay) {
          this.setAsLoaded();
        }
        break;
      case 0: // ended, loop it
        this.youtubePlay();
        break;
      case 1: // playing
        this.setAsLoaded();
        break;
      case 3: // buffering
        this.attemptedToPlay = true;
        break;
    }
  }

  youtubePlay() {
    if (this.background && this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  youtubePause() {
    if (this.background && this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
  }

  setupVimeoPlayer() {
    const videoId = this.dataset.videoId;

    const playerInterval = setInterval(() => {
      if (window.Vimeo) {
        this.player = new Vimeo.Player(this, {
          id: videoId,
          autoplay: true,
          autopause: false,
          background: this.background,
          controls: !this.background,
          loop: true,
          height: '100%',
          width: '100%'
        });
        this.player.ready().then(this.onVimeoReady.bind(this));

        clearInterval(playerInterval);
      }
    }, 50);
  }

  onVimeoReady() {
    this.iframe = this.querySelector('iframe');
    this.iframe.classList.add('js-vimeo')
    this.iframe.setAttribute('tabindex', '-1');

    if(theme.config.isTouch) this.player.setMuted(true);

    this.setAsLoaded();

    // pause when out of view
    const observer = new IntersectionObserver((entries, _observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.vimeoPlay();
        } else {
          this.vimeoPause();
        }
      });
    }, {rootMargin: '0px 0px 50px 0px'});

    observer.observe(this.iframe);
  }

  vimeoPlay() {
    if (this.background && this.player && typeof this.player.play === 'function') {
      this.player.play();
    }
  }

  vimeoPause() {
    if (this.background && this.player && typeof this.player.pause === 'function') {
      this.player.pause();
    }
  }
  
}
customElements.define('video-section', VideoSection);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    
    this.poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!this.poster) return;

    this.popupVideo = this.querySelector('.popup-video')
    this.posX1 
    this.posInit 
    this.posX2
    this.posY1
    this.posY2 
    this.posInitY
    this.swipeVertical = false
    this.swipeHorizontal = false

    this.poster.addEventListener('click', (event) => event.preventDefault()); 
    this.poster.addEventListener('mousedown', this.swipeStart.bind(this));     
    this.poster.addEventListener('mousemove', this.swipeAction.bind(this));
    this.poster.addEventListener('mouseup', this.swipeEnd.bind(this))
    this.poster.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'ENTER') this.swipeEnd();
    });
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      if(this.querySelector('.template-video')) return
      const content = document.createElement('div');
      content.classList.add('template-video')
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      if (content.querySelector('video-section')) {
        this.popupVideo ? this.popupVideo.appendChild(content).focus() : this.appendChild(content).focus();
      } else {
        this.setAttribute('loaded', true);
        const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
        if (focus) deferredElement.focus();
      }
      if(this.querySelector('video')) this.querySelector('video').play();
    }
  }

  getEvent (event) {
    return event.type.search('touch') !== -1 ? event.touches[0] : event;
  }

  swipeStart(event) {
    event.preventDefault()
    let evt = this.getEvent(event);
    this.posInit = this.posX1 = evt.clientX;
    this.posInitY = this.posY1 = evt.clientY
  }

  swipeAction(event) {
    let evt = this.getEvent(event);
    this.posX2 = this.posX1 - evt.clientX;
    this.posX1 = evt.clientX;
    this.posY2 = this.posY1 - evt.clientY;
    this.posY1 = evt.clientY;
  }

  swipeEnd() {
    this.swipeVertical = Math.abs(this.posInitY - this.posY1) > 20
    this.swipeHorizontal = Math.abs(this.posInit - this.posX1) > 20
    if(!this.swipeVertical && !this.swipeHorizontal) {
      this.loadContent();
      let buttonStop = this.querySelector('.stop-video')
      if(!buttonStop) return
      if(this.closest('.product__media-item')) this.closest('.product__media-item').style.overflow = 'visible'
      buttonStop.style.display = 'flex'
      buttonStop.addEventListener('click', () => {
        this.querySelector('iframe').remove()
        this.removeAttribute('loaded')
        if(this.closest('.product__media-item')) this.closest('.product__media-item').style.overflow = 'hidden'
        let buttonStop = this.querySelector('.stop-video')
        buttonStop.style.display = 'none'
      })  
    }
  }
}
customElements.define('deferred-media', DeferredMedia);

class DoubleHover extends HTMLElement {
  constructor() {
    super();
    // Link defocus animation when hovered over a link inside it
    this.cardLink = this.querySelector('.double-hover');
    this.elementsHover = this.querySelectorAll('.elem-hover')
    this.richtext = this.querySelectorAll('.richtext')
    if (this.richtext) {
      this.richtext.forEach(item => {
        if (item.querySelectorAll('a')) {
          item.querySelectorAll('a').forEach(link => {
          link.addEventListener('mouseleave', () => link.closest('.double-hover').classList.remove('no-hover'))
          link.addEventListener('mouseenter', () => link.closest('.double-hover').classList.add('no-hover'))
        })
        }
      })
    } 
    if (this.elementsHover) {
      this.elementsHover.forEach(item => {
        // Return hover effect to parent link if we move mouse away from child link
        item.addEventListener('mouseleave', () => {
          this.cardLink.classList.remove('no-hover');
          if(item.classList.contains('disabled')) this.cardLink.style.cursor = 'pointer'
        })
        // If we hover over the child link, we add class to parent link to cancel hover effect on it
        item.addEventListener('mouseenter', () => {
          this.cardLink.classList.add('no-hover');
          if(item.classList.contains('disabled')) this.cardLink.style.cursor = 'default'
        }) 
        if(item.classList.contains('disabled')) {
          item.addEventListener('click', event => event.preventDefault())
        }
      })
    } 
  }
}
customElements.define('double-hover', DoubleHover);

class MediaTabs extends HTMLElement {
  constructor() {
    super();
    
    this.tabs = this.querySelectorAll('.tab-js')
    this.allMedia = this.closest('.tabs-container-js').querySelectorAll('.tab-media-js')
    this.contents = this.closest('.tabs-container-js').querySelectorAll('.tab-content-js')

    if (this.closest('.tabs-container-js.predictive-search-results')) { 
      if (this.tabs.length > 0) this.tabs[0].classList.add('active')
      if (this.contents.length > 0) this.contents[0].classList.add('active')
    }
    if(this.allMedia.length > 0) {
      this.allMedia.forEach(media => {
        if(media.querySelector('video') && !media.closest('.active')) media.querySelector('video').pause();
      })
    }
    this.contents.forEach(content => {
      if(!content.closest('.active')) content.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '-1'))
    })

    this.addEventListener('click', this.changeActiveTab.bind(this));  
    this.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'ENTER') this.changeActiveTab(event)
    })

    document.addEventListener('shopify:block:select', (event) => {
      let activeTab = event.target
      if(!this.closest('section').querySelector(`#${activeTab.getAttribute('id')}`)) return
      this.tabs.forEach(tab =>  tab.classList.remove('active'))
      if(this.allMedia.length > 0) this.allMedia.forEach(media => this.hiddenContentPrevActiveTab(media))
      if(this.contents.length > 0) this.contents.forEach(content => this.hiddenContentPrevActiveTab(content))
      activeTab.classList.add('active')
      let activeElemID = activeTab.getAttribute('id')
      if(activeTab.closest('.tab-media-js')) activeElemID = activeElemID.split('media-')[1]
      if(this.closest('.media-with-tabs')) document.getElementById(activeElemID).classList.add('active')
      if(this.contents.length == 0) return
      this.contents.forEach(content => this.visibleElementActiveTab(content, activeElemID))
    })
  }

  changeActiveTab(event) {
    let eventTarget
    (event.target) ? eventTarget = event.target : eventTarget = event
    if(eventTarget.closest('.tab-js')) {
      this.tabs.forEach(tab => tab.classList.remove('active'))
      let activeElem = eventTarget.closest('.tab-js')
      activeElem.classList.add('active')
      let activeElemID = activeElem.getAttribute('id')
      if(this.allMedia.length > 0) {
        this.allMedia.forEach(media => this.hiddenContentPrevActiveTab(media))
        this.allMedia.forEach(media => this.visibleElementActiveTab(media, activeElemID))
      }
      if(this.contents.length > 0) {
        this.contents.forEach(content => this.hiddenContentPrevActiveTab(content))
        this.contents.forEach(content => this.visibleElementActiveTab(content, activeElemID))
      }
    }
  }

  hiddenContentPrevActiveTab(element) {
    element.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '-1'))
    element.classList.remove('active');
    // Pause any video
    if(element.querySelector('video') && !element.closest('.active')) element.querySelector('video').pause();
    if(element.querySelector('.js-youtube') && !element.closest('.active')) {
      element.querySelector('.js-youtube').contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
    }
    if(element.querySelector('.js-vimeo') && !element.closest('.active')) {
      element.querySelector('.js-vimeo').contentWindow.postMessage('{"method":"pause"}', '*')
    }
  }

  visibleElementActiveTab(element, activeElemID) {
    let elemID 
    
    if(element.closest('.tab-content-js')) elemID = element.getAttribute('id').split('content-')[1]
    if(element.closest('.tab-media-js')) elemID = element.getAttribute('id').split('media-')[1]
    if(elemID == activeElemID) {
      element.classList.add('active');
      element.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '0'))
    }
    // Play autoplay video if it exists
    if(element.querySelector('video') && !element.closest('.none-autoplay')) element.querySelector('video').play();
  }
}
customElements.define('component-tabs', MediaTabs);

class HoverImageReveal extends HTMLElement {
  constructor() {
      super();

      if(window.innerWidth < 1024 || theme.config.isTouch) return

      this.reveal = this.querySelector('.hover-reveal');
      this.revealInner = this.querySelector('.hover-reveal__inner');
      this.revealInner.style.overflow = 'hidden';
      this.revealImg = this.revealInner.querySelector('.hover-reveal__img');
      this.windowWidth = window.innerWidth;
      this.imageWidth = this.revealInner.offsetWidth;
      this.imageHeight = this.revealInner.offsetHeight * 0.8;
      this.header = document.querySelector('.shopify-section-header .header');
      this.sidebar = document.querySelector('.secondary-sidebar-section')
      this.header ? this.headerHeight = this.header.offsetHeight : this.headerHeight = 0;
      this.sidebar ? this.windowWidth = window.innerWidth - 96 : this.windowWidth = window.innerWidth
      setTimeout(() => this.initEvents(), 1200)
      window.addEventListener('resize',() => {
        this.windowWidth = window.innerWidth
        this.imageWidth = this.revealInner.offsetWidth
        this.imageHeight = this.revealInner.offsetHeight * 0.8
        this.header ? this.headerHeight = this.header.offsetHeight : this.headerHeight = 0;
        this.sidebar ? this.windowWidth = window.innerWidth - 96 : this.windowWidth = window.innerWidth
      })
  }

  getMousePos(e) {
      let posx = 0;
      let posy = 0;
      if (!e) e = window.event;
      if (e.pageX || e.pageY) {
          posx = e.pageX;
          posy = e.pageY;
      }
      else if (e.clientX || e.clientY) {
          posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
          posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      return { x : posx, y : posy }
  }

  initEvents() {
      this.positionElement = (ev) => {
          // Align the image on hover to be always visible 
          this.windowWidth = window.innerWidth
          this.imageWidth = this.revealInner.offsetWidth
          this.imageHeight = this.revealInner.offsetHeight * 0.8
          this.header ? this.headerHeight = this.header.offsetHeight : this.headerHeight = 0;
          if(this.header) this.header.closest('.disable') ? this.headerHeight = 0 : this.headerHeight = this.header.offsetHeight
          this.sidebar ? this.windowWidth = window.innerWidth - 96 : this.windowWidth = window.innerWidth
          let mousePos = this.getMousePos(ev);
          let docScrolls = {
              left : document.body.scrollLeft + document.documentElement.scrollLeft, 
              top : document.body.scrollTop + document.documentElement.scrollTop
          };
          
          let horizontalPosition = mousePos.x+20
          let verticalPosition = mousePos.y+20-docScrolls.top
          if(horizontalPosition + this.imageWidth + 16 > this.windowWidth) {
              horizontalPosition = this.windowWidth - this.imageWidth - 16
          }
          if(this.headerHeight + 16 + this.imageHeight > verticalPosition) {
              verticalPosition = this.headerHeight + 16 + this.imageHeight
          }
          this.reveal.style.left = `${horizontalPosition-docScrolls.left}px`;
          this.reveal.style.top = `${verticalPosition}px`;
      };
      this.mouseenterFn = (ev) => {
          this.positionElement(ev);
          if(TweenMax) this.showImage();
      };
      this.mousemoveFn = ev => requestAnimationFrame(() => {
          this.positionElement(ev);
      });
      this.mouseleaveFn = () => {
        if(TweenMax) this.hideImage();
      };
      
      this.addEventListener('mouseenter', this.mouseenterFn);
      this.addEventListener('mousemove', this.mousemoveFn);
      this.addEventListener('mouseleave', this.mouseleaveFn);
  }

  showImage(event) {
      TweenMax.killTweensOf(this.revealInner);
      TweenMax.killTweensOf(this.revealImg);

      this.tl = new TimelineMax({
          onStart: () => {
              this.reveal.style.opacity = 1; 
              TweenMax.set(this, {zIndex: 5});
          }
      })
      .delay(0.2)
      .add('begin')
      .add(new TweenMax(this.revealInner, 0.8, {
          ease: Expo.easeOut,
          startAt: {opacity: 0, y: '50%', rotation: -15, scale:0},
          y: '-80%',
          rotation: 0,
          opacity: 1,
          scale: 1
      }), 'begin')
      .add(new TweenMax(this.revealImg, 0.8, {
          ease: Expo.easeOut,
          startAt: {rotation: 15, scale: 2},
          rotation: 0,
          scale: 1
      }), 'begin');
       
  }
  hideImage() {
      TweenMax.killTweensOf(this.revealInner);
      TweenMax.killTweensOf(this.revealImg);

      this.tl = new TimelineMax({
          onStart: () => {
              TweenMax.set(this, {zIndex: 4});
          },
          onComplete: () => {
              TweenMax.set(this, {zIndex: ''});
              TweenMax.set(this.reveal, {opacity: 0});
          }
      })
      .add('begin')
      .add(new TweenMax(this.revealInner, 0.15, {
          ease: Sine.easeOut,
          y: '-40%',
          rotation: 10,
          scale: 0.9,
          opacity: 0
      }), 'begin')
      .add(new TweenMax(this.revealImg, 0.15, {
          ease: Sine.easeOut,
          rotation: -10,
          scale: 1.5
      }), 'begin')
  }

}
customElements.define('link-hover-image', HoverImageReveal);

class ColorSwatch extends HTMLElement {
  constructor() {
    super();

    this.colorsContainer = this.closest('.card__colors')
    this.tooltip = this.querySelector('.color-swatch__title')
    this.productCard = this.closest('.card')
    this.addEventListener('click', (event) => {
      event.preventDefault()
      this.onClickHandler()
      if (event.target.closest('a')) return false
    });
    this.closest('.card__colors').addEventListener('mouseleave', () => {
      this.productCard.classList.remove('no-hover')
    })
    this.closest('.card__colors').addEventListener('mouseenter', (event) => {
      this.alignSwatches()
      this.disableCardHover(event)
    })    
  }

  onClickHandler() {
    const image = this.closest('.card').querySelector('.card__product-image img');
    this.activeColorSwatch()
    this.updateURL()
    if (image.classList.contains('card__image-placeholder')) return
    if (image !== null) {
      image.src = this.dataset.src;
      image.srcset = this.dataset.srcset;
    }
  }

  activeColorSwatch() {
    const swatches = this.colorsContainer.querySelectorAll('.color-swatch');
      swatches.forEach((swatch) => {
        swatch.classList.remove('active-swatch');
      });
      this.classList.add('active-swatch');
  }

  updateURL() {
    const activeSwatch = this.colorsContainer.querySelector('.active-swatch')
    const activeVariantURL = activeSwatch.querySelector('.color-swatch__link').getAttribute('href')
    this.colorsContainer.closest('.card').setAttribute('href', activeVariantURL)
  }

  alignSwatches() {
    let sliderViewport = this.tooltip.closest('.slider__viewport')
    this.tooltip.classList.remove('change-position')
    if (sliderViewport && sliderViewport.getBoundingClientRect().left >= this.tooltip.getBoundingClientRect().left) this.tooltip.classList.add('change-position')
  }

  disableCardHover(event) {
    
    this.productCard.classList.add('no-hover')
  }
}
customElements.define('color-swatch', ColorSwatch);

class ScrollingPromotion extends HTMLElement {
  constructor() {
    super();

    this.config = {
      moveTime: parseFloat(this.dataset.speed), // 100px going to move for
      space: 100,  // 100px
    };

    this.promotion = this.querySelector('.promotion');

    theme.initWhenVisible({
      element: this,
      callback: this.init.bind(this),
      threshold: 600
    });
  }

  init() {
    if (this.childElementCount === 1) {
      this.promotion.classList.add('promotion--animated');

      for (let index = 0; index < 10; index++) {
        this.clone = this.promotion.cloneNode(true);
        this.clone.setAttribute('aria-hidden', true);
        this.appendChild(this.clone);

        let imageWrapper = this.clone.querySelector('.promotion__item');
        if (imageWrapper) imageWrapper.classList.remove('loading');
      }
      let animationTimeFrame = (this.promotion.clientWidth / this.config.space) * this.config.moveTime;
      this.style.setProperty('--duration', `${animationTimeFrame}s`);

      this.widthPromotion = this.promotion.offsetWidth
      this.widthWrapper = this.offsetWidth
      this.percent = this.widthPromotion * 100 / this.widthWrapper
      // Define a variable to assign a scroll step. Do nor use transform property, this may cause the animation (HoverImageReveal) to work incorrectly
      this.style.setProperty('--left-position', `-${this.percent}%`);

      window.addEventListener('resize', () => {
        this.widthPromotion = this.promotion.offsetWidth
        this.widthWrapper = this.offsetWidth
        this.percent = this.widthPromotion * 100 / this.widthWrapper
        this.style.setProperty('--left-position', `-${this.percent}%`);
        let animationTimeFrame = (this.promotion.clientWidth / this.config.space) * this.config.moveTime;
        this.style.setProperty('--duration', `${animationTimeFrame}s`);
      })

      // pause when out of view
      const observer = new IntersectionObserver((entries, _observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.scrollingPlay();
          } else {
            this.scrollingPause();
          }
        });
      }, {rootMargin: '0px 0px 50px 0px'});

      observer.observe(this);
    }
  }

  scrollingPlay() {
    this.classList.remove('scrolling-promotion--paused');
  }

  scrollingPause() {
    this.classList.add('scrolling-promotion--paused');
  }
}
customElements.define('scrolling-promotion', ScrollingPromotion);


class CascadingGrid extends HTMLElement {
  constructor() {
      super();
      this.createGrid()
      document.addEventListener('shopify:section:load', () => {
         setTimeout(() => this.createGrid(), 100) 
      })
    }

    createGrid() {
      var elem = this.querySelector('.grid');
      if (elem) var msnry = new Masonry( elem, {itemSelector: '.grid-item'})
    }
}

customElements.define('cascading-grid', CascadingGrid);

class ShowMoreButton extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');
    button.addEventListener('click', (event) => {
      this.expandShowMore(event);
    });
    this.parentPanel = this.closest('.accordion__panel')
  }
  expandShowMore(event) {
    const parentDisplay = event.target.closest('[id^="Show-More-"]').closest('.js-filter');
    this.querySelectorAll('.label-show').forEach((element) => element.classList.toggle('hidden'));
    parentDisplay.querySelectorAll('.show-more-item').forEach((item) => item.classList.toggle('hidden'));
    this.parentPanel.style.maxHeight = this.parentPanel.scrollHeight + "px"
  }
}

customElements.define('show-more-button', ShowMoreButton);

class InfiniteScroll extends HTMLElement {
  constructor() {
    super();

    this.querySelector('button').addEventListener('click', this.onClickHandler.bind(this));
    if (this.dataset.trigger == 'auto') {
      new IntersectionObserver(this.handleIntersection.bind(this), {rootMargin: '0px 0px 200px 0px'}).observe(this);
    }
  }

  onClickHandler() {
    if (this.classList.contains('loading') || this.classList.contains('disabled')) return;
    this.classList.add('loading');
    this.classList.add('disabled');
    this.querySelector('button').innerHTML = this.querySelector('.loading-overlay__spinner').innerHTML
    const sections = InfiniteScroll.getSections();
    sections.forEach(() => {
      const url = this.dataset.url;
      InfiniteScroll.renderSectionFromFetch(url);
    });
  }

  handleIntersection(entries, observer) {
    if (!entries[0].isIntersecting) return;
    observer.unobserve(this);

    this.onClickHandler();
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      }
    ]
  }

  static renderSectionFromFetch(url) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        InfiniteScroll.renderPagination(html);
        InfiniteScroll.renderProductGridContainer(html);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  static renderPagination(html) {
    const container = document.getElementById('ProductGridContainer').querySelector('.pagination-wrapper');
    const pagination = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductGridContainer').querySelector('.pagination-wrapper');
    if (pagination) {
      container.innerHTML = pagination.innerHTML;
    }
    else {
      container.remove();
    }
  }

  static renderProductGridContainer(html) {
    const container = document.getElementById('product-grid');
    const products = new DOMParser().parseFromString(html, 'text/html').getElementById('product-grid');
    container.insertAdjacentHTML('beforeend', products.innerHTML);
  }
}
customElements.define('infinite-scroll', InfiniteScroll);  

class ImageComparison extends HTMLElement {
  constructor() {
    super();

    this.range = this.querySelector('.image-comparison__range');

    this.range.addEventListener('input', (e) => {
      this.style.setProperty('--position', `${e.target.value}%`);
    });

    this.range.addEventListener('change', (e) => {
      this.style.setProperty('--position', `${e.target.value}%`);
    });

    this.setValue()
    window.addEventListener('resize', this.setValue.bind(this))
  }

  setValue () {
    this.width = this.offsetWidth;
    this.min = Math.max(Math.ceil(8 * 100 / this.width * 10) / 10, 0)
    this.max = 100 - this.min
    this.range.setAttribute('min', this.min)
    this.range.setAttribute('max', this.max)
  }
}
customElements.define('image-comparison', ImageComparison);

class ImageWithHotspots extends HTMLElement {
  constructor() {
    super();
    this.timeout

    this.dots = this.querySelectorAll('.image-with-hotspots__dot');
    this.dropdowns = this.querySelectorAll('.image-with-hotspots__dot ~ .image-with-hotspots__content');
    this.dots.forEach(dot => dot.addEventListener('mouseenter', (event) => {
      if (event.target.closest('.image-with-hotspots__dot')) this.openDropdown(event.target.closest('.image-with-hotspots__dot')) 
    }))

    this.dots.forEach(dot => dot.addEventListener('mousemove', (event) => {
      if (event.target.closest('.image-with-hotspots__dot')) this.openDropdown(event.target.closest('.image-with-hotspots__dot')) 
    }))

    this.dots.forEach(dot => dot.addEventListener('mouseleave', (event) => {
      if (event.relatedTarget && !event.relatedTarget.closest('.image-with-hotspots__content')) this.closeDropdown(dot)
    }))

    this.dropdowns.forEach(dropdown => dropdown.addEventListener('mouseleave', (event) => {
      if (event.relatedTarget != dropdown.previousElementSibling) this.closeDropdown(dropdown.previousElementSibling)
    }))

    this.dropdowns.forEach(dropdown => dropdown.addEventListener('click', (event) => {
      if(event.target.closest('quick-view-button') && event.target.closest('quick-view-button').previousElementSibling.closest('.open')) this.closeDropdown(event.target.closest('quick-view-button').previousElementSibling)
    }))
  }

  openDropdown(item) {
    this.stopAnimation()
    this.alignDropdown(item.nextElementSibling)
    item.classList.add('open', 'active')
    item.classList.remove('closing')
    item.closest('.image-with-hotspots__hotspot').style.zIndex = 6
  }

  closeDropdown(item) {
    item.classList.add('closing')
    this.timeout = setTimeout(() => {
      item.classList.remove('closing')
      item.classList.remove('open')
      item.closest('.image-with-hotspots__hotspot').removeAttribute('style')
      this.content = item.nextElementSibling
      this.contentIcon = this.content.querySelector('.image-with-hotspots__content-icon')
      this.content.removeAttribute('style')
      this.contentIcon.removeAttribute('style')
    }, 300);

    item.classList.remove('active')
  }

  alignDropdown(item) {
    this.itemCoordinate = item.getBoundingClientRect();
    this.contentIcon = item.querySelector('.image-with-hotspots__content-icon')
    this.itemWidth = item.offsetWidth
    this.viewportWidth = window.innerWidth
    this.dotPosition = Math.round(item.closest('.image-with-hotspots__hotspot').getBoundingClientRect().left)
    if(this.itemCoordinate.left < 0) {
      item.style.left = 0 - this.dotPosition + 'px';
      item.style.right = 'auto';
      this.contentIcon.style.left = this.dotPosition + 22 - 8 + 'px';
      this.contentIcon.style.right = 'auto';
    } else if (this.itemCoordinate.right  > this.viewportWidth) {
      item.style.right = 'auto';
      item.style.left = this.viewportWidth - this.dotPosition - this.itemWidth + 'px';
      this.contentIcon.style.left = 'auto';
      this.contentIcon.style.right = this.viewportWidth - this.dotPosition - 22 - 8 + 'px';
    } 
  }

  stopAnimation() {
    clearTimeout(this.timeout)
    this.querySelectorAll('.image-with-hotspots__hotspot').forEach(item => item.removeAttribute('style'))
  }
}
customElements.define('image-with-hotspots', ImageWithHotspots);

class PromoPopup extends HTMLElement {
  constructor() {
    super();

    // Prevent popup on Shopify robot challenge page
    if (window.location.pathname === '/challenge') {
      return;
    }

    this.cookieName = this.closest('section').getAttribute('id');

    this.classes = {
      bodyClass: 'hidden',
      openClass: 'open',
      closingClass: 'is-closing',
      showImage: 'show-image'
    };

    this.popup = this.querySelector('.popup-wrapper')
    this.stickyTab = this.querySelector('.promo-sticky-tab')
    this.openTabButton = this.querySelector('.open-sticky-tab')
    this.closeTabButton = this.querySelector('.close-sticky-tab')
    this.overlay = this.querySelector('.overlay')
    this.hasPopupedUp = false

    this.querySelectorAll('[data-popup-toggle]').forEach((button) => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });
    this.openStickyTab()
    if (!this.getCookie(this.cookieName)) {
      this.init();
    }

    document.addEventListener('keydown', (event) => {
      if (event.code && event.code.toUpperCase() === 'ESCAPE' && this.querySelector('.popup-wrapper--popup.open')) this.closePopup()
    })
    
    if (this.closeTabButton) this.closeTabButton.addEventListener('click', this.closeStickyTab.bind(this))
  }

  connectedCallback() {
    if (Shopify.designMode) {
      this.onShopifySectionLoad = this.onSectionLoad.bind(this);
      this.onShopifySectionSelect = this.onSectionSelect.bind(this);
      this.onShopifySectionDeselect = this.onSectionDeselect.bind(this);
      document.addEventListener('shopify:section:load', this.onShopifySectionLoad);
      document.addEventListener('shopify:section:select', this.onShopifySectionSelect);
      document.addEventListener('shopify:section:deselect', this.onShopifySectionDeselect);
    }
  }
  disconnectedCallback() {
    if (Shopify.designMode) {
      document.removeEventListener('shopify:section:load', this.onShopifySectionLoad);
      document.removeEventListener('shopify:section:select', this.onShopifySectionSelect);
      document.removeEventListener('shopify:section:deselect', this.onShopifySectionDeselect);

      document.body.classList.remove(this.classes.bodyClass);
    }
  }
  onSectionLoad(event) {
    filterShopifyEvent(event, this, () => this.openPopup.bind(this));
  }
  onSectionSelect(event) {
    filterShopifyEvent(event, this, this.openPopup.bind(this));
  }
  onSectionDeselect(event) {
    filterShopifyEvent(event, this, this.closePopup.bind(this));
  }

  init() {
    if (Shopify && Shopify.designMode) {
      return;
    }
    if (this.dataset.delayType == 'timer') {
      let delayValue
      Shopify.designMode ? delayValue = 0 : delayValue = parseInt(this.dataset.delay)
      setTimeout(function() {
        if(!document.body.className.includes('hidden')) {
          this.openPopup()
        } else if (!this.getCookie(this.cookieName)) {
          document.addEventListener('body:visible', () => {
            if(!document.body.className.includes('hidden')) setTimeout(() => this.openPopup(), 1000)
          })
        }
      }.bind(this), delayValue * 1000)
    } else if (this.dataset.delayType == 'scroll') {
      let delayValue = parseInt(this.dataset.delay.slice(10).slice(0, -1), 10)
      const scrollPercent = delayValue / 100;
      let scrollTarget
      window.addEventListener('load', () => {
        scrollTarget = (document.body.scrollHeight - window.innerHeight) * scrollPercent;
        document.addEventListener('scroll', () => {
          if (window.scrollY >= scrollTarget && !this.hasPopupedUp) this.openPopup()
        })
      })
    }
  }

  onButtonClick(event) {
    event.preventDefault();
    this.popup.classList.contains(this.classes.openClass) ? this.closePopup() : this.openPopup();
  }

  openPopup() {
    document.body.classList.remove(this.classes.bodyClass)
    this.popup.classList.add(this.classes.openClass)
    if (this.overlay && !this.overlay.classList.contains(this.classes.openClass)) this.overlay.classList.add(this.classes.openClass);

    if (this.popup.dataset.position === 'popup') {
      document.body.classList.add(this.classes.bodyClass);
    }
    if (this.stickyTab) this.closeStickyTab()
    this.hasPopupedUp = true
    document.querySelectorAll('promo-popup').forEach(item => {
      if(!item.querySelector('.popup-wrapper').closest('.open') && !item.querySelector('.age-verification')) item.closest('section').style.zIndex = '27'
    })
  }

  closePopup() {
    this.popup.classList.add(this.classes.closingClass)

    setTimeout(() => {
      this.popup.classList.remove(this.classes.openClass)
      if (this.overlay) this.overlay.classList.remove(this.classes.openClass)
      this.popup.classList.remove(this.classes.closingClass)
      this.popup.classList.remove(this.classes.showImage)
      this.openStickyTab()
      document.querySelectorAll('promo-popup').forEach(item => {
        if(item.closest('section').getAttribute('style')) item.closest('section').removeAttribute('style')
      })
      if (this.popup.dataset.position === 'popup') document.body.classList.remove(this.classes.bodyClass)
      if (this.querySelector('.age-verification')) document.dispatchEvent(new CustomEvent('body:visible'));
    })
    if (Shopify.designMode) {
      this.removeCookie(this.cookieName)
      return;
    }
    this.setCookie(this.cookieName, this.dataset.frequency)
  }

  openStickyTab() {
    if (!this.stickyTab) return
    document.addEventListener('searchmodal:open', () => {
      this.closest('section').style.zIndex = '9'
    })
    this.stickyTab.classList.add(this.classes.openClass)
  }

  closeStickyTab() {
    if (!this.stickyTab) return
    this.stickyTab.classList.remove(this.classes.openClass)
  }

  getCookie(name) {
    let match = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
    return match ? match[2] : null;
  }

  setCookie(name, frequency) {
    document.cookie = `${name}=true; max-age=${(frequency * 60 * 60)}; path=/`;
  }

  removeCookie(name) {
    document.cookie = `${name}=; max-age=0`;
  }
}
customElements.define('promo-popup', PromoPopup);
