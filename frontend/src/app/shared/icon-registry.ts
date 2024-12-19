import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export function registerIcons(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
  const icons = [
    { name: 'info', url: 'assets/icons/Info.svg' },
    { name: 'ban', url: 'assets/icons/Block.svg' },
    { name: 'unban', url: 'assets/icons/X.svg' },
    { name: 'logo-transparent', url: 'assets/icons/LOGO/TRANSPARENT/logo_transparent.svg' },
    { name: 'logo-grey', url: 'assets/icons/LOGO/A6A6A6/logo_A6A6A6.svg' },
    { name: 'logo-grey2', url: 'assets/icons/LOGO/D9D9D9/logo_D9D9D9.svg' },
    { name: 'logo-white', url: 'assets/icons/LOGO/FFFFFF/logo_FFFFFF.svg' },
    { name: 'arrow-up', url: 'assets/icons/ArrowUp.svg' },
    { name: 'clock', url: 'assets/icons/Clock.svg' },
    { name: 'crown', url: 'assets/icons/Crown.svg' },
    { name: 'dropdown', url: 'assets/icons/Dropdown.svg' },
    { name: 'edit', url: 'assets/icons/Edit.svg' },
    { name: 'search', url: 'assets/icons/Search.svg' },
    { name: 'settings', url: 'assets/icons/Settings.svg' },
    { name: 'trash', url: 'assets/icons/Trash.svg' },
  ];

  icons.forEach(icon => {
    matIconRegistry.addSvgIcon(
      icon.name,
      domSanitizer.bypassSecurityTrustResourceUrl(icon.url)
    );
  });
}
