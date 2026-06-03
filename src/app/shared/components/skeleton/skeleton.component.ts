import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<span class="skeleton" [style.width]="width" [style.height]="height" [style.borderRadius]="radius"></span>`,
  styleUrls: ['./skeleton.component.scss'],
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1em';
  @Input() radius = '4px';
}
