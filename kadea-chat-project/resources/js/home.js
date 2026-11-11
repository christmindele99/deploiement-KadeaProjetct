document.addEventListener('DOMContentLoaded', () => {
  const yearElement = document.getElementById('currentYear')

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear()
  }

  const revealElements = document.querySelectorAll('.reveal')

  // Respecter les préférences de réduction des animations
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealElements.forEach((element) => {
      element.classList.add('active')
    })

    return
  }

  // Observer les éléments visibles à l'écran
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    // Observer chaque section
    revealElements.forEach((element) => {
      observer.observe(element)
    })
  } else {
    // Solution de secours pour les navigateurs sans IntersectionObserver
    revealElements.forEach((element) => {
      element.classList.add('active')
    })
  }
})
