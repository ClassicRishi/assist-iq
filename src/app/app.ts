import { Component, signal } from '@angular/core';

type AuthModal = 'login' | 'register' | null;

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
})
export class App {
  activeAuthModal = signal<AuthModal>(null);
  locationLoading = signal(false);
  locationMessage = signal<string | null>(null);

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

  private formatLocation(data: any): string {
    const city =
      data.city ||
      data.locality ||
      data.localityInfo?.administrative?.[2]?.name ||
      data.localityInfo?.informative?.[0]?.name;
    const state = data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name;
    const country = data.countryName;

    return [city, state, country].filter(Boolean).join(', ');
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );

    if (!response.ok) {
      throw new Error('reverse-geocode-failed');
    }

    const data = await response.json();
    const address = this.formatLocation(data);

    if (!address) {
      throw new Error('address-not-found');
    }

    return address;
  }

  detectRegisterLocation(): void {
    if (!navigator.geolocation) {
      this.locationMessage.set('Geolocation is not supported by this browser.');
      return;
    }

    this.locationLoading.set(true);
    this.locationMessage.set('Fetching your location…');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const fallbackLocation = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        let locationText = fallbackLocation;

        try {
          locationText = await this.reverseGeocode(latitude, longitude);
        } catch {
          // Keep coordinate fallback if address lookup fails.
        }

        const input = document.getElementById('registerLocation') as HTMLInputElement | null;
        if (input) {
          input.value = locationText;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        this.locationMessage.set(
          locationText === fallbackLocation
            ? 'Location detected (coordinates used as fallback).'
            : 'Address detected successfully.',
        );
        this.locationLoading.set(false);
      },
      (error) => {
        const messages: Record<number, string> = {
          1: 'Permission denied. Allow location access to auto-fill.',
          2: 'Location unavailable. Enter your city manually.',
          3: 'Request timed out. Try again.',
        };
        this.locationMessage.set(messages[error.code] ?? 'Could not fetch location.');
        this.locationLoading.set(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }
}
