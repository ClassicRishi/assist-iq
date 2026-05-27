import { Component, signal } from '@angular/core';

type AuthModal = 'login' | 'register' | null;

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
})
export class App {
  activeAuthModal = signal<AuthModal>(null);

  openLogin(): void {
    this.activeAuthModal.set('login');
  }

  openRegister(): void {
    this.activeAuthModal.set('register');
  }

  closeAuthModal(): void {
    this.activeAuthModal.set(null);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeAuthModal();
    }
  }
}
