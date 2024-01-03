class OverlapNavigation extends HTMLElement {
    constructor() {
      super();
         
      this.sections = Array.of(this.querySelectorAll('main .shopify-section')[0], this.querySelector('.shopify-section-footer'))
      this.header = this.querySelector('.transparent-header')
      this.sidebars = this.querySelectorAll('.transparent-sidebar')
      this.invertedElements = this.querySelectorAll('.scroll-color')
      this.announcementBar = this.querySelector('.announcement-bar-section')
      this.firstSection = false
      this.footer = false
      this.lastScrollPos = 0
      this.firstOverlappingSection = this.querySelectorAll('main .shopify-section')[0]
      if (this.querySelector('main .shopify-section') && this.querySelectorAll('main .shopify-section')[0].querySelector('.overlapping-content-js')) {
        this.sectionBg = this.querySelectorAll('main .shopify-section')[0].querySelector('.overlapping-content-js').dataset.bg
        this.sectionColor = this.querySelectorAll('main .shopify-section')[0].querySelector('.overlapping-content-js').dataset.color
      }
      if (this.querySelector('.shopify-section-footer')) {
        this.footerBg = this.querySelector('.shopify-section-footer').querySelector('.overlapping-content-js').dataset.bg
        this.footerColor = this.querySelector('.shopify-section-footer').querySelector('.overlapping-content-js').dataset.color
      }
      this.sectionGroups = this.querySelectorAll('.shopify-section-group-more-header-sections')
      if (this.announcementBar) this.announcementBarHeight = this.announcementBar.offsetHeight

      
      window.addEventListener('resize', () => {
        if (window.innerWidth < 920) {
          this.headerGroup = this.querySelector('.header-group')
          this.sectionGroups = this.querySelectorAll('.shopify-section-group-more-header-sections')
          this.headerGroup.removeAttribute("style")
          this.headerGroupSections = this.headerGroup.querySelectorAll('.shopify-section-group-more-header-sections')
          this.headerGroupSections.forEach(headerGroupSection => headerGroupSection.removeAttribute("style"))
          return
        }
          this.firstOverlappingSection = this.querySelectorAll('main .shopify-section')[0]
          setTimeout(this.makeNavigationTransparent(), 10)
      })

        if (window.innerWidth > 920) this.makeNavigationTransparent()
      
        if (Shopify.designMode) {
          document.addEventListener('shopify:section:load', () => {
            this.firstOverlappingSection = this.querySelectorAll('main .shopify-section')[0]
            this.sectionGroups = this.querySelectorAll('.shopify-section-group-more-header-sections')
            this.querySelectorAll('main .shopify-section')[0] && this.firstOverlappingSection.querySelector('.overlapping-section') ? this.firstSection = true : this.firstSection = false
            this.querySelector('.shopify-section-footer') && this.querySelector('.shopify-section-footer').querySelector('.overlapping-section') ? this.footer = true : this.footer = false
            if (this.footer) {
              this.footerBg = this.querySelector('.shopify-section-footer').querySelector('.overlapping-content-js').dataset.bg
              this.footerColor = this.querySelector('.shopify-section-footer').querySelector('.overlapping-content-js').dataset.color
            }
            this.announcementBar = this.querySelector('.announcement-bar-section')
            if (this.announcementBar) this.announcementBarHeight = this.announcementBar.offsetHeight
            this.makeNavigationTransparent()
          })
          document.addEventListener('shopify:section:reorder', () => {
            this.querySelectorAll('main .shopify-section')[0] && this.querySelectorAll('main .shopify-section')[0].querySelector('.overlapping-section') ? this.firstSection = true : this.firstSection = false
            this.sectionGroups = this.querySelectorAll('.shopify-section-group-more-header-sections')
            if (this.firstSection) {
            this.sectionBg = this.querySelectorAll('main .shopify-section')[0].querySelector('.overlapping-content-js').dataset.bg
            this.sectionColor = this.querySelectorAll('main .shopify-section')[0].querySelector('.overlapping-content-js').dataset.color
            }
            this.sectionContent = this.firstOverlappingSection.querySelectorAll('.overlapping-content-js')
          this.sectionContent.forEach(content => content.style.marginTop = 0) 
            this.firstOverlappingSection.style.marginTop = 0
            this.firstOverlappingSection = this.querySelectorAll('main .shopify-section')[0]
            this.makeNavigationTransparent()
          })
          document.addEventListener('shopify:section:unload', () => {
            setTimeout(() => {
              this.firstOverlappingSection = this.querySelectorAll('main .shopify-section')[0]
              this.sectionGroups = this.querySelectorAll('.shopify-section-group-more-header-sections')
              this.querySelectorAll('main .shopify-section')[0] && this.firstOverlappingSection.querySelector('.overlapping-section') ? this.firstSection = true : this.firstSection = false
              this.querySelector('.shopify-section-footer') && this.querySelector('.shopify-section-footer').querySelector('.overlapping-section') ? this.footer = true : this.footer = false
              this.announcementBar = this.querySelector('.announcement-bar-section')
              if (this.announcementBar) this.announcementBarHeight = this.announcementBar.offsetHeight
              this.makeNavigationTransparent()
            })
          })
        }
        
        document.addEventListener('scroll', () => {
          if (window.innerWidth < 920) return
          this.currentScrollPos = window.scrollY
          if (this.currentScrollPos > 0 && this.lastScrollPos <= this.currentScrollPos){
            this.lastScrollPos = this.currentScrollPos;
            this.scrollDelta = true
          } else {
            this.lastScrollPos = this.currentScrollPos;
            this.scrollDelta = false
          }
          this.firstOverlappingSection = this.querySelectorAll('main .shopify-section')[0]
            this.sidebars = this.querySelectorAll('.transparent-sidebar')
            if (this.header && !this.header.classList.contains('header--disable-sticky') && this.sidebars.length == 0) this.invertHeader()
            if (this.header && !this.header.classList.contains('header--disable-sticky') && this.sidebars.length > 0) this.invertHeaderBetweenSidebars()
            this.invertedElements = this.querySelectorAll('.scroll-color')
            this.invertedElements.forEach(invertedElement => {
              if (!invertedElement.classList.contains('use-own-icon') && this.sidebars.length > 0) this.invertNavigationColor(invertedElement)
            })
        })
  
        this.sidebars.forEach(sidebar => {
          sidebar.addEventListener('scroll', () => {
            if (window.innerWidth < 920) return
            this.firstOverlappingSection = this.querySelectorAll('main .shopify-section')[0]
            this.invertedElements = this.querySelectorAll('.scroll-color')
            this.invertedElements.forEach(invertedElement => {
              if (!invertedElement.classList.contains('use-own-icon')) this.invertNavigationColor(invertedElement)
            })
          })
        }) 
        
    }
  // This function add/remove styles for overlapping sections
    makeNavigationTransparent() {
      if (window.innerWidth < 920) return
      this.classList.remove('loaded')
      let isSelectorSupported = CSS.supports('selector(:has(+ *)')
      this.header = this.querySelector('.transparent-header')
      this.headerGroup = this.querySelector('.header-group')
      this.headerGroup.removeAttribute("style")
      this.headerGroupSections = this.headerGroup.querySelectorAll('.shopify-section-group-more-header-sections')
      this.headerGroupSections.forEach(headerGroupSection => headerGroupSection.removeAttribute("style"))

      if (!this.firstSection && this.header) {
        this.header.classList.remove('transparent')
        this.header.classList.add('colored')
        this.header.setAttribute('style', 'background-color: rgb(var(--layout-background-color));')
        this.header.closest('.shopify-section-header').classList.remove('header--static')
      }
      
      if (this.firstOverlappingSection) this.firstOverlappingSection.style.marginTop = 0
      if (this.querySelectorAll('main .shopify-section')[1]) this.querySelectorAll('main .shopify-section')[1].style.marginTop = 0
      this.firstOverlappingSection && this.firstOverlappingSection.querySelector('.overlapping-section') ? this.firstSection = true : this.firstSection = false
      this.querySelector('.shopify-section-footer') && this.querySelector('.shopify-section-footer').querySelector('.overlapping-section') ? this.footer = true : this.footer = false
      if (this.firstOverlappingSection) this.sectionContent = this.firstOverlappingSection.querySelectorAll('.overlapping-content-js')
      if (this.firstOverlappingSection && !isSelectorSupported) this.sectionContent.forEach(content => content.style.marginTop = 0)   
      this.sidebars = this.querySelectorAll('.transparent-sidebar')
      if (this.firstSection) {
        this.sectionBg = this.firstOverlappingSection.querySelector('.overlapping-content-js').dataset.bg
        this.sectionColor = this.firstOverlappingSection.querySelector('.overlapping-content-js').dataset.color
    }
      if (this.firstOverlappingSection && this.firstOverlappingSection.querySelector('.overlapping-section') && this.firstSection) {
        this.marginTop = this.firstOverlappingSection.offsetTop
        if (this.announcementBar && this.firstOverlappingSection.querySelector('.full-height--desktop') || this.announcementBar && this.firstOverlappingSection.querySelector('.full-height--mobile')) {
          !isSelectorSupported ? this.firstOverlappingSection.setAttribute("style", `--announcement-height: ${this.announcementBarHeight}px; margin-top: -${this.marginTop}px`) : this.firstOverlappingSection.setAttribute("style", `--announcement-height: ${this.announcementBarHeight}px;`)
        } else {
          if (!isSelectorSupported) this.firstOverlappingSection.setAttribute("style", `margin-top: -${this.marginTop}px`)
        }
        this.header ? this.headerHeight = this.querySelector('.header-section').offsetHeight : this.headerHeight = 0
        this.headerGroupSections.length > 0 ? this.headerGroupHeight = this.headerGroup.querySelector('.header-group__sections').offsetHeight : this.headerGroupHeight = 0
        if (this.headerGroupSections.length > 0) {
        this.headerGroup.setAttribute("style", `top: ${this.headerHeight}px; z-index: 5;`)
        this.headerGroupSections.forEach(headerGroupSection => headerGroupSection.setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg}; background-color: transparent;`))
        }
        this.sectionContent = this.firstOverlappingSection.querySelectorAll('.overlapping-section .overlapping-content-js')
        this.sectionContent.forEach(content => content.style.marginTop = this.headerGroupHeight + this.headerHeight + 'px')
      }
      
      if (this.header) {
        if (this.firstSection) {
          if (this.header.classList.contains('secondary-header-section')) this.header.classList.remove('colored')
          this.header.classList.add('transparent')
          this.sidebars.length > 0 ? this.invertHeaderBetweenSidebars() : this.invertHeader()
        }
      }
      
      if (this.sidebars.length > 0) {
        this.invertedElements = this.querySelectorAll('.scroll-color')
        this.invertedElements.forEach(invertedElement => {
          if (!invertedElement.classList.contains('use-own-icon')) this.invertNavigationColor(invertedElement)
        })
      }
      this.classList.add('loaded')
    }

  
    // Invert any element in header or sidebar if it has 'scroll-color' class
    invertNavigationColor(invertedElement) {  
      let firstOverlappingSectionIsVisible = elemInViewport(this.firstOverlappingSection)
      let footerIsVisible = elemInViewport(this.querySelector('.shopify-section-footer'))
      // if (!firstOverlappingSectionIsVisible && !footerIsVisible) return
      this.firstOverlappingSection && this.firstOverlappingSection.querySelector('.overlapping-section') ? this.firstSection = true : this.firstSection = false
      this.querySelector('.shopify-section-footer') && this.querySelector('.shopify-section-footer').querySelector('.overlapping-section') ? this.footer = true : this.footer = false
      if (this.firstSection) {
        this.sectionBg = this.firstOverlappingSection.querySelector('.overlapping-content-js').dataset.bg
        this.sectionColor = this.firstOverlappingSection.querySelector('.overlapping-content-js').dataset.color
      }
      if (invertedElement.classList.contains('global-text') && !invertedElement.closest('#shopify-section-header')) invertedElement.classList.remove('global-text')
      if (!this.firstSection && !invertedElement.closest('#shopify-section-header')) invertedElement.classList.add('global-text')
      this.invertedElementPos = invertedElement.getBoundingClientRect()
      if (this.footer) this.footerContent = this.querySelector('.shopify-section-footer').querySelector('.overlapping-container-js').getBoundingClientRect()
      if (this.firstSection) this.sectionContent = this.firstOverlappingSection.querySelector('.overlapping-container-js').getBoundingClientRect()
      this.themeTop = this.querySelector('.theme-content').getBoundingClientRect().top
      if (window.scrollY == 0 && !invertedElement.closest('#shopify-section-header')) {
        if (this.firstSection && this.invertedElementPos.top > this.themeTop && this.invertedElementPos.bottom < this.sectionContent.bottom) {
          invertedElement.classList.remove('global-text')
          invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor} `)
          if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg}`)
          if (this.firstSection && this.firstOverlappingSection.querySelector('.no-default-color') && invertedElement.classList.contains('block__button')) {
            invertedElement.classList.add('hover-invert')
            invertedElement.setAttribute("style", `--accent-button-color: ${this.sectionColor}; --base-button-color: ${this.sectionBg};`)
          }
        } else {
          if (!invertedElement.classList.contains('global-text')) invertedElement.classList.add('global-text')
          if (invertedElement.classList.contains('hover-invert')) invertedElement.classList.remove('hover-invert')
          invertedElement.removeAttribute('style')
        }
      } else if (this.scrollDelta && !invertedElement.closest('#shopify-section-header')) {
        if (this.footer && this.firstSection) {
          if (this.invertedElementPos.top > this.themeTop && this.invertedElementPos.top < this.footerContent.top &&  this.invertedElementPos.bottom < this.sectionContent.bottom) {
            invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor} `)
            if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg}; `)
            if (this.firstSection && this.firstOverlappingSection.querySelector('.no-default-color') && invertedElement.classList.contains('block__button'))  {
              invertedElement.classList.add('hover-invert')
              invertedElement.setAttribute("style", `--accent-button-color: ${this.sectionColor}; --base-button-color: ${this.sectionBg};`)
            }
          }
          else if (this.invertedElementPos.bottom > this.footerContent.top) {
            invertedElement.setAttribute("style", `--layout-text-color: ${this.footerColor} `)
            if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.footerColor}; --layout-background-color: ${this.footerBg}; `)
            if (this.querySelector('.shopify-section-footer .no-default-color') && invertedElement.classList.contains('block__button')) {
              invertedElement.classList.add('hover-invert')
              invertedElement.setAttribute("style", `--accent-button-color: ${this.footerColor}; --base-button-color: ${this.footerBg};`)
            }
          }
          else if (this.invertedElementPos.top < this.footerContent.top && this.invertedElementPos.bottom > this.sectionContent.bottom) {
            invertedElement.classList.add('global-text')
            invertedElement.removeAttribute('style')
            if (invertedElement.classList.contains('hover-invert')) invertedElement.classList.remove('hover-invert')
          }
        } else if (!this.footer && this.firstSection) {
          if (this.invertedElementPos.top > this.themeTop && this.invertedElementPos.bottom < this.sectionContent.bottom) {
            invertedElement.classList.remove('global-text')
            invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor} `)
            if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg}`)
            if (this.firstSection && this.firstOverlappingSection.querySelector('.no-default-color') && invertedElement.classList.contains('block__button')) {
              invertedElement.classList.add('hover-invert')
              invertedElement.setAttribute("style", `--accent-button-color: ${this.sectionColor}; --base-button-color: ${this.sectionBg};`)
            }
          } else {
            if (!invertedElement.classList.contains('global-text')) invertedElement.classList.add('global-text')
            invertedElement.removeAttribute('style')
            if (invertedElement.classList.contains('hover-invert')) invertedElement.classList.remove('hover-invert')
          }
        } else if (this.footer && !this.firstSection) {
          if (this.invertedElementPos.bottom > this.footerContent.top) {
            invertedElement.classList.remove('global-text')
            invertedElement.setAttribute("style", `--layout-text-color: ${this.footerColor} `)
            if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.footerColor}; --layout-background-color: ${this.footerBg}`)
            if (this.querySelector('.shopify-section-footer .no-default-color') && invertedElement.classList.contains('block__button')) {
              invertedElement.classList.add('hover-invert')
              invertedElement.setAttribute("style", `--accent-button-color: ${this.footerColor}; --base-button-color: ${this.footerBg};`)
            }
          }
        }
     } else if (!this.scrollDelta && !invertedElement.closest('#shopify-section-header')) {
      if (this.footer && this.firstSection) {
        if (this.invertedElementPos.top > this.themeTop && this.invertedElementPos.top < this.footerContent.top &&  this.invertedElementPos.top < this.sectionContent.bottom) {
          invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor} `)
          if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg};`)
          if (this.firstSection && this.firstOverlappingSection.querySelector('.no-default-color') && invertedElement.classList.contains('block__button')) {
            invertedElement.classList.add('hover-invert')
            invertedElement.setAttribute("style", `--accent-button-color: ${this.sectionColor}; --base-button-color: ${this.sectionBg};`)
          }
        }
        else if (this.invertedElementPos.top > this.footerContent.top) {
          invertedElement.setAttribute("style", `--layout-text-color: ${this.footerColor} `)
          if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.footerColor}; --layout-background-color: ${this.footerBg};`)
          if (this.querySelector('.shopify-section-footer .no-default-color') && invertedElement.classList.contains('block__button')) {
            invertedElement.classList.add('hover-invert')
            invertedElement.setAttribute("style", `--accent-button-color: ${this.footerColor}; --base-button-color: ${this.footerBg};`)
          }
        }
        else if (this.invertedElementPos.top < this.footerContent.top && this.invertedElementPos.top > this.sectionContent.bottom) {
          invertedElement.removeAttribute("style")
          if (!invertedElement.classList.contains('global-text')) invertedElement.classList.add('global-text')
          if (invertedElement.classList.contains('hover-invert')) invertedElement.classList.remove('hover-invert')
        }
      } else if (!this.footer && this.firstSection) {
        if (this.invertedElementPos.top > this.themeTop && this.invertedElementPos.top < this.sectionContent.bottom) {
          invertedElement.classList.remove('global-text')
          if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg};`)
          if (this.firstSection && this.firstOverlappingSection.querySelector('.no-default-color') && invertedElement.classList.contains('block__button')) {
            invertedElement.classList.add('hover-invert')
            invertedElement.setAttribute("style", `--accent-button-color: ${this.sectionColor}; --base-button-color: ${this.sectionBg};`)
          }

        } else {
          if (!invertedElement.classList.contains('global-text')) invertedElement.classList.add('global-text')
          invertedElement.removeAttribute('style')
          if (invertedElement.classList.contains('hover-invert')) invertedElement.classList.remove('hover-invert')
        }
      } else if (this.footer && !this.firstSection) {
        if (this.invertedElementPos.top > this.footerContent.top) {
          invertedElement.classList.remove('global-text')
          invertedElement.setAttribute("style", `--layout-text-color: ${this.footerColor} `)
          if (invertedElement.classList.contains('burger-menu')) invertedElement.setAttribute("style", `--layout-text-color: ${this.footerColor}; --layout-background-color: ${this.footerBg};`)
          if (this.querySelector('.shopify-section-footer .no-default-color') && invertedElement.classList.contains('block__button')) {
            invertedElement.classList.add('hover-invert')
            invertedElement.setAttribute("style", `--accent-button-color: ${this.footerColor}; --base-button-color: ${this.footerBg};`)
          }
        }
      }
     }
    }
    //Invert header without sidebars
    invertHeader() {
      this.firstOverlappingSection && this.firstOverlappingSection.querySelector('.overlapping-section') ? this.firstSection = true : this.firstSection = false
      this.querySelector('.shopify-section-footer') && this.querySelector('.shopify-section-footer').querySelector('.overlapping-section') ? this.footer = true : this.footer = false
      if (!this.firstSection) return
      if (!this.firstSection) {
        this.header.removeAttribute("style")
        this.header.classList.replace('transparent', 'colored')
      }
      if (this.firstSection) {
        this.sectionBg = this.firstOverlappingSection.querySelector('.overlapping-content-js').dataset.bg
        this.sectionColor = this.firstOverlappingSection.querySelector('.overlapping-content-js').dataset.color
      }
      if (this.firstSection && this.header && !this.header.closest('.shopify-section-header-sticky')) this.header.setAttribute('style', `--layout-text-color: ${this.sectionColor}`)
      if (this.header.querySelector('.header--sticky') && this.header.getBoundingClientRect().top < 0) {
        this.header.removeAttribute("style")
        this.header.classList.replace('transparent', 'colored')
      } 
      if (this.header.closest('.shopify-section-header-sticky')) {
        this.header.removeAttribute("style")
        this.header.classList.replace('transparent', 'colored')
      } 
      this.invertedElements = this.header.querySelectorAll('.scroll-color')
      if (this.invertedElements.length > 0) this.invertedElements.forEach(invertedElement => {
        invertedElement.classList.remove('global-text')
        if (this.header.classList.contains('colored')) {
          invertedElement.classList.add('global-text')
        }
      })
      setTimeout(() => {
        if (this.header.querySelector('.burger-menu') && !this.header.closest('.shopify-section-header-sticky') && this.header.getBoundingClientRect().top > 0) this.header.querySelector('.burger-menu').setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg};`)
        if (this.header.querySelectorAll('.block__button').length > 0 && !this.header.closest('.shopify-section-header-sticky') && this.header.getBoundingClientRect().top > 0) this.header.querySelectorAll('.block__button').forEach(button => {
          button.classList.add('hover-invert')
          button.setAttribute("style", `--accent-button-color: ${this.sectionColor}; --base-button-color: ${this.sectionBg};`)
        })
      }, 10)
      if (this.header.querySelector('.burger-menu') && this.header.closest('.shopify-section-header-sticky') || this.header.querySelector('.burger-menu') && this.header.querySelector('.header--sticky') && this.header.getBoundingClientRect().top < 0) this.header.querySelector('.burger-menu').removeAttribute('style')
      if (this.header.querySelectorAll('.block__button').length > 0 && this.header.closest('.shopify-section-header-sticky') || this.header.querySelectorAll('.block__button').length > 0 && this.header.querySelector('.header--sticky') && this.header.getBoundingClientRect().top < 0) this.header.querySelectorAll('.block__button').forEach(button => {
        button.classList.add('hover-invert')
        button.removeAttribute("style")
      })
      setTimeout(() => {
        if (this.firstSection && this.header.closest('.shopify-section-header:not(.shopify-section-header-sticky)') && !this.header.querySelector('.header--sticky')) {
          this.header.setAttribute("style", `--layout-text-color: ${this.sectionColor} `)
          this.header.classList.replace('colored', 'transparent')
        }
        if (this.header.querySelector('.header--sticky') && this.header.getBoundingClientRect().top >= 0) this.header.classList.replace('colored', 'transparent')
      }, 10)
    }
  
    // Invert header if we have at least one sidebar
    invertHeaderBetweenSidebars() {
      this.firstOverlappingSection && this.firstOverlappingSection.querySelector('.overlapping-section') ? this.firstSection = true : this.firstSection = false
      this.querySelector('.shopify-section-footer') && this.querySelector('.shopify-section-footer').querySelector('.overlapping-section') ? this.footer = true : this.footer = false
      if (!this.firstSection && !this.footer) return
      if (!this.firstSection) {
        this.header.removeAttribute("style")
        this.header.classList.replace('transparent', 'colored')
      }
      if (this.firstSection) {
        this.sectionBg = this.firstOverlappingSection.querySelector('.overlapping-content-js').dataset.bg
        this.sectionColor = this.firstOverlappingSection.querySelector('.overlapping-content-js').dataset.color
      }
      if (this.firstSection) this.header.setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg}`)
      
      if (this.header.querySelector('.header--disable-sticky')) return
      if (this.firstSection && this.header && !this.header.closest('.shopify-section-header-sticky:not(.header--static)')) this.header.setAttribute('style', `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg}`)
      this.header.closest('.shopify-section-header').classList.remove('header--static') 
      this.headerContainer = this.header.closest('.shopify-section-header')
      if (this.firstSection) this.sectionContent = this.firstOverlappingSection.querySelector('.overlapping-container-js').getBoundingClientRect()
      this.footerTop =  document.documentElement.offsetHeight - this.querySelector('.shopify-section-footer').getBoundingClientRect().height
      if (this.firstSection) this.sectionBottom = this.sectionContent.height
      if (this.firstSection && this.sectionContent.bottom + 700 > 0 || this.footerTop < window.pageYOffset + 700) this.headerContainer.classList.add('header--static')
      !this.headerContainer.classList.contains('header--static') ? this.headerContainer.classList.add('sticky') : this.headerContainer.classList.remove('sticky')
      if (this.firstSection && !this.header.classList.contains('transparent')) this.header.classList.replace('colored', 'transparent')
      if (this.sectionContent.bottom > window.pageYOffset || this.sectionContent.top == window.pageYOffset - 700) return
      if (this.header.querySelector('.header--sticky') && this.header.getBoundingClientRect().top < 0) {
        this.header.removeAttribute("style")
        this.header.classList.replace('transparent', 'colored')
      } 
      if (this.header.closest('.shopify-section-header-sticky')) {
        this.header.removeAttribute("style")
      } 
      if (this.firstSection && this.header.querySelector('.burger-menu') && !this.header.closest('.shopify-section-header-sticky') && this.header.getBoundingClientRect().top > 0) this.header.querySelector('.burger-menu').setAttribute("style", `--layout-text-color: ${this.sectionColor}; --layout-background-color: ${this.sectionBg};`)
  
      if (this.firstSection && this.header.querySelector('.burger-menu') && this.header.closest('.shopify-section-header-sticky') || this.header.querySelector('.burger-menu') && this.header.querySelector('.header--sticky') && this.header.getBoundingClientRect().top < 0) this.header.querySelector('.burger-menu').removeAttribute('style')
      setTimeout(() => {
        if (this.firstSection && this.header.closest('.shopify-section-header:not(.shopify-section-header-sticky)') && !this.header.querySelector('.header--sticky')) this.header.setAttribute("style", `--layout-text-color: ${this.sectionColor} `)
      }, 50)
      if (this.header.querySelector('.header--sticky') && this.header.getBoundingClientRect().top >= 0) this.header.classList.replace('colored', 'transparent')
    }
  }
  customElements.define('overlap-navigation', OverlapNavigation);