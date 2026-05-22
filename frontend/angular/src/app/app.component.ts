import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected readonly sections = [
    { label: 'Radar Local', route: '/radar', description: 'Top de la zona y pastel de géneros' },
    { label: 'Calculadora de Booking', route: '/booking', description: 'Top 5 ROI y mapa de puntos calientes' }
  ];
}
