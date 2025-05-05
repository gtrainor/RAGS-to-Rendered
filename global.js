
  // global.js
document.addEventListener("DOMContentLoaded", () => {
    const nav = document.createElement("nav");
    const links = [
      { name: "Home", path: "/" },
      { name: "First", path: "/first/" },
      { name: "Second", path: "/second/" },
      { name: "Third", path: "/third/" },
      { name: "Fourth", path: "/fourth/" },
      { name: "Fifth", path: "/fifth/" }
    ];
  
    nav.innerHTML = links.map(link => {
      const isActive = window.location.pathname === link.path;
      return `<a href="${link.path}" class="${isActive ? 'active' : ''}">${link.name}</a>`;
    }).join("");
  
    document.body.prepend(nav);
  });
  