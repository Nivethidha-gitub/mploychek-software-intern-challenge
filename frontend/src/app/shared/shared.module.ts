import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StatusBadgeComponent } from './components/status-badge.component';
import { ApiActivityComponent } from './components/api-activity.component';

@NgModule({
  declarations: [StatusBadgeComponent, ApiActivityComponent],
  imports: [CommonModule],
  exports: [CommonModule, ReactiveFormsModule, StatusBadgeComponent, ApiActivityComponent]
})
export class SharedModule {}
