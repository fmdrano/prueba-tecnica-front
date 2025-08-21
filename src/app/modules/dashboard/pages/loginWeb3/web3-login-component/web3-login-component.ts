import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
//import { Web3Service } from '../../../../shared/service/web3/web3-service';
import { Web3Service, WalletInfo } from '../../../../../shared/service/web3/web3-service';

@Component({
  selector: 'app-web3-login-component',
  standalone: false,
  templateUrl: './web3-login-component.html',
  styleUrl: './web3-login-component.css'
})
export class Web3LoginComponent  implements OnInit, OnDestroy {
walletInfo: WalletInfo | null = null;
  isConnecting = false;
  errorMessage = '';
  
  private walletSubscription?: Subscription;

  constructor(private web3Service: Web3Service) {}

  ngOnInit(): void {
    this.walletSubscription = this.web3Service.wallet$.subscribe({
      next: (info) => {
        this.walletInfo = info;
        this.isConnecting = false;
        this.errorMessage = '';
      },
      error: (error) => {
        console.error('Error en wallet subscription:', error);
        this.isConnecting = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
  }

  async connectWallet(): Promise<void> {
    this.isConnecting = true;
    this.errorMessage = '';
    
    try {
      await this.web3Service.connectWallet();
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al conectar wallet';
      this.isConnecting = false;
    }
  }

  disconnectWallet(): void {
    this.web3Service.disconnectWallet();
  }

  formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  formatBalance(balance: string): string {
    const num = parseFloat(balance);
    return num.toFixed(4);
  }

  async copyAddress(): Promise<void> {
    if (this.walletInfo?.address) {
      try {
        await navigator.clipboard.writeText(this.walletInfo.address);
        // Aquí podrías mostrar un toast o mensaje de confirmación
        console.log('Dirección copiada al portapapeles');
      } catch (error) {
        console.error('Error al copiar dirección:', error);
      }
    }
  }

  async refreshBalance(): Promise<void> {
    try {
      const newBalance = await this.web3Service.getCurrentBalance();
      if (this.walletInfo) {
        this.walletInfo = { ...this.walletInfo, balance: newBalance };
      }
    } catch (error) {
      console.error('Error al actualizar balance:', error);
    }
  }

  viewOnEtherscan(): void {
    if (this.walletInfo?.address) {
      window.open(`https://etherscan.io/address/${this.walletInfo.address}`, '_blank');
    }
  }
}