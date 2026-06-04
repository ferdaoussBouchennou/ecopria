import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-compte-en-attente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './compte-en-attente.component.html',
  styleUrl: './compte-en-attente.component.scss',
})
export class CompteEnAttenteComponent {
  email = '';

  constructor(private route: ActivatedRoute) {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }
}
