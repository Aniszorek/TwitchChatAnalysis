import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {ModVipPopoutComponent} from '../mod-vip-popout/mod-vip-popout.component';
import {BanPopoutComponent} from '../ban-popout/ban-popout.component';
import {MatTooltip} from '@angular/material/tooltip';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-mod-action-buttons',
  imports: [
    MatIcon,
    ModVipPopoutComponent,
    BanPopoutComponent,
    MatTooltip,
    NgIf
  ],
  templateUrl: './mod-action-buttons.component.html',
  styleUrl: './mod-action-buttons.component.css',
  standalone: true
})
export class ModActionButtonsComponent implements OnChanges{
  @Input() showButtons: boolean = false;
  showVipMenu: boolean = false;
  showBanMenu: boolean = false;
  vipMenuPosition: { top: number; left: number } = {top: 0, left: 0};
  banMenuPosition: { top: number; left: number } = {top: 0, left: 0};

  @Output() removed = new EventEmitter();
  @Output() addVip = new EventEmitter();
  @Output() addMod = new EventEmitter();
  @Output() ban = new EventEmitter<{ minutes: number, reason: string }>();
  @Output() popoutOpen= new EventEmitter<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showButtons']) { // closes popup menus after hiding buttons
      this.showBanMenu = false;
      this.showVipMenu = false;
    }
  }

  toggleVipMenu(): void {
    this.showVipMenu = !this.showVipMenu;
    if (this.showVipMenu) {
      this.showBanMenu = false;
    }
    this.emitPopoutOpenState()
  }

  toggleBanMenu(event: MouseEvent): void {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();

    this.banMenuPosition = {
      top: buttonRect.bottom + 6,
      left: buttonRect.right,
    };

    this.showBanMenu = !this.showBanMenu;

    if (this.showBanMenu) {
      this.showVipMenu = false;
    }
    this.emitPopoutOpenState()
  }

  protected removeMessage(): void {
    this.removed.emit();
  }

  protected onBanUser({minutes, reason}: { minutes: number, reason: string }): void {
    this.ban.emit({
      minutes: minutes > 0 ? minutes : 0,
      reason: reason
    });
  }

  protected onVip(): void {
    this.addVip.emit();
  }

  protected onMod(): void {
    this.addMod.emit();
  }

  protected calculateVipMenuPosition(event: MouseEvent): void {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
    this.vipMenuPosition = {
      top: buttonRect.bottom + 6,
      left: buttonRect.left + buttonRect.width / 2
    };
    this.toggleVipMenu();
  }

  handleVipVisibilityChange(open: boolean): void {
    if (!open) {
      this.showVipMenu = false;
    }
    this.emitPopoutOpenState()
  }

  handleBanVisibilityChange(open: boolean): void {
    if (!open) {
      this.showBanMenu = false;
    }
    this.emitPopoutOpenState()
  }

  emitPopoutOpenState(){
    this.popoutOpen.emit(this.showVipMenu || this.showBanMenu)
  }
}
