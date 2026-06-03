import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-configurations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-configurations.component.html',
  styleUrl: './admin-configurations.component.scss',
})
export class AdminConfigurationsComponent {}

