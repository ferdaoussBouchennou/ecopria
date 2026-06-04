import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-section',
  standalone: true,
  template: `
    <section class="admin-page">
      <p class="admin-eyebrow"><span class="eyebrow-line"></span> {{ eyebrow }}</p>
      <h1 class="admin-page__title">{{ title }}</h1>
      <p class="admin-placeholder">{{ message }}</p>
    </section>
  `,
  styleUrl: './_admin-shared.scss',
})
export class AdminSectionComponent implements OnInit {
  eyebrow = '';
  title = '';
  message = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.eyebrow = String(data['eyebrow'] ?? '');
    this.title = String(data['title'] ?? '');
    this.message = String(data['message'] ?? '');
  }
}
