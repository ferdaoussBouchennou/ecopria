import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-moderation.component.html',
  styleUrl: './admin-moderation.component.scss',
})
export class AdminModerationComponent {}

