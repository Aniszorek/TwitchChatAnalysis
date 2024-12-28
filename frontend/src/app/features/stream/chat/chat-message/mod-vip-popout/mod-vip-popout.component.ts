import {Component, DestroyRef, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2} from '@angular/core';
import {NgIf, NgStyle} from '@angular/common';

@Component({
  selector: 'app-mod-vip-popout',
  imports: [NgIf, NgStyle],
  templateUrl: './mod-vip-popout.component.html',
  styleUrl: './mod-vip-popout.component.css',
  standalone: true
})
export class ModVipPopoutComponent implements OnInit{
  @Input() isVisible: boolean = false;
  @Input() position: { top: number; left: number } | null = null;
  @Input() above: boolean = false;
  @Output() vip: EventEmitter<boolean> = new EventEmitter();
  @Output() mod: EventEmitter<boolean> = new EventEmitter();
  @Output() visibilityChange: EventEmitter<boolean> = new EventEmitter();


  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (this.isVisible && !this.elementRef.nativeElement.contains(event.target)) {
        this.visibilityChange.emit(false);
      }
    });
  }

  onVip() {
    this.vip.emit(true);
    this.visibilityChange.emit(false);
  }

  onMod() {
    this.mod.emit(true);
    this.visibilityChange.emit(false);
  }
}
