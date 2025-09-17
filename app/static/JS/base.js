const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('mobile-open');
    const icon = mobileMenuToggle.querySelector('.material-symbols-outlined');
    icon.textContent = navMenu.classList.contains('mobile-open') ? 'close' : 'menu';
});