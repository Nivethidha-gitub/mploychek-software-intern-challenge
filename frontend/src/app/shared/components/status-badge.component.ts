import { Component, Input } from '@angular/core';
@Component({ selector: 'app-badge', template: `<span class="badge" [attr.data-s]="value">{{ value }}</span>` })
export class StatusBadgeComponent { @Input() value = ''; }
