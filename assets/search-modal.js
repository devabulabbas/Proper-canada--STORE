class SearchModal extends HTMLElement {
    constructor() {
      super();
      
      this.modal = this.querySelector('.search-modal');
      this.detailsContainer = this.querySelector('details');
      this.summaryToggle = this.querySelector('summary');
      this.input = this.querySelector('.search__input')
      this.searchField = this.summaryToggle.querySelector('.search-field__text')
      this.overlay = this.detailsContainer.querySelector('.overlay')
  
      document.addEventListener(
        'keyup',
        (event) => event.code && event.code.toUpperCase() === 'ESCAPE' && this.close()
      );
    
        if (this.searchField) {
          this.summaryToggle.querySelector('.search-field__text').addEventListener('input', this.open.bind(this))
         
        } else {
          this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this))
        }
        if (document.querySelector('.overlay.open')) document.querySelector('.overlay').addEventListener('click', this.close.bind(this))
      document.querySelector('button[type="reset"]').addEventListener(
        'click',
        this.reset.bind(this)
      );
        
      this.summaryToggle.setAttribute('role', 'button');
    }

    onSummaryClick(event) {
      event.preventDefault();
      event.target.closest('details').hasAttribute('open')
        ? this.close()
        : this.open(event);
        this.open(event);
    }
  
    onBodyClick(event) {
      if (event.target.classList.contains('overlay') || event.target.closest('.button-close')) this.close();
    }
  
    open() {
      document.body.appendChild(this.modal)
      document.body.appendChild(this.overlay)
      if (this.searchField) {
        this.input.setAttribute('value', this.searchField.value)
        this.input.value = this.searchField.value
        trapFocus(
          this.searchField,
          this.input
        );
        this.input.addEventListener('focus', this.input.setSelectionRange(this.searchField.value.length, this.searchField.value.length))
      }
      else {
        trapFocus(
          this.detailsContainer,
          this.input
        );
      }
      this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
      this.detailsContainer.setAttribute('open', true);
      this.overlay.classList.add('open')
      document.body.addEventListener('click', this.onBodyClickEvent);
      document.body.classList.add('search-modal--open');
      document.body.classList.add('hidden')
      this.modal.classList.add('open')
    }
  
    close() {
      removeTrapFocus();
      this.detailsContainer.removeAttribute('open');
      document.body.removeEventListener('click', this.onBodyClickEvent);
      document.body.classList.remove('search-modal--open');
      document.dispatchEvent(new CustomEvent('searchmodal:close'));
      document.body.classList.remove('hidden')
      document.querySelector('.search__button-text').classList.add('hidden')
      this.modal.classList.remove('open')
      if (this.searchField) this.searchField.value = ''
      this.input.value = ''
      if (this.closest('.menu-drawer')) this.closest('.menu-drawer').setAttribute('hidden', 'true')
      document.body.removeChild(this.modal)
      this.overlay = document.querySelector('.overlay.open')
      document.body.removeChild(this.overlay)
    }
  
    reset(event) {
      event.preventDefault();
      this.querySelector('input[type="search"]').value = '';
    }
  }
  
  customElements.define('search-modal', SearchModal);
  