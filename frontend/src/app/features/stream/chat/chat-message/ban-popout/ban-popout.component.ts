import {Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2} from '@angular/core';
import {NgIf, NgStyle} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-ban-popout',
  imports: [
    FormsModule,
    NgStyle,
    NgIf
  ],
  templateUrl: './ban-popout.component.html',
  styleUrl: './ban-popout.component.css',
  standalone: true
})
export class BanPopoutComponent implements OnInit{
  @Input() position: { top: number; left: number } | null = null;
  @Input() isVisible: boolean = false;
  @Output() ban: EventEmitter<{ minutes: number, reason: string }> = new EventEmitter();

  minutes = 0
  reason = ""

  @Output() visibilityChange: EventEmitter<boolean> = new EventEmitter();


  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (this.isVisible && !this.elementRef.nativeElement.contains(event.target)) {
        this.visibilityChange.emit(false);
      }
    });
  }

  onBan() {
    this.ban.emit({minutes: this.minutes*60, reason: this.reason})
    this.visibilityChange.emit(false);
  }

}
